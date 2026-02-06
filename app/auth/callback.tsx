import { AuthCallbackPage } from '@fastshot/auth';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';

export default function Callback() {
  const router = useRouter();

  return (
    <LinearGradient colors={Gradients.hero} style={styles.container}>
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.white} />
      </View>
      <AuthCallbackPage
        supabaseClient={supabase}
        onSuccess={() => router.replace('/(tabs)')}
        onError={(error) =>
          router.replace(`/(auth)/login?error=${encodeURIComponent(error.message)}`)
        }
        loadingText="Completing sign in..."
      />
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
