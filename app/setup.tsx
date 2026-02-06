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
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Colors, Gradients } from '@/constants/Colors';
import { storage } from '@/utils/storage';
import * as Haptics from 'expo-haptics';

export default function SetupScreen() {
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [savingsGoal, setSavingsGoal] = useState('');

  const handleComplete = async () => {
    const income = parseFloat(monthlyIncome);
    const goal = parseFloat(savingsGoal);

    if (!income || income <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid monthly income.');
      return;
    }

    if (!goal || goal <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid savings goal.');
      return;
    }

    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    const dailyBudget = (income - goal) / 30;

    await storage.setUserData({
      monthlyIncome: income,
      savingsGoal: goal,
      dailyBudget,
      onboardingComplete: true,
    });

    await storage.setFinancialData({
      dailyWellnessScore: 100,
      monthlySavings: 0,
      dailySpending: 0,
      savingsGoal: goal,
      dailyBudget,
      streakDays: 0,
    });

    router.replace('/(tabs)');
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.emoji}>🎯</Text>
            <Text style={styles.title}>Let&apos;s Set Your{'\n'}Financial Goals</Text>
            <Text style={styles.subtitle}>
              We&apos;ll create a personalized plan that fits your lifestyle
            </Text>
          </View>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <Text style={styles.label}>Monthly Income</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currency}>£</Text>
                <TextInput
                  style={styles.input}
                  placeholder="3000"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  value={monthlyIncome}
                  onChangeText={setMonthlyIncome}
                />
              </View>
            </View>

            <View style={styles.inputContainer}>
              <Text style={styles.label}>Monthly Savings Goal</Text>
              <View style={styles.inputWrapper}>
                <Text style={styles.currency}>£</Text>
                <TextInput
                  style={styles.input}
                  placeholder="500"
                  placeholderTextColor={Colors.mediumGray}
                  keyboardType="numeric"
                  value={savingsGoal}
                  onChangeText={setSavingsGoal}
                />
              </View>
              <Text style={styles.hint}>
                Recommended: 15-20% of your income
              </Text>
            </View>

            {monthlyIncome && savingsGoal && (
              <View style={styles.preview}>
                <Text style={styles.previewLabel}>Daily Budget</Text>
                <Text style={styles.previewValue}>
                  £{((parseFloat(monthlyIncome) - parseFloat(savingsGoal)) / 30).toFixed(2)}
                </Text>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={styles.button}
            onPress={handleComplete}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={[Colors.radiantMagenta, Colors.neonPink]}
              style={styles.buttonGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.buttonText}>Complete Setup</Text>
            </LinearGradient>
          </TouchableOpacity>
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
    paddingHorizontal: 20,
    paddingTop: 80,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  emoji: {
    fontSize: 80,
    marginBottom: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.primaryText,
    textAlign: 'center',
    lineHeight: 40,
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    lineHeight: 24,
    fontWeight: '500',
  },
  form: {
    flex: 1,
  },
  inputContainer: {
    marginBottom: 30,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 12,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  currency: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.electricTeal,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    paddingVertical: 16,
  },
  hint: {
    fontSize: 14,
    color: Colors.tertiaryText,
    marginTop: 8,
    fontWeight: '500',
  },
  preview: {
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.electricTeal,
    padding: 20,
    alignItems: 'center',
    marginTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  previewLabel: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 8,
    fontWeight: '600',
  },
  previewValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: Colors.electricTeal,
  },
  button: {
    borderRadius: 30,
    overflow: 'hidden',
    marginTop: 20,
    elevation: 8,
    shadowColor: Colors.radiantMagenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  buttonGradient: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
