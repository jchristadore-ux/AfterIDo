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
      intro="The short version: your name-change details stay in your browser, we never ask for the numbers that matter most, and the only thing we keep is an email address and whether you bought Premium."
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
            Everything you enter to build your plan — your current and new name, date of birth,
            address, phone number, email address, marriage date and place, spouse’s name, which
            circumstances apply to you, your progress on each task, your notes, and any reminders
            you set — is stored in your own browser using local storage.
          </p>
          <p>
            <strong className="font-medium text-charcoal-900">
              This information is not transmitted to us and we cannot see it.
            </strong>{' '}
            It stays on the device you typed it on. Clearing your browser data deletes it, and we
            have no copy to restore.
          </p>
          <p>
            Files you add to your document vault are held in your browser’s memory for that tab
            only. They are never uploaded and never written to disk by us. Reloading the page drops
            the file contents; only the file name and what it is for remain in your plan.
          </p>
        </Section>

        <Section heading="Information we do collect">
          <p>If you create an account, we store on our server:</p>
          <ul className="list-disc space-y-1.5 pl-5">
            <li>Your email address, so we can send a sign-in link and a receipt.</li>
            <li>Whether you have bought Premium, and the date.</li>
            <li>An identifier from Stripe for your payment, so a refund can be matched to you.</li>
            <li>
              If you turn on email reminders: the date each reminder should send and the short text
              you chose to be reminded about.
            </li>
          </ul>
          <p>
            That is the complete list. There is no field on our server for your name, address, date
            of birth or marriage details.
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
            provider for sign-in links and receipts, and Cloudflare for hosting. We may disclose
            information if required by law.
          </p>
        </Section>

        <Section heading="Keeping and deleting your information">
          <p>
            Your account is kept until you delete it. You can delete it yourself from your profile
            in the app, which removes your email address, your reminders and your sign-in tokens
            immediately. Payment records are retained without your email address attached, because
            records of financial transactions have their own retention obligations.
          </p>
          <p>
            To delete the information stored in your browser, use “Start over” in your profile, or
            clear site data in your browser.
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
