export function toArabicNumerals(num: string | number): string {
  const arabicNumerals = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const numString = String(num);
  
  return numString.replace(/[0-9]/g, (digit) => arabicNumerals[parseInt(digit, 10)]);
}

export function formatPrice(price: string | number): string {
  const numericPrice = typeof price === 'number' ? price : parseFloat(price as string || '0');
  const formattedPrice = numericPrice.toFixed(2);
  return toArabicNumerals(formattedPrice);
}
