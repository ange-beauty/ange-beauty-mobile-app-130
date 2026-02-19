import { Product } from '@/types/product';

export function getAvailableQuantityForSellingPoint(product: Product, sellingPointId?: string | null): number | null {
  if (!sellingPointId) return null;
  const list = product.availabilityBySellingPoint || [];
  const match = list.find((entry) => entry.sellingPointId === sellingPointId);
  if (!match) return null;
  return typeof match.totalAvailable === 'number' ? match.totalAvailable : null;
}
