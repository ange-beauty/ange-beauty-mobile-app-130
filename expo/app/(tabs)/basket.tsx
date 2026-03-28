import { useQueries, useMutation } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import React, { useState, useCallback, useRef } from 'react';
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
import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';

import { useBasket } from '@/contexts/BasketContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProductById } from '@/services/api';
import { withClientSourceHeader } from '@/services/requestHeaders';
import { Product } from '@/types/product';
import { getAvailableQuantityForSellingPoint } from '@/utils/availability';
import { getDisplayBrand } from '@/utils/brand';
import { formatPrice, toArabicNumerals } from '@/utils/formatPrice';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'https://api.angebeauty.net/';
const API_BASE = API_BASE_URL.replace(/\/+$/, '');

export default function BasketScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { basket, updateQuantity, removeFromBasket, totalItems, clearBasket } = useBasket();
  const { selectedSellingPoint } = useSellingPoint();
  const { isAuthenticated, user } = useAuth();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [isGuestCheckout, setIsGuestCheckout] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [telephone, setTelephone] = useState('');
  const [address, setAddress] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const listRef = useRef<FlatList>(null);

  const orderMutation = useMutation({
    mutationFn: async (orderData: any) => {
      console.log('[Order] Submitting order:', orderData);

      const path = '/api/v1/selling-orders/client-initialization';
      const response = await fetch(`${API_BASE}${path}`, {
        method: 'POST',
        headers: withClientSourceHeader({
          'Accept': 'application/json',
          'Content-Type': 'application/json',
        }),
        body: JSON.stringify(orderData),
      });

      console.log('[Order] Response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Order] Failed to submit order:', errorText);
        throw new Error('\u0641\u0634\u0644 \u0641\u064a \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628');
      }

      const result = await response.json();
      console.log('[Order] Order submitted successfully:', result);
      return result;
    },
    onSuccess: (data) => {
      console.log('[Order] Order success:', data);
      Alert.alert(
        '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628',
        '\u0634\u0643\u0631\u0627\u064b \u0644\u0643! \u0633\u0646\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0643 \u0642\u0631\u064a\u0628\u0627\u064b',
        [
          {
            text: '\u0645\u0648\u0627\u0641\u0642',
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
        '\u062e\u0637\u0623',
        error.message || '\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649',
        [{ text: '\u0645\u0648\u0627\u0641\u0642' }]
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
    const selectedPointAvailable = getAvailableQuantityForSellingPoint(item, selectedSellingPoint?.id);
    const displayBrand = getDisplayBrand(item.brand);

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
          {!!displayBrand && <Text style={styles.brandText}>{displayBrand}</Text>}
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
                if (selectedPointAvailable !== null && item.quantity >= selectedPointAvailable) {
                  Alert.alert('\u062a\u0646\u0628\u064a\u0647', '\u0644\u0627 \u064a\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0643\u0645\u064a\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u062a\u0648\u0641\u0631 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629');
                  return;
                }
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
        <FloralBackdrop subtle />
        <BrandedHeader topInset={insets.top} showBackButton={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'\u0627\u0644\u0633\u0644\u0629'}</Text>
        </View>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>{'\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0633\u0644\u0629...'}</Text>
        </View>
      </View>
    );
  }

  if (!selectedSellingPoint?.id) {
    return (
      <View style={styles.container}>
        <FloralBackdrop subtle />
        <BrandedHeader topInset={insets.top} showBackButton={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'\u0627\u0644\u0633\u0644\u0629'}</Text>
        </View>
        <View style={styles.missingStoreContainer}>
          <View style={styles.stateIconWrap}>
            <Feather name="map-pin" color="#B78690" size={56} />
          </View>
          <Text style={styles.missingStoreTitle}>
            {'\u0644\u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631'}
          </Text>
          <Text style={styles.missingStoreSubtitle}>
            {'\u0627\u062e\u062a\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0645\u0646 \u062a\u0628\u0648\u064a\u0628 \u0627\u0644\u0645\u062a\u062c\u0631 \u0641\u064a \u0627\u0644\u0634\u0631\u064a\u0637 \u0627\u0644\u0633\u0641\u0644\u064a'}
          </Text>
          <Pressable
            style={({ pressed }) => [styles.openStoreButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/(tabs)/store')}
          >
            <Text style={styles.openStoreButtonText}>{'\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (basket.length === 0) {
    return (
      <View style={styles.container}>
        <FloralBackdrop subtle />
        <BrandedHeader topInset={insets.top} showBackButton={false} />
        <View style={styles.header}>
          <Text style={styles.headerTitle}>{'\u0627\u0644\u0633\u0644\u0629'}</Text>
        </View>
        <View style={styles.emptyContainer}>
          <View style={styles.stateIconWrap}>
            <Feather name="shopping-bag" color="#B78690" size={56} />
          </View>
          <Text style={styles.emptyTitle}>{'\u0633\u0644\u062a\u0643 \u0641\u0627\u0631\u063a\u0629'}</Text>
          <Text style={styles.emptySubtitle}>{'\u0627\u0628\u062f\u0623 \u0628\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629'}</Text>
        </View>
      </View>
    );
  }

  const handleClearBasket = () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('\u0647\u0644 \u0623\u0646\u062a \u0645\u062a\u0623\u0643\u062f \u0645\u0646 \u0625\u0641\u0631\u0627\u063a \u0627\u0644\u0633\u0644\u0629\u061f');
      if (confirmed) {
        clearBasket();
      }
    } else {
      Alert.alert(
        '\u0625\u0641\u0631\u0627\u063a \u0627\u0644\u0633\u0644\u0629',
        '\u0623\u0643\u064a\u062f \u0625\u0641\u0631\u0627\u063a \u0627\u0644\u0633\u0644\u0629\u061f',
        [
          {
            text: '\u0625\u0644\u063a\u0627\u0621',
            style: 'cancel',
          },
          {
            text: '\u0625\u0641\u0631\u0627\u063a',
            style: 'destructive',
            onPress: () => clearBasket(),
          },
        ],
        { cancelable: true }
      );
    }
  };

  const handleCheckout = () => {
    if (!isAuthenticated) {
      Alert.alert(
        '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0637\u0644\u0648\u0628',
        '\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
        [{ text: '\u0641\u062a\u062d \u062d\u0633\u0627\u0628\u064a', onPress: () => router.push('/(tabs)/account') }, { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' }]
      );
      return;
    }
    if (!selectedSellingPoint?.id) {
      Alert.alert(
        '\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631',
        '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
        [{ text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') }, { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' }]
      );
      return;
    }
    if (!user?.emailVerified) {
      Alert.alert(
        '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0645\u0637\u0644\u0648\u0628',
        '\u064a\u062c\u0628 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
        [{ text: '\u0645\u0648\u0627\u0641\u0642' }]
      );
      return;
    }
    setIsGuestCheckout(false);
    setName(user?.name || '');
    setEmail(user?.email || '');
    setTelephone(user?.phone || '');
    setShowCheckoutModal(true);
  };

  const handleGuestCheckout = () => {
    if (!selectedSellingPoint?.id) {
      Alert.alert(
        '\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631',
        '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
        [{ text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') }, { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' }]
      );
      return;
    }
    setIsGuestCheckout(true);
    setShowCheckoutModal(true);
  };

  const handleCloseModal = () => {
    setShowCheckoutModal(false);
    setIsGuestCheckout(false);
    setName('');
    setEmail('');
    setTelephone('');
    setAddress('');
    setFieldErrors({});
  };

  const handleSubmitOrder = () => {
    if (!isAuthenticated && !isGuestCheckout) {
      Alert.alert(
        '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0637\u0644\u0648\u0628',
        '\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
        [{ text: '\u0641\u062a\u062d \u062d\u0633\u0627\u0628\u064a', onPress: () => router.push('/(tabs)/account') }, { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' }]
      );
      return;
    }
    if (isAuthenticated && !isGuestCheckout && !user?.emailVerified) {
      Alert.alert(
        '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0645\u0637\u0644\u0648\u0628',
        '\u064a\u062c\u0628 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628',
        [{ text: '\u0645\u0648\u0627\u0641\u0642' }]
      );
      return;
    }
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = '\u0627\u0644\u0627\u0633\u0645\u0020\u0645\u0637\u0644\u0648\u0628';
    }
    if (!telephone.trim()) {
      errors.telephone = '\u0631\u0642\u0645\u0020\u0627\u0644\u0647\u0627\u062a\u0641\u0020\u0645\u0637\u0644\u0648\u0628';
    }
    if (!email.trim()) {
      errors.email = '\u0627\u0644\u0628\u0631\u064a\u062f\u0020\u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0020\u0645\u0637\u0644\u0648\u0628';
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      errors.email = '\u064a\u0631\u062c\u0649\u0020\u0625\u062f\u062e\u0627\u0644\u0020\u0628\u0631\u064a\u062f\u0020\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0020\u0635\u062d\u064a\u062d';
    }
    if (!address.trim()) {
      errors.address = '\u0627\u0644\u0639\u0646\u0648\u0627\u0646\u0020\u0645\u0637\u0644\u0648\u0628';
    }
    if (!selectedSellingPoint?.id) {
      errors.sellingPoint = '\u0646\u0642\u0637\u0629\u0020\u0627\u0644\u0628\u064a\u0639\u0020\u0645\u0637\u0644\u0648\u0628\u0629';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const unavailableItem = basketProducts.find((product) => {
      const available = getAvailableQuantityForSellingPoint(product, selectedSellingPoint?.id);
      return available !== null && product.quantity > available;
    });
    if (unavailableItem) {
      Alert.alert('\u062a\u0646\u0628\u064a\u0647', '\u0643\u0645\u064a\u0629 \u0623\u062d\u062f \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0641\u064a \u0627\u0644\u0633\u0644\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u062a\u0648\u0641\u0631 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629');
      return;
    }

    setFieldErrors({});

    const orderData = {
      selling_point: selectedSellingPoint?.id,
      customer: {
        name: name.trim(),
        email: email.trim(),
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
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showBackButton={false} />
        <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>{'\u0627\u0644\u0633\u0644\u0629'}</Text>
          <Text style={styles.itemCount}>{toArabicNumerals(totalItems)} {'\u0645\u0646\u062a\u062c'}</Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.clearButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleClearBasket}
        >
          <Feather name="trash-2" color="#FF3B30" size={20} />
          <Text style={styles.clearButtonText}>{'\u0625\u0641\u0631\u0627\u063a \u0627\u0644\u0633\u0644\u0629'}</Text>
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

      <View style={[styles.footer, { paddingBottom: insets.bottom + 96 }]}>
        {!isAuthenticated ? (
          <View style={styles.guestActionsContainer}>
            <Text style={styles.loginRequiredText}>
              {'\u064a\u0631\u062c\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u062a\u062c\u0631\u0628\u0629 \u0623\u0641\u0636\u0644 \u060c \u0623\u0648 \u0623\u0631\u0633\u0644 \u0627\u0644\u0637\u0644\u0628 \u0643\u0632\u0627\u0626\u0631'}
            </Text>
            <View style={styles.guestButtonsRow}>
              <Pressable
                style={({ pressed }) => [
                  styles.guestSecondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => router.push('/(tabs)/account')}
              >
                <Text style={styles.guestSecondaryButtonText}>
                  {'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644'}
                </Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.guestPrimaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={handleGuestCheckout}
              >
                <Text style={styles.guestPrimaryButtonText}>
                  {'\u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u0643\u0632\u0627\u0626\u0631'}
                </Text>
              </Pressable>
            </View>
          </View>
        ) : null}
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>{'\u0627\u0644\u0645\u062c\u0645\u0648\u0639'}</Text>
          <Text style={styles.totalAmount}>{formatPrice(totalPrice)}</Text>
        </View>
        {isAuthenticated ? (
          <>
            {!user?.emailVerified ? (
              <Text style={styles.emailVerificationWarningText}>
                {'\u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u063a\u064a\u0631 \u0645\u0641\u0639\u0644. \u064a\u0631\u062c\u0649 \u062a\u0641\u0639\u064a\u0644\u0647 \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628.'}
              </Text>
            ) : null}
            <Pressable
              style={({ pressed }) => [
                styles.checkoutButton,
                !user?.emailVerified && styles.checkoutButtonDisabled,
                pressed && styles.buttonPressed,
              ]}
              onPress={handleCheckout}
              disabled={!user?.emailVerified}
            >
              <Text style={styles.checkoutButtonText}>
                {user?.emailVerified
                  ? '\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628'
                  : '\u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0645\u0637\u0644\u0648\u0628'}
              </Text>
            </Pressable>
          </>
        ) : null}
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
              <Text style={styles.modalTitle}>{'\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628'}</Text>
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
                <Text style={styles.summaryLabel}>{'\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064a'}</Text>
                <Text style={styles.summaryAmount}>{formatPrice(totalPrice)}</Text>
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{'\u0627\u0644\u0627\u0633\u0645\u0020\u0627\u0644\u0643\u0627\u0645\u0644\u0020\u002a'}</Text>
                <TextInput
                  style={[styles.input, fieldErrors.name ? styles.inputErrorBorder : null]}
                  value={name}
                  onChangeText={(value) => {
                    setName(value);
                    if (fieldErrors.name) setFieldErrors((prev) => ({ ...prev, name: '' }));
                  }}
                  placeholder={'\u0623\u062f\u062e\u0644\u0020\u0627\u0633\u0645\u0643'}
                  placeholderTextColor="#999"
                />
                {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{'\u0631\u0642\u0645\u0020\u0627\u0644\u0647\u0627\u062a\u0641\u0020\u002a'}</Text>
                <TextInput
                  style={[styles.input, fieldErrors.telephone ? styles.inputErrorBorder : null]}
                  value={telephone}
                  onChangeText={(value) => {
                    setTelephone(value);
                    if (fieldErrors.telephone) setFieldErrors((prev) => ({ ...prev, telephone: '' }));
                  }}
                  placeholder={'\u0623\u062f\u062e\u0644\u0020\u0631\u0642\u0645\u0020\u0627\u0644\u0647\u0627\u062a\u0641'}
                  placeholderTextColor="#999"
                  keyboardType="phone-pad"
                />
                {fieldErrors.telephone ? <Text style={styles.errorText}>{fieldErrors.telephone}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{'\u0627\u0644\u0628\u0631\u064a\u062f\u0020\u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0020\u002a'}</Text>
                <TextInput
                  style={[styles.input, fieldErrors.email ? styles.inputErrorBorder : null]}
                  value={email}
                  onChangeText={(value) => {
                    setEmail(value);
                    if (fieldErrors.email) setFieldErrors((prev) => ({ ...prev, email: '' }));
                  }}
                  placeholder={'\u0623\u062f\u062e\u0644\u0020\u0628\u0631\u064a\u062f\u0643\u0020\u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a'}
                  placeholderTextColor="#999"
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{'\u0646\u0642\u0637\u0629\u0020\u0627\u0644\u0628\u064a\u0639\u0020\u002a'}</Text>
                <TextInput
                  style={[styles.input, fieldErrors.sellingPoint ? styles.inputErrorBorder : null]}
                  editable={false}
                  value={selectedSellingPoint ? (selectedSellingPoint.name_ar || selectedSellingPoint.name_en || selectedSellingPoint.id) : ''}
                  placeholder={'\u0627\u062e\u062a\u0631\u0020\u0646\u0642\u0637\u0629\u0020\u0627\u0644\u0628\u064a\u0639\u0020\u0645\u0646\u0020\u062a\u0628\u0648\u064a\u0628\u0020\u0627\u0644\u0645\u062a\u062c\u0631'}
                  placeholderTextColor="#999"
                />
                {fieldErrors.sellingPoint ? <Text style={styles.errorText}>{fieldErrors.sellingPoint}</Text> : null}
              </View>

              <View style={styles.formGroup}>
                <Text style={styles.label}>{'\u0627\u0644\u0639\u0646\u0648\u0627\u0646 *'}</Text>
                <TextInput
                  style={[styles.input, styles.textArea, fieldErrors.address ? styles.inputErrorBorder : null]}
                  value={address}
                  onChangeText={(value) => {
                    setAddress(value);
                    if (fieldErrors.address) setFieldErrors((prev) => ({ ...prev, address: '' }));
                  }}
                  placeholder={'\u0623\u062f\u062e\u0644 \u0639\u0646\u0648\u0627\u0646\u0643 \u0627\u0644\u0643\u0627\u0645\u0644'}
                  placeholderTextColor="#999"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                {fieldErrors.address ? <Text style={styles.errorText}>{fieldErrors.address}</Text> : null}
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
                  <Text style={styles.submitButtonText}>{'\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628'}</Text>
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
    backgroundColor: 'transparent',
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
  missingStoreContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  stateIconWrap: {
    width: 98,
    height: 98,
    borderRadius: 49,
    backgroundColor: '#F7ECF0',
    borderWidth: 1,
    borderColor: '#E8DADF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  missingStoreTitle: {
    marginTop: 18,
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'center' as const,
  },
  missingStoreSubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
  openStoreButton: {
    marginTop: 18,
    backgroundColor: '#7E4A53',
    borderRadius: 12,
    paddingHorizontal: 20,
    height: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  openStoreButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700' as const,
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
  loginRequiredText: {
    textAlign: 'right',
    color: '#B9442B',
    fontSize: 13,
    marginBottom: 10,
  },
  guestActionsContainer: {
    marginBottom: 12,
  },
  guestButtonsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  guestPrimaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestPrimaryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700' as const,
  },
  guestSecondaryButton: {
    flex: 1,
    height: 46,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#D7DED1',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  guestSecondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600' as const,
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
  checkoutButtonDisabled: {
    backgroundColor: '#8F8F8F',
  },
  checkoutButtonText: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emailVerificationWarningText: {
    textAlign: 'right',
    color: '#B9442B',
    fontSize: 13,
    marginBottom: 10,
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
  pickerInput: {
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  pickerText: {
    color: '#1A1A1A',
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  pickerPlaceholder: {
    color: '#999',
    fontSize: 15,
    flex: 1,
    textAlign: 'right',
  },
  pickerList: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    maxHeight: 180,
  },
  pickerScroll: {
    maxHeight: 180,
  },
  pickerItem: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  pickerItemTitle: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    textAlign: 'right' as const,
  },
  pickerItemSubtitle: {
    fontSize: 12,
    color: '#777',
    marginTop: 2,
    textAlign: 'right' as const,
  },
  pickerEmptyText: {
    padding: 12,
    color: '#777',
    textAlign: 'center' as const,
  },
  inputErrorBorder: {
    borderColor: '#FF3B30',
  },
  errorText: {
    marginTop: 6,
    color: '#FF3B30',
    fontSize: 12,
    fontWeight: '500' as const,
  },
  textArea: {
    minHeight: 80,
    paddingTop: 14,
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





