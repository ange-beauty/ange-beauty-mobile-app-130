import { Feather } from '@expo/vector-icons';
import React from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import BrandedHeader from '@/components/BrandedHeader';
import FloralBackdrop from '@/components/FloralBackdrop';
import { beautyTheme } from '@/constants/uiTheme';

const CONTACT_PHONE = '+212638624446';
const CONTACT_EMAIL = 'support@angebeauty.net';
const CONTACT_WHATSAPP = '212638624446';

export default function ContactScreen() {
  const insets = useSafeAreaInsets();

  const openLink = async (url: string) => {
    try {
      await Linking.openURL(url);
    } catch {
      // noop
    }
  };

  return (
    <View style={styles.container}>
      <FloralBackdrop subtle />
      <BrandedHeader topInset={insets.top} showSearch={false} showContact={false} />

      <View style={styles.content}>
        <Text style={styles.title}>{'\u062a\u0648\u0627\u0635\u0644 \u0645\u0639\u0646\u0627'}</Text>
        <Text style={styles.subtitle}>
          {'\u0646\u062d\u0646 \u0647\u0646\u0627 \u0644\u0645\u0633\u0627\u0639\u062f\u062a\u0643. \u0627\u062e\u062a\u0631 \u0637\u0631\u064a\u0642\u0629 \u0627\u0644\u062a\u0648\u0627\u0635\u0644 \u0627\u0644\u0645\u0646\u0627\u0633\u0628\u0629.'}
        </Text>

        <Pressable style={styles.contactCard} onPress={() => openLink(`tel:${CONTACT_PHONE}`)}>
          <View style={styles.leadingGroup}>
            <View style={styles.iconWrap}>
              <Feather name="phone" size={18} color={beautyTheme.colors.accentDark} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{'\u0627\u062a\u0635\u0627\u0644 \u0647\u0627\u062a\u0641\u064a'}</Text>
              <Text style={styles.cardValue}>{CONTACT_PHONE}</Text>
            </View>
          </View>
          <Feather name="chevron-left" size={18} color="#9A8A8E" style={styles.trailingArrow} />
        </Pressable>

        <Pressable style={styles.contactCard} onPress={() => openLink(`https://wa.me/${CONTACT_WHATSAPP}`)}>
          <View style={styles.leadingGroup}>
            <View style={styles.iconWrap}>
              <Feather name="message-circle" size={18} color={beautyTheme.colors.accentDark} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{'\u0648\u0627\u062a\u0633\u0627\u0628'}</Text>
              <Text style={styles.cardValue}>{'\u062a\u062d\u062f\u062b \u0645\u0639 \u062e\u062f\u0645\u0629 \u0627\u0644\u0639\u0645\u0644\u0627\u0621'}</Text>
            </View>
          </View>
          <Feather name="chevron-left" size={18} color="#9A8A8E" style={styles.trailingArrow} />
        </Pressable>

        <Pressable style={styles.contactCard} onPress={() => openLink(`mailto:${CONTACT_EMAIL}`)}>
          <View style={styles.leadingGroup}>
            <View style={styles.iconWrap}>
              <Feather name="mail" size={18} color={beautyTheme.colors.accentDark} />
            </View>
            <View style={styles.textWrap}>
              <Text style={styles.cardTitle}>{'\u0628\u0631\u064a\u062f \u0625\u0644\u0643\u062a\u0631\u0648\u0646\u064a'}</Text>
              <Text style={styles.cardValue}>{CONTACT_EMAIL}</Text>
            </View>
          </View>
          <Feather name="chevron-left" size={18} color="#9A8A8E" style={styles.trailingArrow} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: beautyTheme.colors.page,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 8,
    gap: 10,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
    color: beautyTheme.colors.accentDark,
    textAlign: 'right',
    fontWeight: '700',
    fontFamily: 'serif',
  },
  subtitle: {
    fontSize: 14,
    color: beautyTheme.colors.textMuted,
    textAlign: 'right',
    marginBottom: 8,
  },
  contactCard: {
    minHeight: 72,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    paddingHorizontal: 14,
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  leadingGroup: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F8F0F3',
    borderWidth: 1,
    borderColor: '#EBDDE1',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textWrap: {
    flex: 1,
    alignItems: 'flex-end',
  },
  cardTitle: {
    fontSize: 15,
    color: beautyTheme.colors.text,
    fontWeight: '700',
    textAlign: 'right',
  },
  cardValue: {
    marginTop: 2,
    fontSize: 13,
    color: beautyTheme.colors.textMuted,
    textAlign: 'right',
  },
  trailingArrow: {
    marginRight: 12,
  },
});
