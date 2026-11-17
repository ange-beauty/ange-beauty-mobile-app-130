import { apiFetch } from '@/services/httpClient';

export type ClientOrderItem = {
  productId: string;
  productName: string;
  image: string;
  quantity: number;
  price: number;
  /** Not in the client's submission: staff added or swapped it in. */
  added?: boolean;
};

export type ClientOrder = {
  id: string;
  sellingOrder: string;
  status: string;
  sellingPoint: string;
  createdAt: string;
  totalItems: number;
  totalPrice: number;
  items: ClientOrderItem[];
  /** Submitted lines that are no longer in the confirmed order (staff removed or replaced them). */
  removedItems: ClientOrderItem[];
};

function asObject(value: unknown): Record<string, any> {
  if (value && typeof value === 'object') return value as Record<string, any>;
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value);
      return parsed && typeof parsed === 'object' ? parsed : {};
    } catch {
      return {};
    }
  }
  return {};
}

function asNumber(value: unknown): number {
  const result = typeof value === 'number' ? value : Number(value);
  return Number.isFinite(result) ? result : 0;
}

function parseItems(rawItems: unknown): ClientOrderItem[] {
  return (Array.isArray(rawItems) ? rawItems : []).map((item: any) => ({
    productId: String(item?.productId || item?.product_id || item?.product || ''),
    productName: String(item?.productName || item?.product_name || ''),
    image: String(item?.image || item?.image_url || ''),
    quantity: asNumber(item?.quantity),
    price: asNumber(item?.price),
  }));
}

export async function fetchMyOrders(): Promise<ClientOrder[]> {
  const response = await apiFetch<any>('/api/v1/selling-orders/drafts?limit=100&offset=0');
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows.map((row: any) => {
    const data = asObject(row?.data);
    const summary = asObject(data.summary);
    const submittedIds = new Set(parseItems(data.original_items).map((item) => item.productId));
    const items = parseItems(data.items).map((item) => ({
      ...item,
      added: submittedIds.size > 0 && !submittedIds.has(item.productId),
    }));
    const keptIds = new Set(items.map((item) => item.productId));
    const removedItems = parseItems(data.original_items).filter((item) => item.productId && !keptIds.has(item.productId));

    return {
      id: String(row?.id || ''),
      sellingOrder: String(row?.selling_order || ''),
      status: String(row?.status || 'draft').toLowerCase(),
      sellingPoint: String(row?.selling_point || ''),
      createdAt: String(row?.['created-at'] || row?.created_at || ''),
      totalItems: asNumber(summary.totalItems) || items.reduce((sum: number, item: ClientOrderItem) => sum + item.quantity, 0),
      totalPrice: asNumber(summary.totalPrice) || items.reduce((sum: number, item: ClientOrderItem) => sum + item.price * item.quantity, 0),
      items,
      removedItems,
    };
  });
}
