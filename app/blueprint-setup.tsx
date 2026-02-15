import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Animated,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { storage } from '@/utils/storage';
import { supabaseSync } from '@/utils/supabase-sync';
import { useAuth } from '@/contexts/AuthContext';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Currency } from '@/types';
import { Typography, Spacing, Shadows, BorderRadius } from '@/constants/Theme';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';

const { width, height } = Dimensions.get('window');

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'NGN', symbol: '₦', name: 'Naira', flag: '🇳🇬' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
];

const DEFAULT_AVATARS = [
  '👩', '👩‍💼', '👩‍🔬', '👩‍🎓', '👩‍💻', '👩‍🏫', '👩‍🌾', '👩‍🍳',
  '👩‍⚕️', '👩‍🎨', '👩‍✈️', '👩‍🚀', '🦸‍♀️', '🧕', '👱‍♀️', '👩‍🦱'
];

export default function BlueprintSetupScreen() {
  const { user, isAuthenticated } = useAuth();
  const { actions: { refreshAll } } = useFinancialData();
  const [currentStep, setCurrentStep] = useState(0);

  // Protect route
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/(auth)/login');
    }
  }, [isAuthenticated]);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👩');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[1]); // Default to GBP
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const progressAnim = useRef(new Animated.Value(0)).current;

  const { theme } = useTheme();
  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  useEffect(() => {
    // Auto-fill name from Google if available
    if (user?.user_metadata?.full_name) {
      setName(user.user_metadata.full_name);
    }

    // Auto-fill avatar from Google if available
    if (user?.user_metadata?.avatar_url) {
      setSelectedAvatar(user.user_metadata.avatar_url);
    }
  }, [user]);

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: (currentStep + 1) / 4,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [currentStep]);

  const handleNext = () => {
    if (currentStep === 0) {
      if (!name.trim()) {
        Alert.alert('Name Required', 'Please enter your name to continue.');
        return;
      }
    } else if (currentStep === 2) {
      const income = parseFloat(monthlyIncome);
      if (!income || income <= 0) {
        Alert.alert('Invalid Income', 'Please enter a valid monthly net earnings amount.');
        return;
      }
    } else if (currentStep === 3) {
      const income = parseFloat(monthlyIncome);
      const goal = parseFloat(savingsGoal);
      if (!goal || goal <= 0) {
        Alert.alert('Invalid Goal', 'Please enter a valid savings goal.');
        return;
      }
      if (goal >= income) {
        Alert.alert('Invalid Goal', 'Your savings goal should be less than your monthly income.');
        return;
      }
      handleComplete();
      return;
    }

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(currentStep + 1);
  };

  const handleBack = () => {
    if (currentStep === 0) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setCurrentStep(currentStep - 1);
  };

  const handleComplete = async () => {
    if (isSubmitting) return;

    try {
      setIsSubmitting(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const income = parseFloat(monthlyIncome);
      const goal = parseFloat(savingsGoal);
      // Calculate daily budget based on actual remaining days in month
      const now = new Date();
      const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
      const daysRemaining = Math.max(1, lastDay - now.getDate() + 1); // Ensure at least 1 day to avoid Infinity
      const dailyBudget = (income - goal) / daysRemaining;

      const userData = {
        name: name.trim(),
        avatarUrl: selectedAvatar,
        currency: selectedCurrency.symbol,
        monthlyIncome: income,
        savingsGoal: goal,
        dailyBudget,
        blueprintComplete: true,
      };

      const financialData = {
        dailyWellnessScore: 100,
        monthlySavings: 0,
        dailySpending: 0,
        savingsGoal: goal,
        dailyBudget,
        streakDays: 0,
        monthlyIncome: income,
        currency: selectedCurrency.symbol,
        totalSavings: 0,
      };

      // Save locally first
      await storage.setUserData(userData);
      await storage.setFinancialData(financialData);
      await storage.setExpenses([]);
      await storage.setStreaks({ lastUpdated: new Date().toISOString(), count: 0 });
      await storage.setBlueprintComplete(true);

      // Attempt to sync to Supabase
      // We await this to ensure data consistency before dashboard load, 
      // but catch errors so we don't block the user if offline/sync fails
      try {
        await Promise.all([
          supabaseSync.syncUserProfile(userData, user?.id),
          supabaseSync.syncFinancialData(financialData, user?.id),
          supabaseSync.initializeMilestones(user?.id),
        ]);
      } catch (syncError) {
        console.warn('Background sync failed, continuing with local data', syncError);
      }

      // Refresh context data immediately (local)
      await refreshAll();

      // Navigate to main app immediately
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete setup:', error);
      Alert.alert('Setup Failed', 'Unable to save your data. Please try again.');
      setIsSubmitting(false); // Only reset on error
    }
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={[styles.progressBar, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]}>
          <Animated.View style={[styles.progressFill, { width: progressWidth, backgroundColor: Colors.electricTeal }]}>
            <LinearGradient
              colors={[Colors.electricTeal, Colors.vibrantPurple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={[styles.progressText, { color: Colors.tertiaryText }]}>Step {currentStep + 1} of 4</Text>
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={[Typography.displayMedium, styles.stepTitle, { color: Colors.primaryText }]}>Welcome to Grit!</Text>
      <Text style={[Typography.bodyLarge, styles.stepSubtitle, { color: Colors.secondaryText }]}>Let&apos;s personalize your experience</Text>

      <GlassCard style={styles.glassInputCard}>
        <Text style={[Typography.labelMedium, styles.label, { color: Colors.tertiaryText }]}>YOUR NICKNAME</Text>
        <TextInput
          style={[styles.premiumInput, { color: Colors.primaryText }]}
          placeholder="Enter your name"
          placeholderTextColor={theme === 'dark' ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.3)"}
          value={name}
          onChangeText={setName}
          autoFocus
        />
        <View style={[styles.inputUnderline, { backgroundColor: Colors.electricTeal, shadowColor: Colors.electricTeal }]} />
      </GlassCard>

      <View style={styles.avatarSection}>
        <Text style={[Typography.labelMedium, styles.label, { marginBottom: 12, color: Colors.tertiaryText }]}>CHOOSE AVATAR</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
          {DEFAULT_AVATARS.map((avatar, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.avatarOption,
                { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                selectedAvatar === avatar && { borderColor: Colors.electricTeal, backgroundColor: 'rgba(16, 185, 129, 0.1)' },
              ]}
              onPress={() => {
                setSelectedAvatar(avatar);
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              }}
            >
              <Text style={styles.avatarEmoji}>{avatar}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={[Typography.displayMedium, styles.stepTitle, { color: Colors.primaryText }]}>Select Currency</Text>
      <Text style={[Typography.bodyLarge, styles.stepSubtitle, { color: Colors.secondaryText }]}>Choose your primary currency</Text>

      <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
        {CURRENCIES.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            onPress={() => {
              setSelectedCurrency(currency);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
            activeOpacity={0.7}
          >
            <GlassCard
              style={[
                styles.currencyCard,
                { borderColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                selectedCurrency.code === currency.code && { borderColor: Colors.electricTeal, backgroundColor: 'rgba(16, 185, 129, 0.05)' },
              ]}
            >
              <View style={styles.currencyLeft}>
                <Text style={styles.currencyFlag}>{currency.flag}</Text>
                <View>
                  <Text style={[Typography.titleMedium, styles.currencyName, { color: Colors.primaryText }]}>{currency.name}</Text>
                  <Text style={[Typography.bodySmall, styles.currencyCode, { color: Colors.tertiaryText }]}>{currency.code}</Text>
                </View>
              </View>
              <Text style={[Typography.headlineMedium, styles.currencySymbol, { color: Colors.electricTeal }]}>{currency.symbol}</Text>
              {selectedCurrency.code === currency.code && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color={Colors.electricTeal} />
                </View>
              )}
            </GlassCard>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={[Typography.displayMedium, styles.stepTitle, { color: Colors.primaryText }]}>Monthly Earnings</Text>
      <Text style={[Typography.bodyLarge, styles.stepSubtitle, { color: Colors.secondaryText }]}>Your take-home pay after taxes</Text>

      <View style={styles.hugeInputContainer}>
        <Text style={[styles.currencyHuge, { color: Colors.electricTeal }]}>{selectedCurrency.symbol}</Text>
        <TextInput
          style={[styles.inputHuge, { color: Colors.primaryText }]}
          placeholder="3000"
          placeholderTextColor={theme === 'dark' ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
          keyboardType="numeric"
          value={monthlyIncome}
          onChangeText={setMonthlyIncome}
          autoFocus
        />
      </View>
      <Text style={[styles.hintText, { color: Colors.tertiaryText }]}>Enter your monthly net income</Text>
    </View>
  );

  const renderStep4 = () => {
    const income = parseFloat(monthlyIncome) || 0;
    const goal = parseFloat(savingsGoal) || 0;
    const dailyBudget = income && goal ? (income - goal) / 30 : 0;
    const recommendedMin = income * 0.15;
    const recommendedMax = income * 0.20;

    return (
      <View style={styles.stepContainer}>
        <Text style={[Typography.displayMedium, styles.stepTitle, { color: Colors.primaryText }]}>Savings Goal</Text>
        <Text style={[Typography.bodyLarge, styles.stepSubtitle, { color: Colors.secondaryText }]}>Target monthly savings</Text>

        <View style={styles.hugeInputContainer}>
          <Text style={[styles.currencyHuge, { color: Colors.electricTeal }]}>{selectedCurrency.symbol}</Text>
          <TextInput
            style={[styles.inputHuge, { color: Colors.primaryText }]}
            placeholder="500"
            placeholderTextColor={theme === 'dark' ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.2)"}
            keyboardType="numeric"
            value={savingsGoal}
            onChangeText={setSavingsGoal}
            autoFocus
          />
        </View>

        {income > 0 && (
          <View style={styles.recommendationContainer}>
            <Text style={[styles.hintText, { color: Colors.tertiaryText }]}>
              Recommended: {selectedCurrency.symbol}{recommendedMin.toFixed(0)} - {selectedCurrency.symbol}{recommendedMax.toFixed(0)}
            </Text>
            <View style={[styles.percentBadge, { borderColor: 'rgba(16, 185, 129, 0.2)', backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
              <Text style={[Typography.labelSmall, { color: Colors.electricTeal }]}>15-20%</Text>
            </View>
          </View>
        )}

        {dailyBudget > 0 && (
          <GlassCard style={styles.summaryCard}>
            <View style={[styles.summaryRow, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.summaryLabel, { color: Colors.secondaryText }]}>Monthly Income</Text>
              <Text style={[styles.summaryValue, { color: Colors.primaryText }]}>{selectedCurrency.symbol}{income.toFixed(0)}</Text>
            </View>
            <View style={[styles.summaryRow, { borderBottomColor: theme === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' }]}>
              <Text style={[styles.summaryLabel, { color: Colors.secondaryText }]}>Savings Goal</Text>
              <Text style={[styles.summaryValue, { color: Colors.primaryText }]}>{selectedCurrency.symbol}{goal.toFixed(0)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowHighlight, { borderTopColor: Colors.electricTeal }]}>
              <Text style={[Typography.titleMedium, { color: Colors.electricTeal }]}>Daily Budget</Text>
              <Text style={[Typography.headlineMedium, { color: Colors.electricTeal }]}>{selectedCurrency.symbol}{dailyBudget.toFixed(2)}</Text>
            </View>
          </GlassCard>
        )}
      </View>
    );
  };

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 0:
        return renderStep1();
      case 1:
        return renderStep2();
      case 2:
        return renderStep3();
      case 3:
        return renderStep4();
      default:
        return null;
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          {currentStep > 0 && (
            <TouchableOpacity style={[styles.backButton, { backgroundColor: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)' }]} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
            </TouchableOpacity>
          )}
          {renderProgressBar()}
        </View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {renderCurrentStep()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.nextButton,
              Shadows.glow(Colors.radiantMagenta),
              isSubmitting && { opacity: 0.7 }
            ]}
            onPress={handleNext}
            activeOpacity={0.8}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              {isSubmitting ? (
                <ActivityIndicator color={Colors.white} />
              ) : (
                <Text style={[styles.nextButtonText, { color: Colors.white }]}>
                  {currentStep === 3 ? "Launch Dashboard 🚀" : 'Continue'}
                </Text>
              )}
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  header: {
    paddingTop: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    ...Typography.labelSmall,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
    paddingTop: Spacing.xl,
  },
  stepTitle: {
    textAlign: 'center',
    marginBottom: Spacing.xs,
  },
  stepSubtitle: {
    textAlign: 'center',
    marginBottom: Spacing.xxl,
    opacity: 0.9,
  },
  glassInputCard: {
    width: '100%',
    padding: Spacing.xl,
    marginBottom: Spacing.xl,
  },
  label: {
    marginBottom: Spacing.sm,
  },
  premiumInput: {
    fontSize: 24,
    fontWeight: '600',
    paddingVertical: Spacing.sm,
  },
  inputUnderline: {
    height: 2,
    marginTop: Spacing.xs,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  avatarSection: {
    width: '100%',
  },
  avatarScroll: {
    marginTop: Spacing.sm,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarEmoji: {
    fontSize: 32,
  },
  currencyList: {
    width: '100%',
  },
  currencyCard: {
    flexDirection: 'row',
    height: 70,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  currencyFlag: {
    fontSize: 24,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
  },
  currencyCode: {
    fontSize: 12,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: '700',
  },
  selectedBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  hugeInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  currencyHuge: {
    fontSize: 48,
    fontWeight: 'bold',
    marginRight: Spacing.sm,
  },
  inputHuge: {
    fontSize: 64,
    fontWeight: 'bold',
    minWidth: 100,
  },
  hintText: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  recommendationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.lg,
  },
  percentBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
  },
  summaryCard: {
    width: '100%',
    padding: Spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
  },
  summaryRowHighlight: {
    borderBottomWidth: 0,
    marginTop: Spacing.sm,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  summaryLabel: {
    ...Typography.bodyMedium,
  },
  summaryValue: {
    ...Typography.titleMedium,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    paddingBottom: Platform.OS === 'ios' ? Spacing.xl : Spacing.lg,
  },
  nextButton: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  nextButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  nextButtonText: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
});
