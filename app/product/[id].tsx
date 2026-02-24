import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Image,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { WebView } from 'react-native-webview';

import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useBasket } from '@/contexts/BasketContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import { fetchProductById } from '@/services/api';
import { getAvailableQuantityForSellingPoint } from '@/utils/availability';
import { getDisplayBrand } from '@/utils/brand';
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
      tension: 46,
      friction: 8,
    }).start();
  }, [scaleAnim]);

  if (isLoading) {
    return (
      <View style={styles.container}>
        <FloralBackdrop subtle />
        <BrandedHeader topInset={insets.top} showSearch={false} />
        <View style={styles.stateContainer}>
          <ActivityIndicator size="large" color={beautyTheme.colors.accentDark} />
          <Text style={styles.stateText}>{'\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c...'}</Text>
        </View>
      </View>
    );
  }

  if (error || !product) {
    return (
      <View style={styles.container}>
        <FloralBackdrop subtle />
        <BrandedHeader topInset={insets.top} showSearch={false} />
        <View style={styles.stateContainer}>
          <Text style={styles.stateTitle}>{'\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0627\u0644\u0645\u0646\u062a\u062c'}</Text>
          <Pressable style={({ pressed }) => [styles.retryButton, pressed && styles.buttonPressed]} onPress={() => router.back()}>
            <Text style={styles.retryButtonText}>{'\u0639\u0648\u062f\u0629'}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const isFav = isFavorite(product.id);
  const quantity = getItemQuantity(product.id);
  const selectedPointAvailable = getAvailableQuantityForSellingPoint(product, selectedSellingPoint?.id);
  const displayBrand = getDisplayBrand(product.brand);

  const handleAddToBasket = () => {
    if (!selectedSellingPoint?.id) {
      Alert.alert(
        '\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631',
        '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629',
        [
          { text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') },
          { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' },
        ]
      );
      return;
    }
    if (selectedPointAvailable !== null && quantity >= selectedPointAvailable) {
      Alert.alert(
        '\u062a\u0646\u0628\u064a\u0647',
        '\u0644\u0627 \u064a\u0645\u0643\u0646 \u0625\u0636\u0627\u0641\u0629 \u0643\u0645\u064a\u0629 \u0623\u0643\u0628\u0631 \u0645\u0646 \u0627\u0644\u0645\u062a\u0648\u0641\u0631 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629'
      );
      return;
    }
    addToBasket(product.id, 1);
  };

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showSearch={false} />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={beautyTheme.colors.accentDark}
            colors={[beautyTheme.colors.accentDark]}
          />
        }
      >
        <Animated.View style={[styles.heroCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.imageWrap}>
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
          <Pressable
            style={({ pressed }) => [styles.favoriteButton, pressed && styles.buttonPressed]}
            onPress={() => toggleFavorite(product.id)}
          >
            <Feather name="heart" size={20} color={isFav ? beautyTheme.colors.accentDark : '#8F7B7F'} />
          </Pressable>
        </Animated.View>

        <Animated.View style={[styles.bodyCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.metaRow}>
            {!!product.category && (
              <View style={styles.categoryBadge}>
                <Text style={styles.categoryText}>{product.category}</Text>
              </View>
            )}
            {!!displayBrand && (
              <Pressable
                onPress={() => product.brandId && router.push(`/(tabs)/products?brandId=${product.brandId}`)}
                style={({ pressed }) => [styles.brandButton, pressed && styles.brandPressed]}
              >
                <Text style={styles.brandText}>{displayBrand}</Text>
              </Pressable>
            )}
          </View>

          <Text style={styles.productName}>{product.name || '\u0645\u0646\u062a\u062c \u0628\u062f\u0648\u0646 \u0627\u0633\u0645'}</Text>

          <View style={styles.priceCard}>
            <Text style={styles.priceLabel}>{'\u0627\u0644\u0633\u0639\u0631'}</Text>
            <Text style={styles.priceValue}>{formatPrice(product.price)}</Text>
            {selectedSellingPoint ? (
              <Text style={[styles.availabilityText, selectedPointAvailable === null ? styles.notAvailable : styles.available]}>
                {selectedPointAvailable === null
                  ? '\u063a\u064a\u0631 \u0645\u062a\u0648\u0641\u0631 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0627\u0644\u0645\u062e\u062a\u0627\u0631\u0629'
                  : `\u0627\u0644\u0645\u062a\u0648\u0641\u0631: ${toArabicNumerals(selectedPointAvailable)}`}
              </Text>
            ) : (
              <Text style={styles.availabilityText}>{'\u0627\u062e\u062a\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0644\u0645\u0639\u0631\u0641\u0629 \u0627\u0644\u062a\u0648\u0641\u0631'}</Text>
            )}
          </View>

          {!!product.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{'\u0627\u0644\u0648\u0635\u0641'}</Text>
              <View style={styles.descriptionBox}>
                <WebView
                  originWhitelist={['*']}
                  source={{
                    html: `
                      <!DOCTYPE html>
                      <html>
                        <head>
                          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0">
                          <style>
                            * { margin: 0; padding: 0; box-sizing: border-box; }
                            body {
                              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
                              font-size: 15px; line-height: 1.7; color: #3C2B2E;
                              direction: rtl; text-align: right; background: transparent;
                            }
                            p { margin-bottom: 12px; }
                            p:last-child { margin-bottom: 0; }
                            h1,h2,h3,h4,h5,h6 { margin-bottom: 8px; color: #2F2527; }
                            ul,ol { margin: 8px 0; padding-right: 20px; }
                            li { margin-bottom: 4px; }
                            img { max-width: 100%; border-radius: 8px; margin: 8px 0; }
                          </style>
                        </head>
                        <body>${product.description}</body>
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
                      if (data.height) setWebViewHeight(data.height);
                    } catch {}
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

          {!!product.ingredients?.length && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>{'\u0627\u0644\u0645\u0643\u0648\u0646\u0627\u062a \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629'}</Text>
              <View style={styles.chipsWrap}>
                {product.ingredients.map((ingredient, index) => (
                  <View key={index} style={styles.chip}>
                    <Text style={styles.chipText}>{ingredient}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </Animated.View>
      </ScrollView>

      <View style={[styles.bottomBar, { paddingBottom: insets.bottom + 12 }]}>
        <View>
          <Text style={styles.bottomLabel}>{'\u0627\u0644\u0633\u0639\u0631'}</Text>
          <Text style={styles.bottomPrice}>{formatPrice(product.price)}</Text>
        </View>
        <Pressable style={({ pressed }) => [styles.addButton, pressed && styles.buttonPressed]} onPress={handleAddToBasket}>
          <Text style={styles.addText}>
            {quantity > 0
              ? `\u0641\u064a \u0627\u0644\u0633\u0644\u0629 (${toArabicNumerals(quantity)})`
              : '\u0625\u0636\u0627\u0641\u0629 \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: beautyTheme.colors.page,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 16,
    paddingBottom: 180,
  },
  stateContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  stateText: {
    color: beautyTheme.colors.textMuted,
    fontSize: 15,
  },
  stateTitle: {
    color: beautyTheme.colors.text,
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
  },
  retryButton: {
    marginTop: 6,
    backgroundColor: beautyTheme.colors.accentDark,
    paddingHorizontal: 26,
    paddingVertical: 12,
    borderRadius: 14,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
  },
  heroCard: {
    marginTop: 8,
    backgroundColor: '#FFF8FA',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#EADDE0',
    padding: 12,
    position: 'relative',
  },
  imageWrap: {
    borderRadius: 18,
    overflow: 'hidden',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EFE4E6',
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 22,
    right: 22,
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9DDE0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },
  bodyCard: {
    marginTop: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#EADDE0',
    padding: 16,
  },
  metaRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    gap: 8,
  },
  categoryBadge: {
    backgroundColor: '#F8F0F3',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  categoryText: {
    fontSize: 12,
    color: beautyTheme.colors.textMuted,
    fontWeight: '600',
  },
  brandButton: {
    backgroundColor: '#F8F0F3',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 999,
  },
  brandPressed: {
    opacity: 0.75,
  },
  brandText: {
    fontSize: 12,
    color: beautyTheme.colors.accentDark,
    fontWeight: '700',
  },
  productName: {
    fontSize: 28,
    lineHeight: 36,
    fontWeight: '700',
    color: beautyTheme.colors.text,
    textAlign: 'right',
    fontFamily: 'serif',
    marginBottom: 12,
  },
  priceCard: {
    backgroundColor: '#FFF7F9',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 12,
    marginBottom: 16,
  },
  priceLabel: {
    fontSize: 12,
    color: beautyTheme.colors.textMuted,
    textAlign: 'right',
  },
  priceValue: {
    marginTop: 3,
    fontSize: 24,
    color: beautyTheme.colors.accentDark,
    fontWeight: '700',
    textAlign: 'right',
  },
  availabilityText: {
    marginTop: 4,
    fontSize: 13,
    textAlign: 'right',
    color: beautyTheme.colors.textMuted,
  },
  available: {
    color: '#3F7A4A',
  },
  notAvailable: {
    color: '#A35141',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: beautyTheme.colors.text,
    textAlign: 'right',
    marginBottom: 8,
  },
  descriptionBox: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    backgroundColor: '#FFFDFD',
  },
  webView: {
    backgroundColor: 'transparent',
  },
  chipsWrap: {
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F8F0F3',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  chipText: {
    fontSize: 13,
    color: beautyTheme.colors.text,
  },
  bottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    borderTopWidth: 1,
    borderTopColor: '#EADDE0',
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 16,
    paddingTop: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomLabel: {
    fontSize: 12,
    color: beautyTheme.colors.textMuted,
    textAlign: 'right',
  },
  bottomPrice: {
    marginTop: 2,
    fontSize: 20,
    fontWeight: '700',
    color: beautyTheme.colors.accentDark,
    textAlign: 'right',
  },
  addButton: {
    minWidth: 190,
    borderRadius: 16,
    backgroundColor: beautyTheme.colors.accentDark,
    paddingHorizontal: 22,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
