import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withSequence,
  Easing,
} from 'react-native-reanimated';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

const { width: W, height: H } = Dimensions.get('window');

// Premium Ambient Depth Theme Colors
const THEME = {
  dark: {
    bg: '#040914', // Extreme deep navy for maximum contrast
  },
  light: {
    bg: '#F8FAFC', // Crisp daylight white
  }
};

const ATMOSPHERE = {
  dark: {
    citizen: ['rgba(56, 189, 248, 0.15)', 'transparent'],
    officer: ['rgba(34, 197, 94, 0.12)', 'transparent'],
    admin:   ['rgba(234, 179, 8, 0.12)', 'transparent'],
  },
  light: {
    citizen: ['rgba(56, 189, 248, 0.25)', 'transparent'],
    officer: ['rgba(34, 197, 94, 0.2)', 'transparent'],
    admin:   ['rgba(234, 179, 8, 0.2)', 'transparent'],
  }
};

const WAVES = {
  dark: {
    citizen: ['transparent', 'rgba(56, 189, 248, 0.3)', 'transparent'],
    officer: ['transparent', 'rgba(34, 197, 94, 0.25)', 'transparent'],
    admin:   ['transparent', 'rgba(234, 179, 8, 0.25)', 'transparent'],
  },
  light: {
    citizen: ['transparent', 'rgba(56, 189, 248, 0.45)', 'transparent'],
    officer: ['transparent', 'rgba(34, 197, 94, 0.35)', 'transparent'],
    admin:   ['transparent', 'rgba(234, 179, 8, 0.35)', 'transparent'],
  }
};

const GLASS_COLORS = {
  dark: [
    'transparent', 
    'rgba(255, 255, 255, 0.02)', 
    'rgba(255, 255, 255, 0.06)', 
    'rgba(0, 0, 0, 0.3)', 
    'transparent',
    'transparent',
    'rgba(255, 255, 255, 0.04)',
    'rgba(0, 0, 0, 0.2)',
    'transparent'
  ],
  light: [
    'transparent', 
    'rgba(255, 255, 255, 0.4)', 
    'rgba(255, 255, 255, 0.9)', 
    'rgba(0, 0, 0, 0.04)', 
    'transparent',
    'transparent',
    'rgba(255, 255, 255, 0.6)',
    'rgba(0, 0, 0, 0.02)',
    'transparent'
  ]
};

const GLASS_LOCATIONS = [
  0.4, 
  0.44, 
  0.445, 
  0.45, 
  0.455,
  0.55,
  0.57,
  0.575,
  0.58
];

interface Props {
  theme?: 'dark' | 'light';
  mode?: 'home' | 'report' | 'officer' | 'admin';
}

const AtmosphereLayer = ({ colors, animOpacity }: any) => {
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
};

const HeaderEnergyWave = ({ colors, animOpacity, moveX }: any) => {
  const style = useAnimatedStyle(() => ({
    opacity: animOpacity.value,
    transform: [{ translateX: moveX.value }]
  }));

  return (
    <AnimatedLinearGradient
      colors={colors as any}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 0 }}
      style={[{ position: 'absolute', top: 0, left: -W, width: W * 3, height: H * 0.35 }, style]}
      pointerEvents="none"
    />
  );
};

const GlassReflection = ({ moveX, moveY, reverse = false, isDark }: any) => {
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: moveX.value * (reverse ? -0.8 : 0.8) },
      { translateY: moveY.value * (reverse ? -0.8 : 0.8) }
    ]
  }));
  
  const colors = isDark ? GLASS_COLORS.dark : GLASS_COLORS.light;

  return (
    <AnimatedLinearGradient
      colors={colors as any}
      locations={GLASS_LOCATIONS as any}
      start={{ x: reverse ? 1 : 0, y: 0 }}
      end={{ x: reverse ? 0 : 1, y: 1 }}
      style={[{ position: 'absolute', top: -H, left: -W, width: W * 3, height: H * 3 }, style]}
      pointerEvents="none"
    />
  );
};

export function SmartCityBackground({ theme = 'dark', mode = 'home' }: Props) {
  const isDark = theme === 'dark';
  
  // Theme transitions
  const lightBgOpacity = useSharedValue(isDark ? 0 : 1);
  
  // Role opacities
  const isCitizen = mode === 'home' || mode === 'report';
  const opCitizen = useSharedValue(isCitizen ? 1 : 0);
  const opOfficer = useSharedValue(mode === 'officer' ? 1 : 0);
  const opAdmin = useSharedValue(mode === 'admin' ? 1 : 0);

  // Accelerated ambient parallax and wave movement
  const waveMove = useSharedValue(0);
  const parallaxX = useSharedValue(0);
  const parallaxY = useSharedValue(0);

  useEffect(() => {
    // Smooth 1000ms daylight theme transition
    lightBgOpacity.value = withTiming(isDark ? 0 : 1, { duration: 1000, easing: Easing.inOut(Easing.ease) });

    // Smooth 800ms atmosphere transition between roles
    opCitizen.value = withTiming(isCitizen ? 1 : 0, { duration: 800, easing: Easing.inOut(Easing.ease) });
    opOfficer.value = withTiming(mode === 'officer' ? 1 : 0, { duration: 800, easing: Easing.inOut(Easing.ease) });
    opAdmin.value = withTiming(mode === 'admin' ? 1 : 0, { duration: 800, easing: Easing.inOut(Easing.ease) });
  }, [theme, mode, isCitizen]);

  useEffect(() => {
    // Visible header energy sweep (Speed increased significantly to be visually prominent)
    waveMove.value = withRepeat(withSequence(
      withTiming(W * 0.9, { duration: 5000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-W * 0.9, { duration: 5000, easing: Easing.inOut(Easing.sin) })
    ), -1, true);

    // Noticeable glass reflection parallax depth (Displacement doubled, duration halved)
    parallaxX.value = withRepeat(withSequence(
      withTiming(120, { duration: 8000, easing: Easing.inOut(Easing.sin) }),
      withTiming(-120, { duration: 8000, easing: Easing.inOut(Easing.sin) })
    ), -1, true);

    parallaxY.value = withRepeat(withSequence(
      withTiming(-90, { duration: 10000, easing: Easing.inOut(Easing.sin) }),
      withTiming(90, { duration: 10000, easing: Easing.inOut(Easing.sin) })
    ), -1, true);
  }, []);

  const lightBgStyle = useAnimatedStyle(() => ({
    opacity: lightBgOpacity.value
  }));

  const activeAtmos = isDark ? ATMOSPHERE.dark : ATMOSPHERE.light;
  const activeWaves = isDark ? WAVES.dark : WAVES.light;

  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.dark.bg }]}>
      {/* Light Theme Background Crossfade */}
      <Animated.View style={[StyleSheet.absoluteFill, { backgroundColor: THEME.light.bg }, lightBgStyle]} />

      {/* Role-Based Ambient Atmospheres */}
      <AtmosphereLayer colors={activeAtmos.citizen} animOpacity={opCitizen} />
      <AtmosphereLayer colors={activeAtmos.officer} animOpacity={opOfficer} />
      <AtmosphereLayer colors={activeAtmos.admin} animOpacity={opAdmin} />

      {/* Hardware-Accelerated Glassmorphic Parallax Reflections */}
      <GlassReflection moveX={parallaxX} moveY={parallaxY} isDark={isDark} />
      <GlassReflection moveX={parallaxX} moveY={parallaxY} reverse={true} isDark={isDark} />

      {/* Smooth Flowing Header Energy Waves */}
      <HeaderEnergyWave colors={activeWaves.citizen} animOpacity={opCitizen} moveX={waveMove} />
      <HeaderEnergyWave colors={activeWaves.officer} animOpacity={opOfficer} moveX={waveMove} />
      <HeaderEnergyWave colors={activeWaves.admin} animOpacity={opAdmin} moveX={waveMove} />
    </View>
  );
}
