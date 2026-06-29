import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

export default function SignupScreen() {
  const router = useRouter();
  const signup = useAppStore((s) => s.signup);
  const isLoading = useAppStore((s) => s.isLoading);
  const setLoading = useAppStore((s) => s.setLoading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'mobile' | 'password' | null>(null);

  const handleSignup = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await signup(name || 'Citizen', email || 'user@civicai.com', mobile || '+91 9876543210', password || '123456');
    setLoading(false);
    router.replace('/');
  };

  return (
    <ScreenLayout>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>Create Account</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          <Text style={s.tagline}>Join the Civic Connect Platform</Text>

          <GlassCard style={s.form} borderColor="rgba(201,168,76,0.22)" glowColor="rgba(201,168,76,0.12)" intensity={45} padding={24}>
            <TextInput
              style={[s.input, focusedField === 'name' && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
              placeholder="Full Name"
              placeholderTextColor={colors.muted}
              value={name}
              onChangeText={setName}
              onFocus={() => setFocusedField('name')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Full name input"
            />
            <TextInput
              style={[s.input, focusedField === 'email' && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
              placeholder="Email Address"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setFocusedField('email')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Email address input"
            />
            <TextInput
              style={[s.input, focusedField === 'mobile' && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
              placeholder="Mobile Number"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
              value={mobile}
              onChangeText={setMobile}
              onFocus={() => setFocusedField('mobile')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Mobile number input"
            />
            <TextInput
              style={[s.input, focusedField === 'password' && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
              placeholder="Password"
              placeholderTextColor={colors.muted}
              secureTextEntry
              value={password}
              onChangeText={setPassword}
              onFocus={() => setFocusedField('password')}
              onBlur={() => setFocusedField(null)}
              accessibilityLabel="Password input"
            />

            <Pressable
              style={[s.btn, isLoading && { opacity: 0.6 }]}
              onPress={handleSignup}
              disabled={isLoading}
              accessibilityLabel="Create account"
              accessibilityRole="button"
            >
              {isLoading ? (
                <ActivityIndicator size="small" color={colors.navy} />
              ) : (
                <Text style={s.btnText}>Create Account</Text>
              )}
            </Pressable>

            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.back(); }}
              style={s.backLink}
              accessibilityLabel="Already have an account? Sign in"
            >
              <Text style={s.link}>Already have an account? Sign In</Text>
            </Pressable>
          </GlassCard>
        </View>
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: -0.5,
  },
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  tagline: {
    fontSize: 11,
    color: colors.gold,
    marginTop: 6,
    marginBottom: 24,
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontFamily: 'Sora_600SemiBold',
    textAlign: 'center',
  },
  form: {
    gap: 14,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },
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
    marginTop: 10,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.navy, fontFamily: 'Sora_700Bold' },
  backLink: { alignItems: 'center', marginTop: 12 },
  link: { fontSize: 13, color: colors.gold, fontWeight: '600', fontFamily: 'Sora_400Regular' },
});
