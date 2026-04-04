// template
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import { Stack, useRouter } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useFonts } from "expo-font";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Animated,
  Dimensions,
  I18nManager,
  Image,
  Linking,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import Constants from "expo-constants";

import FloralBackdrop from "@/components/FloralBackdrop";
import { beautyTheme } from "@/constants/uiTheme";
import { AuthContext, useAuth } from "@/contexts/AuthContext";
import { BasketContext } from "@/contexts/BasketContext";
import { FavoritesContext } from "@/contexts/FavoritesContext";
import { SellingPointContext } from "@/contexts/SellingPointContext";
import { checkAppUpdateStatus } from "@/services/api";
import { registerForPushNotifications, registerPushTokenWithServer } from "@/services/notifications";

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

const queryClient = new QueryClient();
const PLAY_STORE_URL = "https://play.google.com/store/apps/details?id=app.ange.beauty.cosmetic";

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
      <Stack.Screen
        name="verify-email"
        options={{
          headerShown: false,
          presentation: "card",
        }}
      />
      <Stack.Screen
        name="contact"
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
  }, [fadeAnim, onFinish, scaleAnim]);

  return (
    <View style={splashStyles.container}>
      <FloralBackdrop subtle />
      <Animated.View
        style={[
          splashStyles.card,
          {
            opacity: fadeAnim,
            transform: [{ scale: scaleAnim }],
          },
        ]}
      >
        <View style={splashStyles.logoContainer}>
          <Image
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rqerhironvgzmc9yhq77s" }}
            style={splashStyles.logo}
            resizeMode="contain"
          />
        </View>
        <Text style={splashStyles.brandTitle}>{"\u0623\u0646\u062c \u0628\u064a\u0648\u062a\u064a"}</Text>
        <Text style={splashStyles.brandSubTitle}>
          {"\u062c\u0645\u0627\u0644\u0643 \u064a\u0628\u062f\u0623 \u0645\u0646 \u0647\u0646\u0627"}
        </Text>
      </Animated.View>
    </View>
  );
}

const splashStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: beautyTheme.colors.page,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 28,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderWidth: 1,
    borderColor: "#EBDDE1",
    paddingVertical: 30,
    paddingHorizontal: 20,
    alignItems: "center",
    shadowColor: "#7A5A62",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 14,
    elevation: 6,
  },
  logoContainer: {
    width: Dimensions.get("window").width * 0.32,
    height: Dimensions.get("window").width * 0.32,
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: "100%",
    height: "100%",
  },
  brandTitle: {
    marginTop: 10,
    color: beautyTheme.colors.accentDark,
    fontSize: 36,
    lineHeight: 42,
    fontWeight: "700",
    textAlign: "center",
    fontFamily: Platform.select({ ios: "Georgia", android: "serif", default: "Georgia" }),
  },
  brandSubTitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#7F6A6F",
    fontWeight: "600",
    textAlign: "center",
  },
});

const updateStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F0F8F0",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  messageBox: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 40,
    shadowColor: "#000",
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
    fontWeight: "700",
    color: "#2D3436",
    textAlign: "center",
  },
  checkingText: {
    fontSize: 20,
    fontWeight: "600",
    color: "#2D3436",
    textAlign: "center",
  },
  updateButton: {
    marginTop: 24,
    backgroundColor: "#1A1A1A",
    borderRadius: 12,
    paddingHorizontal: 24,
    paddingVertical: 14,
    alignItems: "center",
  },
  updateButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "700",
  },
});

const activationAlertStyles = StyleSheet.create({
  container: {
    backgroundColor: "#D53F3F",
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  title: {
    color: "#FFFFFF",
    fontWeight: "600",
    textAlign: "right",
    fontSize: 12,
  },
  link: {
    marginTop: 4,
    color: "#FFFFFF",
    textDecorationLine: "underline",
    textAlign: "right",
    fontSize: 12,
    fontWeight: "700",
  },
  shell: {
    flex: 1,
    direction: "rtl",
  },
  content: {
    flex: 1,
    direction: "rtl",
  },
});

export default function RootLayout() {
  const [showSplash, setShowSplash] = useState(Platform.OS !== "web");
  const [isCheckingUpdate, setIsCheckingUpdate] = useState(true);
  const [updateRequired, setUpdateRequired] = useState(false);
  const [updateCheckError, setUpdateCheckError] = useState<string | null>(null);
  const [fontsLoaded] = useFonts(Feather.font);
  const globalFontFamily = Platform.select({
    ios: "SF Pro Text",
    android: "sans-serif",
    default: "sans-serif",
  });
  const AnyText = Text as any;
  const AnyTextInput = TextInput as any;

  if (AnyText.defaultProps == null) AnyText.defaultProps = {};
  AnyText.defaultProps.style = [AnyText.defaultProps.style, { fontFamily: globalFontFamily }];
  if (AnyTextInput.defaultProps == null) AnyTextInput.defaultProps = {};
  AnyTextInput.defaultProps.style = [AnyTextInput.defaultProps.style, { fontFamily: globalFontFamily }];

  const handleUpdatePress = async () => {
    try {
      await Linking.openURL(PLAY_STORE_URL);
    } catch (error) {
      console.error("[RootLayout] Failed to open Play Store URL:", error);
    }
  };

  const runUpdateCheck = useCallback(async () => {
    if (Platform.OS === "web") {
      console.log("[RootLayout] Skipping update check for web platform");
      setIsCheckingUpdate(false);
      return;
    }

    const appVersion = Constants.expoConfig?.version || "1.0.0";
    console.log("[RootLayout] Checking for app updates... Current version:", appVersion);
    const result = await checkAppUpdateStatus(appVersion);
    console.log("[RootLayout] Update check result:", result);
    setUpdateRequired(result.status === "update_required");
    setUpdateCheckError(result.status === "network_error" ? result.message : null);
    setIsCheckingUpdate(false);
  }, []);

  useEffect(() => {
    if (Platform.OS !== "web") {
      I18nManager.allowRTL(true);
      I18nManager.swapLeftAndRightInRTL(true);
      if (!I18nManager.isRTL) {
        I18nManager.forceRTL(true);
      }
    }
    if (fontsLoaded) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  useEffect(() => {
    runUpdateCheck();
  }, [runUpdateCheck]);

  useEffect(() => {
    async function setupPushNotifications() {
      if (Platform.OS === "web") {
        console.log("[RootLayout] Skipping push notifications setup for web platform");
        return;
      }

      console.log("[RootLayout] Setting up push notifications...");
      const pushToken = await registerForPushNotifications();

      if (pushToken) {
        console.log("[RootLayout] Registering push token with server...");
        await registerPushTokenWithServer(pushToken);
      }
    }
    setupPushNotifications();
  }, []);

  if (!fontsLoaded) {
    return (
      <View style={splashStyles.container}>
        <View style={splashStyles.logoContainer}>
          <Image
            source={{ uri: "https://pub-e001eb4506b145aa938b5d3badbff6a5.r2.dev/attachments/rqerhironvgzmc9yhq77s" }}
            style={splashStyles.logo}
            resizeMode="contain"
          />
        </View>
      </View>
    );
  }

  if (showSplash) {
    return <CustomSplashScreen onFinish={() => setShowSplash(false)} />;
  }

  if (isCheckingUpdate) {
    return (
      <View style={splashStyles.container}>
        <Text style={updateStyles.checkingText}>{"\u062c\u0627\u0631\u064a \u0627\u0644\u062a\u062d\u0642\u0642..."}</Text>
      </View>
    );
  }

  if (updateRequired) {
    return (
      <View style={updateStyles.container}>
        <View style={updateStyles.messageBox}>
          <Text style={updateStyles.messageText}>
            {"\u0627\u0644\u0631\u062c\u0627\u0621 \u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0628\u0631\u0646\u0627\u0645\u062c"}
          </Text>
          <Pressable style={updateStyles.updateButton} onPress={handleUpdatePress}>
            <Text style={updateStyles.updateButtonText}>{"\u062a\u062d\u062f\u064a\u062b \u0627\u0644\u0622\u0646"}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  if (updateCheckError) {
    return (
      <View style={updateStyles.container}>
        <View style={updateStyles.messageBox}>
          <Text style={updateStyles.messageText}>{updateCheckError}</Text>
          <Pressable
            style={updateStyles.updateButton}
            onPress={() => {
              setIsCheckingUpdate(true);
              setUpdateCheckError(null);
              runUpdateCheck();
            }}
          >
            <Text style={updateStyles.updateButtonText}>
              {'\u0625\u0639\u0627\u062f\u0629 \u0627\u0644\u0645\u062d\u0627\u0648\u0644\u0629'}
            </Text>
          </Pressable>
        </View>
      </View>
    );
  }

  return (
    <QueryClientProvider client={queryClient}>
      <SellingPointContext>
        <AuthContext>
          <FavoritesContext>
            <BasketContext>
              <GestureHandlerRootView style={activationAlertStyles.shell}>
                <GlobalActivationAlert />
                <View style={activationAlertStyles.content}>
                  <RootLayoutNav />
                </View>
              </GestureHandlerRootView>
            </BasketContext>
          </FavoritesContext>
        </AuthContext>
      </SellingPointContext>
    </QueryClientProvider>
  );
}

function GlobalActivationAlert() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuth();

  if (!isAuthenticated || !user || user.emailVerified) {
    return null;
  }

  return (
    <View style={activationAlertStyles.container}>
      <Text style={activationAlertStyles.title}>
        {
          "\u0627\u0644\u062d\u0633\u0627\u0628 \u063a\u064a\u0631 \u0645\u0641\u0639\u0644. \u064a\u062c\u0628 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0642\u0628\u0644 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628."
        }
      </Text>
      <Pressable onPress={() => router.push("/(tabs)/account")}>
        <Text style={activationAlertStyles.link}>{"\u0627\u0641\u062a\u062d \u062d\u0633\u0627\u0628\u064a"}</Text>
      </Pressable>
    </View>
  );
}
