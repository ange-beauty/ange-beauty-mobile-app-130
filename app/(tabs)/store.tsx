import { Feather } from '@expo/vector-icons';
import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useSellingPoint } from '@/contexts/SellingPointContext';
import BrandedHeader from '@/components/BrandedHeader';

export default function StoreScreen() {
  const insets = useSafeAreaInsets();
  const { sellingPoints, selectedSellingPoint, setSelectedSellingPointId, isLoadingSellingPoints } = useSellingPoint();

  return (
    <View style={styles.container}>
      <BrandedHeader topInset={insets.top} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>{'\u0627\u0644\u0645\u062a\u062c\u0631'}</Text>
        <Text style={styles.headerSubtitle}>
          {'\u0627\u062e\u062a\u0631 \u0646\u0642\u0637\u0629 \u0627\u0644\u0628\u064a\u0639 \u0644\u0644\u0639\u0631\u0636 \u0627\u0644\u0635\u062d\u064a\u062d \u0648\u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628'}
        </Text>
      </View>

      {isLoadingSellingPoints ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#1A1A1A" />
          <Text style={styles.loadingText}>{'\u062c\u0627\u0631\u064a \u062a\u062d\u0645\u064a\u0644 \u0646\u0642\u0627\u0637 \u0627\u0644\u0628\u064a\u0639...'}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
          <Pressable
            style={[
              styles.sellingPointCard,
              !selectedSellingPoint && styles.sellingPointCardActive,
            ]}
            onPress={() => setSelectedSellingPointId('')}
          >
            <View style={styles.cardMain}>
              <Text style={[styles.cardTitle, !selectedSellingPoint && styles.cardTitleActive]}>
                {'\u0628\u062f\u0648\u0646 \u062a\u062d\u062f\u064a\u062f'}
              </Text>
              <Text style={styles.cardSubTitle}>
                {'\u0644\u0646 \u062a\u0633\u062a\u0637\u064a\u0639 \u0625\u0636\u0627\u0641\u0629 \u0645\u0646\u062a\u062c\u0627\u062a \u0625\u0644\u0649 \u0627\u0644\u0633\u0644\u0629 \u062d\u062a\u0649 \u062a\u062d\u062f\u062f \u0646\u0642\u0637\u0629 \u0628\u064a\u0639'}
              </Text>
            </View>
            {!selectedSellingPoint ? <Feather name="check-circle" size={22} color="#1A1A1A" /> : null}
          </Pressable>

          {sellingPoints.map((point) => {
            const isSelected = selectedSellingPoint?.id === point.id;
            return (
              <Pressable
                key={point.id}
                style={[styles.sellingPointCard, isSelected && styles.sellingPointCardActive]}
                onPress={() => setSelectedSellingPointId(point.id)}
              >
                <View style={styles.cardMain}>
                  <Text style={[styles.cardTitle, isSelected && styles.cardTitleActive]}>
                    {point.name_ar || point.name_en || point.id}
                  </Text>
                  <Text style={styles.cardSubTitle}>
                    {[point.city, point.country].filter(Boolean).join(' - ') || '\u0646\u0642\u0637\u0629 \u0628\u064a\u0639'}
                  </Text>
                </View>
                {isSelected ? <Feather name="check-circle" size={22} color="#1A1A1A" /> : <Feather name="circle" size={20} color="#B7B7B7" />}
              </Pressable>
            );
          })}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F7F8F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EDEFEA',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#111',
    textAlign: 'right' as const,
  },
  headerSubtitle: {
    marginTop: 6,
    fontSize: 13,
    color: '#687064',
    textAlign: 'right' as const,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
  },
  loadingText: {
    fontSize: 14,
    color: '#666',
  },
  contentContainer: {
    padding: 16,
    gap: 10,
  },
  sellingPointCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E4E8E0',
    backgroundColor: '#FFFFFF',
  },
  sellingPointCardActive: {
    borderColor: '#1A1A1A',
    backgroundColor: '#F1F4EC',
  },
  cardMain: {
    flex: 1,
    marginRight: 10,
  },
  cardTitle: {
    fontSize: 16,
    color: '#1A1A1A',
    fontWeight: '700' as const,
    textAlign: 'right' as const,
  },
  cardTitleActive: {
    color: '#111',
  },
  cardSubTitle: {
    marginTop: 4,
    fontSize: 12,
    color: '#6B6B6B',
    textAlign: 'right' as const,
  },
});
