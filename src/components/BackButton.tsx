import React from 'react';
import { StyleSheet, Pressable, Text } from 'react-native';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import Svg, { Path } from 'react-native-svg';

interface BackButtonProps {
  onPress?: () => void;
  color?: string;
}

export function BackButton({ onPress, color = 'rgba(255,255,255,0.6)' }: BackButtonProps) {
  const router = useRouter();

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    if (onPress) {
      onPress();
    } else {
      router.back();
    }
  };

  return (
    <Pressable
      style={styles.btn}
      onPress={handlePress}
      accessibilityLabel="Go back"
      accessibilityRole="button"
    >
      <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
        <Path d="M13 4l-6 6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
      </Svg>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
});
