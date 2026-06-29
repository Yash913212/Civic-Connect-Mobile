import React from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

export default function ProfileScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const complaints = useAppStore((s) => s.complaints);
  const logout = useAppStore((s) => s.logout);

  return (
    <ScreenLayout showOrbs={!isTab} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
      {!isTab && (
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>Profile</Text>
          <Pressable
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/settings');
            }}
            style={s.backBtn}
            accessibilityLabel="Open settings"
            accessibilityRole="button"
          >
            <Text style={s.settingsIcon}>⚙</Text>
          </Pressable>
        </View>
      )}

      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: isTab ? 140 : 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.avatar} accessibilityLabel="Profile avatar">
          <Text style={{ fontSize: 40 }}>👤</Text>
        </View>
        <Text style={s.name}>{user?.name || 'Citizen'}</Text>
        <Text style={s.info}>{user?.email || 'user@civicai.com'}</Text>
        <Text style={s.info}>{user?.mobile || '+91 9876543210'}</Text>

        <View style={s.stats}>
          <GlassCard style={s.statBox} borderColor="rgba(255,255,255,0.08)" delay={100} padding={20}>
            <Text style={s.statVal}>{complaints.length}</Text>
            <Text style={s.statLabel}>Complaints</Text>
          </GlassCard>
          <GlassCard
            style={s.statBox}
            borderColor="rgba(46,204,143,0.22)"
            glowColor="rgba(46,204,143,0.08)"
            delay={150}
            padding={20}
          >
            <Text style={[s.statVal, { color: colors.green }]}>
              {complaints.filter(c => c.status === 'resolved').length}
            </Text>
            <Text style={s.statLabel}>Resolved</Text>
          </GlassCard>
        </View>

        <Pressable
          style={s.logoutBtn}
          onPress={() => {
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            logout();
            router.replace('/login');
          }}
          accessibilityLabel="Sign out of your account"
          accessibilityRole="button"
        >
          <Text style={s.logoutText}>Sign Out</Text>
        </Pressable>
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
  backBtn: {
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
  content: { padding: 24, alignItems: 'center' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(13,27,46,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    marginBottom: 16,
  },
  name: { fontSize: 24, fontWeight: '800', color: colors.text, fontFamily: 'Sora_800ExtraBold' },
  info: { fontSize: 14, color: colors.muted, marginTop: 4, fontFamily: 'Sora_400Regular' },
  stats: { flexDirection: 'row', gap: 16, marginTop: 32, marginBottom: 40 },
  statBox: { borderWidth: 0, padding: 0, borderRadius: 20, backgroundColor: 'transparent', alignItems: 'center', flex: 1 },
  statVal: { fontSize: 28, fontWeight: '800', color: colors.gold, fontFamily: 'Sora_800ExtraBold' },
  statLabel: { fontSize: 12, color: colors.muted, fontWeight: '600', marginTop: 4, fontFamily: 'Sora_600SemiBold' },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: colors.danger,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center',
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: colors.danger, fontFamily: 'Sora_700Bold' },
});
