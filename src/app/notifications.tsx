import React from 'react';
import { StyleSheet, View, Text, FlatList, RefreshControl } from 'react-native';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

export default function NotificationsScreen({ isTab = false }: { isTab?: boolean }) {
  const notifications = useAppStore((s) => s.notifications);

  return (
    <ScreenLayout showOrbs={!isTab} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
      {!isTab && (
        <View style={s.header}>
          <BackButton />
          <Text style={s.title}>Notifications</Text>
          <View style={{ width: 40 }} />
        </View>
      )}

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 20, paddingBottom: isTab ? 130 : 20, gap: 12 }}
        refreshControl={
          <RefreshControl
            refreshing={false}
            onRefresh={() => {}}
            tintColor={colors.gold}
            accessibilityLabel="Pull to refresh notifications"
          />
        }
        renderItem={({ item, index }) => (
          <GlassCard
            borderColor={!item.read ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}
            glowColor={!item.read ? 'rgba(201,168,76,0.06)' : undefined}
            delay={index * 50}
            padding={16}
            accessibilityLabel={`Notification: ${item.title}`}
          >
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
              <Text style={{ fontSize: 15, fontWeight: '700', color: colors.text, fontFamily: 'Sora_700Bold' }}>{item.title}</Text>
              <Text style={{ fontSize: 11, color: colors.muted, fontFamily: 'Sora_400Regular' }}>
                {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </View>
            <Text style={{ fontSize: 13, color: colors.muted, lineHeight: 18, fontFamily: 'Sora_400Regular' }}>{item.body}</Text>
          </GlassCard>
        )}
        ListEmptyComponent={
          <Text style={s.empty}>No notifications yet</Text>
        }
      />
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
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: -0.5,
  },
  empty: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Sora_400Regular' },
});
