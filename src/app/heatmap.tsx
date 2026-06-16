import React, { useState, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';


const { width: SW, height: SH } = Dimensions.get('window');

const C = {
  navy:       '#05101E',
  surface:    '#0D1B2E',
  elevated:   '#112236',
  gold:       '#C9A84C',
  goldDim:    'rgba(201,168,76,0.12)',
  goldBorder: 'rgba(201,168,76,0.25)',
  amber:      '#F5A623',
  green:      '#2ECC8F',
  blue:       '#3D8EF0',
  danger:     '#EF4444',
  text:       '#FFFFFF',
  muted:      'rgba(255,255,255,0.40)',
  border:     'rgba(255,255,255,0.06)',
} as const;

function GlowingOrb({ color, startX, startY, delay }: { color: string; startX: number; startY: number; delay: number }) {
  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(1.15, { duration: 4000, easing: Easing.inOut(Easing.ease) }),
          withTiming(0.85, { duration: 4000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateX.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(30, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
          withTiming(-30, { duration: 6000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );

    translateY.value = withDelay(
      delay,
      withRepeat(
        withSequence(
          withTiming(-40, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
          withTiming(40, { duration: 8000, easing: Easing.inOut(Easing.ease) })
        ),
        -1,
        true
      )
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <Animated.View
      style={[
        {
          position: 'absolute',
          width: 250,
          height: 250,
          borderRadius: 125,
          backgroundColor: color,
          opacity: 0.08,
          left: startX,
          top: startY,
        },
        style,
      ]}
    />
  );
}

export default function HeatmapScreen() {
  const router = useRouter();
  const complaints = useAppStore((s) => s.complaints);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);

  // Filter complaints having lat/lon coordinates
  const markers = complaints.map((c) => {
    const coords = c.location.split(',');
    return {
      id: c.id,
      latitude: parseFloat(coords[0]) || 17.4483,
      longitude: parseFloat(coords[1]) || 78.3741,
      category: c.category,
      priority: c.priority,
      title: c.description
    };
  });

  const uniqueCategories = Array.from(new Set(markers.map(m => m.category)));
  const filteredMarkers = selectedIssue ? markers.filter(m => m.category === selectedIssue) : markers;

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical':
      case 'high': return C.danger;
      case 'medium': return C.amber;
      default: return C.green;
    }
  };

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#05101E', '#091a35', '#030c18']}
        style={StyleSheet.absoluteFill}
      />
      <GlowingOrb color={C.gold} startX={-60} startY={SH * 0.15} delay={0} />
      <GlowingOrb color={C.blue} startX={SW - 180} startY={SH * 0.55} delay={1500} />

      <SafeAreaView style={{ flex: 1 }}>
        {/* Header */}
        <View style={s.header}>
          <Pressable onPress={() => router.back()} style={s.backBtn}>
            <Text style={{ fontSize: 20, color: C.text, fontFamily: 'Sora_700Bold' }}>←</Text>
          </Pressable>
          <View>
            <Text style={s.title}>CITY HOTSPOTS</Text>
            <Text style={s.subtitle}>Interactive Grievance Heatmap</Text>
          </View>
          <Text style={{ fontSize: 24, color: C.gold }}>🗺️</Text>
        </View>

        {/* Map Area */}
        <View style={s.mapContainer}>
          <View style={s.mockMap}>
            {/* Ambient Background Grid representing geographic sectors */}
            <View style={s.gridLineH} />
            <View style={[s.gridLineH, { top: '50%' }]} />
            <View style={[s.gridLineH, { top: '75%' }]} />
            <View style={s.gridLineV} />
            <View style={[s.gridLineV, { left: '50%' }]} />
            <View style={[s.gridLineV, { left: '75%' }]} />

            {/* Render interactive dynamic visual mapping hotspots */}
            {filteredMarkers.map((m, idx) => {
              // Convert lat/lon offset to mock positioning coordinates inside container
              const leftPct = 15 + ((m.longitude - 78.35) * 1200) % 70;
              const topPct = 15 + ((m.latitude - 17.42) * 1200) % 70;

              return (
                <View key={m.id} style={[s.markerWrapper, { left: `${leftPct}%`, top: `${topPct}%` }]}>
                  {/* Glowing Pulse Radar representation */}
                  <View style={[s.pulseRadar, { backgroundColor: getPriorityColor(m.priority) }]} />
                  <Pressable style={[s.markerPin, { backgroundColor: getPriorityColor(m.priority) }]}>
                    <Text style={s.pinTxt}>{m.category[0]}</Text>
                  </Pressable>
                </View>
              );
            })}

            {/* Map Overlay HUD controls */}
            <GlassCard
              style={s.hudCard}
              borderColor="rgba(255,255,255,0.08)"
              glowColor="rgba(201,168,76,0.04)"
              delay={200}
              padding={16}
            >
              <Text style={s.hudTitle}>📍 GIGA-SECTOR SCANNER</Text>
              <Text style={s.hudDesc}>GPS Auto-clustering overlays enabled.</Text>
            </GlassCard>

          </View>
        </View>

        {/* Categories filters board */}
        <View style={s.bottomPanel}>
          <Text style={s.panelTitle}>Ingestion Categories</Text>
          <View style={{ height: 44, marginTop: 8 }}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroller}>
              <Pressable onPress={() => setSelectedIssue(null)} style={[s.catChip, !selectedIssue && s.catChipActive]}>
                <Text style={[s.catText, !selectedIssue && s.catTextActive]}>ALL HOTSPOTS</Text>
              </Pressable>
              {uniqueCategories.map((cat) => (
                <Pressable key={cat} onPress={() => setSelectedIssue(cat)} style={[s.catChip, selectedIssue === cat && s.catChipActive]}>
                  <Text style={[s.catText, selectedIssue === cat && s.catTextActive]}>{cat.toUpperCase()}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 24, paddingVertical: 16, borderBottomWidth: 1, borderColor: C.border },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border
  },
  title: { fontSize: 16, fontWeight: '800', color: C.text, letterSpacing: 1.5, fontFamily: 'Sora_800ExtraBold' },
  subtitle: { fontSize: 11, color: C.gold, textTransform: 'uppercase', marginTop: 2, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 },
  mapContainer: { flex: 1, backgroundColor: 'rgba(13,27,46,0.5)', overflow: 'hidden', borderWidth: 1, borderColor: C.border, margin: 20, borderRadius: 24 },
  mockMap: { flex: 1, position: 'relative' },
  gridLineH: { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.03)', top: '25%' },
  gridLineV: { position: 'absolute', top: 0, bottom: 0, width: 1, backgroundColor: 'rgba(255,255,255,0.03)', left: '25%' },
  markerWrapper: { position: 'absolute', width: 44, height: 44, alignItems: 'center', justifyContent: 'center' },
  pulseRadar: { position: 'absolute', width: 34, height: 34, borderRadius: 17, opacity: 0.25, transform: [{ scale: 1.5 }] },
  markerPin: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 6, elevation: 8, borderWidth: 1, borderColor: C.border },
  pinTxt: { fontSize: 11, fontWeight: '800', color: '#fff', fontFamily: 'Sora_800ExtraBold' },
  hudCard: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    borderWidth: 0,
    padding: 0,
    borderRadius: 16,
    backgroundColor: 'transparent'
  },
  hudTitle: { fontSize: 12, fontWeight: '800', color: C.text, letterSpacing: 1, fontFamily: 'Sora_700Bold' },
  hudDesc: { fontSize: 11, color: C.muted, marginTop: 4, fontFamily: 'Sora_400Regular' },

  bottomPanel: { padding: 20, borderTopWidth: 1, borderColor: C.border },
  panelTitle: { fontSize: 13, fontWeight: '700', color: C.text, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Sora_700Bold' },
  scroller: { gap: 8 },
  catChip: {
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: C.border,
    justifyContent: 'center',
    height: 38
  },
  catChipActive: { backgroundColor: C.gold, borderColor: C.gold },

  catText: { fontSize: 11, fontWeight: '700', color: C.muted, fontFamily: 'Sora_600SemiBold' },
  catTextActive: { color: C.navy, fontFamily: 'Sora_700Bold' }
});
