import { useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { FileText, Image, Info, ShieldCheck, Trash2, Upload } from 'lucide-react';
import type { StoredDocument } from '@/types';
import { useApp } from '@/store/AppContext';
import { DOCUMENT_KINDS, DOCUMENT_KIND_BY_ID } from '@/data/documents';
import { TASK_BY_ID } from '@/data/tasks';
import { formatBytes, formatDateTime } from '@/lib/format';
import {
  documentStore,
  newDocumentId,
  safeFileName,
  validateUpload,
} from '@/lib/documentStorage';
import {
  Badge,
  Button,
  Callout,
  Card,
  EmptyState,
  Field,
  SectionHeading,
  Select,
  cx,
} from '@/components/ui';
import { PremiumGate } from '@/components/PremiumGate';

export function Documents() {
  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl text-ink-900 sm:text-4xl">My documents</h1>
        <p className="mt-2 text-ink-600">
          Keep track of what you have, and what each agency will ask to see.
        </p>
      </header>

      <PremiumGate
        feature="documents"
        title="Your document vault"
        description="One place for your marriage certificate, your ID and every confirmation you collect along the way — with a note of which task each one is for."
      >
        <Vault />
      </PremiumGate>

      <ChecklistOfDocuments />
    </div>
  );
}

function Vault() {
  const { state, addDocument, removeDocument } = useApp();
  const [kindId, setKindId] = useState(DOCUMENT_KINDS[0].id);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  async function onFiles(files: FileList | null) {
    if (!files || files.length === 0) return;
    const file = files[0];

    const rejection = validateUpload(file);
    if (rejection) {
      setError(rejection.reason);
      return;
    }
    setError(null);

    const id = newDocumentId();
    await documentStore.put(id, file);

    const doc: StoredDocument = {
      id,
      kindId,
      fileName: safeFileName(file.name),
      sizeBytes: file.size,
      mimeType: file.type || 'application/octet-stream',
      uploadedAt: new Date().toISOString(),
      availableInSession: true,
    };
    addDocument(doc);
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <div className="space-y-5">
      <Callout tone="sage" icon={<ShieldCheck size={16} />} title="How your files are handled">
        <p>
          Your marriage certificate and your ID together are everything someone would need to
          impersonate you, so this build takes the cautious route: files you add stay in this
          browser tab and are <strong>never written to disk or sent anywhere</strong>. Close the
          tab and the file is gone — only the name, size and what it’s for are remembered, so
          your checklist still knows you have it.
        </p>
        <p className="mt-2">
          <Link to="/trust">Read the full privacy note →</Link>
        </p>
      </Callout>

      <Card className="p-5">
        <SectionHeading title="Add a document" className="mb-4" />
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
          <Field label="What is it?">
            <Select value={kindId} onChange={(e) => setKindId(e.target.value)}>
              {DOCUMENT_KINDS.map((k) => (
                <option key={k.id} value={k.id}>
                  {k.label}
                </option>
              ))}
            </Select>
          </Field>
          <div>
            <input
              ref={inputRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.heic,.webp,application/pdf,image/*"
              onChange={(e) => void onFiles(e.target.files)}
              className="sr-only"
              id="nameday-upload"
            />
            <Button
              type="button"
              variant="secondary"
              block
              onClick={() => inputRef.current?.click()}
            >
              <Upload size={16} /> Choose file
            </Button>
          </div>
        </div>

        <p className="mt-3 text-xs text-ink-500">
          {DOCUMENT_KIND_BY_ID[kindId]?.guidance}
        </p>

        {error && (
          <p className="mt-3 rounded-xl bg-clay-50 px-3.5 py-2.5 text-sm text-clay-700">{error}</p>
        )}
      </Card>

      {state.documents.length === 0 ? (
        <EmptyState icon={<FileText size={26} />} title="Nothing here yet">
          Add your certified marriage certificate first — it’s the document every other step
          asks for.
        </EmptyState>
      ) : (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-ink-100">
            {state.documents.map((doc) => (
              <DocumentRow key={doc.id} doc={doc} onRemove={() => removeDocument(doc.id)} />
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
}

function DocumentRow({ doc, onRemove }: { doc: StoredDocument; onRemove: () => void }) {
  const kind = DOCUMENT_KIND_BY_ID[doc.kindId];
  const usedFor = (kind?.usedFor ?? [])
    .map((id) => TASK_BY_ID[id])
    .filter(Boolean)
    .slice(0, 3);
  const isImage = doc.mimeType.startsWith('image/');
  const url = doc.availableInSession ? documentStore.getObjectUrl(doc.id) : null;

  return (
    <li className="flex items-start gap-3.5 p-4">
      <span
        className={cx(
          'flex h-11 w-11 shrink-0 items-center justify-center rounded-xl',
          isImage ? 'bg-sage-50 text-sage-600' : 'bg-rose-50 text-rose-600',
        )}
      >
        {isImage ? <Image size={19} /> : <FileText size={19} />}
      </span>

      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-ink-900">{kind?.label ?? 'Document'}</p>
        <p className="truncate text-sm text-ink-500">{doc.fileName}</p>

        <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-400">
          <span>Added {formatDateTime(doc.uploadedAt)}</span>
          <span>{formatBytes(doc.sizeBytes)}</span>
          {url ? (
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-rose-600 underline underline-offset-2"
            >
              Open
            </a>
          ) : (
            <span>File not retained</span>
          )}
        </div>

        {usedFor.length > 0 && (
          <div className="mt-2.5 flex flex-wrap gap-1.5">
            <span className="text-xs text-ink-400">Used for:</span>
            {usedFor.map((task) => (
              <Link key={task.id} to={`/app/task/${task.id}`}>
                <Badge className="hover:border-rose-300">{task.title}</Badge>
              </Link>
            ))}
          </div>
        )}
      </div>

      <button
        type="button"
        onClick={() => {
          documentStore.remove(doc.id);
          onRemove();
        }}
        aria-label={`Remove ${doc.fileName}`}
        className="shrink-0 rounded-lg p-2 text-ink-300 hover:bg-paper-sunk hover:text-clay-600"
      >
        <Trash2 size={15} />
      </button>
    </li>
  );
}

/** The "what you should have on hand" list, derived from her actual tasks. */
function ChecklistOfDocuments() {
  const { state, tasks } = useApp();
  const held = new Set(state.documents.map((d) => d.kindId));

  const needed = DOCUMENT_KINDS.filter((kind) =>
    kind.usedFor.some((taskId) => tasks.some((t) => t.id === taskId)),
  );

  return (
    <section>
      <SectionHeading
        eyebrow="Before you start"
        title="Documents your plan will ask for"
        className="mb-3"
      />
      <Card className="divide-y divide-ink-100">
        {needed.map((kind) => {
          const usingTasks = tasks.filter((t) => kind.usedFor.includes(t.id));
          return (
            <div key={kind.id} className="flex items-start gap-3 p-4">
              <span
                className={cx(
                  'mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 text-[10px]',
                  held.has(kind.id)
                    ? 'border-sage-500 bg-sage-500 text-white'
                    : 'border-ink-200 text-ink-400',
                )}
              >
                {held.has(kind.id) ? '✓' : ''}
              </span>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-ink-900">{kind.label}</p>
                <p className="mt-0.5 text-sm text-ink-500">{kind.guidance}</p>
                <p className="mt-1 text-xs text-ink-400">
                  Needed for {usingTasks.length} {usingTasks.length === 1 ? 'task' : 'tasks'}
                </p>
              </div>
            </div>
          );
        })}
      </Card>
      <Callout tone="neutral" icon={<Info size={16} />} className="mt-4">
        Keep your Social Security card and your certified certificates somewhere physical and
        secure. NameDay never asks for the numbers on them.
      </Callout>
    </section>
  );
}
