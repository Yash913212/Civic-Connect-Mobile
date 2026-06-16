import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Image } from 'expo-image';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';

const C = {
  navy:       '#05101E',
  surface:    '#0D1B2E',
  elevated:   '#112236',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.15)',
  goldBorder: 'rgba(201,168,76,0.35)',
  text:       '#FFFFFF',
  muted:      'rgba(255,255,255,0.40)',
  border:     'rgba(255,255,255,0.06)',
} as const;

const { width: SW, height: SH } = Dimensions.get('window');

function GlowingOrb({ color, startX, startY, delay }: { color: string; startX: number; startY: number; delay: number }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 260,
          height: 260,
          borderRadius: 130,
          backgroundColor: color,
          opacity: 0.08,
          left: startX,
          top: startY,
        },
        style,
      ]}
    />
  );
}

export default function LoginScreen() {
  const router = useRouter();
  const login = useAppStore((s) => s.login);
  const [role, setRole] = useState<'user' | 'admin'>('user');
  const [email, setEmail] = useState('user@civicconnect.com');
  const [password, setPassword] = useState('user123');
  const [focusedField, setFocusedField] = useState<'email' | 'password' | null>(null);

  const handleLogin = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    login(email || 'user@civicconnect.com', password);
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
                    setEmail('user@civicconnect.com');
                    setPassword('user123');
                  }}
                >
                  <Text style={[s.roleTabText, role === 'user' && s.roleTabTextActive]}>👤 Citizen</Text>
                </Pressable>
                <Pressable
                  style={[s.roleTab, role === 'admin' && s.roleTabActive]}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                    setRole('admin');
                    setEmail('admin@civicconnect.com');
                    setPassword('admin123');
                  }}
                >
                  <Text style={[s.roleTabText, role === 'admin' && s.roleTabTextActive]}>🏛️ Admin</Text>
                </Pressable>
              </View>

              <View style={s.inputContainer}>
                <Text style={s.label}>Email Address</Text>
                <TextInput
                  style={[s.input, focusedField === 'email' && { borderColor: C.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                  placeholder="you@email.com"
                  placeholderTextColor={C.muted}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  onFocus={() => setFocusedField('email')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>

              <View style={s.inputContainer}>
                <Text style={s.label}>Password</Text>
                <TextInput
                  style={[s.input, focusedField === 'password' && { borderColor: C.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                  placeholder="••••••••"
                  placeholderTextColor={C.muted}
                  secureTextEntry
                  value={password}
                  onChangeText={setPassword}
                  onFocus={() => setFocusedField('password')}
                  onBlur={() => setFocusedField(null)}
                />
              </View>


              <Pressable style={s.btn} onPress={handleLogin}>
                <Text style={s.btnText}>
                  {role === 'admin' ? 'Launch Admin Control' : 'Sign In'}
                </Text>
              </Pressable>

              <Pressable style={s.googleBtn} onPress={handleLogin}>
                <Text style={s.googleText}>🔑  Continue with Google</Text>
              </Pressable>

              <View style={s.links}>
                <Pressable onPress={() => {}}><Text style={s.link}>Forgot Password?</Text></Pressable>
                <Pressable onPress={() => router.push('/signup')}><Text style={s.link}>Create Account</Text></Pressable>
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
  logo: { fontSize: 44, fontWeight: '800', color: C.text, letterSpacing: -1, fontFamily: 'Sora_800ExtraBold' },
  tagline: { fontSize: 11, color: C.gold, marginTop: 6, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Sora_600SemiBold' },
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
    backgroundColor: C.gold,
  },
  roleTabText: {
    fontSize: 13,
    color: C.muted,
    fontWeight: '700',
    fontFamily: 'Sora_700Bold'
  },
  roleTabTextActive: {
    color: C.navy,
  },
  inputContainer: { gap: 6 },
  label: { fontSize: 12, color: C.muted, fontWeight: '600', fontFamily: 'Sora_400Regular' },
  input: { backgroundColor: 'rgba(17,34,54,0.6)', borderRadius: 14, padding: 16, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: 'Sora_400Regular' },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 12,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: { fontSize: 16, fontWeight: '700', color: C.navy, fontFamily: 'Sora_700Bold' },
  googleBtn: { borderRadius: 14, paddingVertical: 16, alignItems: 'center', borderWidth: 1, borderColor: C.border, backgroundColor: 'rgba(255,255,255,0.02)' },
  googleText: { fontSize: 15, color: C.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  links: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 12 },
  link: { fontSize: 13, color: C.gold, fontWeight: '600', fontFamily: 'Sora_400Regular' },
});
