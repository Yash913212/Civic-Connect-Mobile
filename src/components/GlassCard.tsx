import React, { useEffect } from 'react';
import { StyleSheet, ViewStyle, View, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
} from 'react-native-reanimated';
import { theme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  intensity?: number;
  borderColor?: string;
  glowColor?: string;
  padding?: number;
  accessibilityLabel?: string;
}


export function GlassCard({
  children,
  style,
  delay = 0,
  intensity = 35,
  borderColor = 'rgba(255, 255, 255, 0.12)',
  glowColor,
  padding = 20,
  accessibilityLabel,
}: GlassCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(15);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600 }));
  }, [delay]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }],
  }));

  return (
    <Animated.View
      style={[
        styles.container,
        { borderColor },
        style,
        animatedStyle,
      ]}
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'text' : undefined}
    >
      {glowColor && (
        <View style={[styles.glow, { backgroundColor: glowColor }]} pointerEvents="none" />
      )}
      <BlurView intensity={intensity} tint="dark" style={[styles.blur, { padding }]}>
        {children}
      </BlurView>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    position: 'relative',
    backgroundColor: 'transparent',
  },
  blur: {
    backgroundColor: 'rgba(13, 27, 46, 0.45)',
  },
  glow: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.12,
    borderRadius: 20,
  },
});

