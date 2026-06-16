import React, { useEffect, useRef, useState } from 'react';
import {
  Dimensions,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import DashboardScreen from './dashboard';
import ReportScreen from './report';
import NotificationsScreen from './notifications';
import ProfileScreen from './profile';
import { useSafeAreaInsets } from 'react-native-safe-area-context';


// ─────────────────────────────────────────────
// DESIGN TOKENS
// ─────────────────────────────────────────────
const C = {
  navy:       '#05101E',
  surface:    '#0D1B2E',
  elevated:   '#112236',
  amber:      '#FDB813',
  green:      '#2ECC8F',
  blue:       '#00D2FF',
  civicBlue:  '#2A75D3',
  civicBlueDim: 'rgba(42,117,211,0.15)',
  civicBlueBorder: 'rgba(42,117,211,0.35)',

  white:      'rgba(255,255,255,0.92)',
  muted:      'rgba(255,255,255,0.40)',
  border:     'rgba(255,255,255,0.06)',
} as const;

const { width: SW, height: SH } = Dimensions.get('window');

// ─────────────────────────────────────────────
// PREMIUM DYNAMIC AMBIENT BACKDROP (100% Crash-Free)
// ─────────────────────────────────────────────


// ─────────────────────────────────────────────
// STAT CARD
// ─────────────────────────────────────────────
interface StatCardProps {
  value: number;
  label: string;
  color: string;
  borderColor: string;
  glowColor: string;
  icon: React.ReactNode;
  delay?: number;
}

const StatCard: React.FC<StatCardProps> = ({ value, label, color, borderColor, glowColor, icon, delay = 0 }) => {
  const scale  = useSharedValue(0.88);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    scale.value   = withDelay(delay, withSpring(1, { damping: 14, stiffness: 120 }));
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.95, { duration: 80 }),
      withSpring(1, { damping: 12 })
    );
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.85} style={{ flex: 1 }}>
      <GlassCard
        style={[styles.statCard, aStyle]}
        borderColor={borderColor}
        glowColor={glowColor}
        delay={delay}
        padding={18}
      >
        <Text style={[styles.statNumber, { color }]}>{value}</Text>
        <Text style={styles.statLabel}>{label}</Text>
        <View style={styles.statIconWrap}>{icon}</View>
      </GlassCard>
    </TouchableOpacity>
  );
};


// ─────────────────────────────────────────────
// QUICK TILE
// ─────────────────────────────────────────────
interface QuickTileProps {
  label: string;
  active?: boolean;
  icon: React.ReactNode;
  onPress: () => void;
  delay?: number;
}

const QuickTile: React.FC<QuickTileProps> = ({ label, active, icon, onPress, delay = 0 }) => {
  const scale   = useSharedValue(0.85);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 500 }));
    scale.value   = withDelay(delay, withSpring(1, { damping: 13 }));
  }, []);

  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ scale: scale.value }],
  }));

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    scale.value = withSequence(
      withTiming(0.93, { duration: 80 }),
      withSpring(1, { damping: 12 })
    );
    onPress();
  };

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.8} style={{ flex: 1 }}>
      <GlassCard
        style={[styles.quickTile, active && styles.quickTileActive, aStyle]}
        borderColor={active ? 'rgba(42,117,211,0.35)' : 'rgba(255,255,255,0.08)'}
        glowColor={active ? 'rgba(42,117,211,0.08)' : undefined}
        delay={delay}
        padding={14}
      >
        <View style={{ alignItems: 'center', gap: 10 }}>
          <View style={styles.quickIconCircle}>{icon}</View>
          <Text style={[styles.quickLabel, active && { color: C.civicBlue }]}>{label}</Text>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
};


// ─────────────────────────────────────────────
// NOTIFICATION DOT with pulsing ring
// ─────────────────────────────────────────────
const NotifDot: React.FC = () => {
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
    <View style={styles.notifDotWrap}>
      <Animated.View style={[styles.notifDotRing, ringStyle]} />
      <View style={styles.notifDot} />
    </View>
  );
};

// ─────────────────────────────────────────────
// MAIN HOME ROUTE
// ─────────────────────────────────────────────
export default function HomeScreen() {
  const router = useRouter();
  const isLoggedIn = useAppStore((s) => s.isLoggedIn);
  const hasSeenLaunch = useAppStore((s) => s.hasSeenLaunch);
  const user = useAppStore((s) => s.user);
  const complaints = useAppStore((s) => s.complaints);
  const notifications = useAppStore((s) => s.notifications);

  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState(0);
  const pagerRef = useRef<ScrollView>(null);

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

  // entrance animations
  const headerY   = useSharedValue(24);
  const headerOp  = useSharedValue(0);
  const heroY     = useSharedValue(30);
  const heroOp    = useSharedValue(0);
  const heroScale = useSharedValue(0.97);

  // hero breathe
  const breathe = useSharedValue(0);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: headerOp.value,
    transform: [{ translateY: headerY.value }],
  }));
  const heroStyle = useAnimatedStyle(() => ({
    opacity: heroOp.value,
    transform: [{ translateY: heroY.value }, { scale: heroScale.value }],
  }));
  const glowStyle = useAnimatedStyle(() => ({
    opacity:   interpolate(breathe.value, [0, 1], [0.55, 1]),
    transform: [{ scale: interpolate(breathe.value, [0, 1], [1, 1.12]) }],
  }));

  useEffect(() => {
    // Prevent synchronous transitions during launch screens
    if (!hasSeenLaunch) return;

    if (!isLoggedIn) {
      const timer = setTimeout(() => {
        router.replace('/login');
      }, 100);
      return () => clearTimeout(timer);
    }

    headerOp.value = withDelay(120, withTiming(1, { duration: 500 }));
    headerY.value  = withDelay(120, withSpring(0, { damping: 16 }));
    heroOp.value   = withDelay(220, withTiming(1, { duration: 500 }));
    heroY.value    = withDelay(220, withSpring(0, { damping: 14 }));
    heroScale.value = withDelay(220, withSpring(1, { damping: 14 }));

    breathe.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 3800, easing: Easing.inOut(Easing.sin) }),
        withTiming(0, { duration: 3800, easing: Easing.inOut(Easing.sin) })
      ),
      -1, false
    );
  }, [isLoggedIn, hasSeenLaunch]);

  // Shield rendering during launch transition to fully avoid stack navigation crashes
  if (!hasSeenLaunch || !isLoggedIn) return null;

  const stats = {
    total: complaints.length,
    active: complaints.filter(c => ['assigned', 'in_progress'].includes(c.status)).length,
    resolved: complaints.filter(c => c.status === 'resolved').length,
    pending: complaints.filter(c => c.status === 'pending').length,
  };

  const unreadNotes = notifications.filter(n => !n.read).length;

  const handleHeroPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    heroScale.value = withSequence(
      withTiming(0.97, { duration: 100 }),
      withSpring(1, { damping: 12 })
    );
    navigateToTab(2);
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* ── Swipeable Horizontal Pager ── */}
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
        {/* Tab 0: Home Page Content */}
        <View style={styles.page}>
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <Animated.View style={[styles.header, headerStyle]}>
              <View style={styles.greeting}>
                <Text style={styles.greetingSmall}>Welcome back,</Text>
                <View style={styles.greetingRow}>
                  <View style={styles.goldAccentBar} />
                  <Text style={styles.greetingName}>{user?.name || 'Citizen'}</Text>
                </View>
              </View>
              <View style={styles.headerIcons}>
                {/* Bell Notifications */}
                <TouchableOpacity style={styles.iconBtn} activeOpacity={0.8} onPress={() => navigateToTab(3)}>
                  <BellIcon />
                  {unreadNotes > 0 && <NotifDot />}
                </TouchableOpacity>
                {/* Avatar Profile */}
                <TouchableOpacity style={[styles.iconBtn, styles.avatarRing]} activeOpacity={0.8} onPress={() => navigateToTab(4)}>
                  <AvatarIcon />
                </TouchableOpacity>
              </View>
            </Animated.View>

            {/* Hero Ingestion Trigger Card */}
            <TouchableOpacity onPress={handleHeroPress} activeOpacity={0.9}>
              <GlassCard
                style={[styles.heroCard, heroStyle]}
                borderColor="rgba(0,210,255,0.3)"
                glowColor="rgba(0,210,255,0.15)"
                intensity={45}
                padding={22}
              >
                <View style={styles.heroInner}>
                  <View style={styles.heroIconWrap}>
                    <CameraIcon />
                  </View>
                  <View style={styles.heroText}>
                    <Text style={styles.heroTitle}>Report Issue</Text>
                    <Text style={styles.heroSubtitle}>AI will auto-route to department</Text>
                    <View style={styles.heroPill}>
                      <View style={styles.heroPillDot} />
                      <Text style={styles.heroPillText}>Get Started</Text>
                    </View>
                  </View>
                  <View style={styles.heroArrow}>
                    <ArrowIcon />
                  </View>
                </View>
                {/* bottom gold gradient line */}
                <LinearGradient
                  colors={['transparent', 'rgba(42,117,211,0.4)', 'transparent']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.heroBottomLine}
                />
              </GlassCard>
            </TouchableOpacity>

            {/* Your Overview Dynamic Metrics Grid */}
            <SectionHeader title="Your Overview" />
            <View style={styles.statsGrid}>
              <StatCard
                value={stats.total} label="TOTAL"
                color={C.white}
                borderColor={C.border}
                glowColor="rgba(255,255,255,0.04)"
                icon={<ListIcon color="rgba(255,255,255,0.4)" />}
                delay={350}
              />
              <StatCard
                value={stats.active} label="ACTIVE"
                color={C.amber}
                borderColor="rgba(245,166,35,0.35)"
                glowColor="rgba(245,166,35,0.12)"
                icon={<ClockIcon color={C.amber} />}
                delay={420}
              />
              <StatCard
                value={stats.resolved} label="RESOLVED"
                color={C.green}
                borderColor="rgba(46,204,143,0.3)"
                glowColor="rgba(46,204,143,0.10)"
                icon={<CheckIcon color={C.green} />}
                delay={490}
              />
              <StatCard
                value={stats.pending} label="PENDING"
                color={C.blue}
                borderColor="rgba(61,142,240,0.3)"
                glowColor="rgba(61,142,240,0.10)"
                icon={<InfoIcon color={C.blue} />}
                delay={560}
              />
            </View>

            {/* Operations Quick Access Tiles */}
            {user?.role === 'Citizen' ? (
              <>
                <SectionHeader title="Quick Access Operations" />
                <View style={styles.quickGrid}>
                  <QuickTile label="History" icon={<HistoryIcon />} onPress={() => router.push('/history')} delay={620} />
                  <QuickTile label="Heatmap" icon={<HeatmapIcon />} onPress={() => router.push('/heatmap')} delay={690} />
                  <QuickTile label="AI Assistant" icon={<Text style={{ fontSize: 20 }}>🤖</Text>} onPress={() => router.push('/chat')} delay={760} />
                </View>
              </>
            ) : (
              <>
                <SectionHeader title="Quick Access Operations" />
                <View style={styles.quickGrid}>
                  <QuickTile label="History" icon={<HistoryIcon />} onPress={() => router.push('/history')} delay={620} />
                  <QuickTile label="Command" icon={<CommandIcon />} active onPress={() => navigateToTab(1)} delay={690} />
                  <QuickTile label="Heatmap" icon={<HeatmapIcon />} onPress={() => router.push('/heatmap')} delay={760} />
                </View>

                {/* Premium AI Chatbot & Administration control additions */}
                <SectionHeader title="AI & Administration" />
                <View style={styles.quickGrid}>
                  <QuickTile label="AI Assistant" icon={<Text style={{ fontSize: 20 }}>🤖</Text>} onPress={() => router.push('/chat')} delay={830} />
                  <QuickTile
                    label="Admin Control"
                    icon={<Text style={{ fontSize: 20 }}>⚡</Text>}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                      router.push('/admin');
                    }}
                    delay={900}
                  />
                </View>
              </>
            )}

            <View style={{ height: 120 }} />
          </ScrollView>
        </View>

        {/* Tab 1: Dashboard */}
        <View style={styles.page}>
          <DashboardScreen isTab />
        </View>

        {/* Tab 2: Report */}
        <View style={styles.page}>
          <ReportScreen isTab />
        </View>

        {/* Tab 3: Alerts */}
        <View style={styles.page}>
          <NotificationsScreen isTab />
        </View>

        {/* Tab 4: Profile */}
        <View style={styles.page}>
          <ProfileScreen isTab />
        </View>
      </ScrollView>

      {/* ── Bottom Glassmorphic Navigation Bar ── */}
      <BlurView intensity={60} tint="dark" style={[styles.bottomNav, { height: 84 + insets.bottom }]}>
        <View style={[styles.bottomNavInner, { paddingBottom: 12 + insets.bottom }]}>
          <NavItem label="Home" icon={<HomeNavIcon active={activeTab === 0} />} active={activeTab === 0} onPress={() => navigateToTab(0)} />
          <NavItem label="Overview" icon={<OverviewNavIcon active={activeTab === 1} />} active={activeTab === 1} onPress={() => navigateToTab(1)} />
          {/* Main FAB Trigger */}
          <TouchableOpacity style={styles.navFab} activeOpacity={0.85} onPress={() => navigateToTab(2)}>
            <CameraIcon fab active={activeTab === 2} />
          </TouchableOpacity>
          <NavItem label="Alerts" icon={<AlertsNavIcon active={activeTab === 3} />} active={activeTab === 3} onPress={() => navigateToTab(3)} />
          <NavItem label="Profile" icon={<ProfileNavIcon active={activeTab === 4} />} active={activeTab === 4} onPress={() => navigateToTab(4)} />
        </View>
      </BlurView>
    </View>
  );
}

// ─────────────────────────────────────────────
// SECTION HEADER
// ─────────────────────────────────────────────
const SectionHeader: React.FC<{ title: string }> = ({ title }) => (
  <View style={styles.sectionHeader}>
    <View style={styles.sectionAccent} />
    <Text style={styles.sectionTitle}>{title}</Text>
  </View>
);

// ─────────────────────────────────────────────
// NAV ITEM
// ─────────────────────────────────────────────
interface NavItemProps {
  label: string;
  icon: React.ReactNode;
  active?: boolean;
  onPress: () => void;
}

const NavItem: React.FC<NavItemProps> = ({ label, icon, active, onPress }) => (
  <TouchableOpacity style={styles.navItem} activeOpacity={0.7} onPress={onPress}>
    {icon}
    {active
      ? <View style={styles.navDot} />
      : <Text style={styles.navLabel}>{label}</Text>
    }
  </TouchableOpacity>
);

// ─────────────────────────────────────────────
// INLINE SVG ICONS (React Native SVG)
// ─────────────────────────────────────────────
import Svg, { Circle as SvgCircle, Path as SvgPath, Rect as SvgRect, Line as SvgLine } from 'react-native-svg';

const BellIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <SvgPath d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9" stroke={C.civicBlue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
    <SvgPath d="M13.73 21a2 2 0 01-3.46 0" stroke={C.civicBlue} strokeWidth={1.8} strokeLinecap="round"/>
  </Svg>
);

const AvatarIcon = () => (
  <Svg width={18} height={18} viewBox="0 0 24 24" fill="none">
    <SvgPath d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke="rgba(255,255,255,0.6)" strokeWidth={1.8} strokeLinecap="round"/>
    <SvgCircle cx={12} cy={7} r={4} stroke="rgba(255,255,255,0.6)" strokeWidth={1.8}/>
  </Svg>
);

const CameraIcon: React.FC<{ fab?: boolean; active?: boolean }> = ({ fab, active }) => {
  const color = fab ? C.white : C.civicBlue;
  return (
    <Svg width={fab ? 22 : 28} height={fab ? 22 : 28} viewBox="0 0 28 28" fill="none">
      <SvgRect x={3} y={7} width={22} height={16} rx={3} stroke={color} strokeWidth={1.6}/>
      <SvgCircle cx={14} cy={15} r={4.5} stroke={color} strokeWidth={1.6}/>
      <SvgPath d="M9 7V5.5a2 2 0 012-2h6a2 2 0 012 2V7" stroke={color} strokeWidth={1.6} strokeLinecap="round"/>
      <SvgCircle cx={21} cy={11} r={1} fill={color}/>
    </Svg>
  );
};

const ArrowIcon = () => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <SvgPath d="M3 7h8M8 4.5l2.5 2.5-2.5 2.5" stroke={C.civicBlue} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const ListIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <SvgLine x1={2} y1={3} x2={12} y2={3} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
    <SvgLine x1={2} y1={7} x2={12} y2={7} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
    <SvgLine x1={2} y1={11} x2={8} y2={11} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
  </Svg>
);

const ClockIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <SvgCircle cx={7} cy={7} r={5} stroke={color} strokeWidth={1.4}/>
    <SvgPath d="M7 4v3l1.5 1.5" stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
  </Svg>
);

const CheckIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <SvgPath d="M2 7l4 4 6-6" stroke={color} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const InfoIcon: React.FC<{ color: string }> = ({ color }) => (
  <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
    <SvgCircle cx={7} cy={7} r={5} stroke={color} strokeWidth={1.4}/>
    <SvgLine x1={7} y1={5} x2={7} y2={7} stroke={color} strokeWidth={1.4} strokeLinecap="round"/>
    <SvgCircle cx={7} cy={9.5} r={0.7} fill={color}/>
  </Svg>
);

const HistoryIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <SvgPath d="M4 5h12M4 9h12M4 13h8" stroke={C.civicBlue} strokeWidth={1.6} strokeLinecap="round"/>
  </Svg>
);

const CommandIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <SvgRect x={3} y={13} width={3} height={5} rx={1} stroke={C.civicBlue} strokeWidth={1.5}/>
    <SvgRect x={8.5} y={9} width={3} height={9} rx={1} stroke={C.civicBlue} strokeWidth={1.5}/>
    <SvgRect x={14} y={5} width={3} height={13} rx={1} stroke={C.civicBlue} strokeWidth={1.5}/>
    <SvgPath d="M4.5 12l4-4 4 3 4-5" stroke={C.civicBlue} strokeWidth={1.4} strokeLinecap="round" strokeLinejoin="round"/>
  </Svg>
);

const HeatmapIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
    <SvgCircle cx={10} cy={9} r={3} stroke={C.civicBlue} strokeWidth={1.6}/>
    <SvgCircle cx={10} cy={9} r={6} stroke={C.civicBlue} strokeWidth={1} strokeOpacity={0.3}/>
    <SvgLine x1={10} y1={12} x2={10} y2={15} stroke={C.civicBlue} strokeWidth={1.6} strokeLinecap="round"/>
  </Svg>
);

const HomeNavIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <SvgPath d="M3 10.5L11 3l8 7.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1v-9.5z"
      stroke={active ? C.civicBlue : 'rgba(255,255,255,0.35)'}
      strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"
      fill={active ? 'rgba(42,117,211,0.15)' : 'none'}/>
    <SvgPath d="M8 21v-7h6v7" stroke={active ? C.civicBlue : 'rgba(255,255,255,0.35)'} strokeWidth={1.7} strokeLinecap="round"/>
  </Svg>
);

const OverviewNavIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <SvgPath d="M4 17l5-5 3 3 6-7" stroke={active ? C.civicBlue : "rgba(255,255,255,0.35)"} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round"/>
    <SvgRect x={2} y={2} width={18} height={18} rx={3} stroke={active ? "rgba(42,117,211,0.35)" : "rgba(255,255,255,0.2)"} strokeWidth={1}/>
  </Svg>
);

const AlertsNavIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <SvgPath d="M17 8A6 6 0 005 8c0 8-3 10-3 10h18s-3-2-3-10" stroke={active ? C.civicBlue : "rgba(255,255,255,0.35)"} strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" fill={active ? "rgba(42,117,211,0.15)" : "none"}/>
    <SvgPath d="M13 19a2 2 0 01-4 0" stroke={active ? C.civicBlue : "rgba(255,255,255,0.35)"} strokeWidth={1.7} strokeLinecap="round"/>
  </Svg>
);

const ProfileNavIcon: React.FC<{ active?: boolean }> = ({ active }) => (
  <Svg width={22} height={22} viewBox="0 0 22 22" fill="none">
    <SvgPath d="M18 20v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" stroke={active ? C.civicBlue : "rgba(255,255,255,0.35)"} strokeWidth={1.7} strokeLinecap="round"/>
    <SvgCircle cx={11} cy={7} r={4} stroke={active ? C.civicBlue : "rgba(255,255,255,0.35)"} strokeWidth={1.7} fill={active ? "rgba(42,117,211,0.15)" : "none"}/>
  </Svg>
);

// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  pager: {
    flex: 1,
  },
  page: {
    width: SW,
    height: '100%',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 100,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  greeting: { flex: 1 },
  greetingSmall: {
    fontSize: 12,
    color: C.muted,
    letterSpacing: 0.3,
    marginBottom: 4,
    fontFamily: 'Sora_400Regular',
  },
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  goldAccentBar: {
    width: 3, height: 28,
    backgroundColor: C.civicBlue,
    borderRadius: 2,
    marginRight: 8,
  },
  greetingName: {
    fontSize: 28,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
    fontFamily: 'Sora_800ExtraBold',
  },
  headerIcons: { flexDirection: 'row', gap: 10, marginTop: 4 },
  iconBtn: {
    width: 40, height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(13,27,46,0.8)',
    borderWidth: 1, borderColor: C.border,
    alignItems: 'center', justifyContent: 'center',
    position: 'relative'
  },
  avatarRing: { borderColor: 'rgba(42,117,211,0.5)', borderWidth: 1.5 },

  // Notif dot
  notifDotWrap: { position: 'absolute', top: 6, right: 6, alignItems: 'center', justifyContent: 'center' },
  notifDotRing: {
    position: 'absolute',
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.civicBlue,
  },
  notifDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: C.civicBlue,
    borderWidth: 1.5, borderColor: C.navy,
  },

  // Hero card
  heroCard: {
    marginHorizontal: 20,
    marginTop: 4,
    borderRadius: 22,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },

  heroGlow: {
    position: 'absolute',
    left: -20, top: -20,
    width: 200, height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(42,117,211,0.16)',
  },
  heroInner: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  heroIconWrap: {
    width: 56, height: 56, borderRadius: 16,
    backgroundColor: 'rgba(42,117,211,0.12)',
    borderWidth: 1, borderColor: 'rgba(42,117,211,0.25)',
    alignItems: 'center', justifyContent: 'center',
  },
  heroText: { flex: 1 },
  heroTitle: {
    fontSize: 18, fontWeight: '700', color: C.white,
    marginBottom: 4, fontFamily: 'Sora_700Bold',
  },
  heroSubtitle: {
    fontSize: 12, color: C.muted, lineHeight: 18,
    fontFamily: 'Sora_400Regular',
  },
  heroPill: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginTop: 12, alignSelf: 'flex-start',
    paddingHorizontal: 12, paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: 'rgba(42,117,211,0.10)',
    borderWidth: 1, borderColor: 'rgba(42,117,211,0.3)',
  },
  heroPillDot: { width: 5, height: 5, borderRadius: 2.5, backgroundColor: C.civicBlue },
  heroPillText: { fontSize: 11, color: C.civicBlue, letterSpacing: 0.5, fontFamily: 'Sora_400Regular' },
  heroArrow: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: C.civicBlueDim,
    borderWidth: 1, borderColor: C.civicBlueBorder,
    alignItems: 'center', justifyContent: 'center',
  },
  heroBottomLine: {
    position: 'absolute', bottom: 0, left: 20, right: 20, height: 1,
  },

  // Section header
  sectionHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: 24, paddingTop: 24, paddingBottom: 12,
  },
  sectionAccent: { width: 3, height: 18, backgroundColor: C.civicBlue, borderRadius: 2 },
  sectionTitle: {
    fontSize: 15, fontWeight: '600', color: C.white,
    fontFamily: 'Sora_600SemiBold',
  },

  // Stats grid
  statsGrid: {
    flexDirection: 'row', flexWrap: 'wrap',
    paddingHorizontal: 20, gap: 12,
  },
  statCard: {
    flex: 1, minWidth: '45%',
    borderRadius: 18,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },

  statGlow: {
    position: 'absolute', top: -30, left: -10,
    width: 120, height: 120, borderRadius: 60,
  },
  statNumber: { fontSize: 36, fontWeight: '800', lineHeight: 40, fontFamily: 'Sora_800ExtraBold' },
  statLabel: {
    fontSize: 10, color: C.muted, letterSpacing: 1.8,
    fontWeight: '500', marginTop: 6,
    fontFamily: 'Sora_400Regular',
  },
  statIconWrap: {
    position: 'absolute', top: 14, right: 14,
    width: 28, height: 28, borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
    alignItems: 'center', justifyContent: 'center',
  },

  // Quick access
  quickGrid: {
    flexDirection: 'row',
    paddingHorizontal: 20, gap: 12,
  },
  quickTile: {
    flex: 1,
    borderRadius: 18,
    borderWidth: 0,
    padding: 0,
    backgroundColor: 'transparent',
  },

  quickTileActive: { borderColor: 'rgba(42,117,211,0.5)' },
  quickIconCircle: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(42,117,211,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  quickLabel: {
    fontSize: 11, color: 'rgba(255,255,255,0.7)',
    fontWeight: '500', fontFamily: 'Sora_400Regular',
  },

  // Bottom nav
  bottomNav: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 84,
    borderTopWidth: 1, borderTopColor: C.border,
  },
  bottomNavInner: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingHorizontal: 8,
    paddingBottom: 12,
  },
  navItem: {
    flex: 1, alignItems: 'center', justifyContent: 'center', gap: 4,
    paddingVertical: 8,
  },
  navDot: { width: 4, height: 4, borderRadius: 2, backgroundColor: C.civicBlue },
  navLabel: {
    fontSize: 10, color: 'rgba(255,255,255,0.35)',
    fontFamily: 'Sora_400Regular',
  },
  navFab: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: C.civicBlue,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: C.civicBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.45,
    shadowRadius: 12,
    elevation: 8,
  },
});
