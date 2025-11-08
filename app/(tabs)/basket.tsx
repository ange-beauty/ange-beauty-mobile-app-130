import { useQuery } from '@tanstack/react-query';
import { Trash2, Plus, Minus, ShoppingBag } from 'lucide-react-native';
import React from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBasket } from '@/contexts/BasketContext';
import { fetchProducts } from '@/services/api';
import { Product } from '@/types/product';
import { formatPrice, toArabicNumerals } from '@/utils/formatPrice';

export default function BasketScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basket, updateQuantity, removeFromBasket, totalItems, clearBasket } = useBasket();

  const productIds = basket.map(item => item.productId);

  const { data: productsData, isLoading } = useQuery({
    queryKey: ['basketProducts', productIds],
    queryFn: async () => {
      if (productIds.length === 0) return { products: [] };
      const response = await fetchProducts({ limit: 100 });
      return response;
    },
    enabled: productIds.length > 0,
  });

  const basketProducts = React.useMemo(() => {
    if (!productsData?.products) return [];
    
    return basket.map(basketItem => {
      const product = productsData.products.find((p: Product) => p.id === basketItem.productId);
      return product ? { ...product, quantity: basketItem.quantity } : null;
    }).filter(Boolean) as (Product & { quantity: number })[];
  }, [basket, productsData]);

  const totalPrice = React.useMemo(() => {
    return basketProducts.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as string || '0');
      return sum + (price * item.quantity);
    }, 0);
  }, [basketProducts]);

  const renderItem = ({ item }: { item: Product & { quantity: number } }) => {
    const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as string || '0');
    const itemTotal = price * item.quantity;

    return (
      <Pressable 
        style={styles.basketItem}
        onPress={() => router.push(`/product/${item.id}`)}
      >
        <View style={styles.productImageContainer}>
          {item.image ? (
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
          ) : (
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=200&h=200&fit=crop' }} 
              style={styles.productImage} 
              resizeMode="cover" 
            />
          )}
        </View>

        <View style={styles.productDetails}>
          <Text style={styles.brandText}>{item.brand || 'غير محدد'}</Text>
          <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
          <Text style={styles.productPrice}>{formatPrice(price)} د.إ</Text>

          <View style={styles.quantityControls}>
            <Pressable
              style={styles.quantityButton}
              onPress={(e) => {
                e.stopPropagation();
                updateQuantity(item.id, item.quantity + 1);
              }}
            >
              <Plus color="#1A1A1A" size={16} />
            </Pressable>

            <Text style={styles.quantityText}>{toArabicNumerals(item.quantity)}</Text>

            <Pressable
              style={styles.quantityButton}
              onPress={(e) => {
                e.stopPropagation();
                if (item.quantity === 1) {
                  removeFromBasket(item.id);
                } else {
                  updateQuantity(item.id, item.quantity - 1);
                }
              }}
            >
              <Minus color="#1A1A1A" size={16} />
            </Pressable>
          </View>
        </View>

        <View style={styles.itemActions}>
          <Text style={styles.itemTotal}>{formatPrice(itemTotal)} د.إ</Text>
          <Pressable
            style={styles.deleteButton}
            onPress={(e) => {
              e.stopPropagation();
              removeFromBasket(item.id);
            }}
          >
            <Trash2 color="#FF3B30" size={20} />
          </Pressable>
        </View>
      </Pressable>
    );
  };

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>السلة</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>جاري تحميل السلة...</Text>
        </View>
      </View>
    );
  }

  if (basket.length === 0) {
    return (
      <View style={styles.container}>
        <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
          <Text style={styles.headerTitle}>السلة</Text>
        </View>
        <View style={styles.emptyContainer}>
          <ShoppingBag color="#CCCCCC" size={80} strokeWidth={1.5} />
          <Text style={styles.emptyTitle}>سلتك فارغة</Text>
          <Text style={styles.emptySubtitle}>ابدأ بإضافة المنتجات إلى السلة</Text>
        </View>
      </View>
    );
  }

  const handleClearBasket = () => {
    Alert.alert(
      'إفراغ السلة',
      'اكيد افراغ السلة ؟',
      [
        {
          text: 'إلغاء',
          style: 'cancel',
        },
        {
          text: 'إفراغ',
          style: 'destructive',
          onPress: () => clearBasket(),
        },
      ],
      { cancelable: true }
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>السلة</Text>
          <Text style={styles.itemCount}>{toArabicNumerals(totalItems)} منتج</Text>
        </View>
        <Pressable style={styles.clearButton} onPress={handleClearBasket}>
          <Trash2 color="#FF3B30" size={20} />
          <Text style={styles.clearButtonText}>إفراغ السلة</Text>
        </Pressable>
      </View>

      <FlatList
        data={basketProducts}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
      />

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المجموع</Text>
          <Text style={styles.totalAmount}>{formatPrice(totalPrice)} د.إ</Text>
        </View>
        <Pressable style={styles.checkoutButton}>
          <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  clearButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFF0F0',
    borderRadius: 12,
  },
  clearButtonText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#FF3B30',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  itemCount: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
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
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 24,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#999',
    marginTop: 8,
    textAlign: 'center',
  },
  listContainer: {
    padding: 16,
  },
  basketItem: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productDetails: {
    flex: 1,
    marginLeft: 12,
    justifyContent: 'space-between',
  },
  brandText: {
    fontSize: 10,
    color: '#999',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
  },
  productName: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginTop: 2,
    lineHeight: 16,
  },
  productPrice: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
    marginTop: 4,
  },
  quantityControls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
    gap: 12,
  },
  quantityButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  quantityText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    minWidth: 20,
    textAlign: 'center',
  },
  itemActions: {
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginLeft: 8,
  },
  itemTotal: {
    fontSize: 15,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  deleteButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#FFF0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    padding: 20,
    paddingBottom: 24,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  totalAmount: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  checkoutButton: {
    backgroundColor: '#1A1A1A',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
});
