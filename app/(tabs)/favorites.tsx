import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import {
  Alert,
  ActivityIndicator,
  Dimensions,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useFavorites } from '@/contexts/FavoritesContext';
import { useBasket } from '@/contexts/BasketContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import ProductCard from '@/components/ProductCard';
import { fetchProductById } from '@/services/api';
import { Product } from '@/types/product';

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
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { favorites, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
  const { selectedSellingPoint } = useSellingPoint();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [numColumns, setNumColumns] = useState(getNumColumns());
  const [key, setKey] = useState('fav-grid-' + getNumColumns());
  const listRef = useRef<FlatList>(null);
  const promptSelectSellingPoint = useCallback(() => {
    const title =
      '\u0627\u062e\u062a\u064a\u0627\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639';
    const message =
      '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const shouldOpenStore = window.confirm(`${title}\n\n${message}`);
      if (shouldOpenStore) {
        router.push('/(tabs)/store');
      }
      return;
    }
    Alert.alert(title, message, [
      { text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') },
      { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' },
    ]);
  }, [router]);


  const { data: productsData, isLoading, error } = useQuery({
    queryKey: ['favorite-products', favorites],
    queryFn: async () => {
      if (favorites.length === 0) return [];
      
      
      const promises = favorites.map(async (id) => {
        try {
          const product = await fetchProductById(id);
          return product;
        } catch (error) {
          console.error(`[Favorites] Error fetching product ${id}:`, error);
          return null;
        }
      });
      
      const results = await Promise.all(promises);
      const validProducts = results.filter((p): p is Product => p !== null);
      
      return validProducts;
    },
    enabled: favorites.length > 0,
  });


  const favoriteProducts = productsData || [];

  const handleAddToBasket = (product: Product) => {
    if (!Number.isFinite(product.price) || product.price <= 0) return;

    if (!selectedSellingPoint?.id) {
      promptSelectSellingPoint();
      return;
    }
    addToBasket(product, 1);
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
    <ProductCard
      product={item}
      style={{ width: cardWidth, marginBottom: 16 }}
      isFavorite
      basketQuantity={getItemQuantity(item.id)}
      onPress={() => router.push(`/product/${item.id}`)}
      onToggleFavorite={() => toggleFavorite(item.id)}
      onAddToBasket={() => handleAddToBasket(item)}
    />
  );

  return (
    <FloralBackdrop subtle style={styles.container}>
      <BrandedHeader topInset={insets.top} showBackButton={false} />
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
    </FloralBackdrop>
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
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
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


