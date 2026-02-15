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
import { Link } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { supabase } from '@/lib/supabase';
import * as Haptics from 'expo-haptics';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pendingPasswordReset, setPendingPasswordReset] = useState(false);

  const handleReset = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    try {
      setIsLoading(true);
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: 'https://gritify.fastshot.ai/auth/callback', // Updated to generic or custom scheme if needed
      });

      if (error) throw error;

      setPendingPasswordReset(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      console.error('Reset password error:', err);
      Alert.alert('Error', err.message || 'Failed to send reset email.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsLoading(false);
    }
  };

  if (pendingPasswordReset) {
    return (
      <LinearGradient colors={Gradients.hero} style={styles.container}>
        <View style={styles.successContainer}>
          <View style={styles.successIcon}>
            <Ionicons name="checkmark-circle" size={64} color={Colors.glowingGreen} />
          </View>
          <Text style={styles.successTitle}>Check Your Email</Text>
          <Text style={styles.successText}>
            We&apos;ve sent password reset instructions to your email address. Please check your inbox
            and follow the link to reset your password.
          </Text>
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backButton}>
              <Text style={styles.backButtonText}>Back to Sign In</Text>
            </TouchableOpacity>
          </Link>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Gradients.hero} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Back Button */}
          <Link href="/(auth)/login" asChild>
            <TouchableOpacity style={styles.backLink}>
              <Ionicons name="arrow-back" size={24} color={Colors.white} />
            </TouchableOpacity>
          </Link>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Forgot Password?</Text>
            <Text style={styles.subtitle}>
              Enter your email address and we&apos;ll send you instructions to reset your password.
            </Text>
          </View>

          {/* Email Form */}
          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Ionicons name="mail-outline" size={20} color={Colors.mediumGray} />
              <TextInput
                style={styles.input}
                placeholder="Email"
                placeholderTextColor={Colors.mediumGray}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                editable={!isLoading}
              />
            </View>

            <TouchableOpacity
              style={styles.resetButton}
              onPress={handleReset}
              disabled={isLoading}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.vibrantPurple]}
                style={styles.resetGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.resetButtonText}>
                  {isLoading ? 'Sending...' : 'Send Reset Link'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Sign In Link */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Remember your password? </Text>
            <Link href="/(auth)/login" asChild>
              <TouchableOpacity>
                <Text style={styles.footerLink}>Sign In</Text>
              </TouchableOpacity>
            </Link>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </LinearGradient>
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
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  backLink: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  header: {
    marginBottom: 40,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    lineHeight: 24,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 4,
    marginBottom: 24,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: Colors.primaryText,
    paddingVertical: 12,
  },
  resetButton: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  resetGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.8,
  },
  footerLink: {
    fontSize: 14,
    color: Colors.white,
    fontWeight: 'bold',
  },
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  successIcon: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 16,
    textAlign: 'center',
  },
  successText: {
    fontSize: 16,
    color: Colors.white,
    opacity: 0.9,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  backButton: {
    backgroundColor: Colors.white,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 16,
  },
  backButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.electricTeal,
  },
});
