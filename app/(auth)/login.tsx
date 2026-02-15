import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Typography, Spacing, Shadows, BorderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/contexts/ThemeContext';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Handle incoming errors from redirects (e.g. Google Auth failure)
  const params = useLocalSearchParams();

  React.useEffect(() => {
    if (params.error) {
      const errorMessage = typeof params.error === 'string' ? params.error : 'Authentication failed';
      Alert.alert(
        'Sign In Failed',
        `${errorMessage}. Please try again or use email sign in.`
      );
      // Optional: clear the error after showing it to prevent loop if they refresh? 
      // Expo router doesn't strictly persist params on refresh usually, but good to be safe.
      // For now, just showing the alert is sufficient "graceful" handling.
    }
  }, [params.error]);

  const handleEmailLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing Information', 'Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.replace('/(tabs)');
    } catch (err: any) {
      console.error('Email login error:', err);
      setError(err);
      Alert.alert(
        'Login Failed',
        err.message || 'Unable to sign in. Please check your credentials and try again.'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    Alert.alert('Coming Soon', 'Please sign in with your email and password instead.');
    return;
    /*
    try {
      setIsLoading(true);
      setError(null);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: 'grit://auth/callback',
        },
      });

      if (error) throw error;
    } catch (err: any) {
      console.error('Google login error:', err);
      setError(err);
      Alert.alert(
        'Google Sign-In Failed',
        'Unable to sign in with Google. Please try again or use email sign-in.'
      );
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
    */
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <Text style={[Typography.displayMedium, styles.title, { color: Colors.primaryText }]}>Welcome Back!</Text>
            <Text style={[Typography.bodyLarge, styles.subtitle, { color: Colors.secondaryText }]}>Sign in to continue your journey</Text>
          </View>

          {/* OAuth Buttons */}
          <TouchableOpacity
            style={[styles.oauthButton, { backgroundColor: theme === 'dark' ? Colors.white : Colors.lightGray }]}
            onPress={handleGoogleLogin}
            disabled={isLoading}
            activeOpacity={0.8}
          >
            <View style={styles.oauthButtonInner}>
              <Ionicons name="logo-google" size={24} color={Colors.richBlack} />
              <Text style={[styles.oauthButtonText, { color: Colors.richBlack }]}>Continue with Google</Text>
            </View>
          </TouchableOpacity>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: Colors.glassBorder }]} />
            <Text style={[styles.dividerText, { color: Colors.tertiaryText }]}>or continue with email</Text>
            <View style={[styles.dividerLine, { backgroundColor: Colors.glassBorder }]} />
          </View>

          {/* Email Form */}
          <View style={styles.form}>
            <GlassCard noPadding style={styles.glassInput}>
              <View style={styles.inputContent}>
                <Ionicons name="mail-outline" size={20} color={Colors.tertiaryText} />
                <TextInput
                  style={[styles.input, { color: Colors.primaryText }]}
                  placeholder="Email"
                  placeholderTextColor={Colors.tertiaryText}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  editable={!isLoading}
                />
              </View>
            </GlassCard>

            <GlassCard noPadding style={styles.glassInput}>
              <View style={styles.inputContent}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.tertiaryText} />
                <TextInput
                  style={[styles.input, { color: Colors.primaryText }]}
                  placeholder="Password"
                  placeholderTextColor={Colors.tertiaryText}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={20}
                    color={Colors.tertiaryText}
                  />
                </TouchableOpacity>
              </View>
            </GlassCard>

            <Link href="/(auth)/forgot-password" asChild>
              <TouchableOpacity style={styles.forgotPassword}>
                <Text style={[styles.forgotPasswordText, { color: Colors.electricTeal }]}>Forgot Password?</Text>
              </TouchableOpacity>
            </Link>

            {error && (
              <GlassCard style={[styles.errorContainer, { borderColor: 'rgba(244, 63, 94, 0.2)', backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                <Ionicons name="alert-circle" size={20} color={Colors.radiantMagenta} />
                <Text style={[styles.errorText, { color: Colors.radiantMagenta }]}>{error.message}</Text>
              </GlassCard>
            )}

            <TouchableOpacity
              style={[styles.signInButton, Shadows.glow(Colors.radiantMagenta)]}
              onPress={handleEmailLogin}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.signInGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[styles.signInButtonText, { color: Colors.white }]}>
                  {isLoading ? 'Signing In...' : 'Sign In'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign Up Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: Colors.secondaryText }]}>Don&apos;t have an account? </Text>
            <Link href="/(auth)/signup" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: Colors.electricTeal }]}>Sign Up</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.xxl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    opacity: 0.9,
  },
  oauthButton: {
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.xl,
    ...Shadows.medium,
  },
  oauthButtonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 12,
  },
  oauthButtonText: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  dividerLine: {
    flex: 1,
    height: 1,
  },
  dividerText: {
    paddingHorizontal: 16,
    ...Typography.labelMedium,
  },
  form: {
    marginBottom: Spacing.xl,
  },
  glassInput: {
    width: '100%',
    marginBottom: Spacing.md,
  },
  inputContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    ...Typography.bodyLarge,
    paddingVertical: 0, // Remove vertical padding to let container handle height
    height: 24, // Explicit height for text
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: Spacing.xl,
  },
  forgotPasswordText: {
    ...Typography.labelMedium,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    padding: 12,
    marginBottom: Spacing.md,
    gap: 8,
  },
  errorText: {
    flex: 1,
    ...Typography.bodyMedium,
  },
  signInButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  signInGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signInButtonText: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    ...Typography.bodyMedium,
  },
  footerLink: {
    ...Typography.titleMedium,
    fontWeight: 'bold',
  },
});
