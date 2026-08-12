import { apiFetch } from '@/services/httpClient';

export type ClientOrderItem = {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
};

export type ClientOrder = {
  id: string;
  status: string;
  sellingPoint: string;
  createdAt: string;
  totalItems: number;
  totalPrice: number;
  items: ClientOrderItem[];
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

export async function fetchMyOrders(): Promise<ClientOrder[]> {
  const response = await apiFetch<any>('/api/v1/selling-orders/drafts?limit=100&offset=0');
  const rows = Array.isArray(response?.data) ? response.data : [];

  return rows.map((row: any) => {
    const data = asObject(row?.data);
    const summary = asObject(data.summary);
    const rawItems = Array.isArray(data.items) ? data.items : [];
    const items = rawItems.map((item: any) => ({
      productId: String(item?.productId || item?.product_id || item?.product || ''),
      productName: String(item?.productName || item?.product_name || ''),
      quantity: asNumber(item?.quantity),
      price: asNumber(item?.price),
    }));

    return {
      id: String(row?.id || ''),
      status: String(row?.status || 'pending').toLowerCase(),
      sellingPoint: String(row?.selling_point || ''),
      createdAt: String(row?.['created-at'] || row?.created_at || ''),
      totalItems: asNumber(summary.totalItems) || items.reduce((sum: number, item: ClientOrderItem) => sum + item.quantity, 0),
      totalPrice: asNumber(summary.totalPrice) || items.reduce((sum: number, item: ClientOrderItem) => sum + item.price * item.quantity, 0),
      items,
    };
  });
}
