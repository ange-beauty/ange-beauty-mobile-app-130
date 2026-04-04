import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';

import BrandedHeader from '@/components/BrandedHeader';
import { useAuth } from '@/contexts/AuthContext';
import { verifyEmailToken } from '@/services/auth';

type VerificationState = 'idle' | 'loading' | 'success' | 'error';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { token } = useLocalSearchParams<{ token?: string }>();
  const { refreshSession } = useAuth();
  const [state, setState] = useState<VerificationState>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function runVerification() {
      const tokenValue = (token || '').toString().trim();
      if (!tokenValue) {
        if (!cancelled) {
          setState('error');
          setMessage('\u0631\u0627\u0628\u0637 \u0627\u0644\u062a\u0641\u0639\u064a\u0644 \u063a\u064a\u0631 \u0635\u0627\u0644\u062d \u0623\u0648 \u0646\u0627\u0642\u0635.');
        }
        return;
      }

      if (!cancelled) {
        setState('loading');
        setMessage('');
      }

      try {
        const result = await verifyEmailToken(tokenValue);
        await refreshSession();

        if (cancelled) return;

        setState('success');
        setMessage(
          result?.message ||
            '\u062a\u0645 \u062a\u0641\u0639\u064a\u0644 \u0628\u0631\u064a\u062f\u0643 \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0628\u0646\u062c\u0627\u062d.'
        );
      } catch (error: any) {
        if (cancelled) return;
        setState('error');
        setMessage(
          error?.body?.message ||
            error?.message ||
            '\u062a\u0639\u0630\u0631 \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f. \u0642\u062f \u064a\u0643\u0648\u0646 \u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0633\u062a\u062e\u062f\u0645\u0627\u064b \u0623\u0648 \u0645\u0646\u062a\u0647\u064a\u0627\u064b.'
        );
      }
    }

    runVerification();
    return () => {
      cancelled = true;
    };
  }, [token, refreshSession]);

  return (
    <View style={styles.container}>
      <BrandedHeader />
      <View style={styles.content}>
        <View style={styles.card}>
          {state === 'loading' ? (
            <>
              <ActivityIndicator size="large" color="#1A1A1A" />
              <Text style={styles.title}>{'\u062c\u0627\u0631\u064a \u062a\u0641\u0639\u064a\u0644 \u0627\u0644\u0628\u0631\u064a\u062f...'}</Text>
            </>
          ) : state === 'success' ? (
            <>
              <Feather name="check-circle" size={54} color="#2E7D32" />
              <Text style={styles.title}>{'\u062a\u0645 \u0627\u0644\u062a\u0641\u0639\u064a\u0644'}</Text>
              <Text style={styles.message}>{message}</Text>
            </>
          ) : (
            <>
              <Feather name="x-circle" size={54} color="#C62828" />
              <Text style={styles.title}>{'\u062a\u0639\u0630\u0631 \u0627\u0644\u062a\u0641\u0639\u064a\u0644'}</Text>
              <Text style={styles.message}>{message}</Text>
            </>
          )}

          <View style={styles.actions}>
            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.replace('/(tabs)/account')}
            >
              <Text style={styles.primaryButtonText}>{'\u0627\u0644\u0630\u0647\u0627\u0628 \u0625\u0644\u0649 \u062d\u0633\u0627\u0628\u064a'}</Text>
            </Pressable>
            <Pressable
              style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
              onPress={() => router.replace('/(tabs)/home')}
            >
              <Text style={styles.secondaryButtonText}>{'\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u0627\u0644\u0631\u0626\u064a\u0633\u064a\u0629'}</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F4',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAE1',
    padding: 18,
    alignItems: 'center',
    gap: 10,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111111',
    textAlign: 'center',
  },
  message: {
    fontSize: 14,
    color: '#4C544A',
    textAlign: 'center',
    lineHeight: 21,
  },
  actions: {
    width: '100%',
    marginTop: 8,
    gap: 8,
  },
  primaryButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
    alignItems: 'center',
    justifyContent: 'center',
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
    borderColor: '#D7DED1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
