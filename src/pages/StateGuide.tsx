import { Link, Navigate, useParams } from 'react-router-dom';
import { ArrowRight, ExternalLink, Info } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Badge, Callout, Card, LinkButton } from '@/components/ui';
import {
  STATE_BY_SLUG,
  STATE_NAME,
  STATE_SLUG,
  US_STATES,
  getStateProfile,
} from '@/data/states';
import { PHASES, TASK_BY_ID, TASKS } from '@/data/tasks';
import { stateGuideMeta } from '@shared/seo';
import { LANDING_FAQ } from '@/data/faq';
import type { StateProfile } from '@/types';

/**
 * /name-change-after-marriage/<state> — one page per state, and the app's only
 * search-facing content.
 *
 * Every page is generated from the same catalog the app runs on, so a state
 * page can never claim something the app itself does not. The honest part is
 * the banner: a state we have researched says so, and a state we have not says
 * *that*, rather than dressing up the national defaults as local knowledge.
 * That is also what keeps fifty pages from being fifty thin doorway pages —
 * each one carries the real agency links for its state and admits what it does
 * not know.
 */
export function StateGuide() {
  const { slug = '' } = useParams();
  const code = STATE_BY_SLUG[slug];

  if (!code) return <Navigate to="/" replace />;

  const name = STATE_NAME[code];
  const profile = getStateProfile(code) as StateProfile;
  const meta = stateGuideMeta(name);
  const detailed = profile.coverage === 'detailed';

  // The four steps that must happen in order, plus a count of the rest.
  const backbone = ['marriage-certificate', 'social-security', 'drivers-license', 'passport']
    .map((id) => TASK_BY_ID[id])
    .filter(Boolean);

  return (
    <MarketingShell
      eyebrow={`${name} guide`}
      title={`Changing your name after marriage in ${name}`}
      intro={`The order to do it in, which office handles each step, and the official ${name} links — plus everything after the government paperwork that people forget until it bites.`}
    >
      <Seo
        title={meta.title}
        description={meta.description}
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'HowTo',
          name: `How to change your name after marriage in ${name}`,
          description: meta.description,
          step: backbone.map((task, index) => ({
            '@type': 'HowToStep',
            position: index + 1,
            name: task.title,
            text: task.summary,
          })),
        }}
      />

      <div className="space-y-10">
        {detailed ? (
          <Callout tone="success" title={`We've verified the ${name} specifics`}>
            The steps below were checked against official {name} agency pages on{' '}
            {formatDate(profile.lastReviewed)}. Requirements do change — the official links are
            always the final word.
          </Callout>
        ) : (
          <Callout tone="champagne" title={`We haven't verified ${name}'s local specifics yet`}>
            The order of operations below is federal and applies everywhere. For the {name}-specific
            parts — what your motor vehicle agency wants to see, and where to order a certified
            marriage certificate — we link you to the official {name} pages rather than guess at
            details we have not confirmed.
          </Callout>
        )}

        {/* ------------------------------------------------------ The order */}
        <section>
          <h2 className="text-2xl text-charcoal-900">The order that actually works</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            This sequence is not a preference. Most states check your name against the federal
            Social Security record before they will reissue a licence, so doing it out of order is
            the most common reason people are turned away at the counter.
          </p>

          <ol className="mt-6 space-y-4">
            {backbone.map((task, index) => {
              const guidance = profile.tasks[task.id];
              return (
                <Card key={task.id} as="li" className="p-5">
                  <div className="flex items-start gap-4">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-sm text-white">
                      {index + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg text-charcoal-900">{task.title}</h3>
                      <p className="mt-1 leading-relaxed text-charcoal-700">{task.summary}</p>
                      <p className="mt-2 text-sm text-charcoal-500">
                        <Info size={13} className="mr-1 inline align-[-2px]" />
                        {task.whyNow}
                      </p>

                      {guidance?.headline && (
                        <p className="mt-3 rounded-xl bg-surface-sunk px-3.5 py-2.5 text-sm text-charcoal-900">
                          <strong className="font-medium">{guidance.agencyName}:</strong>{' '}
                          {guidance.headline}
                        </p>
                      )}

                      {guidance?.bringWithYou && guidance.bringWithYou.length > 0 && (
                        <>
                          <p className="mt-4 text-sm font-medium text-charcoal-900">
                            What to bring in {name}
                          </p>
                          <ul className="mt-1.5 list-disc space-y-1 pl-5 text-sm text-charcoal-700">
                            {guidance.bringWithYou.map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        </>
                      )}

                      <div className="mt-4 flex flex-wrap gap-2">
                        {[...(guidance?.links ?? []), ...task.officialLinks].map((link) => (
                          <a
                            key={link.url}
                            href={link.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 bg-surface px-3 py-1.5 text-xs font-medium text-charcoal-700 transition-colors hover:border-primary-300 hover:text-primary-700"
                          >
                            {link.label}
                            <ExternalLink size={12} />
                          </a>
                        ))}
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })}
          </ol>
        </section>

        {/* ------------------------------------------------- Everything else */}
        <section>
          <h2 className="text-2xl text-charcoal-900">And then everything else</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            The government paperwork is the part people expect. The {TASKS.length - backbone.length}{' '}
            other places that still hold your old name are the part that drags on for months —
            banks, your employer, insurance, airline profiles, your will, the vet.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            {PHASES.map((phase) => (
              <Badge key={phase.title} tone="neutral">
                {phase.title}
              </Badge>
            ))}
          </div>
          <div className="mt-6">
            <LinkButton to="/start" size="lg">
              Start My Name Change
              <ArrowRight size={18} />
            </LinkButton>
            <p className="mt-3 text-sm text-charcoal-500">
              Free. Five minutes of questions and you get the whole list, filtered to what applies
              to you.
            </p>
          </div>
        </section>

        {/* -------------------------------------------------------- FAQ */}
        <section>
          <h2 className="text-2xl text-charcoal-900">Common questions</h2>
          <dl className="mt-5 space-y-5">
            {LANDING_FAQ.slice(0, 4).map(({ q, a }) => (
              <div key={q} className="border-t border-charcoal-100 pt-5">
                <dt className="font-medium text-charcoal-900">{q}</dt>
                <dd className="mt-1.5 leading-relaxed text-charcoal-700">{a}</dd>
              </div>
            ))}
          </dl>
        </section>

        <OtherStates current={code} />
      </div>
    </MarketingShell>
  );
}

function OtherStates({ current }: { current: string }) {
  return (
    <section className="border-t border-charcoal-100 pt-8">
      <h2 className="text-lg text-charcoal-900">Other states</h2>
      <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-charcoal-500">
        {US_STATES.filter((s) => s.code !== current).map((s) => (
          <li key={s.code}>
            <Link
              to={`/name-change-after-marriage/${STATE_SLUG[s.code]}`}
              className="hover:text-charcoal-900 hover:underline"
            >
              {s.name}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

function formatDate(iso: string): string {
  const date = new Date(`${iso}T00:00:00`);
  return Number.isNaN(date.getTime())
    ? iso
    : date.toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
}
