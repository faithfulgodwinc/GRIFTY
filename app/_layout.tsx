import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@fastshot/auth';
import { supabase, cleanupSupabaseListeners } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { Platform } from 'react-native';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync().catch((error) => {
  console.warn('Failed to prevent splash screen auto-hide:', error);
});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  useEffect(() => {
    if (fontsLoaded || fontError) {
      // Hide splash screen when fonts are loaded or if there's an error
      SplashScreen.hideAsync().catch((error) => {
        console.warn('Failed to hide splash screen:', error);
      });
    }
  }, [fontsLoaded, fontError]);

  // Cleanup listeners on unmount
  useEffect(() => {
    return () => {
      cleanupSupabaseListeners();
    };
  }, []);

  // Show nothing while fonts are loading (splash screen is visible)
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <AuthProvider
        supabaseClient={supabase}
        routes={{
          login: '/(auth)/login',
          afterLogin: '/(tabs)',
        }}
      >
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="index" />
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="setup" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="auth/callback" />
        </Stack>
      </AuthProvider>
    </ErrorBoundary>
  );
}
