import { Link } from 'react-router-dom';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { SITE } from '@/config/site';
import { PAGE_META } from '@shared/seo';
import { Section, SupportAddress, Updated } from '@/pages/legalHelpers';

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
