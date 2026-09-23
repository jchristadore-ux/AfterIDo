import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Callout } from '@/components/ui';
import { SITE } from '@/config/site';
import { PAGE_META } from '@shared/seo';
import { Section, SupportAddress, Updated } from '@/pages/legalHelpers';

export function Privacy() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Privacy Policy"
      intro="The short version: we never ask for the numbers that matter most; guests keep the plan in the browser; signed-in accounts sync the plan to us so it restores on a new device; Premium vault files go to Cloudflare R2 scoped to your account; card data stays on Stripe."
    >
      <Seo title={PAGE_META['/privacy'].title} description={PAGE_META['/privacy'].description} />

      <div className="space-y-8">
        <Updated />

        <Callout tone="champagne" title="What we refuse to collect">
          AfterIDo never asks for — and has nowhere to put — your Social Security number, bank
          account numbers, credit card numbers, driver’s licence number, passport number, or any
          password. Tasks tell you to have those on hand for the agency; the app never asks you to
          type them in.
        </Callout>

        <Section heading="Who we are">
          <p>
            AfterIDo is operated by {SITE.legalEntity}. This policy covers the AfterIDo website and
            web app. Reach us at <SupportAddress />.
          </p>
        </Section>

        <Section heading="Information stored on your device">
          <p>
            Whether or not you have an account, the app keeps a local copy of your plan in your
            browser using local storage: your current and new name, date of birth, address, phone
            number, email address, marriage date and place, spouse’s name, circumstances, progress
            on each task, notes, custom tasks, and document metadata (file name, size, kind — not
            necessarily the file bytes).
          </p>
          <p>
            That local copy is a cache and offline fallback. Clearing site data or using “Start
            over” in your profile removes it from the device.
          </p>
        </Section>

        <Section heading="Information we store when you create an account">
          <p>If you create an account, we store on our servers (Cloudflare D1 and, for files, R2):</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your email address, so we can send a sign-in link and a receipt.</li>
            <li>Whether you have bought Premium, and the date.</li>
            <li>An identifier from Stripe for your payment, so a refund can be matched to you.</li>
            <li>
              If you turn on email reminders: the date each reminder should send and the short text
              you chose to be reminded about.
            </li>
            <li>
              Your synced plan JSON — the same checklist and profile fields listed above — so
              Premium and progress restore when you sign in on a new device.
            </li>
            <li>
              If you use the Premium document vault and storage is enabled on the deployment:
              uploaded file bytes in Cloudflare R2 under a key scoped to your account, plus
              metadata (file name, content type, size, kind) in D1. R2 encrypts objects at rest by
              default.
            </li>
          </ul>
          <p>
            Without an account, plan details and vault uploads are not sent to us (uploads stay in
            the browser tab only).
          </p>
        </Section>

        <Section heading="Payments">
          <p>
            Payments are processed by Stripe, Inc. You enter your card details on Stripe’s own
            hosted checkout page.{' '}
            <strong className="font-medium text-charcoal-900">
              Card numbers never pass through AfterIDo and we never store them.
            </strong>{' '}
            We receive confirmation from Stripe that a payment succeeded, along with the amount and
            a customer identifier. Stripe’s handling of your data is governed by{' '}
            <a
              href="https://stripe.com/privacy"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2"
            >
              Stripe’s privacy policy
            </a>
            .
          </p>
        </Section>

        <Section heading="Analytics">
          <p>
            We count how many people reach each part of the app — the landing page, the end of
            onboarding, the pricing page, checkout — so we know what is working. These counts carry
            no identifier of any kind: no user id, no session id, no IP address, no cookie, no
            device fingerprint, and nothing you typed. We cannot connect a count to a person, and
            neither can anyone who obtains the data.
          </p>
          <p>
            We do not use Google Analytics, advertising pixels, or any third-party tracking script.
          </p>
        </Section>

        <Section heading="Cookies">
          <p>
            One cookie, and only if you create an account: a signed session cookie so you stay
            signed in. It is marked HttpOnly and SameSite, which means scripts cannot read it and
            other sites cannot use it. There are no advertising or tracking cookies.
          </p>
        </Section>

        <Section heading="Sharing">
          <p>
            We do not sell your information, and we do not share it for advertising. The only third
            parties involved are the ones needed to run the service: Stripe for payments, our email
            provider for sign-in links and receipts, and Cloudflare for hosting, database, and
            object storage. We may disclose information if required by law.
          </p>
        </Section>

        <Section heading="Keeping and deleting your information">
          <p>
            Your account is kept until you delete it. You can delete it yourself from your profile
            in the app, which removes your email address, your reminders, your sign-in tokens, your
            synced plan, and your vault files and metadata. Payment records are retained without
            your email address attached, because records of financial transactions have their own
            retention obligations.
          </p>
          <p>
            To delete only the information stored in your browser, use “Start over” in your
            profile, or clear site data in your browser. That does not by itself delete the
            server-side plan while the account still exists.
          </p>
          <p>
            You can also ask us to delete your information by writing to <SupportAddress />.
            Depending on where you live you may have rights to access, correct, or export your
            information, or to object to its processing; the same address is how to exercise them.
          </p>
        </Section>

        <Section heading="Children">
          <p>
            AfterIDo is for adults changing their name after marriage and is not directed at
            children under 13. We do not knowingly collect information from them.
          </p>
        </Section>

        <Section heading="Changes">
          <p>
            If this policy changes materially, we will update the date at the top and, if you have
            an account, tell you by email before the change takes effect.
          </p>
        </Section>
      </div>
    </MarketingShell>
  );
}
