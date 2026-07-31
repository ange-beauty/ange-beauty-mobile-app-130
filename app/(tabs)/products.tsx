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

import { fetchProducts, fetchBrands, fetchCategories, Category } from '@/services/api';
import { Product } from '@/types/product';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useBasket } from '@/contexts/BasketContext';
import { useAuth } from '@/contexts/AuthContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import FloralBackdrop from '@/components/FloralBackdrop';
import ProductPrice from '@/components/ProductPrice';
import { beautyTheme } from '@/constants/uiTheme';
import { getAvailableQuantityForSellingPoint } from '@/utils/availability';
import { getDisplayBrand } from '@/utils/brand';
import { toArabicNumerals } from '@/utils/formatPrice';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const getNumColumns = () => {
  if (SCREEN_WIDTH >= 1200) return 5;
  if (SCREEN_WIDTH >= 900) return 4;
  if (SCREEN_WIDTH >= 650) return 3;
  return 2;
};

const NUM_COLUMNS = getNumColumns();
const GRID_HORIZONTAL_PADDING = 12;
const GRID_COLUMN_GAP = 10;

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

type CategoryTreeNode = {
  category: Category;
  children: CategoryTreeNode[];
};

function getCategoryName(category: Category) {
  return category.category_name_ar || category.category_name_en || '';
}

function sortCategoryNodes(nodes: CategoryTreeNode[]) {
  nodes.sort((a, b) => getCategoryName(a.category).localeCompare(getCategoryName(b.category), 'ar'));
  nodes.forEach((node) => sortCategoryNodes(node.children));
  return nodes;
}

function buildCategoryTree(categories: Category[]) {
  const nodes = new Map<string, CategoryTreeNode>();
  categories.forEach((category) => {
    nodes.set(category.id, { category, children: [] });
  });

  const roots: CategoryTreeNode[] = [];
  nodes.forEach((node) => {
    const parentId = node.category.parent_category;
    const parent = parentId ? nodes.get(parentId) : undefined;
    if (parent && parent.category.id !== node.category.id) {
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  return sortCategoryNodes(roots);
}

function parseCategoryIds(value?: string | string[]) {
  const serialized = Array.isArray(value) ? value.join(',') : value || '';
  return [...new Set(serialized.split(',').map((id) => id.trim()).filter(Boolean))];
}

export default function HomeScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{
    brandId?: string;
    categoryId?: string;
    categoryIds?: string | string[];
    openBrands?: string;
    product?: string;
    focusSearch?: string;
  }>();
  const categoryRouteParam = Array.isArray(params.categoryIds)
    ? params.categoryIds.join(',')
    : params.categoryIds !== undefined
      ? params.categoryIds
      : params.categoryId;
  const insets = useSafeAreaInsets();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
  const { isAuthenticated } = useAuth();
  const { selectedSellingPoint } = useSellingPoint();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>(
    parseCategoryIds(categoryRouteParam),
  );
  const [expandedCategories, setExpandedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>(params.brandId ? [params.brandId] : []);
  const [barcodeFilter, setBarcodeFilter] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLetter, setSelectedLetter] = useState<string>('A');
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [numColumns, setNumColumns] = useState(NUM_COLUMNS);
  const [key, setKey] = useState('grid-' + NUM_COLUMNS);
  const listRef = useRef<FlatList>(null);
  const searchInputRef = useRef<TextInput>(null);
  const productFilter = typeof params.product === 'string' ? params.product : '';
  const shouldFocusSearch = params.focusSearch === '1';

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

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const toggleCategory = useCallback((categoryId: string) => {
    setSelectedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  const toggleExpandedCategory = useCallback((categoryId: string) => {
    setExpandedCategories(prev =>
      prev.includes(categoryId)
        ? prev.filter(id => id !== categoryId)
        : [...prev, categoryId]
    );
  }, []);

  React.useEffect(() => {
    if (params.brandId) {
      setSelectedBrands([params.brandId]);
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [params.brandId]);

  React.useEffect(() => {
    const routeCategoryIds = parseCategoryIds(categoryRouteParam);
    setSelectedCategories(routeCategoryIds);
    if (routeCategoryIds.length > 0) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [categoryRouteParam]);

  React.useEffect(() => {
    if (params.openBrands === '1') {
      setShowFilters(true);
    }
  }, [params.openBrands]);

  React.useEffect(() => {
    if (productFilter) {
      listRef.current?.scrollToOffset({ offset: 0, animated: false });
    }
  }, [productFilter]);

  React.useEffect(() => {
    if (!shouldFocusSearch) return;
    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
      router.setParams({ focusSearch: '' });
    }, 250);
    return () => clearTimeout(timer);
  }, [router, shouldFocusSearch]);

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
    queryKey: ['products', searchQuery, productFilter, selectedCategories, selectedBrands, barcodeFilter],
    queryFn: ({ pageParam = 1 }) => fetchProducts({
      page: pageParam,
      limit: 20,
      keyword: searchQuery || undefined,
      product: productFilter || undefined,
      category: selectedCategories.length > 0 ? selectedCategories.join(',') : undefined,
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

  const displayedProducts = products;

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  }, [refetch]);

  const handleFilterOpen = useCallback(() => {
    setShowFilters(true);
  }, [setShowFilters]);

  const handleScrollToTop = useCallback(() => {
    listRef.current?.scrollToOffset({ offset: 0, animated: true });
  }, []);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 500);
  }, []);

  const renderCategoryTreeNode = (node: CategoryTreeNode, depth = 0): React.ReactNode => {
    const isSelected = selectedCategories.includes(node.category.id);
    const hasChildren = node.children.length > 0;
    const isExpanded = expandedCategories.includes(node.category.id);

    return (
      <View key={node.category.id} style={depth > 0 ? styles.categoryTreeNestedBlock : undefined}>
        <Pressable
          style={[
            styles.categoryTreeChip,
            depth === 0 && styles.categoryTreeParentChip,
            isSelected && styles.filterOptionActive,
          ]}
          onPress={() => hasChildren ? toggleExpandedCategory(node.category.id) : toggleCategory(node.category.id)}
        >
          <Pressable
            style={styles.categoryTreeCheck}
            onPress={(event) => {
              event.stopPropagation?.();
              toggleCategory(node.category.id);
            }}
          >
            <Feather
              name={isSelected ? 'check-circle' : 'circle'}
              size={16}
              color={isSelected ? '#FFFFFF' : palette.accentDark}
            />
          </Pressable>
          <Feather
            name={hasChildren ? 'folder' : 'tag'}
            size={14}
            color={isSelected ? '#FFFFFF' : palette.accentDark}
          />
          <Text style={[styles.categoryTreeChipText, isSelected && styles.filterOptionTextActive]} numberOfLines={1}>
            {getCategoryName(node.category)}
          </Text>
          {hasChildren && (
            <Feather
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={17}
              color={isSelected ? '#FFFFFF' : palette.textMuted}
            />
          )}
        </Pressable>

        {hasChildren && isExpanded && (
          <View style={styles.categoryTreeChildren}>
            {node.children.map((child) => renderCategoryTreeNode(child, depth + 1))}
          </View>
        )}
      </View>
    );
  };

  const promptSelectSellingPoint = useCallback(() => {
    const title =
      '\u0627\u062e\u062a\u064a\u0627\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639';
    const message =
      '\u064a\u0631\u062c\u0649 \u0627\u062e\u062a\u064a\u0627\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0623\u0648\u0644\u0627\u064b \u0642\u0628\u0644 \u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      const shouldOpenStore = window.confirm(`${title}\n\n${message}`);
      if (shouldOpenStore) {
        router.push('/(tabs)/store');
      }
      return;
    }
    Alert.alert(title, message, [
      { text: '\u0627\u0641\u062a\u062d \u0627\u0644\u0645\u062a\u062c\u0631', onPress: () => router.push('/(tabs)/store') },
      { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' },
    ]);
  }, [router]);
  const handleToggleFavorite = useCallback((productId: string) => {
    if (isAuthenticated) {
      toggleFavorite(productId);
      return;
    }

    const title = '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0645\u0637\u0644\u0648\u0628';
    const message =
      '\u064a\u062c\u0628 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0625\u0636\u0627\u0641\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0645\u0641\u0636\u0644\u0629.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${title}\n\n${message}`)) {
        router.push('/(tabs)/account-login');
      }
      return;
    }

    Alert.alert(title, message, [
      { text: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644', onPress: () => router.push('/(tabs)/account-login') },
      { text: '\u0625\u0644\u063a\u0627\u0621', style: 'cancel' },
    ]);
  }, [isAuthenticated, router, toggleFavorite]);

  React.useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }) => {
      const newNumColumns = (() => {
        if (window.width >= 1200) return 5;
        if (window.width >= 900) return 4;
        if (window.width >= 650) return 3;
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
    return (
      screenWidth -
      GRID_HORIZONTAL_PADDING * 2 -
      GRID_COLUMN_GAP * (numColumns - 1)
    ) / numColumns;
  }, [numColumns]);

  const renderProduct = ({ item }: { item: Product }) => {
    const scaleAnim = new Animated.Value(1);
    const productImageSource =
      item.image || 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop';
    const webImageStyle: React.CSSProperties = {
      width: '100%',
      height: '100%',
      objectFit: item.image ? 'contain' : 'cover',
      display: 'block',
    };

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
      <View style={{ width: cardWidth, marginBottom: 12 }}>
        <Pressable
          onPress={() => router.push(`/product/${item.id}`)}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
        >
          <Animated.View style={[styles.productCard, { transform: [{ scale: scaleAnim }] }]}>
          <View style={styles.productImageContainer}>
            {Platform.OS === 'web' ? (
              <img
                alt={item.name}
                src={productImageSource}
                loading="lazy"
                style={webImageStyle}
                draggable={false}
              />
            ) : item.image ? (
              <Image source={{ uri: item.image }} style={styles.productImage} resizeMode="contain" />
            ) : (
              <Image 
                source={{ uri: productImageSource }} 
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
                handleToggleFavorite(item.id);
              }}
            >
              <Feather
                name="heart"
                color={isItemFavorite ? palette.danger : palette.textMuted}
                size={17}
              />
            </Pressable>
          </View>
          <View style={styles.productInfo}>
            <Text style={styles.brandText} numberOfLines={1}>{displayBrand || ' '}</Text>
            <Text style={styles.productName} numberOfLines={2}>{item.name}</Text>
            <View style={styles.productFooter}>
              <ProductPrice
                product={item}
                containerStyle={styles.priceContainer}
                priceStyle={styles.price}
                oldPriceStyle={styles.oldPrice}
              />
              <Pressable
                style={({ pressed }) => [
                  styles.addToBasketButtonHome,
                  pressed && styles.buttonPressed,
                ]}
                onPress={(e) => {
                  e.stopPropagation();
                  if (!selectedSellingPoint?.id) {
                    promptSelectSellingPoint();
                    return;
                  }
                  if (selectedPointAvailable !== null && itemQuantity >= selectedPointAvailable) {
                    return;
                  }
                  addToBasket(item.id, 1);
                }}
              >
                <Feather name="shopping-bag" color={palette.accentDark} size={15} />
                {itemQuantity > 0 && (
                  <View style={styles.basketCountBadge}>
                    <Text style={styles.basketCountText}>{toArabicNumerals(itemQuantity)}</Text>
                  </View>
                )}
              </Pressable>
            </View>
          </View>
          </Animated.View>
        </Pressable>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <View style={styles.headerWrapper}>
        <View style={[styles.headerCard, { paddingTop: insets.top + 10 }]}>
          <View style={styles.productHeaderRow}>
            {isAuthenticated ? (
              <Pressable style={styles.headerCircleButton} onPress={() => router.push('/(tabs)/account')}>
                <Feather name="bell" size={19} color="#2F2527" />
              </Pressable>
            ) : null}

            <View style={styles.searchFieldRow}>
              <Feather name="search" size={21} color={palette.accentDark} style={styles.searchFieldIcon} />
              <TextInput
                ref={searchInputRef}
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
                <Feather name="sliders" color={palette.accentDark} size={20} />
                {(productFilter || selectedCategories.length > 0 || selectedBrands.length > 0 || barcodeFilter) && (
                  <View style={styles.filterBadge} />
                )}
              </Pressable>
            </View>

            <Pressable style={styles.headerCircleButton} onPress={() => router.push('/contact')}>
              <Feather name="message-circle" size={20} color="#2F2527" />
            </Pressable>
          </View>

          {(productFilter || selectedCategories.length > 0 || selectedBrands.length > 0 || barcodeFilter) && (
            <View style={styles.activeFiltersContainer}>
              {productFilter && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{'\u0639\u0631\u0636 \u0645\u0646\u062a\u062c'}</Text>
                  <Pressable onPress={() => router.setParams({ product: '' })}>
                    <Feather name="x" color="#666" size={14} />
                  </Pressable>
                </View>
              )}
              {selectedCategories.map(categoryId => {
                const category = categories.find(c => c && c.id === categoryId);
                if (!category) return null;
                return (
                  <View key={categoryId} style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {category.category_name_ar || '\u0627\u0644\u0641\u0626\u0629'}
                    </Text>
                    <Pressable onPress={() => setSelectedCategories(prev => prev.filter(id => id !== categoryId))}>
                      <Feather name="x" color="#666" size={14} />
                    </Pressable>
                  </View>
                );
              })}
              {selectedBrands.map(brandId => {
                const brand = brands.find(b => b && b.id === brandId);
                if (!brand) return null;
                return (
                  <View key={brandId} style={styles.activeFilterChip}>
                    <Text style={styles.activeFilterText}>
                      {brand.brand_name_ar || '\u0627\u0644\u0639\u0644\u0627\u0645\u0629'}
                    </Text>
                    <Pressable onPress={() => setSelectedBrands(prev => prev.filter(id => id !== brandId))}>
                      <Feather name="x" color="#666" size={14} />
                    </Pressable>
                  </View>
                );
              })}
              {barcodeFilter && (
                <View style={styles.activeFilterChip}>
                  <Text style={styles.activeFilterText}>{'\u0628\u0627\u0631\u0643\u0648\u062f'}: {barcodeFilter}</Text>
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
          <Text style={styles.loadingText}>{'\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a...'}</Text>
        </View>
      ) : error ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{'\u0641\u0634\u0644 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a'}</Text>
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
            contentContainerStyle={[
              styles.productsContainer,
              { paddingBottom: insets.bottom + 130 },
            ]}
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
                <Text style={styles.emptyText}>{'\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u0639\u062b\u0648\u0631 \u0639\u0644\u0649 \u0645\u0646\u062a\u062c\u0627\u062a'}</Text>
              </View>
            }
            ListFooterComponent={
              isFetchingNextPage ? (
                <View style={styles.footerLoading}>
                  <ActivityIndicator size="small" color="#1A1A1A" />
                  <Text style={styles.footerLoadingText}>{'\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0645\u0632\u064a\u062f...'}</Text>
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
            <View style={[styles.modalHeader, { paddingTop: insets.top + 16 }]}>
              <Text style={styles.modalTitle}>{'\u062a\u0635\u0641\u064a\u0629 \u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a'}</Text>
              <Pressable onPress={() => setShowFilters(false)}>
                <Feather name="x" color="#1A1A1A" size={24} />
              </Pressable>
            </View>

            <ScrollView style={styles.modalBody} contentContainerStyle={styles.modalBodyContent}>
              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{'\u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062f'}</Text>
                <TextInput
                  style={styles.barcodeInput}
                  placeholder={'\u0623\u062f\u062e\u0644 \u0627\u0644\u0628\u0627\u0631\u0643\u0648\u062f...'}
                  placeholderTextColor="#999"
                  value={barcodeFilter}
                  onChangeText={setBarcodeFilter}
                  keyboardType="default"
                />
              </View>

              <View style={styles.filterSection}>
                <Text style={styles.filterSectionTitle}>{'\u0627\u0644\u0639\u0644\u0627\u0645\u0629 \u0627\u0644\u062a\u062c\u0627\u0631\u064a\u0629'}</Text>
                <View style={styles.alphabetNavigation}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.filterScrollContent}>
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
                    <Text style={styles.emptyBrandsText}>{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0639\u0644\u0627\u0645\u0627\u062a \u062a\u062c\u0627\u0631\u064a\u0629 \u062a\u0628\u062f\u0623 \u0628\u0640'} {selectedLetter}</Text>
                  </View>
                )}
              </View>

              {categories.length > 0 && (
                <View style={styles.filterSection}>
                  <Text style={styles.filterSectionTitle}>{'\u0627\u0644\u0641\u0626\u0629'}</Text>
                  <View style={styles.categoryTree}>
                    <Pressable
                      style={[
                        styles.categoryTreeChip,
                        styles.categoryTreeAllChip,
                        selectedCategories.length === 0 && styles.filterOptionActive,
                      ]}
                      onPress={() => setSelectedCategories([])}
                    >
                      <Text
                        style={[
                          styles.categoryTreeChipText,
                          selectedCategories.length === 0 && styles.filterOptionTextActive,
                        ]}
                      >
                        {'\u0627\u0644\u0643\u0644'}
                      </Text>
                    </Pressable>
                    {categoryTree.map((node) => renderCategoryTreeNode(node))}
                  </View>
                </View>
              )}
            </ScrollView>

            <View style={[styles.modalFooter, { paddingBottom: insets.bottom + 16 }]}>
              <Pressable
                style={({ pressed }) => [
                  styles.clearButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => {
                  setSelectedCategories([]);
                  setSelectedBrands([]);
                  setBarcodeFilter('');
                }}
              >
                <Text style={styles.clearButtonText}>{'\u0645\u0633\u062d \u0627\u0644\u0643\u0644'}</Text>
              </Pressable>
              <Pressable
                style={({ pressed }) => [
                  styles.applyButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={() => setShowFilters(false)}
              >
                <Text style={styles.applyButtonText}>{'\u062a\u0637\u0628\u064a\u0642'}</Text>
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
    zIndex: 20,
  },
  headerCard: {
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    paddingBottom: 12,
  },
  productHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 177, 192, 0.45)',
    shadowColor: '#7A3A54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  searchFieldRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 248, 250, 0.94)',
    borderRadius: 21,
    borderWidth: 1,
    borderColor: 'rgba(226, 177, 192, 0.58)',
    paddingHorizontal: 8,
    height: 42,
    shadowColor: '#7A3A54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  searchFieldIcon: {
    marginHorizontal: 6,
  },
  searchFieldInput: {
    flex: 1,
    fontSize: 16,
    color: palette.textPrimary,
    textAlign: 'right',
  },
  searchFilterButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
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
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 10,
    marginBottom: 4,
    justifyContent: 'flex-end',
  },
  activeFilterChip: {
    flexDirection: 'row-reverse',
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
    textAlign: 'right',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalContent: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1A1A1A',
    textAlign: 'right',
  },
  modalBody: {
    flex: 1,
  },
  modalBodyContent: {
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
    padding: 20,
  },
  filterSection: {
    marginBottom: 24,
    width: '100%',
    alignSelf: 'center',
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'right',
  },
  filterOptions: {
    flexDirection: 'row-reverse',
    gap: 8,
  },
  categoryTree: {
    gap: 10,
    alignItems: 'stretch',
    width: '100%',
  },
  categoryTreeNestedBlock: {
    width: '100%',
  },
  categoryTreeChildren: {
    marginTop: 8,
    paddingRight: 12,
    borderRightWidth: 2,
    borderRightColor: '#EFE1E6',
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
  },
  categoryTreeChip: {
    minHeight: 38,
    borderRadius: 19,
    backgroundColor: '#F5F5F5',
    borderWidth: 1,
    borderColor: '#F5F5F5',
    paddingHorizontal: 14,
    paddingVertical: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    alignSelf: 'flex-end',
  },
  categoryTreeCheck: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryTreeParentChip: {
    width: '100%',
    justifyContent: 'flex-start',
    backgroundColor: '#FBF6F8',
    borderColor: '#EADDE0',
  },
  categoryTreeAllChip: {
    alignSelf: 'flex-end',
  },
  categoryTreeChipText: {
    fontSize: 14,
    fontWeight: '700' as const,
    color: '#555',
    textAlign: 'right',
    flexShrink: 1,
  },
  filterScrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
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
    textAlign: 'center',
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
    textAlign: 'right',
  },
  modalFooter: {
    flexDirection: 'row-reverse',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#F0F0F0',
    width: '100%',
    maxWidth: 560,
    alignSelf: 'center',
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
    width: '100%',
  },
  alphabetRow: {
    flexDirection: 'row-reverse',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 8,
    justifyContent: 'center',
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
    flexDirection: 'row-reverse',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
    justifyContent: 'center',
    width: '100%',
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
    textAlign: 'center',
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
    paddingHorizontal: GRID_HORIZONTAL_PADDING,
    paddingTop: 12,
  },
  productRow: {
    flexDirection: 'row-reverse',
    gap: GRID_COLUMN_GAP,
    justifyContent: 'flex-start',
  },
  productCard: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E9E2E3',
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
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
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
  },
  productImage: {
    width: '100%',
    height: '100%',
  },
  productInfo: {
    height: 112,
    padding: 10,
  },
  brandText: {
    height: 13,
    fontSize: 10,
    lineHeight: 13,
    color: palette.textMuted,
    fontWeight: '600' as const,
    marginBottom: 3,
    textAlign: 'right' as const,
  },
  productName: {
    height: 34,
    fontSize: 13,
    fontWeight: '500' as const,
    color: palette.textPrimary,
    marginBottom: 4,
    lineHeight: 17,
    textAlign: 'right' as const,
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
    fontSize: 14,
    fontWeight: '700' as const,
    color: palette.accentDark,
    textAlign: 'right' as const,
  },
  productFooter: {
    height: 34,
    marginTop: 'auto',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  oldPrice: {
    fontSize: 11,
    textAlign: 'right' as const,
  },
  priceContainer: {
    height: 34,
    flex: 1,
    alignItems: 'stretch',
    justifyContent: 'flex-end',
  },
  addToBasketButtonHome: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E9DDE0',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 3,
    elevation: 1,
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
    flexDirection: 'row-reverse',
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
    textAlign: 'right' as const,
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



