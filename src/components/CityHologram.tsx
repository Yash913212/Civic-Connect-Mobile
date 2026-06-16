import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  withDelay,
  Easing,
} from 'react-native-reanimated';
import { theme } from '../theme';

const { width, height } = Dimensions.get('window');

// Animated floating particle dot
function Particle({ x, y, size, delay, color }: { x: number; y: number; size: number; delay: number; color: string }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.8, { duration: 2000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
    translateY.value = withDelay(
      delay,
      withRepeat(
        withTiming(-30, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          left: x,
          top: y,
          width: size,
          height: size,
          borderRadius: size / 2,
          backgroundColor: color,
        },
        animatedStyle,
      ]}
    />
  );
}

// Animated ring that pulses outward
function PulseRing({ delay, size }: { delay: number; size: number }) {
  const scale = useSharedValue(0.5);
  const opacity = useSharedValue(0.6);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withTiming(2.5, { duration: 3000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0, { duration: 3000, easing: Easing.out(Easing.ease) }),
        -1,
        false
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: 1,
          borderColor: theme.colors.primary,
          alignSelf: 'center',
          top: height * 0.3,
          left: (width - size) / 2,
        },
        animatedStyle,
      ]}
    />
  );
}

// Grid line that glows
function GridLine({ horizontal, offset, delay }: { horizontal: boolean; offset: number; delay: number }) {
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(
        withTiming(0.15, { duration: 3000, easing: Easing.inOut(Easing.ease) }),
        -1,
        true
      )
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          backgroundColor: theme.colors.secondary,
          ...(horizontal
            ? { left: 0, right: 0, top: offset, height: 1 }
            : { top: 0, bottom: 0, left: offset, width: 1 }),
        },
        animatedStyle,
      ]}
    />
  );
}

export default function CityHologram() {
  // Create particles
  const particles = React.useMemo(() => {
    const arr = [];
    const colors = [theme.colors.primary, theme.colors.secondary, theme.colors.accent];
    for (let i = 0; i < 40; i++) {
      arr.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: 2 + Math.random() * 4,
        delay: Math.random() * 3000,
        color: colors[Math.floor(Math.random() * colors.length)],
      });
    }
    return arr;
  }, []);

  // Create grid lines
  const gridLines = React.useMemo(() => {
    const lines = [];
    const spacing = 60;
    for (let i = 0; i < Math.ceil(height / spacing); i++) {
      lines.push({ horizontal: true, offset: i * spacing, delay: i * 200 });
    }
    for (let i = 0; i < Math.ceil(width / spacing); i++) {
      lines.push({ horizontal: false, offset: i * spacing, delay: i * 200 });
    }
    return lines;
  }, []);

  return (
    <View style={styles.container}>
      {/* Grid */}
      {gridLines.map((line, i) => (
        <GridLine key={`grid-${i}`} {...line} />
      ))}

      {/* Pulse rings */}
      <PulseRing delay={0} size={120} />
      <PulseRing delay={800} size={120} />
      <PulseRing delay={1600} size={120} />

      {/* Particles */}
      {particles.map((p, i) => (
        <Particle key={`p-${i}`} {...p} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: theme.colors.background,
    overflow: 'hidden',
  },
});
