import React, { useEffect, useMemo } from 'react';
import { StyleSheet, ViewStyle, View, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  runOnJS,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { theme } from '../theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  delay?: number;
  intensity?: number;
  borderColor?: string;
  glowColor?: string;
  padding?: number;
  radius?: number;
  pressable?: boolean;
  onPress?: () => void;
  pulsating?: boolean;
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
  radius = 20,
  pressable = false,
  onPress,
  pulsating = false,
  accessibilityLabel,
}: GlassCardProps) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  const scale = useSharedValue(1);
  const glowIntensity = useSharedValue(0.08);

  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 600 }));
    translateY.value = withDelay(delay, withTiming(0, { duration: 600 }));
  }, [delay]);

  useEffect(() => {
    if (pulsating) {
      glowIntensity.value = withRepeat(
        withTiming(0.2, { duration: 2000 }),
        -1,
        true
      );
    }
  }, [pulsating]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
    transform: [{ translateY: translateY.value }, { scale: scale.value }],
  }));

  const glowStyle = useAnimatedStyle(() => ({
    opacity: glowIntensity.value,
  }));

  const tap = useMemo(
    () =>
      Gesture.Tap()
        .enabled(pressable)
        .onBegin(() => {
          scale.value = withSpring(0.97, { damping: 15, stiffness: 200 });
        })
        .onStart(() => {
          runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
        })
        .onEnd(() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 150 });
          if (onPress) runOnJS(onPress)();
        })
        .onFinalize(() => {
          scale.value = withSpring(1, { damping: 12, stiffness: 150 });
        }),
    [pressable, onPress]
  );

  const content = (
    <Animated.View
      accessibilityLabel={accessibilityLabel}
      accessibilityRole={accessibilityLabel ? 'text' : undefined}
      style={[
        {
          borderRadius: radius,
          overflow: 'hidden',
          borderWidth: 1,
          borderColor,
          position: 'relative',
          backgroundColor: 'transparent',
        },
        style,
        animatedStyle,
      ]}
    >
      {(glowColor || pulsating) && (
        <Animated.View
          pointerEvents="none"
          style={[
            {
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: glowColor || 'rgba(201,168,76,0.12)',
              borderRadius: radius,
            },
            pulsating ? glowStyle : { opacity: 0.12 },
          ]}
        />
      )}
      <BlurView
        intensity={intensity}
        tint="dark"
        style={[{ padding, borderRadius: radius, backgroundColor: 'rgba(13, 27, 46, 0.35)' }]}
      >
        {children}
      </BlurView>
      <LinearGradient
        colors={['rgba(255,255,255,0.03)', 'transparent']}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, height: '50%', borderRadius: radius }}
        pointerEvents="none"
      />
    </Animated.View>
  );

  if (pressable) {
    return <GestureDetector gesture={tap}>{content}</GestureDetector>;
  }
  return content;
}
