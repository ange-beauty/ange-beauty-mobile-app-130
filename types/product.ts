export type ProductCategory = 'skincare' | 'makeup' | 'fragrance' | 'haircare' | 'bodycare';

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: ProductCategory;
  price: number;
  image: string;
  description: string;
  ingredients?: string[];
  rating: number;
  reviewCount: number;
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
  tags?: string[];
  created_at?: string;
  updated_at?: string;
  event_version?: string;
  aggregate_version?: number;
  event_by?: string;
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

export function mapAPIProductToProduct(apiProduct: APIProduct): Product {
  const categoryMap: Record<string, ProductCategory> = {
    'skincare': 'skincare',
    'makeup': 'makeup',
    'fragrance': 'fragrance',
    'haircare': 'haircare',
    'bodycare': 'bodycare',
  };

  const productName = apiProduct.name_ar || apiProduct.name_en || apiProduct.name || 'منتج بدون اسم';
  const productDescription = apiProduct.description_ar || apiProduct.description_en || apiProduct.description || '';
  
  let category: ProductCategory = 'skincare';
  if (typeof apiProduct.category === 'object' && apiProduct.category) {
    const categoryName = (apiProduct.category.name_ar || apiProduct.category.name || apiProduct.category.name_en || 'skincare').toLowerCase();
    category = categoryMap[categoryName] || 'skincare';
  }
  
  const brandName = apiProduct.brand_name_ar || apiProduct.brand_name_en || 'علامة تجارية غير معروفة';

  let imageUrl = '';
  try {
    if (apiProduct.images) {
      let imagesArray: string[] = [];
      if (typeof apiProduct.images === 'string') {
        imagesArray = JSON.parse(apiProduct.images);
      } else if (Array.isArray(apiProduct.images)) {
        imagesArray = apiProduct.images;
      }
      
      const firstImage = imagesArray[0];
      if (firstImage) {
        const rootDir = 'angeapi';
        imageUrl = `https://angebeauty.s3.eu-west-3.amazonaws.com/${rootDir}/cdn/images/${apiProduct.id}/thumbs/${firstImage}?t=${Date.now()}`;
      }
    }
  } catch (error) {
    console.error('[Product] Error parsing images:', error);
  }

  let price = 0;
  if (typeof apiProduct.price === 'number') {
    price = apiProduct.price;
  } else if (typeof apiProduct.price === 'string') {
    const parsedPrice = parseFloat(apiProduct.price);
    price = isNaN(parsedPrice) ? 0 : parsedPrice;
  }

  return {
    id: apiProduct.id?.toString() || '',
    name: productName,
    brand: brandName,
    category,
    price,
    image: imageUrl,
    description: productDescription,
    ingredients: apiProduct.tags || [],
    rating: 4.5,
    reviewCount: 0,
  };
}
