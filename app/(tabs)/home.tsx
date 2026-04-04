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
import { beautyTheme } from '@/constants/uiTheme';
import { fetchProducts } from '@/services/api';
import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';
import { getDisplayBrand } from '@/utils/brand';

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
  const highlightHeight = highlightWidth * (isWeb && width >= 1024 ? 0.46 : 0.7);
  const highlightSideInset = Math.max((usableWidth - highlightWidth) / 2, 0);
  const highlightStep = highlightWidth + 12;
  const highlightStartOffset = highlightSideInset;
  const highlightScrollRef = useRef<ScrollView>(null);
  const [activeHighlightIndex, setActiveHighlightIndex] = useState(0);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['home-products'],
    queryFn: () => fetchProducts({ page: 1, limit: 30 }),
  });
  const {
    data: highlightedData,
    isLoading: isLoadingHighlights,
    error: highlightsError,
    refetch: refetchHighlights,
  } = useQuery({
    queryKey: ['home-highlighted-products'],
    queryFn: () => fetchProducts({ page: 1, limit: 10, highlighted: 1 }),
  });

  const products = useMemo(() => data?.products || [], [data?.products]);
  const highlightProducts = useMemo(
    () => (highlightedData?.products || []).slice(0, 6),
    [highlightedData?.products]
  );
  const mostSellingProducts = useMemo(() => products.slice(6, 14), [products]);
  const saleProducts = useMemo(() => products.slice(14, 20), [products]);
  const isHomeLoading = isLoading || isLoadingHighlights;
  const hasHomeError = !!error || !!highlightsError;
  const showHighlights = !highlightsError && highlightProducts.length > 0;

  useEffect(() => {
    setActiveHighlightIndex(0);
    if (showHighlights) {
      highlightScrollRef.current?.scrollTo({ x: highlightStartOffset, animated: false });
    }
  }, [showHighlights, highlightProducts.length, highlightStartOffset]);

  useEffect(() => {
    if (!showHighlights || highlightProducts.length < 2) {
      return;
    }

    const timer = setInterval(() => {
      setActiveHighlightIndex((prev) => {
        const next = (prev + 1) % highlightProducts.length;
        highlightScrollRef.current?.scrollTo({ x: highlightStartOffset + next * highlightStep, animated: true });
        return next;
      });
    }, 3500);

    return () => clearInterval(timer);
  }, [showHighlights, highlightProducts.length, highlightStep, highlightStartOffset]);

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showBackButton={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          {
            paddingHorizontal: horizontalPadding,
            maxWidth: maxContentWidth,
            width: '100%',
            alignSelf: 'center',
          },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isLoading || isLoadingHighlights}
            onRefresh={() => {
              refetch();
              refetchHighlights();
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
                refetch();
                refetchHighlights();
              }}
            >
              <Text style={styles.retryButtonText}>{'\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629'}</Text>
            </Pressable>
          </View>
        ) : (
          <>
            {showHighlights ? (
              <>
                <SectionTitle title={'\u0645\u0645\u064a\u0632\u0627\u062a \u0627\u0644\u064a\u0648\u0645'} />
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
                      const boundedIndex = Math.min(Math.max(index, 0), highlightProducts.length - 1);
                      setActiveHighlightIndex(boundedIndex);
                    }}
                  >
                    {highlightProducts.map((item) => (
                      <Pressable
                        key={item.id}
                        style={[styles.highlightCard, { width: highlightWidth, height: highlightHeight }]}
                        onPress={() => router.push(`/product/${item.id}`)}
                      >
                        <Image
                          source={{ uri: item.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=800&h=800&fit=crop' }}
                          style={styles.highlightImage}
                          resizeMode="contain"
                        />
                        <LinearGradient
                          colors={['rgba(0,0,0,0)', 'rgba(34,22,25,0.92)']}
                          start={{ x: 0.5, y: 0 }}
                          end={{ x: 0.5, y: 1 }}
                          style={styles.highlightOverlay}
                        >
                          <View style={styles.highlightTextSurface}>
                            <Text style={styles.highlightBrand}>{getDisplayBrand(item.brand)}</Text>
                            <Text style={styles.highlightName} numberOfLines={2}>
                              {item.name}
                            </Text>
                            <Text style={styles.highlightPrice}>{formatPrice(item.price)}</Text>
                          </View>
                        </LinearGradient>
                      </Pressable>
                    ))}
                  </ScrollView>
                  {isWeb && highlightProducts.length > 1 ? (
                    <>
                      <Pressable
                        style={({ pressed }) => [styles.carouselArrow, styles.carouselArrowLeft, pressed && styles.buttonPressed]}
                        onPress={() => {
                          const prev = (activeHighlightIndex - 1 + highlightProducts.length) % highlightProducts.length;
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
                          const next = (activeHighlightIndex + 1) % highlightProducts.length;
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
                  {highlightProducts.map((item, index) => (
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

            <SectionTitle title={'\u0627\u0644\u0623\u0643\u062b\u0631 \u0645\u0628\u064a\u0639\u0627\u064b'} />
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.mostSellingRow}
            >
              {mostSellingProducts.map((item) => (
                <ProductMiniCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/product/${item.id}`)}
                />
              ))}
            </ScrollView>

            <SectionTitle title={'\u0627\u0644\u0639\u0631\u0648\u0636 \u0648\u0627\u0644\u062a\u062e\u0641\u064a\u0636\u0627\u062a'} />
            <View style={styles.promoColumn}>
              <PromoCard
                title={'\u0639\u0631\u0636 \u0627\u0644\u0623\u0633\u0628\u0648\u0639'}
                subtitle={'\u062e\u0635\u0645 \u0645\u062d\u062f\u0648\u062f \u0639\u0644\u0649 \u0645\u062c\u0645\u0648\u0639\u0629 \u0645\u0646\u062a\u062e\u0628\u0629'}
                cta={'\u062a\u0633\u0648\u0642 \u0627\u0644\u0622\u0646'}
                onPress={() => router.push('/(tabs)/products')}
              />
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.salesRow}
              >
                {saleProducts.map((item) => (
                  <Pressable key={item.id} style={styles.saleCard} onPress={() => router.push(`/product/${item.id}`)}>
                    <Image
                      source={{ uri: item.image || 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=500&h=500&fit=crop' }}
                      style={styles.saleImage}
                      resizeMode="cover"
                    />
                    <Text style={styles.saleName} numberOfLines={2}>
                      {item.name}
                    </Text>
                    <Text style={styles.salePrice}>{formatPrice(item.price)}</Text>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
    </View>
  );
}

function ProductMiniCard({ item, onPress }: { item: Product; onPress: () => void }) {
  const brand = getDisplayBrand(item.brand);

  return (
    <Pressable style={styles.miniCard} onPress={onPress}>
      <Image
        source={{ uri: item.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop' }}
        style={styles.miniImage}
        resizeMode="cover"
      />
      {!!brand && <Text style={styles.miniBrand}>{brand}</Text>}
      <Text style={styles.miniName} numberOfLines={2}>
        {item.name}
      </Text>
      <Text style={styles.miniPrice}>{formatPrice(item.price)}</Text>
    </Pressable>
  );
}

function PromoCard({
  title,
  subtitle,
  cta,
  onPress,
}: {
  title: string;
  subtitle: string;
  cta: string;
  onPress: () => void;
}) {
  return (
    <LinearGradient colors={['#E6A9B4', '#C9818E']} style={styles.promoCard}>
      <Text style={styles.promoTitle}>{title}</Text>
      <Text style={styles.promoSubtitle}>{subtitle}</Text>
      <Pressable style={styles.promoButton} onPress={onPress}>
        <Text style={styles.promoButtonText}>{cta}</Text>
        <Feather name="arrow-left" size={16} color={beautyTheme.colors.accentDark} />
      </Pressable>
    </LinearGradient>
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
  },
  sectionTitle: {
    textAlign: 'right',
    color: beautyTheme.colors.text,
    fontSize: 22,
    lineHeight: 30,
    fontWeight: '700',
    fontFamily: 'serif',
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
  mostSellingRow: {
    gap: 12,
    paddingBottom: 6,
  },
  miniCard: {
    width: 148,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADDE0',
    padding: 10,
  },
  miniImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 12,
    marginBottom: 8,
    backgroundColor: '#F8F0F3',
  },
  miniBrand: {
    fontSize: 11,
    color: beautyTheme.colors.textMuted,
    textAlign: 'right',
    marginBottom: 3,
  },
  miniName: {
    fontSize: 13,
    lineHeight: 18,
    color: beautyTheme.colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  miniPrice: {
    marginTop: 6,
    fontSize: 15,
    color: beautyTheme.colors.accentDark,
    fontWeight: '700',
    textAlign: 'right',
  },
  promoColumn: {
    gap: 12,
  },
  promoCard: {
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  promoTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'right',
    fontFamily: 'serif',
  },
  promoSubtitle: {
    marginTop: 5,
    color: '#FFF3F6',
    fontSize: 13,
    textAlign: 'right',
  },
  promoButton: {
    marginTop: 12,
    alignSelf: 'flex-end',
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  promoButtonText: {
    color: beautyTheme.colors.accentDark,
    fontSize: 13,
    fontWeight: '700',
  },
  salesRow: {
    gap: 10,
    paddingBottom: 8,
  },
  saleCard: {
    width: 130,
    borderRadius: 14,
    backgroundColor: '#FFFDFD',
    borderWidth: 1,
    borderColor: '#EADDE0',
    padding: 8,
  },
  saleImage: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 10,
    marginBottom: 6,
    backgroundColor: '#F8F0F3',
  },
  saleName: {
    fontSize: 12,
    lineHeight: 16,
    color: beautyTheme.colors.text,
    fontWeight: '600',
    textAlign: 'right',
  },
  salePrice: {
    marginTop: 4,
    fontSize: 13,
    color: beautyTheme.colors.accentDark,
    fontWeight: '700',
    textAlign: 'right',
  },
  buttonPressed: {
    opacity: 0.78,
  },
});


