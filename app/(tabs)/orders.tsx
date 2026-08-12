import { Feather } from '@expo/vector-icons';
import { useQueries, useQuery } from '@tanstack/react-query';
import React, { useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, RefreshControl, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';
import { useAuth } from '@/contexts/AuthContext';
import { fetchProductById } from '@/services/api';
import { fetchMyOrders, type ClientOrder } from '@/services/orders';

const STATUS_LABELS: Record<string, string> = {
  draft: '\u0645\u0633\u0648\u062f\u0629',
  confirmed: '\u0645\u0624\u0643\u062f',
  partially_returned: '\u0645\u0631\u062a\u062c\u0639 \u062c\u0632\u0626\u064a\u0627\u064b',
  returned: '\u0645\u0631\u062a\u062c\u0639',
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

function OrderCard({ order, onPress }: { order: ClientOrder; onPress: () => void }) {
  return (
    <Pressable style={({ pressed }) => [styles.orderCard, pressed && styles.orderCardPressed]} onPress={onPress}>
      <View style={styles.orderTopRow}>
        <View style={[styles.statusBadge, styles[`status_${order.status}` as keyof typeof styles]]}>
          <Text style={styles.statusText}>{STATUS_LABELS[order.status] || order.status}</Text>
        </View>
        <View style={styles.orderIdentity}>
          <Text style={styles.orderDate}>{formatDate(order.createdAt)}</Text>
        </View>
      </View>
      <View style={styles.orderFooter}>
        <Text style={styles.orderPrice}>{formatPrice(order.totalPrice)}</Text>
        <View style={styles.detailsHint}>
          <Feather name="chevron-left" size={16} color={beautyTheme.colors.textMuted} />
          <Text style={styles.detailsHintText}>{'\u0639\u0631\u0636 \u0627\u0644\u062a\u0641\u0627\u0635\u064a\u0644'}</Text>
        </View>
      </View>
    </Pressable>
  );
}

function OrderDetails({ order, onClose }: { order: ClientOrder | null; onClose: () => void }) {
  const productQueries = useQueries({
    queries: (order?.items || []).map((item) => ({
      queryKey: ['order-product', item.productId],
      queryFn: () => fetchProductById(item.productId),
      enabled: Boolean(item.productId && (!item.productName || !item.image)),
      staleTime: 5 * 60 * 1000,
    })),
  });

  return (
    <Modal visible={Boolean(order)} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.modalBackdrop} onPress={onClose}>
        <Pressable style={styles.detailsSheet} onPress={() => undefined}>
          <View style={styles.detailsHeader}>
            <Pressable style={styles.closeButton} onPress={onClose} accessibilityLabel="Close order details">
              <Feather name="x" size={22} color={beautyTheme.colors.text} />
            </Pressable>
            <Text style={styles.detailsTitle}>{'\u062a\u0641\u0627\u0635\u064a\u0644 \u0627\u0644\u0637\u0644\u0628'}</Text>
          </View>

          {order ? (
            <ScrollView contentContainerStyle={styles.detailsContent} showsVerticalScrollIndicator={false}>
              <View style={styles.detailsSummary}>
                <View style={[styles.statusBadge, styles[`status_${order.status}` as keyof typeof styles]]}>
                  <Text style={styles.statusText}>{STATUS_LABELS[order.status] || order.status}</Text>
                </View>
                <Text style={styles.detailsOrderId} selectable>{order.sellingOrder || order.id}</Text>
                <Text style={styles.detailsDate}>{formatDate(order.createdAt)}</Text>
              </View>

              <Text style={styles.sectionTitle}>{'\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a'}</Text>
              {order.items.map((item, index) => {
                const product = productQueries[index]?.data;
                const displayName = item.productName || product?.name || '\u0645\u0646\u062a\u062c';
                const image = item.image || product?.image || '';

                return (
                  <View key={`${item.productId}-${index}`} style={styles.detailItemRow}>
                    {image ? (
                      <Image source={{ uri: image }} style={styles.detailItemImage} resizeMode="contain" />
                    ) : (
                      <View style={styles.detailItemImagePlaceholder}>
                        {productQueries[index]?.isLoading ? <ActivityIndicator size="small" color={beautyTheme.colors.accentDark} /> : null}
                      </View>
                    )}
                    <View style={styles.detailItemContent}>
                      <Text style={styles.detailItemName} numberOfLines={2}>{displayName}</Text>
                      <View style={styles.detailItemMetrics}>
                        <View style={styles.detailMetric}>
                          <Text style={styles.detailMetricLabel}>{'\u0627\u0644\u0643\u0645\u064a\u0629'}</Text>
                          <Text style={styles.detailMetricValue}>{item.quantity}</Text>
                        </View>
                        <View style={styles.detailMetric}>
                          <Text style={styles.detailMetricLabel}>{'\u0633\u0639\u0631 \u0627\u0644\u0648\u062d\u062f\u0629'}</Text>
                          <Text style={styles.detailMetricValue}>{formatPrice(item.price)}</Text>
                        </View>
                        <View style={styles.detailMetric}>
                          <Text style={styles.detailMetricLabel}>{'\u0627\u0644\u0645\u062c\u0645\u0648\u0639'}</Text>
                          <Text style={styles.detailLineTotal}>{formatPrice(item.price * item.quantity)}</Text>
                        </View>
                      </View>
                    </View>
                  </View>
                );
              })}

              <View style={styles.detailsTotalRow}>
                <Text style={styles.detailsTotalPrice}>{formatPrice(order.totalPrice)}</Text>
                <Text style={styles.detailsTotalLabel}>{'\u0627\u0644\u0645\u062c\u0645\u0648\u0639 \u0627\u0644\u0643\u0644\u064a'}</Text>
              </View>
            </ScrollView>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

export default function OrdersScreen() {
  const insets = useSafeAreaInsets();
  const [selectedOrder, setSelectedOrder] = useState<ClientOrder | null>(null);
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
            {orders.map(order => <OrderCard key={order.id} order={order} onPress={() => setSelectedOrder(order)} />)}
          </View>
        )}
      </ScrollView>
      <OrderDetails order={selectedOrder} onClose={() => setSelectedOrder(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: beautyTheme.colors.page },
  content: { paddingHorizontal: 16, paddingTop: 4 },
  headerTitle: { fontSize: 26, lineHeight: 34, fontWeight: '700', color: beautyTheme.colors.text, textAlign: 'right', marginBottom: 14 },
  ordersList: { gap: 10 },
  orderCard: { backgroundColor: beautyTheme.colors.card, borderWidth: 1, borderColor: beautyTheme.colors.border, borderRadius: beautyTheme.radius.md, padding: 14 },
  orderCardPressed: { opacity: 0.75 },
  orderTopRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 },
  orderIdentity: { flex: 1, alignItems: 'flex-end' },
  orderDate: { color: beautyTheme.colors.textMuted, fontSize: 13, textAlign: 'right' },
  statusBadge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 5, backgroundColor: '#F2ECEE' },
  status_pending: { backgroundColor: '#FFF1D6' },
  status_confirmed: { backgroundColor: '#DDF3E4' },
  status_completed: { backgroundColor: '#DDECF6' },
  status_cancelled: { backgroundColor: '#F8DEDE' },
  statusText: { color: beautyTheme.colors.text, fontSize: 11, fontWeight: '700' },
  orderFooter: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 10, borderTopWidth: 1, borderTopColor: beautyTheme.colors.border },
  orderPrice: { color: beautyTheme.colors.accentDark, fontSize: 16, fontWeight: '700' },
  detailsHint: { flexDirection: 'row', alignItems: 'center', gap: 3 },
  detailsHintText: { color: beautyTheme.colors.textMuted, fontSize: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(24, 18, 20, 0.4)' },
  detailsSheet: { maxHeight: '82%', minHeight: 320, borderTopLeftRadius: 20, borderTopRightRadius: 20, backgroundColor: beautyTheme.colors.card, overflow: 'hidden' },
  detailsHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: beautyTheme.colors.border },
  detailsTitle: { color: beautyTheme.colors.text, fontSize: 20, fontWeight: '700', textAlign: 'right' },
  closeButton: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 19, backgroundColor: '#F6F0F2' },
  detailsContent: { padding: 16, paddingBottom: 32 },
  detailsSummary: { alignItems: 'flex-end', gap: 7, paddingBottom: 14 },
  detailsOrderId: { color: beautyTheme.colors.text, fontSize: 13, fontWeight: '700', textAlign: 'right' },
  detailsDate: { color: beautyTheme.colors.textMuted, fontSize: 12, textAlign: 'right' },
  sectionTitle: { marginBottom: 8, color: beautyTheme.colors.text, fontSize: 16, fontWeight: '700', textAlign: 'right' },
  detailItemRow: { flexDirection: 'row-reverse', alignItems: 'center', gap: 12, paddingVertical: 12, borderTopWidth: 1, borderTopColor: beautyTheme.colors.border },
  detailItemImage: { width: 66, height: 78, borderRadius: 6, backgroundColor: '#FFFFFF' },
  detailItemImagePlaceholder: { width: 66, height: 78, alignItems: 'center', justifyContent: 'center', borderRadius: 6, backgroundColor: '#F5F1F2' },
  detailItemContent: { flex: 1, minWidth: 0, gap: 10 },
  detailItemName: { color: beautyTheme.colors.text, fontSize: 14, lineHeight: 21, textAlign: 'right', writingDirection: 'rtl' },
  detailItemMetrics: { flexDirection: 'row-reverse', justifyContent: 'space-between', gap: 8 },
  detailMetric: { alignItems: 'flex-end', gap: 2 },
  detailMetricLabel: { color: beautyTheme.colors.textMuted, fontSize: 10, textAlign: 'right' },
  detailMetricValue: { color: beautyTheme.colors.text, fontSize: 12, fontWeight: '600' },
  detailLineTotal: { color: beautyTheme.colors.accentDark, fontSize: 13, fontWeight: '700' },
  detailsTotalRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, paddingTop: 14, borderTopWidth: 1, borderTopColor: beautyTheme.colors.border },
  detailsTotalLabel: { color: beautyTheme.colors.text, fontSize: 15, fontWeight: '700' },
  detailsTotalPrice: { color: beautyTheme.colors.accentDark, fontSize: 18, fontWeight: '700' },
  stateContainer: { minHeight: 300, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  stateTitle: { marginTop: 14, color: beautyTheme.colors.text, fontSize: 18, fontWeight: '700', textAlign: 'center' },
  stateSubtitle: { marginTop: 6, color: beautyTheme.colors.textMuted, fontSize: 13, textAlign: 'center' },
  errorText: { marginTop: 12, color: '#9E3434', fontSize: 14, lineHeight: 22, textAlign: 'center' },
});
