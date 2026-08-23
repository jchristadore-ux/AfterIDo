import { NavLink, Outlet, useLocation } from 'react-router-dom';
import {
  FolderLock,
  House,
  ListChecks,
  UserRound,
  type LucideIcon,
} from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { Wordmark } from './Wordmark';
import { cx } from './ui';
import { Disclaimer } from './Disclaimer';

interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { to: '/app', label: 'Home', icon: House },
  { to: '/app/checklist', label: 'Checklist', icon: ListChecks },
  { to: '/app/documents', label: 'Documents', icon: FolderLock },
  { to: '/app/profile', label: 'Profile', icon: UserRound },
];

/**
 * Mobile-first chrome: a bottom tab bar on phones (thumb reach), a quiet
 * sidebar from `lg` up. Same routes, same order, no hamburger anywhere.
 */
export function AppShell() {
  const { state, progress } = useApp();
  const location = useLocation();

  return (
    <div className="min-h-dvh bg-paper lg:flex">
      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 border-r border-ink-100 bg-paper-raised px-5 py-7 lg:flex lg:flex-col">
        <Wordmark to="/app" />

        <nav className="mt-9 flex flex-col gap-1">
          {NAV.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/app'}
              className={({ isActive }) =>
                cx(
                  'flex items-center gap-3 rounded-xl px-3 py-2.5 text-[0.95rem] font-medium transition-colors',
                  isActive
                    ? 'bg-rose-50 text-rose-700'
                    : 'text-ink-700 hover:bg-paper-sunk hover:text-ink-900',
                )
              }
            >
              <Icon size={18} strokeWidth={1.9} />
              {label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto space-y-3 pt-6">
          <div className="rounded-2xl bg-paper-sunk p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-400">
              Progress
            </p>
            <p className="mt-1 font-display text-2xl text-ink-900">{progress.percent}%</p>
            <p className="text-xs text-ink-500">
              {progress.settled} of {progress.total} done
            </p>
          </div>
          {state.demoMode && (
            <p className="rounded-xl border border-amber-500/25 bg-amber-50 px-3 py-2 text-xs text-amber-700">
              Demo mode — sample data
            </p>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 border-b border-ink-100 bg-paper/85 backdrop-blur-md lg:hidden">
          <div className="flex items-center justify-between px-5 py-3.5">
            <Wordmark to="/app" size="sm" />
            <div className="flex items-center gap-2 text-xs text-ink-500">
              {state.demoMode && (
                <span className="rounded-full bg-amber-100 px-2 py-0.5 font-medium text-amber-700">
                  Demo
                </span>
              )}
              <span className="font-medium text-ink-700">{progress.percent}% done</span>
            </div>
          </div>
        </header>

        <main
          key={location.pathname}
          className="animate-rise flex-1 px-5 pt-6 pb-28 lg:px-10 lg:pt-10 lg:pb-14"
        >
          <div className="mx-auto w-full max-w-3xl xl:max-w-4xl">
            <Outlet />
            <Disclaimer className="mt-12" />
          </div>
        </main>

        {/* Mobile bottom tabs */}
        <nav className="safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-ink-100 bg-paper-raised/95 backdrop-blur-md lg:hidden">
          <div className="mx-auto grid max-w-lg grid-cols-4">
            {NAV.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/app'}
                className={({ isActive }) =>
                  cx(
                    'flex flex-col items-center gap-1 py-2.5 text-[0.68rem] font-medium transition-colors',
                    isActive ? 'text-rose-600' : 'text-ink-500',
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon size={21} strokeWidth={isActive ? 2.2 : 1.8} />
                    {label}
                  </>
                )}
              </NavLink>
            ))}
          </div>
        </nav>
      </div>
    </div>
  );
}
