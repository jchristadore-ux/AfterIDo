import { Link } from 'react-router-dom';
import { cx } from './ui';

export const DISCLAIMER_TEXT =
  'AfterIDo is not a government agency, law firm, or legal service. We help organize and simplify the name-change process and direct you to official sources. We cannot submit a name change on your behalf.';

/** Shown at the bottom of every screen in the app. Not dismissible. */
export function Disclaimer({ className }: { className?: string }) {
  return (
    <div className={cx('border-t border-charcoal-100 pt-5', className)}>
      <p className="text-xs leading-relaxed text-charcoal-400">
        {DISCLAIMER_TEXT}{' '}
        <Link to="/trust" className="underline underline-offset-2 hover:text-charcoal-700">
          How we handle your information
        </Link>
      </p>
    </div>
  );
}

/**
 * The honest label on every task: can AfterIDo prepare this, or must she file it
 * herself? Rendered wherever a task appears so the distinction is never buried.
 */
export function WeCanBadge({ weCan }: { weCan: 'prepare' | 'submit' }) {
  return weCan === 'prepare' ? (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-sage-300/60 bg-sage-50 px-2.5 py-0.5 text-xs font-medium text-sage-700">
      We prepare it · you submit
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-charcoal-200 bg-surface-sunk px-2.5 py-0.5 text-xs font-medium text-charcoal-700">
      You submit this yourself
    </span>
  );
}
