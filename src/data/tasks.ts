import type { CircumstanceId, Profile, TaskDefinition } from '@/types';

/**
 * The NameDay task catalog.
 *
 * Rules this file follows, deliberately:
 *  - Every `officialLinks` entry points at a government agency or the actual
 *    company involved. We never link to an affiliate or a lookalike.
 *  - We never describe a legal requirement we can't attribute. Where a fact
 *    came from a specific official page it is recorded in `sourceNote`.
 *  - `weCan` is honest: 'prepare' means NameDay assembles the information or a
 *    letter; 'submit' means she files it herself and we only organize the run.
 *    Nothing in this app submits anything to an agency.
 *
 * Facts and links below were checked against official sources in August 2026.
 * Requirements change — the UI always tells the user to confirm on the
 * official page before relying on a detail.
 */

const has =
  (id: CircumstanceId) =>
  (p: Profile): boolean =>
    p.circumstances.includes(id);

const hasAny =
  (...ids: CircumstanceId[]) =>
  (p: Profile): boolean =>
    ids.some((id) => p.circumstances.includes(id));

export const TASKS: TaskDefinition[] = [
  // ---------------------------------------------------------------- STEP 1
  {
    id: 'marriage-certificate',
    title: 'Get certified copies of your marriage certificate',
    summary:
      'The single document every other step asks for. Get more than one.',
    category: 'foundation',
    priority: 'do-first',
    step: 1,
    whyNow:
      'Nothing else can start without this. Agencies want a certified copy with a raised or colored seal — a photo, photocopy, or the decorative certificate from your ceremony will not be accepted.',
    estimatedMinutes: [15, 45],
    dependsOn: [],
    whatYouNeed: [
      'The county and state where your marriage license was issued',
      'Your date of marriage',
      'Photo ID',
      'A payment method for the copy fee',
    ],
    steps: [
      'Contact the vital records office (or municipal clerk) in the county where your marriage license was issued.',
      'Request certified copies — the kind with an official raised or colored seal.',
      'Order at least three. Social Security, your state motor vehicle agency and the passport agency may each hold one temporarily.',
      'Keep one copy at home and never mail your only copy.',
      'Add the copies to your Documents so you always know how many you have.',
    ],
    whatHappensNext:
      'Once certified copies are in hand, Social Security is your very next step — everything downstream checks against that record.',
    officialLinks: [
      {
        label: 'Find your state or county vital records office',
        url: 'https://www.cdc.gov/nchs/w2w/index.htm',
        source: 'CDC — Where to Write for Vital Records',
      },
      {
        label: 'New Jersey: order a certified marriage record',
        url: 'https://www.nj.gov/health/vital/order-vital/',
        source: 'NJ Department of Health, Vital Statistics & Registry',
      },
    ],
    prefill: ['currentFullName', 'spouseName', 'marriageDate', 'marriagePlace'],
    weCan: 'prepare',
    sourceNote:
      'Certified-copy requirement per NJ MVC 6 Points of ID guidance: documents must be original or certified copies bearing the required seals.',
  },

  // ---------------------------------------------------------------- STEP 2
  {
    id: 'social-security',
    title: 'Update your name with Social Security',
    summary:
      'Always first. Your Social Security record is the master record everyone else checks.',
    category: 'government',
    priority: 'do-first',
    step: 2,
    whyNow:
      'Your state motor vehicle agency, your employer, the IRS and your bank all verify names against Social Security. Change anything else first and it may simply be rejected — or quietly mismatch at tax time.',
    estimatedMinutes: [20, 40],
    dependsOn: ['marriage-certificate'],
    whatYouNeed: [
      'Certified marriage certificate',
      'Proof of identity (current driver’s license, state ID or passport)',
      'Your Social Security number (you know it — do not store it here)',
    ],
    steps: [
      'Check whether you can do this online: SSA offers an online name change for marriages recorded in participating states if you have a valid state ID.',
      'If online is not available to you, complete Form SS-5, the Application for a Social Security Card. It is free.',
      'Bring or mail your certified marriage certificate and identity document. SSA returns original documents.',
      'Your Social Security number does not change — only the name attached to it.',
      'Watch for your replacement card in the mail, then mark this complete.',
    ],
    whatHappensNext:
      'SSA advises waiting at least 30 days after your marriage date before requesting the change so your state has time to update its records. Replacement cards typically arrive within 5–10 business days once the request is processed. Give SSA a couple of business days to propagate before you visit the DMV.',
    officialLinks: [
      {
        label: 'Change your name with Social Security',
        url: 'https://www.ssa.gov/life-events/change-name',
        source: 'Social Security Administration',
      },
      {
        label: 'Form SS-5 — Application for a Social Security Card (PDF)',
        url: 'https://www.ssa.gov/forms/ss-5.pdf',
        source: 'Social Security Administration',
      },
      {
        label: 'Which documents SSA will accept',
        url: 'https://www.ssa.gov/ssnumber/ss5doc.htm',
        source: 'Social Security Administration',
      },
    ],
    prefill: [
      'newFirst',
      'newMiddle',
      'newLast',
      'currentFirst',
      'currentMiddle',
      'currentLast',
      'dateOfBirth',
      'addressBlock',
      'phone',
    ],
    weCan: 'prepare',
    sourceNote:
      'Form number, no fee, 30-day guidance and 5–10 business day card delivery per ssa.gov/life-events/change-name (reviewed August 2026).',
  },

  // ---------------------------------------------------------------- STEP 3
  {
    id: 'drivers-license',
    title: 'Update your driver’s license or state ID',
    summary:
      'Your everyday proof of identity — and what most other places will ask to see.',
    category: 'government',
    priority: 'do-first',
    step: 3,
    whyNow:
      'Most motor vehicle agencies verify your name against Social Security, so this has to come after SSA. Once it is done you have a photo ID in your new name, which makes every remaining step dramatically easier.',
    estimatedMinutes: [45, 120],
    dependsOn: ['social-security'],
    whatYouNeed: [
      'Certified marriage certificate',
      'Your current driver’s license or state ID',
      'Proof of your Social Security number',
      'Proof of address',
      'A fee — most states charge for a replacement license',
    ],
    steps: [
      'Confirm your Social Security record has been updated first.',
      'Check whether your state allows this online or requires an in-person visit. Most require in person because a new photo and signature are taken.',
      'Gather every identity document your state requires — bring more than you think you need.',
      'Visit the agency and request a name change on your license or ID.',
      'You typically leave with a temporary paper license; the permanent card arrives by mail.',
    ],
    whatHappensNext:
      'Once your new license arrives, use it as your primary ID everywhere else on this list. Update your vehicle registration and title at the same visit if your state handles both together.',
    officialLinks: [
      {
        label: 'Find your state motor vehicle agency',
        url: 'https://www.usa.gov/motor-vehicle-services',
        source: 'USA.gov',
      },
    ],
    prefill: [
      'newFirst',
      'newMiddle',
      'newLast',
      'currentFullName',
      'dateOfBirth',
      'addressBlock',
      'phone',
    ],
    weCan: 'prepare',
  },

  // ---------------------------------------------------------------- STEP 4
  {
    id: 'passport',
    title: 'Update your passport',
    summary:
      'Do this well before any trip — and never book travel in a name your passport does not show.',
    category: 'government',
    priority: 'do-soon',
    step: 4,
    whyNow:
      'Your passport must match the name on your airline ticket. Do it after Social Security and your license so all three agree, and start early: processing takes weeks, and your passport is out of your hands while it is in progress.',
    estimatedMinutes: [45, 90],
    dependsOn: ['social-security'],
    whatYouNeed: [
      'Your most recent passport',
      'Certified marriage certificate',
      'One new passport photo',
      'The correct form for your situation (see below)',
      'Fee, unless you qualify for the no-cost correction window',
    ],
    steps: [
      'Work out which form applies: if your passport was issued less than a year ago, Form DS-5504 is used and there is generally no fee unless you request expedited service. More than a year ago, Form DS-82 applies if you are eligible to renew by mail.',
      'Have a new passport photo taken that meets State Department requirements.',
      'Complete the form — the State Department has an online Form Filler that prints a completed copy.',
      'Mail the form with your current passport, your certified marriage certificate and photo. Use trackable mail.',
      'Do not schedule international travel until the new passport is in hand.',
    ],
    whatHappensNext:
      'Your certified marriage certificate is returned to you with your new passport. Once it arrives, update TSA PreCheck, Global Entry and your airline profiles so they all match.',
    officialLinks: [
      {
        label: 'Change or correct a passport',
        url: 'https://travel.state.gov/content/travel/en/passports/have-passport/change-correct.html',
        source: 'U.S. Department of State',
      },
      {
        label: 'Form DS-5504 (PDF)',
        url: 'https://eforms.state.gov/Forms/ds5504_pdf.PDF',
        source: 'U.S. Department of State',
      },
      {
        label: 'Form DS-82 (PDF)',
        url: 'https://eforms.state.gov/Forms/ds82_pdf.PDF',
        source: 'U.S. Department of State',
      },
    ],
    prefill: [
      'newFirst',
      'newMiddle',
      'newLast',
      'currentFullName',
      'dateOfBirth',
      'addressBlock',
      'phone',
      'email',
      'marriageDate',
    ],
    weCan: 'prepare',
    appliesIf: has('has-passport'),
    sourceNote:
      'DS-5504 vs DS-82 selection and the one-year window per travel.state.gov "Change or Correct a Passport" (reviewed August 2026).',
  },

  // ---------------------------------------------------------------- STEP 5+
  {
    id: 'employer-hr',
    title: 'Tell your employer’s HR team',
    summary:
      'One conversation that usually updates payroll, benefits and your employee record together.',
    category: 'employment',
    priority: 'do-soon',
    step: 5,
    whyNow:
      'Your W-2 has to match Social Security or your tax return can be delayed. Most HR systems also feed payroll, health insurance and your 401(k), so this one step often knocks out four.',
    estimatedMinutes: [15, 30],
    dependsOn: ['social-security'],
    whatYouNeed: [
      'Your new Social Security card, or confirmation the change went through',
      'Certified marriage certificate (some employers ask, some do not)',
    ],
    steps: [
      'Email or message HR that you have legally changed your name.',
      'Ask specifically which systems they update for you and which you must handle yourself.',
      'Confirm payroll, benefits, retirement plan and your employee directory listing.',
      'Ask whether your work email address and employee ID badge change too.',
    ],
    whatHappensNext:
      'Check your next pay stub. If the name is still old, payroll did not pick up the change — go back to HR before the quarter closes.',
    officialLinks: [],
    prefill: [
      'currentFullName',
      'newFullName',
      'dateOfBirth',
      'addressBlock',
      'phone',
      'email',
      'marriageDate',
    ],
    weCan: 'prepare',
    appliesIf: has('employed'),
  },
  {
    id: 'payroll-w4',
    title: 'Update payroll and your Form W-4',
    summary: 'Make sure your paycheck and year-end W-2 carry the right name.',
    category: 'employment',
    priority: 'do-soon',
    step: 6,
    whyNow:
      'The IRS matches the name on your W-2 against Social Security records. A mismatch is one of the most common reasons a refund gets held up.',
    estimatedMinutes: [10, 20],
    dependsOn: ['social-security', 'employer-hr'],
    whatYouNeed: ['Your updated Social Security record', 'Payroll system login'],
    steps: [
      'Log into your payroll system and check the name on your most recent stub.',
      'Submit a new Form W-4 in your new name — marriage may also change the withholding you want.',
      'Update your direct deposit if your bank account name changed.',
    ],
    officialLinks: [
      {
        label: 'Form W-4 (PDF)',
        url: 'https://www.irs.gov/pub/irs-pdf/fw4.pdf',
        source: 'Internal Revenue Service',
      },
    ],
    prefill: ['newFullName', 'addressBlock'],
    weCan: 'prepare',
    appliesIf: has('employed'),
  },
  {
    id: 'bank-accounts',
    title: 'Update your bank accounts',
    summary:
      'Checking, savings and anything with your name printed on it.',
    category: 'financial',
    priority: 'do-soon',
    step: 7,
    whyNow:
      'Do this once you have photo ID in your new name — most banks require you to appear in a branch or upload an ID, and your old license will not do.',
    estimatedMinutes: [20, 60],
    dependsOn: ['drivers-license'],
    whatYouNeed: [
      'New driver’s license or state ID',
      'Certified marriage certificate',
      'Your account numbers',
    ],
    steps: [
      'List every bank you hold an account with, including old accounts you rarely use.',
      'Check each bank’s process — many now allow a document upload in the app.',
      'Request new debit cards and checks in your new name.',
      'Update the name on any joint accounts and beneficiary designations while you are there.',
    ],
    whatHappensNext:
      'Watch for a new debit card in the mail, and keep the old card until the new one is activated.',
    officialLinks: [],
    prefill: [
      'currentFullName',
      'newFullName',
      'dateOfBirth',
      'addressBlock',
      'phone',
      'email',
    ],
    weCan: 'prepare',
    instanceLabel: 'Bank',
  },
  {
    id: 'credit-cards',
    title: 'Update your credit cards',
    summary: 'Each issuer separately — one card at a time.',
    category: 'financial',
    priority: 'do-soon',
    step: 8,
    whyNow:
      'Your card name should match your ID for hotel check-ins, car rentals and any purchase where an agent compares them.',
    estimatedMinutes: [20, 45],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['New photo ID', 'Certified marriage certificate for some issuers'],
    steps: [
      'List every card in your wallet, plus store cards you keep at home.',
      'Call the number on the back of each card, or use the issuer’s secure message center.',
      'Ask for a replacement card in your new name — this normally does not affect your credit line or account age.',
      'Update the name on file for autopay and any card stored in a digital wallet.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'phone'],
    weCan: 'prepare',
    instanceLabel: 'Card issuer',
  },
  {
    id: 'health-insurance',
    title: 'Update your health insurance',
    summary:
      'Marriage is also a qualifying life event — you may be able to change plans.',
    category: 'insurance',
    priority: 'do-soon',
    step: 9,
    whyNow:
      'Getting married usually opens a special enrollment window with a deadline, often 30 or 60 days. Missing it can mean waiting until the next open enrollment.',
    estimatedMinutes: [20, 45],
    dependsOn: [],
    whatYouNeed: [
      'Certified marriage certificate',
      'Your member ID',
      'Your spouse’s information if you are combining coverage',
    ],
    steps: [
      'Report the name change to your plan or through your employer’s benefits portal.',
      'Ask about the special enrollment window that marriage opens, and confirm its deadline in writing.',
      'Decide whether to combine coverage with your spouse.',
      'Request a new insurance card and confirm the name your pharmacy has on file matches it.',
    ],
    whatHappensNext:
      'Bring the new card to your next appointment — a name mismatch between your ID and your insurance card is a common reason claims get denied.',
    officialLinks: [
      {
        label: 'Marriage and special enrollment periods',
        url: 'https://www.healthcare.gov/coverage-outside-open-enrollment/special-enrollment-period/',
        source: 'HealthCare.gov',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'phone', 'marriageDate'],
    weCan: 'prepare',
  },
  {
    id: 'auto-insurance',
    title: 'Update your auto insurance',
    summary: 'And ask about the multi-car or married discount while you are at it.',
    category: 'insurance',
    priority: 'do-soon',
    step: 10,
    whyNow:
      'Your policy name should match your license. Combining policies with your spouse often lowers the premium, so this call frequently pays for itself.',
    estimatedMinutes: [15, 30],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['New driver’s license number', 'Policy number', 'Spouse’s license if combining'],
    steps: [
      'Call your agent or update the name in your insurer’s app.',
      'Give them your new license number.',
      'Ask whether combining policies with your spouse lowers your rate.',
      'Download the new ID card to your phone and put a paper copy in the glove box.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'phone'],
    weCan: 'prepare',
  },
  {
    id: 'vehicle-title-registration',
    title: 'Update your vehicle title and registration',
    summary: 'Often handled at the same motor vehicle visit as your license.',
    category: 'government',
    priority: 'do-soon',
    step: 11,
    whyNow:
      'Doing it in the same visit as your license saves you a second trip. If a lender holds the title, they have to be involved.',
    estimatedMinutes: [20, 60],
    dependsOn: ['drivers-license'],
    whatYouNeed: [
      'Current registration and title (or your lender’s information)',
      'New driver’s license',
      'Certified marriage certificate',
      'Proof of insurance',
    ],
    steps: [
      'Ask your motor vehicle agency whether title and registration name changes happen at the counter.',
      'If a lender holds your title, contact them first — they must submit or release it.',
      'Update the registration, then confirm your insurance matches.',
    ],
    officialLinks: [
      {
        label: 'Find your state motor vehicle agency',
        url: 'https://www.usa.gov/motor-vehicle-services',
        source: 'USA.gov',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'dateOfBirth'],
    weCan: 'prepare',
  },
  {
    id: 'voter-registration',
    title: 'Update your voter registration',
    summary: 'Quick, free, and easy to forget until an election is days away.',
    category: 'government',
    priority: 'do-soon',
    step: 12,
    whyNow:
      'Poll books are checked against your registration. Do it right after your license so the two records match, and well before any registration deadline.',
    estimatedMinutes: [10, 15],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['New driver’s license number', 'Last four digits of your Social Security number'],
    steps: [
      'Open your state’s voter registration page.',
      'Submit a registration update with your new name — in most states this uses the same form as a new registration.',
      'Check your registration status a week later to confirm it took effect.',
    ],
    officialLinks: [
      {
        label: 'Register to vote or update your registration',
        url: 'https://www.usa.gov/voter-registration',
        source: 'USA.gov',
      },
      {
        label: 'New Jersey voter registration',
        url: 'https://nj.gov/state/elections/voter-registration.shtml',
        source: 'NJ Department of State, Division of Elections',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock'],
    weCan: 'prepare',
  },
  {
    id: 'taxes',
    title: 'Check your tax records',
    summary:
      'There is no separate IRS name-change form for individuals — updating Social Security is what does it.',
    category: 'government',
    priority: 'do-soon',
    step: 13,
    whyNow:
      'The IRS matches the name on your return against Social Security records. If you file before SSA has processed the change, use the name that Social Security currently has.',
    estimatedMinutes: [10, 20],
    dependsOn: ['social-security'],
    whatYouNeed: ['Confirmation your Social Security record was updated'],
    steps: [
      'Confirm Social Security shows your new name — that is what the IRS checks against.',
      'File your return in the name Social Security has on record at the time you file.',
      'Update the name with your state tax agency if it maintains a separate record.',
      'If you use a tax preparer or software, update your profile there too.',
    ],
    officialLinks: [
      {
        label: 'IRS: name changes and Social Security matching',
        url: 'https://www.irs.gov/faqs/irs-procedures/name-changes-social-security-number-matching-issues',
        source: 'Internal Revenue Service',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'marriageDate'],
    weCan: 'prepare',
    sourceNote:
      'IRS guidance: report a name change to SSA before filing so the name on the return matches SSA records.',
  },
  {
    id: 'retirement-accounts',
    title: 'Update retirement accounts and beneficiaries',
    summary:
      '401(k), IRA and pension — and the beneficiary designations inside them.',
    category: 'financial',
    priority: 'do-soon',
    step: 14,
    whyNow:
      'Beneficiary designations on a retirement account generally control who inherits it, regardless of what a will says. Marriage is the moment to review them.',
    estimatedMinutes: [20, 45],
    dependsOn: ['social-security'],
    whatYouNeed: ['Account logins', 'Your spouse’s full legal name and date of birth'],
    steps: [
      'Update the account holder name with each plan administrator.',
      'Review and update the beneficiary on every retirement account.',
      'Ask your employer whether a 401(k) name change is handled by HR or directly with the plan provider.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'spouseName'],
    weCan: 'prepare',
    instanceLabel: 'Account',
  },
  {
    id: 'investment-accounts',
    title: 'Update investment and brokerage accounts',
    summary: 'Brokerage, HSA, 529 and anything else holding assets in your name.',
    category: 'financial',
    priority: 'anytime',
    step: 15,
    whyNow:
      'Not urgent day to day, but a mismatch can slow down a transfer or a withdrawal exactly when you need it to be fast.',
    estimatedMinutes: [20, 40],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['Account numbers', 'New photo ID', 'Certified marriage certificate'],
    steps: [
      'Submit a name change request with each brokerage — most have a specific form.',
      'Update beneficiaries at the same time.',
      'Check any accounts held for a child or with a parent as custodian.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock'],
    weCan: 'prepare',
    appliesIf: has('has-investments'),
    instanceLabel: 'Firm',
  },
  {
    id: 'mortgage',
    title: 'Notify your mortgage servicer',
    summary: 'Your name on the loan, and possibly on the deed.',
    category: 'financial',
    priority: 'anytime',
    step: 16,
    whyNow:
      'Your loan does not need to be refinanced for a name change, but the servicer needs the certificate on file so their records and your tax documents match.',
    estimatedMinutes: [20, 40],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['Loan number', 'Certified marriage certificate'],
    steps: [
      'Contact your servicer and ask for their name-change process — most want a copy of the certificate.',
      'Ask whether your escrow, insurance and tax records update automatically.',
      'Separately consider whether to update the deed — that is a county records question, not a lender one.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone', 'email'],
    weCan: 'prepare',
    appliesIf: has('has-mortgage'),
  },
  {
    id: 'property-records',
    title: 'Consider updating your property deed',
    summary:
      'Optional in many cases — and worth a short conversation with a real estate attorney.',
    category: 'government',
    priority: 'anytime',
    step: 17,
    whyNow:
      'A deed in your former name is generally still valid. Changing it involves recording a new deed with your county, which has real cost and real tax implications — so it is a decision, not a chore.',
    estimatedMinutes: [30, 60],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['Your current deed', 'Certified marriage certificate'],
    steps: [
      'Find your deed and check exactly how your name is written on it.',
      'Contact your county clerk or recorder of deeds to ask what a name correction requires.',
      'Talk to a real estate attorney before recording anything — NameDay cannot advise on this.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock'],
    weCan: 'prepare',
    appliesIf: has('owns-home'),
  },
  {
    id: 'professional-license',
    title: 'Update your professional license',
    summary: 'Nursing, teaching, real estate, law, cosmetology and more.',
    category: 'government',
    priority: 'do-soon',
    step: 18,
    whyNow:
      'Many licensing boards set a deadline for reporting a legal name change — sometimes as short as 30 days — and your license must match your ID at work.',
    estimatedMinutes: [20, 45],
    dependsOn: ['social-security'],
    whatYouNeed: ['License number', 'Certified marriage certificate', 'Board fee, if any'],
    steps: [
      'Find your licensing board — it is usually a state agency, not a national one.',
      'Check their name-change form and their reporting deadline.',
      'Submit the change, then request a reissued license or certificate.',
      'Update any national certification separately from your state license.',
    ],
    officialLinks: [
      {
        label: 'New Jersey Division of Consumer Affairs (professional boards)',
        url: 'https://www.njconsumeraffairs.gov/',
        source: 'NJ Division of Consumer Affairs',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'email', 'phone'],
    weCan: 'prepare',
    appliesIf: has('has-professional-license'),
  },
  {
    id: 'life-insurance',
    title: 'Update life insurance and beneficiaries',
    summary: 'The policy name, and — more importantly — who receives it.',
    category: 'insurance',
    priority: 'do-soon',
    step: 19,
    whyNow:
      'A life insurance beneficiary is one of the few designations that overrides a will. If it still names someone from before your marriage, that is who receives it.',
    estimatedMinutes: [15, 30],
    dependsOn: [],
    whatYouNeed: ['Policy numbers', 'Spouse’s full legal name and date of birth'],
    steps: [
      'Update the insured’s name on each policy.',
      'Review the beneficiary on every policy, including the one through your employer.',
      'Get written confirmation the beneficiary change was recorded.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'spouseName'],
    weCan: 'prepare',
  },
  {
    id: 'home-renters-insurance',
    title: 'Update homeowners or renters insurance',
    summary: 'And add your spouse to the policy if they are not on it.',
    category: 'insurance',
    priority: 'anytime',
    step: 20,
    whyNow:
      'A claim paid to a name that does not match your ID is a headache you only discover at the worst possible moment.',
    estimatedMinutes: [10, 25],
    dependsOn: [],
    whatYouNeed: ['Policy number', 'New photo ID'],
    steps: [
      'Call your agent or update the policy online.',
      'Add your spouse as a named insured if appropriate.',
      'Ask whether bundling with auto lowers your premium.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone', 'email'],
    weCan: 'prepare',
  },
  {
    id: 'disability-insurance',
    title: 'Update disability insurance',
    summary: 'Short-term and long-term, whether through work or your own policy.',
    category: 'insurance',
    priority: 'anytime',
    step: 21,
    whyNow:
      'Claims are matched to your employment and medical records. A name mismatch is a reason to delay a payment you would be relying on.',
    estimatedMinutes: [10, 20],
    dependsOn: [],
    whatYouNeed: ['Policy or certificate number'],
    steps: [
      'Ask HR whether your group disability coverage updates with your employee record.',
      'Update any individual policy directly with the insurer.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock'],
    weCan: 'prepare',
  },
  {
    id: 'auto-loan',
    title: 'Update your car loan or lease',
    summary: 'The lender holds your title — they need to know.',
    category: 'financial',
    priority: 'anytime',
    step: 22,
    whyNow:
      'If you plan to update your vehicle title, the lender has to be part of it. Do this alongside registration.',
    estimatedMinutes: [15, 30],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['Account number', 'Certified marriage certificate'],
    steps: [
      'Contact your lender or leasing company and ask for their name-change process.',
      'Confirm how it interacts with your title and registration.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone'],
    weCan: 'prepare',
    appliesIf: has('has-auto-loan'),
  },
  {
    id: 'student-loans',
    title: 'Update your student loans',
    summary: 'Federal servicers and private lenders each need it separately.',
    category: 'financial',
    priority: 'anytime',
    step: 23,
    whyNow:
      'Income-driven repayment and forgiveness programs check your identity and tax records. Keeping them aligned protects your progress.',
    estimatedMinutes: [15, 30],
    dependsOn: ['social-security'],
    whatYouNeed: ['Servicer login', 'Certified marriage certificate'],
    steps: [
      'Update your name on StudentAid.gov for federal loans.',
      'Update each servicer separately — your servicer is not the same as the Department of Education.',
      'Contact private lenders individually.',
      'If you are on an income-driven plan, ask how marriage affects your payment before your next recertification.',
    ],
    officialLinks: [
      {
        label: 'Federal Student Aid',
        url: 'https://studentaid.gov/',
        source: 'U.S. Department of Education',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'email'],
    weCan: 'prepare',
    appliesIf: has('has-student-loans'),
  },
  {
    id: 'credit-bureaus',
    title: 'Check your credit report',
    summary: 'Confirm your new name shows up — and that nothing else changed.',
    category: 'financial',
    priority: 'anytime',
    step: 24,
    whyNow:
      'Credit bureaus pick up your new name from your creditors rather than from you, so do this a month or two after your banks and cards are done.',
    estimatedMinutes: [15, 30],
    dependsOn: ['bank-accounts', 'credit-cards'],
    whatYouNeed: ['Identifying information to verify yourself'],
    steps: [
      'Request your free credit reports from the official federal site.',
      'Confirm your new name appears, with the former name listed as an alias.',
      'Dispute anything inaccurate directly with the bureau.',
    ],
    officialLinks: [
      {
        label: 'AnnualCreditReport.com — the federally authorized source',
        url: 'https://www.annualcreditreport.com/',
        source: 'Authorized by federal law; run by the three nationwide bureaus',
      },
      {
        label: 'CFPB guidance on credit reports',
        url: 'https://www.consumerfinance.gov/consumer-tools/credit-reports-and-scores/',
        source: 'Consumer Financial Protection Bureau',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock'],
    weCan: 'prepare',
  },
  {
    id: 'estate-documents',
    title: 'Update your will and estate documents',
    summary:
      'Will, power of attorney, healthcare directive — the documents that speak for you.',
    category: 'personal',
    priority: 'do-soon',
    step: 25,
    whyNow:
      'Marriage changes who you would want making decisions for you. These documents are the ones nobody thinks about until they matter enormously.',
    estimatedMinutes: [30, 90],
    dependsOn: [],
    whatYouNeed: ['Existing documents, if you have them'],
    steps: [
      'Locate your will, power of attorney and healthcare directive.',
      'Update the name and, more importantly, the people named in them.',
      'Talk to an estate attorney — NameDay is not a law firm and cannot advise here.',
      'Tell your spouse where the originals are kept.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'spouseName', 'marriageDate'],
    weCan: 'prepare',
  },
  {
    id: 'medical-providers',
    title: 'Update your doctors, dentist and pharmacy',
    summary: 'So your prescriptions and your insurance card agree.',
    category: 'personal',
    priority: 'do-soon',
    step: 26,
    whyNow:
      'A pharmacy will not release a prescription written in a name that does not match your ID. Fix this before you need a refill.',
    estimatedMinutes: [20, 40],
    dependsOn: ['health-insurance'],
    whatYouNeed: ['New insurance card', 'New photo ID'],
    steps: [
      'Update the name in each patient portal.',
      'Call your pharmacy directly — portals often do not reach them.',
      'Update your dentist, specialists, therapist and vision provider.',
      'Update emergency contacts while you are in there.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'phone', 'email'],
    weCan: 'prepare',
    instanceLabel: 'Provider',
  },
  {
    id: 'utilities',
    title: 'Update utilities and household accounts',
    summary: 'Electric, gas, water, trash — anything that bills you monthly.',
    category: 'personal',
    priority: 'anytime',
    step: 27,
    whyNow:
      'Utility accounts in your name build a quiet paper trail of residency. Worth keeping accurate, but nothing breaks if it waits a month.',
    estimatedMinutes: [20, 40],
    dependsOn: [],
    whatYouNeed: ['Account numbers', 'Certified marriage certificate for some providers'],
    steps: [
      'List every utility that bills your household.',
      'Update each online or by phone.',
      'Decide whether to add your spouse to the account.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone', 'email'],
    weCan: 'prepare',
    instanceLabel: 'Provider',
  },
  {
    id: 'phone-internet',
    title: 'Update phone and internet accounts',
    summary: 'Mobile carrier, home internet and streaming subscriptions.',
    category: 'personal',
    priority: 'anytime',
    step: 28,
    whyNow:
      'Your mobile carrier account is used to verify your identity for a surprising number of other services, so it is worth keeping current.',
    estimatedMinutes: [15, 30],
    dependsOn: [],
    whatYouNeed: ['Account PIN or password'],
    steps: [
      'Update the account holder name with your mobile carrier.',
      'Update your internet provider.',
      'Update the payment name on subscriptions if the card name changed.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone', 'email'],
    weCan: 'prepare',
  },
  {
    id: 'landlord-lease',
    title: 'Notify your landlord or building',
    summary: 'Lease, parking, package room and building directory.',
    category: 'personal',
    priority: 'anytime',
    step: 29,
    whyNow:
      'Mostly so your packages arrive and your name on the buzzer is right. A lease addendum is sometimes required — ask.',
    estimatedMinutes: [10, 20],
    dependsOn: [],
    whatYouNeed: ['Lease', 'Certified marriage certificate if a lease addendum is required'],
    steps: [
      'Send your landlord or property manager written notice of the name change.',
      'Ask whether a lease addendum is needed.',
      'Update the building directory, mailbox label and parking permit.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone', 'email', 'marriageDate'],
    weCan: 'prepare',
  },
  {
    id: 'memberships',
    title: 'Update memberships and loyalty programs',
    summary: 'Gym, warehouse club, library, alumni and professional associations.',
    category: 'personal',
    priority: 'anytime',
    step: 30,
    whyNow:
      'Purely convenience. Do these in one sitting when you have a spare half hour.',
    estimatedMinutes: [20, 40],
    dependsOn: [],
    whatYouNeed: ['Member numbers'],
    steps: [
      'Make a list of everywhere you scan a card or a membership number.',
      'Update each one online where possible.',
      'Ask for reissued cards where the name is printed.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'addressBlock', 'phone', 'email'],
    weCan: 'prepare',
    instanceLabel: 'Membership',
  },
  {
    id: 'school-records',
    title: 'Update your school or university records',
    summary: 'Registrar, financial aid, student ID and your diploma if you want it reissued.',
    category: 'personal',
    priority: 'anytime',
    step: 31,
    whyNow:
      'Transcripts follow you for decades. Getting the name right now saves an awkward explanation to a future employer.',
    estimatedMinutes: [20, 40],
    dependsOn: ['social-security'],
    whatYouNeed: ['Student ID number', 'Certified marriage certificate'],
    steps: [
      'Contact the registrar — they own the official record.',
      'Update financial aid separately.',
      'Ask whether a previously issued diploma can be reissued, and what it costs.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'email'],
    weCan: 'prepare',
    appliesIf: hasAny('is-student'),
  },
  {
    id: 'childrens-records',
    title: 'Update your name on your children’s records',
    summary: 'School, daycare, pediatrician and emergency contact lists.',
    category: 'personal',
    priority: 'do-soon',
    step: 32,
    whyNow:
      'A school will not release a child to an adult whose ID does not match the pickup list. Fix this before the first pickup after your name changes.',
    estimatedMinutes: [15, 30],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['New photo ID'],
    steps: [
      'Update the school or daycare authorized pickup list first.',
      'Update the pediatrician and dentist.',
      'Update emergency contacts everywhere your name appears.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'phone', 'email', 'addressBlock'],
    weCan: 'prepare',
    appliesIf: has('has-children'),
  },
  {
    id: 'pet-records',
    title: 'Update pet microchip and vet records',
    summary: 'The registry that reunites you with a lost pet.',
    category: 'personal',
    priority: 'anytime',
    step: 33,
    whyNow:
      'A microchip is only as good as the contact record behind it. Two minutes now, potentially everything later.',
    estimatedMinutes: [10, 20],
    dependsOn: [],
    whatYouNeed: ['Microchip number', 'Registry login'],
    steps: [
      'Update the microchip registry contact record.',
      'Update your vet and any pet insurance policy.',
      'Update the license or tag your municipality issues.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'phone', 'email', 'addressBlock'],
    weCan: 'prepare',
    appliesIf: has('has-pets'),
  },
  {
    id: 'veteran-benefits',
    title: 'Update VA and military records',
    summary: 'Benefits, DEERS and your military ID.',
    category: 'government',
    priority: 'do-soon',
    step: 34,
    whyNow:
      'VA benefits and TRICARE eligibility are tied to DEERS. A mismatch there can interrupt coverage.',
    estimatedMinutes: [30, 60],
    dependsOn: ['social-security'],
    whatYouNeed: ['Certified marriage certificate', 'Military ID', 'DD-214 if applicable'],
    steps: [
      'Update DEERS — this generally requires an in-person visit to an ID card office.',
      'Update your VA record for benefits and healthcare.',
      'Request a new military ID card.',
    ],
    officialLinks: [
      {
        label: 'VA.gov',
        url: 'https://www.va.gov/',
        source: 'U.S. Department of Veterans Affairs',
      },
      {
        label: 'DEERS / ID card office locator',
        url: 'https://idco.dmdc.osd.mil/idco/',
        source: 'U.S. Department of Defense',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'marriageDate'],
    weCan: 'prepare',
    appliesIf: has('is-veteran'),
  },
  {
    id: 'tsa-precheck',
    title: 'Update TSA PreCheck or Global Entry',
    summary: 'Your Known Traveler Number has to match your boarding pass.',
    category: 'travel-digital',
    priority: 'do-soon',
    step: 35,
    whyNow:
      'PreCheck only works when the name on your reservation matches the name on your trusted traveler record and your ID. Update this right after your passport.',
    estimatedMinutes: [15, 40],
    dependsOn: ['passport'],
    whatYouNeed: ['Known Traveler Number', 'New passport or license', 'Certified marriage certificate'],
    steps: [
      'Log into your Trusted Traveler Programs account and submit the name change.',
      'Global Entry name changes may require an in-person visit to an enrollment center.',
      'Once approved, update the name and Known Traveler Number in every airline profile.',
    ],
    officialLinks: [
      {
        label: 'Trusted Traveler Programs (Global Entry, NEXUS, SENTRI)',
        url: 'https://ttp.cbp.dhs.gov/',
        source: 'U.S. Customs and Border Protection',
      },
      {
        label: 'TSA PreCheck',
        url: 'https://www.tsa.gov/precheck',
        source: 'Transportation Security Administration',
      },
    ],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'addressBlock', 'email', 'phone'],
    weCan: 'prepare',
    appliesIf: has('has-tsa-precheck'),
  },
  {
    id: 'airline-hotel-loyalty',
    title: 'Update airline and hotel loyalty accounts',
    summary: 'Frequent flyer, hotel points and rental car profiles.',
    category: 'travel-digital',
    priority: 'anytime',
    step: 36,
    whyNow:
      'Points are not lost by a name change, but a mismatch between your profile and your ID can stop you at the gate or the counter.',
    estimatedMinutes: [20, 45],
    dependsOn: ['drivers-license'],
    whatYouNeed: ['Loyalty numbers', 'Copy of your certified marriage certificate'],
    steps: [
      'Most airlines require a scanned marriage certificate for a name change — expect a form, not a chat.',
      'Update hotel and rental car profiles, which are usually much simpler.',
      'Re-enter your Known Traveler Number after the name change goes through.',
      'Never change the name on a ticket you have already booked without calling the airline first.',
    ],
    officialLinks: [],
    prefill: ['currentFullName', 'newFullName', 'dateOfBirth', 'email', 'phone'],
    weCan: 'prepare',
    instanceLabel: 'Program',
  },
  {
    id: 'payment-apps',
    title: 'Update payment apps',
    summary: 'Venmo, PayPal, Cash App, Zelle and Apple or Google Pay.',
    category: 'financial',
    priority: 'anytime',
    step: 37,
    whyNow:
      'These verify against your bank. Update them after your bank accounts, or the verification will fail.',
    estimatedMinutes: [15, 25],
    dependsOn: ['bank-accounts'],
    whatYouNeed: ['App logins', 'Photo ID for identity verification'],
    steps: [
      'Update your legal name in each app’s account settings.',
      'Re-verify your identity if prompted — some apps require an ID photo.',
      'Update the cards saved in your digital wallet.',
    ],
    officialLinks: [],
    prefill: ['newFullName', 'phone', 'email', 'addressBlock'],
    weCan: 'prepare',
  },
  {
    id: 'digital-accounts',
    title: 'Update your major online accounts',
    summary: 'Apple, Google, Amazon and anywhere your name is on a shipping label.',
    category: 'travel-digital',
    priority: 'anytime',
    step: 38,
    whyNow:
      'Low stakes, high satisfaction. This is the one that finally makes it feel real.',
    estimatedMinutes: [15, 30],
    dependsOn: [],
    whatYouNeed: ['Account logins'],
    steps: [
      'Update your Apple Account and Google Account names.',
      'Update Amazon, including saved shipping addresses.',
      'Update the name on food delivery and shopping apps.',
    ],
    officialLinks: [],
    prefill: ['newFullName', 'email', 'phone', 'addressBlock'],
    weCan: 'prepare',
  },
  {
    id: 'email-signature',
    title: 'Update your email address and signatures',
    summary: 'Work email, personal email and every signature block.',
    category: 'travel-digital',
    priority: 'anytime',
    step: 39,
    whyNow:
      'If your work email changes, ask IT for an alias so mail to the old address still reaches you — for at least a year.',
    estimatedMinutes: [15, 30],
    dependsOn: ['employer-hr'],
    whatYouNeed: ['Access to your email accounts'],
    steps: [
      'Ask IT to create your new address and keep the old one as a forwarding alias.',
      'Update your display name and signature.',
      'Tell the people who email you most that the address changed.',
    ],
    officialLinks: [],
    prefill: ['newFullName', 'email', 'phone'],
    weCan: 'prepare',
    appliesIf: has('employed'),
  },
  {
    id: 'social-media',
    title: 'Update social and professional profiles',
    summary: 'LinkedIn first — it is the one that affects your career.',
    category: 'travel-digital',
    priority: 'anytime',
    step: 40,
    whyNow:
      'On LinkedIn, consider listing your former name so old colleagues can still find you.',
    estimatedMinutes: [10, 20],
    dependsOn: [],
    whatYouNeed: ['Account logins'],
    steps: [
      'Update LinkedIn and add your former name to your profile so you stay findable.',
      'Update your other social accounts.',
      'Update your name on any personal website or portfolio.',
    ],
    officialLinks: [],
    prefill: ['newFullName', 'currentFullName'],
    weCan: 'prepare',
  },
];

export const TASK_BY_ID: Record<string, TaskDefinition> = Object.fromEntries(
  TASKS.map((t) => [t.id, t]),
);

/** The catalog filtered down to the tasks this particular profile needs. */
export function tasksForProfile(profile: Profile): TaskDefinition[] {
  return TASKS.filter((t) => !t.appliesIf || t.appliesIf(profile)).sort(
    (a, b) => a.step - b.step,
  );
}

/**
 * The five phases the brief calls "smart order of operations". Phase is derived
 * from `step` rather than stored, so adding a task can never leave it phaseless.
 */
export const PHASES = [
  {
    n: 1,
    title: 'Marriage certificate',
    caption: 'Get certified copies before anything else.',
    match: (step: number) => step === 1,
  },
  {
    n: 2,
    title: 'Social Security',
    caption: 'The master record. Always second.',
    match: (step: number) => step === 2,
  },
  {
    n: 3,
    title: 'Driver’s license or state ID',
    caption: 'Only after Social Security has processed.',
    match: (step: number) => step === 3,
  },
  {
    n: 4,
    title: 'Passport',
    caption: 'Once your government ID matches.',
    match: (step: number) => step === 4,
  },
  {
    n: 5,
    title: 'Everything else',
    caption: 'Banks, work, insurance, and the rest of your life.',
    match: (step: number) => step >= 5,
  },
] as const;

export function phaseForStep(step: number): number {
  return PHASES.find((p) => p.match(step))?.n ?? 5;
}
