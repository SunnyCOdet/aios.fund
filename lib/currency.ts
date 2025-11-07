/**
 * Currency formatting utilities
 */

export interface CurrencyInfo {
  symbol: string;
  code: string;
  name: string;
  position: 'before' | 'after'; // Currency symbol position
  decimalPlaces: number;
}

/**
 * Currency information map
 */
const CURRENCY_INFO: { [key: string]: CurrencyInfo } = {
  USD: { symbol: '$', code: 'USD', name: 'US Dollar', position: 'before', decimalPlaces: 2 },
  INR: { symbol: '₹', code: 'INR', name: 'Indian Rupee', position: 'before', decimalPlaces: 2 },
  GBP: { symbol: '£', code: 'GBP', name: 'British Pound', position: 'before', decimalPlaces: 2 },
  EUR: { symbol: '€', code: 'EUR', name: 'Euro', position: 'before', decimalPlaces: 2 },
  JPY: { symbol: '¥', code: 'JPY', name: 'Japanese Yen', position: 'before', decimalPlaces: 0 },
  CAD: { symbol: 'C$', code: 'CAD', name: 'Canadian Dollar', position: 'before', decimalPlaces: 2 },
  AUD: { symbol: 'A$', code: 'AUD', name: 'Australian Dollar', position: 'before', decimalPlaces: 2 },
  CHF: { symbol: 'CHF', code: 'CHF', name: 'Swiss Franc', position: 'before', decimalPlaces: 2 },
  HKD: { symbol: 'HK$', code: 'HKD', name: 'Hong Kong Dollar', position: 'before', decimalPlaces: 2 },
  CNY: { symbol: '¥', code: 'CNY', name: 'Chinese Yuan', position: 'before', decimalPlaces: 2 },
  BRL: { symbol: 'R$', code: 'BRL', name: 'Brazilian Real', position: 'before', decimalPlaces: 2 },
  KRW: { symbol: '₩', code: 'KRW', name: 'South Korean Won', position: 'before', decimalPlaces: 0 },
  MXN: { symbol: 'MX$', code: 'MXN', name: 'Mexican Peso', position: 'before', decimalPlaces: 2 },
};

/**
 * Format a price with currency symbol
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options?: {
    showSymbol?: boolean;
    minimumFractionDigits?: number;
    maximumFractionDigits?: number;
  }
): string {
  const currency = CURRENCY_INFO[currencyCode.toUpperCase()] || CURRENCY_INFO.USD;
  const showSymbol = options?.showSymbol !== false;
  const minDecimals = options?.minimumFractionDigits ?? currency.decimalPlaces;
  const maxDecimals = options?.maximumFractionDigits ?? currency.decimalPlaces;

  // Format the number
  const formattedNumber = amount.toLocaleString(undefined, {
    minimumFractionDigits: minDecimals,
    maximumFractionDigits: maxDecimals,
  });

  if (!showSymbol) {
    return formattedNumber;
  }

  // Add currency symbol
  if (currency.position === 'before') {
    return `${currency.symbol}${formattedNumber}`;
  } else {
    return `${formattedNumber} ${currency.symbol}`;
  }
}

/**
 * Format a large number (like market cap) with currency and appropriate suffix (K, M, B, T)
 */
export function formatLargeCurrency(
  amount: number,
  currencyCode: string = 'USD',
  options?: {
    showSymbol?: boolean;
  }
): string {
  const currency = CURRENCY_INFO[currencyCode.toUpperCase()] || CURRENCY_INFO.USD;
  const showSymbol = options?.showSymbol !== false;

  let value = amount;
  let suffix = '';

  if (Math.abs(value) >= 1e12) {
    value = value / 1e12;
    suffix = 'T';
  } else if (Math.abs(value) >= 1e9) {
    value = value / 1e9;
    suffix = 'B';
  } else if (Math.abs(value) >= 1e6) {
    value = value / 1e6;
    suffix = 'M';
  } else if (Math.abs(value) >= 1e3) {
    value = value / 1e3;
    suffix = 'K';
  }

  const formattedNumber = value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  if (!showSymbol) {
    return `${formattedNumber}${suffix}`;
  }

  if (currency.position === 'before') {
    return `${currency.symbol}${formattedNumber}${suffix}`;
  } else {
    return `${formattedNumber}${suffix} ${currency.symbol}`;
  }
}

/**
 * Get currency symbol only
 */
export function getCurrencySymbol(currencyCode: string = 'USD'): string {
  const currency = CURRENCY_INFO[currencyCode.toUpperCase()] || CURRENCY_INFO.USD;
  return currency.symbol;
}

