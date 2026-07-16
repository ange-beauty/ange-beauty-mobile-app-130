import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { beautyTheme } from '@/constants/uiTheme';
import { useAuth } from '@/contexts/AuthContext';

type BrandedHeaderProps = {
  topInset?: number;
  showBackButton?: boolean;
  showSearch?: boolean;
  showContact?: boolean;
  floating?: boolean;
};

export default function BrandedHeader({
  topInset = 0,
  showBackButton = true,
  showSearch = true,
  showContact = true,
  floating = false,
}: BrandedHeaderProps) {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const canGoBack = showBackButton && router.canGoBack();

  return (
    <View style={[styles.container, floating && styles.floating, { paddingTop: topInset + 10 }]}>
      {canGoBack ? (
        <Pressable style={styles.iconButton} onPress={() => router.back()}>
          <Feather name="arrow-right" size={20} color="#2F2527" />
        </Pressable>
      ) : isAuthenticated ? (
        <Pressable style={styles.iconButton} onPress={() => router.push('/(tabs)/account')}>
          <Feather name="bell" size={19} color="#2F2527" />
        </Pressable>
      ) : null}

      {showSearch ? (
        <Pressable
          style={styles.searchPill}
          onPress={() => router.push({ pathname: '/(tabs)/products', params: { focusSearch: '1' } })}
        >
          <Feather name="search" size={22} color={beautyTheme.colors.accentDark} />
          <Text style={styles.searchText}>{'\u0628\u062d\u062b \u0639\u0646 COSRX'}</Text>
        </Pressable>
      ) : (
        <View style={styles.searchPillPlaceholder} />
      )}

      {showContact ? (
        <Pressable style={styles.iconButton} onPress={() => router.push('/contact')}>
          <Feather name="message-circle" size={20} color="#2F2527" />
        </Pressable>
      ) : (
        <View style={styles.iconButton} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'transparent',
    paddingHorizontal: 18,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    zIndex: 20,
  },
  floating: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  iconButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.92)',
    borderWidth: 1,
    borderColor: 'rgba(226, 177, 192, 0.45)',
    shadowColor: '#7A3A54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  searchPill: {
    flex: 1,
    height: 42,
    borderRadius: 21,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 248, 250, 0.94)',
    borderWidth: 1,
    borderColor: 'rgba(226, 177, 192, 0.58)',
    shadowColor: '#7A3A54',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 3,
  },
  searchPillPlaceholder: {
    flex: 1,
  },
  searchText: {
    flex: 1,
    color: '#5B5054',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
    writingDirection: 'rtl',
    paddingHorizontal: 10,
  },
});
