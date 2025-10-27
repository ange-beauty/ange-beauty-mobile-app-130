import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { Search, Filter, X } from 'lucide-react-native';
import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Modal,
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

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;



export default function HomeScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedBrand, setSelectedBrand] = useState<string>('');
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [showBrandsModal, setShowBrandsModal] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('A');

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

    return (
      <View style={{ width: CARD_WIDTH, marginBottom: 16 }}>
        <Pressable
          onPress={() => router.push(`/product/${item.id}`)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.productCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.productImageContainer}>
            <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.brandText}>{item.brand}</Text>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.ratingContainer}>
              <Text style={styles.rating}>★ {item.rating}</Text>
              <Text style={styles.reviewCount}>({item.reviewCount})</Text>
            </View>
            <Text style={styles.price}>{typeof item.price === 'number' ? item.price.toFixed(2) : parseFloat(item.price as string).toFixed(2)} د.إ</Text>
          </View>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={[styles.header, { paddingTop: insets.top + 16 }]}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.greeting}>اكتشف</Text>
            <Text style={styles.title}>جمالك</Text>
          </View>
          <Image 
            source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rqerhironvgzmc9yhq77s' }}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </View>

        <View style={styles.searchRow}>
          <View style={styles.searchContainer}>
            <Search color="#999" size={20} style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="ابحث عن المنتجات..."
              placeholderTextColor="#999"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <Pressable
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Filter color="#1A1A1A" size={20} />
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
                  <X color="#666" size={14} />
                </Pressable>
              </View>
            )}
            {selectedBrand && brands.length > 0 && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>
                  {brands.find(b => b && b.id === selectedBrand)?.brand_name_ar || 'العلامة'}
                </Text>
                <Pressable onPress={() => setSelectedBrand('')}>
                  <X color="#666" size={14} />
                </Pressable>
              </View>
            )}
            {barcodeFilter && (
              <View style={styles.activeFilterChip}>
                <Text style={styles.activeFilterText}>باركود: {barcodeFilter}</Text>
                <Pressable onPress={() => setBarcodeFilter('')}>
                  <X color="#666" size={14} />
                </Pressable>
              </View>
            )}
          </View>
        )}
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
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => item.id}
          numColumns={2}
          contentContainerStyle={styles.productsContainer}
          columnWrapperStyle={styles.productRow}
          showsVerticalScrollIndicator={false}
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
      )}

      <Modal
        visible={showFilters}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowFilters(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>تصفية المنتجات</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <X color="#1A1A1A" size={24} />
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
                <Text style={styles.filterSectionTitle}>العلامة التجارية</Text>
                <Pressable
                  style={styles.brandSelectButton}
                  onPress={() => setShowBrandsModal(true)}
                >
                  <Text style={styles.brandSelectButtonText}>
                    {selectedBrand && brands.length > 0
                      ? brands.find(b => b && b.id === selectedBrand)?.brand_name_ar || 'اختر العلامة'
                      : 'اختر العلامة'}
                  </Text>
                  <Text style={styles.brandSelectArrow}>›</Text>
                </Pressable>
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
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setSelectedCategory('');
                  setSelectedBrand('');
                  setBarcodeFilter('');
                }}
              >
                <Text style={styles.clearButtonText}>مسح الكل</Text>
              </Pressable>
              <Pressable
                style={styles.applyButton}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>تطبيق</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showBrandsModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowBrandsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>اختر العلامة التجارية</Text>
              <Pressable onPress={() => setShowBrandsModal(false)}>
                <X color="#1A1A1A" size={24} />
              </Pressable>
            </View>

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

            <ScrollView style={styles.brandsListContainer}>
              <View style={styles.brandsGrid}>
                {brandsByLetter[selectedLetter]?.map((brand) => (
                  <Pressable
                    key={brand.id}
                    style={styles.brandItem}
                    onPress={() => {
                      setSelectedBrand(brand.id);
                      setShowBrandsModal(false);
                    }}
                  >
                    <Text style={styles.brandItemName}>{brand.brand_name_ar || brand.brand_name_en}</Text>
                    <Text style={styles.brandItemCount}>منتج</Text>
                  </Pressable>
                ))}
              </View>
              {(!brandsByLetter[selectedLetter] || brandsByLetter[selectedLetter].length === 0) && (
                <View style={styles.emptyBrandsContainer}>
                  <Text style={styles.emptyBrandsText}>لا توجد علامات تجارية تبدأ بـ {selectedLetter}</Text>
                </View>
              )}
            </ScrollView>

            <View style={styles.modalFooter}>
              <Pressable
                style={styles.clearButton}
                onPress={() => {
                  setSelectedBrand('');
                  setShowBrandsModal(false);
                }}
              >
                <Text style={styles.clearButtonText}>مسح</Text>
              </Pressable>
              <Pressable
                style={styles.applyButton}
                onPress={() => setShowBrandsModal(false)}
              >
                <Text style={styles.applyButtonText}>تطبيق</Text>
              </Pressable>
            </View>
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
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  greeting: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500' as const,
  },
  title: {
    fontSize: 32,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    marginTop: 4,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFF0F5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoImage: {
    width: 60,
    height: 60,
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  filterButton: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative' as const,
  },
  filterBadge: {
    position: 'absolute' as const,
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1A1A1A',
  },
  activeFiltersContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  activeFilterChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F5F5',
    gap: 6,
  },
  activeFilterText: {
    fontSize: 13,
    color: '#666',
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
  brandSelectButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  brandSelectButtonText: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '500' as const,
  },
  brandSelectArrow: {
    fontSize: 24,
    color: '#666',
  },
  alphabetNavigation: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    backgroundColor: '#FAFAFA',
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
  brandsListContainer: {
    flex: 1,
    padding: 16,
  },
  brandsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandItem: {
    width: (SCREEN_WIDTH - 64) / 2,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E5E5',
  },
  brandItemName: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 4,
  },
  brandItemCount: {
    fontSize: 13,
    color: '#999',
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
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  productImageContainer: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: '#F8F8F8',
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    padding: 12,
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
});
