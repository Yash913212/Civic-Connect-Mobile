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

const statusColors: Record<string, string> = {
  pending: C.amber,
  assigned: C.blue,
  in_progress: C.gold,
  resolved: C.green,
};

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

export default function ComplaintDetailScreen() {
  const router = useRouter();
  const c = useAppStore((s) => s.currentComplaint);

  if (!c) {
    return (
      <View style={s.container}>
        <SafeAreaView>
          <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40, fontFamily: 'Sora_600SemiBold' }}>
            No complaint selected
          </Text>
        </SafeAreaView>
      </View>
    );
  }

  const pColor = c.priority === 'high' || c.priority === 'critical' ? '#EF4444' : c.priority === 'medium' ? C.amber : C.green;

  // Dynamically compute tracking timeline milestones
  const statuses = ['pending', 'verified', 'assigned', 'in_progress', 'resolved'];
  const currentIdx = statuses.indexOf(c.status);

  const dynamicTimeline = [
    { status: 'Submitted', icon: '📝', done: currentIdx >= 0 },
    { status: 'AI Ingest & Verified', icon: '🧠', done: currentIdx >= 1 },
    { status: 'Department Assigned', icon: '🏛️', done: currentIdx >= 2 },
    { status: 'Work In Progress', icon: '🔧', done: currentIdx >= 3 },
    { status: 'Grievance Resolved', icon: '✅', done: currentIdx >= 4 },
  ];

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#05101E', '#091a35', '#030c18']}
        style={StyleSheet.absoluteFill}
      />
      <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
      <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={{ fontSize: 20, color: C.text, fontFamily: 'Sora_700Bold' }}>←</Text>
          </Pressable>
          <Text style={s.title}>{c.id}</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
          <GlassCard
            style={s.card}
            borderColor="rgba(255,255,255,0.08)"
            delay={100}
            padding={16}
          >
            <Text style={s.label}>Category</Text>
            <Text style={s.value}>{c.category}</Text>
          </GlassCard>

          <GlassCard
            style={s.card}
            borderColor="rgba(255,255,255,0.08)"
            delay={150}
            padding={16}
          >
            <Text style={s.label}>Description</Text>
            <Text style={s.desc}>{c.description}</Text>
          </GlassCard>

          <View style={s.row}>
            <GlassCard
              style={[s.card, { flex: 1 }]}
              borderColor="rgba(255,255,255,0.08)"
              delay={200}
              padding={16}
            >
              <Text style={s.label}>Department</Text>
              <Text style={[s.value, { fontSize: 14, fontFamily: 'Sora_700Bold' }]}>{c.department || 'Pending'}</Text>
            </GlassCard>
            <GlassCard
              style={[s.card, { flex: 1 }]}
              borderColor={c.priority === 'high' || c.priority === 'critical' ? 'rgba(239,68,68,0.25)' : 'rgba(255,255,255,0.08)'}
              glowColor={c.priority === 'high' || c.priority === 'critical' ? 'rgba(239,68,68,0.08)' : undefined}
              delay={250}
              padding={16}
            >
              <Text style={s.label}>Priority</Text>
              <Text style={[s.value, { color: pColor, textTransform: 'uppercase' }]}>{c.priority}</Text>
            </GlassCard>
          </View>

          <View style={s.row}>
            <GlassCard
              style={[s.card, { flex: 1 }]}
              borderColor="rgba(255,255,255,0.08)"
              delay={300}
              padding={16}
            >
              <Text style={s.label}>Status</Text>
              <Text style={[s.value, { color: statusColors[c.status] || C.muted }]}>{c.status.replace('_', ' ').toUpperCase()}</Text>
            </GlassCard>
            <GlassCard
              style={[s.card, { flex: 1 }]}
              borderColor="rgba(255,255,255,0.08)"
              delay={350}
              padding={16}
            >
              <Text style={s.label}>Confidence</Text>
              <Text style={[s.value, { color: C.green }]}>{c.confidence}%</Text>
            </GlassCard>
          </View>

          <GlassCard
            style={s.card}
            borderColor="rgba(255,255,255,0.08)"
            delay={400}
            padding={16}
          >
            <Text style={s.label}>Location</Text>
            <Text style={s.desc}>{c.location}</Text>
          </GlassCard>

          {/* Timeline */}
          <Text style={s.timelineTitle}>📋 Live Tracking Timeline</Text>
          <GlassCard
            style={s.timeline}
            borderColor={c.status === 'resolved' ? 'rgba(46,204,143,0.25)' : 'rgba(255,255,255,0.08)'}
            glowColor={c.status === 'resolved' ? 'rgba(46,204,143,0.08)' : undefined}
            delay={450}
            padding={20}
          >
            {dynamicTimeline.map((t, i) => (
              <View key={i} style={s.timelineRow}>
                <View style={[s.dot, t.done && { backgroundColor: C.green }]}>
                  <Text style={{ fontSize: 11, color: t.done ? C.navy : C.muted, fontFamily: 'Sora_800ExtraBold' }}>
                    {t.done ? '✓' : ''}
                  </Text>
                </View>
                {i < dynamicTimeline.length - 1 && <View style={[s.line, t.done && { backgroundColor: C.green }]} />}
                <Text style={[s.timelineText, t.done && { color: C.text }]}>{t.icon}  {t.status}</Text>
              </View>
            ))}
          </GlassCard>

          <GlassCard
            style={s.card}
            borderColor="rgba(255,255,255,0.08)"
            delay={500}
            padding={16}
          >
            <Text style={s.label}>Municipal Note</Text>
            <Text style={s.desc}>{c.municipalNote || 'AI dispatching report will be logged here.'}</Text>
          </GlassCard>
        </ScrollView>

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  title: { fontSize: 20, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  card: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent',
    marginBottom: 10
  },

  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 11, color: C.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Sora_600SemiBold' },
  value: { fontSize: 17, fontWeight: '700', color: C.text, marginTop: 4, fontFamily: 'Sora_700Bold' },
  desc: { fontSize: 13, color: C.muted, lineHeight: 20, marginTop: 4, fontFamily: 'Sora_400Regular' },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginTop: 16, marginBottom: 12, fontFamily: 'Sora_700Bold' },
  timeline: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent',
    marginBottom: 10
  },

  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: C.border, zIndex: 2 },
  line: { position: 'absolute', left: 10, top: 22, width: 2, height: 16, backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 1 },
  timelineText: { fontSize: 14, color: C.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
});
