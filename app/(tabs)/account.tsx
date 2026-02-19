import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isLoading, isAuthenticated, login, logout } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

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

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setIsSubmitting(true);
    setFieldErrors({});
    const result = await login(email, password);
    if (!result.success) {
      setFieldErrors({ email: result.message });
    }
    setIsSubmitting(false);
  };

  return (
    <View style={styles.container}>
      <BrandedHeader topInset={insets.top} />

      <View style={styles.content}>
        <Text style={styles.title}>{'\u062d\u0633\u0627\u0628\u064a'}</Text>

        {isLoading ? (
          <View style={styles.centerState}>
            <ActivityIndicator size="small" color="#1A1A1A" />
          </View>
        ) : isAuthenticated && user ? (
          <View style={styles.card}>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{'\u0627\u0644\u0627\u0633\u0645'}</Text>
              <Text style={styles.infoValue}>{user.name}</Text>
            </View>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>{'\u0627\u0644\u0628\u0631\u064a\u062f'}</Text>
              <Text style={styles.infoValue}>{user.email}</Text>
            </View>
            {user.phone ? (
              <View style={styles.infoRow}>
                <Text style={styles.infoLabel}>{'\u0627\u0644\u0647\u0627\u062a\u0641'}</Text>
                <Text style={styles.infoValue}>{user.phone}</Text>
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
          <View style={styles.card}>
            <Text style={styles.sectionTitle}>{'\u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644'}</Text>

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
            <TextInput
              style={[styles.input, fieldErrors.password ? styles.inputErrorBorder : null]}
              value={password}
              onChangeText={(value) => {
                setPassword(value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              placeholder={'\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631'}
              placeholderTextColor="#9AA39A"
              secureTextEntry
              textAlign="right"
            />
            {fieldErrors.password ? <Text style={styles.errorText}>{fieldErrors.password}</Text> : null}

            <Pressable
              style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
              onPress={handleLogin}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator size="small" color="#FFF" />
              ) : (
                <Text style={styles.primaryButtonText}>
                  {'\u062f\u062e\u0648\u0644'}
                </Text>
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
          </View>
        )}
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
    textAlign: 'right',
    marginBottom: 14,
  },
  centerState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAE1',
    padding: 14,
    gap: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111',
    textAlign: 'right',
    marginBottom: 4,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8DD',
    backgroundColor: '#FAFCF8',
    paddingHorizontal: 12,
    color: '#1A1A1A',
  },
  inputErrorBorder: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#B9442B',
    fontSize: 13,
    textAlign: 'right',
  },
  primaryButton: {
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
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
    borderColor: '#D7DED1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryButtonText: {
    color: '#1A1A1A',
    fontSize: 14,
    fontWeight: '600',
  },
  infoRow: {
    borderBottomWidth: 1,
    borderBottomColor: '#EEF1EA',
    paddingBottom: 8,
  },
  infoLabel: {
    fontSize: 12,
    color: '#6F776E',
    textAlign: 'right',
  },
  infoValue: {
    marginTop: 3,
    fontSize: 15,
    color: '#1A1A1A',
    fontWeight: '600',
    textAlign: 'right',
  },
  logoutButton: {
    marginTop: 8,
    height: 46,
    borderRadius: 12,
    backgroundColor: '#1A1A1A',
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
  buttonPressed: {
    opacity: 0.75,
  },
});
