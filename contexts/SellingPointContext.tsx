import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { debugFetch } from '@/services/httpDebug';
import { withClientSourceHeader } from '@/services/requestHeaders';

const DEFAULT_SELLING_POINT_ID = '0fTUIooeOt-sp';
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

export interface SellingPoint {
  id: string;
  name_ar?: string | null;
  name_en?: string | null;
  city?: string | null;
  country?: string | null;
}

export const [SellingPointContext, useSellingPoint] = createContextHook(() => {
  const sellingPointsQuery = useQuery({
    queryKey: ['selling-points'],
    queryFn: async (): Promise<SellingPoint[]> => {
      const query = new URLSearchParams({
        is_active: 'true',
        is_sales_enabled: 'true',
      });
      const response = await debugFetch(`${API_BASE}/api/v1/selling-points?${query.toString()}`, {
        method: 'GET',
        headers: withClientSourceHeader({
          Accept: 'application/json',
          'Content-Type': 'application/json',
        }),
      }, 'SellingPoint');

      if (!response.ok) {
        return [];
      }

      const result = await response.json();
      if (!result || !Array.isArray(result.data)) {
        return [];
      }

      return result.data
        .filter((point: any) => point && point.id)
        .map((point: any) => ({
          id: point.id?.toString(),
          name_ar: point.name_ar ?? null,
          name_en: point.name_en ?? null,
          city: point.city ?? null,
          country: point.country ?? null,
        }));
    },
  });

  const setSelectedSellingPointIdAndPersist = useCallback(async (_id: string) => {
    // Selling point is fixed by business rule.
  }, []);

  const sellingPoints = sellingPointsQuery.data || [];
  const selectedSellingPoint =
    sellingPoints.find((p) => p.id === DEFAULT_SELLING_POINT_ID) || {
      id: DEFAULT_SELLING_POINT_ID,
      name_ar: null,
      name_en: null,
      city: null,
      country: null,
    };

  return useMemo(
    () => ({
      sellingPoints,
      selectedSellingPoint,
      selectedSellingPointId: DEFAULT_SELLING_POINT_ID,
      setSelectedSellingPointId: setSelectedSellingPointIdAndPersist,
      isLoadingSellingPoints: sellingPointsQuery.isLoading,
    }),
    [
      sellingPoints,
      selectedSellingPoint,
      setSelectedSellingPointIdAndPersist,
      sellingPointsQuery.isLoading,
    ]
  );
});
