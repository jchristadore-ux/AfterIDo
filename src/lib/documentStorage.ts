import type { StoredDocument } from '@/types';

/**
 * Document vault storage.
 *
 * A marriage certificate, a passport scan and a Social Security card together
 * are everything an identity thief needs. So this build makes a deliberate
 * choice: **uploaded file bytes are never written to disk.**
 *
 * `SessionOnlyStore` keeps the bytes in a module-level Map for the lifetime of
 * the tab. Reload the page and they are gone; only the metadata (file name,
 * size, what it is used for) survives in localStorage. The UI says so plainly
 * rather than implying a security guarantee it cannot make in a browser.
 *
 * ── Where the real integration goes ───────────────────────────────────────
 * Production implements `DocumentStore` against a server:
 *   • client requests a short-lived, single-use signed upload URL
 *   • bytes go straight to object storage, encrypted at rest with a
 *     per-tenant KMS key, never through the app server
 *   • downloads issue signed URLs that expire in minutes
 *   • every access is written to an audit log
 *   • file names are treated as untrusted input and never interpolated
 * Nothing else in the app changes — every caller goes through this interface.
 */

export interface DocumentStore {
  put(id: string, file: File): Promise<void>;
  /** An object URL for previewing, or null if the bytes are gone. */
  getObjectUrl(id: string): string | null;
  has(id: string): boolean;
  remove(id: string): void;
}

class SessionOnlyStore implements DocumentStore {
  private blobs = new Map<string, Blob>();
  private urls = new Map<string, string>();

  async put(id: string, file: File): Promise<void> {
    this.blobs.set(id, file.slice(0, file.size, file.type));
  }

  getObjectUrl(id: string): string | null {
    const blob = this.blobs.get(id);
    if (!blob) return null;
    let url = this.urls.get(id);
    if (!url) {
      url = URL.createObjectURL(blob);
      this.urls.set(id, url);
    }
    return url;
  }

  has(id: string): boolean {
    return this.blobs.has(id);
  }

  remove(id: string): void {
    const url = this.urls.get(id);
    if (url) URL.revokeObjectURL(url);
    this.urls.delete(id);
    this.blobs.delete(id);
  }
}

export const documentStore: DocumentStore = new SessionOnlyStore();

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

export const ACCEPTED_TYPES = [
  'application/pdf',
  'image/jpeg',
  'image/png',
  'image/heic',
  'image/webp',
];

export interface UploadRejection {
  reason: string;
}

export function validateUpload(file: File): UploadRejection | null {
  if (file.size > MAX_UPLOAD_BYTES) {
    return { reason: 'That file is larger than 15 MB. Try a photo instead of a scan.' };
  }
  // Some browsers report an empty type for HEIC; fall back to the extension.
  const extOk = /\.(pdf|jpe?g|png|heic|webp)$/i.test(file.name);
  if (file.type && !ACCEPTED_TYPES.includes(file.type) && !extOk) {
    return { reason: 'Please upload a PDF or a photo (JPG, PNG, HEIC).' };
  }
  return null;
}

/** File names come from the user's device — never render one unescaped. */
export function safeFileName(name: string): string {
  // Strip control characters and path/markup metacharacters, keep the rest.
  return name.replace(/[\u0000-\u001f<>:"\/\\|?*]/g, '').trim().slice(0, 120) || 'document';
}

export function newDocumentId(): string {
  return `doc_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
}

export function describeRetention(doc: StoredDocument): string {
  return doc.availableInSession
    ? 'Stored in this browser tab only'
    : 'File closed — details kept, file not retained';
}
