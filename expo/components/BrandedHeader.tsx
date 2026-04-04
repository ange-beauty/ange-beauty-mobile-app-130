import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Image, Platform, Pressable, StyleSheet, Text, View } from 'react-native';
import { beautyTheme } from '@/constants/uiTheme';

const logoImage = require('@/assets/images/icon.png');

type BrandedHeaderProps = {
  topInset?: number;
  showBackButton?: boolean;
  showSearch?: boolean;
  showContact?: boolean;
};

export default function BrandedHeader({
  topInset = 0,
  showBackButton = true,
  showSearch = true,
  showContact = true,
}: BrandedHeaderProps) {
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
        <View style={styles.actionSlot}>
          {showContact ? (
            <Pressable style={styles.iconButton} onPress={() => router.push('/contact')}>
              <Feather name="message-circle" size={20} color="#1A1A1A" />
            </Pressable>
          ) : (
            <View style={styles.iconSpacerSmall} />
          )}
        </View>
        <View style={styles.actionSlot}>
          {showSearch ? (
            <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/products')}>
              <Feather name="search" size={20} color="#1A1A1A" />
            </Pressable>
          ) : (
            <View style={styles.iconSpacerSmall} />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: beautyTheme.colors.iconBg,
    borderWidth: 1,
    borderColor: beautyTheme.colors.border,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  rightActions: {
    width: 92,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionSlot: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
  },
  brandText: {
    marginTop: 3,
    fontSize: 30,
    color: beautyTheme.colors.accentDark,
    fontWeight: '700',
    lineHeight: 36,
    fontFamily: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
  },
  iconSpacer: {
    width: 88,
    height: 40,
  },
  iconSpacerSmall: {
    width: 42,
    height: 42,
  },
});
