import type { Lang } from '../i18n';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'CHF';

export const CURRENCIES: Currency[] = ['USD', 'EUR', 'GBP', 'CHF'];

const SYMBOLS: Record<Currency, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  CHF: 'CHF',
};

export function currencySymbol(c: Currency): string {
  return SYMBOLS[c];
}

export function formatMoney(amount: number, currency: Currency, lang: Lang): string {
  try {
    return new Intl.NumberFormat(lang === 'de' ? 'de-DE' : 'en-US', {
      style: 'currency',
      currency,
      maximumFractionDigits: 2,
    }).format(amount);
  } catch {
    return `${currencySymbol(currency)}${amount.toFixed(2)}`;
  }
}

export function stringifyAmount(n: number, lang: Lang): string {
  return lang === 'de' ? String(n).replace('.', ',') : String(n);
}

export function parseAmount(raw: string, lang: Lang): number | null {
  if (!raw) return null;
  const cleaned = lang === 'de'
    ? raw.replace(/\./g, '').replace(',', '.')
    : raw.replace(/,/g, '');
  const n = parseFloat(cleaned);
  return Number.isFinite(n) && n > 0 ? n : null;
}
