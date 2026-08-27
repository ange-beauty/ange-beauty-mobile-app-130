import { useRouter } from 'expo-router';
import React, { useEffect, useState } from 'react';
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
import FloralBackdrop from '@/components/FloralBackdrop';
import { useAuth } from '@/contexts/AuthContext';

export default function AccountProfileScreen() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { user, isAuthenticated, updateProfile } = useAuth();
  const [firstName, setFirstName] = useState('');
  const [telephone, setTelephone] = useState('');
  const [addressLine, setAddressLine] = useState('');
  const [addressComplement, setAddressComplement] = useState('');
  const [city, setCity] = useState('');
  const [provence, setProvence] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!isAuthenticated || !user) {
      router.replace('/(tabs)/account');
      return;
    }

    setFirstName(user.firstName || '');
    setTelephone(user.phone || '');
    setAddressLine(user.addressLine || '');
    setAddressComplement(user.addressComplement || '');
    setCity(user.city || '');
    setProvence(user.provence || '');
  }, [isAuthenticated, router, user]);

  const handleSave = async () => {
    const errors: Record<string, string> = {};

    if (!firstName.trim()) {
      errors.firstName = '\u0627\u0644\u0627\u0633\u0645 \u0645\u0637\u0644\u0648\u0628';
    }
    if (!telephone.trim()) {
      errors.telephone = '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641 \u0645\u0637\u0644\u0648\u0628';
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setIsSubmitting(true);
    const result = await updateProfile({
      first_name: firstName,
      telephone,
      address_line: addressLine,
      address_complement: addressComplement,
      city,
      provence,
    });
    setIsSubmitting(false);

    if (!result.success) {
      Alert.alert('\u062e\u0637\u0623', result.message);
      return;
    }

    Alert.alert(
      '\u062a\u0645 \u0627\u0644\u062d\u0641\u0638',
      '\u062a\u0645 \u062a\u062d\u062f\u064a\u062b \u0628\u064a\u0627\u0646\u0627\u062a\u0643 \u0628\u0646\u062c\u0627\u062d'
    );
    router.back();
  };

  const fields = [
    {
      key: 'firstName',
      label: '\u0627\u0644\u0627\u0633\u0645',
      value: firstName,
      onChange: setFirstName,
      placeholder: '\u0627\u0644\u0627\u0633\u0645',
      keyboardType: 'default' as const,
    },
    {
      key: 'telephone',
      label: '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641',
      value: telephone,
      onChange: setTelephone,
      placeholder: '\u0631\u0642\u0645 \u0627\u0644\u0647\u0627\u062a\u0641',
      keyboardType: 'phone-pad' as const,
    },
    {
      key: 'provence',
      label: '\u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0629',
      value: provence,
      onChange: setProvence,
      placeholder: '\u0623\u062f\u062e\u0644\u064a \u0627\u0644\u0645\u062d\u0627\u0641\u0638\u0629',
      keyboardType: 'default' as const,
    },
    {
      key: 'city',
      label: '\u0627\u0644\u0645\u062f\u064a\u0646\u0629',
      value: city,
      onChange: setCity,
      placeholder: '\u0623\u062f\u062e\u0644\u064a \u0627\u0644\u0645\u062f\u064a\u0646\u0629',
      keyboardType: 'default' as const,
    },
    {
      key: 'addressLine',
      label: '\u0627\u0644\u0639\u0646\u0648\u0627\u0646',
      value: addressLine,
      onChange: setAddressLine,
      placeholder: '\u0623\u062f\u062e\u0644\u064a \u0627\u0644\u0639\u0646\u0648\u0627\u0646',
      keyboardType: 'default' as const,
    },
    {
      key: 'addressComplement',
      label: '\u0623\u0642\u0631\u0628 \u0646\u0642\u0637\u0629 \u062f\u0627\u0644\u0629',
      value: addressComplement,
      onChange: setAddressComplement,
      placeholder: '\u0645\u062b\u0627\u0644: \u0642\u0631\u0628 \u0627\u0644\u0645\u062f\u0631\u0633\u0629 \u0623\u0648 \u0627\u0644\u0633\u0648\u0642',
      keyboardType: 'default' as const,
    },
  ] as const;

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showBackButton />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 120 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>{'\u0645\u0639\u0644\u0648\u0645\u0627\u062a\u064a \u0627\u0644\u0634\u062e\u0635\u064a\u0629'}</Text>
        <View style={styles.card}>
          <Text style={styles.emailLabel}>{user?.email || ''}</Text>

          {fields.map((field) => (
            <View key={field.key} style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>{field.label}</Text>
              <TextInput
                style={[styles.input, fieldErrors[field.key] ? styles.inputErrorBorder : null]}
                value={field.value}
                onChangeText={(value) => {
                  field.onChange(value);
                  if (fieldErrors[field.key]) {
                    setFieldErrors((prev) => ({ ...prev, [field.key]: '' }));
                  }
                }}
                placeholder={field.placeholder}
                placeholderTextColor="#9AA39A"
                keyboardType={field.keyboardType}
                textAlign="right"
              />
              {fieldErrors[field.key] ? <Text style={styles.errorText}>{fieldErrors[field.key]}</Text> : null}
            </View>
          ))}

          <Pressable
            style={({ pressed }) => [styles.primaryButton, pressed && styles.buttonPressed]}
            onPress={handleSave}
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color="#FFF" />
            ) : (
              <Text style={styles.primaryButtonText}>{'\u062d\u0641\u0638 \u0627\u0644\u062a\u063a\u064a\u064a\u0631\u0627\u062a'}</Text>
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
    backgroundColor: '#F9F3F4',
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
    color: '#2F2527',
    textAlign: 'right',
    marginBottom: 14,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8DCDD',
    padding: 14,
    gap: 10,
  },
  emailLabel: {
    fontSize: 13,
    color: '#7F6A6F',
    textAlign: 'right',
    marginBottom: 4,
  },
  fieldGroup: {
    gap: 6,
  },
  fieldLabel: {
    color: '#4C3B3F',
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'right',
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
  inputErrorBorder: {
    borderColor: '#E53935',
  },
  errorText: {
    color: '#B9442B',
    fontSize: 13,
    textAlign: 'right',
    marginTop: 4,
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
  buttonPressed: {
    opacity: 0.75,
  },
});
