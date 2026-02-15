import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { supabase } from '@/lib/supabase';

import * as Linking from 'expo-linking';

export default function Callback() {
  const router = useRouter();

  useEffect(() => {
    // Handle the OAuth callback or password reset flow
    const handleCallback = async () => {
      try {
        // 1. Check for existing session first
        const { data: { session: existingSession } } = await supabase.auth.getSession();

        if (existingSession) {
          await navigateBasedOnSession();
          return;
        }

        // 2. Parse URL for session tokens (Implicit Flow)
        const url = await Linking.getInitialURL();
        if (url) {
          // Extract hash fragment handling both # and ?
          const fragment = url.split('#')[1] || url.split('?')[1];

          if (fragment) {
            const params = new URLSearchParams(fragment);
            const accessToken = params.get('access_token');
            const refreshToken = params.get('refresh_token');

            if (accessToken && refreshToken) {
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

              if (!error && data.session) {
                await navigateBasedOnSession();
                return;
              }
            }
          }
        }

        // 3. Fallback: Wait for auto-refresh or listener
        // The session is usually handled automatically by supabase.auth.startAutoRefresh
        // or handled when the URL is processed by the Supabase client.

        // Give it a moment to process
        const { data: { session }, error } = await supabase.auth.getSession();

        if (session) {
          await navigateBasedOnSession();
        } else if (error) {
          // Only redirect to login with error if we actually have an error AND no session
          // If it's just "no session found yet", we might want to wait or just go to login silently
          router.replace(`/(auth)/login?error=${encodeURIComponent(error.message)}`);
        } else {
          // Fallback if no session found immediately
          setTimeout(() => {
            router.replace('/(auth)/login');
          }, 3000);
        }
      } catch (e) {
        console.error("Callback error:", e);
        router.replace('/(auth)/login');
      }
    };

    const navigateBasedOnSession = async () => {
      // Check if user has completed blueprint setup
      const { storage } = await import('@/utils/storage');
      const blueprintComplete = await storage.getBlueprintComplete();

      if (blueprintComplete) {
        router.replace('/(tabs)');
      } else {
        router.replace('/blueprint-setup');
      }
    };

    handleCallback();
  }, [router]);

  return (
    <LinearGradient colors={Gradients.hero} style={styles.container}>
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.white} />
        <Text style={styles.text}>Completing sign in...</Text>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loading: {
    padding: 20,
  },
});
