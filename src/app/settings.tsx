import React, { useState } from 'react';
import { StyleSheet, View, Text, Pressable, Switch, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as Location from 'expo-location';
import { GlassCard } from '../components/GlassCard';
import { BackButton } from '../components/BackButton';
import { ScreenLayout } from '../components/ScreenLayout';
import { useAppStore } from '../store';
import { colors } from '../theme/colors';

export default function SettingsScreen() {
  const router = useRouter();
  const isLiveMode = useAppStore((s) => s.isLiveMode);
  const setLiveMode = useAppStore((s) => s.setLiveMode);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [gpsEnabled, setGpsEnabled] = useState(true);
  const [gpsPending, setGpsPending] = useState(false);

  return (
    <ScreenLayout>
      <View style={s.header}>
        <BackButton />
        <Text style={s.title}>Settings</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={s.content}>
        <View style={s.section}>
          <Text style={s.sectionTitle}>Preferences</Text>
          <GlassCard
            borderColor="rgba(255,255,255,0.08)"
            glowColor="rgba(201,168,76,0.02)"
            delay={100}
            padding={4}
          >
            <View style={s.row}>
              <Text style={s.label}>Push Notifications</Text>
              <Switch
                value={pushEnabled}
                onValueChange={setPushEnabled}
                trackColor={{ true: colors.gold, false: 'rgba(255,255,255,0.06)' }}
                thumbColor={colors.navy}
                accessibilityLabel="Toggle push notifications"
              />
            </View>
            <View style={s.row}>
              <Text style={[s.label, gpsPending && { opacity: 0.5 }]}>GPS Location Services</Text>
              <Switch
                value={gpsEnabled}
                disabled={gpsPending}
                onValueChange={async (val) => {
                  if (val) {
                    setGpsPending(true);
                    const { status } = await Location.requestForegroundPermissionsAsync();
                    setGpsPending(false);
                    if (status !== 'granted') {
                      Alert.alert('Permission Denied', 'Location permission is required for GPS features.');
                      return;
                    }
                  }
                  setGpsEnabled(val);
                }}
                trackColor={{ true: colors.gold, false: 'rgba(255,255,255,0.06)' }}
                thumbColor={colors.navy}
                accessibilityLabel="Toggle GPS location services"
              />
            </View>
            <View style={[s.row, { borderBottomWidth: 0 }]}>
              <Text style={s.label}>Live Server Mode</Text>
              <Switch
                value={isLiveMode}
                onValueChange={setLiveMode}
                trackColor={{ true: colors.blue, false: 'rgba(255,255,255,0.06)' }}
                thumbColor={colors.navy}
                accessibilityLabel="Toggle live server mode"
              />
            </View>
          </GlassCard>
        </View>

        <View style={s.section}>
          <Text style={s.sectionTitle}>Account</Text>
          <GlassCard
            borderColor="rgba(255,255,255,0.08)"
            glowColor="rgba(201,168,76,0.02)"
            delay={200}
            padding={4}
          >
            <Pressable
              style={s.link}
              accessibilityLabel="Change language"
              accessibilityRole="button"
            >
              <Text style={s.linkLabel}>Change Language</Text>
              <Text style={s.linkArrow}>→</Text>
            </Pressable>
            <Pressable
              style={s.link}
              accessibilityLabel="View privacy policy"
              accessibilityRole="button"
            >
              <Text style={s.linkLabel}>Privacy Policy</Text>
              <Text style={s.linkArrow}>→</Text>
            </Pressable>
            <Pressable
              style={[s.link, { borderBottomWidth: 0 }]}
              accessibilityLabel="View terms of service"
              accessibilityRole="button"
            >
              <Text style={s.linkLabel}>Terms of Service</Text>
              <Text style={s.linkArrow}>→</Text>
            </Pressable>
          </GlassCard>
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
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.text,
    fontFamily: 'Sora_800ExtraBold',
    letterSpacing: -0.5,
  },
  content: { padding: 24 },
  section: { marginBottom: 32 },
  sectionTitle: {
    fontSize: 11,
    color: colors.muted,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
    fontFamily: 'Sora_600SemiBold',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  label: { fontSize: 14, color: colors.text, fontWeight: '500', fontFamily: 'Sora_600SemiBold' },
  link: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: 'transparent',
    padding: 16,
    borderRadius: 0,
    borderWidth: 0,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  linkLabel: { fontSize: 14, color: colors.text, fontWeight: '500', fontFamily: 'Sora_600SemiBold' },
  linkArrow: { fontSize: 18, color: colors.gold, fontFamily: 'Sora_700Bold' },
});
