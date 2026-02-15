import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { storage } from '@/utils/storage';
import { useAuth } from '@/contexts/AuthContext';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [blueprintComplete, setBlueprintComplete] = useState(false);
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  useEffect(() => {
    if (!authLoading) {
      checkStatus();
    }
  }, [authLoading]);

  const checkStatus = async () => {
    try {
      const onboarding = await storage.getOnboardingComplete();
      const blueprint = await storage.getBlueprintComplete();
      setOnboardingComplete(onboarding);
      setBlueprintComplete(blueprint);
    } catch (error) {
      console.error('Error checking status:', error);
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

  // If not authenticated, always go to onboarding (Landing Page)
  if (!isAuthenticated) {
    return <Redirect href="/onboarding" />;
  }

  // If authenticated but blueprint not complete, go to blueprint setup
  if (!blueprintComplete) {
    return <Redirect href="/blueprint-setup" />;
  }

  // If authenticated and blueprint complete, go to tabs
  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
