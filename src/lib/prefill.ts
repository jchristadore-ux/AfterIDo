import type { PrefillFieldKey, Profile } from '@/types';
import { addressBlock, formatDate, formatPhone, fullName, marriagePlace } from './format';

/**
 * The "Prepare Everything For Me" engine.
 *
 * A single mapping from profile → the field values every organization asks for.
 * Every screen that shows the user something to copy goes through here, which
 * is what guarantees she never types her middle name twice.
 */

export interface PrefillField {
  key: PrefillFieldKey;
  label: string;
  value: string;
  /** Multi-line values render in a <pre>-ish block rather than one line. */
  multiline?: boolean;
  /** True when the profile has nothing for this field yet. */
  missing: boolean;
}

const LABELS: Record<PrefillFieldKey, string> = {
  currentFullName: 'Previous legal name',
  newFullName: 'New legal name',
  currentFirst: 'Previous first name',
  currentMiddle: 'Previous middle name',
  currentLast: 'Previous last name',
  newFirst: 'New first name',
  newMiddle: 'New middle name',
  newLast: 'New last name',
  dateOfBirth: 'Date of birth',
  addressBlock: 'Mailing address',
  addressLine1: 'Street address',
  city: 'City',
  state: 'State',
  zip: 'ZIP code',
  phone: 'Phone',
  email: 'Email',
  marriageDate: 'Date of marriage',
  marriagePlace: 'Place of marriage',
  spouseName: 'Spouse’s name',
};

function rawValue(key: PrefillFieldKey, p: Profile): string {
  switch (key) {
    case 'currentFullName':
      return fullName(p.currentName);
    case 'newFullName':
      return fullName(p.newName);
    case 'currentFirst':
      return p.currentName.first;
    case 'currentMiddle':
      return p.currentName.middle;
    case 'currentLast':
      return p.currentName.last;
    case 'newFirst':
      return p.newName.first;
    case 'newMiddle':
      return p.newName.middle;
    case 'newLast':
      return p.newName.last;
    case 'dateOfBirth':
      return formatDate(p.dateOfBirth);
    case 'addressBlock':
      return addressBlock(p.address);
    case 'addressLine1':
      return [p.address.line1, p.address.line2].filter(Boolean).join(' ');
    case 'city':
      return p.address.city;
    case 'state':
      return p.address.state;
    case 'zip':
      return p.address.zip;
    case 'phone':
      return formatPhone(p.phone);
    case 'email':
      return p.email;
    case 'marriageDate':
      return formatDate(p.marriage.date);
    case 'marriagePlace':
      return marriagePlace(p);
    case 'spouseName':
      return p.marriage.spouseName;
  }
}

export function buildPrefill(keys: PrefillFieldKey[], profile: Profile): PrefillField[] {
  return keys.map((key) => {
    const value = rawValue(key, profile).trim();
    return {
      key,
      label: LABELS[key],
      value,
      multiline: key === 'addressBlock',
      missing: value.length === 0,
    };
  });
}

/** One clipboard blob for "Copy everything" — labelled so it pastes readably. */
export function prefillAsText(fields: PrefillField[]): string {
  return fields
    .filter((f) => !f.missing)
    .map((f) => `${f.label}: ${f.value.replace(/\n/g, ', ')}`)
    .join('\n');
}

/**
 * A ready-to-send notification letter for organizations that accept written
 * notice (banks, landlords, memberships, utilities).
 *
 * Deliberately generic and non-legal: this is a courtesy letter she could have
 * written herself, never a government form. AfterIDo does not generate or
 * imitate official agency forms.
 */
export function notificationLetter(profile: Profile, recipient: string): string {
  const today = new Date().toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });

  return [
    today,
    '',
    recipient || '[Organization name]',
    '[Address]',
    '',
    'Re: Legal name change on my account',
    '',
    'To whom it may concern,',
    '',
    `I am writing to notify you that my legal name has changed from ${fullName(
      profile.currentName,
    )} to ${fullName(profile.newName)} following my marriage on ${formatDate(
      profile.marriage.date,
    )}.`,
    '',
    'Please update your records for my account accordingly. My details are below so you can locate the account:',
    '',
    `    Previous name:   ${fullName(profile.currentName)}`,
    `    New legal name:  ${fullName(profile.newName)}`,
    `    Date of birth:   ${formatDate(profile.dateOfBirth)}`,
    `    Address:         ${addressBlock(profile.address).split('\n').join(', ')}`,
    `    Phone:           ${formatPhone(profile.phone)}`,
    `    Email:           ${profile.email}`,
    '    Account number:  [Add your account number]',
    '',
    'A copy of my certified marriage certificate is enclosed. Please confirm in writing once your records have been updated, and reissue any cards or documents that display my name.',
    '',
    'Thank you for your help.',
    '',
    'Sincerely,',
    '',
    '',
    fullName(profile.newName),
  ].join('\n');
}
