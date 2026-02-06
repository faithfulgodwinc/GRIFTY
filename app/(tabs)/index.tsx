import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { EmptyState } from '@/components/EmptyState';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import { BudgetCategoryRing } from '@/components/BudgetCategoryRing';
import { storage } from '@/utils/storage';
import { BudgetCategory, FinancialData, DailyRolloverState } from '@/types';
import { initializeDailyRollover, updateDailySpending } from '@/utils/dailyRollover';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import Svg, { Defs, LinearGradient as SvgGradient, Stop, Rect } from 'react-native-svg';

const { width } = Dimensions.get('window');

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

const formatCurrency = (currency: string, value: number): string => {
  return `${currency}${value.toFixed(2)}`;
};

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

      if (financial.budgetCategories && financial.budgetCategories.length > 0) {
        setBudgetCategories(financial.budgetCategories);
      } else {
        setBudgetCategories([]);
      }

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

      const updatedFinancialData: FinancialData = {
        ...financialData,
        dailySpending: newTotalSpent,
      };
      await storage.setFinancialData(updatedFinancialData);
      setFinancialData(updatedFinancialData);

      const updatedRollover = await updateDailySpending(newTotalSpent, updatedFinancialData);
      setRolloverState(updatedRollover);

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

  // --- Loading State ---
  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <DashboardSkeleton />
      </LinearGradient>
    );
  }

  // --- Error State ---
  if (error || !financialData) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.12)' : 'rgba(225, 29, 72, 0.08)' }]}>
            <Ionicons name="alert-circle-outline" size={56} color={Colors.radiantMagenta} />
          </View>
          <Text style={[styles.errorText, { color: Colors.primaryText }]}>
            {error || 'Unable to load data'}
          </Text>
          <Text style={[styles.errorSubtext, { color: Colors.tertiaryText }]}>
            Check your connection and try again
          </Text>
          <PressableScale
            onPress={loadData}
            style={[styles.retryButton, { backgroundColor: Colors.electricTeal }]}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </PressableScale>
        </View>
      </LinearGradient>
    );
  }

  const currency = financialData?.currency || '\u00A3';

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

  const getStreakLabel = () => {
    if (momentumStreak === 0) return 'Start your streak!';
    if (momentumStreak === 1) return 'Day';
    return 'Days';
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

        {/* ============ HEADER ============ */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: Colors.primaryText }]}>
              {getGreeting()}!
            </Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>
              {userData?.name || 'Mom Boss'}
            </Text>
          </View>
          <PressableScale
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={[
              styles.notificationButton,
              {
                backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : Colors.white,
                borderColor: isDark ? 'rgba(45, 212, 191, 0.3)' : Colors.glassBorder,
              },
            ]}
          >
            <Ionicons
              name="notifications-outline"
              size={22}
              color={isDark ? Colors.electricTeal : Colors.primaryText}
            />
            <View style={[
              styles.notificationBadge,
              { backgroundColor: isDark ? Colors.amethyst : Colors.radiantMagenta },
            ]} />
          </PressableScale>
        </View>

        {/* ============ DAILY SPENDING DASHBOARD ============ */}
        <GlassCard animated delay={0} style={styles.dailySpendingCard}>
          <View style={styles.dailySpendingHeader}>
            <View>
              <Text style={[styles.dailySpendingLabel, { color: Colors.tertiaryText }]}>
                Today&apos;s Limit
              </Text>
              <Text style={[styles.dailySpendingDate, { color: Colors.tertiaryText }]}>
                {new Date().toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short' })}
              </Text>
            </View>
            <View style={styles.dailySpendingAmounts}>
              <Text style={[styles.dailySpendingValue, { color: Colors.primaryText }]}>
                {formatCurrency(currency, todayEffectiveLimit)}
              </Text>
              {rolloverState && rolloverState.todayEntry.rolloverFromPrevious !== 0 && (
                <View style={[
                  styles.rolloverBadge,
                  {
                    backgroundColor: rolloverState.todayEntry.rolloverFromPrevious > 0
                      ? (isDark ? 'rgba(16, 185, 129, 0.12)' : 'rgba(16, 185, 129, 0.08)')
                      : (isDark ? 'rgba(225, 29, 72, 0.12)' : 'rgba(225, 29, 72, 0.08)'),
                  },
                ]}>
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
                    {formatCurrency(currency, rolloverState.todayEntry.rolloverFromPrevious)} rollover
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Neon Glow Progress Bar */}
          <View style={[
            styles.progressBarContainer,
            { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream },
          ]}>
            <View style={[
              styles.progressBarGlow,
              {
                width: `${spendingPercentage}%` as any,
                shadowColor: isUnderBudget ? Colors.electricTeal : Colors.radiantMagenta,
              },
            ]}>
              <LinearGradient
                colors={
                  !isUnderBudget
                    ? [Colors.radiantMagenta, Colors.sunKissedAmber]
                    : Gradients.neonBar
                }
                style={styles.progressBarFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
          </View>

          {/* Status Message */}
          <View style={styles.dailyStatusContainer}>
            {isUnderBudget ? (
              <View style={styles.dailyStatusRow}>
                <Ionicons name="checkmark-circle" size={16} color={Colors.glowingGreen} />
                <Text style={[styles.dailyStatusText, { color: Colors.glowingGreen }]}>
                  {formatCurrency(currency, todayRemaining)} remaining today
                </Text>
              </View>
            ) : (
              <View style={styles.dailyStatusRow}>
                <Ionicons name="alert-circle" size={16} color={Colors.radiantMagenta} />
                <Text style={[styles.dailyStatusText, { color: Colors.radiantMagenta }]}>
                  {formatCurrency(currency, Math.abs(todayRemaining))} over budget
                </Text>
              </View>
            )}
          </View>
        </GlassCard>

        {/* ============ METRICS ROW ============ */}
        <View style={styles.metricsRow}>
          <GlassCard animated delay={100} style={styles.metricCard}>
            <View style={[styles.metricIconBg, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.15)' : '#E11D4815' }]}>
              <Ionicons name="receipt-outline" size={20} color={Colors.radiantMagenta} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.primaryText }]}>
              {formatCurrency(currency, todayTotalSpent)}
            </Text>
            <Text style={[styles.metricLabel, { color: Colors.tertiaryText }]}>Spent Today</Text>
          </GlassCard>

          <GlassCard animated delay={200} style={styles.metricCard}>
            <View style={[styles.metricIconBg, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#A855F715' }]}>
              <Ionicons name="telescope-outline" size={20} color={Colors.amethyst} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.primaryText }]}>
              {formatCurrency(currency, tomorrowForecast)}
            </Text>
            <Text style={[styles.metricLabel, { color: Colors.tertiaryText }]}>Tomorrow</Text>
          </GlassCard>
        </View>

        {/* ============ LOG SPENDING BUTTON ============ */}
        <PressableScale
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowLogSpendingModal(true);
          }}
          style={styles.logSpendingButton}
          scaleValue={0.96}
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
        </PressableScale>

        {/* ============ MONTHLY BUDGET CATEGORIES ============ */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetSectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Monthly Budget</Text>
            <View style={styles.budgetHeaderActions}>
              <PressableScale
                onPress={() => setShowAddItemModal(true)}
                style={[styles.addButton, { backgroundColor: Colors.electricTeal }]}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </PressableScale>
              {budgetCategories.length > 0 && (
                <PressableScale onPress={handleOpenBudgetSetup}>
                  <Ionicons name="settings-outline" size={20} color={Colors.electricTeal} />
                </PressableScale>
              )}
            </View>
          </View>

          {budgetCategories.length === 0 ? (
            <GlassCard animated delay={300}>
              <EmptyState
                icon="wallet-outline"
                iconColor={Colors.electricTeal}
                title="Create Your Budget"
                description="Start by adding custom budget items that match your spending needs."
                actionLabel="Create First Budget Item"
                onAction={() => setShowAddItemModal(true)}
                gradientColors={[Colors.electricTeal, Colors.glowingGreen]}
              />
            </GlassCard>
          ) : (
            <View style={styles.budgetGrid}>
              {budgetCategories.map((category, index) => (
                <GlassCard
                  key={category.id}
                  animated
                  delay={300 + index * 80}
                  style={styles.budgetCategoryCard}
                >
                  <BudgetCategoryRing
                    label={category.name}
                    allocated={category.allocated}
                    spent={category.spent}
                    currency={currency}
                    size={100}
                    tealColor={Colors.electricTeal}
                    amberColor={Colors.sunKissedAmber}
                  />
                </GlassCard>
              ))}
            </View>
          )}
        </View>

        {/* ============ QUICK-LOG ============ */}
        {budgetCategories.length > 0 && (
          <View style={styles.quickLogSection}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Quick-Log</Text>
            <View style={styles.quickActions}>
              {budgetCategories.slice(0, 4).map((cat, index) => (
                <PressableScale
                  key={cat.id}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
                  style={styles.quickAction}
                  scaleValue={0.93}
                >
                  <LinearGradient
                    colors={[cat.color, cat.color + 'DD']}
                    style={styles.quickActionGradient}
                  >
                    <Ionicons name={cat.icon as any} size={28} color={Colors.white} />
                    <Text style={styles.quickActionText} numberOfLines={1}>{cat.name}</Text>
                  </LinearGradient>
                </PressableScale>
              ))}
            </View>
          </View>
        )}

        {/* ============ MOMENTUM STREAK ============ */}
        <GlassCard animated delay={500} style={styles.momentumStreakCard}>
          <View style={styles.momentumStreakContent}>
            <View style={styles.momentumStreakLeft}>
              <View style={styles.streakFireWrap}>
                <Svg width={52} height={52} viewBox="0 0 52 52">
                  <Defs>
                    <SvgGradient id="fireGrad" x1="0" y1="0" x2="0" y2="1">
                      <Stop offset="0" stopColor="#F59E0B" stopOpacity="0.9" />
                      <Stop offset="0.5" stopColor="#EF4444" stopOpacity="0.7" />
                      <Stop offset="1" stopColor="#E11D48" stopOpacity="0.4" />
                    </SvgGradient>
                  </Defs>
                  <Rect x="0" y="0" width="52" height="52" rx="16" fill="url(#fireGrad)" />
                </Svg>
                <View style={styles.streakEmojiOverlay}>
                  <Text style={styles.streakEmojiLarge}>{'\uD83D\uDD25'}</Text>
                </View>
              </View>
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
            <View style={[styles.streakDotsContainer, { borderTopColor: Colors.glassBorder }]}>
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

      {/* ============ LOG SPENDING MODAL ============ */}
      <Modal
        visible={showLogSpendingModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogSpendingModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.darkPurple : Colors.white, borderColor: Colors.glassBorder }]}>
            <View style={[styles.modalHandle, { backgroundColor: Colors.tertiaryText }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Log Spending</Text>
              <PressableScale onPress={() => setShowLogSpendingModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.tertiaryText} />
              </PressableScale>
            </View>

            {/* Current Status */}
            <View style={[styles.logStatusCard, {
              backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
              borderColor: Colors.glassBorder,
            }]}>
              <View style={styles.logStatusRow}>
                <Text style={[styles.logStatusLabel, { color: Colors.tertiaryText }]}>Today&apos;s Limit</Text>
                <Text style={[styles.logStatusValue, { color: Colors.electricTeal }]}>
                  {formatCurrency(currency, todayEffectiveLimit)}
                </Text>
              </View>
              <View style={styles.logStatusRow}>
                <Text style={[styles.logStatusLabel, { color: Colors.tertiaryText }]}>Already Spent</Text>
                <Text style={[styles.logStatusValue, { color: Colors.primaryText }]}>
                  {formatCurrency(currency, todayTotalSpent)}
                </Text>
              </View>
              <View style={[styles.logStatusDivider, { backgroundColor: Colors.glassBorder }]} />
              <View style={styles.logStatusRow}>
                <Text style={[styles.logStatusLabelBold, { color: Colors.primaryText }]}>Remaining</Text>
                <Text style={[styles.logStatusValueBold, {
                  color: isUnderBudget ? Colors.glowingGreen : Colors.radiantMagenta,
                }]}>
                  {formatCurrency(currency, todayRemaining)}
                </Text>
              </View>
            </View>

            <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Amount Spent</Text>
            <View style={[styles.budgetInputField, {
              backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
              borderColor: Colors.glassBorder,
            }]}>
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
              <View style={[styles.spendingPreview, {
                backgroundColor: isDark ? 'rgba(45, 27, 61, 0.4)' : Colors.lightCream + '80',
                borderColor: Colors.glassBorder,
              }]}>
                <Ionicons
                  name={parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit ? 'checkmark-circle' : 'warning'}
                  size={18}
                  color={parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit ? Colors.glowingGreen : Colors.sunKissedAmber}
                />
                <Text style={[styles.spendingPreviewText, {
                  color: parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit ? Colors.glowingGreen : Colors.sunKissedAmber,
                }]}>
                  {parseFloat(spendingAmount) + todayTotalSpent <= todayEffectiveLimit
                    ? `Still under budget \u2014 ${formatCurrency(currency, todayRemaining - parseFloat(spendingAmount))} left`
                    : `Over budget by ${formatCurrency(currency, parseFloat(spendingAmount) + todayTotalSpent - todayEffectiveLimit)}`
                  }
                </Text>
              </View>
            )}

            <PressableScale
              onPress={handleLogSpending}
              style={styles.saveButton}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Log Spending</Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </View>
      </Modal>

      {/* ============ BUDGET ALLOCATION MODAL ============ */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.darkPurple : Colors.white, borderColor: Colors.glassBorder }]}>
            <View style={[styles.modalHandle, { backgroundColor: Colors.tertiaryText }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Set Budget</Text>
              <PressableScale onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.tertiaryText} />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {budgetCategories.map((category, index) => (
                <View key={category.id} style={styles.budgetInputRow}>
                  <View style={styles.budgetInputHeader}>
                    <View style={styles.budgetInputLabelRow}>
                      <View style={[styles.budgetItemIconWrap, { backgroundColor: category.color + '20' }]}>
                        <Ionicons name={category.icon as any} size={18} color={category.color} />
                      </View>
                      <Text style={[styles.budgetInputName, { color: Colors.primaryText }]}>
                        {category.name}
                      </Text>
                    </View>
                    <PressableScale
                      onPress={() => handleDeleteBudgetItem(category.id)}
                      style={styles.deleteItemButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </PressableScale>
                  </View>
                  <View style={[styles.budgetInputField, {
                    backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                    borderColor: Colors.glassBorder,
                  }]}>
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

            <PressableScale
              onPress={handleSaveBudgetAllocations}
              style={styles.saveButton}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </View>
      </Modal>

      {/* ============ ADD BUDGET ITEM MODAL ============ */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: isDark ? Colors.darkPurple : Colors.white, borderColor: Colors.glassBorder }]}>
            <View style={[styles.modalHandle, { backgroundColor: Colors.tertiaryText }]} />

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>New Budget Item</Text>
              <PressableScale onPress={() => setShowAddItemModal(false)}>
                <Ionicons name="close-circle" size={28} color={Colors.tertiaryText} />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Item Name</Text>
                <TextInput
                  style={[styles.textInput, {
                    backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                    borderColor: Colors.glassBorder,
                    color: Colors.primaryText,
                  }]}
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
                    <PressableScale
                      key={item.icon}
                      onPress={() => {
                        setNewItemIcon(item.icon);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.iconOption,
                        {
                          backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                          borderColor: Colors.glassBorder,
                        },
                        newItemIcon === item.icon && {
                          borderColor: Colors.electricTeal,
                          borderWidth: 2,
                          backgroundColor: Colors.electricTeal + '15',
                        },
                      ]}
                      scaleValue={0.9}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={newItemIcon === item.icon ? Colors.electricTeal : Colors.tertiaryText}
                      />
                    </PressableScale>
                  ))}
                </View>
              </View>

              {/* Color Selection */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Choose Color</Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => (
                    <PressableScale
                      key={color}
                      onPress={() => {
                        setNewItemColor(color);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newItemColor === color && styles.colorOptionSelected,
                      ]}
                      scaleValue={0.88}
                    >
                      {newItemColor === color && (
                        <Ionicons name="checkmark" size={20} color={Colors.white} />
                      )}
                    </PressableScale>
                  ))}
                </View>
              </View>

              {/* Allocation Amount */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Allocate Money (Optional)</Text>
                <View style={[styles.budgetInputField, {
                  backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                  borderColor: Colors.glassBorder,
                }]}>
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
                <View style={[styles.previewCard, {
                  backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                  borderColor: Colors.glassBorder,
                }]}>
                  <View style={[styles.previewIcon, { backgroundColor: newItemColor + '20' }]}>
                    <Ionicons name={newItemIcon as any} size={32} color={newItemColor} />
                  </View>
                  <Text style={[styles.previewText, { color: Colors.primaryText }]}>
                    {newItemName || 'Budget Item Name'}
                  </Text>
                  {newItemAllocation && parseFloat(newItemAllocation) > 0 && (
                    <Text style={[styles.previewAllocation, { color: Colors.electricTeal }]}>
                      {formatCurrency(currency, parseFloat(newItemAllocation))} allocated
                    </Text>
                  )}
                </View>
              </View>
            </ScrollView>

            <PressableScale
              onPress={handleAddBudgetItem}
              style={styles.saveButton}
              scaleValue={0.97}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Create Budget Item</Text>
              </LinearGradient>
            </PressableScale>
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xxl,
    gap: Spacing.md,
  },
  errorIconWrap: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  errorText: {
    ...Typography.titleLarge,
    textAlign: 'center',
    marginTop: Spacing.sm,
  },
  errorSubtext: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: Spacing.md,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.md,
  },
  retryButtonText: {
    color: '#FFFFFF',
    ...Typography.titleSmall,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  greeting: {
    ...Typography.headlineLarge,
  },
  subtitle: {
    ...Typography.titleSmall,
    marginTop: Spacing.xs,
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

  // Daily Spending Card
  dailySpendingCard: {
    marginBottom: Spacing.md,
  },
  dailySpendingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  dailySpendingLabel: {
    ...Typography.titleMedium,
    marginBottom: Spacing.xs,
  },
  dailySpendingDate: {
    ...Typography.labelMedium,
  },
  dailySpendingAmounts: {
    alignItems: 'flex-end',
  },
  dailySpendingValue: {
    ...Typography.displaySmall,
    marginBottom: Spacing.xs,
  },
  rolloverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
  },
  rolloverText: {
    ...Typography.labelMedium,
  },

  // Progress Bar with Neon Glow
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarGlow: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },

  // Status
  dailyStatusContainer: {
    alignItems: 'flex-start',
  },
  dailyStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dailyStatusText: {
    ...Typography.titleSmall,
  },

  // Metrics
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  metricCard: {
    flex: 1,
    alignItems: 'center',
  },
  metricIconBg: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  metricValue: {
    ...Typography.headlineSmall,
    marginBottom: Spacing.xs,
  },
  metricLabel: {
    ...Typography.labelMedium,
  },

  // Log Spending Button
  logSpendingButton: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  logSpendingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  logSpendingText: {
    ...Typography.titleMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Budget Section
  budgetSection: {
    marginBottom: Spacing.lg,
  },
  budgetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  budgetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
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
    ...Typography.headlineSmall,
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  budgetCategoryCard: {
    width: (width - Spacing.lg * 2 - Spacing.md) / 2,
    alignItems: 'center',
  },

  // Quick Log
  quickLogSection: {
    marginBottom: Spacing.lg,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
  },
  quickAction: {
    width: (width - Spacing.lg * 2 - Spacing.md * 3) / 4,
    borderRadius: BorderRadius.lg,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  quickActionGradient: {
    padding: Spacing.md,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickActionText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Momentum Streak
  momentumStreakCard: {
    marginBottom: Spacing.lg,
  },
  momentumStreakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  momentumStreakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  streakFireWrap: {
    width: 52,
    height: 52,
    position: 'relative',
  },
  streakEmojiOverlay: {
    ...StyleSheet.absoluteFillObject,
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
    ...Typography.titleMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  momentumStreakSubtitle: {
    ...Typography.bodySmall,
  },
  momentumStreakRight: {
    alignItems: 'center',
    paddingLeft: Spacing.md,
  },
  momentumStreakValue: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -1,
  },
  momentumStreakLabel: {
    ...Typography.labelSmall,
    marginTop: 2,
  },
  streakDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
  },
  streakDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  streakDotsMore: {
    ...Typography.labelMedium,
    fontWeight: '700',
    marginLeft: 2,
  },

  // Shared Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl + 8,
    borderTopRightRadius: BorderRadius.xxl + 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    paddingBottom: Spacing.xxl,
    maxHeight: '85%',
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: Spacing.md,
    opacity: 0.4,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    ...Typography.headlineMedium,
  },

  // Log Spending Modal
  logStatusCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginBottom: Spacing.lg,
  },
  logStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  logStatusLabel: {
    ...Typography.bodyMedium,
  },
  logStatusValue: {
    ...Typography.titleMedium,
  },
  logStatusDivider: {
    height: 1,
    marginVertical: Spacing.sm,
  },
  logStatusLabelBold: {
    ...Typography.titleSmall,
    fontWeight: '700',
  },
  logStatusValueBold: {
    ...Typography.titleLarge,
    fontWeight: '800',
  },
  spendingPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    marginTop: Spacing.md,
  },
  spendingPreviewText: {
    ...Typography.labelLarge,
    flex: 1,
  },

  // Budget Modal Items
  budgetInputRow: {
    marginBottom: Spacing.lg,
  },
  budgetInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  budgetInputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  budgetItemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetInputName: {
    ...Typography.titleMedium,
  },
  budgetInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
  },
  currencySymbol: {
    ...Typography.headlineSmall,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  budgetInput: {
    flex: 1,
    ...Typography.headlineSmall,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  saveButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 14,
    elevation: 8,
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  saveButtonText: {
    ...Typography.titleLarge,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  // Add Budget Item Modal
  inputSection: {
    marginBottom: Spacing.lg,
  },
  inputLabel: {
    ...Typography.titleSmall,
    marginBottom: Spacing.md,
  },
  textInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.bodyLarge,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
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
    marginBottom: Spacing.md,
  },
  previewCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
    gap: Spacing.md,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    ...Typography.titleLarge,
    fontWeight: '700',
  },
  previewAllocation: {
    ...Typography.titleSmall,
    marginTop: Spacing.sm,
  },
});
