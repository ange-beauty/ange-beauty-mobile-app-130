import { Tabs, useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useBasket } from '@/contexts/BasketContext';
import { beautyTheme } from '@/constants/uiTheme';

function BasketTabIcon({ color, size }: { color: string; size: number }) {
  const { totalItems } = useBasket();

  return (
    <View>
      <Feather name="shopping-bag" color={color} size={size} />
      {totalItems > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{totalItems > 99 ? '99+' : totalItems}</Text>
        </View>
      )}
    </View>
  );
}

export default function TabLayout() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: beautyTheme.colors.accentDark,
        tabBarInactiveTintColor: '#9A8A8E',
        headerShown: false,
        tabBarHideOnKeyboard: true,
        tabBarBackground: () =>
          Platform.OS === 'web' ? (
            <View pointerEvents="none" style={styles.tabBackgroundWeb} />
          ) : (
            <BlurView pointerEvents="none" intensity={55} tint="light" style={styles.tabBackgroundNative} />
          ),
        tabBarStyle: {
          position: 'absolute',
          left: 12,
          right: 12,
          bottom: bottomInset,
          borderRadius: 24,
          borderTopWidth: 0,
          height: 64 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 8,
          backgroundColor: 'transparent',
          overflow: 'hidden',
          shadowColor: '#7A5A62',
          shadowOffset: { width: 0, height: 8 },
          shadowOpacity: 0.16,
          shadowRadius: 14,
          elevation: 8,
        },
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: '600',
        },
        tabBarItemStyle: {
          minHeight: 56,
          paddingHorizontal: 4,
          paddingTop: 2,
        },
        sceneStyle: {
          backgroundColor: 'transparent',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          href: '/(tabs)/home',
          title: '\u0627\u0643\u062a\u0634\u0641',
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={28} />,
        }}
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            router.replace('/(tabs)/home');
          },
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: '\u0627\u0644\u0645\u0646\u062a\u062c\u0627\u062a',
          tabBarIcon: ({ color, size }) => <Feather name="grid" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="basket"
        options={{
          title: '\u0627\u0644\u0633\u0644\u0629',
          tabBarIcon: ({ color, size }) => <BasketTabIcon color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="store"
        options={{
          title: '\u0627\u0644\u0645\u062a\u062c\u0631',
          tabBarIcon: ({ color, size }) => <Feather name="map-pin" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="orders"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: '\u062d\u0633\u0627\u0628\u064a',
          tabBarIcon: ({ color, size }) => <Feather name="user" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="account-register"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBackgroundNative: {
    flex: 1,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(232, 220, 221, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.72)',
  },
  tabBackgroundWeb: {
    flex: 1,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(232, 220, 221, 0.85)',
    backgroundColor: 'rgba(255, 255, 255, 0.82)',
  },
  badge: {
    position: 'absolute' as const,
    right: -8,
    top: -4,
    backgroundColor: beautyTheme.colors.accent,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    paddingHorizontal: 4,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  badgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '700' as const,
    textAlign: 'center' as const,
  },
});
