import React, { useEffect, useMemo } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  withDelay,
  Easing,
  SharedValue,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const { width: W, height: H } = Dimensions.get('window');

const DEEP_SPACE = '#02050A';
const NUM_PARTICLES = 50;

const THEME = {
  dark: { bg: DEEP_SPACE },
  light: { bg: '#F0F4F8' },
};

const AURORA = {
  dark: {
    citizen: [
      { colors: ['rgba(56,189,248,0.08)', 'transparent'], start: 0.3 },
      { colors: ['rgba(99,102,241,0.06)', 'transparent'], start: 0.6 },
    ],
    officer: [
      { colors: ['rgba(34,197,94,0.07)', 'transparent'], start: 0.3 },
      { colors: ['rgba(16,185,129,0.05)', 'transparent'], start: 0.6 },
    ],
    admin: [
      { colors: ['rgba(234,179,8,0.07)', 'transparent'], start: 0.3 },
      { colors: ['rgba(245,158,11,0.05)', 'transparent'], start: 0.6 },
    ],
  },
  light: {
    citizen: [
      { colors: ['rgba(56,189,248,0.2)', 'transparent'], start: 0.3 },
      { colors: ['rgba(99,102,241,0.15)', 'transparent'], start: 0.6 },
    ],
    officer: [
      { colors: ['rgba(34,197,94,0.18)', 'transparent'], start: 0.3 },
      { colors: ['rgba(16,185,129,0.12)', 'transparent'], start: 0.6 },
    ],
    admin: [
      { colors: ['rgba(234,179,8,0.18)', 'transparent'], start: 0.3 },
      { colors: ['rgba(245,158,11,0.12)', 'transparent'], start: 0.6 },
    ],
  },
};

const GLASS_SHEEN = {
  dark: [
    'transparent',
    'rgba(255,255,255,0.015)',
    'rgba(255,255,255,0.05)',
    'rgba(0,0,0,0.2)',
    'transparent',
    'transparent',
    'rgba(255,255,255,0.03)',
    'rgba(0,0,0,0.15)',
    'transparent',
  ] as const,
  light: [
    'transparent',
    'rgba(255,255,255,0.3)',
    'rgba(255,255,255,0.8)',
    'rgba(0,0,0,0.03)',
    'transparent',
    'transparent',
    'rgba(255,255,255,0.5)',
    'rgba(0,0,0,0.01)',
    'transparent',
  ] as const,
};

const GLASS_LOCATIONS = [0.4, 0.44, 0.445, 0.45, 0.455, 0.55, 0.57, 0.575, 0.58];

interface Props {
  theme?: 'dark' | 'light';
  mode?: 'home' | 'report' | 'officer' | 'admin';
}

interface ParticleData {
  x: number;
  y: number;
  size: number;
  duration: number;
  delay: number;
  driftX: number;
  driftY: number;
}

function generateParticles(): ParticleData[] {
  const particles: ParticleData[] = [];
  for (let i = 0; i < NUM_PARTICLES; i++) {
    particles.push({
      x: Math.random() * W,
      y: Math.random() * H,
      size: 1 + Math.random() * 2.5,
      duration: 4000 + Math.random() * 6000,
      delay: Math.random() * 4000,
      driftX: (Math.random() - 0.5) * 60,
      driftY: (Math.random() - 0.5) * 40,
    });
  }
  return particles;
}

const Particle = React.memo(({ data }: { data: ParticleData }) => {
  const opacity = useSharedValue(0.2 + Math.random() * 0.3);
  const moveX = useSharedValue(0);
  const moveY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(0.6 + Math.random() * 0.3, { duration: data.duration * 0.5, easing: Easing.inOut(Easing.sin) }),
          withTiming(0.1 + Math.random() * 0.2, { duration: data.duration * 0.5, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      )
    );

    moveX.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(data.driftX, { duration: data.duration, easing: Easing.inOut(Easing.sin) }),
          withTiming(-data.driftX, { duration: data.duration, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      )
    );

    moveY.value = withDelay(
      data.delay,
      withRepeat(
        withSequence(
          withTiming(data.driftY, { duration: data.duration * 1.2, easing: Easing.inOut(Easing.sin) }),
          withTiming(-data.driftY, { duration: data.duration * 1.2, easing: Easing.inOut(Easing.sin) })
        ),
        -1, true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [
      { translateX: moveX.value },
      { translateY: moveY.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: data.x,
          top: data.y,
          width: data.size,
          height: data.size,
          borderRadius: data.size / 2,
          backgroundColor: 'rgba(255,255,255,0.6)',
        },
        style,
      ]}
      pointerEvents="none"
    />
  );
});

function AuroraLayer({ colors, opacity: animOpacity, start }: { colors: string[]; opacity: SharedValue<number>; start: number }) {
  const style = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
  }));

  return (
    <AnimatedLinearGradient
      colors={colors as any}
      start={{ x: start, y: 0 }}
      end={{ x: 1 - start, y: 1 }}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  );
}

function AmbientGlow({ colors, animOpacity }: { colors: string[]; animOpacity: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
  }));

  return (
    <AnimatedLinearGradient
      colors={colors as any}
      style={[StyleSheet.absoluteFill, style]}
      pointerEvents="none"
    />
  );
}

function GlassSheenLayer({ moveX, moveY, reverse = false, isDark }: { moveX: SharedValue<number>; moveY: SharedValue<number>; reverse?: boolean; isDark: boolean }) {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: moveX.value * (reverse ? -0.6 : 0.6) },
      { translateY: moveY.value * (reverse ? -0.6 : 0.6) },
    ],
  }));

  return (
    <AnimatedLinearGradient
      colors={isDark ? GLASS_SHEEN.dark : GLASS_SHEEN.light}
      locations={GLASS_LOCATIONS as any}
      start={{ x: reverse ? 1 : 0, y: 0 }}
      end={{ x: reverse ? 0 : 1, y: 1 }}
      style={[{ position: 'absolute', top: -H, left: -W, width: W * 3, height: H * 3 }, style]}
      pointerEvents="none"
    />
  );
}

export function SmartCityBackground({ theme = 'dark', mode = 'home' }: Props) {
  const isDark = theme === 'dark';

  const particles = useMemo(() => generateParticles(), []);

  const lightBgOpacity = useSharedValue(isDark ? 0 : 1);

  const isCitizen = mode === 'home' || mode === 'report';
  const opCitizen = useSharedValue(isCitizen ? 1 : 0);
  const opOfficer = useSharedValue(mode === 'officer' ? 1 : 0);
  const opAdmin = useSharedValue(mode === 'admin' ? 1 : 0);

  const parallaxX = useSharedValue(0);
  const parallaxY = useSharedValue(0);

  useEffect(() => {
    lightBgOpacity.value = withTiming(isDark ? 0 : 1, { duration: 1000, easing: Easing.inOut(Easing.ease) });
    opCitizen.value = withTiming(isCitizen ? 1 : 0, { duration: 800, easing: Easing.inOut(Easing.ease) });
    opOfficer.value = withTiming(mode === 'officer' ? 1 : 0, { duration: 800, easing: Easing.inOut(Easing.ease) });
    opAdmin.value = withTiming(mode === 'admin' ? 1 : 0, { duration: 800, easing: Easing.inOut(Easing.ease) });
  }, [theme, mode, isCitizen]);

  useEffect(() => {
    parallaxX.value = withRepeat(
      withSequence(
        withTiming(100, { duration: 12000, easing: Easing.inOut(Easing.sin) }),
        withTiming(-100, { duration: 12000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
    parallaxY.value = withRepeat(
      withSequence(
        withTiming(-70, { duration: 14000, easing: Easing.inOut(Easing.sin) }),
        withTiming(70, { duration: 14000, easing: Easing.inOut(Easing.sin) })
      ),
      -1, true
    );
  }, []);

  const lightBgStyle = useAnimatedStyle(() => ({
    opacity: lightBgOpacity.value,
  }));

  const activeAurora = isDark ? AURORA.dark : AURORA.light;
  const roleAuroras = isCitizen ? activeAurora.citizen : mode === 'officer' ? activeAurora.officer : activeAurora.admin;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.dark.bg }]}>
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.light.bg }, lightBgStyle]} />

      {roleAuroras.map((aurora, i) => (
        <AuroraLayer key={i} colors={aurora.colors} opacity={opCitizen} start={aurora.start} />
      ))}

      {particles.map((p, i) => (
        <Particle key={i} data={p} />
      ))}

      <GlassSheenLayer moveX={parallaxX} moveY={parallaxY} isDark={isDark} />
      <GlassSheenLayer moveX={parallaxX} moveY={parallaxY} reverse={true} isDark={isDark} />
    </View>
  );
}
