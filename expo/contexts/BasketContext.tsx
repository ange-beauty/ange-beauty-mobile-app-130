import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

const BASKET_KEY = 'cosmetics_basket';

export interface BasketItem {
  productId: string;
  quantity: number;
  addedAt: number;
}

export const [BasketContext, useBasket] = createContextHook(() => {
  const [basket, setBasket] = useState<BasketItem[]>([]);

  const basketQuery = useQuery({
    queryKey: ['basket'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(BASKET_KEY);
      return stored ? JSON.parse(stored) : [];
    },
  });

  const syncMutation = useMutation({
    mutationFn: async (newBasket: BasketItem[]) => {
      await AsyncStorage.setItem(BASKET_KEY, JSON.stringify(newBasket));
      return newBasket;
    },
  });

  const { mutate } = syncMutation;

  useEffect(() => {
    if (basketQuery.data) {
      setBasket(basketQuery.data);
    }
  }, [basketQuery.data]);

  const addToBasket = useCallback((productId: string, quantity: number = 1) => {
    const existingIndex = basket.findIndex(item => item.productId === productId);
    let updated: BasketItem[];
    
    if (existingIndex >= 0) {
      updated = [...basket];
      updated[existingIndex] = {
        ...updated[existingIndex],
        quantity: updated[existingIndex].quantity + quantity,
      };
    } else {
      updated = [...basket, { productId, quantity, addedAt: Date.now() }];
    }
    
    setBasket(updated);
    mutate(updated);
  }, [basket, mutate]);

  const removeFromBasket = useCallback((productId: string) => {
    const updated = basket.filter((item) => item.productId !== productId);
    setBasket(updated);
    mutate(updated);
  }, [basket, mutate]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromBasket(productId);
      return;
    }
    
    const updated = basket.map((item) =>
      item.productId === productId ? { ...item, quantity } : item
    );
    setBasket(updated);
    mutate(updated);
  }, [basket, mutate, removeFromBasket]);

  const clearBasket = useCallback(() => {
    setBasket([]);
    mutate([]);
  }, [mutate]);

  const getItemQuantity = useCallback((productId: string) => {
    const item = basket.find((item) => item.productId === productId);
    return item ? item.quantity : 0;
  }, [basket]);

  const totalItems = useMemo(() => {
    return basket.reduce((sum, item) => sum + item.quantity, 0);
  }, [basket]);

  return useMemo(() => ({
    basket,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    getItemQuantity,
    totalItems,
    isLoading: basketQuery.isLoading,
  }), [
    basket,
    addToBasket,
    removeFromBasket,
    updateQuantity,
    clearBasket,
    getItemQuantity,
    totalItems,
    basketQuery.isLoading,
  ]);
});
