import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo } from 'react';
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

  const chunkNodes = (items: CategoryTreeNode[]) => {
    const rows: CategoryTreeNode[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      rows.push(items.slice(i, i + columns));
    }
    return rows;
  };

  const openCategory = (categoryId: string) => {
    router.push({ pathname: '/(tabs)/products', params: { categoryId } });
  };

  const renderCategoryCard = (item: CategoryTreeNode) => {
    const name = getCategoryName(item.category);
    const subtitle = item.category.category_name_en;

    return (
      <View style={{ width: tileWidth }}>
        <Pressable
          style={({ pressed }) => [
            styles.categoryCard,
            { width: tileWidth, minHeight: tileWidth * 0.62 },
            pressed && styles.buttonPressed,
          ]}
          onPress={() => openCategory(item.category.id)}
        >
          <View style={styles.cardIcon}>
            <Feather name="grid" size={20} color={beautyTheme.colors.accentDark} />
          </View>
          <Text style={styles.categoryName} numberOfLines={2}>
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
              <Pressable key={child.category.id} style={styles.childChip} onPress={() => openCategory(child.category.id)}>
                <Text style={styles.childChipText} numberOfLines={1}>
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
        <Pressable style={({ pressed }) => [styles.parentHeader, pressed && styles.buttonPressed]} onPress={() => openCategory(item.category.id)}>
          <View style={styles.parentIcon}>
            <Feather name="layers" size={20} color={beautyTheme.colors.accentDark} />
          </View>
          <View style={styles.parentTextWrap}>
            <Text style={styles.parentName} numberOfLines={1}>
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
        <FlatList
          data={categoryTree}
          keyExtractor={(item) => item.category.id}
          renderItem={renderCategorySection}
          contentContainerStyle={[
            styles.listContent,
            {
              paddingHorizontal: horizontalPadding,
              paddingTop: insets.top + 16,
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
    writingDirection: 'rtl',
  },
  parentSubtitle: {
    marginTop: 1,
    color: beautyTheme.colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
    writingDirection: 'rtl',
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
  cardIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  categoryName: {
    color: '#17242A',
    fontSize: 18,
    lineHeight: 25,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
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
  childChipText: {
    color: beautyTheme.colors.accentDark,
    fontSize: 12,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
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
