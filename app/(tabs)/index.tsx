import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { BudgetCategoryRing } from '@/components/BudgetCategoryRing';
import { storage } from '@/utils/storage';
import { BudgetCategory, FinancialData, DailyRolloverState } from '@/types';
import { initializeDailyRollover, updateDailySpending } from '@/utils/dailyRollover';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';

const { width } = Dimensions.get('window');

// Available icons for budget categories
const AVAILABLE_ICONS = [
  { icon: 'home', label: 'Home' },
  { icon: 'cart', label: 'Shopping' },
  { icon: 'restaurant', label: 'Food' },
  { icon: 'car', label: 'Transport' },
  { icon: 'medkit', label: 'Health' },
  { icon: 'school', label: 'Education' },
  { icon: 'shirt', label: 'Clothing' },
  { icon: 'gift', label: 'Gifts' },
  { icon: 'football', label: 'Recreation' },
  { icon: 'sparkles', label: 'Self-Care' },
  { icon: 'alert-circle', label: 'Emergency' },
  { icon: 'leaf', label: 'Utilities' },
];

const AVAILABLE_COLORS = [
  '#E11D48', '#EC4899', '#F59E0B', '#14B8A6',
  '#10B981', '#6366F1', '#8B5CF6', '#EF4444',
];

export default function HomeScreen() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [showLogSpendingModal, setShowLogSpendingModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('home');
  const [newItemColor, setNewItemColor] = useState('#E11D48');
  const [newItemAllocation, setNewItemAllocation] = useState('');
  const [spendingAmount, setSpendingAmount] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [rolloverState, setRolloverState] = useState<DailyRolloverState | null>(null);
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const financial = await storage.getFinancialData();
      const user = await storage.getUserData();

      if (!financial || !user) {
        setError('Please complete your financial blueprint setup.');
        return;
      }

      setFinancialData(financial);
      setUserData(user);

      // Load budget categories (user must create manually)
      if (financial.budgetCategories && financial.budgetCategories.length > 0) {
        setBudgetCategories(financial.budgetCategories);
      } else {
        setBudgetCategories([]);
      }

      // Initialize the daily rollover engine
      const rollover = await initializeDailyRollover(financial);
      setRolloverState(rollover);
    } catch (loadError) {
      console.error('Failed to load data:', loadError);
      setError('Unable to load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBudgetHealth = () => {
    if (!budgetCategories.length) return 100;

    const totalAllocated = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);

    if (totalAllocated === 0) return 100;

    const utilizationRate = (totalSpent / totalAllocated) * 100;

    // Score: 100 for perfect budget adherence, decreasing as overspending occurs
    if (utilizationRate <= 80) return 100;
    if (utilizationRate <= 90) return 90;
    if (utilizationRate <= 100) return 80;
    return Math.max(0, 80 - (utilizationRate - 100));
  };

  const handleOpenBudgetSetup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBudgetModal(true);
  };

  const handleSaveBudgetAllocations = async () => {
    try {
      const updatedFinancialData: FinancialData = {
        ...(financialData as FinancialData),
        budgetCategories,
        budgetHealthScore: calculateBudgetHealth(),
      };

      await storage.setFinancialData(updatedFinancialData);
      setFinancialData(updatedFinancialData);
      setShowBudgetModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (saveError) {
      console.error('Failed to save budget:', saveError);
      Alert.alert('Save Failed', 'Unable to save budget allocations.');
    }
  };

  const handleAddBudgetItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Required', 'Please enter a budget item name');
      return;
    }

    const allocation = parseFloat(newItemAllocation) || 0;

    const newItem: BudgetCategory = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      allocated: allocation,
      spent: 0,
      icon: newItemIcon,
      color: newItemColor,
    };

    setBudgetCategories((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemIcon('home');
    setNewItemColor('#E11D48');
    setNewItemAllocation('');
    setShowAddItemModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteBudgetItem = (id: string) => {
    Alert.alert(
      'Delete Budget Item',
      'Are you sure you want to delete this budget item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBudgetCategories((prev) => prev.filter((item) => item.id !== id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleLogSpending = async () => {
    const amount = parseFloat(spendingAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid spending amount.');
      return;
    }

    if (!financialData || !rolloverState) return;

    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      const newTotalSpent = rolloverState.todayEntry.totalSpent + amount;

      // Update financial data
      const updatedFinancialData: FinancialData = {
        ...financialData,
        dailySpending: newTotalSpent,
      };
      await storage.setFinancialData(updatedFinancialData);
      setFinancialData(updatedFinancialData);

      // Update rollover state
      const updatedRollover = await updateDailySpending(newTotalSpent, updatedFinancialData);
      setRolloverState(updatedRollover);

      // Update streak in financial data
      const finalData: FinancialData = {
        ...updatedFinancialData,
        streakDays: updatedRollover.momentumStreak,
      };
      await storage.setFinancialData(finalData);
      setFinancialData(finalData);

      setSpendingAmount('');
      setShowLogSpendingModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (logError) {
      console.error('Failed to log spending:', logError);
      Alert.alert('Error', 'Failed to log spending. Please try again.');
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.electricTeal} />
          <Text style={[styles.loadingText, { color: Colors.secondaryText }]}>Loading your dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error || !financialData) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.radiantMagenta} />
          <Text style={[styles.errorText, { color: Colors.primaryText }]}>{error || 'Unable to load data'}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.electricTeal }]}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const currency = financialData?.currency || '£';

  // Rollover-powered values
  const todayEffectiveLimit = rolloverState?.todayEntry.effectiveLimit ?? financialData.dailyBudget;
  const todayTotalSpent = rolloverState?.todayEntry.totalSpent ?? financialData.dailySpending;
  const todayRemaining = todayEffectiveLimit - todayTotalSpent;
  const tomorrowForecast = rolloverState?.tomorrowForecast ?? financialData.dailyBudget;
  const momentumStreak = rolloverState?.momentumStreak ?? financialData.streakDays;
  const isUnderBudget = todayTotalSpent <= todayEffectiveLimit;
  const spendingPercentage = todayEffectiveLimit > 0
    ? Math.min((todayTotalSpent / todayEffectiveLimit) * 100, 100)
    : 0;

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  // Get streak label text
  const getStreakLabel = () => {
    if (momentumStreak === 0) return 'Start your streak!';
    if (momentumStreak === 1) return 'Day';
    return 'Days';
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: Colors.primaryText }]}>{getGreeting()}! 👋</Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>
              {userData?.name || 'Mom Boss'}
            </Text>
          </View>
          <TouchableOpacity
            style={[
              styles.notificationButton,
              {
                backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : Colors.white,
                borderColor: isDark ? 'rgba(45, 212, 191, 0.3)' : Colors.glassBorder,
              },
            ]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons
              name="notifications-outline"
              size={24}
              color={isDark ? Colors.electricTeal : Colors.primaryText}
            />
            <View style={[
              styles.notificationBadge,
              { backgroundColor: isDark ? Colors.amethyst : Colors.radiantMagenta },
            ]} />
          </TouchableOpacity>
        </View>

        {/* Daily Spending Dashboard */}
        <GlassCard style={styles.dailySpendingCard}>
          <View style={styles.dailySpendingHeader}>
            <View>
              <Text style={[styles.dailySpendingLabel, { color: Colors.secondaryText }]}>Today&apos;s Limit</Text>
              <Text style={[styles.dailySpendingDate, { color: Colors.tertiaryText }]}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.dailySpendingAmounts}>
              <Text style={[styles.dailySpendingValue, { color: Colors.primaryText }]}>
                {currency}{todayEffectiveLimit.toFixed(2)}
              </Text>
              {rolloverState && rolloverState.todayEntry.rolloverFromPrevious !== 0 && (
                <View style={styles.rolloverBadge}>
                  <Ionicons
                    name={rolloverState.todayEntry.rolloverFromPrevious > 0 ? 'arrow-up-circle' : 'arrow-down-circle'}
                    size={14}
                    color={rolloverState.todayEntry.rolloverFromPrevious > 0 ? Colors.glowingGreen : Colors.radiantMagenta}
                  />
                  <Text style={[
                    styles.rolloverText,
                    { color: rolloverState.todayEntry.rolloverFromPrevious > 0 ? Colors.glowingGreen : Colors.radiantMagenta },
                  ]}>
                    {rolloverState.todayEntry.rolloverFromPrevious > 0 ? '+' : ''}
                    {currency}{rolloverState.todayEntry.rolloverFromPrevious.toFixed(2)} rollover
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Progress Bar */}
          <View style={[styles.progressBarContainer, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream }]}>
            <LinearGradient
              colors={
                !isUnderBudget
                  ? [Colors.radiantMagenta, Colors.sunKissedAmber]
                  : [Colors.electricTeal, Colors.glowingGreen]
              }
              style={[
                styles.progressBarFill,
                {
                  width: `${spendingPercentage}%`,
                },
              ]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            />
          </View>

          {/* Status Message */}
          <View style={styles.dailyStatusContainer}>
            {isUnderBudget ? (
              <View style={styles.dailyStatusRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.glowingGreen} />
                <Text style={[styles.dailyStatusText, { color: Colors.glowingGreen }]}>
                  {currency}{todayRemaining.toFixed(2)} remaining today
                </Text>
              </View>
            ) : (
              <View style={styles.dailyStatusRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.radiantMagenta} />
                <Text style={[styles.dailyStatusText, { color: Colors.radiantMagenta }]}>
                  {currency}{Math.abs(todayRemaining).toFixed(2)} over budget
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* Dashboard Metrics Row */}
        <View style={styles.metricsRow}>
          {/* Total Spent Today */}
          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconBg, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.15)' : '#E11D4815' }]}>
              <Ionicons name="receipt-outline" size={20} color={Colors.radiantMagenta} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.primaryText }]}>
              {currency}{todayTotalSpent.toFixed(2)}
            </Text>
            <Text style={[styles.metricLabel, { color: Colors.tertiaryText }]}>Spent Today</Text>
          </GlassCard>

          {/* Tomorrow's Forecast */}
          <GlassCard style={styles.metricCard}>
            <View style={[styles.metricIconBg, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#A855F715' }]}>
              <Ionicons name="telescope-outline" size={20} color={Colors.amethyst} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.primaryText }]}>
              {currency}{tomorrowForecast.toFixed(2)}
            </Text>
            <Text style={[styles.metricLabel, { color: Colors.tertiaryText }]}>Tomorrow</Text>
          </GlassCard>
        </View>

        {/* Log Spending Button */}
        <TouchableOpacity
          style={styles.logSpendingButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowLogSpendingModal(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={isDark ? [Colors.electricTeal, Colors.amethyst] : [Colors.electricTeal, Colors.glowingGreen]}
            style={styles.logSpendingGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle-outline" size={24} color="#FFFFFF" />
            <Text style={styles.logSpendingText}>Log Today&apos;s Spending</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Monthly Budget Categories */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetSectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Monthly Budget</Text>
            <View style={styles.budgetHeaderActions}>
              <TouchableOpacity
                onPress={() => setShowAddItemModal(true)}
                style={[styles.addButton, { backgroundColor: Colors.electricTeal }]}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
              {budgetCategories.length > 0 && (
                <TouchableOpacity onPress={handleOpenBudgetSetup}>
                  <Ionicons name="settings-outline" size={20} color={Colors.electricTeal} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {budgetCategories.length === 0 ? (
            <GlassCard style={styles.emptyStateCard}>
              <Text style={styles.emptyStateEmoji}>💰</Text>
              <Text style={[styles.emptyStateTitle, { color: Colors.primaryText }]}>
                Create Your Budget
              </Text>
              <Text style={[styles.emptyStateText, { color: Colors.secondaryText }]}>
                Start by adding custom budget items that match your spending needs.
              </Text>
              <TouchableOpacity
                style={styles.createFirstItemButton}
                onPress={() => setShowAddItemModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.createFirstItemGradient}
                >
                  <Ionicons name="add-circle-outline" size={24} color={Colors.white} />
                  <Text style={styles.createFirstItemText}>Create First Budget Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <View style={styles.budgetGrid}>
              {budgetCategories.map((category) => (
                <View key={category.id} style={styles.budgetCategoryCard}>
                  <BudgetCategoryRing
                    label={category.name}
                    allocated={category.allocated}
                    spent={category.spent}
                    currency={currency}
                    size={100}
                    tealColor={Colors.electricTeal}
                    amberColor={Colors.sunKissedAmber}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Quick-Log */}
        {budgetCategories.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Quick-Log</Text>
            <View style={styles.quickActions}>
              {budgetCategories.slice(0, 4).map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={styles.quickAction}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                >
                  <LinearGradient
                    colors={[cat.color, cat.color + 'DD']}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons name={cat.icon as any} size={28} color={Colors.white} />
                    <Text style={styles.quickActionText}>{cat.name}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          </>
        )}

        {/* Momentum Streak */}
        <GlassCard style={styles.momentumStreakCard}>
          <View style={styles.momentumStreakContent}>
            <View style={styles.momentumStreakLeft}>
              <LinearGradient
                colors={isDark ? ['#F59E0B', '#E11D48'] : ['#F59E0B', '#EF4444']}
                style={styles.streakIconLarge}
              >
                <Text style={styles.streakEmojiLarge}>🔥</Text>
              </LinearGradient>
              <View style={styles.momentumStreakInfo}>
                <Text style={[styles.momentumStreakTitle, { color: Colors.primaryText }]}>
                  Momentum Streak
                </Text>
                <Text style={[styles.momentumStreakSubtitle, { color: Colors.tertiaryText }]}>
                  {momentumStreak > 0
                    ? 'Consecutive days under budget'
                    : 'Stay under budget to start!'
                  }
                </Text>
              </View>
            </View>
            <View style={styles.momentumStreakRight}>
              <Text style={[styles.momentumStreakValue, {
                color: momentumStreak > 0
                  ? (isDark ? Colors.sunKissedAmber : Colors.radiantMagenta)
                  : Colors.tertiaryText,
              }]}>
                {momentumStreak}
              </Text>
              <Text style={[styles.momentumStreakLabel, { color: Colors.tertiaryText }]}>
                {getStreakLabel()}
              </Text>
            </View>
          </View>

          {/* Streak Progress Dots */}
          {momentumStreak > 0 && (
            <View style={styles.streakDotsContainer}>
              {Array.from({ length: Math.min(momentumStreak, 7) }).map((_, i) => (
                <LinearGradient
                  key={`dot-${i}`}
                  colors={['#F59E0B', '#E11D48']}
                  style={styles.streakDot}
                />
              ))}
              {momentumStreak > 7 && (
                <Text style={[styles.streakDotsMore, { color: Colors.sunKissedAmber }]}>
                  +{momentumStreak - 7}
                </Text>
              )}
            </View>
          )}
        </GlassCard>
      </ScrollView>

      {/* Log Spending Modal */}
      <Modal
        visible={showLogSpendingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogSpendingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.darkPurple : Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Log Spending</Text>
              <TouchableOpacity onPress={() => setShowLogSpendingModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            {/* Current Status */}
            <View style={[styles.logStatusCard, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream }]}>
              <View style={styles.logStatusRow}>
                <Text style={[styles.logStatusLabel, { color: Colors.secondaryText }]}>Today&apos;s Limit</Text>
                <Text style={[styles.logStatusValue, { color: Colors.electricTeal }]}>
                  {currency}{todayEffectiveLimit.toFixed(2)}
                </Text>
              </View>
              <View style={styles.logStatusRow}>
                <Text style={[styles.logStatusLabel, { color: Colors.secondaryText }]}>Already Spent</Text>
                <Text style={[styles.logStatusValue, { color: Colors.primaryText }]}>
                  {currency}{todayTotalSpent.toFixed(2)}
                </Text>
              </View>
              <View style={[styles.logStatusDivider, { backgroundColor: Colors.glassBorder }]} />
              <View style={styles.logStatusRow}>
                <Text style={[styles.logStatusLabelBold, { color: Colors.primaryText }]}>Remaining</Text>
                <Text style={[styles.logStatusValueBold, {
                  color: isUnderBudget ? Colors.glowingGreen : Colors.radiantMagenta,
                }]}>
                  {currency}{todayRemaining.toFixed(2)}
                </Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Amount Spent</Text>
            <View style={[styles.budgetInputField, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream, borderColor: Colors.glassBorder }]}>
              <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>{currency}</Text>
              <TextInput
                style={[styles.budgetInput, { color: Colors.primaryText }]}
                placeholder="0.00"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="decimal-pad"
                value={spendingAmount}
                onChangeText={setSpendingAmount}
                autoFocus
              />
            </View>

            {spendingAmount && parseFloat(spendingAmount) > 0 && (
              <View style={[styles.spendingPreview, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.4)' : Colors.lightCream + '80' }]}>
                <Ionicons
                  name={parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit ? 'checkmark-circle' : 'warning'}
                  size={18}
                  color={parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit ? Colors.glowingGreen : Colors.sunKissedAmber}
                />
                <Text style={[styles.spendingPreviewText, {
                  color: parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit ? Colors.glowingGreen : Colors.sunKissedAmber,
                }]}>
                  {parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit
                    ? `Still under budget — ${currency}${(todayRemaining - parseFloat(spendingAmount)).toFixed(2)} left`
                    : `Over budget by ${currency}${(parseFloat(spendingAmount) + todayTotalSpent - todayEffectiveLimit).toFixed(2)}`
                  }
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleLogSpending}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Log Spending</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Budget Allocation Modal */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.darkPurple : Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Set Budget</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {budgetCategories.map((category, index) => (
                <View key={category.id} style={styles.budgetInputRow}>
                  <View style={styles.budgetInputHeader}>
                    <View style={styles.budgetInputLabelRow}>
                      <Ionicons name={category.icon as any} size={20} color={category.color} />
                      <Text style={[styles.budgetInputName, { color: Colors.primaryText }]}>
                        {category.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBudgetItem(category.id)}
                      style={styles.deleteItemButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.budgetInputField, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream, borderColor: Colors.glassBorder }]}>
                    <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>{currency}</Text>
                    <TextInput
                      style={[styles.budgetInput, { color: Colors.primaryText }]}
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      value={category.allocated.toString()}
                      onChangeText={(value) => {
                        const newCategories = [...budgetCategories];
                        newCategories[index].allocated = parseFloat(value) || 0;
                        setBudgetCategories(newCategories);
                      }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBudgetAllocations}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Budget Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.darkPurple : Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>New Budget Item</Text>
              <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Item Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream, borderColor: Colors.glassBorder, color: Colors.primaryText }]}
                  placeholder="e.g., Groceries, Rent, Transportation"
                  placeholderTextColor={Colors.mediumGray}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  maxLength={30}
                />
              </View>

              {/* Icon Selection */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Choose Icon</Text>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((item) => (
                    <TouchableOpacity
                      key={item.icon}
                      style={[
                        styles.iconOption,
                        { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream, borderColor: Colors.glassBorder },
                        newItemIcon === item.icon && {
                          borderColor: Colors.electricTeal,
                          borderWidth: 2,
                          backgroundColor: Colors.electricTeal + '15',
                        },
                      ]}
                      onPress={() => {
                        setNewItemIcon(item.icon);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={newItemIcon === item.icon ? Colors.electricTeal : Colors.secondaryText}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Selection */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Choose Color</Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newItemColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        setNewItemColor(color);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      {newItemColor === color && (
                        <Ionicons name="checkmark" size={20} color={Colors.white} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Allocation Amount */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Allocate Money (Optional)</Text>
                <View style={[styles.budgetInputField, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream, borderColor: Colors.glassBorder }]}>
                  <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>{currency}</Text>
                  <TextInput
                    style={[styles.budgetInput, { color: Colors.primaryText }]}
                    placeholder="0"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="numeric"
                    value={newItemAllocation}
                    onChangeText={setNewItemAllocation}
                  />
                </View>
              </View>

              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Preview</Text>
                <View style={[styles.previewCard, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream }]}>
                  <View style={[styles.previewIcon, { backgroundColor: newItemColor + '20' }]}>
                    <Ionicons name={newItemIcon as any} size={32} color={newItemColor} />
                  </View>
                  <Text style={[styles.previewText, { color: Colors.primaryText }]}>
                    {newItemName || 'Budget Item Name'}
                  </Text>
                  {newItemAllocation && parseFloat(newItemAllocation) > 0 && (
                    <Text style={[styles.previewAllocation, { color: Colors.electricTeal }]}>
                      {currency}{parseFloat(newItemAllocation).toFixed(2)} allocated
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddBudgetItem}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Create Budget Item</Text>
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
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  notificationButton: {
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
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  dailySpendingCard: {
    marginBottom: 16,
  },
  dailySpendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  dailySpendingLabel: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  dailySpendingDate: {
    fontSize: 12,
    fontWeight: '500',
  },
  dailySpendingAmounts: {
    alignItems: 'flex-end',
  },
  dailySpendingValue: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rolloverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  rolloverText: {
    fontSize: 12,
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 12,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },
  dailyStatusContainer: {
    alignItems: 'flex-start',
  },
  dailyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  dailyStatusText: {
    fontSize: 14,
    fontWeight: '600',
  },

  // Dashboard Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  metricValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 12,
    fontWeight: '600',
  },

  // Log Spending Button
  logSpendingButton: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 24,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  logSpendingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 10,
  },
  logSpendingText: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },

  budgetSection: {
    marginBottom: 24,
  },
  budgetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
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
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  budgetCategoryCard: {
    width: (width - 56) / 2,
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
    marginTop: 12,
  },
  quickAction: {
    width: (width - 60) / 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Momentum Streak
  momentumStreakCard: {
    marginBottom: 20,
  },
  momentumStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentumStreakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  streakIconLarge: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakEmojiLarge: {
    fontSize: 28,
  },
  momentumStreakInfo: {
    flex: 1,
  },
  momentumStreakTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 2,
  },
  momentumStreakSubtitle: {
    fontSize: 12,
    fontWeight: '500',
  },
  momentumStreakRight: {
    alignItems: 'center',
    paddingLeft: 12,
  },
  momentumStreakValue: {
    fontSize: 36,
    fontWeight: 'bold',
    lineHeight: 40,
  },
  momentumStreakLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 2,
  },
  streakDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  streakDotsMore: {
    fontSize: 13,
    fontWeight: '700',
    marginLeft: 2,
  },

  // Log Spending Modal
  logStatusCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  logStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  logStatusLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  logStatusValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  logStatusDivider: {
    height: 1,
    marginVertical: 8,
  },
  logStatusLabelBold: {
    fontSize: 15,
    fontWeight: '700',
  },
  logStatusValueBold: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  spendingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
    marginTop: 12,
  },
  spendingPreviewText: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },

  // Shared Modal Styles
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
    maxHeight: '80%',
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
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstItemButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createFirstItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createFirstItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  budgetInputRow: {
    marginBottom: 20,
  },
  budgetInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetInputName: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 12,
  },
  saveButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 6,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previewSection: {
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  previewAllocation: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
  },
});
