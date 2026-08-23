import { ArrowRight, Check, Lock } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Callout, Card, LinkButton } from '@/components/ui';
import { PHASES, TASKS, phaseForStep } from '@/data/tasks';
import { CATEGORIES } from '@/data/categories';
import { DETAILED_STATES, STATE_NAME } from '@/data/states';

export function HowItWorks() {
  return (
    <MarketingShell
      eyebrow="How it works"
      title="One profile. One order. One list that knows what’s left."
      intro="AfterIDo isn’t a filing service and doesn’t pretend to be. It’s the thing that turns a month of research into an afternoon of tasks."
    >
      <div className="space-y-14">
        {/* ------------------------------------------------------ The order */}
        <section>
          <h2 className="text-2xl text-charcoal-900">The order of operations</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            This is the part that trips everyone up. Each step below unlocks the ones after it,
            and AfterIDo locks a task until its dependency is done so you never make a wasted trip.
          </p>

          <ol className="mt-6 space-y-3">
            {PHASES.map((phase) => {
              const count = TASKS.filter((t) => phaseForStep(t.step) === phase.n).length;
              return (
                <li key={phase.n}>
                  <Card className="flex gap-4 p-5">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-600 font-display text-white">
                      {phase.n}
                    </span>
                    <div className="min-w-0">
                      <p className="font-medium text-charcoal-900">{phase.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-charcoal-700">{phase.caption}</p>
                      <p className="mt-1.5 text-xs text-charcoal-400">
                        {count} {count === 1 ? 'task' : 'possible tasks'}
                      </p>
                    </div>
                  </Card>
                </li>
              );
            })}
          </ol>

          <Callout tone="champagne" icon={<Lock size={16} />} className="mt-5">
            Example: your driver’s license stays locked until Social Security is marked complete,
            because most motor vehicle agencies verify your name against the Social Security
            record before they’ll issue a new license.
          </Callout>
        </section>

        {/* --------------------------------------------------- What we cover */}
        <section>
          <h2 className="text-2xl text-charcoal-900">What we track</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            {TASKS.length} possible changes across seven categories. You’ll only see the ones
            that match your life — a few questions during setup switch the rest off.
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2">
            {CATEGORIES.map((category) => {
              const items = TASKS.filter((t) => t.category === category.id);
              return (
                <Card key={category.id} className="p-5">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="font-medium text-charcoal-900">{category.label}</p>
                    <span className="text-sm text-charcoal-400">{items.length}</span>
                  </div>
                  <p className="mt-1 text-sm text-charcoal-500">{category.blurb}</p>
                  <ul className="mt-3 space-y-1 text-sm text-charcoal-700">
                    {items.slice(0, 4).map((t) => (
                      <li key={t.id} className="flex items-start gap-2">
                        <Check size={13} className="mt-1 shrink-0 text-sage-600" />
                        {t.title}
                      </li>
                    ))}
                    {items.length > 4 && (
                      <li className="pl-5 text-charcoal-400">+ {items.length - 4} more</li>
                    )}
                  </ul>
                </Card>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------- What we can't do */}
        <section>
          <h2 className="text-2xl text-charcoal-900">What AfterIDo can and can’t do</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Card className="border-sage-300/60 p-5">
              <p className="font-medium text-sage-700">We can prepare</p>
              <ul className="mt-3 space-y-2 text-sm text-charcoal-700">
                {[
                  'Work out which tasks apply to you',
                  'Sequence them so nothing is wasted',
                  'Fill in your details on every task',
                  'Tell you exactly which documents to bring',
                  'Write your notification letters',
                  'Print your whole plan as one packet',
                  'Keep track of what’s done',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <Check size={14} className="mt-0.5 shrink-0 text-sage-600" />
                    {item}
                  </li>
                ))}
              </ul>
            </Card>

            <Card className="p-5">
              <p className="font-medium text-charcoal-900">You submit</p>
              <ul className="mt-3 space-y-2 text-sm text-charcoal-700">
                {[
                  'Filing your Form SS-5 with Social Security',
                  'Visiting your motor vehicle agency',
                  'Mailing your passport application',
                  'Calling your bank and your insurers',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-charcoal-400" />
                    {item}
                  </li>
                ))}
              </ul>
              <p className="mt-4 text-sm leading-relaxed text-charcoal-500">
                Government agencies don’t offer a way for a third-party app to submit a name
                change on your behalf, and we won’t claim otherwise. Every link in AfterIDo goes
                to the agency’s own site.
              </p>
            </Card>
          </div>
        </section>

        {/* -------------------------------------------------------- States */}
        <section>
          <h2 className="text-2xl text-charcoal-900">State-specific guidance</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            Motor vehicle rules, voter registration and professional licensing all differ by
            state. We publish hand-verified guidance for{' '}
            {DETAILED_STATES.map((code) => STATE_NAME[code]).join(', ')}, with the date it was
            last checked shown on every step.
          </p>
          <p className="mt-3 leading-relaxed text-charcoal-700">
            Everywhere else, you get the official agency links and we tell you plainly that we
            haven’t verified the specifics yet — rather than inventing requirements that sound
            right.
          </p>
        </section>

        {/* ----------------------------------------------------------- CTA */}
        <section className="rounded-[1.75rem] bg-charcoal-900 px-7 py-12 text-center sm:px-12">
          <h2 className="font-display text-3xl text-white">Ready when you are</h2>
          <p className="mx-auto mt-3 max-w-md text-white/70">
            Five minutes of questions, then a plan that tells you exactly what to do next.
          </p>
          <LinkButton to="/start" size="lg" className="mt-7">
            Update My Name
            <ArrowRight size={18} />
          </LinkButton>
        </section>
      </div>
    </MarketingShell>
  );
}
