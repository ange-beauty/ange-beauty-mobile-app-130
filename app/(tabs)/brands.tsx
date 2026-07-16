import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import React, { useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';
import { Brand, fetchBrands } from '@/services/api';

const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
type BrandSection = {
  letter: string;
  brands: Brand[];
};

function getBrandDisplayName(brand: Brand) {
  return brand.brand_name_en || brand.brand_name_ar;
}

function getBrandLetter(brand: Brand) {
  const name = getBrandDisplayName(brand)?.trim() || '';
  const first = name.charAt(0).toUpperCase();
  return /^[A-Z]$/.test(first) ? first : '#';
}

export default function BrandsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const listRef = useRef<FlatList<BrandSection>>(null);
  const [activeLetter, setActiveLetter] = useState('A');
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['brands'],
    queryFn: fetchBrands,
  });

  const brands = useMemo(() => {
    return [...(data || [])].sort((a, b) => getBrandDisplayName(a).localeCompare(getBrandDisplayName(b)));
  }, [data]);

  const sections = useMemo(() => {
    const grouped: Record<string, Brand[]> = {};
    brands.forEach((brand) => {
      const letter = getBrandLetter(brand);
      if (!grouped[letter]) grouped[letter] = [];
      grouped[letter].push(brand);
    });

    return alphabet
      .filter((letter) => grouped[letter]?.length)
      .map((letter) => ({ letter, brands: grouped[letter] }));
  }, [brands]);

  const firstIndexByLetter = useMemo(() => {
    return sections.reduce<Record<string, number>>((map, section, index) => {
      map[section.letter] = index;
      return map;
    }, {});
  }, [sections]);

  const availableLetters = useMemo(() => {
    return alphabet.filter((letter) => typeof firstIndexByLetter[letter] === 'number');
  }, [firstIndexByLetter]);

  const columns = width >= 900 ? 4 : 3;
  const horizontalPadding = width >= 768 ? 22 : 14;
  const gridGap = width >= 390 ? 14 : 10;
  const railWidth = 24;
  const gridRightGutter = railWidth + 34;
  const tileWidth = Math.floor((width - horizontalPadding * 2 - gridRightGutter - gridGap * (columns - 1)) / columns);

  const chunkBrands = (items: Brand[]) => {
    const rows: Brand[][] = [];
    for (let i = 0; i < items.length; i += columns) {
      rows.push(items.slice(i, i + columns));
    }
    return rows;
  };

  const scrollToLetter = (letter: string) => {
    const index = firstIndexByLetter[letter];
    if (typeof index !== 'number') return;
    setActiveLetter(letter);
    listRef.current?.scrollToIndex({ index, animated: true, viewPosition: 0 });
  };

  const renderBrandTile = (item: Brand) => {
    const name = getBrandDisplayName(item);

    return (
      <View key={item.id} style={{ width: tileWidth }}>
        <Pressable
          style={({ pressed }) => [styles.brandTile, { width: tileWidth, height: tileWidth }, pressed && styles.buttonPressed]}
          onPress={() => router.push(`/(tabs)/products?brandId=${item.id}`)}
        >
          <Text style={styles.brandLogoText} numberOfLines={2} adjustsFontSizeToFit>
            {name}
          </Text>
        </Pressable>
        <Text style={styles.brandName} numberOfLines={1}>
          {name}
        </Text>
      </View>
    );
  };

  const renderSection = ({ item }: { item: BrandSection }) => {
    return (
      <View style={styles.sectionBlock}>
        <Text style={styles.sectionLetter}>{item.letter}</Text>
        {chunkBrands(item.brands).map((row, rowIndex) => (
          <View key={`${item.letter}-${rowIndex}`} style={[styles.brandRow, { gap: gridGap }]}>
            {row.map(renderBrandTile)}
          </View>
        ))}
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
        <View style={styles.body}>
          <FlatList
            ref={listRef}
            data={sections}
            key={`brands-${columns}`}
            keyExtractor={(item) => item.letter}
            renderItem={renderSection}
            contentContainerStyle={[
              styles.gridContent,
              {
                paddingTop: insets.top + 16,
                paddingStart: horizontalPadding + gridRightGutter,
                paddingEnd: horizontalPadding,
                paddingBottom: insets.bottom + 150,
              },
            ]}
            showsVerticalScrollIndicator={false}
            onRefresh={refetch}
            refreshing={false}
            onScrollToIndexFailed={(info) => {
              setTimeout(() => listRef.current?.scrollToIndex({ index: info.index, animated: true }), 80);
            }}
          />

          <View pointerEvents="box-none" style={[styles.railLayer, { top: insets.top + 132, bottom: insets.bottom + 170 }]}>
            <View style={styles.alphabetRail}>
              {alphabet.map((letter) => {
                const isAvailable = availableLetters.includes(letter);
                return (
                  <Pressable
                    key={letter}
                    style={[styles.railLetterButton, activeLetter === letter && styles.railLetterActive]}
                    disabled={!isAvailable}
                    onPress={() => scrollToLetter(letter)}
                  >
                    <Text style={[styles.railLetter, !isAvailable && styles.railLetterDisabled]}>
                      {letter}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFDFD',
  },
  body: {
    flex: 1,
  },
  loadingBox: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gridContent: {
    paddingTop: 4,
  },
  sectionBlock: {
    marginBottom: 8,
  },
  sectionLetter: {
    color: '#C77D98',
    fontSize: 22,
    lineHeight: 24,
    fontWeight: '800',
    textAlign: 'right',
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    marginBottom: 16,
  },
  brandTile: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 10,
    shadowColor: '#7A5A62',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  brandLogoText: {
    color: '#23282C',
    fontSize: 18,
    lineHeight: 22,
    fontWeight: Platform.select({ ios: '600', android: '600', default: '600' }),
    textAlign: 'center',
  },
  brandName: {
    marginTop: 5,
    color: '#C94737',
    fontSize: 15,
    lineHeight: 19,
    fontWeight: '800',
    textAlign: 'center',
  },
  railLayer: {
    position: 'absolute',
    left: 0,
    right: 0,
    direction: 'ltr',
    alignItems: 'flex-end',
  },
  alphabetRail: {
    width: 24,
    borderTopLeftRadius: 12,
    borderBottomLeftRadius: 12,
    backgroundColor: 'rgba(255, 226, 236, 0.76)',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingVertical: 4,
  },
  railLetterButton: {
    width: 23,
    height: 17,
    alignItems: 'center',
    justifyContent: 'center',
  },
  railLetterActive: {
    backgroundColor: 'rgba(255,255,255,0.62)',
    borderRadius: 10,
  },
  railLetter: {
    color: '#C77D98',
    fontSize: 13,
    lineHeight: 15,
    fontWeight: '800',
  },
  railLetterDisabled: {
    opacity: 0.38,
  },
  buttonPressed: {
    opacity: 0.78,
    transform: [{ scale: 0.98 }],
  },
});
