import React, { useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, Switch, Dimensions } from 'react-native';
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

export default function SettingsScreen() {
  const router = useRouter();

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
          <Text style={s.title}>Settings</Text>
          <View style={{ width: 40 }} />
        </View>

        <View style={s.content}>
          <View style={s.section}>
            <Text style={s.sectionTitle}>Preferences</Text>
            <GlassCard
              borderColor="rgba(255,255,255,0.08)"
              glowColor="rgba(201,168,76,0.02)"
              delay={100}
              padding={4}
            >
              <View style={s.row}>
                <Text style={s.label}>Push Notifications</Text>
                <Switch value={true} trackColor={{ true: C.gold, false: 'rgba(255,255,255,0.06)' }} thumbColor={C.navy} />
              </View>
              <View style={s.row}>
                <Text style={s.label}>Dark Theme (Ambient Mesh)</Text>
                <Switch value={true} trackColor={{ true: C.gold, false: 'rgba(255,255,255,0.06)' }} thumbColor={C.navy} />
              </View>
              <View style={[s.row, { borderBottomWidth: 0 }]}>
                <Text style={s.label}>GPS Location Services</Text>
                <Switch value={true} trackColor={{ true: C.gold, false: 'rgba(255,255,255,0.06)' }} thumbColor={C.navy} />
              </View>
            </GlassCard>
          </View>

          <View style={s.section}>
            <Text style={s.sectionTitle}>Account</Text>
            <GlassCard
              borderColor="rgba(255,255,255,0.08)"
              glowColor="rgba(201,168,76,0.02)"
              delay={200}
              padding={4}
            >
              <Pressable style={s.link}>
                <Text style={s.linkLabel}>Change Language</Text>
                <Text style={s.linkArrow}>→</Text>
              </Pressable>
              <Pressable style={s.link}>
                <Text style={s.linkLabel}>Privacy Policy</Text>
                <Text style={s.linkArrow}>→</Text>
              </Pressable>
              <Pressable style={[s.link, { borderBottomWidth: 0 }]}>
                <Text style={s.linkLabel}>Terms of Service</Text>
                <Text style={s.linkArrow}>→</Text>
              </Pressable>
            </GlassCard>
          </View>
        </View>

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
  content: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: { fontSize: 11, color: C.muted, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 16, fontFamily: 'Sora_600SemiBold' },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: { fontSize: 14, color: C.text, fontWeight: '500', fontFamily: 'Sora_600SemiBold' },
  link: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  linkLabel: { fontSize: 14, color: C.text, fontWeight: '500', fontFamily: 'Sora_600SemiBold' },
  linkArrow: { fontSize: 18, color: C.gold, fontFamily: 'Sora_700Bold' },

});
