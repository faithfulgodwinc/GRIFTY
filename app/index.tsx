import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { storage } from '@/utils/storage';
import { useAuth } from '@fastshot/auth';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      checkOnboardingStatus();
    }
  }, [authLoading]);

  const checkOnboardingStatus = async () => {
    try {
      const complete = await storage.getOnboardingComplete();
      setOnboardingComplete(complete);
    } catch (error) {
      console.error('Error checking onboarding status:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading || authLoading) {
    return (
      <LinearGradient colors={Gradients.hero} style={styles.container}>
        <ActivityIndicator size="large" color={Colors.white} />
      </LinearGradient>
    );
  }

  // If not authenticated, go to onboarding then auth
  if (!isAuthenticated) {
    if (!onboardingComplete) {
      return <Redirect href="/onboarding" />;
    }
    return <Redirect href="/(auth)/login" />;
  }

  // If authenticated, go directly to tabs
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
