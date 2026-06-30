import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { t } from '../i18n';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [focusedField, setFocusedField] = useState(false);

  const handleSend = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setSent(true);
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.content}>
          <View style={s.header}>
            <BackButton />
            <View style={{ width: 40 }} />
          </View>

            <GlassCard
              style={s.form}
              borderColor="rgba(201,168,76,0.22)"
              glowColor="rgba(201,168,76,0.12)"
              intensity={45}
              padding={24}
            >
              <Text style={s.title}>{t('forgotPassword.title')}</Text>
              <Text style={s.subtitle}>
                {sent
                  ? t('forgotPassword.sentText')
                  : t('forgotPassword.description')}
              </Text>

              {!sent ? (
                <>
                  <View style={s.inputContainer}>
                    <Text style={s.label}>{t('forgotPassword.email')}</Text>
                    <TextInput
                      style={[s.input, focusedField && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                      placeholder="you@email.com"
                      placeholderTextColor={colors.muted}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      value={email}
                      onChangeText={setEmail}
                      onFocus={() => setFocusedField(true)}
                      onBlur={() => setFocusedField(false)}
                      accessibilityLabel="Email for password reset"
                    />
                  </View>

                  <Pressable style={s.btn} onPress={handleSend} accessibilityLabel="Send reset email" accessibilityRole="button">
                    <Text style={s.btnText}>{t('forgotPassword.send')}</Text>
                  </Pressable>
                </>
              ) : (
                  <Pressable style={s.btn} onPress={() => router.push('/login')} accessibilityLabel="Back to login" accessibilityRole="button">
                    <Text style={s.btnText}>{t('forgotPassword.backToLogin')}</Text>
                </Pressable>
              )}

              <Pressable onPress={() => router.push('/signup')} style={{ alignItems: 'center', marginTop: 12 }}>
                <Text style={s.link}>{t('forgotPassword.noAccount')}</Text>
              </Pressable>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 20,
    left: 20,
    right: 20,
  },
  form: {
    gap: 16,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
    fontFamily: 'Sora_800ExtraBold',
  },
  subtitle: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    lineHeight: 20,
    fontFamily: 'Sora_400Regular',
  },
  inputContainer: { gap: 6 },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_400Regular' },
  input: {
    backgroundColor: 'rgba(17,34,54,0.6)',
    borderRadius: 14,
    padding: 16,
    fontSize: 15,
    color: colors.text,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    fontFamily: 'Sora_400Regular',
  },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.navy, fontFamily: 'Sora_700Bold' },
  link: { fontSize: 13, color: colors.gold, fontWeight: '600', fontFamily: 'Sora_400Regular' },
});
