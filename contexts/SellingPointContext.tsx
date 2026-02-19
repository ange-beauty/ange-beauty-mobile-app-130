import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const SELECTED_SELLING_POINT_KEY = 'selected_selling_point';
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
  const [selectedSellingPointId, setSelectedSellingPointId] = useState<string>('');

  const sellingPointsQuery = useQuery({
    queryKey: ['selling-points'],
    queryFn: async (): Promise<SellingPoint[]> => {
      const response = await fetch(`${API_BASE}/api/v1/selling-points`, {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      });

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

  useEffect(() => {
    (async () => {
      const stored = await AsyncStorage.getItem(SELECTED_SELLING_POINT_KEY);
      if (stored) {
        setSelectedSellingPointId(stored);
      }
    })();
  }, []);

  const setSelectedSellingPointIdAndPersist = useCallback(async (id: string) => {
    setSelectedSellingPointId(id);
    if (id) {
      await AsyncStorage.setItem(SELECTED_SELLING_POINT_KEY, id);
    } else {
      await AsyncStorage.removeItem(SELECTED_SELLING_POINT_KEY);
    }
  }, []);

  const sellingPoints = sellingPointsQuery.data || [];
  const selectedSellingPoint = sellingPoints.find((p) => p.id === selectedSellingPointId) || null;

  return useMemo(
    () => ({
      sellingPoints,
      selectedSellingPoint,
      selectedSellingPointId,
      setSelectedSellingPointId: setSelectedSellingPointIdAndPersist,
      isLoadingSellingPoints: sellingPointsQuery.isLoading,
    }),
    [
      sellingPoints,
      selectedSellingPoint,
      selectedSellingPointId,
      setSelectedSellingPointIdAndPersist,
      sellingPointsQuery.isLoading,
    ]
  );
});
