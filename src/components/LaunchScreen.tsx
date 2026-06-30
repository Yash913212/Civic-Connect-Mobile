import React, { useEffect } from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withRepeat,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

import { useAppStore } from '../store';
import { theme } from '../theme';

export default function LaunchScreen() {
  const setHasSeenLaunch = useAppStore((state) => state.setHasSeenLaunch);

  // Configure modern high-performance expo-video player
  const player = useVideoPlayer('https://assets.mixkit.co/videos/preview/mixkit-futuristic-technology-digital-interface-background-loop-41907-large.mp4', (p) => {
    p.loop = true;
    p.muted = true;
    p.play();
  });

  // Logo
  const logoScale = useSharedValue(0);
  const logoOpacity = useSharedValue(0);

  // Rings
  const ring1Scale = useSharedValue(1);
  const ring1Opacity = useSharedValue(0);
  const ring2Scale = useSharedValue(1);
  const ring2Opacity = useSharedValue(0);
  const ring3Scale = useSharedValue(1);
  const ring3Opacity = useSharedValue(0);

  // Title
  const titleOpacity = useSharedValue(0);
  const titleTranslateY = useSharedValue(20);

  // Tagline
  const taglineOpacity = useSharedValue(0);
  const taglineTranslateY = useSharedValue(10);

  // Container fade-out
  const containerOpacity = useSharedValue(1);

  const finishLaunch = () => {
    setHasSeenLaunch(true);
  };

  useEffect(() => {
    // Step 1: Logo appears
    logoScale.value = withDelay(300, withSpring(1, { damping: 12, stiffness: 100 }));
    logoOpacity.value = withDelay(300, withTiming(1, { duration: 600 }));

    // Step 2: Rings pulse outward
    ring1Scale.value = withDelay(800, withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    ring1Opacity.value = withDelay(800, withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));

    ring2Scale.value = withDelay(1200, withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    ring2Opacity.value = withDelay(1200, withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));

    ring3Scale.value = withDelay(1600, withRepeat(withTiming(3, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));
    ring3Opacity.value = withDelay(1600, withRepeat(withTiming(0, { duration: 2000, easing: Easing.out(Easing.ease) }), -1, false));

    // Step 3: Title
    titleOpacity.value = withDelay(1500, withTiming(1, { duration: 800 }));
    titleTranslateY.value = withDelay(1500, withTiming(0, { duration: 800 }));

    // Step 4: Tagline
    taglineOpacity.value = withDelay(2500, withTiming(1, { duration: 800 }));
    taglineTranslateY.value = withDelay(2500, withTiming(0, { duration: 800 }));

    // Step 5: Fade out and finish
    containerOpacity.value = withDelay(
      5000,
      withTiming(0, { duration: 600 }, (finished) => {
        if (finished) {
          runOnJS(finishLaunch)();
        }
      })
    );
  }, []);

  const containerStyle = useAnimatedStyle(() => ({
    opacity: containerOpacity.value,
  }));

  const logoStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const ring1Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring1Scale.value }],
    opacity: ring1Opacity.value,
  }));
  const ring2Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring2Scale.value }],
    opacity: ring2Opacity.value,
  }));
  const ring3Style = useAnimatedStyle(() => ({
    transform: [{ scale: ring3Scale.value }],
    opacity: ring3Opacity.value,
  }));

  const titleStyle = useAnimatedStyle(() => ({
    opacity: titleOpacity.value,
    transform: [{ translateY: titleTranslateY.value }],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.container, containerStyle]}>
      {/* Loop background smart-city video */}
      <VideoView
        player={player}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        nativeControls={false}
        fullscreenOptions={{ enable: false }}
        allowsPictureInPicture={false}

      />
      {/* Dark overlay shielding readability */}
      <View style={styles.overlay} />

      {/* Central Logo / AI Node */}
      <Animated.View style={[styles.logoNode, logoStyle]} />

      {/* Pulsing rings */}
      <Animated.View style={[styles.ring, ring1Style]} />
      <Animated.View style={[styles.ring, ring2Style]} />
      <Animated.View style={[styles.ring, ring3Style]} />

      {/* Title */}
      <Animated.Text style={[styles.title, titleStyle]}>Civic Connect</Animated.Text>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineStyle]}>
        Intelligent Civic Governance
      </Animated.Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#04101f',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(4, 16, 31, 0.85)',
  },
  logoNode: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: theme.colors.primary,
    marginBottom: 32,
  },
  ring: {
    position: 'absolute',
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: theme.colors.accent,
  },
  title: {
    fontSize: 48,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 2,
    marginTop: 32,
  },
  tagline: {
    fontSize: 16,
    color: theme.colors.muted,
    marginTop: 16,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
});
