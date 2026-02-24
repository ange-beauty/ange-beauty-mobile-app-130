import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
  Alert,
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { fetchProducts, fetchBrands, fetchCategories } from '@/services/api';
import { Product } from '@/types/product';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useBasket } from '@/contexts/BasketContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';
import { getAvailableQuantityForSellingPoint } from '@/utils/availability';
import { getDisplayBrand } from '@/utils/brand';
import { formatPrice, toArabicNumerals } from '@/utils/formatPrice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getNumColumns = () => {
  if (Platform.OS === 'web') {
    if (SCREEN_WIDTH >= 1200) return 5;
    if (SCREEN_WIDTH >= 900) return 4;
    if (SCREEN_WIDTH >= 600) return 3;
  }
  return 2;
};

const NUM_COLUMNS = getNumColumns();

const palette = {
  background: beautyTheme.colors.page,
  headerCard: beautyTheme.colors.card,
  headerAccent: beautyTheme.colors.accentDark,
  accent: beautyTheme.colors.accent,
  accentDark: beautyTheme.colors.accentDark,
  accentSoft: '#E5CFD4',
  inputBackground: '#FBF6F7',
  stroke: beautyTheme.colors.border,
  textPrimary: beautyTheme.colors.text,
  textMuted: beautyTheme.colors.textMuted,
  badge: '#D9A441',
  danger: '#B9442B',
};

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ brandId?: string }>();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
  const { selectedSellingPoint } = useSellingPoint();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrands, setSelectedBrands] = useState<string[]>(params.brandId ? [params.brandId] : []);
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [showOnlySelectedSellingPoint, setShowOnlySelectedSellingPoint] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [numColumns, setNumColumns] = useState(NUM_COLUMNS);
  const [key, setKey] = useState('grid-' + NUM_COLUMNS);
  const listRef = useRef<FlatList>(null);

  const { data: brandsData } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const brands = useMemo(() => {
    if (!brandsData) return [];
    return Array.isArray(brandsData) ? brandsData : [];
  }, [brandsData]);
  
  const categories = useMemo(() => {
    if (!categoriesData) return [];
    return Array.isArray(categoriesData) ? categoriesData : [];
  }, [categoriesData]);

  React.useEffect(() => {
    if (params.brandId) {
      console.log('[Home] Setting brandId from params:', params.brandId);
      setSelectedBrands([params.brandId]);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [params.brandId]);

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0-9'.split('');
  
  const brandsByLetter = useMemo(() => {
    const grouped: Record<string, typeof brands> = {};
    brands.forEach(brand => {
      if (!brand) return;
      const nameToUse = brand.brand_name_en || brand.brand_name_ar;
      if (!nameToUse) return;
      const firstChar = nameToUse[0].toUpperCase();
      const letter = /[A-Z]/.test(firstChar) ? firstChar : /[0-9]/.test(firstChar) ? '0-9' : 'A';
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(brand);
    });
    return grouped;
  }, [brands]);

  const availableLetters = useMemo(() => {
    return alphabet.filter(letter => brandsByLetter[letter] && brandsByLetter[letter].length > 0);
  }, [brandsByLetter, alphabet]);

  const {
    data,
    isLoading,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['products', searchQuery, selectedCategory, selectedBrands, barcodeFilter],
    queryFn: ({ pageParam = 1 }) => fetchProducts({
      page: pageParam,
      limit: 20,
      keyword: searchQuery || undefined,
      category: selectedCategory || undefined,
      brand: selectedBrands.length > 0 ? selectedBrands.join(',') : undefined,
      barcode: barcodeFilter || undefined,
    }),
    getNextPageParam: (lastPage, allPages) => {
      if (!lastPage.hasMore) return undefined;
      return allPages.length + 1;
    },
    initialPageParam: 1,
  });

  const products = useMemo(() => {
    if (!data || !data.pages) return [];
    try {
      return data.pages.flatMap(page => page.products).filter((p: Product) => p && p.id);
    } catch (error) {
      console.error('[Home] Error flattening products:', error);
      return [];
    }
  }, [data]);

  const displayedProducts = useMemo(() => {
    if (!showOnlySelectedSellingPoint || !selectedSellingPoint?.id) {
      return products;
    }

    return products.filter((product) => {
      const availableQty = getAvailableQuantityForSellingPoint(product, selectedSellingPoint.id);
      return availableQty !== null && availableQty > 0;
    });
  }, [products, showOnlySelectedSellingPoint, selectedSellingPoint?.id]);

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFilterOpen = useCallback(() => {
    console.log('[Home] Filter modal requested');
    setShowFilters(true);
  }, [setShowFilters]);

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
        setKey('grid-' + newNumColumns);
      }
    });

    return () => subscription?.remove();
  }, [numColumns]);

  const cardWidth = useMemo(() => {
    const screenWidth = Dimensions.get('window').width;
    return (screenWidth - 16 * (numColumns + 1)) / numColumns;
  }, [numColumns]);

  const renderProduct = ({ item }: { item: Product }) => {
    const scaleAnim = new Animated.Value(1);

    const handlePressIn = () => {
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        useNativeDriver: true,
      }).start();
    };

    const handlePressOut = () => {
      Animated.spring(scaleAnim, {
        toValue: 1,
        useNativeDriver: true,
      }).start();
    };

    const isItemFavorite = isFavorite(item.id);
    const itemQuantity = getItemQuantity(item.id);
    const selectedPointAvailable = getAvailableQuantityForSellingPoint(item, selectedSellingPoint?.id);
    const displayBrand = getDisplayBrand(item.brand);

    return (
      <View style={{ width: cardWidth, marginBottom: 16 }}>
        <Pressable
          onPress={() => router.push(`/product/${item.id}`)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.productCard, { transform: [{ scale: scaleAnim }] }]}>
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
              <Feather
                name="heart"
                color={isItemFavorite ? palette.danger : palette.textMuted}
                size={18}
              />
            </Pressable>
          </View>
          <View style={styles.productInfo}>
            {!!displayBrand && <Text style={styles.brandText}>{displayBrand}</Text>}
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <Text style={styles.price}>{formatPrice(item.price)}</Text>
            
          </View>
          <Pressable
            style={({ pressed }) => [
              styles.addToBasketButtonHome,
              pressed && styles.buttonPressed,
            ]}
            onPress={(e) => {
              e.stopPropagation();
              if (!selectedSellingPoint?.id) {
                Alert.alert(
                  '\u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631',
                  '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0627\u0644\u0645\u062a\u062c\u0631 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629',
                  [{ text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') }, { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' }]
                );
                return;
              }
              if (selectedPointAvailable !== null && itemQuantity >= selectedPointAvailable) {
                return;
              }
              addToBasket(item.id, 1);
            }}
          >
            <Feather name="shopping-bag" color={palette.accentDark} size={16} />
            {itemQuantity > 0 && (
              <View style={styles.basketCountBadge}>
                <Text style={styles.basketCountText}>{toArabicNumerals(itemQuantity)}</Text>
              </View>
            )}
          </Pressable>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <View style={styles.headerWrapper}>
        <View style={[styles.headerCard, { paddingTop: 0 }]}>
          <BrandedHeader topInset={insets.top} showBackButton={false} showSearch={false} />

          <View style={styles.searchFieldRow}>
            <Feather name="search" size={18} color={palette.accentDark} style={styles.searchFieldIcon} />
            <TextInput
              testID="home-search-input"
              style={styles.searchFieldInput}
              placeholder={'\u0627\u0628\u062d\u062b \u0639\u0646 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a...'}
              placeholderTextColor={palette.textMuted}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
            <Pressable
              testID="home-filter-button"
              style={({ pressed }) => [styles.searchFilterButton, pressed && styles.buttonPressed]}
              onPress={handleFilterOpen}
            >
              <Feather name="sliders" color="#FFFFFF" size={18} />
              {(selectedSellingPoint || selectedCategory || selectedBrands.length > 0 || barcodeFilter || showOnlySelectedSellingPoint) && (
                <View style={styles.filterBadge} />
              )}
            </Pressable>
          </View>

          {(selectedSellingPoint || selectedCategory || selectedBrands.length > 0 || barcodeFilter || showOnlySelectedSellingPoint) && (
            <View style={styles.activeFiltersContainer}>
              {selectedCategory && categories.length > 0 && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {categories.find(c => c && c.id === selectedCategory)?.name_ar || 'الفئة'}
                  </Text>
                  <Pressable onPress={() => setSelectedCategory('')}>
                    <Feather name="x" color="#666" size={14} />
                  </Pressable>
                </View>
              )}
              {selectedBrands.map(brandId => {
                const brand = brands.find(b => b && b.id === brandId);
                if (!brand) return null;
                return (
                  <View key={brandId} style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {brand.brand_name_ar || 'العلامة'}
                    </Text>
                    <Pressable onPress={() => setSelectedBrands(prev => prev.filter(id => id !== brandId))}>
                      <Feather name="x" color="#666" size={14} />
                    </Pressable>
                  </View>
                );
              })}
              {barcodeFilter && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>باركود: {barcodeFilter}</Text>
                  <Pressable onPress={() => setBarcodeFilter('')}>
                    <Feather name="x" color="#666" size={14} />
                  </Pressable>
                </View>
              )}
              {showOnlySelectedSellingPoint && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {'\u0627\u0644\u0645\u062a\u0627\u062d \u0641\u0642\u0637 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639'}
                  </Text>
                  <Pressable onPress={() => setShowOnlySelectedSellingPoint(false)}>
                    <Feather name="x" color="#666" size={14} />
                  </Pressable>
                </View>
              )}
            </View>
          )}


        </View>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>جاري تحميل المنتجات...</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>فشل تحميل المنتجات</Text>
          <Text style={styles.errorText}>{(error as Error).message}</Text>
        </View>
      ) : (
        <>
          <FlatList
            ref={listRef}
            key={key}
            data={displayedProducts}
            renderItem={renderProduct}
            keyExtractor={(item) => item.id}
            numColumns={numColumns}
            contentContainerStyle={styles.productsContainer}
            columnWrapperStyle={styles.productRow}
            showsVerticalScrollIndicator={false}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) {
                fetchNextPage();
              }
            }}
            onEndReachedThreshold={0.5}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor="#1A1A1A"
                colors={['#1A1A1A']}
              />
            }
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>لم يتم العثور على منتجات</Text>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color="#1A1A1A" />
                  <Text style={styles.footerLoadingText}>جاري تحميل المزيد...</Text>
                </View>
              ) : null
            }
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


      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowFilters(false)}
        >
          <Pressable style={styles.modalContent} onPress={(e) => e.stopPropagation()}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تصفية المنتجات</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Feather name="x" color="#1A1A1A" size={24} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody}>
              {categories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>الفئة</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.filterOptions}>
                      <Pressable
                        style={[
                          styles.filterOption,
                          !selectedCategory && styles.filterOptionActive,
                        ]}
                        onPress={() => setSelectedCategory('')}
                      >
                        <Text
                          style={[
                            styles.filterOptionText,
                            !selectedCategory && styles.filterOptionTextActive,
                          ]}
                        >
                          الكل
                        </Text>
                      </Pressable>
                      {categories.map((category) => category && category.id ? (
                        <Pressable
                          key={category.id}
                          style={[
                            styles.filterOption,
                            selectedCategory === category.id && styles.filterOptionActive,
                          ]}
                          onPress={() => setSelectedCategory(category.id)}
                        >
                          <Text
                            style={[
                              styles.filterOptionText,
                              selectedCategory === category.id && styles.filterOptionTextActive,
                            ]}
                          >
                            {category.name_ar || 'فئة'}
                          </Text>
                        </Pressable>
                      ) : null)}
                    </View>
                  </ScrollView>
                </View>
              )}


              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{'\u062a\u0648\u0641\u0631 \u0627\u0644\u0645\u0646\u062a\u062c'}</Text>
                <Pressable
                  style={[
                    styles.filterOption,
                    showOnlySelectedSellingPoint && styles.filterOptionActive,
                    !selectedSellingPoint && styles.filterOptionDisabled,
                  ]}
                  onPress={() => {
                    if (!selectedSellingPoint) return;
                    setShowOnlySelectedSellingPoint((prev) => !prev);
                  }}
                >
                  <Text
                    style={[
                      styles.filterOptionText,
                      showOnlySelectedSellingPoint && styles.filterOptionTextActive,
                      !selectedSellingPoint && styles.filterOptionTextDisabled,
                    ]}
                  >
                    {'\u0639\u0631\u0636 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0627\u0644\u0645\u062a\u0627\u062d\u0629 \u0641\u0642\u0637 \u0641\u064a \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0627\u0644\u0645\u062d\u062f\u062f\u0629'}
                  </Text>
                </Pressable>
                {!selectedSellingPoint && (
                  <Text style={styles.filterHintText}>
                    {'\u0627\u062e\u062a\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0623\u0648\u0644\u0627\u064b \u0644\u062a\u0641\u0639\u064a\u0644 \u0647\u0630\u0627 \u0627\u0644\u062e\u064a\u0627\u0631'}
                  </Text>
                )}
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>الباركود</Text>
                <TextInput
                  style={styles.barcodeInput}
                  placeholder="أدخل الباركود..."
                  placeholderTextColor="#999"
                  value={barcodeFilter}
                  onChangeText={setBarcodeFilter}
                  keyboardType="default"
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>العلامة التجارية</Text>
                <View style={styles.alphabetNavigation}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    <View style={styles.alphabetRow}>
                      {alphabet.map((letter) => {
                        const isAvailable = availableLetters.includes(letter);
                        const isSelected = selectedLetter === letter;
                        return (
                          <Pressable
                            key={letter}
                            style={[
                              styles.letterButton,
                              isSelected && styles.letterButtonActive,
                              !isAvailable && styles.letterButtonDisabled,
                            ]}
                            onPress={() => isAvailable && setSelectedLetter(letter)}
                            disabled={!isAvailable}
                          >
                            <Text
                              style={[
                                styles.letterText,
                                isSelected && styles.letterTextActive,
                                !isAvailable && styles.letterTextDisabled,
                              ]}
                            >
                              {letter}
                            </Text>
                          </Pressable>
                        );
                      })}
                    </View>
                  </ScrollView>
                </View>
                <View style={styles.brandsGrid}>
                  {brandsByLetter[selectedLetter]?.map((brand) => {
                    const isSelected = selectedBrands.includes(brand.id);
                    return (
                      <Pressable
                        key={brand.id}
                        style={[
                          styles.brandItem,
                          isSelected && styles.brandItemSelected,
                        ]}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedBrands(prev => prev.filter(id => id !== brand.id));
                          } else {
                            setSelectedBrands(prev => [...prev, brand.id]);
                          }
                        }}
                      >
                        <Text style={[
                          styles.brandItemName,
                          isSelected && styles.brandItemNameSelected,
                        ]}>{brand.brand_name_ar || brand.brand_name_en}</Text>
                      </Pressable>
                    );
                  })}
                </View>
                {(!brandsByLetter[selectedLetter] || brandsByLetter[selectedLetter].length === 0) && (
                  <View style={styles.emptyBrandsContainer}>
                    <Text style={styles.emptyBrandsText}>لا توجد علامات تجارية تبدأ بـ {selectedLetter}</Text>
                  </View>
                )}
              </View>
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSelectedCategory('');
                  setSelectedBrands([]);
                  setBarcodeFilter('');
                  setShowOnlySelectedSellingPoint(false);
                }}
              >
                <Text style={styles.clearButtonText}>مسح الكل</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>تطبيق</Text>
              </Pressable>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: palette.background,
  },
  headerWrapper: {
    backgroundColor: 'transparent',
    paddingHorizontal: 0,
    paddingBottom: 8,
  },
  headerCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  headerLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatBubbleButton: {
    width: 52,
    height: 38,
    borderRadius: 19,
    backgroundColor: palette.headerAccent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.accent,
    position: 'relative' as const,
  },
  whatsappBadge: {
    position: 'absolute' as const,
    bottom: -3,
    left: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111',
  },
  whatsappIcon: {
    width: 10,
    height: 10,
  },
  headerIconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    borderColor: palette.accent,
    backgroundColor: palette.headerAccent,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLogoWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogoImage: {
    width: 84,
    height: 50,
  },
  headerRightSpacer: {
    width: 50,
  },
  brandNameText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: palette.textPrimary,
    marginTop: 2,
    letterSpacing: 0.8,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  },
  searchFieldRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    backgroundColor: palette.inputBackground,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: palette.stroke,
    paddingLeft: 8,
    paddingRight: 12,
    height: 54,
  },
  searchFieldIcon: {
    marginLeft: 8,
  },
  searchFieldInput: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    textAlign: 'right',
    writingDirection: 'rtl' as const,
  },
  searchFilterButton: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#C98B97',
    borderWidth: 1,
    borderColor: '#B37884',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: 6,
    right: 6,
    width: 9,
    height: 9,
    borderRadius: 4.5,
    backgroundColor: palette.badge,
  },

  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#F7F0F2',
    borderWidth: 1,
    borderColor: '#EADDE0',
    gap: 6,
  },
  activeFilterText: {
    fontSize: 13,
    color: palette.textPrimary,
    fontWeight: '500' as const,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  modalBody: {
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
  },
  filterOptions: {
    flexDirection: 'row',
    gap: 8,
  },
  filterOption: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  filterOptionActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  filterOptionText: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  filterOptionTextActive: {
    color: '#FFFFFF',
  },
  filterOptionDisabled: {
    opacity: 0.5,
  },
  filterOptionTextDisabled: {
    color: '#999',
  },
  filterHintText: {
    marginTop: 8,
    fontSize: 13,
    color: '#666',
  },
  barcodeInput: {
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 16,
    color: '#1A1A1A',
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
  },
  clearButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#666',
  },
  applyButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#FFFFFF',
  },
  alphabetNavigation: {
    backgroundColor: '#FAFAFA',
    borderRadius: 12,
    marginBottom: 12,
  },
  alphabetRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
  },
  letterButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  letterButtonActive: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  letterButtonDisabled: {
    backgroundColor: '#F8F8F8',
    borderColor: '#F0F0F0',
  },
  letterText: {
    fontSize: 13,
    fontWeight: '600' as const,
    color: '#1A1A1A',
  },
  letterTextActive: {
    color: '#FFFFFF',
  },
  letterTextDisabled: {
    color: '#CCCCCC',
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  brandItem: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F5F5F5',
  },
  brandItemSelected: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  brandItemName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#666',
  },
  brandItemNameSelected: {
    color: '#FFFFFF',
  },
  emptyBrandsContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  emptyBrandsText: {
    fontSize: 16,
    color: '#999',
  },
  productsContainer: {
    padding: 16,
  },
  productRow: {
    justifyContent: 'space-between',
  },
  productCard: {
    width: '100%',
    backgroundColor: '#FFFDFD',
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#EDE1E3',
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 5 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#FFFFFF',
    position: 'relative' as const,
  },
  favoriteButton: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 12,
    paddingRight: 52,
  },
  brandText: {
    fontSize: 11,
    color: palette.textMuted,
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 15,
    fontWeight: '600' as const,
    color: palette.textPrimary,
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
    fontSize: 15,
    fontWeight: '700' as const,
    color: palette.accentDark,
    marginBottom: 8,
  },
  addToBasketButtonHome: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9DDE0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  basketCountBadge: {
    position: 'absolute' as const,
    top: -4,
    right: -4,
    backgroundColor: '#FF3B30',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
  },
  basketCountText: {
    fontSize: 10,
    fontWeight: '700' as const,
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 60,
    gap: 12,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
    marginTop: 8,
  },
  footerLoading: {
    paddingVertical: 20,
    alignItems: 'center',
    gap: 8,
  },
  footerLoadingText: {
    fontSize: 14,
    color: '#666',
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
  sellingPointBanner: {
    marginTop: 10,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    backgroundColor: '#F7F8F3',
    borderWidth: 1,
    borderColor: '#E4E9DD',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sellingPointTextWrap: {
    flex: 1,
  },
  sellingPointLabel: {
    fontSize: 12,
    color: '#6B756B',
    marginBottom: 4,
  },
  sellingPointValue: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '600' as const,
    textAlign: 'right',
  },
  sellingPointsList: {
    maxHeight: 380,
  },
  sellingPointItem: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ECECEC',
    marginBottom: 8,
    backgroundColor: '#FFFFFF',
  },
  sellingPointItemActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#F7F7F7',
  },
  sellingPointItemTitle: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  sellingPointItemSub: {
    marginTop: 2,
    fontSize: 12,
    color: '#666',
  },
});



