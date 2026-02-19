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

export default function RegisterScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleRegister = async () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = '\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628';
    }
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
    } else if (password.trim().length < 6) {
      errors.password =
        '\u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u064a\u062c\u0628 \u0623\u0646 \u062a\u0643\u0648\u0646 \u0639\u0644\u0649 \u0627\u0644\u0623\u0642\u0644 6 \u0623\u062d\u0631\u0641';
    }
    if (!confirmPassword.trim()) {
      errors.confirmPassword =
        '\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631 \u0645\u0637\u0644\u0648\u0628';
    } else if (password !== confirmPassword) {
      errors.confirmPassword =
        '\u0643\u0644\u0645\u062a\u0627 \u0627\u0644\u0645\u0631\u0648\u0631 \u063a\u064a\u0631 \u0645\u062a\u0637\u0627\u0628\u0642\u062a\u064a\u0646';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    const result = await register({
      name,
      email,
      password,
      phone,
    });
    setIsSubmitting(false);
    if (!result.success) {
      setFieldErrors({ email: result.message });
      return;
    }
    router.replace('/(tabs)/account');
  };

  return (
    <View style={styles.container}>
      <BrandedHeader topInset={insets.top} />

      <View style={styles.content}>
        <Text style={styles.title}>{'\u0625\u0646\u0634\u0627\u0621 \u062d\u0633\u0627\u0628 \u062c\u062f\u064a\u062f'}</Text>

        <View style={styles.card}>
          <TextInput
            style={[styles.input, fieldErrors.name ? styles.inputErrorBorder : null]}
            value={name}
            onChangeText={(value) => {
              setName(value);
              if (fieldErrors.name) {
                setFieldErrors((prev) => ({ ...prev, name: '' }));
              }
            }}
            placeholder={'\u0627\u0644\u0627\u0633\u0645 \u0627\u0644\u0643\u0627\u0645\u0644'}
            placeholderTextColor="#9AA39A"
            textAlign="right"
          />
          {fieldErrors.name ? <Text style={styles.errorText}>{fieldErrors.name}</Text> : null}
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
            style={styles.input}
            value={phone}
            onChangeText={setPhone}
            placeholder={'\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 (\u0627\u062e\u062a\u064a\u0627\u0631\u064a)'}
            placeholderTextColor="#9AA39A"
            keyboardType="phone-pad"
            textAlign="right"
          />
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
          <TextInput
            style={[styles.input, fieldErrors.confirmPassword ? styles.inputErrorBorder : null]}
            value={confirmPassword}
            onChangeText={(value) => {
              setConfirmPassword(value);
              if (fieldErrors.confirmPassword) {
                setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
              }
            }}
            placeholder={'\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631'}
            placeholderTextColor="#9AA39A"
            secureTextEntry
            textAlign="right"
          />
          {fieldErrors.confirmPassword ? (
            <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
          ) : null}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleRegister}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>
                {'\u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628'}
              </Text>
            )}
          </Pressable>
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
    padding: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#121212',
    textAlign: 'right',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5EAE1',
    padding: 14,
    gap: 10,
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
  buttonPressed: {
    opacity: 0.75,
  },
});
