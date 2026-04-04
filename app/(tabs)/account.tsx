import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import { useAuth } from '@/contexts/AuthContext';
import { useBasket } from '@/contexts/BasketContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useSellingPoint } from '@/contexts/SellingPointContext';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, logout, resendEmailVerification } = useAuth();
  const { totalItems } = useBasket();
  const { favorites } = useFavorites();
  const { selectedSellingPoint } = useSellingPoint();
  const [isResendingVerification, setIsResendingVerification] = useState(false);

  const handleResendVerification = async () => {
    setIsResendingVerification(true);
    const result = await resendEmailVerification();
    setIsResendingVerification(false);

    Alert.alert(
      result.success
        ? '\u062a\u0645 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0631\u0633\u0627\u0644\u0629'
        : '\u062e\u0637\u0623',
      result.message
    );
  };

  const displayName = user?.name?.trim() || '\u0632\u0627\u0626\u0631';
  const avatarText = displayName.charAt(0).toUpperCase();
  const stats = [
    {
      key: 'favorites',
      title: '\u0627\u0644\u0645\u0641\u0636\u0644\u0627\u062a',
      value: favorites.length.toString(),
      route: '/(tabs)/favorites',
    },
    {
      key: 'basket',
      title: '\u0627\u0644\u0633\u0644\u0629',
      value: totalItems.toString(),
      route: '/(tabs)/basket',
    },
    {
      key: 'orders',
      title: '\u0637\u0644\u0628\u0627\u062a\u064a',
      value: '\u2014',
      route: '/(tabs)/orders',
    },
  ];
  const profileLinks = [
    {
      key: 'profile',
      label: '\u0645\u0639\u0644\u0648\u0645\u0627\u062a\u064a \u0627\u0644\u0634\u062e\u0635\u064a\u0629',
      icon: 'user',
      route: isAuthenticated ? '/(tabs)/account-profile' : null,
      subtitle: isAuthenticated ? user?.email || '' : '',
    },
    {
      key: 'store',
      label: '\u0645\u062a\u062c\u0631\u064a \u0627\u0644\u0645\u0641\u0636\u0644',
      icon: 'map-pin',
      route: '/(tabs)/store',
      subtitle: selectedSellingPoint?.name_ar || '\u0644\u0645 \u064a\u062a\u0645 \u0627\u062e\u062a\u064a\u0627\u0631 \u0645\u062a\u062c\u0631',
    },
    {
      key: 'favorites',
      label: '\u0627\u0644\u0645\u0641\u0636\u0644\u0627\u062a',
      icon: 'heart',
      route: '/(tabs)/favorites',
      subtitle: '\u0645\u0634\u0627\u0647\u062f\u0629 \u0645\u0646\u062a\u062c\u0627\u062a\u0643 \u0627\u0644\u0645\u062d\u0641\u0648\u0638\u0629',
    },
    {
      key: 'orders',
      label: '\u0637\u0644\u0628\u0627\u062a\u064a',
      icon: 'star',
      route: '/(tabs)/orders',
      subtitle: '\u0645\u062a\u0627\u0628\u0639\u0629 \u062d\u0627\u0644\u0629 \u0627\u0644\u0637\u0644\u0628\u0627\u062a',
    },
  ] as const;
  const visibleProfileLinks = useMemo(
    () =>
      profileLinks.filter((item) => {
        if (isAuthenticated) {
          return true;
        }

        return !['profile', 'favorites', 'orders'].includes(item.key);
      }),
    [isAuthenticated]
  );
  const guestActions = useMemo(
    () => [
      {
        key: 'login',
        label: '\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644',
        onPress: () => router.push('/(tabs)/account-login'),
        variant: 'primary' as const,
      },
      {
        key: 'register',
        label: '\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f',
        onPress: () => router.push('/(tabs)/account-register'),
        variant: 'secondary' as const,
      },
    ],
    [router]
  );

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showBackButton={false} />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} showsVerticalScrollIndicator={false}>
        {isAuthenticated ? (
          <View style={styles.heroCard}>
            <View style={styles.avatarCircle}>
              <Text style={styles.avatarText}>{avatarText}</Text>
            </View>
            <Text style={styles.heroName}>{displayName}</Text>
            <View style={styles.statsRow}>
              {stats.map((item) => (
                <Pressable
                  key={item.key}
                  style={({ pressed }) => [styles.statPill, pressed && styles.buttonPressed]}
                  onPress={() => router.push(item.route as any)}
                >
                  <Text style={styles.statValue}>{item.value}</Text>
                  <Text style={styles.statTitle}>{item.title}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="#1A1A1A" />
          </View>
        ) : isAuthenticated && user ? (
          <View style={styles.loginCard}>
            {!user.emailVerified ? (
              <View style={styles.unverifiedCard}>
                <Text style={styles.verificationTitle}>
                  {'\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u063a\u064a\u0631 \u0645\u0641\u0639\u0644'}
                </Text>
                <Text style={styles.verificationSubtitle}>
                  {'\u0644\u0627 \u064a\u0645\u0643\u0646 \u0625\u062a\u0645\u0627\u0645 \u0627\u0644\u0637\u0644\u0628 \u0642\u0628\u0644 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f.'}
                </Text>
                <Pressable
                  style={({ pressed }) => [
                    styles.verifyButton,
                    pressed && styles.buttonPressed,
                  ]}
                  onPress={handleResendVerification}
                  disabled={isResendingVerification}
                >
                  {isResendingVerification ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Text style={styles.verifyButtonText}>
                      {'\u0625\u0639\u0627\u062f\u0629 \u0625\u0631\u0633\u0627\u0644 \u0631\u0633\u0627\u0644\u0629 \u0627\u0644\u062a\u0641\u0639\u064a\u0644'}
                    </Text>
                  )}
                </Pressable>
              </View>
            ) : null}
            <Pressable
              style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
              onPress={logout}
            >
              <Feather name="log-out" size={18} color="#FFF" />
              <Text style={styles.logoutButtonText}>{'\u062a\u0633\u062c\u064a\u0644 \u062e\u0631\u0648\u062c'}</Text>
            </Pressable>
          </View>
        ) : (
          <View style={styles.loginCard}>
            <Text style={styles.sectionTitle}>{'\u0627\u0644\u062f\u062e\u0648\u0644 \u0625\u0644\u0649 \u062d\u0633\u0627\u0628\u0643'}</Text>
            <Text style={styles.guestDescription}>
              {'\u0627\u0646\u062a\u0642\u0644 \u0625\u0644\u0649 \u0634\u0627\u0634\u0629 \u0645\u062e\u0635\u0635\u0629 \u0644\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644 \u0623\u0648 \u0623\u0646\u0634\u0626 \u062d\u0633\u0627\u0628\u0627\u064b \u062c\u062f\u064a\u062f\u0627\u064b.'}
            </Text>

            {guestActions.map((action) => (
              <Pressable
                key={action.key}
                style={({ pressed }) => [
                  action.variant === 'primary' ? styles.primaryButton : styles.secondaryButton,
                  pressed && styles.buttonPressed,
                ]}
                onPress={action.onPress}
              >
                <Text
                  style={
                    action.variant === 'primary'
                      ? styles.primaryButtonText
                      : styles.secondaryButtonText
                  }
                >
                  {action.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        <View style={styles.menuSection}>
          {visibleProfileLinks.map((item) => (
            <Pressable
              key={item.key}
              style={({ pressed }) => [styles.menuRow, pressed && styles.buttonPressed]}
              onPress={() => item.route && router.push(item.route as any)}
            >
              <Feather name="heart" size={18} color="#A76E78" />
              <View style={styles.menuTextWrap}>
                <Text style={styles.menuLabel}>{item.label}</Text>
                {!!item.subtitle && <Text style={styles.menuSubtitle}>{item.subtitle}</Text>}
              </View>
              <Feather name={item.icon as any} size={19} color="#7F6A6F" />
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9F3F4',
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 160,
  },
  heroCard: {
    backgroundColor: '#FFF8FA',
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#ECDDE0',
    padding: 14,
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarCircle: {
    width: 86,
    height: 86,
    borderRadius: 43,
    backgroundColor: '#F1DFE3',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  avatarText: {
    fontSize: 30,
    fontWeight: '700',
    color: '#7E4A53',
  },
  heroName: {
    marginTop: 10,
    fontSize: 32,
    color: '#3C2B2E',
    fontWeight: '700',
    fontFamily: 'serif',
    textAlign: 'center',
  },
  statsRow: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    minWidth: 96,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCDD',
    paddingVertical: 8,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#7E4A53',
  },
  statTitle: {
    marginTop: 3,
    fontSize: 13,
    color: '#6D5B5F',
    fontWeight: '600',
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loginCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F2527',
    textAlign: 'right',
    marginBottom: 4,
  },
  guestDescription: {
    fontSize: 14,
    lineHeight: 22,
    color: '#6D5B5F',
    textAlign: 'right',
  },
  primaryButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7E4A53',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  secondaryButton: {
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4D2D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#4B383D',
    fontSize: 14,
    fontWeight: '600',
  },
  unverifiedCard: {
    borderWidth: 1,
    borderColor: '#F0C6CC',
    backgroundColor: '#FFF2F4',
    borderRadius: 12,
    padding: 10,
    gap: 6,
  },
  verificationTitle: {
    color: '#A3384A',
    fontSize: 14,
    fontWeight: '700',
    textAlign: 'right',
  },
  verificationSubtitle: {
    color: '#7F4D56',
    fontSize: 13,
    textAlign: 'right',
  },
  verifyButton: {
    marginTop: 4,
    height: 40,
    borderRadius: 10,
    backgroundColor: '#7E4A53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  verifyButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  logoutButton: {
    marginTop: 6,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#3B2A2E',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  menuSection: {
    marginTop: 14,
    gap: 10,
  },
  menuRow: {
    minHeight: 64,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8DCDD',
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  menuTextWrap: {
    flex: 1,
    marginHorizontal: 10,
    alignItems: 'flex-end',
  },
  menuLabel: {
    fontSize: 18,
    color: '#3A2A2E',
    fontWeight: '700',
    fontFamily: 'serif',
    textAlign: 'right',
  },
  menuSubtitle: {
    marginTop: 2,
    fontSize: 12,
    color: '#8E7A7F',
    textAlign: 'right',
  },
  buttonPressed: {
    opacity: 0.75,
  },
});

