import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import { useFavorites } from '@/contexts/FavoritesContext';

import { useBasket } from '@/contexts/BasketContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import { fetchProductById } from '@/services/api';
import { getAvailableQuantityForSellingPoint } from '@/utils/availability';
import { formatPrice, toArabicNumerals } from '@/utils/formatPrice';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
  const { selectedSellingPoint } = useSellingPoint();
  const [webViewHeight, setWebViewHeight] = useState(0);

  const { data: product, isLoading, error, refetch } = useQuery({
    queryKey: ['product', id],
    queryFn: () => fetchProductById(id as string),
    enabled: !!id,
  });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const scaleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [scaleAnim]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={[styles.loadingContainer, { paddingTop: insets.top + 60 }]}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>جاري تحميل المنتج...</Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <View style={[styles.errorContainer, { paddingTop: insets.top + 60 }]}>
          <Text style={styles.errorText}>لم يتم العثور على المنتج</Text>
          <Pressable
            style={({ pressed }) => [
              styles.backButton,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => router.back()}
          >
            <Text style={styles.backButtonText}>عودة</Text>
          </Pressable>
        </View>
      </View>
    );
  }
  const isFav = isFavorite(product.id);
  const quantity = getItemQuantity(product.id);
  const selectedPointAvailable = getAvailableQuantityForSellingPoint(product, selectedSellingPoint?.id);

  const handleAddToBasket = () => {
    if (!selectedSellingPoint?.id) {
      Alert.alert('\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631', '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629', [{ text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') }, { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' }]);
      return;
    }
    if (selectedPointAvailable !== null && quantity >= selectedPointAvailable) {
      Alert.alert('تنبيه', 'لا يمكن إضافة كمية أكبر من المتوفر في نقطة البيع المختارة');
      return;
    }
    addToBasket(product.id, 1);
  };

  return (
    <View style={styles.container}>
      <ScrollView 
        style={styles.scrollView} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#1A1A1A"
            colors={['#1A1A1A']}
          />
        }
      >
        <View style={styles.imageContainer}>
          <View style={styles.imageCard}>
            {product.image ? (
              <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
            ) : (
              <Image 
                source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' }} 
                style={styles.image} 
                resizeMode="cover" 
              />
            )}
          </View>
          <View style={[styles.headerButtons, { top: insets.top + 8 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.back()}
            >
              <Feather name="arrow-left" color="#1A1A1A" size={24} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => toggleFavorite(product.id)}
            >
              <Feather
                name="heart"
                color={isFav ? '#FF69B4' : '#1A1A1A'}
                size={24}
              />
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.contentContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.content}>
            <View style={styles.metaRow}>
              {product.category && (
                <View style={styles.categoryBadge}>
                  <Text style={styles.categoryText}>
                    {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                  </Text>
                </View>
              )}
              {product.brand && (
                <Pressable 
                  onPress={() => {
                    if (product.brandId) {
                      console.log('[ProductDetail] Navigating to home with brandId:', product.brandId);
                      router.push(`/(tabs)/products?brandId=${product.brandId}`);
                    }
                  }}
                  style={({ pressed }) => [
                    styles.brandButton,
                    pressed && styles.brandButtonPressed,
                  ]}
                >
                  <Text style={styles.brandButtonText}>{product.brand}</Text>
                </Pressable>
              )}
            </View>
            <Text style={styles.productName}>{product.name || '\u0645\u0646\u062a\u062c \u0628\u062f\u0648\u0646 \u0627\u0633\u0645'}</Text>

            <View style={styles.priceCard}>
              <Text style={styles.priceLabel}>{'\u0627\u0644\u0633\u0639\u0631'}</Text>
              <Text style={styles.price}>{formatPrice(product.price)}</Text>
              {selectedSellingPoint && (
                <Text
                  style={[
                    styles.availabilityText,
                    selectedPointAvailable === null ? styles.availabilityWarning : styles.availabilityOk,
                  ]}
                >
                  {selectedPointAvailable === null
                    ? '\u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629'
                    : `\u0627\u0644\u0645\u062a\u0648\u0641\u0631: ${toArabicNumerals(selectedPointAvailable)}`}
                </Text>
              )}
            </View>

            {product.description && (
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionTitle}>{'\u0627\u0644\u0648\u0635\u0641'}</Text>
                <View style={styles.descriptionContent}>
                  <WebView
                    originWhitelist={['*']}
                    source={{
                      html: `
                        <!DOCTYPE html>
                        <html>
                          <head>
                            <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                            <style>
                              * {
                                margin: 0;
                                padding: 0;
                                box-sizing: border-box;
                              }
                              body {
                                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                                font-size: 15px;
                                line-height: 1.6;
                                color: #4A4A4A;
                                direction: rtl;
                                text-align: right;
                                padding: 0;
                                background: transparent;
                              }
                              p {
                                margin-bottom: 12px;
                              }
                              p:last-child {
                                margin-bottom: 0;
                              }
                              h1, h2, h3, h4, h5, h6 {
                                color: #1A1A1A;
                                margin-bottom: 8px;
                                font-weight: 700;
                              }
                              ul, ol {
                                margin: 8px 0;
                                padding-right: 20px;
                              }
                              li {
                                margin-bottom: 4px;
                              }
                              strong, b {
                                color: #1A1A1A;
                                font-weight: 700;
                              }
                              a {
                                color: #1A1A1A;
                                text-decoration: underline;
                              }
                              img {
                                max-width: 100%;
                                height: auto;
                                border-radius: 8px;
                                margin: 8px 0;
                              }
                            </style>
                          </head>
                          <body>
                            ${product.description}
                          </body>
                          <script>
                            window.addEventListener('load', function() {
                              window.ReactNativeWebView.postMessage(JSON.stringify({ height: document.body.scrollHeight }));
                            });
                          </script>
                        </html>
                      `,
                    }}
                    onMessage={(event) => {
                      try {
                        const data = JSON.parse(event.nativeEvent.data);
                        if (data.height) {
                          setWebViewHeight(data.height);
                        }
                      } catch (e) {
                        console.log('Error parsing WebView message:', e);
                      }
                    }}
                    style={[styles.webView, { height: webViewHeight || 200 }]}
                    scrollEnabled={false}
                    showsVerticalScrollIndicator={false}
                    showsHorizontalScrollIndicator={false}
                    bounces={false}
                  />
                </View>
              </View>
            )}

            {product.ingredients && product.ingredients.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>المكونات الرئيسية</Text>
                <View style={styles.ingredientsContainer}>
                  {product.ingredients.map((ingredient, index) => (
                    <View key={index} style={styles.ingredientChip}>
                      <Text style={styles.ingredientText}>{ingredient}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}
          </View>
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 16 }]}>
        <View>
          <Text style={styles.bottomBarLabel}>السعر</Text>
          <Text style={styles.bottomBarPrice}>
            {formatPrice(product.price)}
          </Text>
        </View>
        <Pressable
          style={({ pressed }) => [
            styles.addButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleAddToBasket}
        >
          <Text style={styles.addButtonText}>
            {quantity > 0 ? `في السلة (${toArabicNumerals(quantity)})` : 'إضافة إلى السلة'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F4F6F1',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 0.9,
    backgroundColor: '#EEF2EA',
    position: 'relative' as const,
    paddingHorizontal: 20,
    paddingTop: 28,
    paddingBottom: 14,
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
      },
    }),
  },
  imageCard: {
    flex: 1,
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7ECE4',
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  headerButtons: {
    position: 'absolute' as const,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    marginTop: -18,
  },
  content: {
    paddingHorizontal: 22,
    paddingTop: 20,
    paddingBottom: 28,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    marginBottom: 14,
  },
  brandButton: {
    backgroundColor: '#EFF3EA',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E1E7DB',
  },
  brandButtonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.97 }],
    backgroundColor: '#E5E5E5',
  },
  brandButtonText: {
    fontSize: 12,
    color: '#1A1A1A',
    fontWeight: '700' as const,
    textAlign: 'right',
  },
  productName: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
    lineHeight: 34,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF9E6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginRight: 12,
  },
  rating: {
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginLeft: 6,
  },
  reviewCount: {
    fontSize: 14,
    color: '#999',
  },
  categoryBadge: {
    backgroundColor: '#F3F4F1',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 18,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  priceCard: {
    backgroundColor: '#F7F9F4',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E4EBDD',
    paddingVertical: 14,
    paddingHorizontal: 16,
    marginBottom: 18,
  },
  priceLabel: {
    fontSize: 12,
    color: '#758070',
    marginBottom: 4,
    textAlign: 'right',
  },
  price: {
    fontSize: 27,
    fontWeight: '700' as const,
    color: '#111',
    marginBottom: 4,
    textAlign: 'right',
  },
  availabilityText: {
    fontSize: 14,
    textAlign: 'right',
  },
  availabilityOk: {
    color: '#476B4E',
  },
  availabilityWarning: {
    color: '#A35141',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  descriptionBox: {
    marginBottom: 28,
    backgroundColor: '#F8F9FA',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'right',
  },
  descriptionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    borderRightWidth: 3,
    borderRightColor: '#1A1A1A',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  ingredientsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  ingredientChip: {
    backgroundColor: '#F8F8F8',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  ingredientText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  bottomBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 8,
      },
    }),
  },
  bottomBarLabel: {
    fontSize: 13,
    color: '#999',
    marginBottom: 4,
    textAlign: 'right',
  },
  bottomBarPrice: {
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    minWidth: 190,
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 15,
    borderRadius: 20,
  },
  addButtonText: {
    fontSize: 16,
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
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 16,
  },
  errorText: {
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
  backButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 8,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.95 }],
  },
});




