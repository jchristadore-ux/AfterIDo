import { useMemo, useState } from 'react';
import { Download, Info, Printer } from 'lucide-react';
import { useApp } from '@/store/AppContext';
import { PremiumGate } from '@/components/PremiumGate';
import {
  Button,
  Callout,
  Card,
  CopyButton,
  Field,
  Input,
  SectionHeading,
  Select,
  cx,
} from '@/components/ui';
import { LETTER_DISCLAIMER, LETTER_TEMPLATES, letterFileName } from '@/lib/letters';
import type { LetterTemplateId } from '@/lib/letters';
import { track } from '@/lib/analytics';

/**
 * Notification letters, ready to send.
 *
 * Everything is generated in the browser from the profile already on this
 * device — no request is made and nothing is uploaded. The download is a Blob
 * URL created and revoked here, which is also why it is plain text: a .txt
 * opens in every mail client, every word processor and every phone.
 */
export function Letters() {
  const { state } = useApp();
  const [templateId, setTemplateId] = useState<LetterTemplateId>('employer');
  const [recipient, setRecipient] = useState('');

  const template = LETTER_TEMPLATES.find((t) => t.id === templateId) ?? LETTER_TEMPLATES[0];
  const letter = useMemo(
    () => template.build(state.profile, recipient),
    [template, state.profile, recipient],
  );
  const full = `${letter}\n\n---\n${LETTER_DISCLAIMER}`;

  function download() {
    const blob = new Blob([full], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = letterFileName(template.id, recipient);
    anchor.click();
    URL.revokeObjectURL(url);
    track('letter_copied', { category: template.id });
  }

  return (
    <div className="space-y-6">
      <SectionHeading
        eyebrow="Premium"
        title="Notification letters"
        action={
          <Button variant="ghost" size="sm" onClick={() => window.print()} className="no-print">
            <Printer size={15} className="mr-1.5" />
            Print
          </Button>
        }
      />

      <PremiumGate
        feature="letters"
        title="Ready-to-send notification letters"
        description="Four templates — employer, bank, insurance and a general account notice — with your old name, new name, marriage date and contact details already filled in."
      >
        <div className="space-y-5">
          <Card className="p-5 no-print">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Which letter?">
                <Select
                  value={templateId}
                  onChange={(e) => setTemplateId(e.target.value as LetterTemplateId)}
                >
                  {LETTER_TEMPLATES.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.label}
                    </option>
                  ))}
                </Select>
              </Field>

              <Field label={template.recipientLabel} optional>
                <Input
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder={template.recipientPlaceholder}
                />
              </Field>
            </div>

            <p className="mt-3 text-sm leading-relaxed text-charcoal-500">{template.blurb}</p>

            {template.note && (
              <Callout tone="champagne" icon={<Info size={16} />} className="mt-4">
                {template.note}
              </Callout>
            )}
          </Card>

          <Card className="overflow-hidden print-page">
            <div className="flex items-center justify-between gap-3 border-b border-charcoal-100 bg-surface-sunk px-5 py-3 no-print">
              <p className="text-sm font-medium text-charcoal-700">Your letter</p>
              <div className="flex gap-2">
                <Button size="sm" variant="ghost" onClick={download}>
                  <Download size={15} className="mr-1.5" />
                  Download
                </Button>
                <CopyButton
                  value={full}
                  label="Copy letter"
                  onCopied={() => track('letter_copied', { category: template.id })}
                />
              </div>
            </div>

            <pre
              className={cx(
                'overflow-x-auto whitespace-pre-wrap break-words px-5 py-6 font-body text-sm leading-relaxed text-charcoal-900',
                'sm:px-7',
              )}
            >
              {letter}
            </pre>

            <p className="border-t border-charcoal-100 px-5 py-3 text-xs leading-relaxed text-charcoal-400 sm:px-7">
              {LETTER_DISCLAIMER}
            </p>
          </Card>

          <Callout tone="neutral" title="Before you send it">
            Replace anything in [brackets] — we can’t know your account number and we won’t guess
            it. Enclose a copy of your certified marriage certificate, never the original: several
            organizations keep what you send them.
          </Callout>
        </div>
      </PremiumGate>
    </div>
  );
}
