import { Link } from 'react-router-dom';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { LinkButton } from '@/components/ui';
import { useApp } from '@/store/AppContext';

/**
 * A real 404 rather than a silent redirect to the homepage.
 *
 * Redirecting an unknown URL to `/` hides broken links from us and confuses
 * search engines, which see a working page where there should be nothing.
 */
export function NotFound() {
  const { state } = useApp();

  return (
    <MarketingShell
      eyebrow="404"
      title="That page doesn’t exist"
      intro="The link may be out of date, or there may be a typo in the address."
    >
      <Seo title="Page not found" noindex />
      <div className="flex flex-col gap-3 sm:flex-row">
        <LinkButton to={state.onboarded ? '/app' : '/'}>
          {state.onboarded ? 'Open my plan' : 'Back to the homepage'}
        </LinkButton>
        <LinkButton to="/how-it-works" variant="secondary">
          How it works
        </LinkButton>
      </div>
      <p className="mt-8 text-sm text-charcoal-500">
        Looking for your state?{' '}
        <Link to="/name-change-after-marriage/new-jersey" className="underline underline-offset-4">
          Browse the state guides
        </Link>
        .
      </p>
    </MarketingShell>
  );
}
