import { useState, type FormEvent } from 'react';
import { Plus, X } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { CATEGORIES } from '@/data/categories';
import type { CategoryId } from '@/types';
import { PremiumGate } from './PremiumGate';
import { Button, Card, Field, Input, SectionHeading, Select } from './ui';

/**
 * Tasks she adds herself.
 *
 * The catalog covers about forty organizations, which is most people's list
 * and nobody's exactly. A custom task carries a title and a category and
 * nothing else — no invented steps, no links we haven't verified — because the
 * app has no business claiming to know how her local library handles a name
 * change.
 *
 * Custom tasks join the checklist through the same `buildTaskViews` join as
 * catalog tasks, so progress, filtering and the packet all pick them up
 * without a single conditional in those screens.
 */
export function CustomTasks() {
  const { state, addCustomTask, removeCustomTask } = useApp();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<CategoryId>('personal');

  function submit(event: FormEvent) {
    event.preventDefault();
    const clean = title.trim();
    if (!clean) return;
    addCustomTask(clean.slice(0, 80), category);
    setTitle('');
  }

  return (
    <section>
      <SectionHeading
        title="Your own tasks"
        className="mb-3"
        action={
          state.customTasks.length > 0 ? (
            <span className="text-sm text-charcoal-400">{state.customTasks.length} added</span>
          ) : undefined
        }
      />

      <PremiumGate
        feature="custom-tasks"
        title="Add anything we missed"
        description="Your gym, your storage unit, the alumni association, the co-op board. Add it and it joins the checklist with everything else."
      >
        <Card className="p-5">
          {state.customTasks.length > 0 && (
            <ul className="mb-5 space-y-2">
              {state.customTasks.map((task) => (
                <li
                  key={task.id}
                  className="flex items-center justify-between gap-3 rounded-xl bg-surface-sunk px-3.5 py-2.5"
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-medium text-charcoal-900">
                      {task.title}
                    </span>
                    <span className="text-xs text-charcoal-500">
                      {CATEGORIES.find((c) => c.id === task.category)?.label ?? task.category}
                    </span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeCustomTask(task.id)}
                    aria-label={`Remove ${task.title}`}
                    className="shrink-0 rounded-full p-1.5 text-charcoal-400 transition-colors hover:bg-destructive-50 hover:text-destructive-600"
                  >
                    <X size={15} />
                  </button>
                </li>
              ))}
            </ul>
          )}

          <form onSubmit={submit} className="grid gap-3 sm:grid-cols-[1fr_auto_auto] sm:items-end">
            <Field label="What needs updating?">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Planet Fitness membership"
                maxLength={80}
              />
            </Field>
            <Field label="Category">
              <Select value={category} onChange={(e) => setCategory(e.target.value as CategoryId)}>
                {CATEGORIES.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Button type="submit" disabled={!title.trim()} className="sm:mb-0">
              <Plus size={15} /> Add
            </Button>
          </form>
        </Card>
      </PremiumGate>
    </section>
  );
}
