import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { ArrowLeft, Heart } from 'lucide-react-native';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
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
import { fetchProductById } from '@/services/api';
import { formatPrice, toArabicNumerals } from '@/utils/formatPrice';

export default function ProductDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
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

  const handleAddToBasket = () => {
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
          {product.image ? (
            <Image source={{ uri: product.image }} style={styles.image} resizeMode="contain" />
          ) : (
            <Image 
              source={{ uri: 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' }} 
              style={styles.image} 
              resizeMode="cover" 
            />
          )}
          
          <View style={[styles.headerButtons, { top: insets.top + 8 }]}>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => router.back()}
            >
              <ArrowLeft color="#1A1A1A" size={24} />
            </Pressable>
            <Pressable
              style={({ pressed }) => [
                styles.iconButton,
                pressed && styles.buttonPressed,
              ]}
              onPress={() => toggleFavorite(product.id)}
            >
              <Heart
                color={isFav ? '#FF69B4' : '#1A1A1A'}
                size={24}
                fill={isFav ? '#FF69B4' : 'transparent'}
              />
            </Pressable>
          </View>
        </View>

        <Animated.View style={[styles.contentContainer, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.content}>
            {product.brand && (
              <Pressable 
                onPress={() => {
                  if (product.brandId) {
                    console.log('[ProductDetail] Navigating to home with brandId:', product.brandId);
                    router.push(`/?brandId=${product.brandId}`);
                  }
                }}
                style={({ pressed }) => [
                  styles.brandPressable,
                  pressed && styles.brandPressed,
                ]}
              >
                <Text style={styles.brandText}>{product.brand}</Text>
              </Pressable>
            )}
            <Text style={styles.productName}>{product.name || 'منتج بدون اسم'}</Text>



            {product.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>
                  {product.category.charAt(0).toUpperCase() + product.category.slice(1)}
                </Text>
              </View>
            )}

            <Text style={styles.price}>
              {formatPrice(product.price)}
            </Text>

            {product.description && (
              <View style={styles.descriptionBox}>
                <Text style={styles.descriptionTitle}>الوصف</Text>
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
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative' as const,
    ...Platform.select({
      web: {
        maxWidth: 600,
        alignSelf: 'center',
      },
    }),
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
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  contentContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
  },
  content: {
    padding: 24,
  },
  brandPressable: {
    alignSelf: 'flex-start',
  },
  brandPressed: {
    opacity: 0.6,
  },
  brandText: {
    fontSize: 14,
    color: '#1A1A1A',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 1,
    marginBottom: 8,
    textDecorationLine: 'underline' as const,
  },
  productName: {
    fontSize: 28,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
    lineHeight: 36,
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
    alignSelf: 'flex-start',
    backgroundColor: '#F0F0F0',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600' as const,
    color: '#666',
  },
  price: {
    fontSize: 36,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 32,
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
    marginBottom: 32,
    backgroundColor: '#F8F9FA',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E8EAED',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  descriptionTitle: {
    fontSize: 18,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 16,
    textAlign: 'right',
  },
  descriptionContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    overflow: 'hidden',
    borderLeftWidth: 3,
    borderLeftColor: '#1A1A1A',
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
    paddingHorizontal: 24,
    paddingTop: 16,
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
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
  bottomBarPrice: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  addButton: {
    backgroundColor: '#1A1A1A',
    paddingHorizontal: 48,
    paddingVertical: 16,
    borderRadius: 28,
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
