import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

const logoImage = require('@/assets/images/icon.png');
const whatsappIconUri = 'https://upload.wikimedia.org/wikipedia/commons/thumb/6/6b/WhatsApp.svg/1024px-WhatsApp.svg.png';

type BrandedHeaderProps = {
  topInset?: number;
  showBackButton?: boolean;
};

export default function BrandedHeader({ topInset = 0, showBackButton = true }: BrandedHeaderProps) {
  const router = useRouter();
  const canGoBack = showBackButton && router.canGoBack();

  return (
    <View style={[styles.container, { paddingTop: topInset + 10 }]}>
      {canGoBack ? (
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="arrow-left" size={20} color="#1A1A1A" />
        </Pressable>
      ) : (
        <View style={styles.iconSpacer} />
      )}

      <View style={styles.center}>
        <Image source={logoImage} style={styles.logo} resizeMode="contain" />
        <Text style={styles.brandText}>{'\u0623\u0646\u062c \u0628\u064a\u0648\u062a\u064a'}</Text>
      </View>

      <View style={styles.rightActions}>
        <Pressable style={styles.chatBubbleButton}>
          <Feather name="message-circle" color="#AFC0B4" size={20} />
          <View style={styles.whatsappBadge}>
            <Image source={{ uri: whatsappIconUri }} style={styles.whatsappIcon} resizeMode="contain" />
          </View>
        </Pressable>
        <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/products')}>
          <Feather name="search" size={20} color="#1A1A1A" />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1E9',
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F4F6F1',
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 44,
    height: 44,
  },
  brandText: {
    marginTop: 2,
    fontSize: 18,
    color: '#121212',
    fontWeight: '700',
  },
  iconSpacer: {
    width: 88,
    height: 40,
  },
  chatBubbleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#1C2A24',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#3F6B59',
    position: 'relative' as const,
  },
  whatsappBadge: {
    position: 'absolute' as const,
    bottom: -3,
    left: -3,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#111',
  },
  whatsappIcon: {
    width: 10,
    height: 10,
  },
});
