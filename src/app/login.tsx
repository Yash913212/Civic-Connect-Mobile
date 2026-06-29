import React, { useState } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { colors } from '../theme/colors';

export default function LoginScreen() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const isLoading = useAppStore((s) => s.isLoading);
  const setLoading = useAppStore((s) => s.setLoading);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('user@civicai.com');
  const [password, setPassword] = useState('123456');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await login(email || 'user@civicai.com', password);
    setLoading(false);
    router.replace('/');
  };

  return (
    <View style={s.container}>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.content}>
            <View style={s.logoWrap}>
              <Image 
                source={require('../../assets/images/civic_logo_transparent.png')} 
                style={{ width: 260, height: 200, marginBottom: -20 }} 
                contentFit="contain" 
              />
            </View>

            <GlassCard
              style={[s.form]}
              borderColor="rgba(201,168,76,0.22)"
              glowColor="rgba(201,168,76,0.12)"
              intensity={45}
              padding={24}
            >
              {/* Premium Role Selector */}
              <View style={s.roleSelector}>
                  <Pressable
                    style={[s.roleTab, role === 'user' && s.roleTabActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setRole('user');
                      setEmail('user@civicai.com');
                      setPassword('123456');
                    }}
                    accessibilityLabel="Sign in as citizen"
                    accessibilityRole="button"
                  >
                    <Text style={[s.roleTabText, role === 'user' && s.roleTabTextActive]}>👤 Citizen</Text>
                  </Pressable>
                  <Pressable
                    style={[s.roleTab, role === 'admin' && s.roleTabActive]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      setRole('admin');
                      setEmail('admin@civicai.com');
                      setPassword('admin123');
                    }}
                    accessibilityLabel="Sign in as admin"
                    accessibilityRole="button"
                  >
                    <Text style={[s.roleTabText, role === 'admin' && s.roleTabTextActive]}>🏛️ Admin</Text>
                  </Pressable>
              </View>

              <View style={s.inputContainer}>
                <Text style={s.label}>Email Address</Text>
                  <TextInput
                    style={[s.input, focusedField === 'email' && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                    placeholder="you@email.com"
                    placeholderTextColor={colors.muted}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    value={email}
                    onChangeText={setEmail}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel="Email address input"
                  />
              </View>

              <View style={s.inputContainer}>
                <Text style={s.label}>Password</Text>
                  <TextInput
                    style={[s.input, focusedField === 'password' && { borderColor: colors.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                    placeholder="••••••••"
                    placeholderTextColor={colors.muted}
                    secureTextEntry
                    value={password}
                    onChangeText={setPassword}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    accessibilityLabel="Password input"
                  />
              </View>


              <Pressable style={[s.btn, isLoading && { opacity: 0.6 }]} onPress={handleLogin} disabled={isLoading} accessibilityLabel={role === 'admin' ? 'Launch admin control' : 'Sign in'} accessibilityRole="button">
                {isLoading ? (
                  <ActivityIndicator size="small" color={colors.navy} />
                ) : (
                  <Text style={s.btnText}>
                    {role === 'admin' ? 'Launch Admin Control' : 'Sign In'}
                  </Text>
                )}
              </Pressable>

              <Pressable style={s.googleBtn} onPress={handleLogin} accessibilityLabel="Continue with Google" accessibilityRole="button">
                <Text style={s.googleText}>🔑  Continue with Google</Text>
              </Pressable>

              <View style={s.links}>
                <Pressable onPress={() => router.push('/signup')} accessibilityLabel="Forgot password"><Text style={s.link}>Forgot Password?</Text></Pressable>
                <Pressable onPress={() => router.push('/signup')} accessibilityLabel="Create new account"><Text style={s.link}>Create Account</Text></Pressable>
              </View>
            </GlassCard>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>

  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  content: { flex: 1, padding: 28, justifyContent: 'center' },
  logoWrap: { alignItems: 'center', marginBottom: 40 },
  logo: { fontSize: 44, fontWeight: '800', color: colors.text, letterSpacing: -1, fontFamily: 'Sora_800ExtraBold' },
  tagline: { fontSize: 11, color: colors.gold, marginTop: 6, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Sora_600SemiBold' },
  form: {
    gap: 16,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },

  roleSelector: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 14,
    padding: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 8
  },
  roleTab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 10
  },
  roleTabActive: {
    backgroundColor: colors.gold,
  },
  roleTabText: {
    fontSize: 13,
    color: colors.muted,
    fontWeight: '700',
    fontFamily: 'Sora_700Bold'
  },
  roleTabTextActive: {
    color: colors.navy,
  },
  inputContainer: { gap: 6 },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_400Regular' },
  input: { backgroundColor: 'rgba(17,34,54,0.6)', borderRadius: 14, padding: 16, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', fontFamily: 'Sora_400Regular' },
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
    elevation: 4
  },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.navy, fontFamily: 'Sora_700Bold' },
  googleBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', backgroundColor: 'rgba(255,255,255,0.02)' },
  googleText: { fontSize: 15, color: colors.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  link: { fontSize: 13, color: colors.gold, fontWeight: '600', fontFamily: 'Sora_400Regular' },
});
