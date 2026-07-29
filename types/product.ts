export type ProductCategory = 'skincare' | 'makeup' | 'fragrance' | 'haircare' | 'bodycare';

export interface Product {
  id: string;
  name: string;
  brand: string;
  brandId?: string;
  category: ProductCategory;
  price: number;
  basePrice?: number;
  finalPrice?: number;
  discountAmount?: number;
  appliedOffer?: {
    id: string;
    name: string;
    type: string;
    value: number;
  } | null;
  image: string;
  fullImage?: string;
  description: string;
  ingredients?: string[];
  rating: number;
  reviewCount: number;
  totalAvailable?: number;
  availabilityBySellingPoint?: {
    sellingPointId: string;
    nameAr?: string | null;
    nameEn?: string | null;
    totalAvailable: number;
  }[];
}

export interface APIProduct {
  id: number | string;
  name?: string;
  name_ar?: string | null;
  name_en?: string | null;
  sku?: string;
  price: number | string;
  comparePrice?: number | null;
  old_db_product_id?: string | null;
  description?: string;
  description_ar?: string | null;
  description_en?: string | null;
  images?: string | string[] | null;
  category?: string | null | {
    id: number;
    name?: string;
    name_ar?: string;
    name_en?: string;
  };
  brand?: string | null;
  brand_id?: string | number | null;
  brand_name_ar?: string | null;
  brand_name_en?: string | null;
  code_bar?: string | null;
  local_code_bar?: string | null;
  weight?: string | number | null;
  product_length?: string | number | null;
  width?: string | number | null;
  height?: string | number | null;
  state?: string | null;
  available_quantity?: number | null;
  suppliers?: any[] | null;
  tags?: (
    | string
    | {
        id?: string | null;
        tag_name_ar?: string | null;
        tag_name_en?: string | null;
      }
  )[] | null;
  created_at?: string;
  updated_at?: string;
  event_version?: string;
  aggregate_version?: number;
  event_by?: string;
  total_available?: number | null;
  base_price?: number | string | null;
  final_price?: number | string | null;
  discount_amount?: number | string | null;
  applied_offer?: {
    id?: string | null;
    nameAr?: string | null;
    nameEn?: string | null;
    type?: string | null;
    value?: number | string | null;
  } | null;
  availability_by_selling_point?: {
    selling_point?: string | null;
    name_ar?: string | null;
    name_en?: string | null;
    totalAvailable?: number | null;
    stockes?: {
      quantity?: number | null;
    }[];
  }[] | null;
}

export interface APIResponse {
  data: APIProduct[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

function parsePriceValue(value: number | string | null | undefined): number | undefined {
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value : undefined;
  }
  if (typeof value === 'string') {
    const parsed = parseFloat(value);
    return Number.isFinite(parsed) ? parsed : undefined;
  }
  return undefined;
}

function mapProductTags(tags: APIProduct['tags']): string[] {
  if (!Array.isArray(tags)) return [];

  return tags
    .map((tag) => {
      if (typeof tag === 'string') return tag.trim();
      return (tag?.tag_name_ar || tag?.tag_name_en || '').trim();
    })
    .filter((tag): tag is string => tag.length > 0);
}

function getPrimaryImageFileName(images: APIProduct['images'], productId: string): string {
  if (Array.isArray(images)) {
    const firstImage = images.find((image): image is string => typeof image === 'string' && image.trim().length > 0);
    if (firstImage) return firstImage.trim();
  }

  if (typeof images === 'string' && images.trim()) {
    try {
      const parsed = JSON.parse(images);
      if (Array.isArray(parsed)) {
        const firstImage = parsed.find((image): image is string => typeof image === 'string' && image.trim().length > 0);
        if (firstImage) return firstImage.trim();
      }
    } catch {
      if (!images.trim().startsWith('[')) return images.trim();
    }
  }

  return productId ? `${productId}.webp` : '';
}

export function mapAPIProductToProduct(apiProduct: APIProduct): Product {
  const categoryMap: Record<string, ProductCategory> = {
    'skincare': 'skincare',
    'makeup': 'makeup',
    'fragrance': 'fragrance',
    'haircare': 'haircare',
    'bodycare': 'bodycare',
  };

  const productName = apiProduct.name_ar || apiProduct.name_en || apiProduct.name || '\u0645\u0646\u062a\u062c \u0628\u062f\u0648\u0646 \u0627\u0633\u0645';
  const productDescription = apiProduct.description_ar || apiProduct.description_en || apiProduct.description || '';
  
  let category: ProductCategory = 'skincare';
  if (typeof apiProduct.category === 'object' && apiProduct.category) {
    const categoryName = (apiProduct.category.name_ar || apiProduct.category.name || apiProduct.category.name_en || 'skincare').toLowerCase();
    category = categoryMap[categoryName] || 'skincare';
  }
  
  const brandName = apiProduct.brand_name_ar || apiProduct.brand_name_en || '\u0639\u0644\u0627\u0645\u0629 \u062a\u062c\u0627\u0631\u064a\u0629 \u063a\u064a\u0631 \u0645\u0639\u0631\u0648\u0641\u0629';
  const brandId = apiProduct.brand_id?.toString() || apiProduct.brand?.toString() || undefined;

  const productId = apiProduct.id?.toString() || '';
  const stableVersion =
    typeof apiProduct.aggregate_version === 'number'
      ? apiProduct.aggregate_version.toString()
      : apiProduct.updated_at || undefined;
  const versionQuery = stableVersion ? `?v=${encodeURIComponent(stableVersion)}` : '';
  const imageFileName = getPrimaryImageFileName(apiProduct.images, productId);
  const imageUrl = productId && imageFileName
    ? `https://images.angebeauty.net/angeapi/cdn/images/${productId}/thumbs/${imageFileName}${versionQuery}`
    : '';
  const fullImageUrl = productId && imageFileName
    ? `https://images.angebeauty.net/angeapi/cdn/images/${productId}/${imageFileName}${versionQuery}`
    : '';

  const rawPrice = parsePriceValue(apiProduct.price) ?? 0;
  const basePrice = parsePriceValue(apiProduct.base_price) ?? rawPrice;
  const finalPrice = parsePriceValue(apiProduct.final_price) ?? rawPrice;
  const discountAmount = parsePriceValue(apiProduct.discount_amount);
  const hasDiscount = finalPrice < basePrice || (discountAmount ?? 0) > 0;

  return {
    id: productId,
    name: productName,
    brand: brandName,
    brandId,
    category,
    price: finalPrice,
    basePrice,
    finalPrice,
    discountAmount: hasDiscount ? (discountAmount ?? basePrice - finalPrice) : undefined,
    appliedOffer: apiProduct.applied_offer?.id
      ? {
          id: apiProduct.applied_offer.id,
          name: apiProduct.applied_offer.nameAr || apiProduct.applied_offer.nameEn || '',
          type: apiProduct.applied_offer.type || '',
          value: parsePriceValue(apiProduct.applied_offer.value) ?? 0,
        }
      : null,
    image: imageUrl,
    fullImage: fullImageUrl || imageUrl,
    description: productDescription,
    ingredients: mapProductTags(apiProduct.tags),
    rating: 4.5,
    reviewCount: 0,
    totalAvailable: typeof apiProduct.total_available === 'number' ? apiProduct.total_available : undefined,
    availabilityBySellingPoint: Array.isArray(apiProduct.availability_by_selling_point)
      ? apiProduct.availability_by_selling_point
          .filter((entry) => entry && entry.selling_point)
          .map((entry) => ({
            sellingPointId: entry.selling_point?.toString() || '',
            nameAr: entry.name_ar ?? null,
            nameEn: entry.name_en ?? null,
            totalAvailable:
              typeof entry.totalAvailable === 'number'
                ? entry.totalAvailable
                : Array.isArray(entry.stockes)
                  ? entry.stockes.reduce((sum, stock) => sum + (typeof stock?.quantity === 'number' ? stock.quantity : 0), 0)
                  : 0,
          }))
      : [],
  };
}
