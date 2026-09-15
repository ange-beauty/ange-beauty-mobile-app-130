import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import { fetchProductVariations } from '@/services/api';

export default function ProductVariationSelector({ productId }: { productId: string }) {
  const router = useRouter();
  const { data: group } = useQuery({ queryKey: ['product-variations', productId], queryFn: () => fetchProductVariations(productId) });
  const current = group?.members.find((member) => member.product_id === productId);
  if (!group || !current) return null;
  return <View style={styles.root}>
    {group.options.map((option) => <View key={option.id} style={styles.option}>
      <Text style={styles.label}>{option.name_ar}</Text>
      <View style={styles.values}>{option.values.map((value) => {
        const candidates = group.members.filter((member) => member.is_active && member.option_values[option.id] === value.id);
        const target = candidates.find((member) => group.options.every((other) => other.id === option.id ||
          member.option_values[other.id] === current.option_values[other.id])) || candidates[0];
        const selected = current.option_values[option.id] === value.id;
        return <Pressable key={value.id} disabled={!target} accessibilityRole="radio"
          accessibilityLabel={`${option.name_ar}: ${value.name_ar}`} accessibilityState={{ selected, disabled: !target }}
          onPress={() => { if (target && target.product_id !== productId) router.replace({ pathname: '/product/[id]', params: { id: target.product_id } }); }}
          style={[styles.value, selected && styles.selected, !target && styles.disabled]}>
          {option.display_type === 'color' && value.color_hex && <View style={[styles.swatch, { backgroundColor: value.color_hex }]} />}
          {option.display_type === 'image' && value.image_url && <Image source={{ uri: value.image_url }} style={styles.image} resizeMode="contain" />}
          <Text style={styles.valueText}>{value.name_ar}</Text>
        </Pressable>;
      })}</View>
    </View>)}
  </View>;
}

const styles = StyleSheet.create({
  root: { marginVertical: 12 }, option: { marginBottom: 12 },
  label: { fontSize: 15, fontWeight: '600', textAlign: 'right', marginBottom: 8, color: '#26383b' },
  values: { flexDirection: 'row-reverse', flexWrap: 'wrap', gap: 8 },
  value: { flexDirection: 'row-reverse', alignItems: 'center', gap: 8, minHeight: 44, maxWidth: '100%', paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: '#d3d3d3', borderRadius: 6, backgroundColor: '#ffffff' },
  selected: { borderColor: '#7b4a56', backgroundColor: '#fff2f5' }, disabled: { opacity: 0.4 },
  valueText: { flexShrink: 1, fontSize: 14, color: '#26383b', textAlign: 'right' },
  swatch: { width: 22, height: 22, borderRadius: 11, borderWidth: 1, borderColor: '#bbb' },
  image: { width: 36, height: 36 },
});
