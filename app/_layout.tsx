// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import React, { useEffect, useState, useRef } from "react";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { I18nManager, Platform, Animated, View, Image, StyleSheet, Dimensions, Text } from "react-native";
import Constants from 'expo-constants';

import { FavoritesContext } from "@/contexts/FavoritesContext";
import { BasketContext } from "@/contexts/BasketContext";
import { checkAppUpdateStatus } from "@/services/api";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();

function RootLayoutNav() {
  return (
    <Stack screenOptions={{ headerBackTitle: "Back" }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="product/[id]"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
    </Stack>
  );
}

function CustomSplashScreen({ onFinish }: { onFinish: () => void }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 400,
          useNativeDriver: true,
        }).start(() => {
          onFinish();
        });
      }, 1500);
    });
  }, [fadeAnim, scaleAnim, onFinish]);

  return (
    <View style={splashStyles.container}>
      <Animated.View
        style={[
          splashStyles.logoContainer,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <Image
          source={{ uri: 'https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rqerhironvgzmc9yhq77s' }}
          style={splashStyles.logo}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: Dimensions.get('window').width * 0.6,
    height: Dimensions.get('window').width * 0.6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logo: {
    width: '100%',
    height: '100%',
  },
});

const updateStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F8F0',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  messageBox: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  messageText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#2D3436',
    textAlign: 'center',
  },
  checkingText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#2D3436',
    textAlign: 'center',
  },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(true);
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(true);
  const [updateRequired, setUpdateRequired] = useState(false);

  useEffect(() => {
    if (!I18nManager.isRTL) {
      I18nManager.forceRTL(true);
      if (Platform.OS !== 'web') {
        I18nManager.allowRTL(true);
      }
    }
    SplashScreen.hideAsync();
  }, []);

  useEffect(() => {
    async function checkUpdate() {
      if (Platform.OS === 'web') {
        console.log('[RootLayout] Skipping update check for web platform');
        setIsCheckingUpdate(false);
        return;
      }
      const appVersion = Constants.expoConfig?.version || '1.0.0';
      console.log('[RootLayout] Checking for app updates... Current version:', appVersion);
      const isUpToDate = await checkAppUpdateStatus(appVersion);
      console.log('[RootLayout] Update check result:', isUpToDate);
      setUpdateRequired(!isUpToDate);
      setIsCheckingUpdate(false);
    }
    checkUpdate();
  }, []);

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isCheckingUpdate) {
    return (
      <View style={splashStyles.container}>
        <Text style={updateStyles.checkingText}>جاري التحقق...</Text>
      </View>
    );
  }

  if (updateRequired) {
    return (
      <View style={updateStyles.container}>
        <View style={updateStyles.messageBox}>
          <Text style={updateStyles.messageText}>الرجاء تحديث البرنامج</Text>
        </View>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <FavoritesContext>
        <BasketContext>
          <GestureHandlerRootView>
            <RootLayoutNav />
          </GestureHandlerRootView>
        </BasketContext>
      </FavoritesContext>
    </QueryClientProvider>
  );
}
