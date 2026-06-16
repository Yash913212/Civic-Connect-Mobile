import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Dimensions, ScrollView } from 'react-native';
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
  danger:     '#EF4444',
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

export default function ProfileScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const user = useAppStore((s) => s.user);
  const complaints = useAppStore((s) => s.complaints);
  const logout = useAppStore((s) => s.logout);

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
            <Text style={s.title}>Citizen Profile</Text>
            <View style={{ width: 40 }} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={[s.content, { paddingBottom: isTab ? 140 : 40 }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={s.avatar}>
            <Text style={{ fontSize: 40 }}>👤</Text>
          </View>
          <Text style={s.name}>{user?.name || 'Citizen'}</Text>
          <Text style={s.email}>{user?.email || 'user@civicconnect.com'}</Text>
          <Text style={s.email}>{user?.mobile || '+91 9876543210'}</Text>

          <View style={s.stats}>
            <GlassCard
              style={s.statBox}
              borderColor="rgba(255,255,255,0.08)"
              delay={100}
              padding={20}
            >
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
              <Text style={[s.statVal, { color: C.green }]}>
                {complaints.filter(c => c.status === 'resolved').length}
              </Text>
              <Text style={s.statLabel}>Resolved</Text>
            </GlassCard>
          </View>


          <Pressable
            style={s.logoutBtn}
            onPress={() => {
              logout();
              router.replace('/login');
            }}
          >
            <Text style={s.logoutText}>Sign Out Account</Text>
          </Pressable>
        </ScrollView>
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
  content: { padding: 24, alignItems: 'center' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(13,27,46,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
    marginBottom: 16
  },

  name: { fontSize: 24, fontWeight: '800', color: C.text, fontFamily: 'Sora_800ExtraBold' },
  email: { fontSize: 14, color: C.muted, marginTop: 4, fontFamily: 'Sora_400Regular' },
  stats: { flexDirection: 'row', gap: 16, marginTop: 32, marginBottom: 40 },
  statBox: {
    borderWidth: 0,
    padding: 0,
    borderRadius: 20,
    backgroundColor: 'transparent',
    alignItems: 'center',
    flex: 1
  },

  statVal: { fontSize: 28, fontWeight: '800', color: C.gold, fontFamily: 'Sora_800ExtraBold' },
  statLabel: { fontSize: 12, color: C.muted, fontWeight: '600', marginTop: 4, fontFamily: 'Sora_600SemiBold' },
  logoutBtn: {
    width: '100%',
    backgroundColor: 'rgba(239,68,68,0.1)',
    borderWidth: 1,
    borderColor: C.danger,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: 'center'
  },
  logoutText: { fontSize: 15, fontWeight: '700', color: C.danger, fontFamily: 'Sora_700Bold' },
});
