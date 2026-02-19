import { Feather } from '@expo/vector-icons';
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import BrandedHeader from '@/components/BrandedHeader';

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.container}>
      <BrandedHeader topInset={insets.top} />
      <View style={styles.header}>
        <Text style={styles.headerTitle}>الطلبات</Text>
      </View>

      <View style={styles.emptyContainer}>
        <Feather name="file-text" color="#CCCCCC" size={72} />
        <Text style={styles.emptyTitle}>لا توجد طلبات بعد</Text>
        <Text style={styles.emptySubtitle}>ستظهر طلباتك هنا بعد إتمام الطلب.</Text>
      </View>
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
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  emptyTitle: {
    marginTop: 16,
    fontSize: 22,
    fontWeight: '700' as const,
    color: '#1A1A1A',
  },
  emptySubtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center' as const,
  },
});

