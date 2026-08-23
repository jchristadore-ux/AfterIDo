import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, RotateCcw, Save, ShieldCheck, Sparkles } from 'lucide-react';
import type { CircumstanceId, Profile as ProfileType, StateCode } from '@/types';
import { useApp } from '@/store/AppContext';
import { CIRCUMSTANCES } from '@/data/categories';
import { US_STATES } from '@/data/states';
import { tasksForProfile } from '@/data/tasks';
import { formatPhone, fullName } from '@/lib/format';
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
  const { state, setProfile, setPlan, reset } = useApp();
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
        <h1 className="text-3xl text-ink-900 sm:text-4xl">Your profile</h1>
        <p className="mt-2 text-ink-600">
          Change anything here and every task updates with it — you never retype.
        </p>
      </header>

      {/* --------------------------------------------------------- Names */}
      <Card className="overflow-hidden">
        <div className="grid gap-px bg-ink-100 sm:grid-cols-2">
          <div className="bg-paper-raised p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-400">
              Previous name
            </p>
            <p className="mt-1.5 font-display text-2xl text-ink-700">
              {fullName(state.profile.currentName) || '—'}
            </p>
          </div>
          <div className="bg-rose-50 p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-rose-600">
              New legal name
            </p>
            <p className="mt-1.5 font-display text-2xl text-ink-900">
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
              <span className="text-sm text-rose-600">
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
        <p className="mt-3 text-xs text-ink-400">
          Unchecking something hides its tasks but keeps your progress on them, in case you
          change your mind.
        </p>
      </section>

      {/* --------------------------------------------------------- Plan */}
      <section>
        <SectionHeading title="Your plan" className="mb-3" />
        <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
          <div>
            <p className="font-medium text-ink-900">
              {state.plan === 'premium' ? 'Premium' : 'Free'}
            </p>
            <p className="text-sm text-ink-500">
              {state.plan === 'premium'
                ? 'State guidance, packet, letters, vault and reminders are unlocked.'
                : 'Checklist and prefill. Upgrade for the packet, vault and reminders.'}
            </p>
          </div>
          {state.plan === 'premium' ? (
            <Button variant="secondary" size="sm" onClick={() => setPlan('free')}>
              Switch to Free
            </Button>
          ) : (
            <Button size="sm" onClick={() => setPlan('premium')}>
              <Sparkles size={14} /> Unlock preview
            </Button>
          )}
        </Card>
      </section>

      {/* -------------------------------------------------------- Privacy */}
      <Callout tone="sage" icon={<ShieldCheck size={16} />} title="Your information">
        Everything on this page is stored only in this browser. We never ask for your Social
        Security number, license number or account numbers, and nothing here is transmitted
        anywhere in this build.
      </Callout>

      <section>
        <Button variant="ghost" onClick={() => setConfirmReset(true)} className="text-clay-600">
          <RotateCcw size={15} /> Delete everything and start over
        </Button>
      </section>

      {/* Sticky save */}
      {dirty && (
        <div className="safe-bottom fixed inset-x-0 bottom-16 z-30 px-5 lg:bottom-6">
          <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 rounded-2xl bg-ink-900 px-5 py-3 shadow-lift">
            <p className="text-sm text-paper/80">You have unsaved changes</p>
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
              variant="danger"
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
        <p className="text-ink-700">
          This clears your profile, your progress and your document list from this browser. It
          cannot be undone.
        </p>
      </Modal>
    </div>
  );
}
