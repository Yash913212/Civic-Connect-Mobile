import React, { useState, useMemo, useEffect } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import * as Haptics from 'expo-haptics';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withDelay, withSpring } from 'react-native-reanimated';
import { useAppStore } from '../store';
import { LeafletMap } from '../components/LeafletMap';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

function EntryView({ delay = 0, style, children }: { delay?: number; style?: any; children: React.ReactNode }) {
  const opacity = useSharedValue(0);
  const translateY = useSharedValue(20);
  useEffect(() => {
    opacity.value = withDelay(delay, withTiming(1, { duration: 400 }));
    translateY.value = withDelay(delay, withSpring(0, { damping: 15 }));
  }, []);
  const aStyle = useAnimatedStyle(() => ({ opacity: opacity.value, transform: [{ translateY: translateY.value }] }));
  return <Animated.View style={[style, aStyle]}>{children}</Animated.View>;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};

export default function HeatmapScreen() {
  const complaints = useAppStore((s) => s.complaints);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allMarkers = useMemo(
    () =>
      complaints
        .filter((c) => c.latitude && c.longitude)
        .map((c) => ({
          id: c.id,
          lat: c.latitude,
          lng: c.longitude,
          title: c.description || c.title,
          category: c.category,
          color: PRIORITY_COLORS[c.priority] || '#6b7280',
        })),
    [complaints],
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(allMarkers.map((m) => m.category))),
    [allMarkers],
  );

  const filteredMarkers = useMemo(
    () => (selectedCategory ? allMarkers.filter((m) => m.category === selectedCategory) : allMarkers),
    [allMarkers, selectedCategory],
  );

  return (
    <ScreenLayout edges={['top', 'left', 'right']}>
      <EntryView delay={50}>
      <View style={s.header}>
        <BackButton />
        <View>
          <Text style={s.title}>CITY HOTSPOTS</Text>
          <Text style={s.subtitle}>Interactive Grievance Heatmap</Text>
        </View>
        <Text style={{ fontSize: 24, color: colors.gold }}>🗺️</Text>
      </View>
      </EntryView>

      <EntryView delay={150} style={{ flex: 1 }}>
      <View style={s.mapContainer}>
        <LeafletMap
          markers={filteredMarkers}
          height={500}
          interactive
          showControls
          style={{ flex: 1, borderRadius: 24, borderWidth: 0 }}
        />
      </View>
      </EntryView>

      <EntryView delay={250}>
      <View style={s.bottomPanel}>
        <Text style={s.panelTitle}>Categories</Text>
        <View style={{ height: 44, marginTop: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroller}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedCategory(null);
              }}
              style={[s.catChip, !selectedCategory && s.catChipActive]}
              accessibilityLabel="Show all categories"
            >
              <Text style={[s.catText, !selectedCategory && s.catTextActive]}>ALL</Text>
            </Pressable>
            {uniqueCategories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedCategory(cat);
                }}
                style={[s.catChip, selectedCategory === cat && s.catChipActive]}
                accessibilityLabel={`Filter by ${cat}`}
              >
                <Text style={[s.catText, selectedCategory === cat && s.catTextActive]}>{cat.toUpperCase()}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
      </EntryView>
    </ScreenLayout>
  );
}

const s = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: { fontSize: 16, fontWeight: '800', color: colors.text, letterSpacing: 1.5, fontFamily: 'Sora_800ExtraBold' },
  subtitle: { fontSize: 11, color: colors.gold, textTransform: 'uppercase', marginTop: 2, fontFamily: 'Sora_600SemiBold', letterSpacing: 0.5 },
  mapContainer: { flex: 1, overflow: 'hidden', margin: 20, borderRadius: 24, borderWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  bottomPanel: { padding: 20, borderTopWidth: 1, borderColor: 'rgba(255,255,255,0.06)' },
  panelTitle: { fontSize: 13, fontWeight: '700', color: colors.text, textTransform: 'uppercase', letterSpacing: 1, fontFamily: 'Sora_700Bold' },
  scroller: { gap: 8 },
  catChip: {
    paddingHorizontal: 16,
    borderRadius: 14,
    backgroundColor: 'rgba(13,27,46,0.45)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
    justifyContent: 'center',
    height: 38,
  },
  catChipActive: { backgroundColor: colors.gold, borderColor: colors.gold },
  catText: { fontSize: 11, fontWeight: '700', color: colors.muted, fontFamily: 'Sora_600SemiBold' },
  catTextActive: { color: colors.navy, fontFamily: 'Sora_700Bold' },
});
