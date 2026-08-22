import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import BrandedHeader from '@/components/BrandedHeader';
import { forgotPassword } from '@/services/auth';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function submit() {
    const value = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
      setError('\u0623\u062f\u062e\u0644 \u0628\u0631\u064a\u062f\u0627\u064b \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a\u0627\u064b \u0635\u062d\u064a\u062d\u0627\u064b');
      return;
    }

    setError('');
    setIsSubmitting(true);
    try {
      await forgotPassword(value);
      setSubmitted(true);
    } catch {
      setError('\u062a\u0639\u0630\u0631 \u0625\u0631\u0633\u0627\u0644 \u0627\u0644\u0637\u0644\u0628 \u062d\u0627\u0644\u064a\u0627\u064b. \u062d\u0627\u0648\u0644 \u0645\u0631\u0629 \u0623\u062e\u0631\u0649.');
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <BrandedHeader />
      <View style={styles.content}>
        <View style={styles.card}>
          <Feather name={submitted ? 'mail' : 'key'} size={42} color="#7E4A53" />
          <Text style={styles.title}>
            {'\u0627\u0633\u062a\u0639\u0627\u062f\u0629 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631'}
          </Text>

          {submitted ? (
            <Text style={styles.message}>
              {'\u0625\u0630\u0627 \u0643\u0627\u0646 \u0627\u0644\u0628\u0631\u064a\u062f \u0645\u0631\u062a\u0628\u0637\u0627\u064b \u0628\u062d\u0633\u0627\u0628\u060c \u0623\u0631\u0633\u0644\u0646\u0627 \u0631\u0627\u0628\u0637\u0627\u064b \u0644\u0625\u0639\u0627\u062f\u0629 \u062a\u0639\u064a\u064a\u0646 \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631. \u0633\u064a\u0641\u062a\u062d \u0627\u0644\u0631\u0627\u0628\u0637 \u0645\u0648\u0642\u0639 \u0623\u0646\u062c \u0628\u064a\u0648\u062a\u064a.'}
            </Text>
          ) : (
            <>
              <Text style={styles.message}>
                {'\u0623\u062f\u062e\u0644 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0627\u0644\u0645\u0631\u062a\u0628\u0637 \u0628\u062d\u0633\u0627\u0628\u0643.'}
              </Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setError('');
                }}
                placeholder={'\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a'}
                placeholderTextColor="#9AA39A"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                textAlign="right"
              />
              {error ? <Text style={styles.error}>{error}</Text> : null}
              <Pressable
                style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}
                onPress={submit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#FFFFFF" />
                ) : (
                  <Text style={styles.primaryButtonText}>
                    {'\u0625\u0631\u0633\u0627\u0644 \u0631\u0627\u0628\u0637 \u0627\u0644\u0627\u0633\u062a\u0639\u0627\u062f\u0629'}
                  </Text>
                )}
              </Pressable>
            </>
          )}

          <Pressable style={styles.secondaryButton} onPress={() => router.back()}>
            <Text style={styles.secondaryButtonText}>{'\u0627\u0644\u0639\u0648\u062f\u0629 \u0625\u0644\u0649 \u062a\u0633\u062c\u064a\u0644 \u0627\u0644\u062f\u062e\u0648\u0644'}</Text>
          </Pressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9F3F4' },
  content: { flex: 1, justifyContent: 'center', padding: 18 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    padding: 18,
    alignItems: 'center',
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: '700', color: '#2F2527', textAlign: 'center' },
  message: { color: '#6D5B5F', fontSize: 15, lineHeight: 24, textAlign: 'right', width: '100%' },
  input: {
    width: '100%',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    backgroundColor: '#FFF8FA',
    paddingHorizontal: 12,
    color: '#2F2527',
  },
  error: { color: '#B9442B', fontSize: 13, textAlign: 'right', width: '100%' },
  primaryButton: {
    width: '100%',
    height: 46,
    borderRadius: 12,
    backgroundColor: '#7E4A53',
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: { minHeight: 44, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  secondaryButtonText: { color: '#7E4A53', fontSize: 14, fontWeight: '700' },
  pressed: { opacity: 0.75 },
});
