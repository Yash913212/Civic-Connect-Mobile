import React from 'react';
import { StyleSheet, View, Text, ScrollView } from 'react-native';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

const statusColors: Record<string, string> = {
  pending: colors.amber,
  assigned: colors.blue,
  in_progress: colors.gold,
  resolved: colors.green,
};

export default function ComplaintDetailScreen() {
  const c = useAppStore((s) => s.currentComplaint);

  if (!c) {
    return (
      <ScreenLayout>
        <Text style={{ color: '#fff', textAlign: 'center', marginTop: 40, fontFamily: 'Sora_600SemiBold' }}>
          No complaint selected
        </Text>
      </ScreenLayout>
    );
  }

  const pColor = c.priority === 'high' || c.priority === 'critical' ? '#EF4444' : c.priority === 'medium' ? colors.amber : colors.green;

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
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>{c.id}</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 40 }} showsVerticalScrollIndicator={false}>
        <GlassCard style={s.card} borderColor="rgba(255,255,255,0.08)" delay={100} padding={16}>
          <Text style={s.label}>Category</Text>
          <Text style={s.value}>{c.category}</Text>
        </GlassCard>

        <GlassCard style={s.card} borderColor="rgba(255,255,255,0.08)" delay={150} padding={16}>
          <Text style={s.label}>Description</Text>
          <Text style={s.desc}>{c.description}</Text>
        </GlassCard>

        <View style={s.row}>
          <GlassCard style={[s.card, { flex: 1 }]} borderColor="rgba(255,255,255,0.08)" delay={200} padding={16}>
            <Text style={s.label}>Department</Text>
            <Text style={[s.value, { fontSize: 14 }]}>{c.department || 'Pending'}</Text>
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
          <GlassCard style={[s.card, { flex: 1 }]} borderColor="rgba(255,255,255,0.08)" delay={300} padding={16}>
            <Text style={s.label}>Status</Text>
            <Text style={[s.value, { color: statusColors[c.status] || colors.muted }]}>{c.status.replace('_', ' ').toUpperCase()}</Text>
          </GlassCard>
          <GlassCard style={[s.card, { flex: 1 }]} borderColor="rgba(255,255,255,0.08)" delay={350} padding={16}>
            <Text style={s.label}>Confidence</Text>
            <Text style={[s.value, { color: colors.green }]}>{c.confidence}%</Text>
          </GlassCard>
        </View>

        <GlassCard style={s.card} borderColor="rgba(255,255,255,0.08)" delay={400} padding={16}>
          <Text style={s.label}>Location</Text>
          <Text style={s.desc}>{c.location}</Text>
        </GlassCard>

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
              <View style={[s.dot, t.done && { backgroundColor: colors.green }]}>
                <Text style={{ fontSize: 11, color: t.done ? colors.navy : colors.muted, fontFamily: 'Sora_800ExtraBold' }}>
                  {t.done ? '✓' : ''}
                </Text>
              </View>
              {i < dynamicTimeline.length - 1 && <View style={[s.line, t.done && { backgroundColor: colors.green }]} />}
              <Text style={[s.timelineText, t.done && { color: colors.text }]}>{t.icon}  {t.status}</Text>
            </View>
          ))}
        </GlassCard>

        <GlassCard style={s.card} borderColor="rgba(255,255,255,0.08)" delay={500} padding={16}>
          <Text style={s.label}>Municipal Note</Text>
          <Text style={s.desc}>{c.municipalNote || 'AI dispatching report will be logged here.'}</Text>
        </GlassCard>
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  card: { borderWidth: 0, padding: 0, borderRadius: 18, backgroundColor: 'transparent', marginBottom: 10 },
  row: { flexDirection: 'row', gap: 10 },
  label: { fontSize: 11, color: colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Sora_600SemiBold' },
  value: { fontSize: 17, fontWeight: '700', color: colors.text, marginTop: 4, fontFamily: 'Sora_700Bold' },
  desc: { fontSize: 13, color: colors.muted, lineHeight: 20, marginTop: 4, fontFamily: 'Sora_400Regular' },
  timelineTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 16, marginBottom: 12, fontFamily: 'Sora_700Bold' },
  timeline: { borderWidth: 0, padding: 0, borderRadius: 18, backgroundColor: 'transparent', marginBottom: 10 },
  timelineRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16, position: 'relative' },
  dot: { width: 22, height: 22, borderRadius: 11, backgroundColor: 'rgba(255,255,255,0.06)', alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)', zIndex: 2 },
  line: { position: 'absolute', left: 10, top: 22, width: 2, height: 16, backgroundColor: 'rgba(255,255,255,0.06)', zIndex: 1 },
  timelineText: { fontSize: 14, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
});
