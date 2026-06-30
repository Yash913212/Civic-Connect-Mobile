import React from 'react';
import { StyleSheet, View, Text, Dimensions, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import * as Haptics from 'expo-haptics';
import { GlassCard } from './GlassCard';
import { LeafletMap } from './LeafletMap';
import { useAppStore } from '../store';
import { colors } from '../theme';

const { width: SW } = Dimensions.get('window');

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#EF4444',
  high: '#F59E0B',
  medium: '#3B82F6',
  low: '#10B981',
};

export function MapPreview() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    router.push('/heatmap');
  };

  const markers = complaints.filter((c) => c.latitude && c.longitude).slice(0, 30);
  const totalMarkers = complaints.filter((c) => c.latitude && c.longitude).length;

  return (
    <TouchableOpacity onPress={handlePress} activeOpacity={0.9} style={styles.wrapper}>
      <GlassCard
        style={styles.card}
        borderColor="rgba(61,142,240,0.2)"
        glowColor="rgba(61,142,240,0.06)"
        padding={0}
        radius={20}
      >
        <View style={styles.container}>
          <LeafletMap
            complaints={markers}
            height={160}
            interactive={false}
            showControls={false}
            style={{ borderRadius: 20, borderWidth: 0, width: '100%' }}
          />
          <LinearGradient
            colors={['transparent', 'rgba(13,27,46,0.85)']}
            start={{ x: 0.5, y: 0.6 }}
            end={{ x: 0.5, y: 1 }}
            style={StyleSheet.absoluteFill}
            pointerEvents="none"
          />
          <View style={styles.bottomBar}>
            <View style={styles.legend}>
              {Object.entries(PRIORITY_COLORS).map(([key, color]) => (
                <View key={key} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: color }]} />
                  <Text style={styles.legendText}>{key}</Text>
                </View>
              ))}
            </View>
            <Text style={styles.count}>{totalMarkers} issues</Text>
          </View>
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginHorizontal: 20,
    marginTop: 4,
  },
  card: {
    borderRadius: 20,
    borderWidth: 0,
    backgroundColor: 'transparent',
    overflow: 'hidden',
  },
  container: {
    height: 160,
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  bottomBar: {
    position: 'absolute',
    bottom: 8,
    left: 12,
    right: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  legend: {
    flexDirection: 'row',
    gap: 10,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  legendText: {
    fontSize: 8,
    color: 'rgba(255,255,255,0.5)',
    fontFamily: 'Sora_400Regular',
    textTransform: 'capitalize',
  },
  count: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'Sora_600SemiBold',
  },
});
