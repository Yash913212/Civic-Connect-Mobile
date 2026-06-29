import React, { useState, useRef, useCallback } from 'react';
import { StyleSheet, View, Text, Pressable, ScrollView } from 'react-native';
import { WebView } from 'react-native-webview';
import * as Haptics from 'expo-haptics';
import { useAppStore } from '../store';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { colors } from '../theme/colors';

const MAP_HTML = `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: #0d1b2e; overflow: hidden; }
    #map { width: 100vw; height: 100vh; background: #0d1b2e; }
    .leaflet-control-zoom a { background: rgba(13,27,46,0.9) !important; color: #c9a84c !important; border-color: rgba(255,255,255,0.06) !important; }
    .custom-marker { width: 20px; height: 20px; border-radius: 50%; border: 2px solid rgba(255,255,255,0.3); box-shadow: 0 0 12px rgba(0,0,0,0.5); }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    const map = L.map('map', { zoomControl: true, attributionControl: false }).setView([17.4483, 78.3741], 12);
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);

    const colorMap = { critical: '#ef4444', high: '#ef4444', medium: '#f5a623', low: '#2ecc8f', default: '#6b7280' };
    let markers = [];

    function buildMarkers(data) {
      markers.forEach(m => map.removeLayer(m));
      markers = [];
      const bounds = [];
      data.forEach(p => {
        const color = colorMap[p.priority] || colorMap.default;
        const icon = L.divIcon({ className: '', html: '<div class="custom-marker" style="background:' + color + ';box-shadow:0 0 12px ' + color + '88;"></div>', iconSize: [20, 20], iconAnchor: [10, 10] });
        const m = L.marker([p.lat, p.lng], { icon }).addTo(map);
        m.bindPopup('<b style="color:#c9a84c">' + p.category + '</b><br/><span style="color:#94a3b8">' + p.title.substring(0, 60) + '</span>');
        markers.push(m);
        bounds.push([p.lat, p.lng]);
      });
      if (bounds.length) map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
    }

    window.addEventListener('message', (e) => {
      try { buildMarkers(JSON.parse(e.data)); } catch (err) {}
    });
  </script>
</body>
</html>`;

export default function HeatmapScreen() {
  const complaints = useAppStore((s) => s.complaints);
  const [selectedIssue, setSelectedIssue] = useState<string | null>(null);
  const webRef = useRef<WebView>(null);

  const markers = complaints.map((c) => ({
    id: c.id,
    latitude: c.latitude || 17.4483,
    longitude: c.longitude || 78.3741,
    category: c.category,
    priority: c.priority,
    title: c.description,
  }));

  const uniqueCategories = Array.from(new Set(markers.map((m) => m.category)));
  const filteredMarkers = selectedIssue ? markers.filter((m) => m.category === selectedIssue) : markers;

  const sendMarkers = useCallback(() => {
    const payload = filteredMarkers.map((m) => ({
      lat: m.latitude,
      lng: m.longitude,
      priority: m.priority,
      category: m.category,
      title: m.title,
    }));
    webRef.current?.postMessage(JSON.stringify(payload));
  }, [filteredMarkers]);

  return (
    <ScreenLayout edges={['top', 'left', 'right']}>
      <View style={s.header}>
        <BackButton />
        <View>
          <Text style={s.title}>CITY HOTSPOTS</Text>
          <Text style={s.subtitle}>Interactive Grievance Heatmap</Text>
        </View>
        <Text style={{ fontSize: 24, color: colors.gold }}>🗺️</Text>
      </View>

      <View style={s.mapContainer}>
        <WebView
          ref={webRef}
          source={{ html: MAP_HTML }}
          style={s.webview}
          scrollEnabled={false}
          overScrollMode="never"
          onLoad={sendMarkers}
          javaScriptEnabled
          domStorageEnabled
          originWhitelist={['*']}
        />
      </View>

      <View style={s.bottomPanel}>
        <Text style={s.panelTitle}>Categories</Text>
        <View style={{ height: 44, marginTop: 8 }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={s.scroller}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setSelectedIssue(null);
              }}
              style={[s.catChip, !selectedIssue && s.catChipActive]}
              accessibilityLabel="Show all categories"
            >
              <Text style={[s.catText, !selectedIssue && s.catTextActive]}>ALL</Text>
            </Pressable>
            {uniqueCategories.map((cat) => (
              <Pressable
                key={cat}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setSelectedIssue(cat);
                }}
                style={[s.catChip, selectedIssue === cat && s.catChipActive]}
                accessibilityLabel={`Filter by ${cat}`}
              >
                <Text style={[s.catText, selectedIssue === cat && s.catTextActive]}>{cat.toUpperCase()}</Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </View>
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
  webview: { flex: 1, backgroundColor: '#0d1b2e', borderRadius: 24 },
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
