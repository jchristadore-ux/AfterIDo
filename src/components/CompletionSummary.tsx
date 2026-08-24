import { Award, Download, Printer } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { PremiumGate } from './PremiumGate';
import { Button, Card } from './ui';
import { formatDate, fullName } from '@/lib/format';
import { CATEGORIES } from '@/data/categories';
import { isSettled } from '@/lib/progress';
import { LETTER_DISCLAIMER } from '@/lib/letters';

/**
 * What she gets at the end.
 *
 * A name change has no receipt. There is no single moment where anyone tells
 * you it is finished — you just stop finding things. This is the record: what
 * changed, where, and when each one was confirmed. Worth keeping, because
 * "when did you update your name with them?" is a question that comes back
 * months later.
 *
 * Generated entirely in the browser from the plan already on the device.
 */
export function CompletionSummary() {
  const { state, tasks, progress } = useApp();

  const settled = tasks.filter((t) => isSettled(t.state.status));
  const completedOnly = settled.filter((t) => t.state.status === 'complete');

  const summaryText = buildSummary();

  function buildSummary(): string {
    const lines: string[] = [
      'NAME CHANGE RECORD',
      '',
      `Previous name:  ${fullName(state.profile.currentName)}`,
      `New legal name: ${fullName(state.profile.newName)}`,
      `Married:        ${formatDate(state.profile.marriage.date)}`,
      `Record created: ${formatDate(new Date().toISOString().slice(0, 10))}`,
      '',
      `${completedOnly.length} of ${progress.total} updates completed.`,
      '',
    ];

    for (const category of CATEGORIES) {
      const inCategory = settled.filter((t) => t.category === category.id);
      if (inCategory.length === 0) continue;
      lines.push(category.label.toUpperCase(), '');
      for (const task of inCategory) {
        const when = task.state.completedAt
          ? formatDate(task.state.completedAt.slice(0, 10), 'short')
          : '—';
        const mark = task.state.status === 'complete' ? '[x]' : '[–]';
        lines.push(`  ${mark} ${task.title.padEnd(44)} ${when}`);
        for (const instance of task.state.instances.filter((i) => i.done)) {
          lines.push(`        · ${instance.label}`);
        }
      }
      lines.push('');
    }

    lines.push('---', LETTER_DISCLAIMER);
    return lines.join('\n');
  }

  function download() {
    const blob = new Blob([summaryText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'name-change-record.txt';
    anchor.click();
    URL.revokeObjectURL(url);
  }

  return (
    <PremiumGate
      feature="packet"
      title="Your completion record"
      description="A dated record of every change you made and when it was confirmed — worth keeping for the questions that come back six months later."
    >
      <Card className="overflow-hidden print-page">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-charcoal-100 bg-sage-50 px-6 py-5">
          <div className="flex items-center gap-3">
            <Award size={22} className="shrink-0 text-sage-600" />
            <div>
              <p className="font-display text-lg text-charcoal-900">Name change record</p>
              <p className="text-sm text-charcoal-700">
                {completedOnly.length} update{completedOnly.length === 1 ? '' : 's'} completed
                {settled.length > completedOnly.length &&
                  `, ${settled.length - completedOnly.length} marked not applicable`}
              </p>
            </div>
          </div>
          <div className="flex gap-2 no-print">
            <Button size="sm" variant="ghost" onClick={download}>
              <Download size={15} className="mr-1.5" />
              Download
            </Button>
            <Button size="sm" variant="secondary" onClick={() => window.print()}>
              <Printer size={15} className="mr-1.5" />
              Print
            </Button>
          </div>
        </div>

        <pre className="overflow-x-auto whitespace-pre-wrap break-words px-6 py-6 font-body text-sm leading-relaxed text-charcoal-900">
          {summaryText}
        </pre>
      </Card>
    </PremiumGate>
  );
}
