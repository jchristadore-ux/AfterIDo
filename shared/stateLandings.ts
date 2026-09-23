/**
 * Worker-safe SEO landing payloads for states with verified (`detailed`) coverage.
 *
 * Hand-maintained from `src/data/states.ts` detailed profiles (plus the federal
 * Social Security / passport backbone already in `src/data/tasks.ts`). Keeps the
 * Worker bundle lean: no React, no `@/types`, no full `states.ts` graph.
 *
 * Sitemap and SSR body advertising use only this list. Promoting a state to SEO
 * means setting `coverage: 'detailed'` in states.ts and refreshing the matching
 * entry here.
 */

export interface LandingLink {
  label: string;
  url: string;
}

export interface LandingStep {
  id: string;
  title: string;
  agencyName: string;
  headline: string;
  steps: string[];
  links: LandingLink[];
}

export interface StateLanding {
  code: string;
  name: string;
  slug: string;
  lastReviewed: string;
  sourceNote: string;
  /** Ordered backbone steps with official links only — nothing invented. */
  backbone: LandingStep[];
}

const FEDERAL_SOCIAL_SECURITY: LandingStep = {
  id: 'social-security',
  title: 'Update your name with Social Security',
  agencyName: 'Social Security Administration',
  headline:
    'Always first. Your Social Security record is the master record everyone else checks.',
  steps: [
    'Check whether you can do this online: SSA offers an online name change for marriages recorded in participating states if you have a valid state ID.',
    'If online is not available to you, complete Form SS-5, the Application for a Social Security Card. It is free.',
    'Bring or mail your certified marriage certificate and identity document. SSA returns original documents.',
  ],
  links: [
    {
      label: 'Change your name with Social Security',
      url: 'https://www.ssa.gov/life-events/change-name',
    },
    {
      label: 'Form SS-5 — Application for a Social Security Card (PDF)',
      url: 'https://www.ssa.gov/forms/ss-5.pdf',
    },
  ],
};

const FEDERAL_PASSPORT: LandingStep = {
  id: 'passport',
  title: 'Update your passport',
  agencyName: 'U.S. Department of State',
  headline:
    'After Social Security and your state ID, update your passport so travel documents match.',
  steps: [
    'Use the State Department guidance to choose Form DS-5504, DS-82, or DS-11 based on your situation.',
    'You file the passport application yourself; AfterIDo does not submit forms for you.',
  ],
  links: [
    {
      label: 'Change or correct a passport',
      url: 'https://travel.state.gov/content/travel/en/passports/have-passport/change-correct.html',
    },
  ],
};

function backboneFor(
  marriage: Omit<LandingStep, 'id' | 'title'>,
  license: Omit<LandingStep, 'id' | 'title'>,
): LandingStep[] {
  return [
    {
      id: 'marriage-certificate',
      title: 'Get certified copies of your marriage certificate',
      ...marriage,
    },
    FEDERAL_SOCIAL_SECURITY,
    {
      id: 'drivers-license',
      title: "Update your driver's license or state ID",
      ...license,
    },
    FEDERAL_PASSPORT,
  ];
}

/**
 * Only states with `coverage: 'detailed'` in states.ts. Order matches the
 * research rollout: NJ reference, then high-population states.
 */
export const DETAILED_STATE_LANDINGS: StateLanding[] = [

  {
    code: 'NJ',
    name: 'New Jersey',
    slug: 'new-jersey',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against NJ DOH Vital Statistics, NJ MVC name-change and 6 Points of ID pages, NJ Division of Elections, and NJ Division of Consumer Affairs.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'New Jersey Motor Vehicle Commission (MVC)',
        headline:
          'A name change is processed at any MVC licensing center on a walk-in basis — no appointment needed.',
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
          },
          {
            label: 'NJ MVC — 6 Points of ID',
            url: 'https://www.nj.gov/mvc/license/6pointid.htm',
          },
          {
            label: 'NJ MVC — licensing center locations',
            url: 'https://www.nj.gov/mvc/locations/agency_services.htm',
          },
        ],
      },
    ),
  },
  {
    code: 'CA',
    name: 'California',
    slug: 'california',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against California Courts Self-Help, California DMV DL/ID update guidance, registertovote.ca.gov / SOS elections, and DCA.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'California Department of Motor Vehicles (DMV)',
        headline:
          'Update Social Security first, then finish the name change in person at a DMV field office.',
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
          },
        ],
      },
    ),
  },
  {
    code: 'TX',
    name: 'Texas',
    slug: 'texas',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Texas DSHS marriage/divorce records, Texas DPS driver license name-change guidance, VoteTexas.gov, TDLR, and TxDMV motorist pages.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'Texas Department of Public Safety (DPS)',
        headline:
          'Visit a driver license office within 30 days of your name change with an original or certified marriage document.',
        steps: [
          'Gather an original or certified name-change document — photocopies are not accepted; laminated certified copies may be refused.',
          'Visit any Texas driver license office within 30 days of the change.',
          'Apply for a replacement (duplicate) license or ID with your new name.',
          'If the document is not in English, bring a certified English translation with the original.',
        ],
        links: [
          {
            label: 'Texas.gov — driver services (DPS name / address changes)',
            url: 'https://www.texas.gov/driver-services/index.html',
          },
        ],
      },
    ),
  },
  {
    code: 'FL',
    name: 'Florida',
    slug: 'florida',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Florida DOH marriage certificates, FLHSMV name/address change pages, Florida Division of Elections, and MyFloridaLicense.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'Florida Highway Safety and Motor Vehicles (FLHSMV)',
        headline:
          'Update Social Security first, wait 24–48 hours, then complete the name change in person within 30 days.',
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
          },
          {
            label: 'FLHSMV — U.S. citizen document checklist',
            url: 'https://www.flhsmv.gov/driver-licenses-id-cards/what-to-bring/u-s-citizen/',
          },
        ],
      },
    ),
  },
  {
    code: 'NY',
    name: 'New York',
    slug: 'new-york',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against NYS DOH Vital Records (outside NYC), NYC City Clerk marriage records, NY DMV photo-document change guidance, NYS Board of Elections, and NYSED Office of the Professions.',
    backbone: backboneFor(
      {
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
          },
          {
            label: 'NYC City Clerk — marriage records',
            url: 'https://www.cityclerk.nyc.gov/content/marriage-records',
          },
        ],
      },
      {
        agencyName: 'New York State Department of Motor Vehicles (DMV)',
        headline:
          'Update Social Security first. Most REAL ID / Enhanced changes are in person; some Standard documents can be updated by mail.',
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
          },
        ],
      },
    ),
  },
  {
    code: 'PA',
    name: 'Pennsylvania',
    slug: 'pennsylvania',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against PA marriage-records guidance (county Register of Wills / Clerk of Orphans’ Court), PennDOT name-change service pages, PA Votes voter update pages (pa.gov), and DOS Professional Licensing.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'PennDOT Driver and Vehicle Services',
        headline:
          'Name changes are done in person at a Driver License Center with original documents.',
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
          },
          {
            label: 'PennDOT — REAL ID name-change documents',
            url: 'https://www.pa.gov/agencies/dmv/driver-services/real-id/name-changes-real-id',
          },
        ],
      },
    ),
  },
  {
    code: 'IL',
    name: 'Illinois',
    slug: 'illinois',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Illinois DPH marriage-records guidance (county clerk), Illinois.gov Secretary of State agency page, Illinois State Board of Elections, and IDFPR. Vehicle title/registration left to the generic catalog until a durable official SOS vehicle URL is confirmed.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'Illinois Secretary of State — Driver Services',
        headline:
          'Visit a Driver Services facility for a corrected license; Illinois expects name changes to be reported promptly.',
        steps: [
          'Update Social Security first when your new license name must match SSA.',
          'Go to a Secretary of State Driver Services facility in person.',
          'Bring an original or certified name-change document — photocopies are not accepted.',
          'Surrender your current credential when you receive the corrected one, as instructed at the facility.',
        ],
        links: [
          {
            label: 'Illinois Secretary of State (official agency page)',
            url: 'https://www.illinois.gov/agencies/agency.sos.html',
          },
        ],
      },
    ),
  },
  {
    code: 'OH',
    name: 'Ohio',
    slug: 'ohio',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Ohio Department of Health Vital Statistics (marriage records held by counties), Ohio BMV identity-document guidance, Ohio SOS elections, eLicense.ohio.gov, and BMV title pages.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'Ohio Bureau of Motor Vehicles (BMV)',
        headline:
          'Bring an original or certified marriage certificate to connect your birth name to your current legal name at a deputy registrar.',
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
          },
        ],
      },
    ),
  },
  {
    code: 'GA',
    name: 'Georgia',
    slug: 'georgia',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Georgia DPH marriage vital-record guidance, Georgia DDS name-change rules, Georgia.gov voter registration, Georgia SOS licensing, and Georgia DOR motor vehicles.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'Georgia Department of Driver Services (DDS)',
        headline:
          'Name changes must be completed in person at a DDS Customer Service Center within 60 days.',
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
          },
          {
            label: 'Georgia Department of Driver Services',
            url: 'https://dds.georgia.gov/',
          },
        ],
      },
    ),
  },
  {
    code: 'NC',
    name: 'North Carolina',
    slug: 'north-carolina',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against NC Vital Records marriage pages, NCDMV name-change guidance, NCSBE voter registration, NC licensing directory, and NCDMV title/registration pages.',
    backbone: backboneFor(
      {
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
          },
          {
            label: 'NC Vital Records — order a certificate',
            url: 'https://vitalrecords.nc.gov/order.htm',
          },
        ],
      },
      {
        agencyName: 'North Carolina Division of Motor Vehicles (NCDMV)',
        headline:
          'Notify NCDMV within 60 days and obtain a duplicate credential with your new name after updating Social Security.',
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
          },
        ],
      },
    ),
  },
  {
    code: 'MI',
    name: 'Michigan',
    slug: 'michigan',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Michigan MDHHS Vital Records ordering pages, Michigan SOS license/ID name-correction guidance, Michigan SOS voter registration, and LARA Bureau of Professional Licensing.',
    backbone: backboneFor(
      {
        agencyName: 'Michigan Department of Health and Human Services — Vital Records',
        headline:
          'Order a certified Michigan marriage record through MDHHS Vital Records.',
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
          },
        ],
      },
      {
        agencyName: 'Michigan Secretary of State',
        headline:
          'Name corrections are done at a Secretary of State office after Social Security has your new name on file.',
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
          },
        ],
      },
    ),
  },
  {
    code: 'VA',
    name: 'Virginia',
    slug: 'virginia',
    lastReviewed: '2026-09-23',
    sourceNote:
      'Reviewed against Virginia DMV vital-records and name-change pages, Virginia Department of Elections, and Virginia Department of Health Professions.',
    backbone: backboneFor(
      {
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
          },
        ],
      },
      {
        agencyName: 'Virginia Department of Motor Vehicles (DMV)',
        headline:
          'Update Social Security first, then complete DMV’s name-change process with certified proof of each name change.',
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
          },
          {
            label: 'Virginia DMV — name change documents',
            url: 'https://www.dmv.virginia.gov/name-change',
          },
        ],
      },
    ),
  },
];

const BY_SLUG = new Map(DETAILED_STATE_LANDINGS.map((s) => [s.slug, s]));

export function getDetailedLanding(slug: string): StateLanding | undefined {
  return BY_SLUG.get(slug);
}

export function isDetailedStateSlug(slug: string): boolean {
  return BY_SLUG.has(slug);
}

/** Slugs that belong in the sitemap / are indexable. */
export function detailedStateSlugs(): string[] {
  return DETAILED_STATE_LANDINGS.map((s) => s.slug);
}

/** All US state + DC names for slug → name meta (basic pages still resolve). */
export const ALL_STATE_NAMES = [
  'Alabama', 'Alaska', 'Arizona', 'Arkansas', 'California', 'Colorado', 'Connecticut',
  'Delaware', 'District of Columbia', 'Florida', 'Georgia', 'Hawaii', 'Idaho', 'Illinois',
  'Indiana', 'Iowa', 'Kansas', 'Kentucky', 'Louisiana', 'Maine', 'Maryland', 'Massachusetts',
  'Michigan', 'Minnesota', 'Mississippi', 'Missouri', 'Montana', 'Nebraska', 'Nevada',
  'New Hampshire', 'New Jersey', 'New Mexico', 'New York', 'North Carolina', 'North Dakota',
  'Ohio', 'Oklahoma', 'Oregon', 'Pennsylvania', 'Rhode Island', 'South Carolina', 'South Dakota',
  'Tennessee', 'Texas', 'Utah', 'Vermont', 'Virginia', 'Washington', 'West Virginia',
  'Wisconsin', 'Wyoming',
] as const;

