import { Product } from '@/types/product';

export function getAvailableQuantityForSellingPoint(product: Product, sellingPointId?: string | null): number | null {
  if (!sellingPointId) return null;
  const list = product.availabilityBySellingPoint || [];
  const match = list.find((entry) => entry.sellingPointId === sellingPointId);
  // The API lists only selling points that hold stock, so no entry means none left there.
  if (!match) return list.length || product.totalAvailable !== undefined ? 0 : null;
  return typeof match.totalAvailable === 'number' ? match.totalAvailable : null;
}
