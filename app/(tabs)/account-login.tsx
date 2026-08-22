import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import FloralBackdrop from '@/components/FloralBackdrop';
import TurnstileWidget from '@/components/TurnstileWidget';
import { useAuth } from '@/contexts/AuthContext';

const appLogo = require('@/assets/images/icon.png');

export default function AccountLoginScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const handleLogin = async () => {
    const errors: Record<string, string> = {};

    if (!email.trim()) {
      errors.email =
        '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0645\u0637\u0644\u0648\u0628';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (email.trim() && !emailRegex.test(email.trim())) {
      errors.email =
        '\u064a\u0631\u062c\u0649 \u0625\u062f\u062e\u0627\u0644 \u0628\u0631\u064a\u062f \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0635\u062d\u064a\u062d';
    }
    if (!password.trim()) {
      errors.password =
        '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628\u0629';
    }
    if (!turnstileToken) {
      errors.turnstile =
        '\u064a\u0631\u062c\u0649 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062a\u062d\u0642\u0642 \u0623\u0648\u0644\u0627\u064b';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    const result = await login(email, password, turnstileToken);
    setTurnstileToken(null);
    setTurnstileResetKey((prev) => prev + 1);
    setIsSubmitting(false);

    if (!result.success) {
      setFieldErrors({ email: result.message });
      return;
    }

    router.replace('/(tabs)/account');
  };

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 28, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.brandBlock}>
          <Image source={appLogo} style={styles.logo} resizeMode="contain" />
          <Text style={styles.brandTitle}>{'\u0623\u0646\u062c \u0628\u064a\u0648\u062a\u064a'}</Text>
          <Text style={styles.motto}>{'\u0623\u0646\u062c \u0628\u064a\u0648\u062a\u064a \u062c\u0645\u0627\u0644 \u0645\u0644\u0627\u0626\u0643\u064a'}</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>{'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644'}</Text>
          <TextInput
            style={[styles.input, fieldErrors.email ? styles.inputErrorBorder : null]}
            value={email}
            onChangeText={(value) => {
              setEmail(value);
              if (fieldErrors.email) {
                setFieldErrors((prev) => ({ ...prev, email: '' }));
              }
            }}
            placeholder={'\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a'}
            placeholderTextColor="#9AA39A"
            keyboardType="email-address"
            autoCapitalize="none"
            textAlign="right"
          />
          {fieldErrors.email ? <Text style={styles.errorText}>{fieldErrors.email}</Text> : null}

          <View style={[styles.passwordField, fieldErrors.password ? styles.inputErrorBorder : null]}>
            <Pressable
              onPress={() => setShowPassword((prev) => !prev)}
              style={styles.passwordToggle}
              hitSlop={8}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#7F6A6F" />
            </Pressable>
            <TextInput
              style={styles.passwordInput}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              placeholder={'\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631'}
              placeholderTextColor="#9AA39A"
              secureTextEntry={!showPassword}
              textAlign="right"
            />
          </View>
          {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}

          <Pressable onPress={() => router.push('/forgot-password')} hitSlop={8}>
            <Text style={styles.forgotPasswordText}>
              {'\u0646\u0633\u064a\u062a \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631\u061f'}
            </Text>
          </Pressable>

          <TurnstileWidget
            action="login"
            resetKey={turnstileResetKey}
            onTokenChange={(token) => {
              setTurnstileToken(token);
              if (token && fieldErrors.turnstile) {
                setFieldErrors((prev) => ({ ...prev, turnstile: '' }));
              }
            }}
          />
          {fieldErrors.turnstile ? <Text style={styles.errorText}>{fieldErrors.turnstile}</Text> : null}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleLogin}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{'\u062f\u062e\u0648\u0644'}</Text>
            )}
          </Pressable>

          <Pressable
            style={({ pressed }) => [styles.secondaryButton, pressed && styles.buttonPressed]}
            onPress={() => router.push('/(tabs)/account-register')}
          >
            <Text style={styles.secondaryButtonText}>
              {'\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f'}
            </Text>
          </Pressable>
          {router.canGoBack() ? (
            <Pressable style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]} onPress={() => router.back()}>
              <Text style={styles.backButtonText}>{'\u0631\u062c\u0648\u0639'}</Text>
            </Pressable>
          ) : null}
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
  scroll: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    padding: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  brandBlock: {
    width: '100%',
    maxWidth: 380,
    alignItems: 'center',
    marginBottom: 18,
  },
  logo: {
    width: 116,
    height: 116,
  },
  brandTitle: {
    marginTop: 10,
    fontSize: 30,
    lineHeight: 38,
    color: '#7E4A53',
    fontWeight: '700',
    fontFamily: 'Tajawal-Bold',
    textAlign: 'center',
  },
  motto: {
    marginTop: 2,
    fontSize: 15,
    color: '#6D5B5F',
    fontWeight: '700',
    textAlign: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#2F2527',
    textAlign: 'center',
    marginBottom: 8,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    padding: 14,
    gap: 10,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 12,
    color: '#2F2527',
    textAlign: 'right',
  },
  passwordField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: '#2F2527',
    textAlign: 'right',
  },
  passwordToggle: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  inputErrorBorder: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#B9442B',
    fontSize: 13,
    textAlign: 'right',
  },
  forgotPasswordText: {
    color: '#7E4A53',
    fontSize: 14,
    fontWeight: '700',
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
  backButton: {
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButtonText: {
    color: '#7F6A6F',
    fontSize: 14,
    fontWeight: '700',
  },
  buttonPressed: {
    opacity: 0.75,
  },
});
