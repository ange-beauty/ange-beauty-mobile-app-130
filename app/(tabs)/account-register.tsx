import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import TurnstileWidget from '@/components/TurnstileWidget';
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
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [acceptedCommunicationConsent, setAcceptedCommunicationConsent] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState<string | null>(null);
  const [turnstileResetKey, setTurnstileResetKey] = useState(0);

  const handleRegister = async () => {
    const errors: Record<string, string> = {};

    if (!name.trim()) {
      errors.name = '\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628';
    }
    if (!email.trim()) {
      errors.email =
        '\u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0645\u0637\u0644\u0648\u0628';
    }
    if (!phone.trim()) {
      errors.phone =
        '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 \u0645\u0637\u0644\u0648\u0628';
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
    if (!acceptedTerms) {
      errors.acceptedTerms =
        '\u064a\u062c\u0628 \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0634\u0631\u0648\u0637 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645';
    }
    if (!acceptedCommunicationConsent) {
      errors.acceptedCommunicationConsent =
        '\u064a\u0631\u062c\u0649 \u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0645\u0648\u0627\u0641\u0642\u0629 \u0639\u0644\u0649 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064a\u062f \u0648\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0644\u0623\u063a\u0631\u0627\u0636 \u0627\u0644\u062a\u062d\u0642\u0642 \u0648\u0627\u0644\u062a\u0623\u0643\u064a\u062f';
    }
    if (!turnstileToken) {
      errors.turnstile =
        '\u064a\u0631\u062c\u0649 \u0625\u0643\u0645\u0627\u0644 \u0627\u0644\u062a\u062d\u0642\u0642 \u0623\u0648\u0644\u0627\u064b';
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
      consent_terms_accepted: acceptedTerms,
      consent_email_sms_opt_in: acceptedCommunicationConsent,
      security_token: turnstileToken,
    });
    setIsSubmitting(false);
    setTurnstileToken(null);
    setTurnstileResetKey((prev) => prev + 1);
    if (!result.success) {
      setFieldErrors({ email: result.message });
      return;
    }
    if (result.message) {
      Alert.alert('\u062a\u0645 \u0625\u0646\u0634\u0627\u0621 \u0627\u0644\u062d\u0633\u0627\u0628', result.message);
    }
    router.replace('/(tabs)/account');
  };

  return (
    <View style={styles.container}>
      <BrandedHeader topInset={insets.top} showBackButton={false} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 24 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
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
            style={[styles.input, fieldErrors.phone ? styles.inputErrorBorder : null]}
            value={phone}
            onChangeText={(value) => {
              setPhone(value);
              if (fieldErrors.phone) {
                setFieldErrors((prev) => ({ ...prev, phone: '' }));
              }
            }}
            placeholder={'\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641'}
            placeholderTextColor="#9AA39A"
            keyboardType="phone-pad"
            textAlign="right"
          />
          {fieldErrors.phone ? <Text style={styles.errorText}>{fieldErrors.phone}</Text> : null}
          <View style={[styles.passwordField, fieldErrors.password ? styles.inputErrorBorder : null]}>
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowPassword((prev) => !prev)}
              hitSlop={8}
            >
              <Feather name={showPassword ? 'eye-off' : 'eye'} size={18} color="#6B6B6B" />
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
          <View
            style={[styles.passwordField, fieldErrors.confirmPassword ? styles.inputErrorBorder : null]}
          >
            <Pressable
              style={styles.passwordToggle}
              onPress={() => setShowConfirmPassword((prev) => !prev)}
              hitSlop={8}
            >
              <Feather name={showConfirmPassword ? 'eye-off' : 'eye'} size={18} color="#6B6B6B" />
            </Pressable>
            <TextInput
              style={styles.passwordInput}
              value={confirmPassword}
              onChangeText={(value) => {
                setConfirmPassword(value);
                if (fieldErrors.confirmPassword) {
                  setFieldErrors((prev) => ({ ...prev, confirmPassword: '' }));
                }
              }}
              placeholder={'\u062a\u0623\u0643\u064a\u062f \u0643\u0644\u0645\u0629 \u0627\u0644\u0645\u0631\u0648\u0631'}
              placeholderTextColor="#9AA39A"
              secureTextEntry={!showConfirmPassword}
              textAlign="right"
            />
          </View>
          {fieldErrors.confirmPassword ? (
            <Text style={styles.errorText}>{fieldErrors.confirmPassword}</Text>
          ) : null}

          <Pressable
            style={styles.checkboxRow}
            onPress={() => {
              setAcceptedTerms((prev) => !prev);
              if (fieldErrors.acceptedTerms) {
                setFieldErrors((prev) => ({ ...prev, acceptedTerms: '' }));
              }
            }}
          >
            <View style={[styles.checkboxBox, acceptedTerms ? styles.checkboxBoxChecked : null]}>
              {acceptedTerms ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.checkboxText}>
              {'\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0634\u0631\u0648\u0637 \u0648\u0623\u062d\u0643\u0627\u0645 \u0627\u0644\u0627\u0633\u062a\u062e\u062f\u0627\u0645'}
            </Text>
          </Pressable>
          {fieldErrors.acceptedTerms ? <Text style={styles.errorText}>{fieldErrors.acceptedTerms}</Text> : null}

          <Pressable
            style={styles.checkboxRow}
            onPress={() => {
              setAcceptedCommunicationConsent((prev) => !prev);
              if (fieldErrors.acceptedCommunicationConsent) {
                setFieldErrors((prev) => ({ ...prev, acceptedCommunicationConsent: '' }));
              }
            }}
          >
            <View
              style={[
                styles.checkboxBox,
                acceptedCommunicationConsent ? styles.checkboxBoxChecked : null,
              ]}
            >
              {acceptedCommunicationConsent ? <Feather name="check" size={14} color="#FFFFFF" /> : null}
            </View>
            <Text style={styles.checkboxText}>
              {
                '\u0623\u0648\u0627\u0641\u0642 \u0639\u0644\u0649 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0639\u0628\u0631 \u0627\u0644\u0628\u0631\u064a\u062f \u0627\u0644\u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a \u0648\u0627\u0644\u0631\u0633\u0627\u0626\u0644 \u0627\u0644\u0646\u0635\u064a\u0629 \u0644\u0623\u063a\u0631\u0627\u0636 \u0627\u0644\u062a\u062d\u0642\u0642 \u0645\u0646 \u0627\u0644\u062d\u0633\u0627\u0628 \u0648\u062a\u0623\u0643\u064a\u062f \u0627\u0644\u0637\u0644\u0628\u0627\u062a \u0648\u0627\u0644\u0627\u0645\u062a\u062b\u0627\u0644'
              }
            </Text>
          </Pressable>
          {fieldErrors.acceptedCommunicationConsent ? (
            <Text style={styles.errorText}>{fieldErrors.acceptedCommunicationConsent}</Text>
          ) : null}
          <TurnstileWidget
            action="register"
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
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F6F8F4',
  },
  scroll: {
    flex: 1,
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
  passwordField: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8DD',
    backgroundColor: '#FAFCF8',
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  passwordInput: {
    flex: 1,
    color: '#1A1A1A',
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
  checkboxRow: {
    flexDirection: 'row-reverse',
    alignItems: 'flex-start',
    gap: 10,
    marginTop: 4,
  },
  checkboxBox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#B7C3B0',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxBoxChecked: {
    backgroundColor: '#1A1A1A',
    borderColor: '#1A1A1A',
  },
  checkboxText: {
    flex: 1,
    color: '#2A2A2A',
    fontSize: 13,
    lineHeight: 20,
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

