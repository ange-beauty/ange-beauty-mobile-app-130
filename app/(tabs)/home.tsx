import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import ProductPrice from '@/components/ProductPrice';
import { beautyTheme } from '@/constants/uiTheme';
import { Brand, fetchBrands, fetchProducts, fetchPublicOffers, fetchTagsWithProducts, Offer } from '@/services/api';
import { Product } from '@/types/product';

const discountOffersHomeImage = require('@/assets/images/discount__offers_home.webp');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const isWeb = Platform.OS === 'web';
  const horizontalPadding = width >= 1200 ? 28 : width >= 768 ? 20 : 16;
  const maxContentWidth = isWeb ? 1260 : width;
  const contentWidth = Math.min(width, maxContentWidth);
  const usableWidth = Math.max(220, contentWidth - horizontalPadding * 2);
  const highlightWidth = Math.min(usableWidth, isWeb ? 980 : usableWidth);
  const highlightHeight = highlightWidth * (9 / 16);
  const highlightSideInset = Math.max((usableWidth - highlightWidth) / 2, 0);
  const highlightStep = highlightWidth + 12;
  const highlightStartOffset = highlightSideInset;
  const highlightScrollRef = useRef<ScrollView>(null);
  const productHighlightScrollRef = useRef<ScrollView>(null);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);
  const [activeProductHighlightIndex, setActiveProductHighlightIndex] = useState(0);

  const {
    data: offersData,
    isLoading: isLoadingOffers,
    error: offersError,
    refetch: refetchOffers,
  } = useQuery({
    queryKey: ['public-offers'],
    queryFn: fetchPublicOffers,
  });
  const {
    data: highlightedData,
    isLoading: isLoadingHighlighted,
    error: highlightedError,
    refetch: refetchHighlighted,
  } = useQuery({
    queryKey: ['home-highlighted-products'],
    queryFn: () => fetchProducts({ page: 1, limit: 10, highlighted: 1 }),
  });
  const {
    data: brandsData,
    refetch: refetchBrands,
  } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });
  const {
    data: tagsData,
    refetch: refetchTags,
  } = useQuery({
    queryKey: ['tags-with-products'],
    queryFn: fetchTagsWithProducts,
  });

  const offers = useMemo(() => (offersData || []).slice(0, 6), [offersData]);
  const highlightedProducts = useMemo(
    () => (highlightedData?.products || []).slice(0, 10),
    [highlightedData?.products]
  );
  const brands = useMemo(() => (brandsData || []).slice(0, 12), [brandsData]);
  const tags = useMemo(() => (tagsData || []).slice(0, 20), [tagsData]);
  const isHomeLoading = isLoadingOffers || isLoadingHighlighted;
  const hasHomeError = !!offersError && !!highlightedError;
  const showHighlights = !offersError && offers.length > 0;
  const showHighlightedProducts = !highlightedError && highlightedProducts.length > 0;

  useEffect(() => {
    setActiveHighlightIndex(0);
    if (showHighlights) {
      highlightScrollRef.current?.scrollTo({ x: highlightStartOffset, animated: false });
    }
  }, [showHighlights, offers.length, highlightStartOffset]);

  useEffect(() => {
    if (!showHighlights || offers.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) => {
        const next = (prev + 1) % offers.length;
        highlightScrollRef.current?.scrollTo({ x: highlightStartOffset + next * highlightStep, animated: true });
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [showHighlights, offers.length, highlightStep, highlightStartOffset]);

  useEffect(() => {
    setActiveProductHighlightIndex(0);
    if (showHighlightedProducts) {
      productHighlightScrollRef.current?.scrollTo({ x: 0, animated: false });
    }
  }, [showHighlightedProducts, highlightedProducts.length]);

  useEffect(() => {
    if (!showHighlightedProducts || highlightedProducts.length < 2) return;

    const timer = setInterval(() => {
      setActiveProductHighlightIndex((current) => {
        const next = (current + 1) % highlightedProducts.length;
        productHighlightScrollRef.current?.scrollTo({ x: next * highlightStep, animated: true });
        return next;
      });
    }, 4000);

    return () => clearInterval(timer);
  }, [showHighlightedProducts, highlightedProducts.length, highlightStep]);

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showBackButton={false} floating />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            paddingTop: insets.top + 70,
            maxWidth: maxContentWidth,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoadingOffers || isLoadingHighlighted}
            onRefresh={() => {
              refetchOffers();
              refetchHighlighted();
              refetchBrands();
              refetchTags();
            }}
            tintColor={beautyTheme.colors.accentDark}
            colors={[beautyTheme.colors.accentDark]}
          />
        }
      >
        {isHomeLoading ? (
          <View style={styles.centerBox}>
            <ActivityIndicator size="large" color={beautyTheme.colors.accentDark} />
            <Text style={styles.centerText}>{'\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a...'}</Text>
          </View>
        ) : hasHomeError ? (
          <View style={styles.centerBox}>
            <Text style={styles.centerText}>{'\u062d\u062f\u062b \u062e\u0637\u0623 \u0623\u062b\u0646\u0627\u0621 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629'}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => {
                refetchOffers();
                refetchHighlighted();
                refetchBrands();
                refetchTags();
              }}
            >
              <Text style={styles.retryButtonText}>{'\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629'}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {showHighlights ? (
              <>
                <View style={styles.highlightsWrap}>
                  <ScrollView
                    ref={highlightScrollRef}
                    horizontal
                    pagingEnabled={!isWeb}
                    snapToInterval={highlightStep}
                    decelerationRate="fast"
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={[styles.highlightsRow, { paddingHorizontal: highlightSideInset }]}
                    onMomentumScrollEnd={(event) => {
                      const offsetX = event.nativeEvent.contentOffset.x;
                      const index = Math.round((offsetX - highlightStartOffset) / highlightStep);
                      const boundedIndex = Math.min(Math.max(index, 0), offers.length - 1);
                      setActiveHighlightIndex(boundedIndex);
                    }}
                  >
                    {offers.map((item) => (
                      <OfferHeroCard
                        key={item.id}
                        item={item}
                        width={highlightWidth}
                        height={highlightHeight}
                        onPress={() => router.push(getOfferHref(item))}
                      />
                    ))}
                  </ScrollView>
                  {isWeb && offers.length > 1 ? (
                    <>
                      <Pressable
                        style={({ pressed }) => [styles.carouselArrow, styles.carouselArrowLeft, pressed && styles.buttonPressed]}
                        onPress={() => {
                          const prev = (activeHighlightIndex - 1 + offers.length) % offers.length;
                          setActiveHighlightIndex(prev);
                          highlightScrollRef.current?.scrollTo({
                            x: highlightStartOffset + prev * highlightStep,
                            animated: true,
                          });
                        }}
                      >
                        <Feather name="chevron-left" size={22} color="#3A252A" />
                      </Pressable>
                      <Pressable
                        style={({ pressed }) => [styles.carouselArrow, styles.carouselArrowRight, pressed && styles.buttonPressed]}
                        onPress={() => {
                          const next = (activeHighlightIndex + 1) % offers.length;
                          setActiveHighlightIndex(next);
                          highlightScrollRef.current?.scrollTo({
                            x: highlightStartOffset + next * highlightStep,
                            animated: true,
                          });
                        }}
                      >
                        <Feather name="chevron-right" size={22} color="#3A252A" />
                      </Pressable>
                    </>
                  ) : null}
                </View>
                <View style={styles.highlightDotsRow}>
                  {offers.map((item, index) => (
                    <View
                      key={`highlight-dot-${item.id}`}
                      style={[
                        styles.highlightDot,
                        index === activeHighlightIndex && styles.highlightDotActive,
                      ]}
                    />
                  ))}
                </View>
              </>
            ) : null}

            <Pressable
              style={({ pressed }) => [
                styles.discountOffersBanner,
                pressed && styles.buttonPressed,
              ]}
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/products',
                  params: { hasActiveOffer: 'true' },
                })
              }
              accessibilityRole="button"
              accessibilityLabel={'\u062a\u0635\u0641\u062d \u0627\u0644\u062a\u062e\u0641\u064a\u0636\u0627\u062a \u0648\u0627\u0644\u0639\u0631\u0648\u0636'}
            >
              <Image
                source={discountOffersHomeImage}
                style={styles.discountOffersImage}
                resizeMode="contain"
              />
            </Pressable>

            {showHighlightedProducts ? (
              <>
                <SectionTitle title={'\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0645\u0645\u064a\u0632\u0629'} />
                <ScrollView
                  ref={productHighlightScrollRef}
                  horizontal
                  pagingEnabled={!isWeb}
                  snapToInterval={highlightStep}
                  decelerationRate="fast"
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.highlightedProductsHeroRow}
                  onMomentumScrollEnd={(event) => {
                    const index = Math.round(event.nativeEvent.contentOffset.x / highlightStep);
                    setActiveProductHighlightIndex(
                      Math.min(Math.max(index, 0), highlightedProducts.length - 1),
                    );
                  }}
                >
                  {highlightedProducts.map((item) => (
                    <HighlightedProductHeroCard
                      key={item.id}
                      item={item}
                      width={highlightWidth}
                      height={highlightHeight}
                      onPress={() => router.push(`/product/${item.id}`)}
                    />
                  ))}
                </ScrollView>
                {highlightedProducts.length > 1 ? (
                  <View style={styles.highlightDotsRow}>
                    {highlightedProducts.map((item, index) => (
                      <View
                        key={`product-highlight-dot-${item.id}`}
                        style={[
                          styles.highlightDot,
                          index === activeProductHighlightIndex && styles.highlightDotActive,
                        ]}
                      />
                    ))}
                  </View>
                ) : null}
              </>
            ) : null}

            {brands.length > 0 ? (
              <>
                <SectionTitle
                  title={'\u0628\u0631\u0627\u0646\u062f\u0627\u062a\u0646\u0627'}
                  actionLabel={'\u0639\u0631\u0636 \u0627\u0644\u0643\u0644'}
                  onAction={() => router.push('/(tabs)/brands')}
                />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.brandsRow}
                >
                  {brands.map((brand) => (
                    <BrandMiniCard
                      key={brand.id}
                      brand={brand}
                      onPress={() => router.push(`/(tabs)/products?brandId=${brand.id}`)}
                    />
                  ))}
                </ScrollView>
              </>
            ) : null}

            {tags.length > 0 ? (
              <>
                <SectionTitle title={'\u0627\u0644\u0648\u0633\u0648\u0645'} />
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.tagsRow}
                >
                  {tags.map((tag) => (
                    <Pressable
                      key={tag.id}
                      style={({ pressed }) => [styles.tagPill, pressed && styles.buttonPressed]}
                      onPress={() => router.push(`/(tabs)/products?tagId=${tag.id}`)}
                    >
                      <Text style={styles.tagPillText} numberOfLines={1}>
                        {tag.tag_name_ar || tag.tag_name_en}
                      </Text>
                    </Pressable>
                  ))}
                </ScrollView>
              </>
            ) : null}

          </>
        )}
      </ScrollView>
    </View>
  );
}

function getOfferHref(offer: Offer) {
  return {
    pathname: '/(tabs)/products',
    params: { offerIds: offer.id },
  } as const;
}

function formatOfferValue(offer: Offer) {
  if (offer.offerType === 'percentage_discount' && offer.offerValue > 0) {
    return `\u062e\u0635\u0645 ${offer.offerValue.toLocaleString('ar-IQ')}%`;
  }

  return '\u0639\u0631\u0636 \u062e\u0627\u0635';
}

function OfferHeroCard({
  item,
  width,
  height,
  onPress,
}: {
  item: Offer;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const [heroImageFailed, setHeroImageFailed] = useState(false);
  const hasHeroArtwork = !!item.image && !heroImageFailed;
  const imageUri = hasHeroArtwork
    ? item.image
    : 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop';

  return (
    <Pressable
      style={[styles.highlightCard, { width, height }]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <Image
        source={{ uri: imageUri }}
        style={styles.highlightImage}
        resizeMode={hasHeroArtwork ? 'contain' : 'cover'}
        onError={() => {
          if (hasHeroArtwork) setHeroImageFailed(true);
        }}
      />
      {!hasHeroArtwork ? (
        <LinearGradient
          colors={['rgba(0,0,0,0)', 'rgba(34,22,25,0.92)']}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.highlightOverlay}
        >
          <View style={styles.highlightTextSurface}>
            <Text style={styles.highlightBrand}>{formatOfferValue(item)}</Text>
            <Text style={styles.highlightName} numberOfLines={2}>
              {item.name}
            </Text>
            {!!item.description && (
              <Text style={styles.highlightPrice} numberOfLines={2}>
                {item.description}
              </Text>
            )}
          </View>
        </LinearGradient>
      ) : null}
    </Pressable>
  );
}

function SectionTitle({
  title,
  actionLabel,
  onAction,
}: {
  title: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.sectionHeader}>
      {actionLabel && onAction ? (
        <Pressable style={styles.sectionAction} onPress={onAction}>
          <Feather name="chevron-left" size={16} color={beautyTheme.colors.accentDark} />
          <Text style={styles.sectionActionText}>{actionLabel}</Text>
        </Pressable>
      ) : null}
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function BrandMiniCard({ brand, onPress }: { brand: Brand; onPress: () => void }) {
  const name = brand.brand_name_ar || brand.brand_name_en || brand.id;
  const iconUrl = getBrandIconUrl(brand);

  return (
    <Pressable style={({ pressed }) => [styles.brandMiniCard, pressed && styles.buttonPressed]} onPress={onPress}>
      <View style={styles.brandMiniLogoSurface}>
        {iconUrl ? (
          <Image source={{ uri: iconUrl }} style={styles.brandMiniLogo} resizeMode="contain" />
        ) : (
          <Text style={styles.brandMiniFallback} numberOfLines={2} adjustsFontSizeToFit>
            {name}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

function getBrandIconUrl(brand: Brand) {
  if (!brand.icon) return '';
  const root = process.env.EXPO_PUBLIC_ROOT_DIR || 'angeapi';
  return `https://images.angebeauty.net/${root}/cdn/images/${brand.id}/${brand.icon}?v=${brand.aggregate_version || 1}`;
}

function getProductTvDisplayImageUrl(productId: string) {
  const root = process.env.EXPO_PUBLIC_ROOT_DIR || 'angeapi';
  return `https://images.angebeauty.net/${root}/cdn/images/${productId}/media/tv_display_1.webp`;
}

function HighlightedProductHeroCard({
  item,
  width,
  height,
  onPress,
}: {
  item: Product;
  width: number;
  height: number;
  onPress: () => void;
}) {
  const [useProductImage, setUseProductImage] = useState(false);
  const productImage = item.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop';

  return (
    <Pressable
      style={({ pressed }) => [
        styles.highlightedProductHeroCard,
        { width, height },
        pressed && styles.buttonPressed,
      ]}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={item.name}
    >
      <Image
        source={{ uri: useProductImage ? productImage : getProductTvDisplayImageUrl(item.id) }}
        style={styles.highlightedProductHeroImage}
        resizeMode="contain"
        onError={() => {
          if (!useProductImage) setUseProductImage(true);
        }}
      />
      {useProductImage ? (
        <LinearGradient
          colors={['rgba(255,255,255,0)', 'rgba(34,22,25,0.9)']}
          start={{ x: 0.5, y: 0.35 }}
          end={{ x: 0.5, y: 1 }}
          style={styles.highlightedProductHeroOverlay}
        >
          <Text style={styles.highlightName} numberOfLines={2}>
            {item.name}
          </Text>
          <ProductPrice product={item} priceStyle={styles.highlightPrice} />
        </LinearGradient>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: beautyTheme.colors.page,
  },
  scroll: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingBottom: 170,
  },
  centerBox: {
    minHeight: 260,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  centerText: {
    fontSize: 15,
    color: beautyTheme.colors.textMuted,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: beautyTheme.colors.accentDark,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
    width: '100%',
    minHeight: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    marginLeft: 'auto',
    flexShrink: 1,
    textAlign: 'right',
    color: beautyTheme.colors.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'Tajawal-Bold',
  },
  sectionAction: {
    minHeight: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  sectionActionText: {
    color: beautyTheme.colors.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  highlightsRow: {
    gap: 12,
    paddingBottom: 6,
  },
  highlightsWrap: {
    position: 'relative',
  },
  highlightCard: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EADDE0',
    backgroundColor: '#FFF8FA',
  },
  highlightImage: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF8FA',
  },
  highlightOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  highlightTextSurface: {
    backgroundColor: 'rgba(20, 12, 14, 0.48)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  highlightBrand: {
    color: '#FCEFF3',
    fontSize: 12,
    marginBottom: 3,
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  highlightName: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 24,
    fontWeight: '700',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  highlightPrice: {
    marginTop: 4,
    color: '#FFDDE5',
    fontSize: 15,
    fontWeight: '700',
    textAlign: 'right',
    textShadowColor: 'rgba(0,0,0,0.45)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  highlightDotsRow: {
    marginTop: 8,
    marginBottom: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 7,
  },
  highlightDot: {
    width: 7,
    height: 7,
    borderRadius: 999,
    backgroundColor: 'rgba(126, 74, 83, 0.28)',
  },
  highlightDotActive: {
    width: 20,
    backgroundColor: beautyTheme.colors.accentDark,
  },
  discountOffersBanner: {
    width: '100%',
    aspectRatio: 16 / 9,
    marginTop: 2,
    marginBottom: 2,
  },
  discountOffersImage: {
    width: '100%',
    height: '100%',
  },
  highlightedProductsHeroRow: {
    gap: 12,
    paddingBottom: 6,
  },
  highlightedProductHeroCard: {
    overflow: 'hidden',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EADDE0',
    backgroundColor: '#FFFFFF',
  },
  highlightedProductHeroImage: {
    width: '100%',
    height: '100%',
  },
  highlightedProductHeroOverlay: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'flex-end',
    paddingHorizontal: 18,
    paddingTop: 46,
    paddingBottom: 16,
  },
  carouselArrow: {
    position: 'absolute',
    top: '50%',
    marginTop: -24,
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.9)',
    borderWidth: 1,
    borderColor: '#EADDE0',
  },
  carouselArrowLeft: {
    left: 10,
  },
  carouselArrowRight: {
    right: 10,
  },
  brandsRow: {
    gap: 12,
    paddingBottom: 6,
  },
  tagsRow: {
    gap: 8,
    paddingBottom: 6,
  },
  tagPill: {
    minHeight: 40,
    maxWidth: 190,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#EADDE0',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  tagPillText: {
    color: beautyTheme.colors.text,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
  brandMiniCard: {
    width: 92,
    alignItems: 'center',
  },
  brandMiniLogoSurface: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 1,
    borderColor: '#EADDE0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    overflow: 'hidden',
  },
  brandMiniLogo: {
    width: '100%',
    height: '100%',
  },
  brandMiniFallback: {
    color: beautyTheme.colors.text,
    fontSize: 16,
    fontWeight: '700',
    textAlign: 'center',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});
