import type { OfficialLink, StateCode, StateProfile, StateTaskGuidance } from '@/types';
import { stateSlug } from '@shared/seo';

/**
 * State-specific requirements.
 *
 * Structure over content, on purpose: adding a state means adding one entry to
 * `STATE_GUIDANCE` — no component changes, no conditionals in the UI. A set of
 * high-population states are filled in as `detailed` profiles researched against
 * official .gov sources; every other state falls back to `basicStateProfile`,
 * which gives real, verified national lookups rather than invented state detail.
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

const REVIEWED = '2026-09-23';

// ---------------------------------------------------------------------------
// New Jersey — the reference implementation
// ---------------------------------------------------------------------------

const NEW_JERSEY: StateProfile = {
  code: 'NJ',
  name: 'New Jersey',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against NJ DOH Vital Statistics, NJ MVC name-change and 6 Points of ID pages, NJ Division of Elections, and NJ Division of Consumer Affairs.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'NJ Department of Health — Vital Statistics & Registry',
      headline:
        'Order certified copies from the municipality that issued your license, or from the State Registry.',
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
          label: 'NJ MVC — registration renewal and vehicle services',
          url: 'https://www.nj.gov/mvc/vehicles/regrenew.htm',
          source: 'New Jersey Motor Vehicle Commission',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// California
// ---------------------------------------------------------------------------

const CALIFORNIA: StateProfile = {
  code: 'CA',
  name: 'California',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against California Courts Self-Help, California DMV DL/ID update guidance, registertovote.ca.gov / SOS elections, and DCA.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'County Recorder / County Clerk (and CDPH Vital Records for eligible years)',
      headline:
        'Request a certified copy from the county where the license was issued; confidential marriages are available only from that county clerk.',
      steps: [
        'Contact the County Recorder (public marriage) or County Clerk (confidential marriage) in the county where the license was issued.',
        'Ask for a certified copy suitable for government name-change use — not a decorative keepsake copy.',
        'Order more than one certified copy so you can keep one while others are in use.',
        'You submit the request yourself; AfterIDo does not order records for you.',
      ],
      links: [
        {
          label: 'California Courts — update identity documents after a name change',
          url: 'https://selfhelp.courts.ca.gov/name-change/update-documents',
          source: 'California Courts Self-Help',
        },
      ],
      timingNote:
        'County processing times vary. Get certified copies in hand before Social Security and DMV appointments.',
    },
    'drivers-license': {
      agencyName: 'California Department of Motor Vehicles (DMV)',
      headline:
        'Update Social Security first, then finish the name change in person at a DMV field office.',
      inPersonRequired: true,
      bringWithYou: [
        'Proof of your legal name change (certified marriage certificate or other accepted name-change document)',
        'Proof of identity as listed on the DMV acceptable-documents list',
        'Proof of your Social Security number',
        'Two proofs of California residency',
        'Payment for the replacement card',
      ],
      steps: [
        'Change your name with the Social Security Administration first — DMV verifies against SSA.',
        'Start or complete the DL/ID application online if you prefer, then visit a field office to finish.',
        'Bring original or certified name-change documents; photocopies are not enough.',
        'If you have changed your name before, bring proof that links each former name to the next.',
      ],
      links: [
        {
          label: 'California DMV — update information on your DL/ID',
          url: 'https://www.dmv.ca.gov/portal/driver-licenses-identification-cards/updating-information-on-your-driver-license-or-identification-dl-id-card/',
          source: 'California DMV',
        },
      ],
      timingNote:
        'Your name change is not complete until you finish at a DMV field office.',
    },
    'voter-registration': {
      agencyName: 'California Secretary of State — Elections',
      headline: 'Submit an updated voter registration with your new name.',
      steps: [
        'Use the official California voter registration application or registertovote.ca.gov.',
        'Enter your new legal name exactly as it will appear on your ID.',
        'Confirm your registration status after the county processes the update.',
      ],
      links: [
        {
          label: 'Register to vote in California',
          url: 'https://registertovote.ca.gov/',
          source: 'California Secretary of State',
        },
        {
          label: 'California voter registration information',
          url: 'https://www.sos.ca.gov/elections/voter-registration',
          source: 'California Secretary of State',
        },
      ],
    },
    'professional-license': {
      agencyName: 'California Department of Consumer Affairs',
      headline:
        'Most California professional boards are under the Department of Consumer Affairs — each board sets its own name-change steps.',
      steps: [
        'Find your board on the DCA site.',
        'Follow that board’s instructions to update your license name — forms and fees differ.',
        'You submit the change to your board; AfterIDo does not file it for you.',
      ],
      links: [
        {
          label: 'California Department of Consumer Affairs',
          url: 'https://www.dca.ca.gov/',
          source: 'California DCA',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'California Department of Motor Vehicles (DMV)',
      headline: 'Update vehicle registration records through DMV after your license name matches.',
      steps: [
        'Finish your driver license name change first when possible.',
        'Use DMV vehicle registration services to update ownership or registration records as needed.',
        'If a lender holds the title, contact them before requesting a printed title change.',
      ],
      links: [
        {
          label: 'California DMV — vehicle registration',
          url: 'https://www.dmv.ca.gov/portal/vehicle-registration/',
          source: 'California DMV',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Texas
// ---------------------------------------------------------------------------

const TEXAS: StateProfile = {
  code: 'TX',
  name: 'Texas',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Texas DSHS marriage/divorce records, Texas DPS driver license name-change guidance, VoteTexas.gov, TDLR, and TxDMV motorist pages.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'County Clerk (certified license) / Texas DSHS (verification letter)',
      headline:
        'Certified copies of marriage licenses come from the county clerk; DSHS issues verification letters that are not a substitute for a certified license.',
      steps: [
        'Order a certified marriage license from the County Clerk in the county where the license was filed.',
        'If you only need a verification letter for certain uses, you may order one from Texas DSHS for marriages since 1966 — confirm your agency will accept a verification letter.',
        'Ask for a certified copy (not a photocopy) if you will use it at DPS.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Texas DSHS — marriage and divorce records',
          url: 'https://www.dshs.texas.gov/vital-statistics/marriage-divorce-records',
          source: 'Texas Department of State Health Services',
        },
      ],
      timingNote:
        'DPS requires an original or certified name-change document — photocopies are not accepted.',
    },
    'drivers-license': {
      agencyName: 'Texas Department of Public Safety (DPS)',
      headline:
        'Visit a driver license office within 30 days of your name change with an original or certified marriage document.',
      inPersonRequired: true,
      bringWithYou: [
        'Original or certified marriage license, or a DSHS marriage verification letter if DPS will accept it for your case',
        'Your current Texas driver license or ID',
        'Payment for the replacement fee',
      ],
      steps: [
        'Gather an original or certified name-change document — photocopies are not accepted; laminated certified copies may be refused.',
        'Visit any Texas driver license office within 30 days of the change.',
        'Apply for a replacement (duplicate) license or ID with your new name.',
        'If the document is not in English, bring a certified English translation with the original.',
      ],
      links: [
        {
          label: 'Texas DPS — change information on your driver license or ID',
          url: 'https://www.dps.texas.gov/section/driver-license/how-change-information-your-driver-license-or-id-card',
          source: 'Texas Department of Public Safety',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Texas Secretary of State — VoteTexas.gov',
      headline: 'Update your voter registration with your new name through official Texas channels.',
      steps: [
        'Use VoteTexas.gov to update your registration, or submit a voter registration application with your new name.',
        'Have your Texas VUID ready if the online name/address tools ask for it.',
        'Confirm your registration status after your county processes the change.',
      ],
      links: [
        {
          label: 'Update your Texas voter registration',
          url: 'https://www.votetexas.gov/register-to-vote/update-voter-registration.html',
          source: 'VoteTexas.gov',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Texas Department of Licensing and Regulation (and other boards)',
      headline:
        'Many Texas occupational licenses are under TDLR; other professions use separate boards — follow yours.',
      steps: [
        'Find your license program on TDLR or your specific board’s site.',
        'Follow that program’s name-change instructions — requirements differ.',
        'You file the update with the board; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Texas Department of Licensing and Regulation',
          url: 'https://www.tdlr.texas.gov/',
          source: 'Texas Department of Licensing and Regulation',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'Texas Department of Motor Vehicles (TxDMV)',
      headline: 'Update title and registration through TxDMV after your name is correct with DPS.',
      steps: [
        'Review TxDMV motorist guidance for buying, selling, and title services.',
        'Bring your current registration/title information, or contact your lienholder if they hold the title.',
        'You complete the TxDMV or county tax assessor-collector process yourself.',
      ],
      links: [
        {
          label: 'TxDMV — motorist services',
          url: 'https://www.txdmv.gov/motorists',
          source: 'Texas Department of Motor Vehicles',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Florida
// ---------------------------------------------------------------------------

const FLORIDA: StateProfile = {
  code: 'FL',
  name: 'Florida',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Florida DOH marriage certificates, FLHSMV name/address change pages, Florida Division of Elections, and MyFloridaLicense.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'Florida Department of Health — Bureau of Vital Statistics',
      headline:
        'Order a Florida Certificate of Marriage from Vital Statistics, or from the clerk of court if the ceremony was recent.',
      steps: [
        'If your ceremony was less than about 60 days ago, contact the clerk of court in the county that issued the license for a faster certified copy.',
        'Otherwise download the official marriage certificate application and order from the Bureau of Vital Statistics by mail or in person.',
        'Ask for a certified copy that Florida agencies will accept — church keepsake certificates are not accepted at FLHSMV.',
        'You submit the order yourself.',
      ],
      links: [
        {
          label: 'Florida DOH — marriage certificates',
          url: 'https://www.floridahealth.gov/certificates-records/marriage-certificates/',
          source: 'Florida Department of Health',
        },
      ],
      timingNote:
        'Vital Statistics generally receives county filings about 60 days after the ceremony.',
    },
    'drivers-license': {
      agencyName: 'Florida Highway Safety and Motor Vehicles (FLHSMV)',
      headline:
        'Update Social Security first, wait 24–48 hours, then complete the name change in person within 30 days.',
      inPersonRequired: true,
      bringWithYou: [
        'Original or certified marriage certificate (photocopies are not accepted)',
        'Documents required for your residency/citizenship category on the FLHSMV “what to bring” lists',
        'Your current Florida driver license or ID',
        'Payment for the replacement credential',
      ],
      steps: [
        'Update your name with the Social Security Administration and wait 24 to 48 hours so FLHSMV can verify it.',
        'Visit a local driver license office in person — name changes are not completed online.',
        'Bring an original or certified marriage certificate that Florida recognizes (not a church-issued certificate).',
        'Update both your credential and, as needed, title/registration within 30 days of the change.',
      ],
      links: [
        {
          label: 'FLHSMV — name and address changes',
          url: 'https://www.flhsmv.gov/name-and-address-changes/',
          source: 'Florida Highway Safety and Motor Vehicles',
        },
        {
          label: 'FLHSMV — U.S. citizen document checklist',
          url: 'https://www.flhsmv.gov/driver-licenses-id-cards/what-to-bring/u-s-citizen/',
          source: 'Florida Highway Safety and Motor Vehicles',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Florida Division of Elections',
      headline: 'Register or update your Florida voter registration with your new name.',
      steps: [
        'Use the Florida Division of Elections voter registration options to update your name.',
        'Submit the application and keep a copy of what you filed.',
        'Confirm your registration status after your county supervisor of elections processes it.',
      ],
      links: [
        {
          label: 'Florida — register to vote or update your information',
          url: 'https://dos.fl.gov/elections/for-voters/voter-registration/register-to-vote-or-update-your-information/',
          source: 'Florida Division of Elections',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Florida Department of Business and Professional Regulation (and other boards)',
      headline:
        'Start at MyFloridaLicense to find your board and that board’s name-change process.',
      steps: [
        'Look up your license on MyFloridaLicense or your board’s site.',
        'Follow the board’s instructions to update your name — fees and forms differ.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'MyFloridaLicense',
          url: 'https://www.myfloridalicense.com/intentions2.asp',
          source: 'Florida Department of Business and Professional Regulation',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'Florida Highway Safety and Motor Vehicles (FLHSMV)',
      headline:
        'Name changes must be reflected on both your credential and your title/registration within 30 days.',
      steps: [
        'Update your driver license/ID name first when required.',
        'Follow FLHSMV guidance to issue updated registration and, if needed, a new printed title.',
        'If a lienholder holds a paper title, ask them before requesting a reprinted title.',
      ],
      links: [
        {
          label: 'FLHSMV — motor vehicles, tags, and titles',
          url: 'https://www.flhsmv.gov/motor-vehicles-tags-titles/',
          source: 'Florida Highway Safety and Motor Vehicles',
        },
        {
          label: 'FLHSMV — name and address changes (title/registration notes)',
          url: 'https://www.flhsmv.gov/name-and-address-changes/',
          source: 'Florida Highway Safety and Motor Vehicles',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// New York
// ---------------------------------------------------------------------------

const NEW_YORK: StateProfile = {
  code: 'NY',
  name: 'New York',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against NYS DOH Vital Records (outside NYC), NYC City Clerk marriage records, NY DMV photo-document change guidance, NYS Board of Elections, and NYSED Office of the Professions.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'NYS DOH Vital Records (outside NYC) / NYC City Clerk (NYC marriages)',
      headline:
        'Order from NYS Vital Records or your town/city clerk if the license was outside New York City; NYC licenses are handled by the City Clerk.',
      steps: [
        'If the license was issued in New York City, request a certified marriage record from the NYC City Clerk.',
        'If the license was issued elsewhere in New York State, order from NYS Vital Records or from the town or city clerk where you applied for the license.',
        'Ask for a government-issued certified copy for name-change use.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'NYS DOH — marriage certificates',
          url: 'https://www.health.ny.gov/vital_records/marriage.htm',
          source: 'New York State Department of Health',
        },
        {
          label: 'NYC City Clerk — marriage records',
          url: 'https://www.cityclerk.nyc.gov/content/marriage-records',
          source: 'New York City Office of the City Clerk',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'New York State Department of Motor Vehicles (DMV)',
      headline:
        'Update Social Security first. Most REAL ID / Enhanced changes are in person; some Standard documents can be updated by mail.',
      inPersonRequired: true,
      bringWithYou: [
        'Completed MV-44 (in person) or MV-44NC (mail name-change for eligible Standard documents)',
        'Your current NY license, permit, or non-driver ID (or other identity proofs listed by DMV)',
        'Original or certified U.S. marriage certificate or other accepted name-change proof',
        'For mail Standard changes: a copy of your new Social Security card matching the requested name',
        'Payment for the amended document fee',
      ],
      steps: [
        'Change your name with the Social Security Administration so the name on your Social Security record matches what you request at DMV.',
        'For REAL ID, Enhanced, CDL, or most other cases, bring required proofs to a local DMV office.',
        'If you qualify for a Standard document name change by mail, follow the MV-44NC checklist on the DMV page exactly.',
        'Expect a temporary document at the counter when you visit; permanent cards are mailed.',
      ],
      links: [
        {
          label: 'NY DMV — change information on photo documents',
          url: 'https://dmv.ny.gov/driver-license/change-information-on-dmv-photo-documents',
          source: 'New York State DMV',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'New York State Board of Elections',
      headline: 'Submit an updated voter registration with your new name.',
      steps: [
        'Complete a New York voter registration application with your new name.',
        'Submit it through the official Board of Elections process for your county.',
        'Confirm your registration status after processing.',
      ],
      links: [
        {
          label: 'New York — register to vote',
          url: 'https://www.elections.ny.gov/VotingRegister.html',
          source: 'New York State Board of Elections',
        },
      ],
    },
    'professional-license': {
      agencyName: 'NYSED Office of the Professions (and other NY boards)',
      headline:
        'Many New York licensed professions are under the Office of the Professions — check your specific board for name-change steps.',
      steps: [
        'Find your profession on the Office of the Professions site (or your separate board if not listed there).',
        'Follow that board’s name-change instructions — requirements differ.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'NYSED Office of the Professions',
          url: 'https://www.op.nysed.gov/',
          source: 'New York State Education Department',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Pennsylvania
// ---------------------------------------------------------------------------

const PENNSYLVANIA: StateProfile = {
  code: 'PA',
  name: 'Pennsylvania',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against PA marriage-records guidance (county Register of Wills / Clerk of Orphans’ Court), PennDOT name-change service pages, vote.pa.gov / PA voter update pages, and DOS Professional Licensing.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'County Register of Wills / Clerk of the Orphans’ Court',
      headline:
        'Pennsylvania marriage licenses since 1885 are held by the county that issued them — not by a statewide vital-records mail order for current licenses.',
      steps: [
        'Contact the Register of Wills / Clerk of the Orphans’ Court in the county where the marriage license was issued.',
        'Request a certified marriage record suitable for Social Security and PennDOT (often described locally as a sealed copy).',
        'Order more than one certified copy if you can.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Pennsylvania — where marriage records are kept',
          url: 'https://www.pa.gov/agencies/phmc/pa-state-archives/research-online/vital-records/marriage-records',
          source: 'Pennsylvania Historical & Museum Commission / State Archives',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'PennDOT Driver and Vehicle Services',
      headline:
        'Name changes are done in person at a Driver License Center with original documents.',
      inPersonRequired: true,
      bringWithYou: [
        'Completed DL-80 (or the form PennDOT lists for your credential type)',
        'Your marriage certificate (original) if you are taking a spouse’s surname',
        'Your current Pennsylvania driver license or photo ID',
        'Payment for the replacement fee shown on the form',
      ],
      steps: [
        'Update Social Security first when you also need a REAL ID name match.',
        'Download and complete the correct PennDOT change form for your license or ID type.',
        'Visit a Driver License Center in person — PennDOT states name changes must be done in person with original documents.',
        'Present your marriage certificate if you are using your spouse’s surname.',
      ],
      links: [
        {
          label: 'PennDOT — change a driver license name or address',
          url: 'https://www.pa.gov/services/dmv/change-a-driver-license-name-or-address',
          source: 'PennDOT / Commonwealth of Pennsylvania',
        },
        {
          label: 'PennDOT — REAL ID name-change documents',
          url: 'https://www.pa.gov/agencies/dmv/driver-services/real-id/name-changes-real-id',
          source: 'PennDOT Driver and Vehicle Services',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Pennsylvania Department of State — VotesPA',
      headline: 'Update your Pennsylvania voter registration with your new name.',
      steps: [
        'Use the official Pennsylvania voter registration update process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your status after your county election office processes the change.',
      ],
      links: [
        {
          label: 'Update my Pennsylvania voter registration',
          url: 'https://www.pa.gov/agencies/vote/voter-registration/update-my-registration',
          source: 'Pennsylvania Votes',
        },
        {
          label: 'VotesPA',
          url: 'https://vote.pa.gov/',
          source: 'Pennsylvania Department of State',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Pennsylvania Department of State — Professional Licensing',
      headline:
        'Pennsylvania professional licensing boards are coordinated through the Department of State — follow your board’s process.',
      steps: [
        'Find your board on the Professional Licensing site.',
        'Follow that board’s name-change instructions.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Pennsylvania Professional Licensing',
          url: 'https://www.dos.pa.gov/ProfessionalLicensing/Pages/default.aspx',
          source: 'Pennsylvania Department of State',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'PennDOT Driver and Vehicle Services',
      headline: 'Update vehicle title and registration through PennDOT vehicle services.',
      steps: [
        'Review PennDOT title and registration guidance after your license name is updated.',
        'Bring current title/registration information, or contact your lienholder if they hold the title.',
        'You complete the PennDOT process yourself.',
      ],
      links: [
        {
          label: 'PennDOT — title and registration',
          url: 'https://www.pa.gov/agencies/dmv/vehicle-services/title-and-registration',
          source: 'PennDOT Driver and Vehicle Services',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Illinois
// ---------------------------------------------------------------------------

const ILLINOIS: StateProfile = {
  code: 'IL',
  name: 'Illinois',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Illinois DPH marriage-records guidance (county clerk), Illinois Secretary of State driver services pages, Illinois State Board of Elections, and IDFPR.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'County Clerk (certified copy) / Illinois DPH (verification only)',
      headline:
        'Certified marriage copies come from the county clerk where the marriage occurred; IDPH does not issue certified marriage copies.',
      steps: [
        'Contact the county clerk in the county where the marriage occurred and request a certified copy.',
        'If you only need a fact verification (not a certified license copy), Illinois DPH can verify marriages in its index for a fee — confirm your agency wants a certified county copy instead.',
        'Order more than one certified copy when you can.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Illinois DPH — marriage records guidance',
          url: 'https://dph.illinois.gov/topics-services/birth-death-other-records/marriage-records.html',
          source: 'Illinois Department of Public Health',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'Illinois Secretary of State — Driver Services',
      headline:
        'Visit a Driver Services facility for a corrected license; Illinois expects name changes to be reported promptly.',
      inPersonRequired: true,
      bringWithYou: [
        'Your current Illinois driver license or ID',
        'Original or certified marriage certificate linking your former and new names',
        'Payment for the corrected credential fee listed by the Secretary of State',
      ],
      steps: [
        'Update Social Security first when your new license name must match SSA.',
        'Go to a Secretary of State Driver Services facility in person.',
        'Bring an original or certified name-change document — photocopies are not accepted.',
        'Surrender your current credential when you receive the corrected one, as instructed at the facility.',
      ],
      links: [
        {
          label: 'Illinois Secretary of State — driver license and ID information',
          url: 'https://www.ilsos.gov/departments/drivers/drivers-license/drlicid.html',
          source: 'Illinois Secretary of State',
        },
        {
          label: 'Illinois Secretary of State (agency overview)',
          url: 'https://www.illinois.gov/agencies/agency.sos.html',
          source: 'Illinois.gov',
        },
      ],
      timingNote:
        'Secretary of State guidance states you must report a name change for a driver license within 10 days; CDL holders have a separate corrected-CDL deadline on the SOS FAQ.',
    },
    'voter-registration': {
      agencyName: 'Illinois State Board of Elections',
      headline: 'Register or update your Illinois voter registration with your new name.',
      steps: [
        'Use the Illinois State Board of Elections voter registration process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your registration status after your election authority processes it.',
      ],
      links: [
        {
          label: 'Illinois — register to vote',
          url: 'https://www.elections.il.gov/votinginformation/registertovote.aspx',
          source: 'Illinois State Board of Elections',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Illinois Department of Financial and Professional Regulation (IDFPR)',
      headline:
        'Most Illinois professional licenses are managed through IDFPR — follow your profession’s update process.',
      steps: [
        'Find your license type on the IDFPR site.',
        'Follow that profession’s name-change instructions.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Illinois Department of Financial and Professional Regulation',
          url: 'https://idfpr.illinois.gov/',
          source: 'IDFPR',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'Illinois Secretary of State — Vehicle Services',
      headline: 'Update vehicle title and registration through Illinois Secretary of State Vehicle Services.',
      steps: [
        'Review Vehicle Services guidance after your driver credential name is updated.',
        'Bring title/registration information, or contact your lienholder if they hold the title.',
        'You complete the Secretary of State process yourself.',
      ],
      links: [
        {
          label: 'Illinois Secretary of State — vehicles',
          url: 'https://www.ilsos.gov/departments/vehicles.html',
          source: 'Illinois Secretary of State',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Ohio
// ---------------------------------------------------------------------------

const OHIO: StateProfile = {
  code: 'OH',
  name: 'Ohio',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Ohio Department of Health Vital Statistics (marriage records held by counties), Ohio BMV identity-document guidance, Ohio SOS elections, eLicense.ohio.gov, and BMV title pages.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'County Probate Court (marriage licenses)',
      headline:
        'Ohio Bureau of Vital Statistics does not maintain marriage records — request a certified copy from the county probate court where the license was issued.',
      steps: [
        'Contact the probate court in the county where the marriage license was issued.',
        'Request an original or certified marriage certificate or license suitable for BMV use.',
        'Order more than one certified copy when you can.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Ohio Department of Health — Vital Statistics',
          url: 'https://odh.ohio.gov/wps/portal/gov/odh/know-our-programs/vital-statistics',
          source: 'Ohio Department of Health',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'Ohio Bureau of Motor Vehicles (BMV)',
      headline:
        'Bring an original or certified marriage certificate to connect your birth name to your current legal name at a deputy registrar.',
      inPersonRequired: true,
      bringWithYou: [
        'Original or certified marriage certificate or marriage license',
        'Identity, Social Security, and legal-presence documents from the BMV acceptable-documents list',
        'Two Ohio residency documents when applying for a federally compliant card',
        'Payment for the credential',
      ],
      steps: [
        'Update Social Security first when your BMV name must match SSA.',
        'Use the BMV acceptable-documents list / interactive checklist for your card type.',
        'Visit a deputy registrar agency with original or certified name-change documents.',
        'If you have had more than one marriage or name change, bring documents that connect each former name to the next.',
      ],
      links: [
        {
          label: 'Ohio BMV — identity documents and name-change proof',
          url: 'https://bmv.ohio.gov/dl-identity-documents.aspx',
          source: 'Ohio Bureau of Motor Vehicles',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Ohio Secretary of State — Elections',
      headline: 'Register or update your Ohio voter registration with your new name.',
      steps: [
        'Use the official Ohio voter registration process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your registration status after your county board of elections processes it.',
      ],
      links: [
        {
          label: 'Ohio — register to vote',
          url: 'https://www.ohiosos.gov/elections/voters/register/',
          source: 'Ohio Secretary of State',
        },
        {
          label: 'VoteOhio.gov',
          url: 'https://vote.ohio.gov/',
          source: 'Ohio Secretary of State',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Ohio eLicense (professional boards)',
      headline:
        'Many Ohio boards use eLicense for credential updates — open your license record and follow that board’s name-change option.',
      steps: [
        'Sign in to eLicense.ohio.gov and locate your license.',
        'Use the board’s change-of-name process and upload the documentation that board lists.',
        'If Change Name is unavailable in the portal, contact your board directly.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Ohio eLicense',
          url: 'https://elicense.ohio.gov/',
          source: 'State of Ohio',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'Ohio Clerk of Courts (titles) / BMV deputy registrar (registration)',
      headline:
        'Ohio titles are handled through county Clerk of Courts title offices; registration updates are done at deputy registrar agencies.',
      steps: [
        'Take required identity and name-change documents to the county Clerk of Courts title office when a title name change is needed.',
        'After the title record is updated, update registration at a deputy registrar if required.',
        'If a lender holds the title, contact them before you go.',
      ],
      links: [
        {
          label: 'Ohio BMV — titles',
          url: 'https://bmv.ohio.gov/titles-new.aspx',
          source: 'Ohio Bureau of Motor Vehicles',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Georgia
// ---------------------------------------------------------------------------

const GEORGIA: StateProfile = {
  code: 'GA',
  name: 'Georgia',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Georgia DPH marriage vital-record guidance, Georgia DDS name-change rules, Georgia.gov voter registration, Georgia SOS licensing, and Georgia DOR motor vehicles.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'Georgia DPH Vital Records / County Probate Court',
      headline:
        'Request marriage records through Georgia Vital Records for years they hold, or from the probate court in the county that issued the license.',
      steps: [
        'Check Georgia DPH guidance for which years Vital Records can search, and otherwise contact the probate court where the license was issued.',
        'Request a certified marriage license, application, or state-issued certificate — DDS lists these among accepted name-change proofs.',
        'Order more than one certified copy when you can.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Georgia DPH — request a marriage vital record',
          url: 'https://dph.georgia.gov/ways-request-vital-record/marriage',
          source: 'Georgia Department of Public Health',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'Georgia Department of Driver Services (DDS)',
      headline:
        'Name changes must be completed in person at a DDS Customer Service Center within 60 days.',
      inPersonRequired: true,
      bringWithYou: [
        'Certified copy of a Georgia marriage license application (if married in Georgia), marriage license, state-issued marriage certificate, or court-ordered name change',
        'Your current Georgia license or ID',
        'Other identity documents DDS requires for your transaction',
      ],
      steps: [
        'Update Social Security first when your DDS name must match SSA.',
        'Visit a DDS Customer Service Center in person within 60 days of the legal name change.',
        'Present a certified marriage document from the DDS-accepted list.',
        'If you want a hyphenated surname from a Georgia marriage on or after November 1, 1982, bring the certified marriage license application that shows that selection.',
      ],
      links: [
        {
          label: 'Georgia DDS — name change rules',
          url: 'https://dds.georgia.gov/section-4-continued',
          source: 'Georgia Department of Driver Services',
        },
        {
          label: 'Georgia Department of Driver Services',
          url: 'https://dds.georgia.gov/',
          source: 'Georgia Department of Driver Services',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Georgia Secretary of State — Elections',
      headline: 'Register or update your Georgia voter registration with your new name.',
      steps: [
        'Use Georgia’s official voter registration process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your registration status after processing.',
      ],
      links: [
        {
          label: 'Georgia — register to vote',
          url: 'https://georgia.gov/register-vote',
          source: 'Georgia.gov',
        },
        {
          label: 'Georgia Secretary of State — Elections Division',
          url: 'https://sos.ga.gov/elections-division-georgia-secretary-states-office',
          source: 'Georgia Secretary of State',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Georgia Secretary of State — Professional Licensing',
      headline:
        'Many Georgia professional licenses are under the Secretary of State’s licensing division — follow your board’s process.',
      steps: [
        'Find your license type on the SOS licensing site.',
        'Follow that board’s name-change instructions.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Georgia Secretary of State — licensing',
          url: 'https://sos.ga.gov/licensing',
          source: 'Georgia Secretary of State',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'Georgia Department of Revenue — Motor Vehicles',
      headline: 'Update vehicle title and registration through Georgia Motor Vehicle services.',
      steps: [
        'Review Georgia DOR motor vehicle guidance after your DDS credential name is updated.',
        'Bring title/registration information, or contact your lienholder if they hold the title.',
        'You complete the state/county motor vehicle process yourself.',
      ],
      links: [
        {
          label: 'Georgia Department of Revenue — motor vehicles',
          url: 'https://dor.georgia.gov/motor-vehicles',
          source: 'Georgia Department of Revenue',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// North Carolina
// ---------------------------------------------------------------------------

const NORTH_CAROLINA: StateProfile = {
  code: 'NC',
  name: 'North Carolina',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against NC Vital Records marriage pages, NCDMV name-change guidance, NCSBE voter registration, NC licensing directory, and NCDMV title/registration pages.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'County Register of Deeds / NC Vital Records',
      headline:
        'Start with the Register of Deeds in the county where the marriage occurred; NC Vital Records also issues copies for marriages from 1962 to present.',
      steps: [
        'Contact the Register of Deeds in the county where the marriage occurred for a certified copy.',
        'You may also order through NC Vital Records for years they hold (1962–present per their marriage page).',
        'Ask for a certified copy suitable for NCDMV — photocopies are not accepted there.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'NC Vital Records — marriage',
          url: 'https://vitalrecords.nc.gov/marriage.htm',
          source: 'North Carolina Vital Records',
        },
        {
          label: 'NC Vital Records — order a certificate',
          url: 'https://vitalrecords.nc.gov/order.htm',
          source: 'North Carolina Vital Records',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'North Carolina Division of Motor Vehicles (NCDMV)',
      headline:
        'Notify NCDMV within 60 days and obtain a duplicate credential with your new name after updating Social Security.',
      inPersonRequired: true,
      bringWithYou: [
        'Certified marriage license or certificate (or other court/Register of Deeds name-change document)',
        'Notarized DL-101 obtained from a DMV office, as required for legal name changes',
        'Your current North Carolina driver license or ID',
      ],
      steps: [
        'Update your name with the Social Security Administration and wait at least 24–36 hours so NCDMV can verify online.',
        'Visit an NCDMV driver license office within 60 days of the change.',
        'Bring a certified government name-change document — NCDMV does not accept photocopies.',
        'Complete the notarized DL-101 when required for a court or Register of Deeds name change.',
      ],
      links: [
        {
          label: 'NCDMV — name changes',
          url: 'https://www.ncdot.gov/dmv/help/moving/Pages/name-changes.aspx',
          source: 'North Carolina Division of Motor Vehicles',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'North Carolina State Board of Elections',
      headline: 'Register or update your North Carolina voter registration with your new name.',
      steps: [
        'Use the NCSBE voter registration process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your registration status after your county board of elections processes it.',
      ],
      links: [
        {
          label: 'North Carolina — how to register to vote',
          url: 'https://www.ncsbe.gov/registering/how-register',
          source: 'North Carolina State Board of Elections',
        },
      ],
    },
    'professional-license': {
      agencyName: 'North Carolina professional licensing boards',
      headline:
        'North Carolina licenses are issued by individual boards — use the official licensing directory to find yours.',
      steps: [
        'Find your board through the official NC licensing directory.',
        'Follow that board’s name-change instructions.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'North Carolina licensing directory',
          url: 'https://www.nclicensing.org/',
          source: 'State of North Carolina',
        },
      ],
    },
    'vehicle-title-registration': {
      agencyName: 'North Carolina Division of Motor Vehicles (NCDMV)',
      headline:
        'To change the name on a registration and title, submit a Corrected or Substitute Title Application (MVR-5) with the required fee.',
      steps: [
        'Complete form MVR-5 as described on the NCDMV name-change page.',
        'Submit it with the fee to a local license plate agency or by mail to the address NCDMV lists.',
        'If a lienholder holds the title, NCDMV will contact them for the original title when needed.',
      ],
      links: [
        {
          label: 'NCDMV — name changes (includes vehicle registration)',
          url: 'https://www.ncdot.gov/dmv/help/moving/Pages/name-changes.aspx',
          source: 'North Carolina Division of Motor Vehicles',
        },
        {
          label: 'NCDMV — title and registration',
          url: 'https://www.ncdot.gov/dmv/title-registration/Pages/default.aspx',
          source: 'North Carolina Division of Motor Vehicles',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Michigan
// ---------------------------------------------------------------------------

const MICHIGAN: StateProfile = {
  code: 'MI',
  name: 'Michigan',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Michigan MDHHS Vital Records ordering pages, Michigan SOS license/ID name-correction guidance, Michigan SOS voter registration, and LARA Bureau of Professional Licensing.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'Michigan Department of Health and Human Services — Vital Records',
      headline: 'Order a certified Michigan marriage record through MDHHS Vital Records.',
      steps: [
        'Use the official MDHHS Vital Records ordering options (mail or the authorized online channel listed on their site).',
        'Request a certified marriage record showing both names for use at Social Security and the Secretary of State.',
        'Order more than one certified copy when you can.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Michigan MDHHS — order a vital record',
          url: 'https://www.michigan.gov/mdhhs/doing-business/vitalrecords/order-a-copy-of-a-vital-record',
          source: 'Michigan Department of Health and Human Services',
        },
      ],
    },
    'drivers-license': {
      agencyName: 'Michigan Secretary of State',
      headline:
        'Name corrections are done at a Secretary of State office after Social Security has your new name on file.',
      inPersonRequired: true,
      bringWithYou: [
        'Your current Michigan license or ID',
        'Official proof that Social Security has your new legal name',
        'Certified marriage certificate, court order, or U.S.-issued divorce decree showing the former and new names',
        'Payment for the correction fee listed by SOS',
      ],
      steps: [
        'Update your name with the Social Security Administration first — SOS verifies against SSA and cannot process the change without a match.',
        'Schedule or visit a Secretary of State office (this transaction is not available online or by mail).',
        'Bring a certified name-change document that shows both your previous and current names.',
        'Expect a temporary paper credential at the counter; the permanent card is mailed.',
      ],
      links: [
        {
          label: 'Michigan SOS — license or ID name correction',
          url: 'https://www.michigan.gov/sos/all-services/license-or-id-name-correction',
          source: 'Michigan Secretary of State',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Michigan Secretary of State — Elections',
      headline: 'Register or update your Michigan voter registration with your new name.',
      steps: [
        'Use the official Michigan voter registration process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your registration status after processing.',
      ],
      links: [
        {
          label: 'Michigan — register to vote',
          url: 'https://www.michigan.gov/sos/elections/voting/register-to-vote',
          source: 'Michigan Secretary of State',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Michigan LARA — Bureau of Professional Licensing',
      headline:
        'Most Michigan professional licenses are under LARA’s Bureau of Professional Licensing — follow your board’s process.',
      steps: [
        'Find your board on the Bureau of Professional Licensing site.',
        'Follow that board’s name-change instructions.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Michigan LARA — Bureau of Professional Licensing',
          url: 'https://www.michigan.gov/lara/bureau-list/bpl',
          source: 'Michigan Department of Licensing and Regulatory Affairs',
        },
      ],
    },
  },
};

// ---------------------------------------------------------------------------
// Virginia
// ---------------------------------------------------------------------------

const VIRGINIA: StateProfile = {
  code: 'VA',
  name: 'Virginia',
  coverage: 'detailed',
  lastReviewed: REVIEWED,
  sourceNote:
    'Reviewed against Virginia DMV vital-records and name-change pages, Virginia Department of Elections, and Virginia Department of Health Professions.',
  tasks: {
    'marriage-certificate': {
      agencyName: 'Virginia DMV (in person) / Virginia Department of Health — Vital Records',
      headline:
        'You can purchase a certified Virginia marriage record at DMV customer service centers, or apply by mail to VDH Vital Records.',
      steps: [
        'For in-person service, visit any Virginia DMV customer service center with form DL 82 and acceptable identification.',
        'For mail orders, follow VDH Vital Records instructions and mail to the address DMV/VDH publish for vital records.',
        'Ask for a certified copy suitable for DMV name-change use.',
        'You submit the request yourself.',
      ],
      links: [
        {
          label: 'Virginia DMV — vital records at DMV',
          url: 'https://www.dmv.virginia.gov/records/vital',
          source: 'Virginia Department of Motor Vehicles',
        },
      ],
      timingNote:
        'DMV charges a records search fee whether or not the record is found; confirm the current fee on the DMV page before you go.',
    },
    'drivers-license': {
      agencyName: 'Virginia Department of Motor Vehicles (DMV)',
      headline:
        'Update Social Security first, then complete DMV’s name-change process with certified proof of each name change.',
      inPersonRequired: true,
      bringWithYou: [
        'Current Virginia credential',
        'Certified marriage certificate or other accepted name-change document filed with a government agency or court',
        'Documents showing your full name-change history if you have changed names more than once',
        'DMV name-change application confirmation if you started online',
        'Payment for the replacement credential',
      ],
      steps: [
        'Change your name with the Social Security Administration first.',
        'Start the name change online if available, or go straight to a DMV customer service center with required proofs.',
        'Bring certified proof for each name change so every document matches.',
        'Surrender your current credential when DMV issues the replacement, as instructed.',
      ],
      links: [
        {
          label: 'Virginia DMV — start name change',
          url: 'https://www.dmv.virginia.gov/online-services/name-change',
          source: 'Virginia Department of Motor Vehicles',
        },
        {
          label: 'Virginia DMV — name change documents',
          url: 'https://www.dmv.virginia.gov/name-change',
          source: 'Virginia Department of Motor Vehicles',
        },
      ],
    },
    'voter-registration': {
      agencyName: 'Virginia Department of Elections',
      headline: 'Register or update your Virginia voter registration with your new name.',
      steps: [
        'Use the Virginia Department of Elections registration process.',
        'Submit your new legal name as it will appear on your ID.',
        'Confirm your registration status after your locality processes it.',
      ],
      links: [
        {
          label: 'Virginia — voter registration',
          url: 'https://www.elections.virginia.gov/registration/',
          source: 'Virginia Department of Elections',
        },
      ],
    },
    'professional-license': {
      agencyName: 'Virginia Department of Health Professions (and other boards)',
      headline:
        'Many Virginia health-related licenses are under DHP — other professions use separate boards.',
      steps: [
        'Find your board on the Department of Health Professions site or your non-DHP board’s site.',
        'Follow that board’s name-change instructions.',
        'You file the update; AfterIDo does not submit it for you.',
      ],
      links: [
        {
          label: 'Virginia Department of Health Professions',
          url: 'https://www.dhp.virginia.gov/',
          source: 'Virginia Department of Health Professions',
        },
      ],
    },
  },
};

export const STATE_GUIDANCE: Partial<Record<StateCode, StateProfile>> = {
  NJ: NEW_JERSEY,
  CA: CALIFORNIA,
  TX: TEXAS,
  FL: FLORIDA,
  NY: NEW_YORK,
  PA: PENNSYLVANIA,
  IL: ILLINOIS,
  OH: OHIO,
  GA: GEORGIA,
  NC: NORTH_CAROLINA,
  MI: MICHIGAN,
  VA: VIRGINIA,
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
    lastReviewed: REVIEWED,
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

// ---------------------------------------------------------------------------
// URL slugs, for the public state guides
// ---------------------------------------------------------------------------

/**
 * /name-change-after-marriage/new-jersey and friends.
 *
 * Derived from the state names rather than hand-written, so a slug can never
 * drift from the state it names. `stateSlug` lives in shared/ because the
 * Worker needs it too, for the sitemap and for link previews.
 */
export const STATE_SLUG: Record<StateCode, string> = Object.fromEntries(
  US_STATES.map((s) => [s.code, stateSlug(s.name)]),
) as Record<StateCode, string>;

export const STATE_BY_SLUG: Record<string, StateCode> = Object.fromEntries(
  US_STATES.map((s) => [stateSlug(s.name), s.code]),
);

export function stateNameForSlug(slug: string): string | null {
  const code = STATE_BY_SLUG[slug];
  return code ? STATE_NAME[code] : null;
}
