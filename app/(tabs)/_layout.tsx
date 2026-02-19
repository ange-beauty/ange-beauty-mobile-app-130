import { Tabs } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

import { useBasket } from '@/contexts/BasketContext';

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
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: '#1A1A1A',
        tabBarInactiveTintColor: '#999',
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopWidth: 1,
          borderTopColor: '#F0F0F0',
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: '\u0627\u0643\u062a\u0634\u0641',
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={28} />,
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
        name="favorites"
        options={{
          title: '\u0627\u0644\u0645\u0641\u0636\u0644\u0627\u062a',
          tabBarIcon: ({ color, size }) => <Feather name="heart" color={color} size={28} />,
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
        name="orders"
        options={{
          title: '\u0627\u0644\u0637\u0644\u0628\u0627\u062a',
          tabBarIcon: ({ color, size }) => <Feather name="file-text" color={color} size={28} />,
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
  badge: {
    position: 'absolute' as const,
    right: -8,
    top: -4,
    backgroundColor: '#FF3B30',
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
