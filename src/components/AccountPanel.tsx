import { useState } from 'react';
import { Link } from 'react-router-dom';
import { BellRing, LogOut, Sparkles, Trash2 } from 'lucide-react';
import { useAccount } from '@/store/AccountContext';
import { useApp } from '@/store/AppContext';
import { Badge, Button, Callout, Card, LinkButton, Modal, SectionHeading } from './ui';
import { buildReminderPayloads } from '@/lib/reminderSchedule';

/**
 * Your plan and your account, on the profile screen.
 *
 * The panel reflects the server's answer rather than offering a switch. There
 * is no "switch to Free" button any more: an entitlement you can toggle is not
 * an entitlement, and the old one existed only because there was no server to
 * ask.
 */
export function AccountPanel() {
  const { state, tasks } = useApp();
  const { account, config, plan, signOut, setRemindersOptIn, deleteAccount, busy } = useAccount();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [reminderError, setReminderError] = useState<string | null>(null);

  const premium = plan === 'premium';

  async function toggleReminders(next: boolean) {
    setReminderError(null);
    try {
      await setRemindersOptIn(next, next ? buildReminderPayloads(state.profile, tasks) : []);
    } catch {
      setReminderError('We couldn’t save that just now. Try again in a moment.');
    }
  }

  return (
    <div className="space-y-8">
      {/* ---------------------------------------------------------- Plan */}
      <section>
        <SectionHeading title="Your plan" className="mb-3" />
        <Card className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 font-medium text-charcoal-900">
                {premium ? 'Premium' : 'Free'}
                {state.demoMode && <Badge tone="champagne">Sample data</Badge>}
              </p>
              <p className="mt-1 text-sm text-charcoal-500">
                {premium
                  ? 'State guidance, the printable packet, letters, your document vault, reminders and custom tasks are unlocked.'
                  : 'The full checklist, the order of operations and prefill. Premium adds the packet, letters, vault, reminders and custom tasks.'}
              </p>
            </div>

            {!premium && (
              <LinkButton to="/premium" size="sm" className="shrink-0">
                <Sparkles size={14} /> See Premium
              </LinkButton>
            )}
          </div>

          {state.demoMode && (
            <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs leading-relaxed text-charcoal-400">
              You’re looking at sample data, so the Premium features are shown for the tour. Editing
              anything on this page switches to your own plan.
            </p>
          )}
        </Card>
      </section>

      {/* ------------------------------------------------------- Account */}
      {config.accounts && (
        <section>
          <SectionHeading title="Account" className="mb-3" />

          {account ? (
            <Card className="p-5">
              <p className="font-medium text-charcoal-900">{account.email}</p>
              <p className="mt-1 text-sm text-charcoal-500">
                Sign in with this address on another device and your Premium comes with you. Your
                checklist itself stays in each browser.
              </p>

              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="ghost" size="sm" onClick={() => void signOut()} disabled={busy}>
                  <LogOut size={14} /> Sign out
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-destructive-600"
                  onClick={() => setConfirmDelete(true)}
                >
                  <Trash2 size={14} /> Delete my account
                </Button>
              </div>
            </Card>
          ) : (
            <Card className="flex flex-wrap items-center justify-between gap-4 p-5">
              <div>
                <p className="font-medium text-charcoal-900">Not signed in</p>
                <p className="mt-1 text-sm text-charcoal-500">
                  An account is only needed so a Premium purchase survives a new phone. Your
                  checklist works without one.
                </p>
              </div>
              <LinkButton to="/create-account" size="sm" variant="secondary" className="shrink-0">
                Save my plan
              </LinkButton>
            </Card>
          )}
        </section>
      )}

      {/* ----------------------------------------------------- Reminders */}
      {config.accounts && account && premium && (
        <section>
          <SectionHeading title="Email reminders" className="mb-3" />
          <Card className="p-5">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                checked={account.remindersOptIn}
                onChange={(e) => void toggleReminders(e.target.checked)}
                className="mt-1 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                <span className="flex items-center gap-2 font-medium text-charcoal-900">
                  <BellRing size={15} className="text-primary-600" />
                  Email me when something is due
                </span>
                <span className="mt-1 block text-sm leading-relaxed text-charcoal-500">
                  A short nudge for the reminders you’ve set on individual tasks, plus one when a
                  waiting period is likely to be over. Nothing else — no newsletter, no marketing.
                </span>
              </span>
            </label>

            {reminderError && (
              <Callout tone="destructive" className="mt-4">
                {reminderError}
              </Callout>
            )}

            {!config.email && (
              <p className="mt-4 border-t border-charcoal-100 pt-3 text-xs text-charcoal-400">
                No mail provider is connected to this deployment yet, so reminders are queued but
                not delivered.
              </p>
            )}
          </Card>
        </section>
      )}

      <Modal
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete your account?"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                void deleteAccount();
                setConfirmDelete(false);
              }}
            >
              Delete my account
            </Button>
          </>
        }
      >
        <p className="text-charcoal-700">
          This removes your email address, your reminders and your sign-in tokens from our server
          immediately.
        </p>
        {premium && (
          <p className="mt-3 text-charcoal-700">
            <strong className="font-medium">Your Premium purchase goes with it.</strong> If you want
            a refund instead, ask us first — see the{' '}
            <Link to="/contact" className="underline underline-offset-2">
              contact page
            </Link>
            .
          </p>
        )}
        <p className="mt-3 text-sm text-charcoal-500">
          Your checklist stays in this browser. Use “Delete everything and start over” below to
          clear that too.
        </p>
      </Modal>
    </div>
  );
}
