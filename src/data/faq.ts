/**
 * Frequently asked questions.
 *
 * Kept as data rather than JSX so the same answers feed the page, the landing
 * section and the FAQPage structured data. Google shows structured-data
 * answers verbatim, so every answer here has to be true on its own — no
 * "see above", no hedging that only makes sense in context.
 */

export interface FaqItem {
  q: string;
  a: string;
}

export const LANDING_FAQ: FaqItem[] = [
  {
    q: 'How long does changing your name after marriage actually take?',
    a: 'The paperwork is a few hours spread over four to eight weeks, and most of that is waiting. Social Security usually processes in about two weeks, and your driver’s licence and passport can only be done after that. AfterIDo’s job is to make sure none of that waiting is wasted on a trip you were never going to be able to complete.',
  },
  {
    q: 'What do I need before I start?',
    a: 'A certified copy of your marriage certificate — not the decorative one from the ceremony, the certified copy from the county or state that issued it. Almost every other step asks to see one, and several will keep it. Ordering two or three at once is cheaper than ordering them one at a time.',
  },
  {
    q: 'Does the order really matter?',
    a: 'Yes, and it is the single most common reason people get turned away. Social Security has to be updated before the DMV, because most states check your name against the federal record. Your passport should come after your driver’s licence. Banks and employers can be done any time after Social Security.',
  },
  {
    q: 'Can AfterIDo change my name for me?',
    a: 'No, and you should be sceptical of anything that says it can. No federal or state agency offers an API that lets a third-party app file a name change on your behalf. What AfterIDo removes is the research, the retyping and the guesswork — you still sign and submit.',
  },
  {
    q: 'Do I have to pay?',
    a: 'No. The full checklist, the order of operations, your details filled in on every step and every official link are free. Premium is $19.99 once, for the parts that save the most time, and it is a single payment rather than a subscription.',
  },
  {
    q: 'Is my personal information safe?',
    a: 'Your name, address, date of birth and marriage details are stored in your own browser and are never sent to us. AfterIDo never asks for your Social Security number, driver’s licence number, bank account numbers or passwords — they are not in the app at all. If you create an account, the only thing kept on our side is your email address and whether you bought Premium.',
  },
];

export const PRICING_FAQ: FaqItem[] = [
  {
    q: 'Do I need Premium to change my name?',
    a: 'No. The full checklist, the order of operations and every official link are free. Premium saves you time — it does not unlock anything the government requires.',
  },
  {
    q: 'Is this a subscription?',
    a: 'No. Premium is a single $19.99 payment. There is nothing to cancel and you will not be charged again.',
  },
  {
    q: 'What happens if I get a new phone?',
    a: 'Sign in with the same email address and your Premium features come with you. Your checklist progress lives in each browser, so finishing on the device you started on is smoothest.',
  },
  {
    q: 'Can I get a refund?',
    a: 'Yes. Email us within 30 days of buying and we will refund the purchase, no explanation needed. Our contact address is on the Contact page.',
  },
  {
    q: 'Can AfterIDo submit my name change for me?',
    a: 'No, and be wary of anything that says it can. Agencies do not offer that to third-party apps. What we do is remove the research and the retyping.',
  },
  {
    q: 'What if I am in a state you have not researched in detail?',
    a: 'You get the same checklist and the official agency links for your state, and we say plainly that we have not verified the local specifics — rather than guessing.',
  },
];

/** Google's FAQPage schema. Only ever built from the constants above. */
export function faqJsonLd(items: FaqItem[]): Record<string, unknown> {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: items.map(({ q, a }) => ({
      '@type': 'Question',
      name: q,
      acceptedAnswer: { '@type': 'Answer', text: a },
    })),
  };
}
