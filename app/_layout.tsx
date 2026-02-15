import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '@/contexts/AuthContext';
import { cleanupSupabaseListeners } from '@/lib/supabase';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { ThemeProvider } from '@/contexts/ThemeContext';
import { FinancialDataProvider } from '@/contexts/FinancialDataContext';
import { CoachMarksProvider } from '@/contexts/CoachMarksContext';
import { SubscriptionProvider } from '@/contexts/SubscriptionContext';
import { GlobalPaywallWrapper } from '@/components/premium/GlobalPaywallWrapper';

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
      <ThemeProvider>
        <AuthProvider>
          <FinancialDataProvider>
            <CoachMarksProvider>
              <SubscriptionProvider>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="index" />
                  <Stack.Screen name="onboarding" options={{ animation: 'fade' }} />
                  <Stack.Screen name="setup" />
                  <Stack.Screen name="blueprint-setup" options={{ gestureEnabled: false }} />
                  <Stack.Screen name="(auth)" options={{ animation: 'slide_from_bottom' }} />
                  <Stack.Screen name="(tabs)" options={{ animation: 'fade' }} />
                  <Stack.Screen name="auth/callback" />
                  <Stack.Screen
                    name="coach-chat"
                    options={{
                      presentation: 'modal',
                      animation: 'slide_from_bottom',
                      gestureEnabled: true
                    }}
                  />
                </Stack>
                <GlobalPaywallWrapper />
              </SubscriptionProvider>
            </CoachMarksProvider>
          </FinancialDataProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
