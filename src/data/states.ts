import type { OfficialLink, StateCode, StateProfile, StateTaskGuidance } from '@/types';

/**
 * State-specific requirements.
 *
 * Structure over content, on purpose: adding a state means adding one entry to
 * `STATE_GUIDANCE` — no component changes, no conditionals in the UI. New
 * Jersey is filled in fully as the reference implementation; every other state
 * falls back to `basicStateProfile`, which gives real, verified national
 * lookups rather than invented state detail.
 *
 * `coverage` drives an honesty banner in the UI: a user in a 'basic' state is
 * told plainly that we have not yet verified her state's specifics, instead of
 * being shown confident-sounding guesses.
 */

export const US_STATES: { code: StateCode; name: string }[] = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
];

export const STATE_NAME: Record<string, string> = Object.fromEntries(
  US_STATES.map((s) => [s.code, s.name]),
);

const NATIONAL_MV_FINDER: OfficialLink = {
  label: 'Find your state motor vehicle agency',
  url: 'https://www.usa.gov/motor-vehicle-services',
  source: 'USA.gov',
};

const NATIONAL_VOTER: OfficialLink = {
  label: 'Register to vote or update your registration',
  url: 'https://www.usa.gov/voter-registration',
  source: 'USA.gov',
};

/**
 * Motor vehicle agency homepages we have verified. Used to give 'basic'
 * coverage states a real starting link instead of a generic one. Anything not
 * listed here falls back to the USA.gov finder.
 */
const VERIFIED_MV_AGENCY: Partial<Record<StateCode, { name: string; url: string }>> = {
  CA: { name: 'California DMV', url: 'https://www.dmv.ca.gov/' },
  CT: { name: 'Connecticut DMV', url: 'https://portal.ct.gov/dmv' },
  FL: { name: 'Florida Highway Safety and Motor Vehicles', url: 'https://www.flhsmv.gov/' },
  GA: { name: 'Georgia Department of Driver Services', url: 'https://dds.georgia.gov/' },
  PA: { name: 'PennDOT Driver and Vehicle Services', url: 'https://www.dmv.pa.gov/' },
  TX: { name: 'Texas Department of Public Safety', url: 'https://www.dps.texas.gov/' },
  WA: { name: 'Washington Department of Licensing', url: 'https://dol.wa.gov/' },
};

// ---------------------------------------------------------------------------
// New Jersey — the reference implementation
// ---------------------------------------------------------------------------

const NEW_JERSEY: StateProfile = {
  code: 'NJ',
  name: 'New Jersey',
  coverage: 'detailed',
  lastReviewed: '2026-08-23',
  tasks: {
    'marriage-certificate': {
      agencyName: 'NJ Department of Health — Vital Statistics & Registry',
      headline: 'Order certified copies from the municipality that issued your license, or from the State Registry.',
      steps: [
        'Contact the registrar in the New Jersey municipality where your marriage license was issued.',
        'You can also order certified copies from the State Office of Vital Statistics and Registry.',
        'Ask specifically for certified copies with the raised or colored seal.',
        'Order at least three.',
      ],
      links: [
        {
          label: 'Order a certified New Jersey vital record',
          url: 'https://www.nj.gov/health/vital/order-vital/',
          source: 'NJ Department of Health',
        },
      ],
      timingNote:
        'Allow time for processing and mailing before you plan your Social Security visit.',
    },
    'drivers-license': {
      agencyName: 'New Jersey Motor Vehicle Commission (MVC)',
      headline:
        'A name change is processed at any MVC licensing center on a walk-in basis — no appointment needed.',
      inPersonRequired: true,
      bringWithYou: [
        'Your full 6 Points of ID — original or certified copies only, with the required seals',
        'Your certified marriage certificate as legal proof of the name change',
        'Your current New Jersey driver’s license or ID',
        'Proof of your New Jersey residential address',
        'Proof of your Social Security number',
        'Payment for the replacement fee',
      ],
      steps: [
        'Update Social Security first and give it a few business days to process.',
        'Assemble your 6 Points of ID. Photocopies are not accepted — documents must be original or certified with the required seals.',
        'Walk into any MVC licensing center. No appointment is required for a name change.',
        'Present your certified marriage certificate as legal proof of the name change.',
        'If any document is not in English, bring a translation from an approved translator.',
      ],
      links: [
        {
          label: 'NJ MVC — Name Change',
          url: 'https://www.nj.gov/mvc/drivertopics/namechange.htm',
          source: 'New Jersey Motor Vehicle Commission',
        },
        {
          label: 'NJ MVC — 6 Points of ID',
          url: 'https://www.nj.gov/mvc/license/6pointid.htm',
          source: 'New Jersey Motor Vehicle Commission',
        },
        {
          label: 'NJ MVC — licensing center locations',
          url: 'https://www.nj.gov/mvc/locations/agency_services.htm',
          source: 'New Jersey Motor Vehicle Commission',
        },
      ],
      timingNote:
        'Go in the morning. Walk-in name changes are handled in person and licensing centers are busiest at midday.',
    },
    'voter-registration': {
      agencyName: 'NJ Division of Elections',
      headline: 'Submit an updated voter registration application with your new name.',
      steps: [
        'Complete a New Jersey voter registration application with your new name.',
        'Submit it to your county commissioner of registration.',
        'Confirm your registration status a week later.',
      ],
      links: [
        {
          label: 'New Jersey voter registration',
          url: 'https://nj.gov/state/elections/voter-registration.shtml',
          source: 'NJ Department of State, Division of Elections',
        },
      ],
    },
    'professional-license': {
      agencyName: 'NJ Division of Consumer Affairs',
      headline:
        'Most New Jersey professional boards sit under the Division of Consumer Affairs.',
      steps: [
        'Find your specific board on the Division of Consumer Affairs site.',
        'Follow that board’s name-change process — requirements and fees differ by board.',
        'Ask about the reporting deadline; some boards require notice within a set number of days.',
      ],
      links: [
        {
          label: 'NJ Division of Consumer Affairs — professional boards',
          url: 'https://www.njconsumeraffairs.gov/',
          source: 'NJ Division of Consumer Affairs',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'New Jersey Motor Vehicle Commission (MVC)',
      headline: 'Handle this at the same MVC visit as your license where possible.',
      steps: [
        'Bring your current registration and title, or your lienholder’s information.',
        'Ask the agent to process the registration name change during the same visit.',
        'If a lender holds the title, contact them before your visit.',
      ],
      links: [
        {
          label: 'NJ MVC — vehicle services',
          url: 'https://www.nj.gov/mvc/vehicles/',
          source: 'New Jersey Motor Vehicle Commission',
        },
      ],
    },
  },
};

export const STATE_GUIDANCE: Partial<Record<StateCode, StateProfile>> = {
  NJ: NEW_JERSEY,
};

/**
 * Fallback profile for a state we have not researched in depth. It deliberately
 * contains no invented requirements — only a verified agency link where we have
 * one, plus the national lookups.
 */
function basicStateProfile(code: StateCode): StateProfile {
  const name = STATE_NAME[code] ?? code;
  const agency = VERIFIED_MV_AGENCY[code];

  const mvLinks: OfficialLink[] = agency
    ? [{ label: agency.name, url: agency.url, source: `${name} — official agency` }, NATIONAL_MV_FINDER]
    : [NATIONAL_MV_FINDER];

  return {
    code,
    name,
    coverage: 'basic',
    lastReviewed: '2026-08-23',
    tasks: {
      'drivers-license': {
        agencyName: agency?.name ?? `${name} motor vehicle agency`,
        headline: `We haven't published verified ${name} specifics yet — start on the official agency page below.`,
        links: mvLinks,
        timingNote:
          'Most states verify your name against Social Security, so complete that step first.',
      },
      'voter-registration': {
        agencyName: `${name} election officials`,
        links: [NATIONAL_VOTER],
      },
    },
  };
}

export function getStateProfile(code: StateCode | ''): StateProfile | undefined {
  if (!code) return undefined;
  return STATE_GUIDANCE[code] ?? basicStateProfile(code);
}

export function getStateTaskGuidance(
  code: StateCode | '',
  taskId: string,
): StateTaskGuidance | undefined {
  return getStateProfile(code)?.tasks[taskId];
}

/** States with hand-verified, task-level guidance. Shown on the landing page. */
export const DETAILED_STATES: StateCode[] = Object.values(STATE_GUIDANCE)
  .filter((s): s is StateProfile => !!s && s.coverage === 'detailed')
  .map((s) => s.code);
