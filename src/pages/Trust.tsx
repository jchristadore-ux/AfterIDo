import { Link } from 'react-router-dom';
import { Ban, BarChart3, Database, FileWarning, KeyRound, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Callout, Card } from '@/components/ui';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer';
import { PAGE_META } from '@shared/seo';

export function Trust() {
  return (
    <MarketingShell
      eyebrow="Privacy & trust"
      title="What we ask for, what we don’t, and where it goes."
      intro="A name change touches the most sensitive records you have. Here is exactly how AfterIDo treats them — including what syncs when you create an account."
    >
      <Seo title={PAGE_META['/trust'].title} description={PAGE_META['/trust'].description} />

      <div className="space-y-10">
        <Callout tone="primary" icon={<ShieldCheck size={16} />} title="The short version">
          We never ask for your Social Security number, driver’s license number, account numbers, or
          passwords. Card payments stay on Stripe. Without an account, your checklist stays in this
          browser. When you create an account, your checklist and profile sync to our database so
          Premium and progress restore on a new device; Premium vault files go to Cloudflare R2
          scoped to your account — not only this tab.
        </Callout>

        <section>
          <h2 className="text-2xl text-charcoal-900">What we never collect</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Social Security numbers', 'Tasks tell you to have yours on hand. We never store it.'],
              ['Driver’s license numbers', 'Your state agency already has it.'],
              ['Bank or card numbers', 'You add a bank by name only — "Chase checking".'],
              ['Passwords or logins', 'AfterIDo never signs in to anything on your behalf.'],
            ].map(([title, body]) => (
              <Card key={title} className="p-5">
                <p className="flex items-center gap-2 font-medium text-charcoal-900">
                  <Ban size={15} className="shrink-0 text-destructive-600" />
                  {title}
                </p>
                <p className="mt-1.5 text-sm text-charcoal-700">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl text-charcoal-900">What we do collect, and why</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            Your name, date of birth, address, contact details and marriage information — because
            every agency asks for exactly those, and typing them once instead of thirty times is
            the entire point of the app.
          </p>
          <Card className="mt-5 p-5">
            <p className="flex items-center gap-2 font-medium text-charcoal-900">
              <Database size={16} className="text-primary-600" /> Where it lives
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              As a guest, everything you type stays in this browser’s local storage on this device.
              After you create an account, the same checklist and profile sync to Cloudflare D1 so
              signing in on a new phone restores your progress — not only your Premium entitlement.
              Clearing “Start over” in the profile removes the local copy; deleting the account
              removes the server copy.
            </p>
          </Card>

          <Card className="mt-4 p-5">
            <p className="flex items-center gap-2 font-medium text-charcoal-900">
              <KeyRound size={16} className="text-primary-600" /> What is on our server
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              If you create an account: your email address; whether you have Premium and when you
              bought it; a Stripe identifier so a refund can be matched; reminder dates and short
              titles if you turn reminders on; your synced plan JSON (names, address, marriage
              details, task progress — not file bytes); and metadata for vault files (name, size,
              type). That is the list.
            </p>
            <p className="mt-3 text-sm leading-relaxed text-charcoal-700">
              Card details never reach AfterIDo — payment happens on Stripe’s hosted page. The
              session cookie is HttpOnly and SameSite, so no script can read it.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-charcoal-900">Analytics</h2>
          <Card className="mt-4 p-5">
            <p className="flex items-center gap-2 font-medium text-charcoal-900">
              <BarChart3 size={16} className="text-primary-600" /> Counts, not people
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              We count how many people reach the landing page, finish onboarding, view the pricing
              page and buy. Those counts carry no user id, no session id, no IP address, no cookie
              and nothing you typed — so we cannot connect one to a person, and neither could
              anyone who obtained the data. No Google Analytics, no advertising pixel, no
              third-party tracking script anywhere in the app.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-charcoal-900">Documents you upload</h2>
          <Card className="mt-4 p-5">
            <p className="flex items-center gap-2 font-medium text-charcoal-900">
              <FileWarning size={16} className="text-champagne-500" /> Account vault (Premium)
            </p>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              When document storage is enabled and you are signed in with Premium, vault files are
              uploaded through our Worker into a Cloudflare R2 bucket under a key scoped to your
              account. R2 encrypts objects at rest by default. We do not add a second app-level
              encryption layer today. Only your session can download them; deleting a file or your
              account removes the object. Guests, demos, and deployments without the R2 binding
              still keep uploads in the tab only.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-charcoal-900">What we haven’t built</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            Being specific about what is missing matters more than sounding finished:
          </p>
          <Card className="mt-5 p-5">
            <ul className="space-y-2.5 text-sm leading-relaxed text-charcoal-700">
              {[
                'Per-file access audit logs in the product UI. Access is gated by session and account ownership; a durable access log table is a follow-up, not shipped here.',
                'Customer-managed encryption keys. Vault objects use R2’s default server-side encryption, not a key you bring or rotate yourself.',
                'Household / multi-person plans. Premium Plus is listed as coming later — this build is still one person, one account.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-charcoal-900">Where our information comes from</h2>
          <p className="mt-2 leading-relaxed text-charcoal-700">
            Every requirement in AfterIDo traces back to an official source, and each task shows
            the date its guidance was last checked. Where we haven’t verified something — a state
            we haven’t researched yet — we say so instead of guessing. Every outbound link goes
            to a government agency or the company itself, never an affiliate.
          </p>
          <p className="mt-3 leading-relaxed text-charcoal-700">
            Requirements change without notice. The agency’s own page is always authoritative, and
            AfterIDo tells you to confirm there before you file.
          </p>
        </section>

        <section className="border-t border-charcoal-100 pt-6">
          <h2 className="text-lg text-charcoal-900">Legal</h2>
          <p className="mt-2 text-sm leading-relaxed text-charcoal-500">{DISCLAIMER_TEXT}</p>
          <p className="mt-3 text-sm leading-relaxed text-charcoal-500">
            Nothing in AfterIDo is legal, tax or financial advice. Decisions about property deeds,
            wills, beneficiary designations and tax filing status should be made with a qualified
            professional.
          </p>
          <p className="mt-3 text-sm text-charcoal-500">
            <Link to="/privacy" className="underline underline-offset-2">Privacy policy</Link>
            {' · '}
            <Link to="/terms" className="underline underline-offset-2">Terms of service</Link>
            {' · '}
            <Link to="/disclaimer" className="underline underline-offset-2">Full disclaimer</Link>
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
