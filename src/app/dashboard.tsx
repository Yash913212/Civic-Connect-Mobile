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
  danger:     '#EF4444',
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

export default function DashboardScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => ['assigned', 'in_progress', 'pending'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    highPriority: complaints.filter(c => ['high', 'critical'].includes(c.priority)).length,
  };

  return (
    <View style={s.container}>
      {!isTab && (
        <>
          <LinearGradient
            colors={['#05101E', '#091a35', '#030c18']}
            style={StyleSheet.absoluteFill}
          />
          <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
          <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />
        </>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
        {!isTab && (
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Text style={{ fontSize: 20, color: C.text, fontFamily: 'Sora_700Bold' }}>←</Text>
            </Pressable>
            <Text style={s.title}>Municipal Command</Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: isTab ? 130 : 40 }} showsVerticalScrollIndicator={false}>
          {/* Stats Grid */}
          <View style={s.grid}>
            <GlassCard
              style={s.statCard}
              borderColor="rgba(255,255,255,0.08)"
              glowColor="rgba(201,168,76,0.08)"
              delay={100}
              padding={16}
            >
              <Text style={s.statVal}>{stats.total}</Text>
              <Text style={s.statLabel}>Total</Text>
            </GlassCard>

            <GlassCard
              style={s.statCard}
              borderColor="rgba(245,166,35,0.22)"
              glowColor="rgba(245,166,35,0.08)"
              delay={150}
              padding={16}
            >
              <Text style={[s.statVal, { color: C.amber }]}>{stats.active}</Text>
              <Text style={s.statLabel}>Active Cases</Text>
            </GlassCard>

            <GlassCard
              style={s.statCard}
              borderColor="rgba(46,204,143,0.22)"
              glowColor="rgba(46,204,143,0.08)"
              delay={200}
              padding={16}
            >
              <Text style={[s.statVal, { color: C.green }]}>{stats.resolved}</Text>
              <Text style={s.statLabel}>Resolved</Text>
            </GlassCard>

            <GlassCard
              style={s.statCard}
              borderColor="rgba(239,68,68,0.22)"
              glowColor="rgba(239,68,68,0.08)"
              delay={250}
              padding={16}
            >
              <Text style={[s.statVal, { color: C.danger }]}>{stats.highPriority}</Text>
              <Text style={s.statLabel}>High Priority</Text>
            </GlassCard>
          </View>

          {/* Map Placeholder */}
          <Text style={s.sectionTitle}>🗺️ Live Heatmap</Text>
          <Pressable onPress={() => router.push('/heatmap')}>
            <GlassCard
              style={s.mapPlaceholder}
              borderColor="rgba(61,142,240,0.22)"
              glowColor="rgba(61,142,240,0.12)"
              delay={300}
              padding={20}
            >
              <View style={{ alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
                <Text style={{ color: C.text, fontFamily: 'Sora_600SemiBold' }}>City Map Command</Text>
                <Text style={{ color: C.gold, marginTop: 6, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>3 Active Clusters (Tap to View)</Text>
              </View>
            </GlassCard>
          </Pressable>

          {/* Department Load */}
          <Text style={s.sectionTitle}>🏛️ Department Load</Text>
          <GlassCard
            style={s.deptCard}
            borderColor="rgba(255,255,255,0.08)"
            delay={350}
            padding={20}
          >
            <View style={s.deptRow}>
              <Text style={s.deptName}>Roads Dept</Text>
              <View style={s.barBg}><View style={[s.barFill, { width: '80%', backgroundColor: C.danger }]} /></View>
              <Text style={s.deptVal}>80%</Text>
            </View>
            <View style={s.deptRow}>
              <Text style={s.deptName}>Sanitation</Text>
              <View style={s.barBg}><View style={[s.barFill, { width: '45%', backgroundColor: C.amber }]} /></View>
              <Text style={s.deptVal}>45%</Text>
            </View>
            <View style={s.deptRow}>
              <Text style={s.deptName}>Water & Power</Text>
              <View style={s.barBg}><View style={[s.barFill, { width: '30%', backgroundColor: C.blue }]} /></View>
              <Text style={s.deptVal}>30%</Text>
            </View>
            <View style={s.deptRow}>
              <Text style={s.deptName}>Electrical</Text>
              <View style={s.barBg}><View style={[s.barFill, { width: '20%', backgroundColor: C.green }]} /></View>
              <Text style={s.deptVal}>20%</Text>
            </View>
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
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: (SW - 40 - 10) / 2,
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'stretch'
  },

  statVal: { fontSize: 32, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold' },
  statLabel: { fontSize: 11, color: C.muted, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', fontFamily: 'Sora_600SemiBold', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: C.text, marginBottom: 12, fontFamily: 'Sora_700Bold' },
  mapPlaceholder: {
    height: 180,
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: 24
  },

  deptCard: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
  },

  deptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deptName: { width: 80, fontSize: 12, color: C.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  barBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4 },
  barFill: { height: '100%', borderRadius: 4 },
  deptVal: { width: 36, fontSize: 12, color: C.muted, textAlign: 'right', fontFamily: 'Sora_400Regular' },
});
