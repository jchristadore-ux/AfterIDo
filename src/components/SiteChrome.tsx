import { Link } from 'react-router-dom';
import { useApp } from '@/store/AppContext';
import { useAccount } from '@/store/AccountContext';
import { WordmarkLink } from './Wordmark';
import { LinkButton } from './ui';
import { DISCLAIMER_TEXT } from './Disclaimer';

/**
 * The header and footer every public page shares.
 *
 * They were duplicated between the landing page and MarketingShell; the legal
 * pages made that a liability, because a footer that is missing the privacy
 * link on one page is a footer that is missing it where it matters.
 */

export function SiteHeader() {
  const { state } = useApp();
  const { account, config } = useAccount();

  return (
    <header className="sticky top-0 z-40 border-b border-charcoal-100/70 bg-canvas/80 backdrop-blur-md">
      <div className="container-page flex h-16 items-center justify-between">
        <WordmarkLink />
        <nav className="flex items-center gap-1 sm:gap-3">
          <Link
            to="/how-it-works"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-surface-sunk sm:block"
          >
            How it works
          </Link>
          <Link
            to="/premium"
            className="hidden rounded-full px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-surface-sunk sm:block"
          >
            Pricing
          </Link>
          {config.accounts && !account && (
            <Link
              to="/sign-in"
              className="rounded-full px-3 py-2 text-sm font-medium text-charcoal-700 hover:bg-surface-sunk"
            >
              Sign in
            </Link>
          )}
          <LinkButton to={state.onboarded ? '/app' : '/start'} size="sm">
            {state.onboarded ? 'Open my plan' : 'Start free'}
          </LinkButton>
        </nav>
      </div>
    </header>
  );
}

const FOOTER_LINKS: { to: string; label: string }[] = [
  { to: '/how-it-works', label: 'How it works' },
  { to: '/premium', label: 'Pricing' },
  { to: '/trust', label: 'Privacy & trust' },
  { to: '/privacy', label: 'Privacy policy' },
  { to: '/terms', label: 'Terms' },
  { to: '/disclaimer', label: 'Disclaimer' },
  { to: '/contact', label: 'Contact' },
];

export function SiteFooter() {
  return (
    <footer className="border-t border-charcoal-100 py-10">
      <div className="container-page">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <WordmarkLink />
          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-charcoal-500">
            {FOOTER_LINKS.map(({ to, label }) => (
              <Link key={to} to={to} className="hover:text-charcoal-900">
                {label}
              </Link>
            ))}
            <a
              href="https://www.usa.gov/name-change"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-charcoal-900"
            >
              Official name-change info
            </a>
          </nav>
        </div>

        <p className="mt-8 max-w-3xl text-xs leading-relaxed text-charcoal-400">
          {DISCLAIMER_TEXT}
        </p>
        <p className="mt-2 text-xs text-charcoal-400">
          © {new Date().getFullYear()} AfterIDo
        </p>
      </div>
    </footer>
  );
}
