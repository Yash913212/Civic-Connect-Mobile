import React, { useEffect, useState } from 'react';
import { StyleSheet, View, Text, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';


const { width: SW, height: SH } = Dimensions.get('window');

const C = {
  navy:       '#05101E',
  surface:    '#0D1B2E',
  elevated:   '#112236',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.25)',
  amber:      '#F5A623',
  green:      '#2ECC8F',
  blue:       '#3D8EF0',
  text:       '#FFFFFF',
  muted:      'rgba(255,255,255,0.40)',
  border:     'rgba(255,255,255,0.06)',
} as const;

const STEPS = [
  { label: 'Analyzing Image...', icon: '🖼️', color: C.blue },
  { label: 'Detecting Language...', icon: '🌐', color: C.gold },
  { label: 'Understanding Complaint...', icon: '🧠', color: C.amber },
  { label: 'Running Vision AI...', icon: '👁️', color: C.blue },
  { label: 'Running MuRIL NLP...', icon: '📝', color: C.gold },
  { label: 'Fusion Processing...', icon: '⚡', color: C.amber },
  { label: 'Finding Department...', icon: '🏛️', color: C.green },
  { label: 'Assigning Priority...', icon: '🎯', color: C.amber },
  { label: 'Generating Municipal Note...', icon: '📋', color: C.green },
];

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
          width: 250,
          height: 250,
          borderRadius: 125,
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

function StepRow({ step, index, active, done }: { step: typeof STEPS[0]; index: number; active: boolean; done: boolean }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);

  useEffect(() => {
    if (active || done) {
      opacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
      translateX.value = withDelay(index * 50, withTiming(0, { duration: 400 }));
    }
  }, [active, done]);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }]
  }));

  return (
    <Animated.View style={[s.stepRow, style, active && s.stepRowActive]}>
      <Text style={s.stepIcon}>{step.icon}</Text>
      <View style={{ flex: 1 }}>
        <Text style={[s.stepLabel, done && { color: C.green }, done && { fontFamily: 'Sora_700Bold' }]}>{step.label}</Text>
        {active && <View style={[s.progressBar, { backgroundColor: step.color + '20' }]}><View style={[s.progressFill, { backgroundColor: step.color, width: '100%' }]} /></View>}
      </View>
      {done && <Text style={s.checkmark}>✓</Text>}
    </Animated.View>
  );
}


export default function ProcessingScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const setCurrentComplaint = useAppStore((s) => s.setCurrentComplaint);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const latest = complaints[0];
          if (latest) {
            const updated = {
              ...latest,
              department: 'Roads Department',
              priority: 'high' as const,
              confidence: 96.4,
              language: 'Telugu',
              municipalNote: 'A large pothole has been reported. Immediate attention required from Roads Department. Priority: HIGH. Confidence: 96.4%.',
              status: 'assigned' as const,
            };
            setCurrentComplaint(updated);
          }
          setTimeout(() => router.replace('/result'), 500);
          return prev;
        }
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        return prev + 1;
      });
    }, 800);
    return () => clearInterval(interval);
  }, []);

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#05101E', '#091a35', '#030c18']}
        style={StyleSheet.absoluteFill}
      />
      <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
      <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />

      <SafeAreaView style={{ flex: 1, justifyContent: 'center' }}>
        <Text style={s.title}>🧠  AI Processing</Text>
        <Text style={s.subtitle}>Analyzing your complaint with multi-modal AI</Text>
        <GlassCard
          style={s.stepsContainer}
          borderColor="rgba(255,255,255,0.08)"
          glowColor="rgba(201,168,76,0.06)"
          intensity={45}
          padding={16}
        >
          {STEPS.map((step, i) => (
            <StepRow key={i} step={step} index={i} active={i === currentStep} done={i < currentStep} />
          ))}
        </GlassCard>
      </SafeAreaView>

    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent', padding: 24 },
  title: { fontSize: 30, fontWeight: '800', color: C.text, textAlign: 'center', fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.gold, textAlign: 'center', marginTop: 6, marginBottom: 32, fontFamily: 'Sora_400Regular' },
  stepsContainer: {
    gap: 6,
    backgroundColor: 'transparent',
    borderWidth: 0,
    padding: 0,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    backgroundColor: 'transparent',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'transparent',
    overflow: 'hidden'
  },
  stepRowActive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepIcon: { fontSize: 20 },
  stepLabel: { fontSize: 13, color: C.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  progressBar: { height: 3, borderRadius: 1.5, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 1.5 },
  checkmark: { fontSize: 14, color: C.green, fontWeight: '700', fontFamily: 'Sora_700Bold' },

});
