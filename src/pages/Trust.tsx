import { Ban, Database, FileWarning, KeyRound, ShieldCheck } from 'lucide-react';
import { MarketingShell } from '@/components/MarketingShell';
import { Callout, Card } from '@/components/ui';
import { DISCLAIMER_TEXT } from '@/components/Disclaimer';

export function Trust() {
  return (
    <MarketingShell
      eyebrow="Privacy & trust"
      title="What we ask for, what we don’t, and where it goes."
      intro="A name change touches the most sensitive records you have. Here is exactly how NameDay treats them — including the parts that aren’t finished yet."
    >
      <div className="space-y-10">
        <Callout tone="rose" icon={<ShieldCheck size={16} />} title="The short version">
          We never ask for your Social Security number, driver’s license number, or any account
          number. In this build, nothing you type leaves your device — there is no server. Files
          you add to the vault stay in the browser tab and are never written to disk.
        </Callout>

        <section>
          <h2 className="text-2xl text-ink-900">What we never collect</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              ['Social Security numbers', 'Tasks tell you to have yours on hand. We never store it.'],
              ['Driver’s license numbers', 'Your state agency already has it.'],
              ['Bank or card numbers', 'You add a bank by name only — "Chase checking".'],
              ['Passwords or logins', 'NameDay never signs in to anything on your behalf.'],
            ].map(([title, body]) => (
              <Card key={title} className="p-5">
                <p className="flex items-center gap-2 font-medium text-ink-900">
                  <Ban size={15} className="shrink-0 text-clay-600" />
                  {title}
                </p>
                <p className="mt-1.5 text-sm text-ink-600">{body}</p>
              </Card>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-2xl text-ink-900">What we do collect, and why</h2>
          <p className="mt-2 leading-relaxed text-ink-600">
            Your name, date of birth, address, contact details and marriage information — because
            every agency asks for exactly those, and typing them once instead of thirty times is
            the entire point of the app.
          </p>
          <Card className="mt-5 p-5">
            <p className="flex items-center gap-2 font-medium text-ink-900">
              <Database size={16} className="text-rose-600" /> Where it lives in this build
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              In your browser’s local storage, on this device only. There is no account, no
              server and no analytics on your profile. Clearing it from the profile page removes
              it completely — nothing is retained elsewhere because nothing was sent anywhere.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-ink-900">Documents you upload</h2>
          <Card className="mt-4 p-5">
            <p className="flex items-center gap-2 font-medium text-ink-900">
              <FileWarning size={16} className="text-amber-600" /> Deliberately temporary
            </p>
            <p className="mt-2 text-sm leading-relaxed text-ink-600">
              A marriage certificate plus a passport scan plus a Social Security card is
              everything an identity thief needs. A browser can’t give those files the protection
              they deserve, so this build doesn’t pretend it can: uploaded files stay in memory
              for the tab and vanish on reload. What persists is the metadata — file name, size,
              and which tasks it’s for — so your checklist still knows you have it.
            </p>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-ink-900">What production would add</h2>
          <p className="mt-2 leading-relaxed text-ink-600">
            The app is built against interfaces, not implementations, so these are swaps rather
            than rewrites. Being specific about what’s missing matters more than sounding secure.
          </p>
          <Card className="mt-5 p-5">
            <p className="flex items-center gap-2 font-medium text-ink-900">
              <KeyRound size={16} className="text-rose-600" /> The real deployment
            </p>
            <ul className="mt-3 space-y-2.5 text-sm leading-relaxed text-ink-600">
              {[
                'Authenticated accounts, with the profile held server-side and encrypted at rest.',
                'Uploads sent straight to object storage through short-lived signed URLs, encrypted with a per-tenant key, never passing through the app server.',
                'Signed, expiring download links and an audit log of every access.',
                'Reminders scheduled on a durable server-side queue, with email and push as opt-in channels.',
                'Payments through a hosted checkout, with entitlements granted only by verified webhook.',
              ].map((item) => (
                <li key={item} className="flex items-start gap-2.5">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-400" />
                  {item}
                </li>
              ))}
            </ul>
          </Card>
        </section>

        <section>
          <h2 className="text-2xl text-ink-900">Where our information comes from</h2>
          <p className="mt-2 leading-relaxed text-ink-600">
            Every requirement in NameDay traces back to an official source, and each task shows
            the date its guidance was last checked. Where we haven’t verified something — a state
            we haven’t researched yet — we say so instead of guessing. Every outbound link goes
            to a government agency or the company itself, never an affiliate.
          </p>
          <p className="mt-3 leading-relaxed text-ink-600">
            Requirements change without notice. The agency’s own page is always authoritative, and
            NameDay tells you to confirm there before you file.
          </p>
        </section>

        <section className="border-t border-ink-100 pt-6">
          <h2 className="text-lg text-ink-900">Legal</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-500">{DISCLAIMER_TEXT}</p>
          <p className="mt-3 text-sm leading-relaxed text-ink-500">
            Nothing in NameDay is legal, tax or financial advice. Decisions about property deeds,
            wills, beneficiary designations and tax filing status should be made with a qualified
            professional.
          </p>
        </section>
      </div>
    </MarketingShell>
  );
}
