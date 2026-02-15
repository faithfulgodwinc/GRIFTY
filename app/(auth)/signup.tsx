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
  ActivityIndicator,
} from 'react-native';
import { Link, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';
import { Typography, Spacing, Shadows, BorderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { useTheme } from '@/contexts/ThemeContext';

export default function SignUpScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { theme } = useTheme();
  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  const [isLoading, setIsLoading] = useState(false);
  const [pendingEmailVerification, setPendingEmailVerification] = useState(false);

  const handleSignUp = async () => {
    if (!email || !password || !confirmPassword) {
      Alert.alert('Missing Information', 'Please fill in all fields');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Password Mismatch', 'Your passwords do not match. Please try again.');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Weak Password', 'Your password must be at least 6 characters long');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      Alert.alert('Invalid Email', 'Please enter a valid email address');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;

      if (data?.session) {
        // Auto signed in (if email confirmation disabled)
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        // Navigate to setup
        router.replace('/blueprint-setup');
      } else if (data?.user) {
        // Email confirmation required OR user already exists but is unconfirmed
        // Supabase returns a user object but no session if confirmation is enabled
        setPendingEmailVerification(true);
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        // Edge case: User might already exist
        Alert.alert('Account Info', 'If an account exists with this email, you will receive a login link.');
      }
    } catch (err: any) {
      console.error('Sign up error:', err);
      // Supabase specific error for existing user
      if (err.message && err.message.includes('User already registered')) {
        Alert.alert('Account Exists', 'This email is already registered. Please sign in instead.');
      } else {
        Alert.alert(
          'Sign Up Failed',
          err.message || 'Unable to create your account. Please try again.'
        );
      }
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    Alert.alert('Coming Soon', 'Please create an account with your email and password instead.');
    return;
    /*
    try {
      setIsLoading(true);
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: makeRedirectUri({
             scheme: 'gritify',
             path: 'auth/callback'
           }),
           skipBrowserRedirect: false,
        },
      });

      if (error) {
        throw error;
      }
      
      // No need to handle success here, the redirect will handle it
    } catch (err: any) {
      console.error('Google sign up error:', err);
      Alert.alert(
        'Google Sign-In Failed',
        'Unable to sign in with Google. Please try again or use email sign-up.'
      );
    } finally {
      setIsLoading(false);
    }
    */
  };

  if (pendingEmailVerification) {
    return (
      <View style={[styles.container, { backgroundColor: Colors.background }]}>
        <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <View style={styles.verificationContainer}>
          <GlassCard style={styles.verificationIcon}>
            <Ionicons name="mail-outline" size={64} color={Colors.electricTeal} />
          </GlassCard>
          <Text style={[Typography.headlineMedium, styles.verificationTitle, { color: Colors.primaryText }]}>Check Your Email</Text>
          <Text style={[Typography.bodyLarge, styles.verificationText, { color: Colors.secondaryText }]}>
            We&apos;ve sent a verification link to your email address. Please click the link to verify
            your account.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={[styles.backButton, { borderColor: Colors.glassBorder, backgroundColor: 'rgba(255,255,255,0.1)' }]}>
              <Text style={[styles.backButtonText, { color: Colors.primaryText }]}>Back to Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </View>
    );
  }

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
            <Text style={[Typography.displayMedium, styles.title, { color: Colors.primaryText }]}>Join Grit!</Text>
            <Text style={[Typography.bodyLarge, styles.subtitle, { color: Colors.secondaryText }]}>Start your financial empowerment journey</Text>
          </View>

          {/* OAuth Buttons */}
          <TouchableOpacity
            style={[styles.oauthButton, { backgroundColor: theme === 'dark' ? Colors.white : Colors.lightGray }]}
            onPress={handleGoogleSignUp}
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
            <Text style={[styles.dividerText, { color: Colors.tertiaryText }]}>or sign up with email</Text>
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

            <GlassCard noPadding style={styles.glassInput}>
              <View style={styles.inputContent}>
                <Ionicons name="lock-closed-outline" size={20} color={Colors.tertiaryText} />
                <TextInput
                  style={[styles.input, { color: Colors.primaryText }]}
                  placeholder="Confirm Password"
                  placeholderTextColor={Colors.tertiaryText}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showPassword}
                  editable={!isLoading}
                />
              </View>
            </GlassCard>

            <TouchableOpacity
              style={[
                styles.signUpButton,
                Shadows.glow(Colors.radiantMagenta),
                isLoading && { opacity: 0.7 }
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.signUpGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                {isLoading ? (
                  <ActivityIndicator color={Colors.white} />
                ) : (
                  <Text style={[styles.signUpButtonText, { color: Colors.white }]}>
                    Create Account
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>

            <Text style={[styles.termsText, { color: Colors.tertiaryText }]}>
              By signing up, you agree to our Terms of Service and Privacy Policy
            </Text>
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: Colors.secondaryText }]}>Already have an account? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={[styles.footerLink, { color: Colors.electricTeal }]}>Sign In</Text>
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
    paddingVertical: 0,
    height: 24,
  },
  signUpButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    marginTop: 8,
    marginBottom: Spacing.md,
  },
  signUpGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  signUpButtonText: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  termsText: {
    ...Typography.bodySmall,
    textAlign: 'center',
    lineHeight: 18,
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
  verificationContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  verificationIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  verificationTitle: {
    marginBottom: Spacing.md,
    textAlign: 'center',
  },
  verificationText: {
    textAlign: 'center',
    marginBottom: Spacing.xxl,
  },
  backButton: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
  },
  backButtonText: {
    ...Typography.titleMedium,
    fontWeight: '600',
  },
});
