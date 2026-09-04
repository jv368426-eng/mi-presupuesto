export interface CurrencyOption {
  code: string;
  label: string;
  symbol: string;
  locale: string;
}

export const CURRENCIES: CurrencyOption[] = [
  { code: 'USD', label: 'Dólares (USD)', symbol: '$', locale: 'en-US' },
  { code: 'MXN', label: 'Pesos Mexicanos', symbol: '$', locale: 'es-MX' },
  { code: 'COP', label: 'Pesos Colombianos', symbol: '$', locale: 'es-CO' },
  { code: 'ARS', label: 'Pesos Argentinos', symbol: '$', locale: 'es-AR' },
  { code: 'EUR', label: 'Euros', symbol: '€', locale: 'es-ES' },
];

const STORAGE_KEY = 'mi-presupuesto-currency';

let currentCurrency: CurrencyOption = CURRENCIES[0];

export function initCurrency(): CurrencyOption {
  const saved = localStorage.getItem(STORAGE_KEY);
  const found = CURRENCIES.find((c) => c.code === saved);
  if (found) currentCurrency = found;
  return currentCurrency;
}

export function setCurrency(code: string): void {
  const found = CURRENCIES.find((c) => c.code === code);
  if (found) {
    currentCurrency = found;
    localStorage.setItem(STORAGE_KEY, code);
  }
}

export function getCurrency(): CurrencyOption {
  return currentCurrency;
}
