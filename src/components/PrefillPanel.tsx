import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, TriangleAlert } from 'lucide-react';
import type { PrefillFieldKey, Profile } from '@/types';
import { buildPrefill, prefillAsText } from '@/lib/prefill';
import { Callout, CopyButton, cx } from './ui';

/**
 * "Prepare Everything For Me", per task.
 *
 * Every organization asks for the same eight things in a slightly different
 * order. This panel is the payoff for the onboarding form: her answers, laid
 * out in the order this particular agency asks for them, each one tap away
 * from the clipboard.
 */
export function PrefillPanel({
  keys,
  profile,
  title = 'Your information, ready to paste',
  caption,
}: {
  keys: PrefillFieldKey[];
  profile: Profile;
  title?: string;
  caption?: string;
}) {
  const fields = buildPrefill(keys, profile);
  const missing = fields.filter((f) => f.missing);
  const [revealed, setRevealed] = useState(false);

  if (fields.length === 0) return null;

  return (
    <section className="rounded-card border border-primary-200 bg-primary-50/60 p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="flex items-center gap-2 font-display text-lg text-charcoal-900">
            <Sparkles size={17} className="text-primary-600" />
            {title}
          </h3>
          <p className="mt-1 text-sm text-charcoal-700">
            {caption ??
              'Filled in from your profile. You typed this once — never type it again.'}
          </p>
        </div>
        <CopyButton
          value={prefillAsText(fields)}
          label="Copy all"
          variant="primary"
          className="shrink-0"
        />
      </div>

      <dl className="mt-4 divide-y divide-primary-200/70 overflow-hidden rounded-xl border border-primary-200/70 bg-surface">
        {fields.map((field) => (
          <div
            key={field.key}
            className="flex items-center gap-3 px-3.5 py-2.5 sm:px-4"
          >
            <div className="min-w-0 flex-1">
              <dt className="text-[0.7rem] font-semibold uppercase tracking-[0.1em] text-charcoal-400">
                {field.label}
              </dt>
              <dd
                className={cx(
                  'mt-0.5 break-words text-[0.95rem]',
                  field.missing ? 'italic text-charcoal-400' : 'text-charcoal-900',
                  field.multiline && 'whitespace-pre-line leading-snug',
                )}
              >
                {field.missing ? 'Not provided yet' : field.value}
              </dd>
            </div>
            {!field.missing && (
              <CopyButton value={field.value} label="" className="shrink-0 !px-2.5" />
            )}
          </div>
        ))}
      </dl>

      {missing.length > 0 && (
        <Callout tone="champagne" icon={<TriangleAlert size={16} />} className="mt-4">
          {missing.length === 1 ? 'One field is' : `${missing.length} fields are`} still empty.{' '}
          <Link to="/app/profile">Add {missing.length === 1 ? 'it' : 'them'} to your profile</Link>{' '}
          and every task updates at once.
        </Callout>
      )}

      {!revealed && (
        <button
          type="button"
          onClick={() => setRevealed(true)}
          className="mt-3 text-xs text-charcoal-500 underline underline-offset-2 hover:text-charcoal-900"
        >
          Why doesn’t AfterIDo just fill in the form for me?
        </button>
      )}
      {revealed && (
        <p className="mt-3 text-xs leading-relaxed text-charcoal-500">
          Government agencies don’t offer a way for an outside app to submit a name change for
          you, and we won’t pretend otherwise. What we can do is remove the retyping: your
          information is laid out in the order this agency asks for it, so filling their form
          takes a minute instead of twenty.
        </p>
      )}
    </section>
  );
}
