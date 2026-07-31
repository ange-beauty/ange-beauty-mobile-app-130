import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';
import { Category, fetchCategories } from '@/services/api';

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

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const [selectedCategoryIds, setSelectedCategoryIds] = useState<string[]>([]);
  const columns = width >= 900 ? 3 : 2;
  const gap = 12;
  const horizontalPadding = 16;
  const tileWidth = Math.floor((width - horizontalPadding * 2 - gap * (columns - 1)) / columns);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const categories = useMemo(() => {
    return [...(data || [])].sort((a, b) => getCategoryName(a).localeCompare(getCategoryName(b), 'ar'));
  }, [data]);

  const categoryTree = useMemo(() => buildCategoryTree(categories), [categories]);

  const categoryById = useMemo(() => {
    return new Map(categories.map((category) => [category.id, category]));
  }, [categories]);

  const childIdsByParent = useMemo(() => {
    const children = new Map<string, string[]>();
    categories.forEach((category) => {
      if (!category.parent_category) return;
      const ids = children.get(category.parent_category) || [];
      ids.push(category.id);
      children.set(category.parent_category, ids);
    });
    return children;
  }, [categories]);

  const chunkNodes = (items: CategoryTreeNode[]) => {
    const rows: CategoryTreeNode[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      rows.push(items.slice(i, i + columns));
    }
    return rows;
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategoryIds((current) => {
      if (current.includes(categoryId)) {
        return current.filter((id) => id !== categoryId);
      }

      const relatedIds = new Set<string>();
      let parentId = categoryById.get(categoryId)?.parent_category;
      while (parentId) {
        relatedIds.add(parentId);
        parentId = categoryById.get(parentId)?.parent_category;
      }

      const descendants = [...(childIdsByParent.get(categoryId) || [])];
      while (descendants.length > 0) {
        const descendantId = descendants.pop();
        if (!descendantId) continue;
        relatedIds.add(descendantId);
        descendants.push(...(childIdsByParent.get(descendantId) || []));
      }

      return [...current.filter((id) => !relatedIds.has(id)), categoryId];
    });
  };

  const applyCategoryFilters = () => {
    router.push({
      pathname: '/(tabs)/products',
      params: { categoryIds: selectedCategoryIds.join(',') },
    });
  };

  const renderCategoryCard = (item: CategoryTreeNode) => {
    const name = getCategoryName(item.category);
    const subtitle = item.category.category_name_en;
    const isSelected = selectedCategoryIds.includes(item.category.id);

    return (
      <View style={{ width: tileWidth }}>
        <Pressable
          style={({ pressed }) => [
            styles.categoryCard,
            isSelected && styles.categoryCardSelected,
            { width: tileWidth, minHeight: tileWidth * 0.62 },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => toggleCategory(item.category.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
        >
          <View style={[styles.cardIcon, isSelected && styles.cardIconSelected]}>
            <Feather
              name={isSelected ? 'check' : 'grid'}
              size={20}
              color={isSelected ? '#FFFFFF' : beautyTheme.colors.accentDark}
            />
          </View>
          <Text style={[styles.categoryName, isSelected && styles.categoryNameSelected]} numberOfLines={2}>
            {name}
          </Text>
          {!!subtitle && (
            <Text style={styles.categorySubtitle} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </Pressable>
        {item.children.length > 0 && (
          <View style={styles.childChips}>
            {item.children.map((child) => (
              <Pressable
                key={child.category.id}
                style={[
                  styles.childChip,
                  selectedCategoryIds.includes(child.category.id) && styles.childChipSelected,
                ]}
                onPress={() => toggleCategory(child.category.id)}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: selectedCategoryIds.includes(child.category.id) }}
              >
                <Text
                  style={[
                    styles.childChipText,
                    selectedCategoryIds.includes(child.category.id) && styles.childChipTextSelected,
                  ]}
                  numberOfLines={1}
                >
                  {getCategoryName(child.category)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderCategorySection = ({ item }: { item: CategoryTreeNode }) => {
    const childCount = item.children.length;
    const isSelected = selectedCategoryIds.includes(item.category.id);

    if (childCount === 0) {
      return (
        <View style={styles.sectionBlock}>
          <View style={[styles.categoryRow, { gap }]}>
            {renderCategoryCard(item)}
          </View>
        </View>
      );
    }

    return (
      <View style={styles.sectionBlock}>
        <Pressable
          style={({ pressed }) => [
            styles.parentHeader,
            isSelected && styles.parentHeaderSelected,
            pressed && styles.buttonPressed,
          ]}
          onPress={() => toggleCategory(item.category.id)}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: isSelected }}
        >
          <View style={[styles.parentIcon, isSelected && styles.cardIconSelected]}>
            <Feather
              name={isSelected ? 'check' : 'layers'}
              size={20}
              color={isSelected ? '#FFFFFF' : beautyTheme.colors.accentDark}
            />
          </View>
          <View style={styles.parentTextWrap}>
            <Text style={[styles.parentName, isSelected && styles.categoryNameSelected]} numberOfLines={1}>
              {getCategoryName(item.category)}
            </Text>
            <Text style={styles.parentSubtitle} numberOfLines={1}>
              {childCount > 0 ? `${childCount.toLocaleString('ar-IQ')} \u0641\u0626\u0627\u062a` : item.category.category_name_en || ''}
            </Text>
          </View>
        </Pressable>

        <View style={styles.childrenGrid}>
          {chunkNodes(item.children).map((row, rowIndex) => (
            <View key={`${item.category.id}-${rowIndex}`} style={[styles.categoryRow, { gap }]}>
              {row.map((child) => (
                <React.Fragment key={child.category.id}>{renderCategoryCard(child)}</React.Fragment>
              ))}
            </View>
          ))}
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />

      {isLoading ? (
        <View style={styles.loadingBox}>
          <ActivityIndicator color={beautyTheme.colors.accentDark} />
        </View>
      ) : (
        <>
          <View style={[styles.selectionHeader, { paddingTop: insets.top + 8 }]}>
            <View style={styles.selectionStatus}>
              <Text style={styles.selectionTitle}>{'\u0627\u0644\u0641\u0626\u0627\u062a'}</Text>
              <Text style={styles.selectionCount}>
                {selectedCategoryIds.length > 0
                  ? `${selectedCategoryIds.length.toLocaleString('ar-IQ')} \u0641\u0626\u0627\u062a \u0645\u062d\u062f\u062f\u0629`
                  : '\u0644\u0645 \u064a\u062a\u0645 \u0627\u0644\u062a\u062d\u062f\u064a\u062f'}
              </Text>
            </View>
            <View style={styles.selectionActions}>
              <Pressable
                style={({ pressed }) => [styles.applyButton, pressed && styles.buttonPressed]}
                onPress={applyCategoryFilters}
              >
                <Feather name="search" size={18} color="#FFFFFF" />
                <Text style={styles.applyButtonText}>{'\u0628\u062d\u062b'}</Text>
              </Pressable>
              {selectedCategoryIds.length > 0 && (
                <Pressable
                  style={({ pressed }) => [styles.clearButton, pressed && styles.buttonPressed]}
                  onPress={() => setSelectedCategoryIds([])}
                  accessibilityLabel={'\u0625\u0644\u063a\u0627\u0621 \u062a\u062d\u062f\u064a\u062f \u0627\u0644\u0641\u0626\u0627\u062a'}
                >
                  <Feather name="x" size={20} color={beautyTheme.colors.accentDark} />
                </Pressable>
              )}
            </View>
          </View>

          <FlatList
            data={categoryTree}
            extraData={selectedCategoryIds}
            keyExtractor={(item) => item.category.id}
            renderItem={renderCategorySection}
            contentContainerStyle={[
              styles.listContent,
              {
                paddingHorizontal: horizontalPadding,
                paddingTop: 12,
                paddingBottom: insets.bottom + 130,
              },
            ]}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={false}
            ListEmptyComponent={
              <View style={styles.emptyBox}>
                <Text style={styles.emptyText}>{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0641\u0626\u0627\u062a'}</Text>
              </View>
            }
          />

        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDFD',
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  listContent: {
    paddingTop: 8,
    gap: 12,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  parentHeader: {
    minHeight: 58,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.78)',
    borderWidth: 1,
    borderColor: '#EADDE0',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginBottom: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  parentHeaderSelected: {
    backgroundColor: '#FFF3F7',
    borderColor: beautyTheme.colors.accentDark,
  },
  parentIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#F8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  parentTextWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  parentName: {
    color: '#17242A',
    fontSize: 21,
    lineHeight: 28,
    fontWeight: '800',
    textAlign: 'right',
  },
  parentSubtitle: {
    marginTop: 1,
    color: beautyTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  childrenGrid: {
    gap: 12,
  },
  categoryRow: {
    flexDirection: 'row-reverse',
  },
  categoryCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EADDE0',
    padding: 14,
    justifyContent: 'center',
    alignItems: 'flex-end',
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  categoryCardSelected: {
    backgroundColor: '#FFF3F7',
    borderColor: beautyTheme.colors.accentDark,
  },
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  cardIconSelected: {
    backgroundColor: beautyTheme.colors.accentDark,
  },
  categoryName: {
    color: '#17242A',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'right',
  },
  categoryNameSelected: {
    color: beautyTheme.colors.accentDark,
  },
  categorySubtitle: {
    marginTop: 4,
    color: beautyTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  childChips: {
    marginTop: 8,
    gap: 6,
  },
  childChip: {
    borderRadius: 12,
    backgroundColor: '#FFF7FA',
    borderWidth: 1,
    borderColor: '#EADDE0',
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  childChipSelected: {
    backgroundColor: beautyTheme.colors.accentDark,
    borderColor: beautyTheme.colors.accentDark,
  },
  childChipText: {
    color: beautyTheme.colors.accentDark,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
  },
  childChipTextSelected: {
    color: '#FFFFFF',
  },
  selectionHeader: {
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: 'rgba(255, 253, 253, 0.96)',
    borderBottomWidth: 1,
    borderBottomColor: '#EADDE0',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  selectionStatus: {
    flex: 1,
    alignItems: 'flex-end',
  },
  selectionTitle: {
    color: '#17242A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'right',
  },
  selectionCount: {
    marginTop: 1,
    color: beautyTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  selectionActions: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  applyButton: {
    minWidth: 84,
    height: 44,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  applyButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#EADDE0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyBox: {
    minHeight: 240,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    color: beautyTheme.colors.textMuted,
    fontSize: 15,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
