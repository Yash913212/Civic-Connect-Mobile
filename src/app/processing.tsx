import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

const STEPS = [
  { label: 'Analyzing Image...', icon: '🖼️', color: colors.blue },
  { label: 'Detecting Language...', icon: '🌐', color: colors.gold },
  { label: 'Understanding Complaint...', icon: '🧠', color: colors.amber },
  { label: 'Running Vision AI...', icon: '👁️', color: colors.blue },
  { label: 'Running MuRIL NLP...', icon: '📝', color: colors.gold },
  { label: 'Fusion Processing...', icon: '⚡', color: colors.amber },
  { label: 'Finding Department...', icon: '🏛️', color: colors.green },
  { label: 'Assigning Priority...', icon: '🎯', color: colors.amber },
  { label: 'Generating Municipal Note...', icon: '📋', color: colors.green },
];


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
        <Text style={[s.stepLabel, done && { color: colors.green }, done && { fontFamily: 'Sora_700Bold' }]}>{step.label}</Text>
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
  const latestRef = useRef(complaints[0]);
  latestRef.current = complaints[0];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const latest = latestRef.current;
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
    <ScreenLayout>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        <Text style={s.title}>🧠 AI Processing</Text>
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
      </View>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  title: { fontSize: 30, fontWeight: '800', color: colors.text, textAlign: 'center', fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.gold, textAlign: 'center', marginTop: 6, marginBottom: 32, fontFamily: 'Sora_400Regular' },
  stepsContainer: { gap: 6, backgroundColor: 'transparent', borderWidth: 0, padding: 0 },
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
    overflow: 'hidden',
  },
  stepRowActive: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderColor: 'rgba(255,255,255,0.08)',
  },
  stepIcon: { fontSize: 20 },
  stepLabel: { fontSize: 13, color: colors.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  progressBar: { height: 3, borderRadius: 1.5, marginTop: 6, overflow: 'hidden' },
  progressFill: { height: 3, borderRadius: 1.5 },
  checkmark: { fontSize: 14, color: colors.green, fontWeight: '700', fontFamily: 'Sora_700Bold' },
});
