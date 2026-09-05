import type { FaqItem } from '@/data/faq';
import { LANDING_FAQ } from '@/data/faq';
import type { ServerConfig } from '@/lib/api';

/** FAQ answers that must not sell Premium/accounts when those flags are off. */
export function landingFaqForConfig(config: ServerConfig): FaqItem[] {
  return LANDING_FAQ.map((item) => {
    if (item.q === 'Do I have to pay?' && !config.payments) {
      return {
        ...item,
        a: 'No. The full checklist, the order of operations, your details filled in on every step and every official link are free. Premium is not for sale on this deployment.',
      };
    }
    if (item.q === 'Is my personal information safe?' && !config.accounts) {
      return {
        ...item,
        a: 'Your name, address, date of birth and marriage details are stored in your own browser and are never sent to us. AfterIDo never asks for your Social Security number, driver’s licence number, bank account numbers or passwords — they are not in the app at all. Accounts are not offered on this deployment, so there is nothing of yours on our server.',
      };
    }
    return item;
  });
}

export function landingOffersJsonLd(payments: boolean) {
  return payments
    ? [
        { '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' },
        { '@type': 'Offer', price: '19.99', priceCurrency: 'USD', name: 'Premium' },
      ]
    : [{ '@type': 'Offer', price: '0', priceCurrency: 'USD', name: 'Free' }];
}

export function trustAccountSentence(accounts: boolean): string {
  return accounts
    ? ' If you make an account, the only thing on our side is your email address and whether you bought Premium.'
    : ' Accounts are not offered on this deployment, so there is nothing of yours on our server.';
}
