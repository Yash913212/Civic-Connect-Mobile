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

export default function SignupScreen() {
  const router = useRouter();
  const signup = useAppStore((s) => s.signup);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [mobile, setMobile] = useState('');
  const [password, setPassword] = useState('');
  const [focusedField, setFocusedField] = useState<'name' | 'email' | 'mobile' | 'password' | null>(null);

  const handleSignup = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    signup(name || 'Citizen', email || 'user@civicconnect.com', mobile || '+91 9876543210');
    router.replace('/');
  };


  return (
    <View style={s.container}>

      <SafeAreaView style={{ flex: 1 }}>
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={s.content}>
            <View style={s.logoWrap}>
              <Text style={s.logo}>Create Account</Text>
              <Text style={s.tagline}>Join the Civic Connect Platform</Text>
            </View>

            <GlassCard
              style={[s.form]}
              borderColor="rgba(201,168,76,0.22)"
              glowColor="rgba(201,168,76,0.12)"
              intensity={45}
              padding={24}
            >
              <TextInput
                style={[s.input, focusedField === 'name' && { borderColor: C.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                placeholder="Full Name"
                placeholderTextColor={C.muted}
                value={name}
                onChangeText={setName}
                onFocus={() => setFocusedField('name')}
                onBlur={() => setFocusedField(null)}
              />
              <TextInput
                style={[s.input, focusedField === 'email' && { borderColor: C.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                placeholder="Email Address"
                placeholderTextColor={C.muted}
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
                onFocus={() => setFocusedField('email')}
                onBlur={() => setFocusedField(null)}
              />
              <TextInput
                style={[s.input, focusedField === 'mobile' && { borderColor: C.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                placeholder="Mobile Number"
                placeholderTextColor={C.muted}
                keyboardType="phone-pad"
                value={mobile}
                onChangeText={setMobile}
                onFocus={() => setFocusedField('mobile')}
                onBlur={() => setFocusedField(null)}
              />
              <TextInput
                style={[s.input, focusedField === 'password' && { borderColor: C.gold, backgroundColor: 'rgba(17,34,54,0.75)' }]}
                placeholder="Password"
                placeholderTextColor={C.muted}
                secureTextEntry
                value={password}
                onChangeText={setPassword}
                onFocus={() => setFocusedField('password')}
                onBlur={() => setFocusedField(null)}
              />

              <Pressable style={s.btn} onPress={handleSignup}>
                <Text style={s.btnText}>Create Account</Text>
              </Pressable>

              <Pressable onPress={() => router.back()} style={s.backLink}>
                <Text style={s.link}>Already have an account? Sign In</Text>
              </Pressable>
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
  logoWrap: { alignItems: 'center', marginBottom: 32 },
  logo: { fontSize: 36, fontWeight: '800', color: C.text, letterSpacing: -0.5, fontFamily: 'Sora_800ExtraBold' },
  tagline: { fontSize: 11, color: C.gold, marginTop: 6, textTransform: 'uppercase', letterSpacing: 2, fontFamily: 'Sora_600SemiBold' },
  form: {
    gap: 14,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },

  input: { backgroundColor: 'rgba(17,34,54,0.6)', borderRadius: 14, padding: 16, fontSize: 15, color: C.text, borderWidth: 1, borderColor: C.border, fontFamily: 'Sora_400Regular' },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: { fontSize: 16, fontWeight: '700', color: C.navy, fontFamily: 'Sora_700Bold' },
  backLink: { alignItems: 'center', marginTop: 12 },
  link: { fontSize: 13, color: C.gold, fontWeight: '600', fontFamily: 'Sora_400Regular' },
});
