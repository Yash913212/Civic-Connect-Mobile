import React, { useRef, useCallback, useEffect } from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { WebView, WebViewMessageEvent } from 'react-native-webview';
import type { Complaint } from '../store/types';
import { HYDERABAD_BOUNDS, HYDERABAD_CENTER, MIN_ZOOM, MAX_ZOOM } from '../constants';

interface MarkerData {
  id?: string;
  lat: number;
  lng: number;
  title?: string;
  category?: string;
  priority?: string;
  color?: string;
}

interface LeafletMapProps {
  complaints?: Complaint[];
  markers?: MarkerData[];
  center?: { latitude: number; longitude: number };
  zoom?: number;
  height?: number;
  interactive?: boolean;
  showControls?: boolean;
  singleMarker?: { latitude: number; longitude: number; title?: string };
  onMarkerPress?: (marker: MarkerData) => void;
  onReady?: () => void;
  style?: ViewStyle;
}

const PRIORITY_COLORS: Record<string, string> = {
  critical: '#ef4444',
  high: '#f59e0b',
  medium: '#3b82f6',
  low: '#10b981',
};

const HTML_TEMPLATE = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#0d1b2e;overflow:hidden}
    #map{width:100vw;height:100vh;background:#0d1b2e}
    .leaflet-control-zoom a{background:rgba(13,27,46,0.9)!important;color:#c9a84c!important;border-color:rgba(255,255,255,0.06)!important}
    .leaflet-control-attribution{display:none!important}
    .custom-marker{width:18px;height:18px;border-radius:50%;border:2px solid rgba(255,255,255,0.25);box-shadow:0 0 10px rgba(0,0,0,0.6);transition:transform .15s}
    .custom-marker:hover{transform:scale(1.25)}
    .single-marker{width:28px;height:28px;border-radius:50%;background:#3b82f6;border:3px solid rgba(255,255,255,0.4);box-shadow:0 0 20px rgba(59,130,246,0.5);animation:pulse 2s ease-in-out infinite}
    @keyframes pulse{0%,100%{box-shadow:0 0 20px rgba(59,130,246,0.5)}50%{box-shadow:0 0 30px rgba(59,130,246,0.8)}}
    .popup-title{color:#c9a84c;font-size:13px;font-weight:700;margin-bottom:2px}
    .popup-cat{color:#94a3b8;font-size:11px}
    .popup-id{color:#64748b;font-size:10px;margin-top:4px}
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var bounds = [[${HYDERABAD_BOUNDS.minLat}, ${HYDERABAD_BOUNDS.minLng}], [${HYDERABAD_BOUNDS.maxLat}, ${HYDERABAD_BOUNDS.maxLng}]];
    var map = L.map('map', { zoomControl: true, attributionControl: false, maxBounds: bounds, maxBoundsViscosity: 1.0, minZoom: ${MIN_ZOOM}, maxZoom: ${MAX_ZOOM} }).setView([${HYDERABAD_CENTER.latitude}, ${HYDERABAD_CENTER.longitude}], ${12});
    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', { maxZoom: 19 }).addTo(map);
    var markers = [];
    var singleMarkerLayer = null;

    function buildMarkers(data) {
      markers.forEach(function(m) { map.removeLayer(m); });
      markers = [];
      if (singleMarkerLayer) { map.removeLayer(singleMarkerLayer); singleMarkerLayer = null; }

      var bounds = [];
      data.forEach(function(p) {
        var isSingle = p._single;
        if (isSingle) {
          var icon = L.divIcon({ className: '', html: '<div class="single-marker"></div>', iconSize: [28, 28], iconAnchor: [14, 14] });
          var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
          singleMarkerLayer = m;
          if (p.title) m.bindPopup('<div class="popup-title">' + p.title + '</div>');
        } else {
          var color = p.color || '#6b7280';
          var icon = L.divIcon({ className: '', html: '<div class="custom-marker" style="background:' + color + ';box-shadow:0 0 10px ' + color + '66;"></div>', iconSize: [18, 18], iconAnchor: [9, 9] });
          var m = L.marker([p.lat, p.lng], { icon: icon }).addTo(map);
          m._civicId = p.id;
          var popupHtml = '';
          if (p.category) popupHtml += '<div class="popup-cat">' + p.category + '</div>';
          if (p.title) popupHtml += '<div class="popup-title">' + p.title.substring(0, 80) + '</div>';
          if (p.id) popupHtml += '<div class="popup-id">' + p.id + '</div>';
          if (popupHtml) m.bindPopup(popupHtml);
        }
        markers.push(m);
        bounds.push([p.lat, p.lng]);
      });
      if (bounds.length > 1) {
        map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
      } else if (bounds.length === 1) {
        map.setView(bounds[0], 15);
      }
    }

    window.addEventListener('message', function(e) {
      try { buildMarkers(JSON.parse(e.data)); } catch(err) {}
    });

    document.addEventListener('click', function(e) {
      var target = e.target;
      while (target && target !== document) {
        if (target._leaflet_id && target._civicId) {
          window.ReactNativeWebView.postMessage(JSON.stringify({ type: 'marker_press', id: target._civicId }));
          return;
        }
        target = target.parentNode;
      }
    });
  </script>
</body>
</html>`;

export function LeafletMap({
  complaints,
  markers: markerProp,
  center,
  zoom,
  height = 200,
  interactive = true,
  showControls = true,
  singleMarker,
  onMarkerPress,
  onReady,
  style,
}: LeafletMapProps) {
  const webRef = useRef<WebView>(null);

  const buildPayload = useCallback(() => {
    if (singleMarker) {
      return JSON.stringify([{ lat: singleMarker.latitude, lng: singleMarker.longitude, title: singleMarker.title || 'Your Location', _single: true }]);
    }
    if (markerProp) {
      return JSON.stringify(markerProp.map((m) => ({
        id: m.id,
        lat: m.lat,
        lng: m.lng,
        title: m.title,
        category: m.category,
        color: m.color || (m.priority ? PRIORITY_COLORS[m.priority] : '#6b7280'),
      })));
    }
    if (complaints) {
      return JSON.stringify(complaints
        .filter((c) => c.latitude && c.longitude)
        .map((c) => ({
          id: c.id,
          lat: c.latitude,
          lng: c.longitude,
          title: c.title || c.description,
          category: c.category,
          color: PRIORITY_COLORS[c.priority] || '#6b7280',
        })),
      );
    }
    return '[]';
  }, [complaints, markerProp, singleMarker]);

  useEffect(() => {
    if (webRef.current) {
      webRef.current.postMessage(buildPayload());
    }
  }, [buildPayload]);

  const handleMessage = useCallback(
    (event: WebViewMessageEvent) => {
      try {
        const msg = JSON.parse(event.nativeEvent.data);
        if (msg.type === 'marker_press' && onMarkerPress && markerProp) {
          const found = markerProp.find((m) => m.id === msg.id);
          if (found) onMarkerPress(found);
        }
      } catch {}
    },
    [onMarkerPress, markerProp],
  );

  const injectJS = `
    document.querySelector('.leaflet-control-zoom')?.style.setProperty('display', '${showControls ? 'block' : 'none'}');
    true;
  `;

  return (
    <WebView
      ref={webRef}
      source={{ html: HTML_TEMPLATE }}
      style={[{ height, backgroundColor: '#0d1b2e', borderRadius: 12 }, style]}
      scrollEnabled={false}
      overScrollMode="never"
      onLoad={() => {
        webRef.current?.injectJavaScript(injectJS);
        setTimeout(() => webRef.current?.postMessage(buildPayload()), 100);
        onReady?.();
      }}
      onMessage={interactive ? handleMessage : undefined}
      javaScriptEnabled
      domStorageEnabled
      originWhitelist={['*']}
    />
  );
}
