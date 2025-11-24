import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useMemo, useState, useCallback, useRef } from 'react';
import {
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

const logoImage = require('@/assets/images/icon.png');

const palette = {
  background: '#E7ECE6',
  headerCard: '#111F1A',
  headerAccent: '#1C2A24',
  accent: '#3F6B59',
  accentSoft: '#AFC0B4',
  inputBackground: '#F4F1E6',
  stroke: '#D4D9CE',
  textPrimary: '#0C140F',
  textMuted: '#5D685F',
  badge: '#D9A441',
  danger: '#B9442B',
};

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ brandId?: string }>();
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>(params.brandId || '');
  const [barcodeFilter, setBarcodeFilter] = useState('');
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
      setSelectedBrand(params.brandId);
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
    queryKey: ['products', searchQuery, selectedCategory, selectedBrand, barcodeFilter],
    queryFn: ({ pageParam = 1 }) => fetchProducts({
      page: pageParam,
      limit: 20,
      keyword: searchQuery || undefined,
      category: selectedCategory || undefined,
      brand: selectedBrand || undefined,
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

  const handleSupportPress = useCallback(() => {
    console.log('[Home] Support chat pressed');
  }, []);

  const handleQuickSearchPress = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
    console.log('[Home] Quick search icon pressed');
  }, []);

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
            <Text style={styles.brandText}>{item.brand}</Text>
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
              addToBasket(item.id, 1);
            }}
          >
            <Feather name="shopping-bag" color="#FFFFFF" size={16} />
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
      <View style={styles.headerWrapper}>
        <View style={[styles.headerCard, { paddingTop: insets.top + 18 }]}>
          <View style={styles.headerTopRow}>
            <View style={styles.headerLeftCluster}>
              <Pressable
                testID="home-chat-button"
                style={({ pressed }) => [styles.chatBubbleButton, pressed && styles.buttonPressed]}
                onPress={handleSupportPress}
              >
                <Feather name="message-circle" color={palette.accentSoft} size={20} />
                <View style={styles.whatsappBadge}>
                  <Image
                    source={{ uri: 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png' }}
                    style={styles.whatsappIcon}
                    resizeMode="contain"
                  />
                </View>
              </Pressable>
              <Pressable
                testID="home-quick-search-button"
                style={({ pressed }) => [styles.headerIconButton, pressed && styles.buttonPressed]}
                onPress={handleQuickSearchPress}
              >
                <Feather name="search" color={palette.accentSoft} size={20} />
              </Pressable>
            </View>
            <View style={styles.headerLogoWrap}>
              <Image source={logoImage} style={styles.headerLogoImage} resizeMode="contain" />
            </View>
            <View style={styles.headerRightSpacer} />
          </View>

          <View style={styles.searchFieldRow}>
            <Feather name="search" size={18} color={palette.textMuted} style={styles.searchFieldIcon} />
            <TextInput
              testID="home-search-input"
              style={styles.searchFieldInput}
              placeholder="ابحث عن المنتجات..."
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
              {(selectedCategory || selectedBrand || barcodeFilter) && (
                <View style={styles.filterBadge} />
              )}
            </Pressable>
          </View>

          {(selectedCategory || selectedBrand || barcodeFilter) && (
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
              {selectedBrand && brands.length > 0 && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>
                    {brands.find(b => b && b.id === selectedBrand)?.brand_name_ar || 'العلامة'}
                  </Text>
                  <Pressable onPress={() => setSelectedBrand('')}>
                    <Feather name="x" color="#666" size={14} />
                  </Pressable>
                </View>
              )}
              {barcodeFilter && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>باركود: {barcodeFilter}</Text>
                  <Pressable onPress={() => setBarcodeFilter('')}>
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
            data={products}
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
                  {brandsByLetter[selectedLetter]?.map((brand) => (
                    <Pressable
                      key={brand.id}
                      style={[
                        styles.brandItem,
                        selectedBrand === brand.id && styles.brandItemSelected,
                      ]}
                      onPress={() => setSelectedBrand(brand.id)}
                    >
                      <Text style={[
                        styles.brandItemName,
                        selectedBrand === brand.id && styles.brandItemNameSelected,
                      ]}>{brand.brand_name_ar || brand.brand_name_en}</Text>
                    </Pressable>
                  ))}
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
                  setSelectedBrand('');
                  setBarcodeFilter('');
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
    backgroundColor: '#FFFFFF',
    paddingBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  headerCard: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingBottom: 28,
  },
  headerTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 22,
  },
  headerLeftCluster: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  chatBubbleButton: {
    width: 56,
    height: 40,
    borderRadius: 20,
    backgroundColor: palette.headerAccent,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: palette.accent,
    position: 'relative' as const,
  },
  whatsappBadge: {
    position: 'absolute' as const,
    bottom: -2,
    right: -2,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111',
  },
  whatsappIcon: {
    width: 12,
    height: 12,
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
    width: 100,
    height: 60,
  },
  headerRightSpacer: {
    width: 52,
  },
  searchFieldRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: palette.inputBackground,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: palette.stroke,
    paddingLeft: 16,
    paddingRight: 8,
    height: 54,
  },
  searchFieldIcon: {
    marginRight: 8,
  },
  searchFieldInput: {
    flex: 1,
    fontSize: 15,
    color: palette.textPrimary,
  },
  searchFilterButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: palette.accent,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
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
    marginTop: 12,
    marginBottom: 4,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#EFF1E8',
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
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 5,
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
    color: '#999',
    fontWeight: '600' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  productName: {
    fontSize: 14,
    fontWeight: '600' as const,
    color: '#1A1A1A',
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
    fontSize: 16,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginBottom: 8,
  },
  addToBasketButtonHome: {
    position: 'absolute' as const,
    bottom: 8,
    right: 8,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1A1A1A',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 4,
    elevation: 3,
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
});
