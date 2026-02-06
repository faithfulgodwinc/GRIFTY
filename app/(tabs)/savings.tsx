import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storage } from '@/utils/storage';
import { supabaseSync } from '@/utils/supabase-sync';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

interface SavingsWin {
  id: string;
  date: string;
  amount: number;
  description: string;
}

export default function SavingsScreen() {
  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDescription, setSavingsDescription] = useState('');
  const [totalSavings, setTotalSavings] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [savingsWins, setSavingsWins] = useState<SavingsWin[]>([]);
  const [currency, setCurrency] = useState('£');
  const [isLoading, setIsLoading] = useState(true);
  const { theme } = useTheme();

  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      const [financialData, userData] = await Promise.all([
        storage.getFinancialData(),
        storage.getUserData(),
      ]);

      if (financialData) {
        setTotalSavings(financialData.monthlySavings || 0);
        setSavingsGoal(financialData.savingsGoal || 0);
        setCurrency(financialData.currency || '£');
      }

      if (userData) {
        setCurrency(userData.currency || '£');
      }

      // Load savings wins from storage (for now, mock data)
      const mockWins: SavingsWin[] = [
        {
          id: '1',
          date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 50,
          description: 'Weekly meal prep savings',
        },
        {
          id: '2',
          date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 120,
          description: 'Cancelled unused subscriptions',
        },
        {
          id: '3',
          date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
          amount: 75,
          description: 'Bulk shopping discounts',
        },
      ];
      setSavingsWins(mockWins);
    } catch (error) {
      console.error('Failed to load savings data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddSavings = async () => {
    if (!savingsAmount || parseFloat(savingsAmount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid savings amount.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const amount = parseFloat(savingsAmount);
      const newWin: SavingsWin = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        amount,
        description: savingsDescription || 'Savings added',
      };

      const newTotalSavings = totalSavings + amount;
      setTotalSavings(newTotalSavings);
      setSavingsWins([newWin, ...savingsWins]);

      // Update financial data
      const financialData = await storage.getFinancialData();
      if (financialData) {
        financialData.monthlySavings = newTotalSavings;
        await storage.setFinancialData(financialData);

        // Sync to Supabase (non-blocking)
        supabaseSync.syncFinancialData(financialData).catch((err) =>
          console.error('Failed to sync financial data:', err)
        );
      }

      setShowAddSavingsModal(false);
      setSavingsAmount('');
      setSavingsDescription('');
    } catch (error) {
      console.error('Failed to add savings:', error);
      Alert.alert('Error', 'Failed to add savings. Please try again.');
    }
  };

  const calculateProgress = () => {
    if (savingsGoal === 0) return 0;
    return Math.min((totalSavings / savingsGoal) * 100, 100);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.electricTeal} />
          <Text style={[styles.loadingText, { color: Colors.secondaryText }]}>
            Loading your savings...
          </Text>
        </View>
      </LinearGradient>
    );
  }

  const progressPercentage = calculateProgress();

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: Colors.primaryText }]}>Savings Hub</Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>Build Your Wealth</Text>
          </View>
          <TouchableOpacity
            style={[styles.settingsButton, { backgroundColor: Colors.cardBackground, borderColor: Colors.glassBorder }]}
            onPress={() => router.push('/(tabs)/profile')}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.electricTeal} />
          </TouchableOpacity>
        </View>

        {/* Total Savings Card */}
        <GlassCard style={styles.totalSavingsCard}>
          <View style={styles.totalSavingsHeader}>
            <Text style={[styles.sectionLabel, { color: Colors.secondaryText }]}>Total Savings</Text>
            <View style={[styles.trendBadge, { backgroundColor: Colors.glowingGreen + '20' }]}>
              <Ionicons name="trending-up" size={14} color={Colors.glowingGreen} />
              <Text style={[styles.trendText, { color: Colors.glowingGreen }]}>Growing</Text>
            </View>
          </View>
          <Text style={[styles.totalSavingsValue, { color: Colors.primaryText }]}>
            {currency}{totalSavings.toFixed(2)}
          </Text>
          <Text style={[styles.totalSavingsSubtext, { color: Colors.tertiaryText }]}>
            Keep up the great work!
          </Text>
        </GlassCard>

        {/* Savings Goal Progress */}
        <GlassCard style={styles.goalCard}>
          <View style={styles.goalHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Savings Goal</Text>
            <Text style={[styles.goalPercentage, { color: Colors.electricTeal }]}>
              {progressPercentage.toFixed(0)}%
            </Text>
          </View>

          {/* Progress Ring Visualization */}
          <View style={styles.goalVisualization}>
            <View style={styles.progressRingContainer}>
              <View style={[styles.progressRingBackground, { borderColor: Colors.lightCream }]}>
                <View
                  style={[
                    styles.progressRingFill,
                    {
                      borderColor: Colors.electricTeal,
                      transform: [{ rotate: `${(progressPercentage / 100) * 360}deg` }],
                    },
                  ]}
                />
              </View>
              <View style={styles.progressRingCenter}>
                <Text style={[styles.progressRingValue, { color: Colors.primaryText }]}>
                  {currency}{totalSavings.toFixed(0)}
                </Text>
                <Text style={[styles.progressRingLabel, { color: Colors.tertiaryText }]}>saved</Text>
              </View>
            </View>

            <View style={styles.goalDetails}>
              <View style={styles.goalDetailRow}>
                <Text style={[styles.goalDetailLabel, { color: Colors.secondaryText }]}>Goal</Text>
                <Text style={[styles.goalDetailValue, { color: Colors.primaryText }]}>
                  {currency}{savingsGoal.toFixed(0)}
                </Text>
              </View>
              <View style={styles.goalDetailRow}>
                <Text style={[styles.goalDetailLabel, { color: Colors.secondaryText }]}>Remaining</Text>
                <Text style={[styles.goalDetailValue, { color: Colors.electricTeal }]}>
                  {currency}{Math.max(savingsGoal - totalSavings, 0).toFixed(0)}
                </Text>
              </View>
              {progressPercentage >= 100 ? (
                <View style={styles.goalAchievedBanner}>
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.glowingGreen]}
                    style={styles.goalAchievedGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Ionicons name="trophy" size={20} color={Colors.white} />
                    <Text style={styles.goalAchievedText}>Goal Achieved! 🎉</Text>
                  </LinearGradient>
                </View>
              ) : (
                <Text style={[styles.goalMotivation, { color: Colors.tertiaryText }]}>
                  You&apos;re {progressPercentage.toFixed(0)}% of the way there!
                </Text>
              )}
            </View>
          </View>
        </GlassCard>

        {/* Savings Wins History */}
        <View style={styles.winsSection}>
          <View style={styles.winsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Savings Wins</Text>
            <TouchableOpacity
              style={[styles.addWinButton, { backgroundColor: Colors.electricTeal }]}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAddSavingsModal(true);
              }}
            >
              <Ionicons name="add" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {savingsWins.length === 0 ? (
            <GlassCard style={styles.emptyWinsCard}>
              <Text style={styles.emptyWinsEmoji}>🏆</Text>
              <Text style={[styles.emptyWinsText, { color: Colors.primaryText }]}>
                No savings wins yet
              </Text>
              <Text style={[styles.emptyWinsSubtext, { color: Colors.secondaryText }]}>
                Start tracking your savings achievements!
              </Text>
            </GlassCard>
          ) : (
            savingsWins.map((win) => (
              <GlassCard key={win.id} style={styles.winCard}>
                <View style={styles.winContent}>
                  <View style={[styles.winIconContainer, { backgroundColor: Colors.glowingGreen + '20' }]}>
                    <Ionicons name="checkmark-circle" size={24} color={Colors.glowingGreen} />
                  </View>
                  <View style={styles.winDetails}>
                    <Text style={[styles.winDescription, { color: Colors.primaryText }]}>
                      {win.description}
                    </Text>
                    <Text style={[styles.winDate, { color: Colors.tertiaryText }]}>
                      {formatDate(win.date)}
                    </Text>
                  </View>
                  <Text style={[styles.winAmount, { color: Colors.glowingGreen }]}>
                    +{currency}{win.amount.toFixed(0)}
                  </Text>
                </View>
              </GlassCard>
            ))
          )}
        </View>

        {/* Tips Card */}
        <GlassCard style={styles.tipsCard}>
          <View style={styles.tipsHeader}>
            <Ionicons name="bulb" size={24} color={Colors.sunKissedAmber} />
            <Text style={[styles.tipsTitle, { color: Colors.primaryText }]}>Savings Tip</Text>
          </View>
          <Text style={[styles.tipsText, { color: Colors.secondaryText }]}>
            Automate your savings! Set aside a fixed amount each week before spending on anything else.
            Even small amounts add up over time.
          </Text>
        </GlassCard>
      </ScrollView>

      {/* Add Savings Modal */}
      <Modal
        visible={showAddSavingsModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddSavingsModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.cardBackground }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Add Savings Win</Text>
              <TouchableOpacity onPress={() => setShowAddSavingsModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Amount Saved</Text>
            <View style={[styles.amountInput, { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder }]}>
              <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>{currency}</Text>
              <TextInput
                style={[styles.input, { color: Colors.primaryText }]}
                placeholder="0.00"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="decimal-pad"
                value={savingsAmount}
                onChangeText={setSavingsAmount}
              />
            </View>

            <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Description</Text>
            <TextInput
              style={[styles.textInput, { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder, color: Colors.primaryText }]}
              placeholder="e.g., Meal prep saved £50 this week"
              placeholderTextColor={Colors.mediumGray}
              value={savingsDescription}
              onChangeText={setSavingsDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddSavings}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitButtonText}>Add Savings Win</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 30,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  totalSavingsCard: {
    marginBottom: 20,
  },
  totalSavingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
  },
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  trendText: {
    fontSize: 12,
    fontWeight: '600',
  },
  totalSavingsValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  totalSavingsSubtext: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalCard: {
    marginBottom: 20,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  goalPercentage: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  goalVisualization: {
    flexDirection: 'row',
    gap: 20,
  },
  progressRingContainer: {
    width: 120,
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingBackground: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    position: 'absolute',
  },
  progressRingFill: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 12,
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  progressRingCenter: {
    alignItems: 'center',
  },
  progressRingValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  progressRingLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  goalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  goalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  goalDetailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  goalDetailValue: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  goalAchievedBanner: {
    marginTop: 8,
    borderRadius: 12,
    overflow: 'hidden',
  },
  goalAchievedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  goalAchievedText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalMotivation: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  winsSection: {
    marginBottom: 20,
  },
  winsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  addWinButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyWinsCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyWinsEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyWinsText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emptyWinsSubtext: {
    fontSize: 14,
  },
  winCard: {
    marginBottom: 12,
  },
  winContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  winIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winDetails: {
    flex: 1,
  },
  winDescription: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  winDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  winAmount: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  tipsCard: {
    marginBottom: 20,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  tipsTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  tipsText: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    padding: 24,
    paddingBottom: 40,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  modalTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
    marginTop: 16,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    paddingVertical: 16,
  },
  textInput: {
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
});
