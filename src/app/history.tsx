import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';


const { width: SW, height: SH } = Dimensions.get('window');

const C = {
  navy:       '#05101E',
  surface:    '#0D1B2E',
  elevated:   '#112236',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.25)',
  amber:      '#F5A623',
  green:      '#2ECC8F',
  blue:       '#3D8EF0',
  text:       '#FFFFFF',
  muted:      'rgba(255,255,255,0.40)',
  border:     'rgba(255,255,255,0.06)',
} as const;

const statusColors: Record<string, string> = {
  pending: C.amber,
  assigned: C.blue,
  in_progress: C.gold,
  resolved: C.green,
};

const FILTERS = ['All', 'Pending', 'Assigned', 'In Progress', 'Resolved'];

function GlowingOrb({ color, startX, startY, delay }: { color: string; startX: number; startY: number; delay: number }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: color,
          opacity: 0.08,
          left: startX,
          top: startY,
        },
        style,
      ]}
    />
  );
}

export default function HistoryScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const setCurrentComplaint = useAppStore((s) => s.setCurrentComplaint);
  const [filter, setFilter] = useState('All');
  const filtered = filter === 'All' ? complaints : complaints.filter((c) => c.status.replace('_', ' ') === filter.toLowerCase());

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#05101E', '#091a35', '#030c18']}
        style={StyleSheet.absoluteFill}
      />
      <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
      <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />

      <SafeAreaView style={{ flex: 1 }}>
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={{ fontSize: 20, color: C.text, fontFamily: 'Sora_700Bold' }}>←</Text>
          </Pressable>
          <Text style={s.title}>Citizen Logs</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={{ height: 48, marginBottom: 12 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 20, gap: 8 }}>
            {FILTERS.map((f) => (
              <Pressable
                key={f}
                style={[
                  s.chip,
                  filter === f && { backgroundColor: C.gold, borderColor: C.gold }
                ]}
                onPress={() => setFilter(f)}
              >
                <Text style={[s.chipText, filter === f && { color: C.navy, fontFamily: 'Sora_700Bold' }]}>{f}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        <FlatList
          data={filtered}
          keyExtractor={(i) => i.id}
          contentContainerStyle={{ padding: 20, paddingBottom: 40, gap: 12 }}
          renderItem={({ item, index }) => (
            <Pressable
              onPress={() => {
                setCurrentComplaint(item);
                router.push('/complaint-detail');
              }}
            >
              <GlassCard
                style={{ flex: 1 }}
                borderColor={item.status === 'resolved' ? 'rgba(46,204,143,0.22)' : 'rgba(255,255,255,0.08)'}
                glowColor={item.status === 'resolved' ? 'rgba(46,204,143,0.08)' : undefined}
                delay={index * 50}
                padding={18}
              >
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Text style={{ fontSize: 13, color: C.gold, fontWeight: '700', fontFamily: 'Sora_700Bold' }}>{item.id}</Text>
                  <View style={[s.badge, { backgroundColor: (statusColors[item.status] || C.muted) + '20' }]}>
                    <Text style={{ fontSize: 11, fontWeight: '700', color: statusColors[item.status], textTransform: 'capitalize', fontFamily: 'Sora_700Bold' }}>
                      {item.status.replace('_', ' ')}
                    </Text>
                  </View>
                </View>
                <Text style={{ fontSize: 17, fontWeight: '700', color: C.text, fontFamily: 'Sora_700Bold' }}>{item.category}</Text>
                <Text style={{ fontSize: 13, color: C.muted, marginTop: 6, fontFamily: 'Sora_400Regular' }} numberOfLines={1}>
                  {item.description}
                </Text>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 14 }}>
                  <Text style={{ fontSize: 12, color: C.muted, fontFamily: 'Sora_600SemiBold' }}>🏛️ {item.department || 'Pending'}</Text>
                  <Text style={{ fontSize: 12, color: C.muted, fontFamily: 'Sora_400Regular' }}>{new Date(item.createdAt).toLocaleDateString()}</Text>
                </View>
              </GlassCard>
            </Pressable>
          )}
        />

      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 12 },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  title: { fontSize: 20, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold', letterSpacing: -0.5 },
  chip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    height: 38
  },
  chipText: { fontSize: 13, color: C.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  card: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent'
  },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
});
