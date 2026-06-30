import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { analyzeComplaint } from '../services/nlp';
import type { DetectedLanguage } from '../services/nlp';
import { analyzeComplaintWithAI } from '../services/ai';

const LANG_LABELS: Record<DetectedLanguage, string> = { en: 'English', te: 'Telugu', hi: 'Hindi', unknown: 'Unknown' };

function Particle() {
  const translateY = useSharedValue(0);
  const opacity = useSharedValue(1);

  useEffect(() => {
    translateY.value = withRepeat(
      withTiming(-60, { duration: 3000 + Math.random() * 2000, easing: Easing.linear }),
      -1,
      false
    );
    opacity.value = withRepeat(
      withSequence(withTiming(0, { duration: 1500 }), withTiming(1, { duration: 1500 })),
      -1,
      true
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: 3,
          height: 3,
          borderRadius: 1.5,
          backgroundColor: colors.gold,
        },
        style,
      ]}
    />
  );
}

type StepData = { label: string; icon: string; color: string };

function StepRow({ step, index, active, done }: { step: StepData; index: number; active: boolean; done: boolean }) {
  const opacity = useSharedValue(0);
  const translateX = useSharedValue(-20);
  const progressWidth = useSharedValue(0);

  useEffect(() => {
    if (active || done) {
      opacity.value = withDelay(index * 50, withTiming(1, { duration: 400 }));
      translateX.value = withDelay(index * 50, withTiming(0, { duration: 400 }));
    }
    if (active) {
      progressWidth.value = withTiming(1, { duration: 750, easing: Easing.in(Easing.cubic) });
    } else if (done) {
      progressWidth.value = withTiming(1);
    } else {
      progressWidth.value = 0;
    }
  }, [active, done]);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateX: translateX.value }],
  }));

  const barStyle = useAnimatedStyle(() => ({
    width: `${interpolate(progressWidth.value, [0, 1], [0, 100])}%`,
  }));

  const shimmer = useSharedValue(0);
  useEffect(() => {
    if (active) {
      shimmer.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.linear }), -1, true);
    } else {
      shimmer.value = 0;
    }
  }, [active]);

  const shimmerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(shimmer.value, [0, 0.5, 1], [0.6, 1, 0.6]),
  }));

  return (
    <Animated.View style={[s.stepRow, containerStyle, active && s.stepRowActive]}>
      <Text style={s.stepIcon}>{step.icon}</Text>
      <View style={{ flex: 1 }}>
        <Animated.Text style={[s.stepLabel, done && { color: colors.green }, active && shimmerStyle]}>
          {step.label}
        </Animated.Text>
        {active && (
          <View style={[s.progressBar, { backgroundColor: step.color + '20' }]}>
            <Animated.View style={[s.progressFill, { backgroundColor: step.color }, barStyle]} />
          </View>
        )}
      </View>
      {done && <Text style={s.checkmark}>✓</Text>}
      {active && <View style={[s.pulse, { backgroundColor: step.color }]} />}
    </Animated.View>
  );
}

export default function ProcessingScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const setCurrentComplaint = useAppStore((s) => s.setCurrentComplaint);
  const [currentStep, setCurrentStep] = useState(0);
  const [aiResult, setAiResult] = useState<Awaited<ReturnType<typeof analyzeComplaintWithAI>> | null>(null);
  const latestRef = useRef(complaints[0]);
  latestRef.current = complaints[0];

  const latest = complaints[0];
  const nlpAnalysis = latest ? analyzeComplaint(latest.description, latest.category) : null;
  const analysis = aiResult || nlpAnalysis;

  const STEPS: StepData[] = analysis
    ? [
        { label: 'Analyzing Image...', icon: '🖼️', color: colors.blue },
        { label: `Detected: ${'language' in analysis ? analysis.language : LANG_LABELS[(analysis as ReturnType<typeof analyzeComplaint>).language]}`, icon: '🌐', color: colors.gold },
        { label: `Keywords: ${analysis.keywords.slice(0, 3).join(', ')}`, icon: '🧠', color: colors.amber },
        { label: 'Running Vision AI...', icon: '👁️', color: colors.blue },
        { label: `Category: ${analysis.category}`, icon: '📝', color: colors.gold },
        { label: `Fusion: ${analysis.sentiment} sentiment`, icon: '⚡', color: colors.amber },
        { label: `Dept: ${analysis.department}`, icon: '🏛️', color: colors.green },
        { label: `Priority: ${analysis.priority.toUpperCase()}`, icon: '🎯', color: colors.amber },
        { label: aiResult ? 'AI Analysis Complete' : 'Generating Municipal Note...', icon: '📋', color: colors.green },
      ]
    : [];

  const progressPercent = `${Math.round(((currentStep + 1) / (STEPS.length || 1)) * 100)}%`;

  useEffect(() => {
    if (!latest) return;
    analyzeComplaintWithAI(latest.title, latest.description, latest.category).then(setAiResult);
  }, []);

  useEffect(() => {
    if (!STEPS.length) return;
    const interval = setInterval(() => {
      setCurrentStep((prev) => {
        if (prev >= STEPS.length - 1) {
          clearInterval(interval);
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          const c = latestRef.current;
          if (c && analysis) {
            const lang = 'language' in analysis
              ? analysis.language
              : LANG_LABELS[(analysis as ReturnType<typeof analyzeComplaint>).language];
            const note = 'municipalNote' in analysis && analysis.municipalNote
              ? analysis.municipalNote
              : `OFFICIAL MUNICIPAL WORK ORDER\n\nTO:\n${analysis.department}\n\nSUBJECT:\n${analysis.category} Report\n\nDetected Language: ${lang}\nKeywords: ${analysis.keywords.slice(0, 5).join(', ')}\nSentiment: ${analysis.sentiment}\n\nPriority: ${analysis.priority.toUpperCase()}`;
            const updated = {
              ...c,
              department: analysis.department,
              priority: analysis.priority as 'low' | 'medium' | 'high' | 'critical',
              confidence: 'confidence' in analysis ? Math.round(analysis.confidence * 100) : 85,
              language: lang,
              municipalNote: note,
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
  }, [STEPS.length, analysis]);

  return (
    <ScreenLayout>
      <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
        {/* Particles */}
        <View style={s.particleContainer} pointerEvents="none">
          {Array.from({ length: 8 }).map((_, i) => (
            <View key={i} style={{ position: 'absolute', left: 20 + i * 40, top: 80 + (i % 3) * 60 }}>
              <Particle />
            </View>
          ))}
        </View>

        {/* Progress Ring */}
        <View style={s.ringContainer}>
          <LinearGradient
            colors={['rgba(201,168,76,0.2)', 'rgba(59,130,246,0.2)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.ringOuter}
          >
            <View style={s.ringInner}>
              <Text style={s.ringEmoji}>🧠</Text>
              <Text style={s.ringPercent}>{progressPercent}</Text>
            </View>
          </LinearGradient>
        </View>

        <Text style={s.title}>AI Processing</Text>
        <Text style={s.subtitle}>Analyzing your complaint with multi-modal AI</Text>

        <GlassCard style={s.stepsContainer} borderColor="rgba(255,255,255,0.08)" glowColor="rgba(201,168,76,0.06)" intensity={45} padding={16}>
          {STEPS.map((step, i) => (
            <StepRow key={i} step={step} index={i} active={i === currentStep} done={i < currentStep} />
          ))}
        </GlassCard>
      </View>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  particleContainer: { ...StyleSheet.absoluteFillObject },
  ringContainer: { alignItems: 'center', marginBottom: 24 },
  ringOuter: {
    width: 100,
    height: 100,
    borderRadius: 50,
    padding: 3,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringInner: {
    width: 94,
    height: 94,
    borderRadius: 47,
    backgroundColor: 'rgba(5,16,30,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ringEmoji: { fontSize: 28 },
  ringPercent: { fontSize: 14, fontWeight: '800', color: colors.gold, fontFamily: 'Sora_800ExtraBold', marginTop: 2 },
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
  pulse: { width: 8, height: 8, borderRadius: 4 },
});
