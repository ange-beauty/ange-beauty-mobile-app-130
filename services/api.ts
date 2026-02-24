import { mapAPIProductToProduct, Product } from '@/types/product';
import { withClientSourceHeader } from '@/services/requestHeaders';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

export interface Brand {
  id: string;
  brand_name_ar: string;
  brand_name_en?: string;
}

export interface Category {
  id: string;
  name_ar: string;
  name_en?: string;
}

export interface FetchProductsParams {
  page?: number;
  limit?: number;
  keyword?: string;
  category?: string;
  brand?: string;
  barcode?: string;
  highlighted?: number | boolean;
}

export interface FetchProductsResponse {
  products: Product[];
  hasMore: boolean;
  totalRows: number;
}

export async function fetchProducts(params: FetchProductsParams = {}): Promise<FetchProductsResponse> {
  const { page = 1, limit = 50, keyword, category, brand, barcode, highlighted } = params;
  console.log(`[API] Fetching products - params:`, params);
  
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('page', page.toString());
    queryParams.append('limit', limit.toString());
    queryParams.append('no_zero_price', 'true');
    queryParams.append('products_with_brand', 'true');
    
    if (keyword) queryParams.append('keyword', keyword);
    if (category) queryParams.append('category', category);
    if (brand) queryParams.append('brand', brand);
    if (barcode) queryParams.append('barcode', barcode);
    if (typeof highlighted !== 'undefined') {
      queryParams.append('highlighted', highlighted ? '1' : '0');
    }
    
    const url = `${API_BASE}/api/v1/products?${queryParams.toString()}`;
    console.log(`[API] Fetching from URL:`, url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    });
    
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
    
    console.log(`[API] Successfully fetched products response:`, result);
    
    if (!result || result.success !== true) {
      console.error(`[API] Invalid response status`);
      return { products: [], hasMore: false, totalRows: 0 };
    }
    
    if (!result.data) {
      console.log(`[API] No data in response`);
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
    
    console.log(`[API] Successfully fetched ${products.length} products. Has more: ${hasMore}, Total: ${totalRows}`);
    
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
  console.log(`[API] Fetching brands`);
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/brands`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    });
    
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
    
    console.log(`[API] Brands response:`, result);
    
    if (!result || result.status !== 'success') {
      console.error(`[API] Invalid brands response status`);
      return [];
    }
    
    if (!result.data) {
      console.log(`[API] No brands data in response`);
      return [];
    }
    
    const brands = Array.isArray(result.data) ? result.data : [];
    console.log(`[API] Successfully fetched ${brands.length} brands`);
    
    return brands.filter((brand: any) => brand && brand.id && brand.brand_name_ar);
  } catch (error) {
    console.error('[API] Error fetching brands:', error);
    return [];
  }
}

export async function fetchCategories(): Promise<Category[]> {
  console.log(`[API] Fetching categories`);
  
  try {
    const response = await fetch(`${API_BASE_URL}?action=fetch-categories`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    });
    
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
    
    console.log(`[API] Categories response:`, result);
    
    if (!result || result.status !== 'success') {
      console.error(`[API] Invalid categories response status`);
      return [];
    }
    
    if (!result.data) {
      console.log(`[API] No categories data in response (empty array expected)`);
      return [];
    }
    
    const categories = Array.isArray(result.data) ? result.data : [];
    console.log(`[API] Successfully fetched ${categories.length} categories`);
    
    return categories.filter((category: any) => category && category.id && category.name_ar);
  } catch (error) {
    console.error('[API] Error fetching categories:', error);
    return [];
  }
}

export async function checkAppUpdateStatus(appVersion: string): Promise<boolean> {
  console.log(`[API] Checking app update status - version: ${appVersion}`);
  
  try {
    const endpoint = `${API_BASE}/api/v1/auth/client-version/validate`;
    const payload = {
      version: appVersion,
    };

    console.log('[API] Version check request:', {
      endpoint,
      method: 'POST',
      payload,
    });

    const response = await fetch(endpoint, {
      method: 'POST',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
      body: JSON.stringify(payload),
    });
    
    console.log(`[API] Update check response status:`, response.status);

    if (!response || !response.ok) {
      let errorBody: any = null;
      try {
        errorBody = await response.json();
      } catch {
        errorBody = null;
      }
      console.log('[API] Version check non-OK response body:', errorBody);
      console.log(`[API] App update required`);
      return false;
    }

    let result: any = null;
    try {
      result = await response.json();
    } catch {
      result = null;
    }
    console.log('[API] Version check response body:', result);

    // Support multiple backend response shapes while defaulting to "up to date" on successful validation.
    if (result?.mustUpdate === true || result?.forceUpdate === true || result?.updateRequired === true) {
      console.log(`[API] App update required`);
      return false;
    }
    if (result?.isValid === false || result?.isSupported === false || result?.upToDate === false) {
      console.log(`[API] App update required`);
      return false;
    }

    console.log(`[API] App is up to date`);
    return true;
  } catch (error) {
    console.error('[API] Error checking update status:', error);
    return false;
  }
}

export async function fetchProductById(id: string): Promise<Product | null> {
  console.log(`[API] Fetching product with id: ${id}`);
  
  if (!id) {
    console.error(`[API] Invalid product id`);
    return null;
  }
  
  try {
    const response = await fetch(`${API_BASE}/api/v1/products?product=${encodeURIComponent(id)}`, {
      method: 'GET',
      headers: withClientSourceHeader({
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      }),
    });
    
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
    
    console.log(`[API] Product details response:`, result);
    
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
    console.log(`[API] Successfully fetched product: ${productName}`);
    
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
