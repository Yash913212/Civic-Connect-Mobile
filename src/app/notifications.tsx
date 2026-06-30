import React, { useState, useMemo, useCallback } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, RefreshControl, Dimensions } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';
import { t } from '../i18n';
import type { NotificationItem } from '../store/types';

const SW = Dimensions.get('window').width;
type TabKey = 'all' | 'unread' | 'read';

const TABS: { key: TabKey; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'unread', label: 'Unread' },
  { key: 'read', label: 'Read' },
];

function timeGroup(dateStr: string): string {
  const d = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - d.getTime();
  const day = 86_400_000;
  if (diff < day) return 'Today';
  if (diff < 2 * day) return 'Yesterday';
  if (diff < 7 * day) return 'This Week';
  return 'Earlier';
}

function AnimatedNotifCard({
  item,
  index,
  onPress,
}: {
  item: NotificationItem;
  index: number;
  onPress: (item: NotificationItem) => void;
}) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  React.useEffect(() => {
    opacity.value = withDelay(index * 40, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(index * 40, withSpring(0, { damping: 16 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View style={aStyle}>
      <Pressable
        onPress={() => onPress(item)}
        accessibilityLabel={`Notification: ${item.title}`}
      >
        <GlassCard
          borderColor={item.read ? 'rgba(255,255,255,0.06)' : 'rgba(201,168,76,0.2)'}
          glowColor={item.read ? undefined : 'rgba(201,168,76,0.06)'}
          padding={16}
          style={{ borderRadius: 18, borderWidth: 0, marginBottom: 10, backgroundColor: item.read ? 'transparent' : 'rgba(201,168,76,0.02)' }}
        >
          <View style={{ flexDirection: 'row', gap: 14 }}>
            {/* Left icon */}
            <View
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                backgroundColor: item.read ? 'rgba(255,255,255,0.03)' : 'rgba(201,168,76,0.1)',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Text style={{ fontSize: 18 }}>{item.read ? '📩' : '🔔'}</Text>
            </View>

            {/* Body */}
            <View style={{ flex: 1 }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Text
                  style={{
                    fontSize: 14,
                    color: item.read ? 'rgba(255,255,255,0.55)' : colors.text,
                    fontFamily: 'Sora_700Bold',
                    flex: 1,
                    marginRight: 8,
                  }}
                >
                  {item.title}
                </Text>
                <Text style={{ fontSize: 10, color: colors.muted, fontFamily: 'Sora_400Regular', marginTop: 2 }}>
                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text
                style={{
                  fontSize: 12,
                  color: item.read ? 'rgba(255,255,255,0.30)' : colors.muted,
                  lineHeight: 17,
                  fontFamily: 'Sora_400Regular',
                  marginTop: 4,
                }}
                numberOfLines={2}
              >
                {item.body}
              </Text>
              {item.complaintId && (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: item.read ? 'rgba(42,117,211,0.4)' : colors.civicBlue, fontFamily: 'Sora_600SemiBold' }}>
                    {item.complaintId}
                  </Text>
                  <Text style={{ fontSize: 9, color: item.read ? 'rgba(42,117,211,0.3)' : colors.civicBlue }}>→</Text>
                </View>
              )}
            </View>
          </View>
        </GlassCard>
      </Pressable>
    </Animated.View>
  );
}

export default function NotificationsScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const notifications = useAppStore((s) => s.notifications);
  const complaints = useAppStore((s) => s.complaints);
  const setCurrentComplaint = useAppStore((s) => s.setCurrentComplaint);
  const markAllRead = useAppStore((s) => s.markNotificationsRead);

  const [activeTab, setActiveTab] = useState<TabKey>('all');
  const [refreshing, setRefreshing] = useState(false);

  const filtered = useMemo(() => {
    if (activeTab === 'unread') return notifications.filter((n) => !n.read);
    if (activeTab === 'read') return notifications.filter((n) => n.read);
    return notifications;
  }, [notifications, activeTab]);

  const grouped = useMemo(() => {
    const groups: { title: string; data: NotificationItem[] }[] = [];
    const order = ['Today', 'Yesterday', 'This Week', 'Earlier'];
    const map: Record<string, NotificationItem[]> = {};
    for (const n of filtered) {
      const g = timeGroup(n.time);
      if (!map[g]) map[g] = [];
      map[g].push(n);
    }
    for (const key of order) {
      if (map[key]) groups.push({ title: key, data: map[key] });
    }
    return groups;
  }, [filtered]);

  const handleNotificationPress = useCallback(
    (item: NotificationItem) => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      if (item.complaintId) {
        const complaint = complaints.find((c) => c.id === item.complaintId);
        if (complaint) {
          setCurrentComplaint(complaint);
          router.push('/complaint-detail');
          return;
        }
      }
    },
    [complaints, setCurrentComplaint, router],
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    markAllRead();
    setTimeout(() => setRefreshing(false), 600);
  }, [markAllRead]);

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <ScreenLayout showOrbs={!isTab} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
      {!isTab && (
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>{t('notifications.title')}</Text>
          {unreadCount > 0 && (
            <Pressable
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); markAllRead(); }}
              accessibilityLabel="Mark all read"
              style={s.markBtn}
            >
              <Text style={s.markText}>Mark Read</Text>
            </Pressable>
          )}
        </View>
      )}

      {/* Tabs */}
      <View style={s.tabRow}>
        {TABS.map((tab) => {
          const isActive = activeTab === tab.key;
          const count = tab.key === 'all' ? notifications.length : tab.key === 'unread' ? unreadCount : notifications.length - unreadCount;
          return (
            <Pressable
              key={tab.key}
              onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); setActiveTab(tab.key); }}
              style={[s.tab, isActive && { backgroundColor: 'rgba(42,117,211,0.2)', borderColor: colors.civicBlue }]}
              accessibilityLabel={`${tab.label} tab`}
            >
              <Text style={[s.tabLabel, isActive && { color: colors.civicBlue }]}>{tab.label}</Text>
              <View style={[s.tabBadge, isActive && { backgroundColor: 'rgba(42,117,211,0.3)' }]}>
                <Text style={[s.tabCount, isActive && { color: colors.civicBlue }]}>{count}</Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* List */}
      <FlatList
        data={grouped.flatMap((g) => g.data)}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: isTab ? 130 : 20 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.gold}
            colors={[colors.gold]}
            progressBackgroundColor={colors.navy}
            accessibilityLabel="Pull to refresh"
          />
        }
        renderItem={({ item, index }) => <AnimatedNotifCard item={item} index={index} onPress={handleNotificationPress} />}
        ListEmptyComponent={
          <View style={s.emptyWrap}>
            <LinearGradient colors={['rgba(201,168,76,0.1)', 'rgba(201,168,76,0.02)']} style={{ width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
              <Text style={{ fontSize: 32 }}>🔔</Text>
            </LinearGradient>
            <Text style={s.emptyTitle}>{t('notifications.emptyTitle')}</Text>
            <Text style={s.emptySub}>{t('notifications.emptySub')}</Text>
          </View>
        }
      />

      {grouped.length > 1 && (
        <View style={s.groupSidebar}>
          {grouped.map((g) => (
            <Text key={g.title} style={s.groupPill}>{g.title}</Text>
          ))}
        </View>
      )}
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
  markBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: 'rgba(42,117,211,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(42,117,211,0.25)',
  },
  markText: { fontSize: 10, color: colors.civicBlue, fontFamily: 'Sora_700Bold', letterSpacing: 0.3, textTransform: 'uppercase' },
  tabRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 20,
    marginBottom: 16,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  tabLabel: {
    fontSize: 12,
    color: colors.muted,
    fontFamily: 'Sora_600SemiBold',
  },
  tabBadge: {
    minWidth: 20,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center',
  },
  tabCount: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Sora_700Bold',
  },
  groupLabel: {
    marginBottom: 8,
  },
  groupText: {
    fontSize: 11,
    color: colors.muted,
    fontFamily: 'Sora_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  groupSidebar: {
    position: 'absolute',
    right: 8,
    top: 120,
    gap: 6,
  },
  groupPill: {
    fontSize: 8,
    color: colors.muted,
    fontFamily: 'Sora_700Bold',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    backgroundColor: 'rgba(13,27,46,0.8)',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.04)',
    overflow: 'hidden',
  },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 6 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, fontFamily: 'Sora_400Regular' },
});
