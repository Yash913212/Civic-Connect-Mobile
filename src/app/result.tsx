import React from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

export default function ResultScreen() {
  const router = useRouter();
  const complaint = useAppStore((s) => s.currentComplaint);
  const c = complaint || { category: 'Pothole', department: 'Roads Department', priority: 'high', confidence: 96.4, language: 'Telugu', municipalNote: 'A large pothole has been reported. Priority: HIGH.' };

  const priorityColor = c.priority === 'high' ? '#EF4444' : c.priority === 'critical' ? '#DC2626' : c.priority === 'medium' ? colors.amber : colors.green;

  return (
    <ScreenLayout>
      <ScrollView contentContainerStyle={s.scroll} showsVerticalScrollIndicator={false}>
        <Text style={s.successIcon}>✨</Text>
        <Text style={s.title}>AI Analysis Complete</Text>
        <Text style={s.subtitle}>Your complaint has been processed and routed</Text>

        <View style={s.grid}>
          <GlassCard style={s.resultCard} borderColor="rgba(255,255,255,0.08)" delay={100} padding={16}>
            <Text style={s.cardLabel}>Issue Detected</Text>
            <Text style={s.cardValue}>{c.category}</Text>
          </GlassCard>

          <GlassCard style={s.resultCard} borderColor="rgba(61,142,240,0.22)" glowColor="rgba(61,142,240,0.08)" delay={150} padding={16}>
            <Text style={s.cardLabel}>Department Route</Text>
            <Text style={[s.cardValue, { color: colors.blue }]}>{c.department}</Text>
          </GlassCard>

          <GlassCard style={s.resultCard} borderColor={priorityColor + '40'} glowColor={priorityColor + '12'} delay={200} padding={16}>
            <Text style={s.cardLabel}>Risk Level</Text>
            <Text style={[s.cardValue, { color: priorityColor, textTransform: 'uppercase' }]}>{c.priority}</Text>
          </GlassCard>

          <GlassCard style={s.resultCard} borderColor="rgba(46,204,143,0.22)" glowColor="rgba(46,204,143,0.08)" delay={250} padding={16}>
            <Text style={s.cardLabel}>Confidence Match</Text>
            <Text style={[s.cardValue, { color: colors.green }]}>{c.confidence}%</Text>
          </GlassCard>

          <GlassCard style={s.resultCard} borderColor="rgba(255,255,255,0.08)" delay={300} padding={16}>
            <Text style={s.cardLabel}>Detected Language</Text>
            <Text style={s.cardValue}>{c.language}</Text>
          </GlassCard>
        </View>

        <Text style={s.routeTitle}>AI Processing Pipeline</Text>
        <GlassCard style={s.route} borderColor="rgba(255,255,255,0.08)" delay={350} padding={20}>
          {['📸 Image Ingest', '👁️ Vision Neural-Net', '📝 MuRIL NLP Parsing', '⚡ Multimodal Fusion', `🏛️ dispatched ➔ ${c.department}`].map((step, i, arr) => (
            <View key={i} style={s.routeStep}>
              <Text style={s.routeText}>{step}</Text>
              {i < arr.length - 1 && <Text style={s.routeArrow}>↓</Text>}
            </View>
          ))}
        </GlassCard>

        <GlassCard style={s.noteCard} borderColor="rgba(255,255,255,0.08)" delay={400} padding={20}>
          <Text style={s.noteTitle}>📋 Generated Municipal Note</Text>
          <Text style={s.noteText}>{c.municipalNote}</Text>
        </GlassCard>

        <Pressable
          style={s.btn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            router.replace('/');
          }}
          accessibilityLabel="Return to dashboard"
          accessibilityRole="button"
        >
          <Text style={s.btnText}>Return to Dashboard</Text>
        </Pressable>

        <Pressable
          style={s.outlineBtn}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push('/history');
          }}
          accessibilityLabel="View complaint history"
          accessibilityRole="button"
        >
          <Text style={s.outlineBtnText}>View History</Text>
        </Pressable>
      </ScrollView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  scroll: { padding: 24, paddingBottom: 40 },
  successIcon: { fontSize: 54, textAlign: 'center', marginTop: 10, color: colors.gold },
  title: { fontSize: 26, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 12, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: colors.gold, textAlign: 'center', marginTop: 4, marginBottom: 28, fontFamily: 'Sora_400Regular' },
  grid: { gap: 10 },
  resultCard: { borderWidth: 0, padding: 0, borderRadius: 18, backgroundColor: 'transparent' },
  cardLabel: { fontSize: 11, color: colors.muted, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Sora_600SemiBold' },
  cardValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginTop: 4, fontFamily: 'Sora_700Bold' },
  routeTitle: { fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 28, marginBottom: 12, fontFamily: 'Sora_700Bold' },
  route: { borderWidth: 0, padding: 0, borderRadius: 18, backgroundColor: 'transparent', alignItems: 'center' },
  routeStep: { alignItems: 'center' },
  routeText: { fontSize: 14, color: colors.text, fontWeight: '600', paddingVertical: 4, fontFamily: 'Sora_600SemiBold' },
  routeArrow: { fontSize: 18, color: colors.gold, marginVertical: 2 },
  noteCard: { borderWidth: 0, padding: 0, borderRadius: 18, backgroundColor: 'transparent', marginTop: 20 },
  noteTitle: { fontSize: 15, fontWeight: '700', color: colors.text, marginBottom: 8, fontFamily: 'Sora_700Bold' },
  noteText: { fontSize: 13, color: colors.muted, lineHeight: 20, fontFamily: 'Sora_400Regular' },
  btn: {
    backgroundColor: colors.gold,
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
    shadowColor: colors.gold,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  btnText: { fontSize: 15, fontWeight: '700', color: colors.navy, fontFamily: 'Sora_700Bold' },
  outlineBtn: {
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    backgroundColor: 'rgba(255,255,255,0.02)',
    marginTop: 10,
  },
  outlineBtnText: { fontSize: 14, color: colors.text, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
});
