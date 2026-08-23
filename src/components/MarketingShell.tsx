import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { Wordmark } from './Wordmark';
import { LinkButton } from './ui';
import { DISCLAIMER_TEXT } from './Disclaimer';

/** Header + footer chrome shared by the pages outside the signed-in app. */
export function MarketingShell({
  eyebrow,
  title,
  intro,
  children,
}: {
  eyebrow?: string;
  title: string;
  intro?: string;
  children: ReactNode;
}) {
  const { state } = useApp();

  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-40 border-b border-ink-100/70 bg-paper/80 backdrop-blur-md">
        <div className="container-page flex h-16 items-center justify-between">
          <Wordmark />
          <nav className="flex items-center gap-1 sm:gap-3">
            <Link
              to="/how-it-works"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-paper-sunk sm:block"
            >
              How it works
            </Link>
            <Link
              to="/pricing"
              className="hidden rounded-full px-3 py-2 text-sm font-medium text-ink-700 hover:bg-paper-sunk sm:block"
            >
              Pricing
            </Link>
            <LinkButton to={state.onboarded ? '/app' : '/start'} size="sm">
              {state.onboarded ? 'Open my plan' : 'Get started'}
            </LinkButton>
          </nav>
        </div>
      </header>

      <main className="container-page max-w-3xl py-14 sm:py-20">
        <header className="mb-12">
          {eyebrow && (
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-rose-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-balance text-4xl leading-tight text-ink-900 sm:text-5xl">{title}</h1>
          {intro && (
            <p className="mt-4 text-pretty text-lg leading-relaxed text-ink-600">{intro}</p>
          )}
        </header>

        {children}
      </main>

      <footer className="border-t border-ink-100 py-10">
        <div className="container-page">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <Wordmark />
            <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-ink-500">
              <Link to="/how-it-works" className="hover:text-ink-900">
                How it works
              </Link>
              <Link to="/pricing" className="hover:text-ink-900">
                Pricing
              </Link>
              <Link to="/trust" className="hover:text-ink-900">
                Privacy &amp; trust
              </Link>
            </nav>
          </div>
          <p className="mt-8 max-w-3xl text-xs leading-relaxed text-ink-400">{DISCLAIMER_TEXT}</p>
        </div>
      </footer>
    </div>
  );
}
