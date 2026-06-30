import React, { useEffect, useRef, useState } from 'react';
import { Text } from 'react-native';
import Animated, {
  useSharedValue,
  withTiming,
  withDelay,
  runOnJS,
} from 'react-native-reanimated';

interface AnimatedCounterProps {
  value: number;
  delay?: number;
  duration?: number;
  style?: any;
  suffix?: string;
  prefix?: string;
  decimals?: number;
}

export function AnimatedCounter({
  value,
  delay: delayMs = 0,
  duration = 1000,
  style,
  suffix = '',
  prefix = '',
  decimals = 0,
}: AnimatedCounterProps) {
  const [display, setDisplay] = useState(prefix + '0' + suffix);
  const progress = useSharedValue(0);
  const fromRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  useEffect(() => {
    fromRef.current = 0;
    progress.value = 0;

    const animate = () => {
      const raw = progress.value * value;
      const formatted = prefix + raw.toFixed(decimals) + suffix;
      setDisplay(formatted);

      if (raw < value) {
        rafRef.current = requestAnimationFrame(animate);
      }
    };

    const timeout = setTimeout(() => {
      progress.value = withTiming(1, { duration }, (finished) => {
        if (finished) {
          runOnJS(setDisplay)(prefix + value.toFixed(decimals) + suffix);
        }
      });
      rafRef.current = requestAnimationFrame(animate);
    }, delayMs);

    return () => {
      clearTimeout(timeout);
      if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    };
  }, [value, delayMs, duration]);

  return <Text style={style}>{display}</Text>;
}
