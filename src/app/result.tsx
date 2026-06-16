import React, { useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
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

export default function ResultScreen() {
  const router = useRouter();
  const complaint = useAppStore((s) => s.currentComplaint);
  const c = complaint || { category: 'Pothole', department: 'Roads Department', priority: 'high', confidence: 96.4, language: 'Telugu', municipalNote: 'A large pothole has been reported. Priority: HIGH.' };

  const priorityColor = c.priority === 'high' ? '#EF4444' : c.priority === 'critical' ? '#DC2626' : c.priority === 'medium' ? C.amber : C.green;

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#05101E', '#091a35', '#030c18']}
        style={StyleSheet.absoluteFill}
      />
      <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.1} delay={0} />
      <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.6} delay={1500} />

      <SafeAreaView style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
          <Text style={s.successIcon}>✨</Text>
          <Text style={s.title}>AI Analysis Complete</Text>
          <Text style={s.subtitle}>Your complaint has been processed and routed</Text>

          {/* Result Cards */}
          <View style={s.grid}>
            <GlassCard
              style={s.resultCard}
              borderColor="rgba(255,255,255,0.08)"
              delay={100}
              padding={16}
            >
              <Text style={s.cardLabel}>Issue Detected</Text>
              <Text style={s.cardValue}>{c.category}</Text>
            </GlassCard>

            <GlassCard
              style={s.resultCard}
              borderColor="rgba(61,142,240,0.22)"
              glowColor="rgba(61,142,240,0.08)"
              delay={150}
              padding={16}
            >
              <Text style={s.cardLabel}>Department Route</Text>
              <Text style={[s.cardValue, { color: C.blue }]}>{c.department}</Text>
            </GlassCard>

            <GlassCard
              style={s.resultCard}
              borderColor={priorityColor + '40'}
              glowColor={priorityColor + '12'}
              delay={200}
              padding={16}
            >
              <Text style={s.cardLabel}>Risk Level</Text>
              <Text style={[s.cardValue, { color: priorityColor, textTransform: 'uppercase' }]}>{c.priority}</Text>
            </GlassCard>

            <GlassCard
              style={s.resultCard}
              borderColor="rgba(46,204,143,0.22)"
              glowColor="rgba(46,204,143,0.08)"
              delay={250}
              padding={16}
            >
              <Text style={s.cardLabel}>Confidence Match</Text>
              <Text style={[s.cardValue, { color: C.green }]}>{c.confidence}%</Text>
            </GlassCard>

            <GlassCard
              style={s.resultCard}
              borderColor="rgba(255,255,255,0.08)"
              delay={300}
              padding={16}
            >
              <Text style={s.cardLabel}>Detected Language</Text>
              <Text style={s.cardValue}>{c.language}</Text>
            </GlassCard>
          </View>

          {/* AI Route */}
          <Text style={s.routeTitle}>AI Processing Pipeline</Text>
          <GlassCard
            style={s.route}
            borderColor="rgba(255,255,255,0.08)"
            delay={350}
            padding={20}
          >
            {['📸 Image Ingest', '👁️ Vision Neural-Net', '📝 MuRIL NLP Parsing', '⚡ Multimodal Fusion', `🏛️ dispatched ➔ ${c.department}`].map((step, i, arr) => (
              <View key={i} style={s.routeStep}>
                <Text style={s.routeText}>{step}</Text>
                {i < arr.length - 1 && <Text style={s.routeArrow}>↓</Text>}
              </View>
            ))}
          </GlassCard>

          {/* Municipal Note */}
          <GlassCard
            style={s.noteCard}
            borderColor="rgba(255,255,255,0.08)"
            delay={400}
            padding={20}
          >
            <Text style={s.noteTitle}>📋 Generated Municipal Note</Text>
            <Text style={s.noteText}>{c.municipalNote}</Text>
          </GlassCard>


          <Pressable style={s.btn} onPress={() => router.replace('/')}>
            <Text style={s.btnText}>Return to Command Dashboard</Text>
          </Pressable>

          <Pressable style={s.outlineBtn} onPress={() => router.push('/history')}>
            <Text style={s.outlineBtnText}>View Citizen Logs</Text>
          </Pressable>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  scroll: { padding: 24, paddingBottom: 40 },
  successIcon: { fontSize: 54, textAlign: 'center', marginTop: 10, color: C.gold },
  title: { fontSize: 26, fontWeight: '800', color: C.text, textAlign: 'center', marginTop: 12, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: C.gold, textAlign: 'center', marginTop: 4, marginBottom: 28, fontFamily: 'Sora_400Regular' },
  grid: { gap: 10 },
  resultCard: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent'
  },

  cardLabel: { fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Sora_600SemiBold' },
  cardValue: { fontSize: 18, fontWeight: '700', color: C.text, marginTop: 4, fontFamily: 'Sora_700Bold' },
  routeTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 28, marginBottom: 12, fontFamily: 'Sora_700Bold' },
  route: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },

  routeStep: { alignItems: 'center' },
  routeText: { fontSize: 14, color: C.text, fontWeight: '600', paddingVertical: 4, fontFamily: 'Sora_600SemiBold' },
  routeArrow: { fontSize: 18, color: C.gold, marginVertical: 2 },
  noteCard: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent',
    marginTop: 20
  },

  noteTitle: { fontSize: 15, fontWeight: '700', color: C.text, marginBottom: 8, fontFamily: 'Sora_700Bold' },
  noteText: { fontSize: 13, color: C.muted, lineHeight: 20, fontFamily: 'Sora_400Regular' },
  btn: {
    backgroundColor: C.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: C.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4
  },
  btnText: { fontSize: 15, fontWeight: '700', color: C.navy, fontFamily: 'Sora_700Bold' },
  outlineBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 10
  },
  outlineBtnText: { fontSize: 14, color: C.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
});
