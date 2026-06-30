import React, { memo, useEffect, useRef, useState, useMemo } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { MapPreview } from '../components/MapPreview';
import { GlowingOrb } from '../components/GlowingOrb';
import { AnimatedCounter } from '../components/AnimatedCounter';
import DashboardScreen from './dashboard';
import ReportScreen from './report';
import NotificationsScreen from './notifications';
import ProfileScreen from './profile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../theme';
import { t } from '../i18n';
import {
  BellIcon, AvatarIcon, CameraIcon, ArrowIcon,
  ListIcon, ClockIcon, CheckIcon, InfoIcon,
  HistoryIcon, CommandIcon, HeatmapIcon,
  HomeNavIcon, OverviewNavIcon, AlertsNavIcon, ProfileNavIcon,
} from '../components/icons';
import type { Complaint } from '../store/types';

const C = { ...colors, muted: 'rgba(255,255,255,0.40)' };
const { width: SW, height: SH } = Dimensions.get('window');
const CARD_W = (SW - 56) / 2;

const STATUS_COLORS: Record<string, string> = {
  pending: C.amber, assigned: C.blue, in_progress: C.gold,
  resolved: C.green, verified: C.blue, inspection: C.amber,
  closed: C.muted,
};

const TREND_UP = '▲';
const TREND_DOWN = '▼';
const TREND_FLAT = '―';

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good Morning';
  if (h < 17) return 'Good Afternoon';
  return 'Good Evening';
}

function getGreetingEmoji(): string {
  const h = new Date().getHours();
  if (h < 12) return '🌅';
  if (h < 17) return '☀️';
  return '🌙';
}

function useEntryAnimation(delay = 0) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(24);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 16 }));
  }, []);
  return useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));
}

function PulsingDot({ color = C.civicBlue, size = 8 }: { color?: string; size?: number }) {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1, false
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.6, 1], [0.7, 0.3, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [1, 2.4]) }],
  }));
  return (
    <View style={{ alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: size, height: size, borderRadius: size / 2, backgroundColor: color }, ringStyle]} />
      <View style={{ width: size, height: size, borderRadius: size / 2, backgroundColor: color }} />
    </View>
  );
}

function computeTrend(current: number, compare: number): { symbol: string; color: string; value: string } {
  if (compare === 0) return { symbol: TREND_FLAT, color: C.muted, value: '—' };
  const pct = Math.round(((current - compare) / compare) * 100);
  if (pct > 0) return { symbol: TREND_UP, color: C.green, value: `+${pct}%` };
  if (pct < 0) return { symbol: TREND_DOWN, color: C.danger, value: `${pct}%` };
  return { symbol: TREND_FLAT, color: C.muted, value: '0%' };
}

function NotifDot() {
  const ring = useSharedValue(0);
  useEffect(() => {
    ring.value = withRepeat(
      withTiming(1, { duration: 1800, easing: Easing.out(Easing.quad) }),
      -1, false
    );
  }, []);
  const ringStyle = useAnimatedStyle(() => ({
    opacity: interpolate(ring.value, [0, 0.6, 1], [0.7, 0.3, 0]),
    transform: [{ scale: interpolate(ring.value, [0, 1], [1, 2.4]) }],
  }));
  return (
    <View style={{ position: 'absolute', top: 4, right: 4, alignItems: 'center', justifyContent: 'center' }}>
      <Animated.View style={[{ position: 'absolute', width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444' }, ringStyle]} />
      <View style={{ width: 10, height: 10, borderRadius: 5, backgroundColor: '#EF4444', borderWidth: 2, borderColor: C.navy }} />
    </View>
  );
}

interface StatCardProps {
  value: number;
  label: string;
  color: string;
  icon: React.ReactNode;
  delay?: number;
  trend?: { symbol: string; color: string; value: string };
}

const StatCard: React.FC<StatCardProps> = memo(({ value, label, color, icon, delay = 0, trend }) => {
  const aStyle = useEntryAnimation(delay);
  const scale = useSharedValue(1);
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(withTiming(0.95, { duration: 80 }), withSpring(1, { damping: 12 }));
  };
  const sStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={{ width: (SW - 56) / 2 }}>
      <Animated.View style={[sStyle, aStyle]}>
        <GlassCard
          borderColor="rgba(255,255,255,0.06)"
          glowColor="rgba(255,255,255,0.03)"
          padding={14}
          style={{ borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <View style={{ width: 30, height: 30, borderRadius: 10, backgroundColor: color + '15', alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </View>
            {trend && (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
                <Text style={{ fontSize: 9, color: trend.color, fontFamily: 'Sora_700Bold' }}>{trend.symbol}</Text>
                <Text style={{ fontSize: 9, color: trend.color, fontFamily: 'Sora_600SemiBold' }}>{trend.value}</Text>
              </View>
            )}
          </View>
          <AnimatedCounter
            value={value}
            delay={delay}
            duration={1000}
            style={{ fontSize: 22, fontWeight: '800', color, fontFamily: 'Sora_800ExtraBold' }}
          />
          <Text style={{ fontSize: 10, color: C.muted, letterSpacing: 1.2, fontFamily: 'Sora_600SemiBold', textTransform: 'uppercase', marginTop: 2 }}>
            {label}
          </Text>
        </GlassCard>
      </Animated.View>
    </TouchableOpacity>
  );
});

interface QuickTileProps {
  label: string;
  icon: React.ReactNode;
  onPress: () => void;
  delay?: number;
  subtitle?: string;
  accentColor?: string;
}

const QuickTile: React.FC<QuickTileProps> = memo(({ label, icon, onPress, delay = 0, subtitle, accentColor = 'rgba(42,117,211,0.12)' }) => {
  const aStyle = useEntryAnimation(delay);
  const scale = useSharedValue(1);
  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(withTiming(0.94, { duration: 80 }), withSpring(1, { damping: 12 }));
    onPress();
  };
  const sStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={{ width: CARD_W, marginBottom: 10 }}>
      <Animated.View style={[sStyle, aStyle]}>
        <GlassCard
          borderColor="rgba(255,255,255,0.06)"
          glowColor="rgba(42,117,211,0.04)"
          padding={14}
          style={{ borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent' }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <View style={{ width: 40, height: 40, borderRadius: 12, backgroundColor: accentColor, alignItems: 'center', justifyContent: 'center' }}>
              {icon}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: 13, color: C.white, fontFamily: 'Sora_600SemiBold' }}>{label}</Text>
              {subtitle && <Text style={{ fontSize: 9, color: C.muted, fontFamily: 'Sora_400Regular', marginTop: 1 }}>{subtitle}</Text>}
            </View>
            <Text style={{ fontSize: 12, color: 'rgba(255,255,255,0.25)', fontFamily: 'Sora_400Regular' }}>→</Text>
          </View>
        </GlassCard>
      </Animated.View>
    </TouchableOpacity>
  );
});

interface ActiveComplaintCardProps {
  complaint: Complaint;
  index: number;
}

const ActiveComplaintCard: React.FC<ActiveComplaintCardProps> = ({ complaint, index }) => {
  const aStyle = useEntryAnimation(400 + index * 100);

  const progressMap: Record<string, number> = {
    pending: 0.1, assigned: 0.3, inspection: 0.45,
    in_progress: 0.65, resolved: 0.9, verified: 0.95, closed: 1,
  };
  const progress = progressMap[complaint.status] || 0;

  const statusColor = STATUS_COLORS[complaint.status] || C.muted;

  return (
    <Animated.View style={aStyle}>
      <TouchableOpacity activeOpacity={0.85}>
        <GlassCard
          borderColor="rgba(255,255,255,0.06)"
          glowColor="rgba(42,117,211,0.04)"
          padding={14}
          style={{ width: SW * 0.72, marginRight: 10, borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent' }}
        >
          <View style={{ gap: 8 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 10, color: C.gold, fontFamily: 'Sora_700Bold', letterSpacing: 0.5 }}>{complaint.id}</Text>
              <View style={{ backgroundColor: statusColor + '20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 }}>
                <Text style={{ fontSize: 9, color: statusColor, fontFamily: 'Sora_700Bold', textTransform: 'uppercase' }}>
                  {complaint.status.replace('_', ' ')}
                </Text>
              </View>
            </View>

            <Text style={{ fontSize: 13, color: C.white, fontFamily: 'Sora_600SemiBold' }} numberOfLines={1}>
              {complaint.title}
            </Text>

            {/* Progress bar */}
            <View style={{ height: 3, borderRadius: 2, backgroundColor: 'rgba(255,255,255,0.06)', overflow: 'hidden' }}>
              <View style={{ width: `${progress * 100}%`, height: '100%', borderRadius: 2, backgroundColor: statusColor }} />
            </View>

            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text style={{ fontSize: 9, color: C.muted, fontFamily: 'Sora_400Regular' }}>{complaint.department}</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <View style={{ width: 5, height: 5, borderRadius: 2.5, backgroundColor: statusColor }} />
                <Text style={{ fontSize: 9, color: statusColor, fontFamily: 'Sora_600SemiBold', textTransform: 'capitalize' }}>
                  {complaint.priority} priority
                </Text>
              </View>
            </View>
          </View>
        </GlassCard>
      </TouchableOpacity>
    </Animated.View>
  );
};

const CATEGORY_CHIPS = ['Pothole', 'Garbage', 'Streetlight', 'Water Leak', 'Drainage'];

const CategoryChip: React.FC<{ label: string; index: number; onPress: (label: string) => void }> = memo(({ label, index, onPress }) => {
  const aStyle = useEntryAnimation(500 + index * 80);
  return (
    <Animated.View style={aStyle}>
      <TouchableOpacity
        activeOpacity={0.8}
        onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); onPress(label); }}
        style={{
          paddingHorizontal: 14, paddingVertical: 7, borderRadius: 16,
          backgroundColor: 'rgba(42,117,211,0.1)', borderWidth: 1, borderColor: 'rgba(42,117,211,0.25)',
          marginRight: 8,
        }}
      >
        <Text style={{ fontSize: 11, color: C.civicBlue, fontFamily: 'Sora_600SemiBold' }}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
});

export default function HomeScreen() {
  const router = useRouter();
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hasSeenLaunch = useAppStore((s) => s.hasSeenLaunch);
  const user = useAppStore((s) => s.user);
  const complaints = useAppStore((s) => s.complaints);
  const notifications = useAppStore((s) => s.notifications);

  const insets = useSafeAreaInsets();
  const { height: WH } = useWindowDimensions();
  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<ScrollView>(null);
  const NAV_H = 84 + insets.bottom;
  const PAGE_H = WH - insets.top;

  // Time-based state (re-computes on mount)
  const greetingText = useMemo(() => getGreeting(), []);
  const greetingEmoji = useMemo(() => getGreetingEmoji(), []);

  const onMomentumScrollEnd = (event: any) => {
    const xOffset = event.nativeEvent.contentOffset.x;
    const index = Math.round(xOffset / SW);
    if (index !== activeTab && index >= 0 && index < 5) {
      setActiveTab(index);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  };

  const navigateToTab = (index: number) => {
    setActiveTab(index);
    pagerRef.current?.scrollTo({ x: index * SW, animated: true });
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({ onScroll: (event) => { scrollY.value = event.contentOffset.y; } });

  const indicatorX = useSharedValue(0);
  const NAV_ITEM_WIDTH = (SW - 16) / 5;
  useEffect(() => {
    const target = activeTab < 2 ? activeTab * NAV_ITEM_WIDTH : (activeTab - 1) * NAV_ITEM_WIDTH;
    indicatorX.value = withSpring(target + NAV_ITEM_WIDTH * 0.2, { damping: 18, stiffness: 150 });
  }, [activeTab]);

  const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicatorX.value }] }));

  const headerOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 80], [1, 0]),
    transform: [{ translateY: interpolate(scrollY.value, [0, 80], [0, -30]) }],
  }));

  useEffect(() => {
    if (!hasSeenLaunch) return;
    if (!isLoggedIn) {
      const timer = setTimeout(() => router.replace('/login'), 100);
      return () => clearTimeout(timer);
    }
  }, [isLoggedIn, hasSeenLaunch]);

  if (!hasSeenLaunch || !isLoggedIn) return null;

  const total = complaints.length;
  const activeCount = complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length;
  const resolvedCount = complaints.filter(c => c.status === 'resolved').length;
  const highPriorityCount = complaints.filter(c => c.priority === 'high' || c.priority === 'critical').length;

  // Fake trends — compare to a baseline (e.g. 80% of current)
  const baseline = Math.max(1, Math.round(total * 0.7));
  const activeBaseline = Math.max(1, Math.round(activeCount * 0.6));

  const trends = {
    total: computeTrend(total, baseline),
    active: computeTrend(activeCount, activeBaseline),
    resolved: computeTrend(resolvedCount, Math.max(1, Math.round(resolvedCount * 0.5))),
    highPriority: computeTrend(highPriorityCount, Math.max(1, Math.round(highPriorityCount * 0.8))),
  };

  const unreadNotes = notifications.filter(n => !n.read).length;
  const activeComplaints = complaints.filter(c => c.status !== 'resolved' && c.status !== 'closed').slice(0, 5);

  const handleQuickReportCategory = (cat: string) => {
    navigateToTab(2);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      <ScrollView
        ref={pagerRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={onMomentumScrollEnd}
        scrollEventThrottle={16}
        style={styles.pager}
        contentContainerStyle={{ flexGrow: 1 }}
      >
        {/* ─── HOME TAB ─── */}
        <View style={[styles.page, { height: PAGE_H }]}>
          <GlowingOrb color={colors.gold} startX={-60} startY={SH * 0.08} delay={0} />
          <GlowingOrb color={colors.blue} startX={SW - 180} startY={SH * 0.45} delay={1500} />

          <Animated.ScrollView
            style={styles.scroll}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: NAV_H + 20 }]}
            showsVerticalScrollIndicator={false}
            onScroll={scrollHandler}
            scrollEventThrottle={16}
          >

            {/* ── Header ── */}
            <Animated.View style={[styles.header, headerOpacity]}>
              <View style={styles.greeting}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <Text style={{ fontSize: 16 }}>{greetingEmoji}</Text>
                  <Text style={styles.greetingSmall}>{greetingText}</Text>
                </View>
                <View style={styles.greetingRow}>
                  <LinearGradient
                    colors={['#C9A84C', '#FDB813']}
                    start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
                    style={{ width: 3, height: 28, borderRadius: 2, marginRight: 10 }}
                  />
                  <Text style={styles.greetingName}>{user?.name || 'Citizen'}</Text>
                </View>
              </View>
              <View style={styles.headerIcons}>
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => navigateToTab(3)}>
                  <BellIcon />
                  {unreadNotes > 0 && <NotifDot />}
                </TouchableOpacity>
                <TouchableOpacity style={[styles.iconBtn, styles.avatarRing]} activeOpacity={0.8} onPress={() => navigateToTab(4)}>
                  <AvatarIcon />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* ── Hero CTA ── */}
            <View style={{ paddingHorizontal: 20, marginBottom: 20 }}>
              <TouchableOpacity
                activeOpacity={0.9}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  navigateToTab(2);
                }}
              >
                <LinearGradient
                  colors={['rgba(42,117,211,0.4)', 'rgba(0,210,255,0.2)', 'rgba(42,117,211,0.3)']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                  style={{ borderRadius: 24, padding: 1 }}
                >
                  <GlassCard
                    borderColor="transparent"
                    glowColor="rgba(0,210,255,0.15)"
                    intensity={50}
                    padding={18}
                    style={{ borderRadius: 23, borderWidth: 0, backgroundColor: 'rgba(5,16,30,0.6)' }}
                  >
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                      <LinearGradient
                        colors={['rgba(42,117,211,0.3)', 'rgba(0,210,255,0.12)']}
                        style={{ width: 54, height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(42,117,211,0.35)' }}
                      >
                        <CameraIcon />
                      </LinearGradient>
                      <View style={{ flex: 1 }}>
                        <Text style={{ fontSize: 18, fontWeight: '700', color: C.white, fontFamily: 'Sora_700Bold' }}>{t('home.reportIssue')}</Text>
                        <Text style={{ fontSize: 12, color: C.muted, fontFamily: 'Sora_400Regular', marginTop: 2 }}>{t('home.aiAutoRoute')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, backgroundColor: 'rgba(42,117,211,0.12)', borderWidth: 1, borderColor: 'rgba(42,117,211,0.3)' }}>
                          <PulsingDot color={C.civicBlue} size={6} />
                          <Text style={{ fontSize: 10, color: C.civicBlue, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.3 }}>{t('home.getStarted')}</Text>
                        </View>
                      </View>
                      <LinearGradient
                        colors={['rgba(42,117,211,0.25)', 'rgba(42,117,211,0.05)']}
                        style={{ width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(42,117,211,0.3)' }}
                      >
                        <ArrowIcon />
                      </LinearGradient>
                    </View>
                  </GlassCard>
                </LinearGradient>
              </TouchableOpacity>

              {/* Quick category chips */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 2, paddingTop: 12 }}>
                {CATEGORY_CHIPS.map((cat, i) => (
                  <CategoryChip key={cat} label={cat} index={i} onPress={handleQuickReportCategory} />
                ))}
              </ScrollView>
            </View>

            {/* ── Stats Grid (2×2) ── */}
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['rgba(201,168,76,0.8)', 'rgba(253,184,19,0.4)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: 3, height: 18, borderRadius: 2 }}
              />
              <Text style={styles.sectionTitle}>{t('home.yourOverview')}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 20, gap: 10 }}>
              <StatCard value={total} label={t('home.total')} color={C.white} icon={<ListIcon color="rgba(255,255,255,0.6)" />} delay={200} trend={trends.total} />
              <StatCard value={activeCount} label={t('home.active')} color={C.amber} icon={<ClockIcon color={C.amber} />} delay={260} trend={trends.active} />
              <StatCard value={resolvedCount} label={t('home.resolved')} color={C.green} icon={<CheckIcon color={C.green} />} delay={320} trend={trends.resolved} />
              <StatCard value={highPriorityCount} label="High Priority" color={C.danger} icon={<InfoIcon color={C.danger} />} delay={380} trend={trends.highPriority} />
            </View>

            {/* ── Map Preview ── */}
            <View style={{ marginTop: 4 }}>
              <MapPreview />
            </View>

            {/* ── Active Complaints ── */}
            {activeComplaints.length > 0 && (
              <View style={{ marginBottom: 16 }}>
                <View style={styles.sectionHeader}>
                  <LinearGradient
                    colors={['rgba(0,210,255,0.8)', 'rgba(42,117,211,0.4)']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ width: 3, height: 18, borderRadius: 2 }}
                  />
                  <Text style={styles.sectionTitle}>Active Complaints</Text>
                  <Text style={{ fontSize: 10, color: C.muted, fontFamily: 'Sora_400Regular', marginLeft: 'auto', paddingRight: 24 }}>
                    {activeComplaints.length} open
                  </Text>
                </View>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20 }}>
                  {activeComplaints.map((c, i) => (
                    <ActiveComplaintCard key={c.id} complaint={c} index={i} />
                  ))}
                </ScrollView>
              </View>
            )}

            {/* ── Quick Access ── */}
            <View style={styles.sectionHeader}>
              <LinearGradient
                colors={['rgba(46,204,143,0.8)', 'rgba(46,204,143,0.3)']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={{ width: 3, height: 18, borderRadius: 2 }}
              />
              <Text style={styles.sectionTitle}>{t('home.quickAccess')}</Text>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 18, gap: 0, justifyContent: 'space-between' }}>
              <QuickTile label={t('home.history')} subtitle="Track your reports" icon={<HistoryIcon />} onPress={() => router.push('/history')} delay={300} />
              <QuickTile label={t('home.heatmap')} subtitle="City issue clusters" icon={<HeatmapIcon />} onPress={() => router.push('/heatmap')} delay={350} />
              {user?.role === 'Citizen' ? (
                <QuickTile label={t('home.aiAssistant')} subtitle="24/7 AI support" icon={<Text style={{ fontSize: 18 }}>🤖</Text>} onPress={() => router.push('/chat')} delay={400} accentColor="rgba(201,168,76,0.12)" />
              ) : (
                <QuickTile label={t('home.command')} subtitle="Dispatch control" icon={<CommandIcon />} onPress={() => navigateToTab(1)} delay={400} />
              )}
              {user?.role !== 'Citizen' && (
                <>
                  <QuickTile label={t('home.aiAssistant')} subtitle="AI helpdesk" icon={<Text style={{ fontSize: 18 }}>🤖</Text>} onPress={() => router.push('/chat')} delay={450} accentColor="rgba(201,168,76,0.12)" />
                  <QuickTile label={t('home.adminControl')} subtitle="Command center" icon={<Text style={{ fontSize: 18 }}>⚡</Text>} onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium); router.push('/admin'); }} delay={500} accentColor="rgba(239,68,68,0.12)" />
                </>
              )}
            </View>

            {/* ── AI Insights Badge ── */}
            <View style={{ paddingHorizontal: 20, marginTop: 8, marginBottom: 20 }}>
              <GlassCard
                borderColor="rgba(201,168,76,0.15)"
                glowColor="rgba(201,168,76,0.06)"
                padding={14}
                pulsating
                style={{ borderRadius: 16, borderWidth: 0, backgroundColor: 'transparent' }}
              >
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <LinearGradient
                    colors={['rgba(201,168,76,0.25)', 'rgba(201,168,76,0.05)']}
                    style={{ width: 36, height: 36, borderRadius: 10, alignItems: 'center', justifyContent: 'center' }}
                  >
                    <Text style={{ fontSize: 16 }}>🧠</Text>
                  </LinearGradient>
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontSize: 12, color: C.gold, fontFamily: 'Sora_600SemiBold' }}>AI-Powered Analysis</Text>
                    <Text style={{ fontSize: 10, color: C.muted, fontFamily: 'Sora_400Regular', marginTop: 2 }}>Multi-language NLP · Smart routing · Auto-prioritization</Text>
                  </View>
                  <View style={{ backgroundColor: 'rgba(46,204,143,0.15)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 }}>
                    <Text style={{ fontSize: 9, color: C.green, fontFamily: 'Sora_700Bold' }}>LIVE</Text>
                  </View>
                </View>
              </GlassCard>
            </View>
          </Animated.ScrollView>
        </View>

        {/* ─── OTHER TABS ─── */}
        <View style={[styles.page, { height: PAGE_H }]}><DashboardScreen isTab /></View>
        <View style={[styles.page, { height: PAGE_H }]}><ReportScreen isTab /></View>
        <View style={[styles.page, { height: PAGE_H }]}><NotificationsScreen isTab /></View>
        <View style={[styles.page, { height: PAGE_H }]}><ProfileScreen isTab /></View>
      </ScrollView>

      {/* ── Bottom Nav ── */}
      <BlurView intensity={80} tint="dark" style={[styles.bottomNav, { height: NAV_H }]}>
        <Animated.View style={[styles.navIndicator, indicatorStyle]} />
        <View style={[styles.bottomNavInner, { paddingBottom: Math.max(12, insets.bottom) }]}>
          <NavItem label="Home" icon={<HomeNavIcon active={activeTab === 0} />} active={activeTab === 0} onPress={() => navigateToTab(0)} />
          <NavItem label="Overview" icon={<OverviewNavIcon active={activeTab === 1} />} active={activeTab === 1} onPress={() => navigateToTab(1)} />
          <TouchableOpacity activeOpacity={0.9} onPress={() => navigateToTab(2)} style={{ width: NAV_ITEM_WIDTH, alignItems: 'center', justifyContent: 'center', gap: 3 }}>
            <LinearGradient colors={['#2A75D3', '#3B82F6', '#00D2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.navFab}>
              <CameraIcon fab />
            </LinearGradient>
            <Text style={[styles.navLabel, activeTab === 2 && styles.navLabelActive]}>Report</Text>
          </TouchableOpacity>
          <NavItem label="Alerts" icon={<AlertsNavIcon active={activeTab === 3} />} active={activeTab === 3} onPress={() => navigateToTab(3)} />
          <NavItem label="Profile" icon={<ProfileNavIcon active={activeTab === 4} />} active={activeTab === 4} onPress={() => navigateToTab(4)} />
        </View>
      </BlurView>
    </View>
  );
}

const SectionHeader: React.FC<{ title: string }> = memo(({ title }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
));

interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onPress: () => void;
}

const NavItem: React.FC<NavItemProps> = memo(({ label, icon, active, onPress }) => {
  const scale = useSharedValue(1);
  const handlePress = () => {
    scale.value = withSequence(withTiming(0.88, { duration: 80 }), withSpring(1, { damping: 14 }));
    onPress();
  };
  const aStyle = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <TouchableOpacity style={styles.navItem} activeOpacity={1} onPress={handlePress}>
      <Animated.View style={[{ alignItems: 'center', gap: 3 }, aStyle]}>
        {icon}
        <Text style={[styles.navLabel, active && styles.navLabelActive]}>{label}</Text>
      </Animated.View>
    </TouchableOpacity>
  );
});

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: 'transparent' },
  pager: { flex: 1 },
  page: { width: SW, height: '100%' },
  scroll: { flex: 1 },
  scrollContent: { paddingTop: 16, paddingBottom: 100 },
  header: {
    flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between',
    paddingHorizontal: 24, paddingBottom: 20, paddingTop: 8,
  },
  greeting: { flex: 1 },
  greetingSmall: { fontSize: 13, color: C.muted, letterSpacing: 0.5, fontFamily: 'Sora_400Regular' },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingName: { fontSize: 26, fontWeight: '800', color: C.white, letterSpacing: -0.5, fontFamily: 'Sora_800ExtraBold' },
  headerIcons: { flexDirection: 'row', gap: 12, marginTop: 8 },
  iconBtn: {
    width: 42, height: 42, borderRadius: 21,
    backgroundColor: 'rgba(13,27,46,0.8)', borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center', position: 'relative',
  },
  avatarRing: { borderColor: 'rgba(42,117,211,0.5)', borderWidth: 1.5 },
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingTop: 8, paddingBottom: 14,
  },
  sectionTitle: {
    fontSize: 15, fontWeight: '700', color: C.white,
    fontFamily: 'Sora_700Bold', letterSpacing: 0.3,
  },
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0, height: 84, borderTopWidth: 0,
  },
  navIndicator: {
    position: 'absolute', top: 0, left: 0, width: 28, height: 3,
    borderRadius: 2, backgroundColor: '#3B82F6', marginLeft: 8,
  },
  bottomNavInner: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'space-around', paddingHorizontal: 8, paddingBottom: 12,
  },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 8 },
  navLabel: {
    fontSize: 9, color: 'rgba(255,255,255,0.3)',
    fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5,
  },
  navLabelActive: { color: '#3B82F6' },
  navFab: {
    width: 56, height: 56, borderRadius: 28,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#3B82F6', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.6, shadowRadius: 16, elevation: 10,
  },
});
