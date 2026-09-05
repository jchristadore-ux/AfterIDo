import type { ReactNode } from 'react';
import { SITE } from '@/config/site';
import { useAccount } from '@/store/AccountContext';

export function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="border-t border-charcoal-100 pt-7">
      <h2 className="text-xl text-charcoal-900">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-charcoal-700">{children}</div>
    </section>
  );
}

export function Updated() {
  return (
    <p className="text-sm text-charcoal-400">Last updated {SITE.legalLastUpdated}</p>
  );
}

export function SupportAddress() {
  const { config } = useAccount();
  const email = config.supportEmail || SITE.supportEmailFallback;
  if (!email) return <span>our contact page</span>;
  return (
    <a href={`mailto:${email}`} className="underline underline-offset-2">
      {email}
    </a>
  );
}
