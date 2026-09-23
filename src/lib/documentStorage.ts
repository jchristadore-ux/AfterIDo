import * as api from '@/lib/api';
import type { StoredDocument } from '@/types';

/**
 * Document vault storage.
 *
 * A marriage certificate, a passport scan and a Social Security card together
 * are everything an identity thief needs.
 *
 * ── Guests / documents capability off ─────────────────────────────────────
 * `SessionOnlyStore` keeps bytes in a module-level Map for the lifetime of the
 * tab. Reload and they are gone; only metadata survives in the plan.
 *
 * ── Signed-in Premium when `/api/config.documents` is true ─────────────────
 * `RemoteDocumentStore` uploads through the Worker (`POST /api/documents`) into
 * Cloudflare R2 under `{userId}/{docId}`. R2 encrypts at rest by default. The
 * Worker checks session + Premium and never returns another user's object.
 * Session cache still holds bytes for instant preview in the current tab.
 */

export interface DocumentPutMeta {
  kindId: string;
}

export interface DocumentStore {
  put(id: string, file: File, meta?: DocumentPutMeta): Promise<void>;
  /** An object URL for previewing, or null if the bytes are gone / not yet fetched. */
  getObjectUrl(id: string): string | null;
  /** Fetch remote bytes into the session cache when needed. */
  ensureLocal?(id: string): Promise<string | null>;
  has(id: string): boolean;
  remove(id: string): void | Promise<void>;
}

class SessionOnlyStore implements DocumentStore {
  private blobs = new Map<string, Blob>();
  private urls = new Map<string, string>();

  async put(id: string, file: File, _meta?: DocumentPutMeta): Promise<void> {
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

/**
 * Worker-mediated R2 vault. Uploads go to `/api/documents`; downloads come back
 * the same way. A session Map mirrors bytes for preview until the tab closes.
 */
class RemoteDocumentStore implements DocumentStore {
  private local = new SessionOnlyStore();

  async put(id: string, file: File, meta?: DocumentPutMeta): Promise<void> {
    if (!meta?.kindId) throw new Error('kindId required for remote upload');
    await api.uploadDocument({ id, kindId: meta.kindId, file });
    await this.local.put(id, file);
  }

  getObjectUrl(id: string): string | null {
    return this.local.getObjectUrl(id);
  }

  async ensureLocal(id: string): Promise<string | null> {
    if (this.local.has(id)) return this.local.getObjectUrl(id);
    const blob = await api.fetchDocumentBlob(id);
    const file = new File([blob], 'document', { type: blob.type || 'application/octet-stream' });
    await this.local.put(id, file);
    return this.local.getObjectUrl(id);
  }

  has(id: string): boolean {
    return this.local.has(id);
  }

  async remove(id: string): Promise<void> {
    try {
      await api.deleteRemoteDocument(id);
    } catch {
      // Still drop the local cache; plan metadata removal is the caller's job.
    }
    this.local.remove(id);
  }
}

export const sessionDocumentStore: DocumentStore = new SessionOnlyStore();
export const remoteDocumentStore: DocumentStore = new RemoteDocumentStore();

/** Active store — Documents.tsx selects remote when config.documents is on. */
export let documentStore: DocumentStore = sessionDocumentStore;

export function setDocumentStore(store: DocumentStore): void {
  documentStore = store;
}

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

export function describeRetention(doc: StoredDocument, vaultRemote = false): string {
  if (doc.availableInSession) {
    return vaultRemote
      ? 'In your account vault — also cached in this tab'
      : 'Stored in this browser tab only';
  }
  return vaultRemote
    ? 'In your account vault (open to view)'
    : 'File closed — details kept, file not retained';
}
