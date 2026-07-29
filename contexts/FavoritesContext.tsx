import AsyncStorage from '@react-native-async-storage/async-storage';
import createContextHook from '@nkzw/create-context-hook';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';

const FAVORITES_KEY = 'cosmetics_favorites';

export const [FavoritesContext, useFavorites] = createContextHook(() => {
  const { isAuthenticated } = useAuth();
  const [favorites, setFavorites] = useState<string[]>([]);

  const favoritesQuery = useQuery({
    queryKey: ['favorites'],
    queryFn: async () => {
      const stored = await AsyncStorage.getItem(FAVORITES_KEY);
      return stored ? JSON.parse(stored) : [];
    },
    enabled: isAuthenticated,
  });

  const syncMutation = useMutation({
    mutationFn: async (newFavorites: string[]) => {
      await AsyncStorage.setItem(FAVORITES_KEY, JSON.stringify(newFavorites));
      return newFavorites;
    },
  });

  const { mutate } = syncMutation;

  useEffect(() => {
    if (!isAuthenticated) {
      setFavorites([]);
      return;
    }
    if (favoritesQuery.data) {
      setFavorites(favoritesQuery.data);
    }
  }, [favoritesQuery.data, isAuthenticated]);

  const toggleFavorite = useCallback((productId: string) => {
    if (!isAuthenticated) return;

    const updated = favorites.includes(productId)
      ? favorites.filter((id) => id !== productId)
      : [...favorites, productId];
    setFavorites(updated);
    mutate(updated);
  }, [favorites, isAuthenticated, mutate]);

  const isFavorite = useCallback((productId: string) => favorites.includes(productId), [favorites]);

  return useMemo(() => ({
    favorites,
    toggleFavorite,
    isFavorite,
    isLoading: favoritesQuery.isLoading,
  }), [favorites, toggleFavorite, isFavorite, favoritesQuery.isLoading]);
});
