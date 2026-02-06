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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Gradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { storage } from '@/utils/storage';
import { supabaseSync } from '@/utils/supabase-sync';
import { useAuth } from '@fastshot/auth';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { Currency } from '@/types';

const { width, height } = Dimensions.get('window');

const CURRENCIES: Currency[] = [
  { code: 'USD', symbol: '$', name: 'US Dollar', flag: '🇺🇸' },
  { code: 'GBP', symbol: '£', name: 'British Pound', flag: '🇬🇧' },
  { code: 'EUR', symbol: '€', name: 'Euro', flag: '🇪🇺' },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', flag: '🇨🇦' },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', flag: '🇦🇺' },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', flag: '🇮🇳' },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', flag: '🇯🇵' },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', flag: '🇨🇳' },
];

const DEFAULT_AVATARS = [
  '👩', '👩‍💼', '👩‍🔬', '👩‍🎓', '👩‍💻', '👩‍🏫', '👩‍🌾', '👩‍🍳',
  '👩‍⚕️', '👩‍🎨', '👩‍✈️', '👩‍🚀', '🦸‍♀️', '🧕', '👱‍♀️', '👩‍🦱'
];

export default function BlueprintSetupScreen() {
  const { user } = useAuth();
  const [currentStep, setCurrentStep] = useState(0);
  const [name, setName] = useState('');
  const [selectedAvatar, setSelectedAvatar] = useState('👩');
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>(CURRENCIES[1]); // Default to GBP
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');

  const progressAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

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
    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const income = parseFloat(monthlyIncome);
      const goal = parseFloat(savingsGoal);
      const dailyBudget = (income - goal) / 30;

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
      };

      // Save locally
      await storage.setUserData(userData);
      await storage.setFinancialData(financialData);
      await storage.setExpenses([]);
      await storage.setStreaks({ lastUpdated: new Date().toISOString(), count: 0 });
      await storage.setBlueprintComplete(true);

      // Sync to Supabase (non-blocking)
      supabaseSync.syncUserProfile(userData).catch(console.error);
      supabaseSync.syncFinancialData(financialData).catch(console.error);
      supabaseSync.initializeMilestones().catch(console.error);

      // Navigate to main app
      router.replace('/(tabs)');
    } catch (error) {
      console.error('Failed to complete setup:', error);
      Alert.alert('Setup Failed', 'Unable to save your data. Please try again.');
    }
  };

  const renderProgressBar = () => {
    const progressWidth = progressAnim.interpolate({
      inputRange: [0, 1],
      outputRange: ['0%', '100%'],
    });

    return (
      <View style={styles.progressContainer}>
        <View style={styles.progressBar}>
          <Animated.View style={[styles.progressFill, { width: progressWidth }]}>
            <LinearGradient
              colors={[Colors.electricTeal, Colors.vibrantPurple]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={StyleSheet.absoluteFill}
            />
          </Animated.View>
        </View>
        <Text style={styles.progressText}>Step {currentStep + 1} of 4</Text>
      </View>
    );
  };

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>👋</Text>
      <Text style={styles.stepTitle}>Welcome to Grit!</Text>
      <Text style={styles.stepSubtitle}>Let&apos;s personalize your experience</Text>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Your Name</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter your name"
          placeholderTextColor={Colors.mediumGray}
          value={name}
          onChangeText={setName}
          autoFocus
        />
      </GlassCard>

      <GlassCard style={styles.card}>
        <Text style={styles.label}>Choose Your Avatar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.avatarScroll}>
          {DEFAULT_AVATARS.map((avatar, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.avatarOption,
                selectedAvatar === avatar && styles.avatarOptionSelected,
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
      </GlassCard>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>💰</Text>
      <Text style={styles.stepTitle}>Select Your Currency</Text>
      <Text style={styles.stepSubtitle}>Choose your primary currency</Text>

      <ScrollView style={styles.currencyList} showsVerticalScrollIndicator={false}>
        {CURRENCIES.map((currency) => (
          <TouchableOpacity
            key={currency.code}
            style={[
              styles.currencyCard,
              selectedCurrency.code === currency.code && styles.currencyCardSelected,
            ]}
            onPress={() => {
              setSelectedCurrency(currency);
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            }}
          >
            <View style={styles.currencyLeft}>
              <Text style={styles.currencyFlag}>{currency.flag}</Text>
              <View>
                <Text style={styles.currencyName}>{currency.name}</Text>
                <Text style={styles.currencyCode}>{currency.code}</Text>
              </View>
            </View>
            <Text style={styles.currencySymbol}>{currency.symbol}</Text>
            {selectedCurrency.code === currency.code && (
              <View style={styles.selectedBadge}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.electricTeal} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepEmoji}>📊</Text>
      <Text style={styles.stepTitle}>Monthly Net Earnings</Text>
      <Text style={styles.stepSubtitle}>Your take-home pay after taxes</Text>

      <GlassCard style={styles.inputCard}>
        <View style={styles.largeInputWrapper}>
          <Text style={styles.currencyLarge}>{selectedCurrency.symbol}</Text>
          <TextInput
            style={styles.largeInput}
            placeholder="3000"
            placeholderTextColor={Colors.mediumGray}
            keyboardType="numeric"
            value={monthlyIncome}
            onChangeText={setMonthlyIncome}
            autoFocus
          />
        </View>
        <Text style={styles.hint}>Enter your monthly take-home income</Text>
      </GlassCard>
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
        <Text style={styles.stepEmoji}>🎯</Text>
        <Text style={styles.stepTitle}>Savings Goal</Text>
        <Text style={styles.stepSubtitle}>How much do you want to save monthly?</Text>

        <GlassCard style={styles.inputCard}>
          <View style={styles.largeInputWrapper}>
            <Text style={styles.currencyLarge}>{selectedCurrency.symbol}</Text>
            <TextInput
              style={styles.largeInput}
              placeholder="500"
              placeholderTextColor={Colors.mediumGray}
              keyboardType="numeric"
              value={savingsGoal}
              onChangeText={setSavingsGoal}
              autoFocus
            />
          </View>
          {income > 0 && (
            <Text style={styles.hint}>
              Recommended: {selectedCurrency.symbol}{recommendedMin.toFixed(0)} - {selectedCurrency.symbol}{recommendedMax.toFixed(0)} (15-20%)
            </Text>
          )}
        </GlassCard>

        {dailyBudget > 0 && (
          <GlassCard style={styles.summaryCard}>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Monthly Income</Text>
              <Text style={styles.summaryValue}>{selectedCurrency.symbol}{income.toFixed(2)}</Text>
            </View>
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Savings Goal</Text>
              <Text style={styles.summaryValue}>{selectedCurrency.symbol}{goal.toFixed(2)}</Text>
            </View>
            <View style={[styles.summaryRow, styles.summaryRowHighlight]}>
              <Text style={styles.summaryLabelHighlight}>Daily Budget</Text>
              <Text style={styles.summaryValueHighlight}>{selectedCurrency.symbol}{dailyBudget.toFixed(2)}</Text>
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
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          {currentStep > 0 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
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
            style={styles.nextButton}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.radiantMagenta, Colors.neonPink]}
              style={styles.nextButtonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {currentStep === 3 ? "Let&apos;s Go! 🚀" : 'Continue'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 6,
    backgroundColor: Colors.lightGray,
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
  },
  progressText: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '600',
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  stepContainer: {
    flex: 1,
    alignItems: 'center',
  },
  stepEmoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  stepTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 30,
    fontWeight: '500',
  },
  card: {
    width: '100%',
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 12,
  },
  input: {
    fontSize: 18,
    color: Colors.primaryText,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.white,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  avatarScroll: {
    marginTop: 12,
  },
  avatarOption: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  avatarOptionSelected: {
    borderColor: Colors.electricTeal,
    backgroundColor: Colors.white,
  },
  avatarEmoji: {
    fontSize: 36,
  },
  currencyList: {
    width: '100%',
  },
  currencyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: Colors.white,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currencyCardSelected: {
    borderColor: Colors.electricTeal,
  },
  currencyLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  currencyFlag: {
    fontSize: 32,
  },
  currencyName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  currencyCode: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginTop: 2,
  },
  currencySymbol: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.electricTeal,
  },
  selectedBadge: {
    position: 'absolute',
    top: 12,
    right: 12,
  },
  inputCard: {
    width: '100%',
  },
  largeInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 20,
    marginBottom: 12,
  },
  currencyLarge: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.electricTeal,
    marginRight: 8,
  },
  largeInput: {
    flex: 1,
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryText,
    paddingVertical: 20,
  },
  hint: {
    fontSize: 14,
    color: Colors.tertiaryText,
    textAlign: 'center',
    fontWeight: '500',
  },
  summaryCard: {
    width: '100%',
    marginTop: 20,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  summaryRowHighlight: {
    borderBottomWidth: 0,
    marginTop: 8,
    paddingTop: 16,
    borderTopWidth: 2,
    borderTopColor: Colors.electricTeal,
  },
  summaryLabel: {
    fontSize: 16,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: 16,
    color: Colors.primaryText,
    fontWeight: '600',
  },
  summaryLabelHighlight: {
    fontSize: 18,
    color: Colors.primaryText,
    fontWeight: '700',
  },
  summaryValueHighlight: {
    fontSize: 24,
    color: Colors.electricTeal,
    fontWeight: 'bold',
  },
  footer: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  nextButton: {
    borderRadius: 30,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.radiantMagenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  nextButtonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  nextButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
