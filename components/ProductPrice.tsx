import React from 'react';
import { StyleProp, StyleSheet, Text, TextStyle, View, ViewStyle } from 'react-native';

import { Product } from '@/types/product';
import { formatPrice } from '@/utils/formatPrice';

type ProductPriceProps = {
  product: Product;
  containerStyle?: StyleProp<ViewStyle>;
  priceStyle?: StyleProp<TextStyle>;
  oldPriceStyle?: StyleProp<TextStyle>;
};

export default function ProductPrice({
  product,
  containerStyle,
  priceStyle,
  oldPriceStyle,
}: ProductPriceProps) {
  const basePrice = product.basePrice ?? product.price;
  const hasDiscount = basePrice > product.price;
  const isComingSoon = !Number.isFinite(product.price) || product.price <= 0;

  if (isComingSoon) {
    return (
      <View style={[styles.container, containerStyle]}>
        <Text style={priceStyle}>{'\u064a\u062a\u0648\u0641\u0631 \u0642\u0631\u064a\u0628\u0627\u064b'}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.container, containerStyle]}>
      {hasDiscount ? (
        <Text style={[styles.oldPrice, oldPriceStyle]}>{formatPrice(basePrice)}</Text>
      ) : null}
      <Text style={priceStyle}>{formatPrice(product.price)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'flex-end',
  },
  oldPrice: {
    color: '#9A8B8E',
    fontSize: 12,
    textDecorationLine: 'line-through',
    textAlign: 'right',
  },
});
