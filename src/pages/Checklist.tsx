import { useMemo, useState } from 'react';
import { CircleCheckBig, ListFilter } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { CATEGORIES, CATEGORY_BY_ID } from '@/data/categories';
import { groupByCategory, groupByPhase, isSettled } from '@/lib/progress';
import { Badge, Card, ProgressBar, SectionHeading, cx } from '@/components/ui';
import { TaskCard } from '@/components/TaskCard';

type View = 'order' | 'category';
type Filter = 'open' | 'all' | 'done';

export function Checklist() {
  const { tasks, progress } = useApp();
  const [view, setView] = useState<View>('order');
  const [filter, setFilter] = useState<Filter>('open');

  const filtered = useMemo(() => {
    if (filter === 'all') return tasks;
    if (filter === 'done') return tasks.filter((t) => isSettled(t.state.status));
    return tasks.filter((t) => !isSettled(t.state.status));
  }, [tasks, filter]);

  const phases = useMemo(() => groupByPhase(filtered), [filtered]);
  const categories = useMemo(
    () =>
      groupByCategory(
        filtered,
        CATEGORIES.map((c) => c.id),
      ),
    [filtered],
  );

  return (
    <div className="space-y-7">
      <header>
        <h1 className="text-3xl text-charcoal-900 sm:text-4xl">Your checklist</h1>
        <p className="mt-2 text-charcoal-700">
          {progress.settled} of {progress.total} complete · {progress.remaining} to go
        </p>
        <ProgressBar percent={progress.percent} className="mt-4" />
      </header>

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Segmented
          value={view}
          onChange={(v) => setView(v as View)}
          options={[
            { value: 'order', label: 'In order' },
            { value: 'category', label: 'By category' },
          ]}
        />
        <Segmented
          value={filter}
          onChange={(v) => setFilter(v as Filter)}
          icon={<ListFilter size={14} />}
          options={[
            { value: 'open', label: 'To do' },
            { value: 'done', label: 'Done' },
            { value: 'all', label: 'All' },
          ]}
        />
      </div>

      {filtered.length === 0 && (
        <Card className="px-6 py-12 text-center">
          <CircleCheckBig className="mx-auto mb-3 text-sage-500" size={30} />
          <p className="font-display text-xl">
            {filter === 'done' ? 'Nothing finished yet' : 'Nothing left here'}
          </p>
          <p className="mt-2 text-sm text-charcoal-500">
            {filter === 'done'
              ? 'Mark something as updated and it will show up here.'
              : 'Add the places that still know you by your old name. We’ll help you check them off.'}
          </p>
        </Card>
      )}

      {/* ------------------------------------------------------- In order */}
      {view === 'order' &&
        phases.map((phase) => (
          <section key={phase.n}>
            <div className="mb-3 flex items-center gap-3">
              <span
                className={cx(
                  'flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-display text-sm',
                  phase.complete
                    ? 'bg-sage-500 text-white'
                    : phase.current
                      ? 'bg-primary-600 text-white'
                      : 'bg-surface-sunk text-charcoal-400',
                )}
              >
                {phase.complete ? <CircleCheckBig size={15} /> : phase.n}
              </span>
              <div className="min-w-0">
                <h2 className="text-lg leading-tight text-charcoal-900">{phase.title}</h2>
                <p className="text-sm text-charcoal-500">{phase.caption}</p>
              </div>
            </div>
            <div className="space-y-2.5 sm:pl-11">
              {phase.tasks.map((task) => (
                <TaskCard key={task.id} task={task} showPhase />
              ))}
            </div>
          </section>
        ))}

      {/* ---------------------------------------------------- By category */}
      {view === 'category' &&
        categories.map((group) => {
          const category = CATEGORY_BY_ID[group.id];
          return (
            <section key={group.id}>
              <SectionHeading
                title={category.label}
                className="mb-3"
                action={
                  <Badge tone={group.settled === group.tasks.length ? 'success' : 'neutral'}>
                    {group.settled}/{group.tasks.length}
                  </Badge>
                }
              />
              <p className="-mt-2 mb-3 text-sm text-charcoal-500">{category.blurb}</p>
              <div className="space-y-2.5">
                {group.tasks.map((task) => (
                  <TaskCard key={task.id} task={task} showPhase />
                ))}
              </div>
            </section>
          );
        })}
    </div>
  );
}

function Segmented({
  value,
  onChange,
  options,
  icon,
}: {
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  icon?: React.ReactNode;
}) {
  return (
    <div className="inline-flex items-center gap-1 rounded-full border border-charcoal-200 bg-surface p-1">
      {icon && <span className="pl-2 text-charcoal-400">{icon}</span>}
      {options.map((opt) => (
        <button
          key={opt.value}
          type="button"
          onClick={() => onChange(opt.value)}
          aria-pressed={value === opt.value}
          className={cx(
            'rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors',
            value === opt.value
              ? 'bg-charcoal-900 text-white'
              : 'text-charcoal-500 hover:text-charcoal-900',
          )}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
}
