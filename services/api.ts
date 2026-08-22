import { mapAPIProductToProduct, Product } from '@/types/product';
import { withClientSourceHeader } from '@/services/requestHeaders';
import { debugFetch } from '@/services/httpDebug';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

export interface Brand {
  id: string;
  brand_name_ar: string;
  brand_name_en?: string;
  icon?: string | null;
  aggregate_version?: number;
}

export interface Category {
  id: string;
  category_name_ar: string;
  category_name_en?: string | null;
  category_description_ar?: string | null;
  category_description_en?: string | null;
  parent_category?: string | null;
  is_active?: number | boolean;
  aggregate_version?: number;
}

export interface OfferTarget {
  offer: string;
  target_aggregate_type: string;
  target_aggregate_id: string;
  is_active: boolean;
}

export interface Offer {
  id: string;
  name: string;
  description: string;
  offerType: string;
  offerValue: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  priority: number;
  image: string;
  targets: OfferTarget[];
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  product?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  highlighted?: number | boolean;
}

function buildOfferHeroImageUrl(apiOffer: any): string {
  const heroImage = typeof apiOffer?.hero_image === 'string' ? apiOffer.hero_image.trim() : '';
  if (!heroImage) return '';
  if (/^https?:\/\//i.test(heroImage)) return heroImage;

  const stableVersion =
    typeof apiOffer.aggregate_version === 'number'
      ? apiOffer.aggregate_version.toString()
      : apiOffer.updated_at || undefined;
  const versionQuery = stableVersion ? `?v=${encodeURIComponent(stableVersion)}` : '';

  return `https://images.angebeauty.net/angeapi/cdn/images/${apiOffer.id}/${heroImage}${versionQuery}`;
}

function mapAPIOfferToOffer(apiOffer: any): Offer | null {
  if (!apiOffer?.id) return null;

  const rawValue =
    typeof apiOffer.offer_value === 'number'
      ? apiOffer.offer_value
      : typeof apiOffer.offer_value === 'string'
        ? parseFloat(apiOffer.offer_value)
        : 0;

  return {
    id: apiOffer.id.toString(),
    name: apiOffer.name_ar || apiOffer.name_en || '',
    description: apiOffer.description_ar || apiOffer.description_en || '',
    offerType: apiOffer.offer_type || '',
    offerValue: Number.isFinite(rawValue) ? rawValue : 0,
    startsAt: apiOffer.starts_at || '',
    endsAt: apiOffer.ends_at || '',
    isActive: apiOffer.is_active === true,
    priority: typeof apiOffer.priority === 'number' ? apiOffer.priority : 0,
    image: buildOfferHeroImageUrl(apiOffer),
    targets: Array.isArray(apiOffer.targets) ? apiOffer.targets : [],
  };
}

export async function fetchPublicOffers(): Promise<Offer[]> {

  try {
    const response = await debugFetch(`${API_BASE}/api/v1/offers/public`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }, 'API');

    if (!response) {
      console.error('[API] No response received for public offers');
      return [];
    }

    if (!response.ok) {
      console.error(`[API] Failed to fetch public offers - Status: ${response.status}`);
      return [];
    }

    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error('[API] Error parsing public offers JSON:', jsonError);
      return [];
    }

    if (!result || result.success !== true) {
      console.error('[API] Invalid public offers response status');
      return [];
    }

    const offers = Array.isArray(result.data) ? result.data : [];
    return offers
      .map(mapAPIOfferToOffer)
      .filter((offer: Offer | null): offer is Offer => !!offer && offer.isActive)
      .sort((a: Offer, b: Offer) => a.priority - b.priority);
  } catch (error) {
    console.error('[API] Error fetching public offers:', error);
    return [];
  }
}

export interface FetchProductsResponse {
  products: Product[];
  hasMore: boolean;
  totalRows: number;
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<FetchProductsResponse> {
  const { page = 1, limit = 50, keyword, product, category, brand, barcode, highlighted } = params;
  
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('no_zero_price', 'true');
    queryParams.append('products_with_brand', 'true');
    
    if (keyword) queryParams.append('keyword', keyword);
    if (product) queryParams.append('product', product);
    if (category) queryParams.append('category', category);
    if (brand) queryParams.append('brand', brand);
    if (barcode) queryParams.append('barcode', barcode);
    if (typeof highlighted !== 'undefined') {
      queryParams.append('highlighted', highlighted ? '1' : '0');
    }
    
    const url = `${API_BASE}/api/v1/products?${queryParams.toString()}`;
    
    const response = await debugFetch(url, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }, 'API');
    
    if (!response) {
      console.error(`[API] No response received`);
      return { products: [], hasMore: false, totalRows: 0 };
    }
    
    if (!response.ok) {
      console.error(`[API] Failed to fetch products - Status: ${response.status}`);
      return { products: [], hasMore: false, totalRows: 0 };
    }
    
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error(`[API] Error parsing JSON response:`, jsonError);
      return { products: [], hasMore: false, totalRows: 0 };
    }
    
    
    if (!result || result.success !== true) {
      console.error(`[API] Invalid response status`);
      return { products: [], hasMore: false, totalRows: 0 };
    }
    
    if (!result.data) {
      return { products: [], hasMore: false, totalRows: 0 };
    }
    
    const products = Array.isArray(result.data) ? result.data : [];
    const totalRows =
      typeof result.total_rows === 'number'
        ? result.total_rows
        : typeof result.totalRows === 'number'
          ? result.totalRows
          : typeof result.total === 'number'
            ? result.total
            : 0;
    const hasMore =
      result.has_more === true ||
      result.hasMore === true ||
      (typeof result.next_page === 'number' && result.next_page > page) ||
      (typeof result.nextPage === 'number' && result.nextPage > page) ||
      (totalRows > 0 ? page * limit < totalRows : products.length === limit);
    
    
    const mappedProducts = products.map(mapAPIProductToProduct).filter((product: Product) => product && product.id);
    
    return {
      products: mappedProducts,
      hasMore,
      totalRows,
    };
  } catch (error) {
    console.error('[API] Error fetching products:', error);
    return { products: [], hasMore: false, totalRows: 0 };
  }
}

export async function fetchBrands(): Promise<Brand[]> {
  
  try {
    const response = await debugFetch(`${API_BASE}/api/v1/brands`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }, 'API');
    
    if (!response) {
      console.error(`[API] No response received for brands`);
      return [];
    }
    
    if (!response.ok) {
      console.error(`[API] Failed to fetch brands - Status: ${response.status}`);
      return [];
    }
    
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error(`[API] Error parsing brands JSON:`, jsonError);
      return [];
    }
    
    
    if (!result || result.status !== 'success') {
      console.error(`[API] Invalid brands response status`);
      return [];
    }
    
    if (!result.data) {
      return [];
    }
    
    const brands = Array.isArray(result.data) ? result.data : [];
    
    return brands.filter((brand: any) => brand && brand.id && brand.brand_name_ar);
  } catch (error) {
    console.error('[API] Error fetching brands:', error);
    return [];
  }
}

export async function fetchCategories(): Promise<Category[]> {
  
  try {
    const response = await debugFetch(`${API_BASE}/api/v1/categories`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }, 'API');
    
    if (!response) {
      console.error(`[API] No response received for categories`);
      return [];
    }
    
    if (!response.ok) {
      console.error(`[API] Failed to fetch categories - Status: ${response.status}`);
      return [];
    }
    
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error(`[API] Error parsing categories JSON:`, jsonError);
      return [];
    }
    
    
    if (!result || (result.status !== 'success' && result.success !== true)) {
      console.error(`[API] Invalid categories response status`);
      return [];
    }
    
    if (!result.data) {
      return [];
    }
    
    const categories = Array.isArray(result.data) ? result.data : [];
    
    return categories.filter((category: any) => {
      const isActive = category.is_active === undefined || category.is_active === true || category.is_active === 1;
      return category && category.id && category.category_name_ar && isActive;
    });
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    return [];
  }
}

export type AppUpdateCheckResult =
  | { status: 'ok' }
  | { status: 'update_required' }
  | { status: 'network_error'; message: string };

export async function checkAppUpdateStatus(
  appVersion: string,
  platform: 'android' | 'ios',
  buildNumber: string,
): Promise<AppUpdateCheckResult> {
  try {
    const endpoint = `${API_BASE}/api/v1/auth/client-version/validate`;
    const payload = {
      version: appVersion,
      platform,
      build_number: buildNumber,
    };

    const response = await debugFetch(endpoint, {
      method: 'POST',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    }, 'API');

    if (!response || !response.ok) {
      if (response?.status === 503) {
        return {
          status: 'network_error',
          message: '\u0627\u0644\u062e\u062f\u0645\u0629 \u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631\u0629 \u062d\u0627\u0644\u064a\u0627',
        };
      }
      if (response?.status >= 500 || response?.status === 0 || !response) {
        return {
          status: 'network_error',
          message: '\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645',
        };
      }
      return { status: 'update_required' };
    }

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }

    if (result?.success === true && result?.data === false) {
      return { status: 'update_required' };
    }
    if (result?.success === true && result?.data === true) {
      return { status: 'ok' };
    }
    if (result?.mustUpdate === true || result?.forceUpdate === true || result?.updateRequired === true) {
      return { status: 'update_required' };
    }
    if (result?.isValid === false || result?.isSupported === false || result?.upToDate === false) {
      return { status: 'update_required' };
    }

    return { status: 'ok' };
  } catch (error) {
    console.error('[API] Error checking update status:', error);
    return {
      status: 'network_error',
      message: '\u062a\u0639\u0630\u0631 \u0627\u0644\u0627\u062a\u0635\u0627\u0644 \u0628\u0627\u0644\u062e\u0627\u062f\u0645',
    };
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  
  if (!id) {
    console.error(`[API] Invalid product id`);
    return null;
  }
  
  try {
    const response = await debugFetch(`${API_BASE}/api/v1/products?product=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    }, 'API');
    
    if (!response) {
      console.error(`[API] No response received for product ${id}`);
      return null;
    }
    
    if (!response.ok) {
      console.error(`[API] Failed to fetch product ${id} - Status: ${response.status}`);
      return null;
    }
    
    let result;
    try {
      result = await response.json();
    } catch (jsonError) {
      console.error(`[API] Error parsing product JSON for ${id}:`, jsonError);
      return null;
    }
    
    
    const isSuccess = result?.success === true || result?.status === 'success';
    if (!isSuccess) {
      console.error(`[API] Invalid response status for product ${id}`);
      return null;
    }
    
    if (!result.data) {
      console.error(`[API] No product data for ${id}`);
      return null;
    }
    
    const apiProduct = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!apiProduct) {
      console.error(`[API] Empty product data array for ${id}`);
      return null;
    }
    const productName = apiProduct?.name_ar || apiProduct?.name_en || 'Unknown';
    
    const mappedProduct = mapAPIProductToProduct(apiProduct);
    
    if (!mappedProduct || !mappedProduct.id) {
      console.error(`[API] Failed to map product ${id}`);
      return null;
    }
    
    return mappedProduct;
  } catch (error) {
    console.error(`[API] Error fetching product ${id}:`, error);
    return null;
  }
}
