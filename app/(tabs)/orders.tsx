import { Feather } from '@expo/vector-icons';
import { useQuery } from '@tanstack/react-query';
import React from 'react';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';
import { useAuth } from '@/contexts/AuthContext';
import { fetchMyOrders, type ClientOrder } from '@/services/orders';

const STATUS_LABELS: Record<string, string> = {
  pending: '\u0642\u064a\u062f \u0627\u0644\u0645\u0631\u0627\u062c\u0639\u0629',
  confirmed: '\u0645\u0624\u0643\u062f',
  cancelled: '\u0645\u0644\u063a\u0649',
  completed: '\u0645\u0643\u062a\u0645\u0644',
};

function formatDate(value: string): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat('ar-IQ', { dateStyle: 'medium', timeStyle: 'short' }).format(date);
}

function formatPrice(value: number): string {
  return `${Math.round(value).toLocaleString('en-US')} \u062f.\u0639`;
}

function OrderCard({ order }: { order: ClientOrder }) {
  const visibleItems = order.items.slice(0, 3);

  return (
    <View style={styles.orderCard}>
      <View style={styles.orderTopRow}>
        <View style={[styles.statusBadge, styles[`status_${order.status}` as keyof typeof styles]]}>
          <Text style={styles.statusText}>{STATUS_LABELS[order.status] || order.status}</Text>
        </View>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderId} numberOfLines={1}>{order.id}</Text>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
      </View>

      {visibleItems.map((item, index) => (
        <View key={`${item.productId}-${index}`} style={styles.itemRow}>
          <Text style={styles.itemQuantity}>x{item.quantity}</Text>
          <Text style={styles.itemName} numberOfLines={1}>
            {item.productName || item.productId || '\u0645\u0646\u062a\u062c'}
          </Text>
        </View>
      ))}
      {order.items.length > visibleItems.length ? (
        <Text style={styles.moreItems}>+{order.items.length - visibleItems.length} \u0645\u0646\u062a\u062c</Text>
      ) : null}

      <View style={styles.orderFooter}>
        <Text style={styles.orderPrice}>{formatPrice(order.totalPrice)}</Text>
        <Text style={styles.itemCount}>{order.totalItems} \u0645\u0646\u062a\u062c</Text>
      </View>
    </View>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const { user, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const ordersQuery = useQuery({
    queryKey: ['my-orders', user?.id],
    queryFn: fetchMyOrders,
    enabled: isAuthenticated,
  });

  const isLoading = isAuthLoading || (isAuthenticated && ordersQuery.isLoading);
  const orders = ordersQuery.data || [];

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: Math.max(insets.bottom, 16) + 104 }]}
        refreshControl={
          isAuthenticated ? (
            <RefreshControl refreshing={ordersQuery.isRefetching} onRefresh={() => void ordersQuery.refetch()} />
          ) : undefined
        }
      >
        <Text style={styles.headerTitle}>{'\u0637\u0644\u0628\u0627\u062a\u064a'}</Text>

        {isLoading ? (
          <View style={styles.stateContainer}>
            <ActivityIndicator size="large" color={beautyTheme.colors.accentDark} />
          </View>
        ) : !isAuthenticated ? (
          <View style={styles.stateContainer}>
            <Feather name="lock" color={beautyTheme.colors.textMuted} size={44} />
            <Text style={styles.stateTitle}>{'\u0633\u062c\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0644\u0639\u0631\u0636 \u0637\u0644\u0628\u0627\u062a\u0643'}</Text>
          </View>
        ) : ordersQuery.isError ? (
          <View style={styles.stateContainer}>
            <Feather name="alert-circle" color="#B54747" size={44} />
            <Text style={styles.errorText}>{'\u062a\u0639\u0630\u0631 \u062a\u062d\u0645\u064a\u0644 \u0627\u0644\u0637\u0644\u0628\u0627\u062a. \u0627\u0633\u062d\u0628 \u0644\u0623\u0633\u0641\u0644 \u0644\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629.'}</Text>
          </View>
        ) : orders.length === 0 ? (
          <View style={styles.stateContainer}>
            <Feather name="file-text" color="#B8AAAE" size={54} />
            <Text style={styles.stateTitle}>{'\u0644\u0627 \u062a\u0648\u062c\u062f \u0637\u0644\u0628\u0627\u062a \u0628\u0639\u062f'}</Text>
            <Text style={styles.stateSubtitle}>{'\u0633\u062a\u0638\u0647\u0631 \u0637\u0644\u0628\u0627\u062a\u0643 \u0647\u0646\u0627 \u0628\u0639\u062f \u0625\u0631\u0633\u0627\u0644\u0647\u0627.'}</Text>
          </View>
        ) : (
          <View style={styles.ordersList}>
            {orders.map(order => <OrderCard key={order.id} order={order} />)}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: beautyTheme.colors.page },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  headerTitle: { fontSize: 26, lineHeight: 34, fontWeight: '700', color: beautyTheme.colors.text, textAlign: 'right', marginBottom: 14 },
  ordersList: { gap: 10 },
  orderCard: { backgroundColor: beautyTheme.colors.card, borderWidth: 1, borderColor: beautyTheme.colors.border, borderRadius: beautyTheme.radius.md, padding: 14 },
  orderTopRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 12 },
  orderIdentity: { flex: 1, alignItems: 'flex-end' },
  orderId: { color: beautyTheme.colors.text, fontSize: 14, fontWeight: '700', textAlign: 'right', maxWidth: '100%' },
  orderDate: { color: beautyTheme.colors.textMuted, fontSize: 12, marginTop: 3, textAlign: 'right' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#F2ECEE' },
  status_pending: { backgroundColor: '#FFF1D6' },
  status_confirmed: { backgroundColor: '#DDF3E4' },
  status_completed: { backgroundColor: '#DDECF6' },
  status_cancelled: { backgroundColor: '#F8DEDE' },
  statusText: { color: beautyTheme.colors.text, fontSize: 11, fontWeight: '700' },
  itemRow: { minHeight: 28, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#F2ECEE', paddingTop: 7, gap: 10 },
  itemName: { flex: 1, color: beautyTheme.colors.text, fontSize: 13, textAlign: 'right' },
  itemQuantity: { color: beautyTheme.colors.textMuted, fontSize: 12 },
  moreItems: { color: beautyTheme.colors.accentDark, fontSize: 12, textAlign: 'right', marginTop: 6 },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: beautyTheme.colors.border },
  orderPrice: { color: beautyTheme.colors.accentDark, fontSize: 16, fontWeight: '700' },
  itemCount: { color: beautyTheme.colors.textMuted, fontSize: 12 },
  stateContainer: { minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stateTitle: { marginTop: 14, color: beautyTheme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stateSubtitle: { marginTop: 6, color: beautyTheme.colors.textMuted, fontSize: 13, textAlign: 'center' },
  errorText: { marginTop: 12, color: '#9E3434', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
