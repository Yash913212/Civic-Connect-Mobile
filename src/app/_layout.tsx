import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View, ActivityIndicator } from 'react-native';
import {
  useFonts,
  Sora_400Regular,
  Sora_600SemiBold,
  Sora_700Bold,
  Sora_800ExtraBold,
} from '@expo-google-fonts/sora';
import LaunchScreen from '../components/LaunchScreen';
import { useAppStore } from '../store';
import { SmartCityBackground } from '../components/SmartCityBackground';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function RootLayout() {
  const hasSeenLaunch = useAppStore((s) => s.hasSeenLaunch);
  const user = useAppStore((s) => s.user);
  const [fontsLoaded] = useFonts({
    Sora_400Regular,
    Sora_600SemiBold,
    Sora_700Bold,
    Sora_800ExtraBold,
  });

  const mode = user?.role?.toLowerCase() === 'admin' ? 'admin' : user?.role?.toLowerCase() === 'officer' ? 'officer' : 'home';

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, backgroundColor: '#05101E', alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color="#C9A84C" />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <StatusBar style="light" />
      <SmartCityBackground theme="dark" mode={mode as any} />
      {!hasSeenLaunch && <LaunchScreen />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
        }}
      >
        <Stack.Screen name="index" options={{ animation: 'fade' }} />
        <Stack.Screen name="login" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="signup" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="forgot-password" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="edit-profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="language-select" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="report" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="processing" options={{ animation: 'fade' }} />
        <Stack.Screen name="result" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="dashboard" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="history" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="complaint-detail" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="notifications" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="profile" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="settings" options={{ animation: 'slide_from_right' }} />
        <Stack.Screen name="admin" options={{ animation: 'slide_from_bottom' }} />
        <Stack.Screen name="heatmap" options={{ animation: 'fade' }} />
        <Stack.Screen name="chat" options={{ animation: 'slide_from_right' }} />
      </Stack>
    </ErrorBoundary>
  );
}
