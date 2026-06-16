import React, { useEffect } from 'react';
import { StyleSheet, View, Text, FlatList, Pressable, Dimensions } from 'react-native';
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

export default function NotificationsScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const notifications = useAppStore((s) => s.notifications);

  return (
    <View style={s.container}>
      {!isTab && (
        <>
          <LinearGradient
            colors={['#05101E', '#091a35', '#030c18']}
            style={StyleSheet.absoluteFill}
          />
          <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
          <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />
        </>
      )}

      <SafeAreaView style={{ flex: 1 }} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
        {!isTab && (
          <View style={s.header}>
            <Pressable onPress={() => router.back()} style={s.backBtn}>
              <Text style={{ fontSize: 20, color: C.text, fontFamily: 'Sora_700Bold' }}>←</Text>
            </Pressable>
            <Text style={s.title}>Municipal Alerts</Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        <FlatList
          data={notifications}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ padding: 20, paddingBottom: isTab ? 130 : 20, gap: 12 }}
          renderItem={({ item, index }) => (
            <GlassCard
              borderColor={!item.read ? 'rgba(201,168,76,0.25)' : 'rgba(255,255,255,0.08)'}
              glowColor={!item.read ? 'rgba(201,168,76,0.06)' : undefined}
              delay={index * 50}
              padding={16}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 }}>
                <Text style={{ fontSize: 15, fontWeight: '700', color: C.text, fontFamily: 'Sora_700Bold' }}>{item.title}</Text>
                <Text style={{ fontSize: 11, color: C.muted, fontFamily: 'Sora_400Regular' }}>
                  {new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>
              <Text style={{ fontSize: 13, color: C.muted, lineHeight: 18, fontFamily: 'Sora_400Regular' }}>{item.body}</Text>
            </GlassCard>
          )}

          ListEmptyComponent={
            <Text style={s.empty}>No new municipal broadcasts found</Text>
          }
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
  card: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 18,
    backgroundColor: 'transparent'
  },

  empty: { fontSize: 14, color: C.muted, textAlign: 'center', marginTop: 40, fontFamily: 'Sora_400Regular' },
});
