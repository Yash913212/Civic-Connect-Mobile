import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, TextInput, Pressable, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { t } from '../i18n';

function EntryView({ delay = 0, style, children }: { delay?: number; style?: any; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[style, aStyle]}>{children}</Animated.View>;
}

export default function SignupScreen() {
  const router = useRouter();
  const signup = useAppStore((s) => s.signup);
  const isLoading = useAppStore((s) => s.isLoading);
  const setLoading = useAppStore((s) => s.setLoading);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    if (!name || !email || !mobile || !password) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setLoading(true);
    await signup(name, email, mobile, password);
    setLoading(false);
    router.replace('/');
  };

  return (
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>{t('signup.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={s.formWrap}>
          <EntryView delay={150}>
          <GlassCard borderColor="rgba(201,168,76,0.22)" glowColor="rgba(201,168,76,0.12)" intensity={45} padding={24} radius={20}>
            <View style={s.inputGroup}>
              <Text style={s.label}>{t('signup.name')}</Text>
              <TextInput style={s.input} value={name} onChangeText={setName} placeholderTextColor={colors.muted} accessibilityLabel="Full name" />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.label}>{t('signup.email')}</Text>
              <TextInput style={s.input} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" placeholderTextColor={colors.muted} accessibilityLabel="Email" />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.label}>{t('signup.mobile')}</Text>
              <TextInput style={s.input} value={mobile} onChangeText={setMobile} keyboardType="phone-pad" placeholderTextColor={colors.muted} accessibilityLabel="Mobile" />
            </View>
            <View style={s.inputGroup}>
              <Text style={s.label}>{t('signup.password')}</Text>
              <TextInput style={s.input} value={password} onChangeText={setPassword} secureTextEntry placeholderTextColor={colors.muted} accessibilityLabel="Password" />
            </View>

            <Pressable style={s.btn} onPress={handleSignup} disabled={isLoading}>
              {isLoading ? <ActivityIndicator size="small" color={colors.navy} /> : <Text style={s.btnText}>{t('signup.signUp')}</Text>}
            </Pressable>

            <Pressable onPress={() => router.push('/login')} style={{ alignItems: 'center', marginTop: 16 }}>
              <Text style={s.link}>{t('signup.haveAccount')}</Text>
            </Pressable>
          </GlassCard>
          </EntryView>
        </View>
      </KeyboardAvoidingView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  formWrap: { flex: 1, padding: 24, justifyContent: 'center' },
  inputGroup: { gap: 6, marginBottom: 14 },
  label: { fontSize: 12, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_400Regular' },
  input: { backgroundColor: 'rgba(17,34,54,0.6)', borderRadius: 14, padding: 16, fontSize: 15, color: colors.text, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', fontFamily: 'Sora_400Regular' },
  btn: { backgroundColor: colors.gold, borderRadius: 14, paddingVertical: 16, alignItems: 'center', shadowColor: colors.gold, shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8, elevation: 4 },
  btnText: { fontSize: 16, fontWeight: '700', color: colors.navy, fontFamily: 'Sora_700Bold' },
  link: { fontSize: 13, color: colors.gold, fontWeight: '600', fontFamily: 'Sora_400Regular' },
});
