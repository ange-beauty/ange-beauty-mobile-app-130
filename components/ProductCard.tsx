import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useCallback, useState } from 'react';
import {
  Alert,
  Image,
  Platform,
  Pressable,
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { useBasket } from '@/contexts/BasketContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';
import { Product } from '@/types/product';
import { getAvailableQuantityForSellingPoint } from '@/utils/availability';
import { getDisplayBrand } from '@/utils/brand';
import { CURRENCY_LABEL, formatPrice, toArabicNumerals } from '@/utils/formatPrice';

const FALLBACK_IMAGE = 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=400&h=400&fit=crop';

const cardColors = {
  border: '#E8DCDD',
  imageTint: '#F4F1F2',
  wine: '#7E4A53',
  text: '#2F2527',
  muted: '#7D6A6E',
  oldPrice: '#9A8A8E',
  badgeBg: '#ECE6E8',
  favoriteActive: '#B9442B',
  buttonBorder: '#EADDE0',
};

/** Extra touch area around the 32dp round buttons so the hit target is 44dp. */
const BUTTON_HIT_SLOP = { top: 6, bottom: 6, left: 6, right: 6 };

const LABEL_ADD_FAVORITE = 'إضافة إلى المفضلة';
const LABEL_REMOVE_FAVORITE = 'إزالة من المفضلة';
const LABEL_ADD_TO_BASKET = 'إضافة إلى السلة';
const LABEL_COMING_SOON = 'يتوفر قريباً';

type ProductCardProps = {
  product: Product;
  isFavorite: boolean;
  basketQuantity?: number;
  /** Optional short pill on the image, opposite the favorite button (e.g. "جديد"). */
  badge?: string;
  style?: StyleProp<ViewStyle>;
  onPress: () => void;
  onToggleFavorite: () => void;
  onAddToBasket: () => void;
};

/**
 * Shared product card (home strip, products grid, favorites). Presentational only:
 * favorite/basket business rules stay with the caller (see useProductCardActions).
 */
export default function ProductCard({
  product,
  isFavorite,
  basketQuantity = 0,
  badge,
  style,
  onPress,
  onToggleFavorite,
  onAddToBasket,
}: ProductCardProps) {
  const [pressed, setPressed] = useState(false);
  const displayBrand = getDisplayBrand(product.brand);
  const canAddToBasket = Number.isFinite(product.price) && product.price > 0;
  const hasDiscount =
    canAddToBasket &&
    typeof product.basePrice === 'number' &&
    product.basePrice > product.price &&
    (product.discountAmount ?? product.basePrice - product.price) > 0;
  const imageUri = product.image || FALLBACK_IMAGE;

  return (
    <View style={[styles.card, pressed && styles.cardPressed, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
      >
        <View style={styles.media}>
          <View style={styles.mediaInner}>
            {Platform.OS === 'web' ? (
              <img
                alt={product.name}
                src={imageUri}
                loading="lazy"
                draggable={false}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: product.image ? 'contain' : 'cover',
                  display: 'block',
                  mixBlendMode: 'multiply',
                }}
              />
            ) : (
              <Image
                source={{ uri: imageUri }}
                style={styles.image}
                resizeMode={product.image ? 'contain' : 'cover'}
              />
            )}
          </View>
        </View>

        <View style={styles.body}>
          <Text style={styles.brand} numberOfLines={1}>
            {displayBrand || ' '}
          </Text>
          <Text style={styles.name} numberOfLines={2}>
            {product.name}
          </Text>
          <View style={styles.priceStack}>
            {hasDiscount ? (
              <Text style={styles.oldPrice} numberOfLines={1}>
                {formatPrice(product.basePrice as number)}
              </Text>
            ) : null}
            {canAddToBasket ? (
              <Text style={styles.price} numberOfLines={1}>
                {formatPrice(product.price)}
                <Text style={styles.currency}>{` ${CURRENCY_LABEL}`}</Text>
              </Text>
            ) : (
              <Text style={styles.comingSoon} numberOfLines={1}>
                {LABEL_COMING_SOON}
              </Text>
            )}
          </View>
        </View>
      </Pressable>

      {badge ? (
        <View style={styles.badge} pointerEvents="none">
          <Text style={styles.badgeText} numberOfLines={1}>
            {badge}
          </Text>
        </View>
      ) : null}

      <Pressable
        style={({ pressed: favPressed }) => [styles.roundButton, styles.favoriteButton, favPressed && styles.buttonPressed]}
        hitSlop={BUTTON_HIT_SLOP}
        onPress={(e) => {
          e.stopPropagation?.();
          onToggleFavorite();
        }}
        accessibilityRole="button"
        accessibilityLabel={isFavorite ? LABEL_REMOVE_FAVORITE : LABEL_ADD_FAVORITE}
        accessibilityState={{ selected: isFavorite }}
      >
        <Feather name="heart" size={17} color={isFavorite ? cardColors.favoriteActive : cardColors.muted} />
      </Pressable>

      <Pressable
        style={({ pressed: basketPressed }) => [
          styles.roundButton,
          styles.basketButton,
          !canAddToBasket && styles.basketButtonDisabled,
          basketPressed && canAddToBasket && styles.buttonPressed,
        ]}
        hitSlop={BUTTON_HIT_SLOP}
        disabled={!canAddToBasket}
        onPress={(e) => {
          e.stopPropagation?.();
          onAddToBasket();
        }}
        accessibilityRole="button"
        accessibilityLabel={LABEL_ADD_TO_BASKET}
        accessibilityState={{ disabled: !canAddToBasket }}
      >
        <Feather name="shopping-bag" size={16} color={canAddToBasket ? cardColors.wine : cardColors.muted} />
        {basketQuantity > 0 ? (
          <View style={styles.basketCountBadge}>
            <Text style={styles.basketCountText}>{toArabicNumerals(basketQuantity)}</Text>
          </View>
        ) : null}
      </Pressable>
    </View>
  );
}

/**
 * Favorite/basket handlers shared by product lists (same rules the products grid always used):
 * guests are asked to log in before favoriting; adding to the basket needs a selected selling
 * point and respects that point's available quantity.
 */
export function useProductCardActions() {
  const router = useRouter();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { addToBasket, getItemQuantity } = useBasket();
  const { isAuthenticated } = useAuth();
  const { selectedSellingPoint } = useSellingPoint();

  const promptSelectSellingPoint = useCallback(() => {
    const title = 'اختيار نقطة البيع';
    const message =
      'يرجى اختيار نقطة البيع أولاً قبل إضافة المنتجات إلى السلة.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${title}\n\n${message}`)) {
        router.push('/(tabs)/store');
      }
      return;
    }
    Alert.alert(title, message, [
      { text: 'افتح المتجر', onPress: () => router.push('/(tabs)/store') },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  }, [router]);

  const handleToggleFavorite = useCallback((productId: string) => {
    if (isAuthenticated) {
      toggleFavorite(productId);
      return;
    }

    const title = 'تسجيل الدخول مطلوب';
    const message =
      'يجب تسجيل الدخول لإضافة المنتجات إلى المفضلة.';
    if (Platform.OS === 'web' && typeof window !== 'undefined') {
      if (window.confirm(`${title}\n\n${message}`)) {
        router.push('/(tabs)/account-login');
      }
      return;
    }

    Alert.alert(title, message, [
      { text: 'تسجيل الدخول', onPress: () => router.push('/(tabs)/account-login') },
      { text: 'إلغاء', style: 'cancel' },
    ]);
  }, [isAuthenticated, router, toggleFavorite]);

  const handleAddToBasket = useCallback((product: Product) => {
    if (!Number.isFinite(product.price) || product.price <= 0) return;
    if (!selectedSellingPoint?.id) {
      promptSelectSellingPoint();
      return;
    }
    const available = getAvailableQuantityForSellingPoint(product, selectedSellingPoint.id);
    if (available !== null && getItemQuantity(product.id) >= available) {
      return;
    }
    addToBasket(product, 1);
  }, [addToBasket, getItemQuantity, promptSelectSellingPoint, selectedSellingPoint]);

  return { isFavorite, getItemQuantity, handleToggleFavorite, handleAddToBasket };
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: cardColors.border,
    overflow: 'hidden',
  },
  cardPressed: {
    opacity: 0.92,
    transform: [{ scale: 0.98 }],
  },
  media: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: cardColors.imageTint,
    padding: 8,
  },
  mediaInner: {
    flex: 1,
    // Lets white product-photo backgrounds blend into the tint (like the website).
    mixBlendMode: 'multiply',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  body: {
    padding: 10,
  },
  brand: {
    height: 15,
    fontSize: 11,
    lineHeight: 15,
    color: cardColors.muted,
    marginBottom: 4,
    textAlign: 'right',
  },
  name: {
    minHeight: 40,
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '700',
    color: cardColors.text,
    textAlign: 'right',
  },
  priceStack: {
    // Fixed height (old price + price) so discounted and regular cards align;
    // left margin keeps the price clear of the basket button.
    height: 38,
    marginTop: 8,
    marginLeft: 40,
    justifyContent: 'flex-end',
  },
  oldPrice: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: '700',
    color: cardColors.oldPrice,
    textDecorationLine: 'line-through',
    textAlign: 'right',
    marginBottom: 2,
  },
  price: {
    fontSize: 16,
    lineHeight: 22,
    fontWeight: '800',
    color: cardColors.wine,
    textAlign: 'right',
  },
  currency: {
    fontSize: 11,
    fontWeight: '600',
    color: cardColors.muted,
  },
  comingSoon: {
    fontSize: 14,
    lineHeight: 22,
    fontWeight: '800',
    color: cardColors.wine,
    textAlign: 'right',
  },
  badge: {
    position: 'absolute',
    top: 8,
    left: 8,
    maxWidth: '62%',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: cardColors.badgeBg,
  },
  badgeText: {
    fontSize: 11,
    lineHeight: 15,
    fontWeight: '700',
    color: cardColors.wine,
    textAlign: 'center',
  },
  roundButton: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: cardColors.buttonBorder,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  favoriteButton: {
    top: 8,
    right: 8,
  },
  basketButton: {
    bottom: 10,
    left: 10,
  },
  basketButtonDisabled: {
    backgroundColor: '#F1ECEE',
    opacity: 0.65,
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.94 }],
  },
  basketCountBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    paddingHorizontal: 4,
    backgroundColor: '#FF3B30',
    alignItems: 'center',
    justifyContent: 'center',
  },
  basketCountText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
});
