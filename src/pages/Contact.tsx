import { Link } from 'react-router-dom';
import { Mail } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Callout, Card } from '@/components/ui';
import { SITE } from '@/config/site';
import { useAccount } from '@/store/AccountContext';
import { PAGE_META } from '@shared/seo';

/**
 * Contact page.
 *
 * When this deployment has accounts/payments off, do not promise purchase,
 * refund, or profile-deletion flows — mirror the honesty pattern on /premium.
 */
export function Contact() {
  const { config } = useAccount();
  const email = config.supportEmail || SITE.supportEmailFallback;

  return (
    <MarketingShell
      eyebrow="Contact"
      title="Get in touch"
      intro="A real person reads these. We usually reply within two business days."
    >
      <Seo title={PAGE_META['/contact'].title} description={PAGE_META['/contact'].description} />

      <div className="space-y-6">
        <Card className="p-6">
          <Mail size={20} className="text-primary-600" />
          {email ? (
            <>
              <p className="mt-3 text-lg text-charcoal-900">
                <a href={`mailto:${email}`} className="underline underline-offset-4">
                  {email}
                </a>
              </p>
              {config.accounts && config.payments ? (
                <p className="mt-2 text-sm text-charcoal-500">
                  Include the email address on your account if your question is about a purchase.
                </p>
              ) : config.accounts ? (
                <p className="mt-2 text-sm text-charcoal-500">
                  Include the email address on your account if your question is about your account.
                </p>
              ) : null}
            </>
          ) : (
            <p className="mt-3 leading-relaxed text-charcoal-700">
              A contact address has not been configured on this deployment yet.
            </p>
          )}
        </Card>

        {!config.payments && !config.accounts && (
          <Callout tone="champagne" title="Purchases and accounts aren’t available here">
            This deployment does not offer accounts or Premium checkout, so there is nothing to buy,
            refund, or wipe from a profile. Reach out about the product itself — a dead link, a wrong
            requirement, or a question about how the checklist works.
          </Callout>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {config.payments && (
            <Card className="p-5">
              <h2 className="text-lg text-charcoal-900">Refunds</h2>
              <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
                Within {SITE.refundWindowDays} days of buying Premium, ask and we’ll refund it. No
                reason needed.
              </p>
            </Card>
          )}
          <Card className="p-5">
            <h2 className="text-lg text-charcoal-900">Something looks wrong</h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              A dead link or an out-of-date requirement is worth telling us about — say which task
              and what you found.
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg text-charcoal-900">Delete my data</h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              {config.accounts ? (
                <>
                  You can do it yourself in your profile, or ask us and we’ll do it.{' '}
                </>
              ) : (
                <>
                  Plan details live only in your browser — use “Start over” in the app or clear site
                  data. There is no account profile on this deployment; write to us if you need
                  anything else removed.{' '}
                </>
              )}
              <Link to="/privacy" className="underline underline-offset-2">
                Privacy policy
              </Link>
            </p>
          </Card>
          <Card className="p-5">
            <h2 className="text-lg text-charcoal-900">What we can’t help with</h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              We can’t contact an agency for you, check your application status, or give legal
              advice.{' '}
              <Link to="/disclaimer" className="underline underline-offset-2">
                Why not
              </Link>
            </p>
          </Card>
        </div>
      </div>
    </MarketingShell>
  );
}
