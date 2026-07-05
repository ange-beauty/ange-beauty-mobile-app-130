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

  return (
    <View style={[styles.container, containerStyle]}>
      {hasDiscount ? (
        <Text style={[styles.oldPrice, oldPriceStyle]}>{formatPrice(basePrice)}</Text>
      ) : null}
      <Text style={[priceStyle, styles.currentPrice]}>{formatPrice(product.price)}</Text>
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
    writingDirection: 'rtl',
  },
  currentPrice: {
    writingDirection: 'rtl',
  },
});
