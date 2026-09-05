import { AlertTriangle } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Seo } from '@/components/Seo';
import { Card } from '@/components/ui';
import { PAGE_META } from '@shared/seo';
import { Section, SupportAddress, Updated } from '@/pages/legalHelpers';

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
