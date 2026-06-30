import React, { useState, useMemo } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ScrollView, RefreshControl, TextInput } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { SkeletonCard } from '../components/Skeleton';
import { colors } from '../theme/colors';
import { t } from '../i18n';

const statusColors: Record<string, string> = {
  pending: colors.amber,
  assigned: colors.blue,
  in_progress: colors.gold,
  resolved: colors.green,
};

const FILTERS = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];
const FILTER_KEYS = ['filterAll', 'filterPending', 'filterAssigned', 'filterInProgress', 'filterResolved'] as const;

export default function HistoryScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const setCurrentComplaint = useAppStore((s) => s.setCurrentComplaint);
  const [filter, setFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const isFetching = useAppStore((s) => s.isFetching);

  const filtered = useMemo(() => {
    let items = filter === 'All' ? complaints : complaints.filter((c) => c.status.replace('_', ' ') === filter.toLowerCase());
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      items = items.filter((c) =>
        c.id.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.department.toLowerCase().includes(q)
      );
    }
    return items;
  }, [complaints, filter, searchQuery]);

  return (
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>{t('history.title')}</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.searchWrap}>
        <TextInput
          style={s.searchInput}
          placeholder={t('history.search')}
          placeholderTextColor="rgba(255,255,255,0.25)"
          value={searchQuery}
          onChangeText={setSearchQuery}
          accessibilityLabel="Search complaints"
        />
      </View>

      <View style={{ height: 48, marginBottom: 12 }}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
          {FILTERS.map((f, i) => (
            <Pressable
              key={f}
              style={[s.chip, filter === f && { backgroundColor: colors.gold, borderColor: colors.gold }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setFilter(f);
              }}
              accessibilityLabel={`Filter by ${f}`}
              accessibilityRole="button"
            >
              <Text style={[s.chipText, filter === f && { color: colors.navy, fontFamily: 'Sora_700Bold' }]}>{t(`history.${FILTER_KEYS[i]}`)}</Text>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {isFetching ? (
        <View style={{ padding: 20, gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
          refreshControl={
            <RefreshControl refreshing={false} onRefresh={() => {}} tintColor={colors.gold} accessibilityLabel="Pull to refresh" />
          }
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setCurrentComplaint(item);
                router.push('/complaint-detail');
              }}
              accessibilityLabel={`View complaint ${item.id}`}
            >
              <GlassCard
                style={{ flex: 1 }}
                borderColor={item.status === 'resolved' ? 'rgba(46,204,143,0.22)' : 'rgba(255,255,255,0.08)'}
                glowColor={item.status === 'resolved' ? 'rgba(46,204,143,0.08)' : undefined}
                delay={index * 50}
                padding={18}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: colors.gold, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>{item.id}</Text>
                  <View style={[s.badge, { backgroundColor: (statusColors[item.status] || colors.muted) + '20' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: statusColors[item.status], textTransform: 'capitalize', fontFamily: 'Sora_700Bold' }}>
                      {item.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' }}>{item.category}</Text>
                <Text style={{ fontSize: 13, color: colors.muted, marginTop: 6, fontFamily: 'Sora_400Regular' }} numberOfLines={1}>
                  {item.description}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                  <Text style={{ fontSize: 12, color: colors.muted, fontFamily: 'Sora_600SemiBold' }}>🏛️ {item.department || 'Pending'}</Text>
                  <Text style={{ fontSize: 12, color: colors.muted, fontFamily: 'Sora_400Regular' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </GlassCard>
            </Pressable>
          )}
          ListEmptyComponent={
            <View style={s.emptyWrap}>
              <Text style={s.emptyIcon}>📋</Text>
              <Text style={s.emptyTitle}>{t('history.emptyTitle')}</Text>
              <Text style={s.emptySub}>{t('history.emptySub')}</Text>
            </View>
          }
        />
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
  searchWrap: { paddingHorizontal: 20, paddingBottom: 8 },
  searchInput: {
    backgroundColor: 'rgba(13,27,46,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 13,
    color: colors.text,
    fontFamily: 'Sora_400Regular',
  },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    height: 38,
  },
  chipText: { fontSize: 13, color: colors.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  emptyWrap: { alignItems: 'center', paddingTop: 60, gap: 10 },
  emptyIcon: { fontSize: 48, marginBottom: 8 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' },
  emptySub: { fontSize: 13, color: colors.muted, textAlign: 'center', paddingHorizontal: 40, lineHeight: 20, fontFamily: 'Sora_400Regular' },
});
