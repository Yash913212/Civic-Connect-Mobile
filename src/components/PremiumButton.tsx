import React from 'react';
import { StyleSheet, Pressable, Text, ViewStyle } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import { haptics } from '../utils/haptics';
import { theme } from '../theme';

interface PremiumButtonProps {
  title: string;
  onPress: () => void;
  style?: ViewStyle;
  variant?: 'primary' | 'secondary';
}

export function PremiumButton({ title, onPress, style, variant = 'primary' }: PremiumButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    haptics.light();
    scale.value = withSpring(0.95);
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[animatedStyle, style]}>
      <Pressable
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        style={[
          styles.button,
          isPrimary ? styles.primaryBg : styles.secondaryBg,
        ]}
      >
        <Text style={[styles.text, isPrimary ? styles.primaryText : styles.secondaryText]}>
          {title}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  primaryBg: {
    backgroundColor: theme.colors.primary,
    borderColor: theme.colors.primary,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  secondaryBg: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  text: {
    fontSize: theme.typography.sizes.md,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: theme.colors.text,
  },
});
