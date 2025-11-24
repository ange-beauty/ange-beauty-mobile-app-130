import { Tabs } from "expo-router";
import { Feather } from "@expo/vector-icons";
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { useBasket } from "@/contexts/BasketContext";

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
        headerShown: true,
        headerStyle: {
          backgroundColor: '#FFFFFF',
        },
        headerShadowVisible: false,
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
          title: "اكتشف",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <Feather name="home" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "المفضلات",
          tabBarIcon: ({ color, size }) => <Feather name="heart" color={color} size={28} />,
        }}
      />
      <Tabs.Screen
        name="basket"
        options={{
          title: "السلة",
          headerShown: false,
          tabBarIcon: ({ color, size }) => <BasketTabIcon color={color} size={28} />,
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
