const UNKNOWN_BRAND_PATTERNS = [
  'علامة تجارية غير',
  'غير معروفة',
  'unknown brand',
  'unbranded',
];

export function getDisplayBrand(brand?: string | null): string {
  const value = (brand || '').trim();
  if (!value) return '';

  const lower = value.toLowerCase();
  const isUnknown = UNKNOWN_BRAND_PATTERNS.some((pattern) =>
    lower.includes(pattern.toLowerCase())
  );

  return isUnknown ? '' : value;
}

