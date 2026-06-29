import React, { useEffect } from 'react';
import { StyleSheet, View, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';

const { width: SW } = Dimensions.get('window');

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export function SkeletonLine({ width = '100%', height = 14, borderRadius = 6, style }: SkeletonProps) {
  const opacity = useSharedValue(0.3);

  useEffect(() => {
    opacity.value = withRepeat(
      withTiming(0.7, { duration: 1200, easing: Easing.inOut(Easing.ease) }),
      -1,
      true,
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: 'rgba(255,255,255,0.08)',
        },
        animatedStyle,
        style,
      ]}
    />
  );
}

export function SkeletonCard({ style }: { style?: any }) {
  return (
    <View style={[{ padding: 18, gap: 10 }, style]}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <SkeletonLine width={80} height={14} />
        <SkeletonLine width={60} height={14} />
      </View>
      <SkeletonLine width="70%" height={18} />
      <SkeletonLine width="100%" height={13} />
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 4 }}>
        <SkeletonLine width={100} height={12} />
        <SkeletonLine width={60} height={12} />
      </View>
    </View>
  );
}

export function SkeletonStatGrid() {
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View
          key={i}
          style={{
            width: (SW - 40 - 10) / 2,
            padding: 16,
            borderRadius: 20,
            backgroundColor: 'rgba(255,255,255,0.03)',
            gap: 8,
          }}
        >
          <SkeletonLine width={40} height={28} />
          <SkeletonLine width={80} height={11} />
        </View>
      ))}
    </View>
  );
}
