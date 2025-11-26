import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useBasket } from '@/contexts/BasketContext';
import { fetchProductById } from '@/services/api';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

const getNumColumns = () => {
  const screenWidth = Dimensions.get('window').width;
  if (Platform.OS === 'web') {
    if (screenWidth >= 1200) return 5;
    if (screenWidth >= 900) return 4;
    if (screenWidth >= 600) return 3;
  }
  return 2;
};

export default function FavoritesScreen() {
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToBasket } = useBasket();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [numColumns, setNumColumns] = useState(getNumColumns());
  const [key, setKey] = useState('fav-grid-' + getNumColumns());
  const listRef = useRef<FlatList>(null);

  console.log('[Favorites] favorites:', favorites);

  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['favorite-products', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      console.log('[Favorites] Fetching', favorites.length, 'favorite products');
      
      const promises = favorites.map(async (id) => {
        try {
          const product = await fetchProductById(id);
          console.log('[Favorites] Fetched product:', id, ':', product?.name);
          return product;
        } catch (error) {
          console.error(`[Favorites] Error fetching product ${id}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      const validProducts = results.filter((p): p is Product => p !== null);
      
      console.log('[Favorites] Successfully fetched', validProducts.length, 'products');
      return validProducts;
    },
    enabled: favorites.length > 0,
  });

  console.log('[Favorites] productsData:', productsData?.length, 'items, isLoading:', isLoading, 'error:', error);

  const favoriteProducts = productsData || [];

  const handleAddToBasket = (productId: string, e: any) => {
    e.stopPropagation();
    addToBasket(productId, 1);
  };

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 500);
  }, []);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newNumColumns = (() => {
        if (Platform.OS === 'web') {
          if (window.width >= 1200) return 5;
          if (window.width >= 900) return 4;
          if (window.width >= 600) return 3;
        }
        return 2;
      })();
      
      if (newNumColumns !== numColumns) {
        setNumColumns(newNumColumns);
        setKey('fav-grid-' + newNumColumns);
      }
    });

    return () => subscription?.remove();
  }, [numColumns]);

  const cardWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return (screenWidth - 16 * (numColumns + 1)) / numColumns;
  }, [numColumns]);

  const renderProduct = ({ item }: { item: Product }) => (
    <View style={{ width: cardWidth, marginBottom: 16 }}>
      <Pressable
        style={styles.productCard}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.productImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' }} 
              style={styles.productImage} 
              resizeMode="cover" 
            />
          )}
          <Pressable
            style={({ pressed }) => [
              styles.favoriteButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              toggleFavorite(item.id);
            }}
          >
            <Feather name="x" color="#FF3B30" size={20} />
          </Pressable>
        </View>
        <View style={styles.productInfo}>
          <Text style={styles.brandText}>{item.brand}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.price}>{formatPrice(item.price)}</Text>
          <Pressable 
            style={({ pressed }) => [
              styles.addToBasketButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={(e) => handleAddToBasket(item.id, e)}
          >
            <Feather name="plus" color="#FFFFFF" size={16} />
            <Text style={styles.addToBasketText}>أضف للسلة</Text>
          </Pressable>
        </View>
      </Pressable>
    </View>
  );

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>جاري تحميل المفضلات...</Text>
        </View>
      ) : favoriteProducts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconContainer}>
            <Feather name="heart" color="#DDD" size={64} />
          </View>
          <Text style={styles.emptyTitle}>لا توجد مفضلات بعد</Text>
          <Text style={styles.emptyText}>
            ابدأ بإضافة المنتجات إلى مفضلتك لرؤيتها هنا
          </Text>
          <Pressable
            style={({ pressed }) => [
              styles.shopButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.push('/(tabs)/home')}
          >
            <Feather name="shopping-bag" color="#FFFFFF" size={20} />
            <Text style={styles.shopButtonText}>ابدأ التسوق</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            key={key}
            data={favoriteProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.productsContainer}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
          />
          {showScrollTop && (
            <Pressable
              style={({ pressed }) => [
                styles.scrollToTopButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleScrollToTop}
            >
              <Feather name="chevron-up" color="#FFFFFF" size={24} />
            </Pressable>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  productsContainer: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative' as const,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  productInfo: {
    padding: 12,
  },
  brandText: {
    fontSize: 11,
    color: '#999',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 6,
    lineHeight: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  rating: {
    fontSize: 12,
    color: '#FFB800',
    fontWeight: '600' as const,
    marginRight: 4,
  },
  reviewCount: {
    fontSize: 11,
    color: '#999',
  },
  price: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  addToBasketButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    gap: 4,
  },
  addToBasketText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#F8F8F8',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  shopButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 28,
    gap: 8,
  },
  shopButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  scrollToTopButton: {
    position: 'absolute' as const,
    bottom: 20,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});
