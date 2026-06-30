import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { t } from '../i18n';

export default function EditProfileScreen() {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const updateProfile = useAppStore((s) => s.updateProfile);

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [mobile, setMobile] = useState(user?.mobile || '');
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const handleSave = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    updateProfile({ name, email, mobile });
    setSaved(true);
    setTimeout(() => router.back(), 1200);
  };

  return (
    <ScreenLayout edges={['top', 'bottom']}>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>{t('editProfile.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={s.content} showsVerticalScrollIndicator={false}>
          <GlassCard
            borderColor="rgba(201,168,76,0.22)"
            glowColor="rgba(201,168,76,0.08)"
            padding={24}
            radius={20}
          >
            <View style={s.inputGroup}>
              <Text style={s.label}>{t('editProfile.name')}</Text>
              <TextInput
                style={[s.input, focusedField === 'name' && { borderColor: colors.gold }]}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor={colors.muted}
                accessibilityLabel="Full name"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>{t('editProfile.email')}</Text>
              <TextInput
                style={[s.input, focusedField === 'email' && { borderColor: colors.gold }]}
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor={colors.muted}
                accessibilityLabel="Email address"
              />
            </View>

            <View style={s.inputGroup}>
              <Text style={s.label}>{t('editProfile.mobile')}</Text>
              <TextInput
                style={[s.input, focusedField === 'mobile' && { borderColor: colors.gold }]}
                value={mobile}
                onChangeText={setMobile}
                keyboardType="phone-pad"
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
                placeholderTextColor={colors.muted}
                accessibilityLabel="Mobile number"
              />
            </View>

            <Pressable
              style={[s.btn, saved && { backgroundColor: colors.green }]}
              onPress={handleSave}
              accessibilityLabel="Save changes"
            >
              <Text style={s.btnText}>{saved ? `✓ ${t('editProfile.saved')}` : t('editProfile.save')}</Text>
            </Pressable>
          </GlassCard>
        </ScrollView>
      </KeyboardAvoidingView>
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
  content: { padding: 20, gap: 16, flexGrow: 1 },
  inputGroup: { gap: 6 },
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
});
