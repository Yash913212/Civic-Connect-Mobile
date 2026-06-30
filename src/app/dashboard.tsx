import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, ScrollView, Pressable, Dimensions, ActivityIndicator } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring, withSequence } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { SkeletonLine } from '../components/Skeleton';
import { colors } from '../theme/colors';
import { generateInsights } from '../services/ai';
import { t } from '../i18n';

const SW = Dimensions.get('window').width;
const STAT_W = (SW - 56) / 2;

function EntryView({ delay = 0, style, children }: { delay?: number; style?: any; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[style, aStyle]}>{children}</Animated.View>;
}

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

  const categories = [...new Set(complaints.map((c) => c.category))].slice(0, 5);

  const deptLoads = ['Roads Department', 'Sanitation', 'Water Works', 'Electricity'].map(dept => {
    const count = complaints.filter(c => c.department === dept).length;
    return { name: dept, count, pct: Math.min(100, Math.round((count / Math.max(1, complaints.length)) * 100)) };
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
        {/* Hero Summary */}
        <EntryView delay={50}>
          <LinearGradient
            colors={['rgba(42,117,211,0.2)', 'rgba(0,210,255,0.08)', 'rgba(42,117,211,0.15)']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={{ borderRadius: 22, padding: 1, marginBottom: 24 }}
          >
            <GlassCard borderColor="transparent" glowColor="rgba(0,210,255,0.08)" padding={20} style={{ borderRadius: 21, borderWidth: 0, backgroundColor: 'rgba(5,16,30,0.5)' }}>
              <Text style={{ fontSize: 12, color: colors.muted, fontFamily: 'Sora_400Regular', letterSpacing: 1, textTransform: 'uppercase' }}>
                {t('home.welcomeBack')}
              </Text>
              <Text style={{ fontSize: 22, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', marginTop: 4 }}>
                {user?.name || 'Citizen'}
              </Text>
              <View style={{ flexDirection: 'row', gap: 12, marginTop: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(255,255,255,0.04)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                  <Text style={{ fontSize: 10, color: colors.muted, fontFamily: 'Sora_400Regular' }}>Role:</Text>
                  <Text style={{ fontSize: 10, color: colors.gold, fontFamily: 'Sora_700Bold' }}>{user?.role || 'Citizen'}</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: 'rgba(46,204,143,0.1)', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10 }}>
                  <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: colors.green }} />
                  <Text style={{ fontSize: 10, color: colors.green, fontFamily: 'Sora_600SemiBold' }}>System Active</Text>
                </View>
              </View>
            </GlassCard>
          </LinearGradient>
        </EntryView>

        {/* Stats Grid */}
        {isFetching ? (
          <View style={s.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <View key={i} style={s.statCardOuter}>
                <SkeletonLine width={40} height={28} />
                <SkeletonLine width={80} height={11} style={{ marginTop: 4 }} />
              </View>
            ))}
          </View>
        ) : (
          <View style={s.grid}>
            <EntryView delay={100}>
              <GlassCard borderColor="rgba(255,255,255,0.06)" glowColor="rgba(201,168,76,0.06)" padding={18} style={s.statCardOuter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(201,168,76,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14 }}>📋</Text>
                  </View>
                  <AnimatedCounter value={stats.total} delay={200} duration={1200} style={{ fontSize: 26, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold' }} />
                </View>
                <Text style={{ fontSize: 10, color: colors.muted, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Sora_600SemiBold' }}>Total</Text>
              </GlassCard>
            </EntryView>
            <EntryView delay={150}>
              <GlassCard borderColor="rgba(245,166,35,0.15)" glowColor="rgba(245,166,35,0.06)" padding={18} style={s.statCardOuter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(245,166,35,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14 }}>⏳</Text>
                  </View>
                  <AnimatedCounter value={stats.active} delay={300} duration={1200} style={{ fontSize: 26, fontWeight: '800', color: colors.amber, fontFamily: 'Sora_800ExtraBold' }} />
                </View>
                <Text style={{ fontSize: 10, color: colors.amber, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Sora_600SemiBold' }}>Active</Text>
              </GlassCard>
            </EntryView>
            <EntryView delay={200}>
              <GlassCard borderColor="rgba(46,204,143,0.15)" glowColor="rgba(46,204,143,0.06)" padding={18} style={s.statCardOuter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(46,204,143,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14 }}>✅</Text>
                  </View>
                  <AnimatedCounter value={stats.resolved} delay={400} duration={1200} style={{ fontSize: 26, fontWeight: '800', color: colors.green, fontFamily: 'Sora_800ExtraBold' }} />
                </View>
                <Text style={{ fontSize: 10, color: colors.green, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Sora_600SemiBold' }}>Resolved</Text>
              </GlassCard>
            </EntryView>
            <EntryView delay={250}>
              <GlassCard borderColor="rgba(239,68,68,0.15)" glowColor="rgba(239,68,68,0.06)" padding={18} style={s.statCardOuter}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 6 }}>
                  <View style={{ width: 34, height: 34, borderRadius: 10, backgroundColor: 'rgba(239,68,68,0.12)', alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={{ fontSize: 14 }}>🔴</Text>
                  </View>
                  <AnimatedCounter value={stats.highPriority} delay={500} duration={1200} style={{ fontSize: 26, fontWeight: '800', color: colors.danger, fontFamily: 'Sora_800ExtraBold' }} />
                </View>
                <Text style={{ fontSize: 10, color: colors.danger, letterSpacing: 1.5, textTransform: 'uppercase', fontFamily: 'Sora_600SemiBold' }}>High Priority</Text>
              </GlassCard>
            </EntryView>
          </View>
        )}

        {/* Category Breakdown */}
        {categories.length > 0 && (
          <EntryView delay={300}>
            <View style={s.sectionHeader}>
              <LinearGradient colors={['rgba(201,168,76,0.8)', 'rgba(253,184,19,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 3, height: 16, borderRadius: 2 }} />
              <Text style={s.sectionTitle}>Categories</Text>
            </View>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 2 }}>
              {categories.map((cat) => {
                const count = complaints.filter((c) => c.category === cat).length;
                const emojis: Record<string, string> = { Pothole: '🕳️', Garbage: '🗑️', Streetlight: '💡', 'Water Leak': '💧', Drainage: '🚰' };
                return (
                  <GlassCard key={cat} borderColor="rgba(255,255,255,0.06)" glowColor="rgba(42,117,211,0.03)" padding={12} style={{ borderRadius: 14, borderWidth: 0, backgroundColor: 'transparent' }}>
                    <Text style={{ fontSize: 18, marginBottom: 4, textAlign: 'center' }}>{emojis[cat] || '📋'}</Text>
                    <Text style={{ fontSize: 11, color: colors.text, fontFamily: 'Sora_600SemiBold', textAlign: 'center' }}>{cat}</Text>
                    <Text style={{ fontSize: 16, fontWeight: '800', color: colors.gold, fontFamily: 'Sora_800ExtraBold', textAlign: 'center', marginTop: 4 }}>{count}</Text>
                  </GlassCard>
                );
              })}
            </ScrollView>
          </EntryView>
        )}

        {/* Live Heatmap */}
        <EntryView delay={350}>
          <View style={s.sectionHeader}>
            <LinearGradient colors={['rgba(0,210,255,0.8)', 'rgba(42,117,211,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 3, height: 16, borderRadius: 2 }} />
            <Text style={s.sectionTitle}>Live Heatmap</Text>
          </View>
          <Pressable
            onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); router.push('/heatmap'); }}
            accessibilityLabel="View heatmap"
          >
            <GlassCard borderColor="rgba(61,142,240,0.2)" glowColor="rgba(61,142,240,0.08)" padding={20} style={{ borderRadius: 20, borderWidth: 0, backgroundColor: 'transparent' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <LinearGradient colors={['rgba(42,117,211,0.2)', 'rgba(0,210,255,0.08)']} style={{ width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 22 }}>📍</Text>
                </LinearGradient>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 15, fontFamily: 'Sora_700Bold' }}>City Map Command</Text>
                  <Text style={{ color: colors.gold, fontSize: 11, fontFamily: 'Sora_600SemiBold', marginTop: 2 }}>
                    {complaints.length} active markers — Tap to explore
                  </Text>
                </View>
                <Text style={{ fontSize: 18, color: colors.muted }}>→</Text>
              </View>
            </GlassCard>
          </Pressable>
        </EntryView>

        {/* Department Load */}
        <EntryView delay={400}>
          <View style={s.sectionHeader}>
            <LinearGradient colors={['rgba(46,204,143,0.8)', 'rgba(46,204,143,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 3, height: 16, borderRadius: 2 }} />
            <Text style={s.sectionTitle}>Department Load</Text>
          </View>
          {user?.role === 'Citizen' ? (
            <GlassCard borderColor="rgba(239,68,68,0.15)" glowColor="rgba(239,68,68,0.04)" padding={18} style={{ borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: 'rgba(239,68,68,0.1)', alignItems: 'center', justifyContent: 'center' }}>
                  <Text style={{ fontSize: 18 }}>🔒</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora_600SemiBold' }}>Access Restricted</Text>
                  <Text style={{ color: colors.muted, fontSize: 11, fontFamily: 'Sora_400Regular', marginTop: 2 }}>
                    Workload monitoring is only available to department officers.
                  </Text>
                </View>
              </View>
            </GlassCard>
          ) : (
            <GlassCard borderColor="rgba(255,255,255,0.06)" glowColor="rgba(42,117,211,0.03)" padding={18} style={{ borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent' }}>
              {deptLoads.map((d, i) => {
                const barColor = d.name === 'Roads Department' ? colors.danger : d.name === 'Sanitation' ? colors.amber : d.name === 'Water Works' ? colors.blue : colors.green;
                return (
                  <View key={d.name} style={{ marginBottom: i < deptLoads.length - 1 ? 14 : 0 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                      <Text style={{ fontSize: 12, color: colors.text, fontFamily: 'Sora_600SemiBold' }}>{d.name.replace('Department', '').trim()}</Text>
                      <Text style={{ fontSize: 12, color: barColor, fontFamily: 'Sora_700Bold' }}>{d.count} cases</Text>
                    </View>
                    <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: 3, overflow: 'hidden' }}>
                      <View style={{ width: `${d.pct}%`, height: '100%', backgroundColor: barColor, borderRadius: 3 }} />
                    </View>
                  </View>
                );
              })}
            </GlassCard>
          )}
        </EntryView>

        {/* AI Insights */}
        <EntryView delay={450}>
          <AISummaryCard complaints={complaints} />
        </EntryView>
      </ScrollView>
    </ScreenLayout>
  );
}

function AISummaryCard({ complaints }: { complaints: any[] }) {
  const [insights, setInsights] = useState<{ summary: string; trends: string; recommendations: string[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!loaded && !loading && complaints.length > 0) {
      setLoading(true);
      generateInsights(complaints).then((result) => {
        setInsights(result);
        setLoaded(true);
        setLoading(false);
      });
    }
  }, [complaints]);

  if (loading) {
    return (
      <GlassCard borderColor="rgba(201,168,76,0.1)" glowColor="rgba(201,168,76,0.04)" padding={18} style={{ borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent', marginTop: 24 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <ActivityIndicator size="small" color={colors.gold} />
          <Text style={{ color: colors.muted, fontSize: 12, fontFamily: 'Sora_400Regular' }}>Generating AI insights...</Text>
        </View>
      </GlassCard>
    );
  }

  if (!insights) return null;

  return (
    <View style={{ marginTop: 24 }}>
      <LinearGradient colors={['rgba(201,168,76,0.12)', 'rgba(201,168,76,0.03)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={{ borderRadius: 18, padding: 1 }}>
        <GlassCard borderColor="transparent" glowColor="rgba(201,168,76,0.06)" padding={18} style={{ borderRadius: 17, borderWidth: 0, backgroundColor: 'rgba(5,16,30,0.5)' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10 }}>
            <LinearGradient colors={['rgba(201,168,76,0.2)', 'rgba(201,168,76,0.05)']} style={{ width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={{ fontSize: 14 }}>🧠</Text>
            </LinearGradient>
            <Text style={{ fontSize: 15, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold' }}>AI Insights</Text>
            <View style={{ backgroundColor: 'rgba(46,204,143,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, marginLeft: 'auto' }}>
              <Text style={{ fontSize: 8, color: colors.green, fontFamily: 'Sora_700Bold', letterSpacing: 0.5, textTransform: 'uppercase' }}>Auto</Text>
            </View>
          </View>
          <Text style={{ color: colors.text, fontSize: 13, fontFamily: 'Sora_400Regular', lineHeight: 20 }}>{insights.summary}</Text>
          {insights.trends ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 10, backgroundColor: 'rgba(201,168,76,0.06)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10 }}>
              <Text style={{ fontSize: 11 }}>📈</Text>
              <Text style={{ color: colors.gold, fontSize: 12, flex: 1, fontFamily: 'Sora_600SemiBold' }}>{insights.trends}</Text>
            </View>
          ) : null}
          {insights.recommendations.length > 0 && (
            <View style={{ gap: 6, marginTop: 12 }}>
              <Text style={{ fontSize: 10, color: colors.muted, fontFamily: 'Sora_700Bold', textTransform: 'uppercase', letterSpacing: 0.5 }}>Recommendations</Text>
              {insights.recommendations.slice(0, 3).map((rec, i) => (
                <View key={i} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
                  <Text style={{ color: colors.blue, fontSize: 11, marginTop: 2 }}>→</Text>
                  <Text style={{ color: colors.text, fontSize: 12, flex: 1, fontFamily: 'Sora_400Regular', lineHeight: 18 }}>{rec}</Text>
                </View>
              ))}
            </View>
          )}
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              setLoaded(false); setLoading(true);
              generateInsights(complaints).then((r) => { setInsights(r); setLoaded(true); setLoading(false); });
            }}
            style={{ alignSelf: 'flex-start', paddingHorizontal: 10, paddingVertical: 5, backgroundColor: 'rgba(201,168,76,0.1)', borderRadius: 8, marginTop: 10, borderWidth: 1, borderColor: 'rgba(201,168,76,0.2)' }}
          >
            <Text style={{ color: colors.gold, fontSize: 10, fontFamily: 'Sora_700Bold' }}>↻ Refresh</Text>
          </Pressable>
        </GlassCard>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 24 },
  statCardOuter: { width: STAT_W, borderRadius: 18, borderWidth: 0, padding: 0, backgroundColor: 'transparent' },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.3 },
});
