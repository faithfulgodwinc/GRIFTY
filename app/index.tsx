import { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet } from 'react-native';
import { Redirect } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { storage } from '@/utils/storage';

export default function Index() {
  const [loading, setLoading] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

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

  if (loading) {
    return (
      <LinearGradient colors={Gradients.hero} style={styles.container}>
        <ActivityIndicator size="large" color={Colors.white} />
      </LinearGradient>
    );
  }

  if (!onboardingComplete) {
    return <Redirect href="/onboarding" />;
  }

  return <Redirect href="/(tabs)" />;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
