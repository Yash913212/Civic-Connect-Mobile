import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Linking } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withRepeat, withSequence, withTiming, withDelay } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { AnimatedCounter } from '../components/AnimatedCounter';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { t } from '../i18n';

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

const QUICK_ACTIONS = [
  { icon: '⚙', label: 'Settings', route: '/settings' as const },
  { icon: '🌐', label: 'Language', route: '/settings' as const },
  { icon: '🔒', label: 'Privacy Policy', route: undefined, url: 'https://civicai.app/privacy' },
  { icon: '📄', label: 'Terms of Service', route: undefined, url: 'https://civicai.app/terms' },
];

export default function ProfileScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const complaints = useAppStore((s) => s.complaints);
  const logout = useAppStore((s) => s.logout);
  const total = complaints.length;
  const resolved = complaints.filter((c) => c.status === 'resolved').length;
  const highPriority = complaints.filter((c) => ['high', 'critical'].includes(c.priority)).length;

  const initials = (user?.name || 'C').charAt(0).toUpperCase();
  const roleColors: Record<string, string[]> = {
    Citizen: ['#3B82F6', '#00D2FF'],
    Officer: ['#10B981', '#06B6D4'],
    Admin: ['#C9A84C', '#F59E0B'],
  };
  const avatarGradient = (roleColors[user?.role || 'Citizen'] ?? roleColors.Citizen) as unknown as readonly [string, string];

  const ringScale = useSharedValue(1);
  useEffect(() => {
    ringScale.value = withRepeat(
      withSequence(withSpring(1.05, { damping: 8 }), withSpring(1, { damping: 8 })),
      -1,
      true,
    );
  }, []);

  const ringStyle = useAnimatedStyle(() => ({
    transform: [{ scale: ringScale.value }],
  }));

  return (
    <ScreenLayout showOrbs={!isTab} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
      {!isTab && (
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>{t('profile.title')}</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            style={s.headerBtn}
          >
            <Text style={s.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      )}

      <ScrollView contentContainerStyle={[s.content, { paddingBottom: isTab ? 140 : 40 }]} showsVerticalScrollIndicator={false}>
        {/* Animated Avatar with Ring (centered) */}
        <EntryView delay={50} style={{ alignItems: 'center' }}>
          <View style={s.avatarWrap}>
            <Animated.View style={[s.avatarRing, ringStyle]}>
              <LinearGradient colors={avatarGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.avatar}>
                <Text style={s.avatarText}>{initials}</Text>
              </LinearGradient>
            </Animated.View>
          </View>
          <Text style={s.name}>{user?.name || 'Citizen'}</Text>
          <View style={s.roleBadge}>
            <View style={[s.roleDot, { backgroundColor: avatarGradient[0] }]} />
            <Text style={s.roleText}>{user?.role || 'Citizen'}</Text>
          </View>
        </EntryView>

        {/* Stats Row (centered) */}
        <EntryView delay={150} style={{ alignItems: 'center' }}>
          <View style={s.statsRow}>
            <LinearGradient colors={['rgba(201,168,76,0.15)', 'rgba(201,168,76,0.05)'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
              <AnimatedCounter value={total} delay={200} duration={1200} style={s.statVal} suffix="" />
              <Text style={s.statLabel}>{t('profile.total')}</Text>
            </LinearGradient>
            <LinearGradient colors={['rgba(46,204,143,0.15)', 'rgba(46,204,143,0.05)'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
              <AnimatedCounter value={resolved} delay={350} duration={1200} style={[s.statVal, { color: colors.green }]} suffix="" />
              <Text style={s.statLabel}>{t('profile.resolved')}</Text>
            </LinearGradient>
            <LinearGradient colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.05)'] as const} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.statCard}>
              <AnimatedCounter value={highPriority} delay={500} duration={1200} style={[s.statVal, { color: colors.danger }]} suffix="" />
              <Text style={s.statLabel}>High</Text>
            </LinearGradient>
          </View>
        </EntryView>

        {/* Account Details (full width) */}
        <EntryView delay={200} style={{ width: '100%' }}>
          <View style={s.sectionHeader}>
            <LinearGradient colors={['rgba(42,117,211,0.8)', 'rgba(42,117,211,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 3, height: 14, borderRadius: 2 }} />
            <Text style={s.sectionTitle}>Account Details</Text>
          </View>
          <GlassCard borderColor="rgba(255,255,255,0.06)" glowColor="rgba(42,117,211,0.03)" padding={16} style={{ borderRadius: 18, borderWidth: 0, backgroundColor: 'transparent' }}>
            <DetailRow icon="📧" label="Email" value={user?.email || 'user@civicai.com'} />
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 12 }} />
            <DetailRow icon="📱" label="Mobile" value={user?.mobile || '+91 9876543210'} />
            {user?.department && (
              <>
                <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 12 }} />
                <DetailRow icon="🏛" label="Department" value={user.department} />
              </>
            )}
            <View style={{ height: 1, backgroundColor: 'rgba(255,255,255,0.04)', marginVertical: 12 }} />
            <DetailRow icon="🆔" label="Member since" value="May 2026" />
          </GlassCard>
        </EntryView>

        {/* Quick Actions (full width) */}
        <EntryView delay={250} style={{ width: '100%' }}>
          <View style={s.sectionHeader}>
            <LinearGradient colors={['rgba(201,168,76,0.8)', 'rgba(201,168,76,0.3)']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={{ width: 3, height: 14, borderRadius: 2 }} />
            <Text style={s.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={{ gap: 8 }}>
            {QUICK_ACTIONS.map((action) => (
              <Pressable
                key={action.label}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  if (action.route) router.push(action.route);
                  else if (action.url) Linking.openURL(action.url);
                }}
              >
                <GlassCard borderColor="rgba(255,255,255,0.06)" glowColor="rgba(255,255,255,0.02)" padding={14} style={{ borderRadius: 16, borderWidth: 0, backgroundColor: 'transparent' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={{ width: 36, height: 36, borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.04)', alignItems: 'center', justifyContent: 'center' }}>
                      <Text style={{ fontSize: 16 }}>{action.icon}</Text>
                    </View>
                    <Text style={{ flex: 1, fontSize: 14, color: colors.text, fontFamily: 'Sora_600SemiBold' }}>{action.label}</Text>
                    <Text style={{ fontSize: 14, color: colors.muted }}>→</Text>
                  </View>
                </GlassCard>
              </Pressable>
            ))}
          </View>
        </EntryView>

        {/* Edit Profile (full width) */}
        <EntryView delay={300} style={{ width: '100%', marginTop: 24 }}>
          <Pressable
            style={s.editBtn}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/edit-profile');
            }}
          >
            <LinearGradient colors={['rgba(42,117,211,0.2)', 'rgba(42,117,211,0.05)']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Text style={s.editText}>{t('profile.editProfile')}</Text>
          </Pressable>
        </EntryView>

        {/* Logout (full width) */}
        <EntryView delay={350} style={{ width: '100%' }}>
          <Pressable
            style={s.logoutBtn}
            onPress={() => {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
              logout();
              router.replace('/login');
            }}
          >
            <LinearGradient colors={['rgba(239,68,68,0.15)', 'rgba(239,68,68,0.03)']} style={[StyleSheet.absoluteFill, { borderRadius: 14 }]} />
            <Text style={s.logoutText}>{t('profile.signOut')}</Text>
          </Pressable>
        </EntryView>

        {/* App Info (centered) */}
        <EntryView delay={400} style={{ alignItems: 'center', marginTop: 24, gap: 4 }}>
          <Text style={{ fontSize: 11, color: 'rgba(255,255,255,0.15)', fontFamily: 'Sora_700Bold', letterSpacing: 2, textTransform: 'uppercase' }}>Civic Connect</Text>
          <Text style={{ fontSize: 10, color: 'rgba(255,255,255,0.08)', fontFamily: 'Sora_400Regular' }}>Version 1.0.0</Text>
        </EntryView>
      </ScrollView>
    </ScreenLayout>
  );
}

function DetailRow({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ width: 32, height: 32, borderRadius: 8, backgroundColor: 'rgba(255,255,255,0.03)', alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontSize: 14 }}>{icon}</Text>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={{ fontSize: 10, color: colors.muted, fontFamily: 'Sora_600SemiBold', textTransform: 'uppercase', letterSpacing: 0.5 }}>{label}</Text>
        <Text style={{ fontSize: 13, color: colors.text, fontFamily: 'Sora_400Regular', marginTop: 2 }}>{value}</Text>
      </View>
    </View>
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
  headerBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  settingsIcon: { fontSize: 20, color: colors.gold },
  title: { fontSize: 20, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  content: { padding: 24 },
  avatarWrap: { marginBottom: 16 },
  avatarRing: {
    width: 110,
    height: 110,
    borderRadius: 55,
    padding: 5,
    backgroundColor: 'rgba(255,255,255,0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#3B82F6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  avatarText: { fontSize: 36, fontWeight: '800', color: '#fff', fontFamily: 'Sora_800ExtraBold' },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold' },
  roleBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.06)',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: 20,
    marginTop: 8,
    marginBottom: 12,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4 },
  roleText: { fontSize: 12, fontWeight: '600', color: 'rgba(255,255,255,0.7)', fontFamily: 'Sora_600SemiBold' },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 28, width: '100%' },
  statCard: {
    flex: 1,
    padding: 16,
    borderRadius: 18,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  statVal: { fontSize: 26, fontWeight: '800', color: colors.gold, fontFamily: 'Sora_800ExtraBold' },
  statLabel: { fontSize: 10, color: colors.muted, fontWeight: '600', marginTop: 4, fontFamily: 'Sora_600SemiBold', textTransform: 'uppercase', letterSpacing: 1 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 14 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold', letterSpacing: 0.3 },
  editBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(42,117,211,0.3)',
    marginBottom: 12,
  },
  editText: { fontSize: 15, fontWeight: '700', color: colors.civicBlue, fontFamily: 'Sora_700Bold' },
  logoutBtn: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(239,68,68,0.3)',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger, fontFamily: 'Sora_700Bold' },
});
