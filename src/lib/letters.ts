import type { Profile } from '@/types';
import { addressBlock, formatDate, formatPhone, fullName } from './format';

/**
 * Notification letters.
 *
 * ── What these are ────────────────────────────────────────────────────────
 * Courtesy letters *from her*, on her own behalf, telling an organization that
 * her legal name has changed. They are not government forms and they are not
 * reproductions of one. Where a real form exists — SS-5, DS-5504, DS-82 — the
 * app links to the agency's own copy instead, because a form we typed out
 * would be out of date the moment the agency revised it.
 *
 * ── The bracket convention ────────────────────────────────────────────────
 * Anything AfterIDo cannot know appears as `[Add your account number]` rather
 * than being guessed or silently omitted. A blank in a letter is invisible; a
 * bracket is not, which is what stops one being posted half-finished.
 *
 * Every template refuses to invent a requirement: none of them claims a legal
 * obligation to respond, none of them cites a statute, and none promises a
 * timeframe.
 */

export type LetterTemplateId = 'employer' | 'bank' | 'insurance' | 'general';

export interface LetterTemplate {
  id: LetterTemplateId;
  label: string;
  blurb: string;
  /** What to say about who this goes to, shown above the recipient field. */
  recipientLabel: string;
  recipientPlaceholder: string;
  note?: string;
  build: (profile: Profile, recipient: string) => string;
}

function today(): string {
  return new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
}

function identityBlock(profile: Profile, extra: [string, string][] = []): string[] {
  const rows: [string, string][] = [
    ['Previous name', fullName(profile.currentName)],
    ['New legal name', fullName(profile.newName)],
    ['Date of birth', formatDate(profile.dateOfBirth)],
    ['Address', addressBlock(profile.address).split('\n').join(', ')],
    ['Phone', formatPhone(profile.phone)],
    ['Email', profile.email],
    ...extra,
  ];
  const width = Math.max(...rows.map(([label]) => label.length)) + 2;
  return rows.map(([label, value]) => `    ${`${label}:`.padEnd(width)}${value || '[Add this]'}`);
}

function heading(recipient: string, subject: string, fallback: string): string[] {
  return [
    today(),
    '',
    recipient || fallback,
    '[Address]',
    '',
    `Re: ${subject}`,
    '',
    'To whom it may concern,',
    '',
  ];
}

function signOff(profile: Profile): string[] {
  return ['Thank you for your help.', '', 'Sincerely,', '', '', fullName(profile.newName)];
}

function changeSentence(profile: Profile): string {
  return `My legal name has changed from ${fullName(profile.currentName)} to ${fullName(
    profile.newName,
  )} following my marriage on ${formatDate(profile.marriage.date)}.`;
}

export const LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'employer',
    label: 'Employer / HR',
    blurb:
      'For your HR or payroll team. Asks them to update payroll, benefits, your retirement plan and your work email in one go.',
    recipientLabel: 'Who is this going to?',
    recipientPlaceholder: 'Human Resources, Acme Corporation',
    note: 'Update Social Security first. Payroll records that disagree with the federal record can hold up your W-2.',
    build: (profile, recipient) =>
      [
        ...heading(recipient, 'Legal name change — employee records', '[Human Resources]'),
        changeSentence(profile),
        '',
        'Please update my employee records, and let me know whether anything further is needed from me for each of the following:',
        '',
        '    •  Payroll and my W-4',
        '    •  Health, dental and vision enrollment, and any dependents',
        '    •  Life and disability coverage, and my named beneficiaries',
        '    •  My retirement plan and its beneficiaries',
        '    •  Work email address, directory listing and building access',
        '    •  Any professional certifications or licences held through the company',
        '',
        'My details, so you can locate my record:',
        '',
        ...identityBlock(profile, [['Employee ID', '[Add your employee ID]']]),
        '',
        'I have already updated my name with the Social Security Administration. A copy of my certified marriage certificate is enclosed.',
        '',
        ...signOff(profile),
      ].join('\n'),
  },
  {
    id: 'bank',
    label: 'Bank / credit union',
    blurb:
      'For a bank, credit union or card issuer. Asks for reissued cards and checks, and covers joint accounts and beneficiaries.',
    recipientLabel: 'Which institution?',
    recipientPlaceholder: 'Customer Service, First National Bank',
    note: 'Most banks want to see the certified marriage certificate in a branch or through their secure upload — not by post. Call first.',
    build: (profile, recipient) =>
      [
        ...heading(recipient, 'Legal name change on my accounts', '[Bank name]'),
        changeSentence(profile),
        '',
        'Please update my name on all accounts I hold with you, including any joint accounts, and reissue anything that carries my name:',
        '',
        '    •  Debit and credit cards',
        '    •  Checks',
        '    •  Statements and online banking',
        '    •  Beneficiary designations, where I am the account holder',
        '',
        'My details:',
        '',
        ...identityBlock(profile, [['Account number(s)', '[Add your account numbers]']]),
        '',
        'Please confirm in writing once the change is complete, and tell me if you need to see the certified marriage certificate in person or through your secure upload.',
        '',
        ...signOff(profile),
      ].join('\n'),
  },
  {
    id: 'insurance',
    label: 'Insurance',
    blurb:
      'For health, auto, home, renters or life insurance. Asks for a reissued card or policy document, and prompts a beneficiary review.',
    recipientLabel: 'Which insurer?',
    recipientPlaceholder: 'Policy Services, Example Insurance',
    note: 'Marriage is usually a qualifying life event, which can open a short window to change coverage. Ask about it in the same message.',
    build: (profile, recipient) =>
      [
        ...heading(recipient, 'Legal name change on my policy', '[Insurance company]'),
        changeSentence(profile),
        '',
        'Please update my name on my policy and reissue my insurance card and policy documents.',
        '',
        'I would also like to confirm:',
        '',
        '    •  That my beneficiaries are recorded as I intend',
        '    •  Whether my marriage is a qualifying life event for this policy, and by when I would need to make any change to coverage',
        '    •  Whether anyone else on the policy needs to be updated',
        '',
        'My details:',
        '',
        ...identityBlock(profile, [
          ['Policy number', '[Add your policy number]'],
          ['Group number', '[If applicable]'],
        ]),
        '',
        'A copy of my certified marriage certificate is enclosed.',
        '',
        ...signOff(profile),
      ].join('\n'),
  },
  {
    id: 'general',
    label: 'General account notice',
    blurb:
      'For anything else that holds an account in your name — a utility, a subscription, a doctor’s office, a landlord, a membership.',
    recipientLabel: 'Who is this going to?',
    recipientPlaceholder: 'Organization name',
    build: (profile, recipient) =>
      [
        ...heading(recipient, 'Legal name change on my account', '[Organization name]'),
        changeSentence(profile),
        '',
        'Please update your records for my account accordingly. My details are below so you can locate it:',
        '',
        ...identityBlock(profile, [['Account number', '[Add your account number]']]),
        '',
        'A copy of my certified marriage certificate is enclosed. Please confirm in writing once your records have been updated, and reissue any cards or documents that display my name.',
        '',
        ...signOff(profile),
      ].join('\n'),
  },
];

export const LETTER_BY_ID: Record<LetterTemplateId, LetterTemplate> = Object.fromEntries(
  LETTER_TEMPLATES.map((t) => [t.id, t]),
) as Record<LetterTemplateId, LetterTemplate>;

/**
 * The line that goes at the foot of every downloaded or printed letter.
 *
 * It exists because a letter is the one thing from AfterIDo that leaves the
 * app and is read by someone else. It must not look like it came from an
 * agency, and it must not look like a legal instrument.
 */
export const LETTER_DISCLAIMER =
  'This letter was drafted using AfterIDo, an organizational tool. AfterIDo is not a government agency or a law firm, this is not legal advice, and no organization is obliged to act on it. Read it before you send it, and replace anything in [brackets].';

/** Letters download as plain .txt so they open and edit anywhere. */
export function letterFileName(templateId: LetterTemplateId, recipient: string): string {
  const who = recipient.trim().replace(/[^A-Za-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
  return `name-change-letter-${templateId}${who ? `-${who}` : ''}.txt`.toLowerCase();
}
