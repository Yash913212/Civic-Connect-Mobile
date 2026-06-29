import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { SkeletonLine, SkeletonCard } from '../components/Skeleton';
import { colors } from '../theme/colors';

export default function DashboardScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const user = useAppStore((s) => s.user);
  const isFetching = useAppStore((s) => s.isFetching);

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => ['assigned', 'in_progress', 'pending'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    highPriority: complaints.filter(c => ['high', 'critical'].includes(c.priority)).length,
  };

  const deptLoads = ['Roads Department', 'Sanitation', 'Water Works', 'Electricity'].map(dept => {
    const count = complaints.filter(c => c.department === dept).length;
    const max = Math.max(1, complaints.length);
    return { name: dept, count, pct: Math.round((count / max) * 100) };
  });

  return (
    <ScreenLayout showOrbs={!isTab} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
      {!isTab && (
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>Dashboard</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: isTab ? 130 : 40 }} showsVerticalScrollIndicator={false}>
        {isFetching ? (
          <View style={s.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={s.statCard}>
                <SkeletonLine width={40} height={28} />
                <SkeletonLine width={80} height={11} style={{ marginTop: 4 }} />
              </View>
            ))}
          </View>
        ) : (
          <View style={s.grid}>
          <GlassCard style={s.statCard} borderColor="rgba(255,255,255,0.08)" glowColor="rgba(201,168,76,0.08)" delay={100} padding={16}>
            <Text style={s.statVal}>{stats.total}</Text>
            <Text style={s.statLabel}>Total</Text>
          </GlassCard>

          <GlassCard style={s.statCard} borderColor="rgba(245,166,35,0.22)" glowColor="rgba(245,166,35,0.08)" delay={150} padding={16}>
            <Text style={[s.statVal, { color: colors.amber }]}>{stats.active}</Text>
            <Text style={s.statLabel}>Active Cases</Text>
          </GlassCard>

          <GlassCard style={s.statCard} borderColor="rgba(46,204,143,0.22)" glowColor="rgba(46,204,143,0.08)" delay={200} padding={16}>
            <Text style={[s.statVal, { color: colors.green }]}>{stats.resolved}</Text>
            <Text style={s.statLabel}>Resolved</Text>
          </GlassCard>

          <GlassCard style={s.statCard} borderColor="rgba(239,68,68,0.22)" glowColor="rgba(239,68,68,0.08)" delay={250} padding={16}>
            <Text style={[s.statVal, { color: colors.danger }]}>{stats.highPriority}</Text>
            <Text style={s.statLabel}>High Priority</Text>
          </GlassCard>
        </View>
      )}

        <Text style={s.sectionTitle}>🗺️ Live Heatmap</Text>
        <Pressable
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/heatmap');
          }}
          accessibilityLabel="View heatmap"
        >
          <GlassCard style={s.mapPlaceholder} borderColor="rgba(61,142,240,0.22)" glowColor="rgba(61,142,240,0.12)" delay={300} padding={20}>
            <View style={{ alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 40, marginBottom: 10 }}>📍</Text>
              <Text style={{ color: colors.text, fontFamily: 'Sora_600SemiBold' }}>City Map Command</Text>
              <Text style={{ color: colors.gold, marginTop: 6, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>3 Active Clusters (Tap to View)</Text>
            </View>
          </GlassCard>
        </Pressable>

        <Text style={s.sectionTitle}>🏛️ Department Load</Text>
        {user?.role === 'Citizen' ? (
          <GlassCard style={s.restrictedCard} borderColor="rgba(239,68,68,0.22)" glowColor="rgba(239,68,68,0.04)" delay={350} padding={20}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text style={{ fontSize: 20 }}>🔒</Text>
              <View style={{ flex: 1 }}>
                <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora_600SemiBold' }}>Access Restricted</Text>
                <Text style={{ color: colors.muted, fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 }}>
                  Real-time workload monitoring is only available to department officers.
                </Text>
              </View>
            </View>
          </GlassCard>
        ) : (
          <GlassCard style={s.deptCard} borderColor="rgba(255,255,255,0.08)" delay={350} padding={20}>
            {deptLoads.map((d) => {
              const barColor = d.name === 'Roads Department' ? colors.danger : d.name === 'Sanitation' ? colors.amber : d.name === 'Water Works' ? colors.blue : colors.green;
              return (
                <View key={d.name} style={s.deptRow}>
                  <Text style={s.deptName}>{d.name.replace('Department', '').trim()}</Text>
                  <View style={s.barBg}><View style={[s.barFill, { width: `${d.pct}%`, backgroundColor: barColor }]} /></View>
                  <Text style={s.deptVal}>{d.pct}%</Text>
                </View>
              );
            })}
          </GlassCard>
        )}
      </ScrollView>
    </ScreenLayout>
  );
}

const screenWidth = Dimensions.get('window').width;

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCard: {
    width: (screenWidth - 40 - 10) / 2,
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'stretch',
  },
  statVal: { fontSize: 32, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold' },
  statLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', marginTop: 4, textTransform: 'uppercase', fontFamily: 'Sora_600SemiBold', letterSpacing: 1 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginBottom: 12, fontFamily: 'Sora_700Bold' },
  mapPlaceholder: {
    height: 180,
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'stretch',
    justifyContent: 'center',
    marginBottom: 24,
  },
  deptCard: { borderWidth: 0, padding: 0, borderRadius: 20, backgroundColor: 'transparent' },
  restrictedCard: { borderWidth: 0, padding: 0, borderRadius: 20, backgroundColor: 'transparent', borderColor: 'rgba(239,68,68,0.15)' },
  deptRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  deptName: { width: 80, fontSize: 12, color: colors.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  barBg: { flex: 1, height: 8, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 4 },
  barFill: { height: '100%', borderRadius: 4 },
  deptVal: { width: 36, fontSize: 12, color: colors.muted, textAlign: 'right', fontFamily: 'Sora_400Regular' },
});


