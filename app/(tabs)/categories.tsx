import { useQuery } from '@tanstack/react-query';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { beautyTheme } from '@/constants/uiTheme';
import { Category, fetchCategories } from '@/services/api';

type CategoryNode = {
  id: string;
  label: string;
  parent: CategoryNode | null;
  children: CategoryNode[];
  /** Ids of every leaf category under this node (the node itself when it is a leaf). */
  leafIds: string[];
  pathLabel: string;
};

type CheckState = 'none' | 'some' | 'all';

const T = {
  title: 'التصنيفات',
  clearAll: 'مسح الكل',
  clear: 'مسح',
  close: 'إغلاق',
  search: 'ابحث في كل المستويات...',
  selectAll: 'تحديد الكل',
  back: 'رجوع',
  results: 'عرض النتائج',
  allProducts: 'عرض كل المنتجات',
  searchResults: 'نتائج البحث',
  noResults: 'لا توجد نتائج مطابقة.',
  empty: 'لا توجد فئات',
};

function categoryLabel(category: Category) {
  return category.category_name_ar || category.category_name_en || category.id;
}

function formatNumber(value: number) {
  return value.toLocaleString('ar-IQ');
}

function sectionsLabel(count: number) {
  if (count === 1) return 'قسم واحد';
  if (count === 2) return 'قسمان';
  if (count <= 10) return `${formatNumber(count)} أقسام`;
  return `${formatNumber(count)} قسماً`;
}

function normalize(value: string) {
  return value
    .toLowerCase()
    .replace(/[ً-ٰـ]/g, '')
    .replace(/[أإآ]/g, 'ا')
    .replace(/ى/g, 'ي')
    .replace(/ة/g, 'ه')
    .trim();
}

function buildModel(categories: Category[]) {
  const byId = new Map<string, CategoryNode>();
  categories.forEach((category) =>
    byId.set(category.id, {
      id: category.id,
      label: categoryLabel(category),
      parent: null,
      children: [],
      leafIds: [],
      pathLabel: '',
    }),
  );

  const roots: CategoryNode[] = [];
  categories.forEach((category) => {
    const node = byId.get(category.id)!;
    const parent = category.parent_category ? byId.get(category.parent_category) : undefined;
    if (parent && parent !== node) {
      node.parent = parent;
      parent.children.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: CategoryNode[]) => {
    nodes.sort((a, b) => a.label.localeCompare(b.label, 'ar'));
    nodes.forEach((node) => sortNodes(node.children));
  };
  sortNodes(roots);

  const visited = new Set<string>();
  const finalize = (node: CategoryNode) => {
    if (visited.has(node.id)) return;
    visited.add(node.id);
    if (!node.children.length) {
      node.leafIds = [node.id];
      return;
    }
    node.children.forEach((child) => {
      finalize(child);
      node.leafIds.push(...child.leafIds);
    });
  };
  roots.forEach(finalize);

  // The catalog usually has one generic wrapper root: use its children as the main column.
  const rootsWithChildren = roots.filter((root) => root.children.length);
  let mains = roots;
  if (rootsWithChildren.length === 1) {
    const wrapper = rootsWithChildren[0];
    mains = [...wrapper.children, ...roots.filter((root) => root !== wrapper)];
  }
  const mainSet = new Set(mains.map((node) => node.id));
  byId.forEach((node) => {
    const parts: string[] = [];
    for (let current: CategoryNode | null = node; current; current = current.parent) {
      parts.unshift(current.label);
      if (mainSet.has(current.id)) break;
    }
    node.pathLabel = parts.join(' › ');
  });

  const allNodes = Array.from(byId.values()).filter((node) => {
    for (let current: CategoryNode | null = node; current; current = current.parent) {
      if (mainSet.has(current.id)) return true;
    }
    return false;
  });

  return { byId, mains, allNodes };
}

function Checkbox({ state, label, onPress }: { state: CheckState; label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={6}
      style={styles.checkHit}
      accessibilityRole="checkbox"
      accessibilityLabel={label}
      accessibilityState={{ checked: state === 'all' ? true : state === 'some' ? 'mixed' : false }}
    >
      <View style={[styles.check, state !== 'none' && styles.checkOn]}>
        {state === 'all' ? <Feather name="check" size={16} color="#FFFFFF" /> : null}
        {state === 'some' ? <Feather name="minus" size={16} color="#FFFFFF" /> : null}
      </View>
    </Pressable>
  );
}

export default function CategoriesScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const chipsRef = useRef<ScrollView>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['categories'],
    queryFn: fetchCategories,
  });

  const model = useMemo(() => buildModel(Array.isArray(data) ? data : []), [data]);
  const { mains, allNodes } = model;

  const [selected, setSelected] = useState<Set<string>>(() => new Set());
  const [activeMainId, setActiveMainId] = useState<string | null>(null);
  const [drillPath, setDrillPath] = useState<string[]>([]);
  const [query, setQuery] = useState('');

  const activeMain = mains.find((node) => node.id === activeMainId) || mains[0] || null;
  const currentNode = drillPath.length
    ? model.byId.get(drillPath[drillPath.length - 1]) || activeMain
    : activeMain;

  const stateOf = (node: CategoryNode): CheckState => {
    if (!node.leafIds.length) return 'none';
    let count = 0;
    for (const id of node.leafIds) if (selected.has(id)) count += 1;
    if (count === 0) return 'none';
    return count === node.leafIds.length ? 'all' : 'some';
  };
  const selectedCountIn = (node: CategoryNode) =>
    node.leafIds.reduce((sum, id) => sum + (selected.has(id) ? 1 : 0), 0);

  const toggleNode = (node: CategoryNode) => {
    setSelected((current) => {
      const next = new Set(current);
      const allSelected = node.leafIds.every((id) => next.has(id));
      node.leafIds.forEach((id) => (allSelected ? next.delete(id) : next.add(id)));
      return next;
    });
  };

  const selectedCount = selected.size;

  const chips = useMemo(() => {
    const result: CategoryNode[] = [];
    const walk = (node: CategoryNode) => {
      if (!node.leafIds.length) return;
      const count = node.leafIds.filter((id) => selected.has(id)).length;
      if (count === 0) return;
      if (count === node.leafIds.length) {
        result.push(node);
        return;
      }
      node.children.forEach(walk);
    };
    mains.forEach(walk);
    return result;
  }, [mains, selected]);

  const openNode = (node: CategoryNode) => {
    const chain: CategoryNode[] = [];
    for (let current: CategoryNode | null = node; current; current = current.parent) {
      chain.unshift(current);
      if (mains.some((main) => main.id === current!.id)) break;
    }
    setActiveMainId(chain[0].id);
    setDrillPath(chain.slice(1).map((item) => item.id));
    setQuery('');
  };

  const showProducts = () => {
    // The products screen expands descendants itself; also send each fully selected branch id.
    const ids = new Set<string>(selected);
    allNodes.forEach((node) => {
      if (node.children.length && node.leafIds.length && node.leafIds.every((id) => selected.has(id))) {
        ids.add(node.id);
      }
    });
    router.push({
      pathname: '/(tabs)/products',
      params: { categoryIds: Array.from(ids).join(',') },
    });
  };

  const closeScreen = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(tabs)/home');
  };

  const normalizedQuery = normalize(query);
  const isSearching = Boolean(normalizedQuery);
  const searchResults = useMemo(() => {
    if (!normalizedQuery) return [];
    return allNodes.filter((node) => normalize(node.label).includes(normalizedQuery)).slice(0, 60);
  }, [allNodes, normalizedQuery]);

  const breadcrumb: CategoryNode[] = [];
  if (activeMain) {
    breadcrumb.push(activeMain);
    drillPath.forEach((id) => {
      const node = model.byId.get(id);
      if (node) breadcrumb.push(node);
    });
  }

  const renderRow = (node: CategoryNode, showPath: boolean) => {
    const state = stateOf(node);
    const hasChildren = node.children.length > 0;
    let sub = '';
    if (state === 'some') {
      sub = `محدد ${formatNumber(selectedCountIn(node))} من ${formatNumber(node.leafIds.length)}`;
    } else if (hasChildren) {
      sub = sectionsLabel(node.children.length);
    }
    const subText = showPath && node.parent ? node.pathLabel : sub;
    return (
      <View key={node.id} style={styles.row}>
        <Checkbox state={state} label={node.label} onPress={() => toggleNode(node)} />
        <Pressable
          style={styles.rowText}
          onPress={() => (hasChildren && !showPath ? setDrillPath((c) => [...c, node.id]) : toggleNode(node))}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        >
          <Text style={[styles.rowName, state !== 'none' && styles.rowNameOn]} numberOfLines={2}>
            {node.label}
          </Text>
          {subText ? (
            <Text style={[styles.rowSub, state === 'some' && styles.rowSubPartial]} numberOfLines={2}>
              {subText}
            </Text>
          ) : null}
        </Pressable>
        {hasChildren ? (
          <Pressable
            style={styles.openBtn}
            onPress={() => openNode(node)}
            accessibilityRole="button"
            accessibilityLabel={`فتح أقسام ${node.label}`}
          >
            <Feather name="chevron-left" size={20} color={beautyTheme.colors.accentDark} />
          </Pressable>
        ) : (
          <View style={styles.openSpacer} />
        )}
      </View>
    );
  };

  const currentState = currentNode ? stateOf(currentNode) : 'none';

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable
          style={styles.closeBtn}
          onPress={closeScreen}
          accessibilityRole="button"
          accessibilityLabel={T.close}
        >
          <Feather name="x" size={24} color="#17242A" />
        </Pressable>
        <Text style={styles.title}>{T.title}</Text>
        <Pressable
          style={styles.clearAllBtn}
          onPress={() => setSelected(new Set())}
          disabled={!selectedCount}
          accessibilityRole="button"
        >
          <Text style={[styles.clearAllText, !selectedCount && styles.disabledText]}>{T.clearAll}</Text>
        </Pressable>
      </View>

      <View style={styles.searchBox}>
        <Feather name="search" size={18} color={beautyTheme.colors.textMuted} />
        <TextInput
          style={styles.searchInput}
          value={query}
          onChangeText={setQuery}
          placeholder={T.search}
          placeholderTextColor={beautyTheme.colors.textMuted}
          textAlign="right"
          accessibilityLabel={T.search}
        />
        {query ? (
          <Pressable onPress={() => setQuery('')} hitSlop={10} accessibilityRole="button">
            <Feather name="x" size={16} color={beautyTheme.colors.textMuted} />
          </Pressable>
        ) : null}
      </View>

      {chips.length ? (
        <ScrollView
          ref={chipsRef}
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.chipsScroll}
          contentContainerStyle={styles.chipsContent}
          onContentSizeChange={() => chipsRef.current?.scrollToEnd({ animated: false })}
        >
          {chips.map((chip) => (
            <Pressable
              key={chip.id}
              style={styles.chip}
              onPress={() =>
                setSelected((current) => {
                  const next = new Set(current);
                  chip.leafIds.forEach((id) => next.delete(id));
                  return next;
                })
              }
              accessibilityRole="button"
              accessibilityLabel={`إزالة ${chip.label}`}
            >
              <Text style={styles.chipText}>{chip.label}</Text>
              <Feather name="x" size={14} color={beautyTheme.colors.accentDark} />
            </Pressable>
          ))}
        </ScrollView>
      ) : null}

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={beautyTheme.colors.accentDark} />
        </View>
      ) : !mains.length ? (
        <View style={styles.center}>
          <Text style={styles.emptyText}>{T.empty}</Text>
        </View>
      ) : (
        <View style={styles.body}>
          <View style={styles.pane}>
            {isSearching ? (
              <>
                <View style={styles.paneHead}>
                  <Text style={styles.crumbCurrent}>
                    {searchResults.length
                      ? `${T.searchResults} (${formatNumber(searchResults.length)})`
                      : T.searchResults}
                  </Text>
                </View>
                {searchResults.length ? (
                  <FlatList
                    data={searchResults}
                    keyExtractor={(node) => node.id}
                    renderItem={({ item }) => renderRow(item, true)}
                    keyboardShouldPersistTaps="handled"
                    contentContainerStyle={{ paddingBottom: 16 }}
                  />
                ) : (
                  <Text style={styles.emptyText}>{T.noResults}</Text>
                )}
              </>
            ) : currentNode ? (
              <>
                <View style={styles.paneHead}>
                  {drillPath.length ? (
                    <Pressable
                      style={styles.backBtn}
                      onPress={() => setDrillPath((c) => c.slice(0, -1))}
                      accessibilityRole="button"
                      accessibilityLabel={T.back}
                    >
                      <Feather name="chevron-right" size={20} color={beautyTheme.colors.accentDark} />
                    </Pressable>
                  ) : null}
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.crumbs}
                  >
                    {breadcrumb.map((node, index) => {
                      const isLast = index === breadcrumb.length - 1;
                      return (
                        <View key={node.id} style={styles.crumbItem}>
                          {index > 0 ? (
                            <Feather name="chevron-left" size={14} color={beautyTheme.colors.textMuted} />
                          ) : null}
                          {isLast ? (
                            <Text style={styles.crumbCurrent}>{node.label}</Text>
                          ) : (
                            <Pressable onPress={() => setDrillPath(drillPath.slice(0, index))} hitSlop={8}>
                              <Text style={styles.crumb}>{node.label}</Text>
                            </Pressable>
                          )}
                        </View>
                      );
                    })}
                  </ScrollView>
                </View>
                <ScrollView contentContainerStyle={{ paddingBottom: 16 }}>
                  {currentNode.children.length ? (
                    <View style={[styles.row, styles.rowAll]}>
                      <Checkbox
                        state={currentState}
                        label={`${T.selectAll} ${currentNode.label}`}
                        onPress={() => toggleNode(currentNode)}
                      />
                      <View style={styles.rowText}>
                        <Text style={styles.rowNameAll}>{`${T.selectAll} ${currentNode.label}`}</Text>
                        {currentState === 'some' ? (
                          <Text style={[styles.rowSub, styles.rowSubPartial]}>
                            {`محدد ${formatNumber(selectedCountIn(currentNode))} من ${formatNumber(currentNode.leafIds.length)}`}
                          </Text>
                        ) : null}
                      </View>
                      <View style={styles.openSpacer} />
                    </View>
                  ) : (
                    renderRow(currentNode, false)
                  )}
                  {currentNode.children.map((child) => renderRow(child, false))}
                </ScrollView>
              </>
            ) : null}
          </View>

          <ScrollView style={styles.mains} showsVerticalScrollIndicator={false}>
            {mains.map((node) => {
              const count = selectedCountIn(node);
              const isActive = !isSearching && activeMain?.id === node.id;
              return (
                <Pressable
                  key={node.id}
                  style={[styles.main, isActive && styles.mainActive]}
                  onPress={() => {
                    setActiveMainId(node.id);
                    setDrillPath([]);
                    setQuery('');
                  }}
                  accessibilityRole="button"
                  accessibilityState={{ selected: isActive }}
                >
                  {count ? (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{formatNumber(count)}</Text>
                    </View>
                  ) : null}
                  <Text style={[styles.mainText, isActive && styles.mainTextActive]}>{node.label}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>
      )}

      <View style={[styles.bar, { paddingBottom: Math.max(insets.bottom, 10) }]}>
        <Pressable
          style={styles.applyBtn}
          onPress={showProducts}
          accessibilityRole="button"
        >
          <Text style={styles.applyText}>{selectedCount ? T.results : T.allProducts}</Text>
          {selectedCount ? (
            <View style={styles.applyCount}>
              <Text style={styles.applyCountText}>
                {`${formatNumber(selectedCount)} تصنيفات`}
              </Text>
            </View>
          ) : null}
        </Pressable>
        <Pressable
          style={styles.barClear}
          onPress={() => setSelected(new Set())}
          disabled={!selectedCount}
          accessibilityRole="button"
        >
          <Text style={[styles.barClearText, !selectedCount && styles.disabledText]}>{T.clear}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const ACCENT = beautyTheme.colors.accentDark;
const BORDER = '#EADDE0';

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  header: {
    height: 56,
    paddingHorizontal: 12,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  closeBtn: { width: 48, height: 48, alignItems: 'center', justifyContent: 'center' },
  title: { fontSize: 19, fontWeight: '800', color: '#17242A', textAlign: 'center' },
  clearAllBtn: { minWidth: 72, height: 48, justifyContent: 'center', alignItems: 'flex-start' },
  clearAllText: { color: ACCENT, fontWeight: '700', fontSize: 14 },
  disabledText: { opacity: 0.4 },
  searchBox: {
    marginHorizontal: 14,
    height: 48,
    borderRadius: 16,
    backgroundColor: '#F5F1F2',
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
  },
  searchInput: { flex: 1, fontSize: 15, color: '#17242A', textAlign: 'right', paddingVertical: 0 },
  chipsScroll: { flexGrow: 0, marginTop: 10 },
  chipsContent: { flexGrow: 1, flexDirection: 'row-reverse', paddingHorizontal: 14, gap: 8 },
  chip: {
    minHeight: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: ACCENT,
    paddingHorizontal: 16,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
  },
  chipText: { color: ACCENT, fontWeight: '700', fontSize: 14 },
  body: {
    flex: 1,
    marginTop: 10,
    flexDirection: 'row-reverse',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  mains: { width: 124, flexGrow: 0, backgroundColor: '#FAF6F7' },
  main: {
    minHeight: 64,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 6,
  },
  mainActive: { backgroundColor: '#FFFFFF' },
  mainText: { flex: 1, fontSize: 14, fontWeight: '600', color: '#4A3D40', textAlign: 'right' },
  mainTextActive: { color: ACCENT, fontWeight: '800' },
  badge: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ACCENT,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 5,
  },
  badgeText: { color: '#FFFFFF', fontSize: 12, fontWeight: '800' },
  pane: { flex: 1 },
  paneHead: {
    minHeight: 48,
    paddingHorizontal: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  backBtn: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  crumbs: { flexGrow: 1, flexDirection: 'row-reverse', alignItems: 'center', paddingHorizontal: 8, gap: 4 },
  crumbItem: { flexDirection: 'row-reverse', alignItems: 'center', gap: 4 },
  crumb: { color: beautyTheme.colors.textMuted, fontSize: 13, fontWeight: '600' },
  crumbCurrent: { color: ACCENT, fontSize: 14, fontWeight: '800', textAlign: 'right', paddingHorizontal: 8 },
  row: {
    minHeight: 60,
    paddingHorizontal: 8,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: BORDER,
  },
  rowAll: { backgroundColor: '#FFFAFB' },
  rowText: { flex: 1, alignItems: 'flex-end', paddingVertical: 8 },
  rowName: { fontSize: 15, fontWeight: '600', color: '#17242A', textAlign: 'right' },
  rowNameOn: { fontWeight: '800' },
  rowNameAll: { fontSize: 15, fontWeight: '800', color: '#17242A', textAlign: 'right' },
  rowSub: { marginTop: 2, fontSize: 12, color: beautyTheme.colors.textMuted, textAlign: 'right' },
  rowSubPartial: { color: ACCENT, fontWeight: '600' },
  checkHit: { width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  check: {
    width: 26,
    height: 26,
    borderRadius: 7,
    borderWidth: 1.5,
    borderColor: '#9A8A8E',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkOn: { backgroundColor: ACCENT, borderColor: ACCENT },
  openBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8EEF2',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 4,
  },
  openSpacer: { width: 40 },
  emptyText: { color: beautyTheme.colors.textMuted, fontSize: 15, textAlign: 'center', padding: 24 },
  bar: {
    paddingTop: 10,
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: BORDER,
  },
  applyBtn: {
    flex: 1,
    height: 52,
    borderRadius: 16,
    backgroundColor: ACCENT,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
  },
  applyText: { color: '#FFFFFF', fontSize: 16, fontWeight: '800' },
  applyCount: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 3 },
  applyCountText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  barClear: {
    width: 96,
    height: 52,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
  },
  barClearText: { color: '#17242A', fontSize: 15, fontWeight: '800' },
});
