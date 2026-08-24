import { useState, type FormEvent } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowRight, MailCheck, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Button, Callout, Card, Field, Input } from '@/components/ui';
import { useAccount } from '@/store/AccountContext';
import { useApp } from '@/store/AppContext';
import { track } from '@/lib/analytics';
import { ApiError } from '@/lib/api';
import { Seo } from '@/components/Seo';

/**
 * One field, no password.
 *
 * A password is a thing to choose, remember, reuse and leak. The account here
 * exists for exactly one reason — so a Premium purchase survives a new phone —
 * so a link in the inbox that already receives the receipt is both simpler and
 * safer than anything we could ask her to invent.
 */
export function SignIn({ mode }: { mode: 'sign-in' | 'create' }) {
  const { config, requestSignInLink, busy } = useAccount();
  const { state } = useApp();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();

  const [email, setEmail] = useState(state.profile.email || '');
  const [sent, setSent] = useState(false);
  const [devLink, setDevLink] = useState<string | undefined>();
  const [error, setError] = useState<string | null>(linkError(params.get('error')));

  const next = safeNext(params.get('next')) ?? (mode === 'create' ? '/app' : '/app');
  const creating = mode === 'create';

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    try {
      const result = await requestSignInLink(email.trim(), next);
      setSent(true);
      setDevLink(result.devLink);
      if (creating) track('account_created');
    } catch (caught) {
      setError(
        caught instanceof ApiError
          ? caught.message
          : 'We could not send that link. Please try again.',
      );
    }
  }

  // On a static preview there is no server to create an account with. Say so
  // rather than showing a form that cannot work.
  if (!config.accounts) {
    return (
      <MarketingShell
        title="Accounts aren’t available here"
        intro="This preview of AfterIDo runs entirely in your browser, so there is nothing to sign in to. Your plan is saved on this device and everything free works normally."
      >
        <Seo title="Sign in" noindex />
        <Button onClick={() => navigate(state.onboarded ? '/app' : '/start')}>
          {state.onboarded ? 'Open my plan' : 'Start my name change'}
          <ArrowRight size={16} />
        </Button>
      </MarketingShell>
    );
  }

  if (sent) {
    return (
      <MarketingShell title="Check your email" intro={`We sent a sign-in link to ${email}.`}>
        <Seo title="Check your email" noindex />
        <Card className="p-6">
          <MailCheck size={22} className="text-sage-600" />
          <p className="mt-3 leading-relaxed text-charcoal-700">
            Open it on this device and you’ll land straight back in your plan. The link works once
            and expires in twenty minutes.
          </p>
          <p className="mt-4 text-sm text-charcoal-500">
            Nothing arrived? Check the spam folder, then{' '}
            <button
              type="button"
              onClick={() => setSent(false)}
              className="underline underline-offset-2 hover:text-charcoal-900"
            >
              try a different address
            </button>
            .
          </p>

          {devLink && (
            <Callout tone="champagne" title="Email isn’t connected yet" className="mt-5">
              This deployment has no mail provider configured, so here is the link directly. Set
              <code className="mx-1 rounded bg-surface-sunk px-1">RESEND_API_KEY</code>
              to have it emailed instead.
              <br />
              <a href={devLink} className="break-all">
                {devLink}
              </a>
            </Callout>
          )}
        </Card>
      </MarketingShell>
    );
  }

  return (
    <MarketingShell
      eyebrow={creating ? 'Almost there' : 'Welcome back'}
      title={creating ? 'Save your plan' : 'Sign in'}
      intro={
        creating
          ? 'One email address, so your checklist and anything you buy come with you to a new phone. No password to invent.'
          : 'Enter the email you used and we’ll send you a link. No password.'
      }
    >
      <Seo title={creating ? 'Create your account' : 'Sign in'} noindex />

      <Card className="p-6">
        <form onSubmit={submit} className="space-y-5">
          <Field label="Email address" hint="Used for your sign-in link and your receipt. Nothing else.">
            <Input
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </Field>

          {error && (
            <Callout tone="destructive" title="That didn’t work">
              {error}
            </Callout>
          )}

          <Button type="submit" block disabled={busy || email.trim().length < 5}>
            {busy ? 'Sending…' : 'Email me a sign-in link'}
          </Button>
        </form>

        <p className="mt-5 flex items-start gap-2.5 text-xs leading-relaxed text-charcoal-500">
          <ShieldCheck size={15} className="mt-px shrink-0 text-sage-600" />
          Your name, address and marriage details never leave this device. The only thing we keep on
          our side is your email address and whether you’ve bought Premium.{' '}
          <Link to="/privacy" className="underline underline-offset-2">
            Privacy policy
          </Link>
        </p>
      </Card>

      {creating && (
        <p className="mt-6 text-center text-sm text-charcoal-500">
          <button
            type="button"
            onClick={() => navigate(next, { replace: true, state: location.state })}
            className="underline underline-offset-4 hover:text-charcoal-900"
          >
            Skip for now — keep my plan on this device only
          </button>
        </p>
      )}

      {!creating && (
        <p className="mt-6 text-center text-sm text-charcoal-500">
          Haven’t started yet?{' '}
          <Link to="/start" className="underline underline-offset-4 hover:text-charcoal-900">
            Start my name change
          </Link>
        </p>
      )}
    </MarketingShell>
  );
}

function linkError(code: string | null): string | null {
  if (code === 'expired') return 'That sign-in link has already been used or has expired. Here is a fresh one.';
  if (code === 'missing') return 'That link was incomplete. Enter your email and we’ll send another.';
  return null;
}

/** Only same-site paths, so a crafted `?next=` can't bounce anyone off-site. */
function safeNext(next: string | null): string | null {
  if (!next || !next.startsWith('/') || next.startsWith('//')) return null;
  return next;
}
