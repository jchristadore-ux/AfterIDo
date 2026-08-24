import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Mail } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Callout, Card } from '@/components/ui';
import { SITE } from '@/config/site';
import { useAccount } from '@/store/AccountContext';
import { PAGE_META } from '@shared/seo';

/**
 * Privacy Policy, Terms of Service, Disclaimer and Contact.
 *
 * Written to describe what the application actually does, which is why they
 * are specific where a generic template would be vague — "we do not collect
 * your Social Security number" is a claim the data model backs up (see
 * src/types.ts: there is no field for one), not a comforting sentence.
 *
 * If you change what the app collects, change these. They are only worth
 * anything while they are accurate.
 */

function Section({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <section className="border-t border-charcoal-100 pt-7">
      <h2 className="text-xl text-charcoal-900">{heading}</h2>
      <div className="mt-3 space-y-3 leading-relaxed text-charcoal-700">{children}</div>
    </section>
  );
}

function Updated() {
  return (
    <p className="text-sm text-charcoal-400">Last updated {SITE.legalLastUpdated}</p>
  );
}

function SupportAddress() {
  const { config } = useAccount();
  const email = config.supportEmail || SITE.supportEmailFallback;
  if (!email) return <span>our contact page</span>;
  return (
    <a href={`mailto:${email}`} className="underline underline-offset-2">
      {email}
    </a>
  );
}

// ---------------------------------------------------------------------------
// Privacy
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Terms
// ---------------------------------------------------------------------------

export function Terms() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Terms of Service"
      intro="What you can expect from AfterIDo, and what we ask of you."
    >
      <Seo title={PAGE_META['/terms'].title} description={PAGE_META['/terms'].description} />

      <div className="space-y-8">
        <Updated />

        <Section heading="What AfterIDo is">
          <p>
            AfterIDo is an organizational tool. It builds a personalized checklist of the
            organizations that need to know about your name change, puts them in a workable order,
            fills your details in on each one, links you to official sources, and keeps track of
            what you have finished.
          </p>
          <p className="font-medium text-charcoal-900">
            AfterIDo is not a government agency, not a law firm, and not a legal service. Nothing
            in the app is legal advice. We cannot and do not submit a name change to any agency on
            your behalf.
          </p>
        </Section>

        <Section heading="Accuracy, and its limits">
          <p>
            We link only to official government sources and to the organizations themselves, and we
            note where each fact came from and when we last checked it. Requirements still change,
            sometimes without notice, and they vary by state and by county. Always confirm with the
            agency before making a trip or paying a fee.
          </p>
          <p>
            We do not guarantee that any agency, employer, bank, insurer or other organization will
            accept your name change, or accept it in the time frame the app estimates.
          </p>
        </Section>

        <Section heading="Your account">
          <p>
            An account is optional and exists so a Premium purchase survives a new device. You are
            responsible for the security of the email inbox the sign-in links go to. Tell us at{' '}
            <SupportAddress /> if you believe someone else has access to your account.
          </p>
        </Section>

        <Section heading="Premium, payment and refunds">
          <p>
            Premium is a one-time payment of $19.99 for the features listed on the{' '}
            <Link to="/premium" className="underline underline-offset-2">
              pricing page
            </Link>
            . It is not a subscription: you will not be charged again and there is nothing to
            cancel.
          </p>
          <p>
            If Premium is not what you expected, write to <SupportAddress /> within{' '}
            {SITE.refundWindowDays} days of your purchase and we will refund it. You do not need to
            give a reason.
          </p>
          <p>
            Prices are in US dollars. Payments are processed by Stripe and are also subject to
            Stripe’s terms.
          </p>
        </Section>

        <Section heading="Acceptable use">
          <p>
            Use AfterIDo for your own name change. Do not attempt to break, overload, or gain
            unauthorized access to the service or to other people’s accounts, and do not
            redistribute the content as your own product.
          </p>
        </Section>

        <Section heading="Availability">
          <p>
            We aim to keep AfterIDo running, but we do not promise uninterrupted availability. We
            may change or discontinue features. If we discontinue Premium features you have paid
            for within twelve months of your purchase, we will refund you.
          </p>
        </Section>

        <Section heading="Limitation of liability">
          <p>
            To the fullest extent the law allows, {SITE.legalEntity} is not liable for indirect or
            consequential losses arising from your use of AfterIDo — including a missed deadline, a
            rejected application, a wasted trip, or a fee paid to an agency. Our total liability to
            you is limited to the amount you paid us, which for most people is nothing and for
            Premium customers is $19.99.
          </p>
          <p>
            Nothing here limits liability that cannot be limited by law, including for fraud.
          </p>
        </Section>

        <Section heading="Governing law">
          <p>These terms are governed by the laws of {SITE.governingLaw}.</p>
        </Section>

        <Section heading="Changes">
          <p>
            We may update these terms. The date at the top shows when they last changed, and
            continuing to use AfterIDo after a change means you accept the updated terms.
          </p>
        </Section>
      </div>
    </MarketingShell>
  );
}

// ---------------------------------------------------------------------------
// Disclaimer
// ---------------------------------------------------------------------------

export function DisclaimerPage() {
  return (
    <MarketingShell
      eyebrow="Legal"
      title="Disclaimer"
      intro="Plainly, so there is no room for misunderstanding."
    >
      <Seo
        title={PAGE_META['/disclaimer'].title}
        description={PAGE_META['/disclaimer'].description}
      />

      <div className="space-y-8">
        <Updated />

        <Card className="border-champagne-500/30 bg-champagne-50 p-6">
          <AlertTriangle size={20} className="text-primary-600" />
          <ul className="mt-4 space-y-3 leading-relaxed text-charcoal-900">
            <li>
              <strong className="font-semibold">AfterIDo is not a government agency.</strong> We are
              not affiliated with, endorsed by, or acting on behalf of the Social Security
              Administration, the U.S. Department of State, the IRS, any state motor vehicle
              agency, or any other government body.
            </li>
            <li>
              <strong className="font-semibold">AfterIDo is not a law firm</strong> and does not
              provide legal advice. Nothing in the app creates an attorney–client relationship. If
              your situation is unusual — a court-ordered name change, an immigration matter, a
              dispute — talk to a lawyer.
            </li>
            <li>
              <strong className="font-semibold">
                AfterIDo cannot submit your name change for you.
              </strong>{' '}
              No agency offers a way for a third-party app to file on your behalf. Every form is
              signed and submitted by you.
            </li>
            <li>
              <strong className="font-semibold">
                We do not guarantee that any organization will accept your name change
              </strong>
              , or accept it within any particular time. Agencies set their own requirements and
              change them.
            </li>
          </ul>
        </Card>

        <Section heading="Where our information comes from">
          <p>
            Every link in the app points to a government agency or to the organization itself —
            never to an affiliate or a paid intermediary. Where a task states a requirement, it
            names the official page that requirement came from and the date we last checked it.
          </p>
          <p>
            We do not reproduce government forms. The app links to the real SS-5, DS-5504 and DS-82
            on the agencies’ own sites so you always get the current version.
          </p>
          <p>
            For states where we have not yet verified the local specifics, the app says so, and
            gives you the official state agency links rather than a confident-sounding guess.
          </p>
        </Section>

        <Section heading="Fees and processing times">
          <p>
            Any fee or time estimate in the app is an estimate. Agencies change fees and their
            queues move. Confirm the current figure with the agency before you rely on it.
          </p>
        </Section>

        <Section heading="Reporting something wrong">
          <p>
            If a link is dead, a requirement has changed, or something reads as though it applies
            to you when it does not, tell us at <SupportAddress />. Corrections are the most useful
            thing anyone sends us.
          </p>
        </Section>
      </div>
    </MarketingShell>
  );
}

// ---------------------------------------------------------------------------
// Contact
// ---------------------------------------------------------------------------

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
              <p className="mt-2 text-sm text-charcoal-500">
                Include the email address on your account if your question is about a purchase.
              </p>
            </>
          ) : (
            <p className="mt-3 leading-relaxed text-charcoal-700">
              A contact address has not been configured on this deployment yet.
            </p>
          )}
        </Card>

        <div className="grid gap-4 sm:grid-cols-2">
          <Card className="p-5">
            <h2 className="text-lg text-charcoal-900">Refunds</h2>
            <p className="mt-2 text-sm leading-relaxed text-charcoal-700">
              Within {SITE.refundWindowDays} days of buying Premium, ask and we’ll refund it. No
              reason needed.
            </p>
          </Card>
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
              You can do it yourself in your profile, or ask us and we’ll do it.{' '}
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
