import React from 'react';
import { StyleSheet, View, Text, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { LANGUAGES, t } from '../i18n';
import type { LanguageCode } from '../i18n';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

export default function LanguageSelectScreen() {
  const router = useRouter();
  const currentLanguage = useAppStore((s) => s.language);
  const setLanguage = useAppStore((s) => s.setLanguage);

  const handleSelect = (code: LanguageCode) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setLanguage(code);
    setTimeout(() => router.back(), 200);
  };

  return (
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>{t('settings.language')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
        <GlassCard borderColor="rgba(255,255,255,0.08)" padding={4} radius={20}>
          {LANGUAGES.map((lang, i) => {
            const isActive = currentLanguage === lang.code;
            const isLast = i === LANGUAGES.length - 1;
            return (
              <Pressable
                key={lang.code}
                onPress={() => handleSelect(lang.code)}
                style={[s.row, isLast && { borderBottomWidth: 0 }]}
              >
                <View style={s.langInfo}>
                  <Text style={[s.langName, isActive && { color: colors.gold }]}>{lang.nativeLabel}</Text>
                  <Text style={s.langLabel}>{lang.label}</Text>
                </View>
                {isActive && (
                  <View style={s.checkmark}>
                    <Text style={s.checkmarkText}>✓</Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </GlassCard>
      </View>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  content: { padding: 24 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 18,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  langInfo: { gap: 2 },
  langName: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  langLabel: { fontSize: 12, color: colors.muted, fontFamily: 'Sora_400Regular' },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gold,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: { fontSize: 14, fontWeight: '800', color: colors.navy },
});
