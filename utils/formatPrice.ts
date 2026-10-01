/**
 * Digit system used for every price in the app (mirrors the website's PRICE_DIGIT_SYSTEM).
 * "arab" = Arabic-Indic digits (٠١٢...) grouped with the Arabic thousands separator "٬".
 * "latn" = Latin digits (0123...) grouped with ",".
 * Switch this single constant to change the price digit style app-wide.
 */
export const PRICE_DIGIT_SYSTEM: 'arab' | 'latn' = 'arab';

/** Currency label shown next to prices (Iraqi dinar). formatPrice never includes it. */
export const CURRENCY_LABEL = 'د.ع';

const ARABIC_INDIC_DIGITS = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];

const THOUSANDS_SEPARATOR = PRICE_DIGIT_SYSTEM === 'arab' ? '٬' : ',';

export function toArabicNumerals(num: string | number): string {
  return String(num).replace(/[0-9]/g, (digit) => ARABIC_INDIC_DIGITS[parseInt(digit, 10)]);
}

function toPriceDigits(value: string): string {
  return PRICE_DIGIT_SYSTEM === 'arab' ? toArabicNumerals(value) : value;
}

/**
 * Formats a price as a whole number with thousands grouping in the configured digit system.
 * Returns digits only; callers add the currency label (see CURRENCY_LABEL).
 */
export function formatPrice(price: string | number): string {
  const numericPrice = typeof price === 'number' ? price : parseFloat((price as string) || '0');
  const rounded = Math.round(Number.isFinite(numericPrice) ? numericPrice : 0);
  const sign = rounded < 0 ? '-' : '';
  const grouped = String(Math.abs(rounded)).replace(/\B(?=(\d{3})+(?!\d))/g, THOUSANDS_SEPARATOR);
  return sign + toPriceDigits(grouped);
}
