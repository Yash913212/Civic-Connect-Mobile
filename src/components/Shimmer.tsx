import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  interpolate,
  Easing,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

interface ShimmerProps {
  width?: number | string;
  height?: number;
  radius?: number;
  style?: any;
}

export function ShimmerLine({ width = '100%', height = 14, radius = 8, style }: ShimmerProps) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withRepeat(
      withTiming(1, { duration: 1500, easing: Easing.linear }),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: interpolate(progress.value, [0, 0.5, 1], [0.3, 0.7, 0.3]),
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius: radius,
          backgroundColor: 'rgba(255,255,255,0.06)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function ShimmerCard({ style }: { style?: any }) {
  return (
    <View style={[{ padding: 16, gap: 10 }, style]}>
      <ShimmerLine width="60%" height={16} radius={6} />
      <ShimmerLine width="100%" height={12} radius={6} />
      <ShimmerLine width="80%" height={12} radius={6} />
    </View>
  );
}

export function ShimmerStatGrid({ count = 4 }: { count?: number }) {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {Array.from({ length: count }).map((_, i) => (
        <View key={i} style={{ width: '48%', padding: 16, borderRadius: 16, backgroundColor: 'rgba(255,255,255,0.04)', gap: 8 }}>
          <ShimmerLine width="40%" height={28} radius={4} />
          <ShimmerLine width="60%" height={10} radius={4} />
        </View>
      ))}
    </View>
  );
}
