import { useQueries, useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback, useRef, useMemo } from 'react';
import { useRouter } from 'expo-router';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBasket } from '@/contexts/BasketContext';
import { fetchProductById } from '@/services/api';
import { Product } from '@/types/product';
import { formatPrice, toArabicNumerals } from '@/utils/formatPrice';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

export default function BasketScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basket, updateQuantity, removeFromBasket, totalItems, clearBasket } = useBasket();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [name, setName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [captchaAnswer, setCaptchaAnswer] = useState('');
  const listRef = useRef<FlatList>(null);

  const captcha = useMemo(() => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    return { num1, num2, answer: num1 + num2 };
  }, [showCheckoutModal]);

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      console.log('[Order] Submitting order:', orderData);
      
      const response = await fetch(`${API_BASE}/api/v1/selling-orders/client-initialization`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      console.log('[Order] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Order] Failed to submit order:', errorText);
        throw new Error('فشل في إرسال الطلب');
      }

      const result = await response.json();
      console.log('[Order] Order submitted successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[Order] Order success:', data);
      Alert.alert(
        'تم إرسال الطلب',
        'شكراً لك! سنتواصل معك قريباً',
        [
          {
            text: 'موافق',
            onPress: () => {
              handleCloseModal();
              clearBasket();
            },
          },
        ]
      );
    },
    onError: (error: any) => {
      console.error('[Order] Order error:', error);
      Alert.alert(
        'خطأ',
        error.message || 'حدث خطأ أثناء إرسال الطلب. حاول مرة أخرى',
        [{ text: 'موافق' }]
      );
    },
  });

  const productQueries = useQueries({
    queries: basket.map(item => ({
      queryKey: ['product', item.productId],
      queryFn: () => fetchProductById(item.productId),
      staleTime: 5 * 60 * 1000,
    })),
  });

  console.log('[Basket] basket:', basket);
  console.log('[Basket] productQueries:', productQueries.map(q => ({ isLoading: q.isLoading, hasData: !!q.data, error: q.error })));

  const isLoading = productQueries.some(query => query.isLoading);
  const hasErrors = productQueries.some(query => query.error);
  const productsData = productQueries.map(query => query.data);

  console.log('[Basket] isLoading:', isLoading, 'hasErrors:', hasErrors);

  const basketProducts = React.useMemo(() => {
    const products = basket.map((basketItem, index) => {
      const product = productsData[index];
      if (!product) {
        console.log('[Basket] No product data for basket item:', basketItem.productId);
        return null;
      }
      return { ...product, quantity: basketItem.quantity };
    }).filter((p): p is (Product & { quantity: number }) => p !== null);
    
    console.log('[Basket] basketProducts:', products.length, 'items');
    return products;
  }, [basket, productsData]);

  const totalPrice = React.useMemo(() => {
    return basketProducts.reduce((sum, item) => {
      const price = typeof item.price === 'number' ? item.price : parseFloat(item.price as string || '0');
      return sum + (price * item.quantity);
    }, 0);
  }, [basketProducts]);

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 500);
  }, []);

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
          <Text style={styles.productPrice}>{formatPrice(price)}</Text>

          <View style={styles.quantityControls}>
            <Pressable
              style={({ pressed }) => [
                styles.quantityButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                updateQuantity(item.id, item.quantity + 1);
              }}
            >
              <Feather name="plus" color="#1A1A1A" size={16} />
            </Pressable>

            <Text style={styles.quantityText}>{toArabicNumerals(item.quantity)}</Text>

            <Pressable
              style={({ pressed }) => [
                styles.quantityButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={(e) => {
                e.stopPropagation();
                if (item.quantity === 1) {
                  removeFromBasket(item.id);
                } else {
                  updateQuantity(item.id, item.quantity - 1);
                }
              }}
            >
              <Feather name="minus" color="#1A1A1A" size={16} />
            </Pressable>
          </View>
        </View>

        <View style={styles.itemActions}>
          <Text style={styles.itemTotal}>{formatPrice(itemTotal)}</Text>
          <Pressable
            style={({ pressed }) => [
              styles.deleteButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              removeFromBasket(item.id);
            }}
          >
            <Feather name="trash-2" color="#FF3B30" size={20} />
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
          <Feather name="shopping-bag" color="#CCCCCC" size={80} />
          <Text style={styles.emptyTitle}>سلتك فارغة</Text>
          <Text style={styles.emptySubtitle}>ابدأ بإضافة المنتجات إلى السلة</Text>
        </View>
      </View>
    );
  }

  const handleClearBasket = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('هل أنت متأكد من إفراغ السلة؟');
      if (confirmed) {
        clearBasket();
      }
    } else {
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
    }
  };

  const handleCheckout = () => {
    setShowCheckoutModal(true);
  };

  const handleCloseModal = () => {
    setShowCheckoutModal(false);
    setName('');
    setTelephone('');
    setAddress('');
    setCaptchaAnswer('');
  };

  const handleSubmitOrder = () => {
    if (!name.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال الاسم');
      return;
    }
    if (!telephone.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال رقم الهاتف');
      return;
    }
    if (!address.trim()) {
      Alert.alert('خطأ', 'الرجاء إدخال العنوان');
      return;
    }
    if (parseInt(captchaAnswer) !== captcha.answer) {
      Alert.alert('خطأ', 'الإجابة غير صحيحة. حاول مرة أخرى');
      setCaptchaAnswer('');
      return;
    }

    const orderData = {
      customer: {
        name: name.trim(),
        telephone: telephone.trim(),
        address: address.trim(),
      },
      items: basketProducts.map(product => ({
        productId: product.id,
        productName: product.name,
        brand: product.brand,
        brandId: product.brandId,
        quantity: product.quantity,
        price: product.price,
        total: product.price * product.quantity,
        image: product.image,
      })),
      summary: {
        totalItems: totalItems,
        totalPrice: totalPrice,
      },
      timestamp: new Date().toISOString(),
    };

    orderMutation.mutate(orderData);
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View>
          <Text style={styles.headerTitle}>السلة</Text>
          <Text style={styles.itemCount}>{toArabicNumerals(totalItems)} منتج</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleClearBasket}
        >
          <Feather name="trash-2" color="#FF3B30" size={20} />
          <Text style={styles.clearButtonText}>إفراغ السلة</Text>
        </Pressable>
      </View>

      <>
        <FlatList
          ref={listRef}
          data={basketProducts}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
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

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>المجموع</Text>
          <Text style={styles.totalAmount}>{formatPrice(totalPrice)}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.checkoutButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleCheckout}
        >
          <Text style={styles.checkoutButtonText}>إتمام الطلب</Text>
        </Pressable>
      </View>

      <Modal
        visible={showCheckoutModal}
        animationType="slide"
        transparent={true}
        onRequestClose={handleCloseModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>إتمام الطلب</Text>
              <Pressable
                style={({ pressed }) => [
                  styles.closeButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleCloseModal}
              >
                <Feather name="x" size={24} color="#1A1A1A" />
              </Pressable>
            </View>

            <ScrollView
              style={styles.modalContent}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.orderSummary}>
                <Text style={styles.summaryLabel}>المجموع الكلي</Text>
                <Text style={styles.summaryAmount}>{formatPrice(totalPrice)}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>الاسم الكامل *</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="أدخل اسمك"
                  placeholderTextColor="#999"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>رقم الهاتف *</Text>
                <TextInput
                  style={styles.input}
                  value={telephone}
                  onChangeText={setTelephone}
                  placeholder="أدخل رقم الهاتف"
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>العنوان *</Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="أدخل عنوانك الكامل"
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>التحقق البشري *</Text>
                <View style={styles.captchaContainer}>
                  <Text style={styles.captchaQuestion}>
                    {toArabicNumerals(captcha.num1)} + {toArabicNumerals(captcha.num2)} = ?
                  </Text>
                  <TextInput
                    style={styles.captchaInput}
                    value={captchaAnswer}
                    onChangeText={setCaptchaAnswer}
                    placeholder="الجواب"
                    placeholderTextColor="#999"
                    keyboardType="number-pad"
                  />
                </View>
              </View>

              <Pressable
                style={({ pressed }) => [
                  styles.submitButton,
                  pressed && styles.buttonPressed,
                  orderMutation.isPending && styles.submitButtonDisabled,
                ]}
                onPress={handleSubmitOrder}
                disabled={orderMutation.isPending}
              >
                {orderMutation.isPending ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.submitButtonText}>تأكيد الطلب</Text>
                )}
              </Pressable>
            </ScrollView>
          </View>
        </View>
      </Modal>
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
  scrollToTopButton: {
    position: 'absolute' as const,
    bottom: 100,
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
  },
  orderSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  summaryLabel: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  summaryAmount: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  formGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  input: {
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
  },
  captchaContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  captchaQuestion: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    textAlign: 'center',
  },
  captchaInput: {
    width: 100,
    backgroundColor: '#F8F8F8',
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 15,
    color: '#1A1A1A',
    textAlign: 'center',
  },
  submitButton: {
    backgroundColor: '#1A1A1A',
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 20,
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  submitButtonDisabled: {
    opacity: 0.6,
  },
});
