import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { ColorValue } from 'react-native';
import { GlowingOrb } from './GlowingOrb';
import { colors } from '../theme/colors';

const { width: SW, height: SH } = Dimensions.get('window');

interface ScreenLayoutProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
  showOrbs?: boolean;
  orbColors?: readonly [string, string];
  gradientColors?: readonly [ColorValue, ColorValue, ColorValue];
}

export function ScreenLayout({
  children,
  style,
  edges = ['top', 'bottom'],
  showOrbs = true,
  orbColors = [colors.gold, colors.blue],
  gradientColors = ['#05101E', '#091a35', '#030c18'],
}: ScreenLayoutProps) {
  return (
    <View style={styles.container}>
      <LinearGradient colors={gradientColors} style={StyleSheet.absoluteFill} />
      {showOrbs && (
        <>
          <GlowingOrb color={orbColors[0]} startX={-60} startY={SH * 0.15} delay={0} />
          <GlowingOrb color={orbColors[1]} startX={SW - 180} startY={SH * 0.55} delay={1500} />
        </>
      )}
      <SafeAreaView style={[styles.safe, style]} edges={edges}>
        {children}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  safe: {
    flex: 1,
  },
});


