import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Check, Download, RotateCcw, Save, ShieldCheck, Upload } from 'lucide-react';
import type { CircumstanceId, Profile as ProfileType, StateCode } from '@/types';
import { useApp } from '@/store/AppContext';
import { planFromJson, planToJson } from '@/lib/storage';
import { CIRCUMSTANCES } from '@/data/categories';
import { US_STATES } from '@/data/states';
import { tasksForProfile } from '@/data/tasks';
import { formatPhone, fullName } from '@/lib/format';
import { AfterIDoBrand, APP_VERSION } from '@/brand';
import { Wordmark } from '@/components/Wordmark';
import { AccountPanel } from '@/components/AccountPanel';
import { CustomTasks } from '@/components/CustomTasks';
import {
  Button,
  Callout,
  Card,
  CheckCard,
  Field,
  Input,
  Modal,
  SectionHeading,
  Select,
} from '@/components/ui';

export function Profile() {
  const { state, setProfile, reset } = useApp();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<ProfileType>(state.profile);
  const [saved, setSaved] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);

  // Keep the form in step if the profile changes elsewhere (e.g. demo mode).
  useEffect(() => setDraft(state.profile), [state.profile]);

  const dirty = JSON.stringify(draft) !== JSON.stringify(state.profile);
  const taskCount = tasksForProfile(draft).length;
  const currentCount = tasksForProfile(state.profile).length;

  function patch(update: Partial<ProfileType>) {
    setDraft((p) => ({ ...p, ...update }));
    setSaved(false);
  }

  function save() {
    setProfile(draft);
    setSaved(true);
    window.setTimeout(() => setSaved(false), 2500);
  }

  function toggle(id: CircumstanceId) {
    setDraft((p) => ({
      ...p,
      circumstances: p.circumstances.includes(id)
        ? p.circumstances.filter((c) => c !== id)
        : [...p.circumstances, id],
    }));
    setSaved(false);
  }

  return (
    <div className="space-y-8">
      <header>
        <h1 className="text-3xl text-charcoal-900 sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-charcoal-700">
          Change anything here and every task updates with it — you never retype.
        </p>
      </header>

      {/* --------------------------------------------------------- Names */}
      <Card className="overflow-hidden">
        <div className="grid gap-px bg-charcoal-100 sm:grid-cols-2">
          <div className="bg-surface p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-charcoal-400">
              Previous name
            </p>
            <p className="mt-1.5 font-display text-2xl text-charcoal-700">
              {fullName(state.profile.currentName) || '—'}
            </p>
          </div>
          <div className="bg-primary-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-primary-600">
              New legal name
            </p>
            <p className="mt-1.5 font-display text-2xl text-charcoal-900">
              {fullName(state.profile.newName) || '—'}
            </p>
          </div>
        </div>
      </Card>

      {/* --------------------------------------------------------- Edit */}
      <section>
        <SectionHeading title="Current name" className="mb-3" />
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="First">
              <Input
                value={draft.currentName.first}
                onChange={(e) =>
                  patch({ currentName: { ...draft.currentName, first: e.target.value } })
                }
              />
            </Field>
            <Field label="Middle" optional>
              <Input
                value={draft.currentName.middle}
                onChange={(e) =>
                  patch({ currentName: { ...draft.currentName, middle: e.target.value } })
                }
              />
            </Field>
            <Field label="Last">
              <Input
                value={draft.currentName.last}
                onChange={(e) =>
                  patch({ currentName: { ...draft.currentName, last: e.target.value } })
                }
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading title="New name" className="mb-3" />
        <Card className="p-5">
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="First">
              <Input
                value={draft.newName.first}
                onChange={(e) => patch({ newName: { ...draft.newName, first: e.target.value } })}
              />
            </Field>
            <Field label="Middle" optional>
              <Input
                value={draft.newName.middle}
                onChange={(e) => patch({ newName: { ...draft.newName, middle: e.target.value } })}
              />
            </Field>
            <Field label="Last">
              <Input
                value={draft.newName.last}
                onChange={(e) => patch({ newName: { ...draft.newName, last: e.target.value } })}
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading title="Contact & address" className="mb-3" />
        <Card className="space-y-4 p-5">
          <Field label="Date of birth" className="max-w-xs">
            <Input
              type="date"
              value={draft.dateOfBirth}
              onChange={(e) => patch({ dateOfBirth: e.target.value })}
            />
          </Field>
          <Field label="Street address">
            <Input
              value={draft.address.line1}
              onChange={(e) => patch({ address: { ...draft.address, line1: e.target.value } })}
            />
          </Field>
          <Field label="Apartment, suite, unit" optional>
            <Input
              value={draft.address.line2}
              onChange={(e) => patch({ address: { ...draft.address, line2: e.target.value } })}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-[2fr_1fr_1fr]">
            <Field label="City">
              <Input
                value={draft.address.city}
                onChange={(e) => patch({ address: { ...draft.address, city: e.target.value } })}
              />
            </Field>
            <Field label="State" hint="Drives your state-specific steps">
              <Select
                value={draft.address.state}
                onChange={(e) =>
                  patch({ address: { ...draft.address, state: e.target.value as StateCode } })
                }
              >
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.code}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="ZIP">
              <Input
                value={draft.address.zip}
                inputMode="numeric"
                onChange={(e) => patch({ address: { ...draft.address, zip: e.target.value } })}
              />
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Phone">
              <Input
                type="tel"
                value={draft.phone}
                onChange={(e) => patch({ phone: e.target.value })}
                onBlur={() => patch({ phone: formatPhone(draft.phone) })}
              />
            </Field>
            <Field label="Email">
              <Input
                type="email"
                value={draft.email}
                onChange={(e) => patch({ email: e.target.value })}
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading title="Marriage" className="mb-3" />
        <Card className="space-y-4 p-5">
          <Field label="Spouse’s full name">
            <Input
              value={draft.marriage.spouseName}
              onChange={(e) =>
                patch({ marriage: { ...draft.marriage, spouseName: e.target.value } })
              }
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Date of marriage">
              <Input
                type="date"
                value={draft.marriage.date}
                onChange={(e) => patch({ marriage: { ...draft.marriage, date: e.target.value } })}
              />
            </Field>
            <Field label="State">
              <Select
                value={draft.marriage.state}
                onChange={(e) =>
                  patch({ marriage: { ...draft.marriage, state: e.target.value as StateCode } })
                }
              >
                <option value="">—</option>
                {US_STATES.map((s) => (
                  <option key={s.code} value={s.code}>
                    {s.name}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="County">
              <Input
                value={draft.marriage.county}
                onChange={(e) => patch({ marriage: { ...draft.marriage, county: e.target.value } })}
              />
            </Field>
            <Field label="Certified copies on hand">
              <Input
                type="number"
                min={0}
                value={draft.marriage.certifiedCopies}
                onChange={(e) =>
                  patch({
                    marriage: {
                      ...draft.marriage,
                      certifiedCopies: Math.max(0, Number(e.target.value) || 0),
                    },
                  })
                }
              />
            </Field>
          </div>
        </Card>
      </section>

      <section>
        <SectionHeading
          title="What applies to you"
          className="mb-3"
          action={
            taskCount !== currentCount ? (
              <span className="text-sm text-primary-600">
                {taskCount > currentCount ? '+' : ''}
                {taskCount - currentCount} tasks
              </span>
            ) : undefined
          }
        />
        <div className="grid gap-2.5 sm:grid-cols-2">
          {CIRCUMSTANCES.map((c) => (
            <CheckCard
              key={c.id}
              checked={draft.circumstances.includes(c.id)}
              onToggle={() => toggle(c.id)}
              title={c.label}
              description={c.hint}
            />
          ))}
        </div>
        <p className="mt-3 text-xs text-charcoal-400">
          Unchecking something hides its tasks but keeps your progress on them, in case you
          change your mind.
        </p>
      </section>

      {/* --------------------------------------------- Plan and account */}
      <AccountPanel />

      {/* ------------------------------------------------- Custom tasks */}
      <CustomTasks />

      {/* --------------------------------------------------------- Backup */}
      <PlanBackup />

      {/* -------------------------------------------------------- Privacy */}
      <Callout tone="success" icon={<ShieldCheck size={16} />} title="Your information">
        Everything on this page is stored in this browser and is never sent to us. We never ask
        for your Social Security number, license number, account numbers or any password — they
        aren’t in the app at all.{' '}
        <Link to="/privacy" className="underline underline-offset-2">
          Privacy policy
        </Link>
      </Callout>

      {/* ---------------------------------------------------------- About */}
      <section>
        <SectionHeading title="About" className="mb-3" />
        <Card className="p-6 text-center">
          <Wordmark size="lg" className="mx-auto" />
          <p className="mt-4 text-sm text-charcoal-700">{AfterIDoBrand.tagline}</p>
          <p className="mt-1 text-xs text-charcoal-400">Version {APP_VERSION}</p>
        </Card>
      </section>

      <section>
        <Button variant="ghost" onClick={() => setConfirmReset(true)} className="text-destructive-600">
          <RotateCcw size={15} /> Delete everything and start over
        </Button>
      </section>

      {/* Sticky save */}
      {dirty && (
        <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 px-5 lg:bottom-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-charcoal-900 px-5 py-3 shadow-lift">
            <p className="text-sm text-white/80">You have unsaved changes</p>
            <Button size="sm" onClick={save}>
              <Save size={14} /> Save
            </Button>
          </div>
        </div>
      )}

      {saved && !dirty && (
        <p className="flex items-center gap-2 text-sm text-sage-700">
          <Check size={15} /> Saved — every task now uses your updated details.
        </p>
      )}

      <Modal
        open={confirmReset}
        onClose={() => setConfirmReset(false)}
        title="Delete everything?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmReset(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                reset();
                navigate('/');
              }}
            >
              Delete everything
            </Button>
          </>
        }
      >
        <p className="text-charcoal-700">
          This clears your profile, your progress and your document list from this browser. It
          cannot be undone.
        </p>
        <p className="mt-3 text-sm text-charcoal-500">
          If you might want it back, save a copy first — “Save a backup” above.
        </p>
      </Modal>
    </div>
  );
}

/**
 * Save a copy of the plan, and put one back.
 *
 * Everything she types lives in this browser and nowhere else — which is the
 * privacy promise, and also the one real way to lose weeks of work. Clearing
 * site data, a new phone, or a browser that decides to evict storage all take
 * the lot, and there is no copy on our side to restore because we deliberately
 * never had one.
 *
 * A file she keeps herself is the only backup that doesn't compromise that, so
 * the app has to offer one rather than leaving her to discover the problem.
 */
function PlanBackup() {
  const { state, importPlan } = useApp();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<{ state: typeof state; fileName: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [exported, setExported] = useState(false);

  function download() {
    const blob = new Blob([planToJson(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = `afterido-plan-${new Date().toISOString().slice(0, 10)}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
    setExported(true);
    window.setTimeout(() => setExported(false), 2500);
  }

  async function chooseFile(files: FileList | null) {
    setError(null);
    const file = files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('That file is too large to be an AfterIDo plan.');
      return;
    }

    const parsed = planFromJson(await file.text());
    if (!parsed) {
      setError('That doesn’t look like an AfterIDo backup. Look for a file ending in .json.');
      if (inputRef.current) inputRef.current.value = '';
      return;
    }

    setPending({ state: parsed, fileName: file.name });
    if (inputRef.current) inputRef.current.value = '';
  }

  return (
    <section>
      <SectionHeading title="Backup" className="mb-3" />
      <Card className="p-5">
        <p className="text-sm leading-relaxed text-charcoal-700">
          Your plan is saved in <strong className="font-medium text-charcoal-900">this browser
          only</strong>. We never receive it, which means we also cannot restore it — if you clear
          your browsing data or move to a new phone, it is gone. Save a copy and you can put it
          back on any device.
        </p>

        <div className="mt-4 flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={download}>
            {exported ? <Check size={14} /> : <Download size={14} />}
            {exported ? 'Saved' : 'Save a backup'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => inputRef.current?.click()}>
            <Upload size={14} /> Restore from a backup
          </Button>
          <input
            ref={inputRef}
            type="file"
            accept="application/json,.json"
            className="sr-only"
            onChange={(e) => void chooseFile(e.target.files)}
          />
        </div>

        {error && (
          <Callout tone="destructive" className="mt-4">
            {error}
          </Callout>
        )}

        <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-500">
          The file holds your details and your progress. Keep it somewhere you would keep a
          document with your address on it. Files in your document vault are never included —
          they are never written to disk at all.
        </p>
      </Card>

      <Modal
        open={pending !== null}
        onClose={() => setPending(null)}
        title="Restore this backup?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setPending(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (pending) importPlan(pending.state);
                setPending(null);
              }}
            >
              Restore
            </Button>
          </>
        }
      >
        <p className="text-charcoal-700">
          This replaces everything currently in this browser — your profile, your progress and
          your document list — with what is in{' '}
          <strong className="font-medium text-charcoal-900">{pending?.fileName}</strong>.
        </p>
        <p className="mt-3 text-sm text-charcoal-500">
          Nothing is merged, so anything you have done on this device since that backup will be
          replaced. Cancel and save a backup first if you are not sure.
        </p>
      </Modal>
    </section>
  );
}
