import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import LaunchScreen from '../components/LaunchScreen';
import { useAppStore } from '../store';
import { SmartCityBackground } from '../components/SmartCityBackground';

export default function RootLayout() {
  const hasSeenLaunch = useAppStore((s) => s.hasSeenLaunch);
  const user = useAppStore((s) => s.user);
  
  const mode = user?.role?.toLowerCase() === 'admin' ? 'admin' : user?.role?.toLowerCase() === 'officer' ? 'officer' : 'home';

  return (
    <>
      <StatusBar style="light" />
      <SmartCityBackground theme="dark" mode={mode as any} />
      {!hasSeenLaunch && <LaunchScreen />}
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: 'transparent' },
          animation: 'fade',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="login" />
        <Stack.Screen name="signup" />
        <Stack.Screen name="report" />
        <Stack.Screen name="processing" />
        <Stack.Screen name="result" />
        <Stack.Screen name="dashboard" />
        <Stack.Screen name="history" />
        <Stack.Screen name="complaint-detail" />
        <Stack.Screen name="notifications" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="settings" />
        <Stack.Screen name="admin" />
        <Stack.Screen name="heatmap" />
        <Stack.Screen name="chat" />
      </Stack>
    </>
  );
}
