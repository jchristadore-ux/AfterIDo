import { useState } from 'react';
import { ArrowLeft, Printer } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { CATEGORY_BY_ID } from '@/data/categories';
import { DOCUMENT_KINDS } from '@/data/documents';
import { getStateProfile } from '@/data/states';
import { STATUS_LABEL, groupByPhase, isSettled } from '@/lib/progress';
import {
  addressBlock,
  formatDate,
  formatMinutes,
  formatPhone,
  fullName,
  marriagePlace,
} from '@/lib/format';
import { Button, Callout, Card, CheckCard } from '@/components/ui';
import { PremiumGate } from '@/components/PremiumGate';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer';

/**
 * Document generation.
 *
 * The packet is a print stylesheet over live app state rather than a generated
 * PDF binary — she gets a real document through the browser's own "Save as
 * PDF", and it can never drift from her actual progress. It contains her own
 * information and public instructions; it deliberately contains no reproduction
 * of any government form.
 */
export function Packet() {
  return (
    <div className="space-y-6">
      <Link
        to="/app"
        className="no-print inline-flex items-center gap-1.5 text-sm text-charcoal-500 hover:text-charcoal-900"
      >
        <ArrowLeft size={15} /> Dashboard
      </Link>

      <header className="no-print">
        <h1 className="text-3xl text-charcoal-900 sm:text-4xl">Your name-change packet</h1>
        <p className="mt-2 text-charcoal-700">
          Everything in one document — print it, or save it as a PDF and keep it in the folder
          with your certificates.
        </p>
      </header>

      <PremiumGate
        feature="packet"
        title="Your printable name-change packet"
        description="Your information summary, document checklist, every task’s instructions, your notes and where you left off — as one document you can take with you."
      >
        <PacketBuilder />
      </PremiumGate>
    </div>
  );
}

function PacketBuilder() {
  const { state, tasks, progress } = useApp();
  const [includeDone, setIncludeDone] = useState(true);
  const [includeNotes, setIncludeNotes] = useState(true);

  const profile = state.profile;
  const stateProfile = getStateProfile(profile.address.state);
  const visible = includeDone ? tasks : tasks.filter((t) => !isSettled(t.state.status));
  const phases = groupByPhase(visible);

  const neededDocs = DOCUMENT_KINDS.filter((kind) =>
    kind.usedFor.some((taskId) => tasks.some((t) => t.id === taskId)),
  );
  const heldKinds = new Set(state.documents.map((d) => d.kindId));

  return (
    <div className="space-y-6">
      <Card className="no-print p-5">
        <p className="mb-3 text-sm font-medium text-charcoal-700">What to include</p>
        <div className="grid gap-2.5 sm:grid-cols-2">
          <CheckCard
            checked={includeDone}
            onToggle={() => setIncludeDone((v) => !v)}
            title="Completed tasks"
            description="Useful as a record of what changed and when"
          />
          <CheckCard
            checked={includeNotes}
            onToggle={() => setIncludeNotes((v) => !v)}
            title="My notes"
            description="Confirmation numbers and who you spoke to"
          />
        </div>
        <Button className="mt-4" onClick={() => window.print()}>
          <Printer size={16} /> Print or save as PDF
        </Button>
        <p className="mt-2 text-xs text-charcoal-400">
          Choose “Save as PDF” in the print dialog to keep a copy.
        </p>
      </Card>

      {/* ---------------------------------------------------- The document */}
      <article className="print-page rounded-card border border-charcoal-100 bg-surface p-7 shadow-soft sm:p-10">
        {/* Cover */}
        <header className="print-avoid-break border-b border-charcoal-200 pb-6">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary-600">
            AfterIDo · Name change packet
          </p>
          <h2 className="mt-3 font-display text-3xl text-charcoal-900">
            {fullName(profile.newName) || 'Your new name'}
          </h2>
          <p className="mt-1 text-charcoal-700">
            formerly {fullName(profile.currentName) || '—'}
          </p>
          <p className="mt-4 text-sm text-charcoal-500">
            Prepared{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}{' '}
            · {progress.settled} of {progress.total} tasks complete ({progress.percent}%)
          </p>
        </header>

        {/* 1. Information summary */}
        <PacketSection n="1" title="Your information">
          <dl className="grid gap-x-8 gap-y-3 sm:grid-cols-2">
            <Row label="Previous legal name" value={fullName(profile.currentName)} />
            <Row label="New legal name" value={fullName(profile.newName)} />
            <Row label="Date of birth" value={formatDate(profile.dateOfBirth)} />
            <Row label="Phone" value={formatPhone(profile.phone)} />
            <Row label="Email" value={profile.email} />
            <Row label="Mailing address" value={addressBlock(profile.address)} multiline />
            <Row label="Spouse" value={profile.marriage.spouseName} />
            <Row label="Date of marriage" value={formatDate(profile.marriage.date)} />
            <Row label="Place of marriage" value={marriagePlace(profile)} />
            <Row
              label="Certified copies on hand"
              value={String(profile.marriage.certifiedCopies)}
            />
          </dl>
          <p className="mt-5 text-xs text-charcoal-400">
            This packet contains no Social Security number, license number or account number —
            AfterIDo never collects them. Have those on hand separately when you file.
          </p>
        </PacketSection>

        {/* 2. Document checklist */}
        <PacketSection n="2" title="Documents to bring">
          <ul className="space-y-2.5">
            {neededDocs.map((kind) => (
              <li key={kind.id} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border border-charcoal-400 text-[10px] leading-none">
                  {heldKinds.has(kind.id) ? '✓' : ''}
                </span>
                <span>
                  <span className="font-medium text-charcoal-900">{kind.label}</span>
                  <span className="block text-sm text-charcoal-500">{kind.guidance}</span>
                </span>
              </li>
            ))}
          </ul>
        </PacketSection>

        {/* 3. Your state */}
        {stateProfile && (
          <PacketSection n="3" title={`Where you live: ${stateProfile.name}`}>
            {stateProfile.coverage === 'detailed' ? (
              <p className="text-charcoal-700">
                Your plan includes {stateProfile.name}-specific instructions, last checked against
                official sources on {stateProfile.lastReviewed}. Requirements change — confirm on
                the agency’s own page before you go.
              </p>
            ) : (
              <p className="text-charcoal-700">
                We haven’t yet published verified {stateProfile.name} specifics. Your plan links
                to the official {stateProfile.name} agency pages, which are authoritative.
              </p>
            )}
          </PacketSection>
        )}

        {/* 4. The plan */}
        <PacketSection n={stateProfile ? '4' : '3'} title="Your plan, in order">
          <div className="space-y-8">
            {phases.map((phase) => (
              <div key={phase.n}>
                <h4 className="font-display text-lg text-charcoal-900">
                  Phase {phase.n} — {phase.title}
                </h4>
                <p className="mb-4 text-sm text-charcoal-500">{phase.caption}</p>

                <div className="space-y-5">
                  {phase.tasks.map((task) => (
                    <div
                      key={task.id}
                      className="print-avoid-break rounded-xl border border-charcoal-100 p-4"
                    >
                      <div className="flex flex-wrap items-baseline justify-between gap-2">
                        <p className="font-medium text-charcoal-900">
                          <span className="mr-2 inline-block h-3.5 w-3.5 shrink-0 rounded-sm border border-charcoal-400 align-middle text-[9px] leading-3">
                            {isSettled(task.state.status) ? '✓' : ''}
                          </span>
                          {task.title}
                        </p>
                        <p className="text-xs text-charcoal-500">
                          {STATUS_LABEL[task.state.status]} ·{' '}
                          {formatMinutes(task.estimatedMinutes)} ·{' '}
                          {CATEGORY_BY_ID[task.category].label}
                        </p>
                      </div>

                      <p className="mt-1.5 text-sm text-charcoal-700">{task.summary}</p>

                      {task.whatYouNeed.length > 0 && (
                        <p className="mt-2.5 text-sm text-charcoal-700">
                          <span className="font-medium text-charcoal-900">Bring: </span>
                          {task.whatYouNeed.join('; ')}
                        </p>
                      )}

                      <ol className="mt-2.5 list-decimal space-y-1 pl-5 text-sm text-charcoal-700">
                        {task.steps.map((s) => (
                          <li key={s}>{s}</li>
                        ))}
                      </ol>

                      {task.stateGuidance?.links && task.stateGuidance.links.length > 0 && (
                        <p className="mt-2.5 break-words text-xs text-charcoal-500">
                          <span className="font-medium">
                            {task.stateGuidance.agencyName}:{' '}
                          </span>
                          {task.stateGuidance.links.map((l) => l.url).join('  ·  ')}
                        </p>
                      )}

                      {task.officialLinks.length > 0 && (
                        <p className="mt-1.5 break-words text-xs text-charcoal-500">
                          <span className="font-medium">Official: </span>
                          {task.officialLinks.map((l) => l.url).join('  ·  ')}
                        </p>
                      )}

                      {task.state.instances.length > 0 && (
                        <p className="mt-2 text-sm text-charcoal-700">
                          <span className="font-medium text-charcoal-900">Accounts: </span>
                          {task.state.instances
                            .map((i) => `${i.done ? '✓' : '☐'} ${i.label}`)
                            .join('   ')}
                        </p>
                      )}

                      {includeNotes && task.state.notes.trim() && (
                        <p className="mt-2 rounded-lg bg-surface-sunk px-3 py-2 text-sm text-charcoal-700">
                          <span className="font-medium">Notes: </span>
                          {task.state.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </PacketSection>

        <footer className="mt-10 border-t border-charcoal-200 pt-5">
          <p className="text-xs leading-relaxed text-charcoal-500">{DISCLAIMER_TEXT}</p>
          <p className="mt-2 text-xs text-charcoal-400">
            Generated by AfterIDo from information you provided. Verify every requirement on the
            official agency page before you file.
          </p>
        </footer>
      </article>

      <Callout tone="neutral" className="no-print">
        The packet is generated from your live plan, so it always matches where you actually
        are. Reprint it any time.
      </Callout>
    </div>
  );
}

function PacketSection({
  n,
  title,
  children,
}: {
  n: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="print-break mt-9">
      <h3 className="mb-4 flex items-baseline gap-3 font-display text-xl text-charcoal-900">
        <span className="text-sm text-primary-600">{n}</span>
        {title}
      </h3>
      {children}
    </section>
  );
}

function Row({
  label,
  value,
  multiline,
}: {
  label: string;
  value: string;
  multiline?: boolean;
}) {
  return (
    <div>
      <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-charcoal-400">
        {label}
      </dt>
      <dd
        className={
          multiline ? 'mt-0.5 whitespace-pre-line text-charcoal-900' : 'mt-0.5 text-charcoal-900'
        }
      >
        {value.trim() || '—'}
      </dd>
    </div>
  );
}
