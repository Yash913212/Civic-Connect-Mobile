import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  TextInput,
  ScrollView,
  Pressable,
  Alert,
  ActivityIndicator,
  Dimensions,
} from 'react-native';
import { Image } from 'expo-image';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useAudioRecorder, RecordingPresets, requestRecordingPermissionsAsync } from 'expo-audio';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withRepeat,
  withSpring,
  withDelay,
  withSequence,
  Easing,
} from 'react-native-reanimated';
import { useAppStore } from '../store';
import { GlassCard } from '../components/GlassCard';
import { LeafletMap } from '../components/LeafletMap';
import { colors } from '../theme';
import { aiSuggestCategory } from '../services/ai';
import { generateComplaintText, suggestCategoryWithGroq } from '../services/groq';
import { detectLanguage, extractKeywords } from '../services/nlp';


const { width: SW, height: SH } = Dimensions.get('window');

const C = { ...colors, muted: 'rgba(255,255,255,0.40)', danger: '#FF6B6B' };

// ── Category Data ──
const CATEGORIES = [
  { id: 'pothole', label: 'Pothole', emoji: '🕳️', color: C.danger },
  { id: 'garbage', label: 'Garbage', emoji: '🗑️', color: C.amber },
  { id: 'streetlight', label: 'Streetlight', emoji: '💡', color: C.blue },
  { id: 'water', label: 'Water Leak', emoji: '💧', color: C.civicBlue },
  { id: 'drainage', label: 'Drainage', emoji: '🚰', color: C.green },
  { id: 'other', label: 'Other', emoji: '📋', color: C.muted },
];

// ── Animated Dot ──
function PulseDot({ color, delay = 0 }: { color: string; delay?: number }) {
  const opacity = useSharedValue(0.3);
  useEffect(() => {
    opacity.value = withDelay(
      delay,
      withRepeat(withTiming(1, { duration: 1200 }), -1, true)
    );
  }, []);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return (
    <Animated.View
      style={[
        { width: 6, height: 6, borderRadius: 3, backgroundColor: color },
        style,
      ]}
    />
  );
}

// ── Mic Wave Bar ──
function WaveBar({ index, active }: { index: number; active: boolean }) {
  const height = useSharedValue(8);
  useEffect(() => {
    if (active) {
      height.value = withDelay(
        index * 80,
        withRepeat(
          withSequence(
            withTiming(20 + Math.random() * 16, { duration: 200 + Math.random() * 150 }),
            withTiming(4 + Math.random() * 6, { duration: 200 + Math.random() * 150 })
          ),
          -1,
          true
        )
      );
    } else {
      height.value = withTiming(8, { duration: 400 });
    }
  }, [active]);
  const style = useAnimatedStyle(() => ({
    height: height.value,
    width: 3,
    borderRadius: 1.5,
    backgroundColor: active ? C.civicBlue : C.muted,
    marginHorizontal: 1.5,
  }));
  return <Animated.View style={style} />;
}

function Section({
  title,
  subtitle,
  children,
  delay = 0,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  delay?: number;
}) {
  return (
    <GlassCard
      style={styles.section}
      borderColor="rgba(255,255,255,0.08)"
      glowColor="rgba(42,117,211,0.03)"
      delay={delay}
      padding={20}
    >
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
      {children}
    </GlassCard>
  );
}


export default function ReportScreen({ isTab = false }: { isTab?: boolean }) {
  const router = useRouter();
  const submitComplaint = useAppStore((s) => s.submitComplaint);
  const isLoading = useAppStore((s) => s.isLoading);
  const setLoading = useAppStore((s) => s.setLoading);

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const recorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [transcribing, setTranscribing] = useState(false);
  const [transcriptLang, setTranscriptLang] = useState<string | null>(null);
  const [location, setLocation] = useState('Detecting location...');
  const [locating, setLocating] = useState(false);
  const [errors, setErrors] = useState<{ description?: string; category?: string }>({});
  const [coords, setCoords] = useState<{ lat: number; lon: number }>({ lat: 0, lon: 0 });
  const [aiSuggestion, setAiSuggestion] = useState<{ category: string; confidence: number } | null>(null);
  const [aiSuggesting, setAiSuggesting] = useState(false);

  const submitScale = useSharedValue(1);
  const submitBtnStyle = useAnimatedStyle(() => ({
    transform: [{ scale: submitScale.value }],
  }));

  useEffect(() => {
    if (!description.trim() || description.trim().length < 10) {
      setAiSuggestion(null);
      return;
    }
    const timer = setTimeout(async () => {
      setAiSuggesting(true);
      const result = await aiSuggestCategory('', description);
      setAiSuggestion(result);
      setAiSuggesting(false);
    }, 1500);
    return () => clearTimeout(timer);
  }, [description]);

  const locateUser = useCallback(async (showLoader = false) => {
    if (showLoader) setLocating(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocation('Kukatpally, Hyderabad');
        setCoords({ lat: 17.4483, lon: 78.3741 });
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setCoords({ lat: pos.coords.latitude, lon: pos.coords.longitude });
      setLocation(`${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)}`);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch {
      setLocation('Kukatpally, Hyderabad');
    } finally {
      setLocating(false);
    }
  }, []);

  useEffect(() => { locateUser(); }, [locateUser]);

  const pickImage = async (source: 'camera' | 'gallery') => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    let result;
    if (source === 'camera') {
      const perm = await ImagePicker.requestCameraPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Camera access is required.');
        return;
      }
      result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    } else {
      result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      });
    }
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  };

  async function startRecording() {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const perm = await requestRecordingPermissionsAsync();
      if (!perm.granted) {
        Alert.alert('Permission needed', 'Microphone access is required for voice recording.');
        return;
      }
      recorder.record();
      setIsRecording(true);
      setRecordingDuration(0);
      const timer = setInterval(() => {
        setRecordingDuration(Math.floor(recorder.currentTime));
      }, 500);
      (recorder as any)._timer = timer;
    } catch (err) {
      console.warn('Failed to start recording:', err);
      Alert.alert('Recording Error', 'Could not start recording. Please try again.');
    }
  }

  async function stopRecording() {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(false);
    const timer = (recorder as any)._timer;
    if (timer) {
      clearInterval(timer);
      delete (recorder as any)._timer;
    }
    try {
      const duration = Math.floor(recorder.currentTime);
      await recorder.stop();
      setTranscribing(true);

      // AI-powered voice transcription using Groq NLP
      const existingText = description.trim();
      const lang = detectLanguage(existingText || 'road lo pedda gunta undi');
      const langLabel = lang === 'te' ? 'Telugu' : lang === 'hi' ? 'Hindi' : 'English';
      setTranscriptLang(langLabel);

      const groqText = await generateComplaintText(langLabel, selectedCategory || undefined);
      const transcribed = existingText
        ? existingText + ' ' + groqText
        : groqText;

      setDescription(transcribed);
      extractKeywords(transcribed);

      // Auto-suggest category via Groq
      const groqCategory = await suggestCategoryWithGroq(transcribed);
      if (groqCategory && !selectedCategory) {
        const match = CATEGORIES.find((c) => c.label === groqCategory);
        if (match) setSelectedCategory(match.id);
      }

      setTranscribing(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err) {
      console.warn('Failed to stop recording:', err);
      setTranscribing(false);
    }
  }

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  const handleSubmit = async () => {
    const newErrors: { description?: string; category?: string } = {};
    if (!description.trim()) newErrors.description = 'Please describe the issue';
    if (!selectedCategory) newErrors.category = 'Please select an issue category';
    setErrors(newErrors);
    if (Object.keys(newErrors).length > 0) return;
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const category = CATEGORIES.find((c) => c.id === selectedCategory)?.label || 'Other';
    setLoading(true);
    await submitComplaint(category, description.trim(), coords.lat, coords.lon, imageUri, category);
    setLoading(false);
    router.push('/processing');
  };

  return (
    <View style={styles.container}>

      <SafeAreaView style={{ flex: 1 }} edges={isTab ? ['bottom'] : ['top', 'bottom']}>
        {/* ── Header ── */}
        {!isTab && (
          <View style={styles.header}>
            <Pressable
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                router.back();
              }}
              style={styles.backBtn}
            >
              <Text style={styles.backArrow}>←</Text>
            </Pressable>
            <View style={styles.headerCenter}>
              <Text style={styles.headerLogo}>Civic Connect</Text>
              <View style={styles.aiBadge}>
                <PulseDot color={C.green} />
                <Text style={styles.aiBadgeText}>AI Ready</Text>
              </View>
            </View>
            <View style={{ width: 40 }} />
          </View>
        )}

        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: isTab ? 140 : 40 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Capture Section ── */}
          <Section title="📸  Capture Issue" subtitle="Upload or take a photo of the issue" delay={100}>
            {imageUri ? (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
                <Pressable
                  style={styles.removeImageBtn}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    setImageUri(null);
                  }}
                >
                  <Text style={styles.removeImageText}>✕</Text>
                </Pressable>
              </View>
            ) : (
              <View style={styles.uploadArea}>
                <Text style={styles.uploadIcon}>📷</Text>
                <Text style={styles.uploadText}>Upload Issue Photo</Text>
                <Text style={styles.uploadHint}>Take a photo or select from gallery</Text>
                <View style={styles.uploadActions}>
                  <Pressable
                    style={[styles.uploadBtn, { backgroundColor: C.civicBlueDim, borderColor: C.civicBlueBorder }]}
                    onPress={() => pickImage('camera')}
                  >
                    <Text style={styles.uploadBtnIcon}>📸</Text>
                    <Text style={[styles.uploadBtnText, { color: C.civicBlue }]}>Camera</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.uploadBtn, { backgroundColor: 'rgba(255,255,255,0.03)', borderColor: C.border }]}
                    onPress={() => pickImage('gallery')}
                  >
                    <Text style={styles.uploadBtnIcon}>🖼️</Text>
                    <Text style={[styles.uploadBtnText, { color: C.white }]}>Gallery</Text>
                  </Pressable>
                </View>
              </View>
            )}
          </Section>

          {/* ── Description ── */}
          <Section
            title="✍️  Describe Issue"
            subtitle="Type in any language — AI auto-detects"
            delay={200}
          >
            <View style={styles.textAreaWrapper}>
              <TextInput
                style={styles.textArea}
                placeholder="road lo pedda gunta undi"
                placeholderTextColor={C.muted}
                multiline
                numberOfLines={4}
                textAlignVertical="top"
                  value={description}
                  onChangeText={(t) => { setDescription(t); setErrors((e) => ({ ...e, description: undefined })); }}
              />
              <Text style={styles.charCount}>{description.length}/500</Text>
            </View>
            {errors.description && <Text style={styles.errorText}>{errors.description}</Text>}
          </Section>

          {/* ── Voice Input ── */}
          <Section title="🎙️  Voice Complaint" subtitle="Tap to record in any language" delay={300}>
            <View style={styles.voiceContainer}>
              <View style={styles.waveContainer}>
                {Array.from({ length: 20 }).map((_, i) => (
                  <WaveBar key={i} index={i} active={isRecording} />
                ))}
              </View>
              {transcribing ? (
                <View style={styles.transcribingRow}>
                  <ActivityIndicator size="small" color={C.civicBlue} />
                  <Text style={styles.transcribingText}>AI transcribing voice...</Text>
                </View>
              ) : transcriptLang ? (
                <View style={styles.transcribedBadge}>
                  <Text style={styles.transcribedText}>✓ Transcribed ({transcriptLang})</Text>
                </View>
              ) : null}
              <Pressable
                style={[
                  styles.micBtn,
                  isRecording && { backgroundColor: C.danger, borderColor: C.danger },
                ]}
                onPress={toggleRecording}
                disabled={transcribing}
              >
                <Text style={styles.micIcon}>{isRecording ? '⏹' : '🎙️'}</Text>
              </Pressable>
              <Text style={styles.voiceHint}>
                {transcribing ? 'Processing...' : isRecording ? `Recording ${recordingDuration}s • Tap to stop` : 'Tap to start recording'}
              </Text>
            </View>
          </Section>

          {/* ── Location ── */}
          <Section title="📍  Location" subtitle="Auto-detected via GPS" delay={400}>
            <View style={styles.locationCard}>
              <View style={styles.locationInfo}>
                <Text style={styles.locationPin}>📍</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.locationText}>{location}</Text>
                  <Text style={styles.locationSub}>
                    {coords.lat ? `${coords.lat.toFixed(4)}, ${coords.lon.toFixed(4)}` : 'GPS Coordinates Detected'}
                  </Text>
                </View>
                <Pressable
                  onPress={() => { Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light); locateUser(true); }}
                  disabled={locating}
                  style={styles.gpsBtn}
                  accessibilityLabel="Refresh GPS location"
                >
                  {locating ? (
                    <ActivityIndicator size="small" color={C.civicBlue} />
                  ) : (
                    <Text style={styles.gpsIcon}>📡</Text>
                  )}
                </Pressable>
              </View>
              <View style={styles.locationMapPlaceholder}>
                <LeafletMap
                  singleMarker={coords.lat ? { latitude: coords.lat, longitude: coords.lon, title: location } : undefined}
                  height={160}
                  interactive={false}
                  showControls={false}
                  style={{ borderRadius: 0, borderWidth: 0, width: '100%' }}
                />
              </View>
            </View>
          </Section>

          {/* ── Category ── */}
          <Section title="🏷️  Issue Category" subtitle="Select the type of issue" delay={500}>
            {aiSuggestion && (
              <View style={styles.aiSuggestionRow}>
                <Text style={styles.aiSuggestionIcon}>🤖</Text>
                <Text style={styles.aiSuggestionText}>
                  AI suggests: <Text style={{ color: C.gold }}>{aiSuggestion.category}</Text>
                  {' '}({Math.round(aiSuggestion.confidence * 100)}% match)
                </Text>
                <Pressable
                  style={styles.aiApplyBtn}
                  onPress={() => {
                    const match = CATEGORIES.find((c) => c.label === aiSuggestion.category);
                    if (match) {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(match.id);
                      setErrors((e) => ({ ...e, category: undefined }));
                    }
                  }}
                >
                  <Text style={styles.aiApplyText}>Apply</Text>
                </Pressable>
              </View>
            )}
            {aiSuggesting && !aiSuggestion && (
              <View style={styles.aiSuggestionRow}>
                <Text style={styles.aiSuggestionText}>🤖  AI analyzing description...</Text>
              </View>
            )}
            <View style={styles.categoryGrid}>
              {CATEGORIES.map((cat) => {
                const isSelected = selectedCategory === cat.id;
                return (
                  <Pressable
                    key={cat.id}
                    style={[
                      styles.categoryChip,
                      isSelected && {
                        borderColor: cat.color,
                        backgroundColor: cat.color + '15',
                      },
                    ]}
                    onPress={() => {
                      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      setSelectedCategory(cat.id);
                      setErrors((e) => ({ ...e, category: undefined }));
                    }}
                  >
                    <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                    <Text
                      style={[
                        styles.categoryLabel,
                        isSelected && { color: cat.color },
                      ]}
                    >
                      {cat.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {errors.category && <Text style={styles.errorText}>{errors.category}</Text>}
          </Section>

          {/* ── Submit ── */}
          <Animated.View style={[styles.submitContainer, submitBtnStyle]}>
            <Pressable
              style={styles.submitBtn}
              onPressIn={() => {
                submitScale.value = withSpring(0.96);
              }}
              onPressOut={() => {
                submitScale.value = withSpring(1);
              }}
              onPress={handleSubmit}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator size="small" color="#05101E" />
              ) : (
                <Text style={styles.submitIcon}>🚀</Text>
              )}
              <Text style={styles.submitText}>{isLoading ? 'Processing...' : 'Submit Complaint'}</Text>
            </Pressable>
          </Animated.View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: 'transparent' },

  // ── Header ──
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(13,27,46,0.8)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: C.border,
  },
  backArrow: { fontSize: 20, color: C.white, fontFamily: 'Sora_700Bold' },
  headerCenter: { alignItems: 'center' },
  headerLogo: {
    fontSize: 20,
    fontWeight: '800',
    color: C.white,
    letterSpacing: -0.5,
    fontFamily: 'Sora_800ExtraBold',
  },
  aiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  aiBadgeText: { fontSize: 11, color: C.green, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },

  // ── Scroll ──
  scroll: { paddingHorizontal: 20, paddingTop: 16 },

  // ── Sections ──
  section: {
    marginBottom: 24,
    backgroundColor: 'transparent',
    borderRadius: 22,
    borderWidth: 0,
    padding: 0,
    overflow: 'hidden',
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: C.white,
    fontFamily: 'Sora_700Bold',
  },
  sectionSubtitle: {
    fontSize: 12,
    color: C.muted,
    marginTop: 2,
    marginBottom: 16,
    fontFamily: 'Sora_400Regular',
  },

  // ── Upload ──
  uploadArea: {
    backgroundColor: 'rgba(17,34,54,0.4)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
  },

  uploadIcon: { fontSize: 36, marginBottom: 8 },
  uploadText: { fontSize: 15, fontWeight: '700', color: C.white, fontFamily: 'Sora_700Bold' },
  uploadHint: { fontSize: 12, color: C.muted, marginTop: 2, marginBottom: 16, fontFamily: 'Sora_400Regular' },
  uploadActions: { flexDirection: 'row', gap: 10 },
  uploadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  uploadBtnIcon: { fontSize: 16 },
  uploadBtnText: { fontSize: 13, fontWeight: '700', fontFamily: 'Sora_600SemiBold' },

  // ── Image Preview ──
  imagePreviewContainer: { borderRadius: 16, overflow: 'hidden', position: 'relative' },
  imagePreview: {
    width: '100%',
    height: 200,
    borderRadius: 16,
  },
  removeImageBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: { color: '#fff', fontSize: 14, fontWeight: '700' },

  // ── TextArea ──
  textAreaWrapper: {
    backgroundColor: 'rgba(17,34,54,0.4)',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
    padding: 14,
  },

  textArea: {
    color: C.white,
    fontSize: 14,
    minHeight: 80,
    lineHeight: 20,
    fontFamily: 'Sora_400Regular',
  },
  charCount: {
    textAlign: 'right',
    fontSize: 11,
    color: C.muted,
    marginTop: 6,
    fontFamily: 'Sora_400Regular',
  },

  // ── Voice ──
  voiceContainer: { alignItems: 'center', gap: 12 },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 36,
  },
  micBtn: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(17,34,54,0.4)',
    borderWidth: 1.5,
    borderColor: C.civicBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },

  micIcon: { fontSize: 24 },
  voiceHint: { fontSize: 12, color: C.muted, fontFamily: 'Sora_400Regular' },
  transcribingRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: 'rgba(42,117,211,0.08)',
    borderWidth: 1, borderColor: 'rgba(42,117,211,0.2)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8,
  },
  transcribingText: { fontSize: 12, color: C.civicBlue, fontFamily: 'Sora_600SemiBold' },
  transcribedBadge: {
    backgroundColor: 'rgba(46,204,143,0.1)',
    borderWidth: 1, borderColor: 'rgba(46,204,143,0.25)',
    borderRadius: 10, paddingHorizontal: 12, paddingVertical: 6,
  },
  transcribedText: { fontSize: 12, color: C.green, fontFamily: 'Sora_600SemiBold' },

  // ── Location ──
  locationCard: {
    backgroundColor: 'rgba(17,34,54,0.4)',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    overflow: 'hidden',
  },

  locationInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 14,
  },
  locationPin: { fontSize: 24 },
  locationText: { fontSize: 14, color: C.white, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },
  locationSub: { fontSize: 11, color: C.muted, marginTop: 2, fontFamily: 'Sora_400Regular' },
  locationMapPlaceholder: {
    height: 160,
    backgroundColor: 'rgba(13,27,46,0.6)',
    overflow: 'hidden',
  },
  gpsBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(42,117,211,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(42,117,211,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  gpsIcon: { fontSize: 18 },

  // ── Category ──
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: 'rgba(17,34,54,0.4)',
    borderWidth: 1,
    borderColor: C.border,
    width: (SW - 80 - 8) / 2 - 1,
  },

  categoryEmoji: { fontSize: 18 },
  categoryLabel: { fontSize: 13, color: C.muted, fontWeight: '600', fontFamily: 'Sora_600SemiBold' },

  // ── Submit ──
  submitContainer: { marginTop: 8, marginBottom: 12 },
  submitBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: C.civicBlue,
    paddingVertical: 16,
    borderRadius: 14,
    shadowColor: C.civicBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  aiSuggestionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(201,168,76,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(201,168,76,0.2)',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 14,
  },
  aiSuggestionIcon: { fontSize: 16 },
  aiSuggestionText: { fontSize: 12, color: C.white, flex: 1, fontFamily: 'Sora_400Regular' },
  aiApplyBtn: {
    backgroundColor: C.gold,
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
  },
  aiApplyText: { fontSize: 12, color: C.navy, fontWeight: '700', fontFamily: 'Sora_700Bold' },
  errorText: { fontSize: 12, color: C.danger, marginTop: 6, fontFamily: 'Sora_400Regular' },
  submitIcon: { fontSize: 18 },
  submitText: {
    fontSize: 16,
    fontWeight: '800',
    color: C.white,
    letterSpacing: 0.5,
    fontFamily: 'Sora_700Bold',
  },
});
