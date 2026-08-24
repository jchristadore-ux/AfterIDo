import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from './SiteChrome';

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
  return (
    <div className="min-h-dvh bg-canvas">
      <SiteHeader />

      <main className="container-page max-w-3xl py-14 sm:py-20">
        <header className="mb-12">
          {eyebrow && (
            <p className="mb-3 text-[0.7rem] font-semibold uppercase tracking-[0.16em] text-primary-600">
              {eyebrow}
            </p>
          )}
          <h1 className="text-balance text-4xl leading-tight text-charcoal-900 sm:text-5xl">
            {title}
          </h1>
          {intro && (
            <p className="mt-4 text-pretty text-lg leading-relaxed text-charcoal-700">{intro}</p>
          )}
        </header>

        {children}
      </main>

      <SiteFooter />
    </div>
  );
}
