import React, { useEffect, useState, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows, Animation } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { EmptyState } from '@/components/EmptyState';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import { WealthPortalCard } from '@/components/WealthPortalCard';
import { SmartActionBar } from '@/components/SmartActionBar';
import { BentoGrid } from '@/components/BentoGrid';
import { ExpenseCategory, Expense } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

// ─── Quick-Log Category Definitions ──────────────────────────────────────────
const QUICK_CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  darkColor: string;
}[] = [
    { key: 'groceries', label: 'Groceries', icon: 'cart', color: '#10B981', darkColor: '#10B981' },
    { key: 'kids', label: 'Kids', icon: 'happy', color: '#A855F7', darkColor: '#A855F7' },
    { key: 'home', label: 'Home', icon: 'home', color: '#F59E0B', darkColor: '#F59E0B' },
    { key: 'self-care', label: 'Self-Care', icon: 'heart', color: '#EC4899', darkColor: '#EC4899' },
    { key: 'transport', label: 'Transport', icon: 'car', color: '#3B82F6', darkColor: '#3B82F6' },
    { key: 'dining', label: 'Dining', icon: 'restaurant', color: '#EF4444', darkColor: '#EF4444' },
  ];

// ─── All Categories for Modal ────────────────────────────────────────────────
const ALL_CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
}[] = [
    { key: 'groceries', label: 'Groceries', icon: 'cart', color: '#10B981' },
    { key: 'kids', label: 'Kids', icon: 'happy', color: '#A855F7' },
    { key: 'home', label: 'Home', icon: 'home', color: '#F59E0B' },
    { key: 'self-care', label: 'Self-Care', icon: 'heart', color: '#EC4899' },
    { key: 'transport', label: 'Transport', icon: 'car', color: '#3B82F6' },
    { key: 'dining', label: 'Dining', icon: 'restaurant', color: '#EF4444' },
    { key: 'entertainment', label: 'Fun', icon: 'game-controller', color: '#8B5CF6' },
    { key: 'health', label: 'Health', icon: 'medkit', color: '#14B8A6' },
    { key: 'education', label: 'Education', icon: 'school', color: '#6366F1' },
    { key: 'other', label: 'Other', icon: 'pricetag', color: '#6B7280' },
  ];

// ─── Currency Formatter ──────────────────────────────────────────────────────
const formatCurrency = (currency: string, value: number): string => {
  return `${currency}${Math.abs(value).toFixed(2)}`;
};

// ─── Time-based greeting ─────────────────────────────────────────────────────
const getGreeting = (): string => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good Morning';
  if (hour < 18) return 'Good Afternoon';
  return 'Good Evening';
};

// =============================================================================
// HOME SCREEN COMPONENT
// =============================================================================
export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const {
    profile,
    financialData,
    rolloverState,
    todayExpenses,
    isLoading,
    isRefreshing,
    spendableToday,
    dailyAllowance,
    momentumStreak,
    wellnessScore,
    actions,
  } = useFinancialData();

  // ─── Local State ───────────────────────────────────────────────────────────
  const [showLogModal, setShowLogModal] = useState(false);
  const [spendingAmount, setSpendingAmount] = useState('');
  const [spendingDescription, setSpendingDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ExpenseCategory>('other');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Animation Refs ────────────────────────────────────────────────────────
  const heroScaleAnim = useRef(new Animated.Value(0.95)).current;
  const heroOpacityAnim = useRef(new Animated.Value(0)).current;
  const dailyWinAnim = useRef(new Animated.Value(0)).current;
  const coachButtonPulse = useRef(new Animated.Value(1)).current;
  const coachButtonGlow = useRef(new Animated.Value(0.4)).current;
  const router = useRouter();

  // ─── Entrance Animations ──────────────────────────────────────────────────
  useEffect(() => {
    if (!isLoading) {
      Animated.parallel([
        Animated.spring(heroScaleAnim, {
          toValue: 1,
          tension: 60,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(heroOpacityAnim, {
          toValue: 1,
          duration: Animation.entrance,
          useNativeDriver: true,
        }),
      ]).start();

      // Daily win bounce (always animate, visibility controlled by render)
      Animated.sequence([
        Animated.delay(600),
        Animated.spring(dailyWinAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [isLoading, heroScaleAnim, heroOpacityAnim, dailyWinAnim]);

  // ─── Floating Coach Button Breathing Animation ────────────────────────────
  useEffect(() => {
    // Breathing pulse animation
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coachButtonPulse, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(coachButtonPulse, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Glow animation
    const glowLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(coachButtonGlow, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(coachButtonGlow, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    );

    pulseLoop.start();
    glowLoop.start();

    return () => {
      pulseLoop.stop();
      glowLoop.stop();
    };
  }, [coachButtonPulse, coachButtonGlow]);

  // ─── Derived Values ────────────────────────────────────────────────────────
  const currency = profile?.currency || financialData?.currency || '\u00A3';
  const todayEffectiveLimit = rolloverState?.todayEntry?.effectiveLimit ?? dailyAllowance;
  const todayTotalSpent = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);
  const todayRemaining = todayEffectiveLimit - todayTotalSpent;
  const tomorrowForecast = rolloverState?.tomorrowForecast ?? dailyAllowance;
  const isUnderBudget = todayTotalSpent <= todayEffectiveLimit;
  const burnRate = todayEffectiveLimit > 0
    ? Math.round((todayTotalSpent / todayEffectiveLimit) * 100)
    : 0;

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenLogModal = useCallback((category?: ExpenseCategory) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedCategory(category || 'other');
    setSpendingAmount('');
    setSpendingDescription('');
    setShowLogModal(true);
  }, []);

  const handleLogSpending = useCallback(async () => {
    const amount = parseFloat(spendingAmount);
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid spending amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const success = await actions.addExpense({
        amount,
        category: selectedCategory,
        description: spendingDescription.trim() || undefined,
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setSpendingAmount('');
        setSpendingDescription('');
        setShowLogModal(false);
      } else {
        Alert.alert('Error', 'Failed to log spending. Please try again.');
      }
    } catch (logError) {
      console.error('Failed to log spending:', logError);
      Alert.alert('Error', 'Failed to log spending. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [spendingAmount, spendingDescription, selectedCategory, actions]);

  const handleDeleteExpense = useCallback((expense: Expense) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Delete Expense',
      `Remove ${formatCurrency(currency, expense.amount)} ${expense.description || expense.category}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const success = await actions.deleteExpense(expense.id);
            if (success) {
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            } else {
              Alert.alert('Error', 'Failed to delete expense.');
            }
          },
        },
      ]
    );
  }, [currency, actions]);

  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await actions.refreshAll();
  }, [actions]);

  const handleOpenCoach = useCallback(async () => {
    // Triple-tap haptic pattern for premium consultation feel
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 50);
    setTimeout(async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    }, 100);

    router.push('/coach-chat');
  }, [router]);

  const getDailyWinMessage = (): string => {
    const remaining = todayRemaining;
    if (remaining >= todayEffectiveLimit * 0.5) return 'Crushing it! Over 50% remaining!';
    if (remaining >= todayEffectiveLimit * 0.25) return 'Looking great! Staying disciplined.';
    if (remaining > 0) return 'Under budget! Keep the momentum.';
    return '';
  };

  const getCategoryIcon = (category: string): keyof typeof Ionicons.glyphMap => {
    const found = ALL_CATEGORIES.find((c) => c.key === category);
    return found?.icon || 'pricetag';
  };

  const getCategoryLabel = (category: string): string => {
    const found = ALL_CATEGORIES.find((c) => c.key === category);
    return found?.label || 'Other';
  };

  const getCategoryColor = (category: string): string => {
    const found = ALL_CATEGORIES.find((c) => c.key === category);
    return found?.color || '#6B7280';
  };

  const formatTime = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <DashboardSkeleton />
      </LinearGradient>
    );
  }

  // ─── Error / Empty Financial Data State ────────────────────────────────────
  if (!financialData) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <View style={[styles.errorIconWrap, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.12)' : 'rgba(225, 29, 72, 0.08)' }]}>
            <Ionicons name="alert-circle-outline" size={56} color={Colors.radiantMagenta} />
          </View>
          <Text style={[styles.errorText, { color: Colors.primaryText }]}>
            Setup Required
          </Text>
          <Text style={[styles.errorSubtext, { color: Colors.tertiaryText }]}>
            Please complete your financial blueprint to get started.
          </Text>
          <PressableScale
            onPress={handleRefresh}
            style={[styles.retryButton, { backgroundColor: Colors.electricTeal }]}
          >
            <Text style={styles.coachButtonText}>DIY Coach</Text>
          </PressableScale>
        </View>
      </LinearGradient>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={Gradients.mesh} style={styles.container} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.electricTeal}
            progressBackgroundColor={Colors.cardBackground}
          />
        }
      >
        {/* ════════ HEADER ════════ */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Text style={[styles.headerBrand, { color: Colors.electricTeal }]}>
              Grit
            </Text>
            <Text style={[styles.greeting, { color: Colors.primaryText }]}>
              {getGreeting()}, {profile?.name || 'Boss'}
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

        {/* ════════ HERO: WEALTH PORTAL CARD ════════ */}
        <Animated.View style={{ opacity: heroOpacityAnim, transform: [{ scale: heroScaleAnim }] }}>
          <WealthPortalCard
            spendableToday={spendableToday}
            totalLimit={todayEffectiveLimit}
            currency={currency}
          />
        </Animated.View>

        {/* ════════ ACTION BAR: QUICK LOG & CTA ════════ */}
        <SmartActionBar
          categories={QUICK_CATEGORIES}
          onLogPress={() => handleOpenLogModal()}
          onCategoryPress={(key) => handleOpenLogModal(key as any)}
        />

        {/* ════════ BENTO GRID: STATS ════════ */}
        <BentoGrid
          streakDays={momentumStreak}
          burnRate={burnRate}
          forecast={tomorrowForecast}
          currency={currency}
        />

        {/* ════════ DAILY WIN (Celebration) ════════ */}
        {isUnderBudget && todayTotalSpent > 0 && (
          <Animated.View style={{
            opacity: dailyWinAnim,
            transform: [{ scale: dailyWinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
            marginTop: -Spacing.md, // Pull up closer to grid
            marginBottom: Spacing.lg
          }}>
            <GlassCard animated delay={100} style={styles.dailyWinCard}>
              <LinearGradient
                colors={isDark ? ['rgba(16, 185, 129, 0.08)', 'rgba(45, 212, 191, 0.04)'] : ['rgba(16, 185, 129, 0.06)', 'rgba(20, 184, 166, 0.03)']}
                style={styles.dailyWinGradient}
              >
                <View style={styles.dailyWinContent}>
                  <Ionicons name="star" size={28} color={Colors.sunKissedAmber} />
                  <View style={styles.dailyWinTextContainer}>
                    <Text style={[styles.dailyWinTitle, { color: Colors.glowingGreen }]}>
                      Daily Win!
                    </Text>
                    <Text style={[styles.dailyWinMessage, { color: Colors.secondaryText }]}>
                      {getDailyWinMessage()}
                    </Text>
                  </View>
                  <View style={[styles.dailyWinBadge, { backgroundColor: isDark ? 'rgba(16, 185, 129, 0.15)' : 'rgba(16, 185, 129, 0.1)' }]}>
                    <Ionicons name="trending-up" size={18} color={Colors.glowingGreen} />
                  </View>
                </View>
              </LinearGradient>
            </GlassCard>
          </Animated.View>
        )}

        {/* ════════ TODAY'S TRANSACTIONS FEED ════════ */}
        <View style={styles.transactionSection}>
          <View style={styles.transactionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
              Today&apos;s Spending
            </Text>
            {todayExpenses.length > 0 && (
              <View style={[styles.transactionCount, { backgroundColor: Colors.electricTeal + '20' }]}>
                <Text style={[styles.transactionCountText, { color: Colors.electricTeal }]}>
                  {todayExpenses.length}
                </Text>
              </View>
            )}
          </View>

          {todayExpenses.length === 0 ? (
            <GlassCard animated delay={500}>
              <EmptyState
                icon="receipt-outline"
                iconColor={Colors.electricTeal}
                title="No Expenses Yet"
                description="Tap 'Log' above or use Quick Action to track your first expense today."
                actionLabel="Log First Expense"
                onAction={() => handleOpenLogModal()}
                gradientColors={[Colors.electricTeal, Colors.glowingGreen]}
              />
            </GlassCard>
          ) : (
            <View style={styles.transactionList}>
              {todayExpenses
                .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                .map((expense, index) => (
                  <GlassCard key={expense.id} animated delay={500 + index * 60} style={styles.transactionCard}>
                    <View style={styles.transactionRow}>
                      <View style={styles.transactionLeft}>
                        <View style={[
                          styles.transactionIconWrap,
                          { backgroundColor: getCategoryColor(expense.category) + '18' },
                        ]}>
                          <Ionicons name={getCategoryIcon(expense.category)} size={20} color={getCategoryColor(expense.category)} />
                        </View>
                        <View style={styles.transactionDetails}>
                          <Text style={[styles.transactionName, { color: Colors.primaryText }]} numberOfLines={1}>
                            {expense.description || getCategoryLabel(expense.category)}
                          </Text>
                          <Text style={[styles.transactionMeta, { color: Colors.tertiaryText }]}>
                            {getCategoryLabel(expense.category)} {'\u00B7'} {formatTime(expense.createdAt)}
                          </Text>
                        </View>
                      </View>
                      <View style={styles.transactionRight}>
                        <Text style={[styles.transactionAmount, { color: Colors.radiantMagenta }]}>
                          -{formatCurrency(currency, expense.amount)}
                        </Text>
                        <PressableScale
                          onPress={() => handleDeleteExpense(expense)}
                          style={[
                            styles.deleteButton,
                            { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : 'rgba(239, 68, 68, 0.06)' },
                          ]}
                          scaleValue={0.88}
                        >
                          <Ionicons name="trash-outline" size={14} color={Colors.error} />
                        </PressableScale>
                      </View>
                    </View>
                  </GlassCard>
                ))}
            </View>
          )}
        </View>

      </ScrollView>

      {/* ════════ LOG SPENDING MODAL ════════ */}
      <Modal
        visible={showLogModal}
        animationType="fade"
        transparent
        onRequestClose={() => setShowLogModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            {/* 100% Blur Background */}
            <PressableScale
              onPress={() => setShowLogModal(false)}
              style={StyleSheet.absoluteFill}
              haptic={false}
            >
              <BlurView intensity={Platform.OS === 'ios' ? 80 : 50} style={StyleSheet.absoluteFill} tint={isDark ? 'dark' : 'light'} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: isDark ? 'rgba(0,0,0,0.7)' : 'rgba(255,255,255,0.7)' }]} />
            </PressableScale>

            <Animated.View style={styles.modalContent}>
              <GlassCard style={[styles.modalCard, { backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)' }]}>
                <View style={styles.modalHeader}>
                  <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>
                    Log Expense
                  </Text>
                  <PressableScale
                    onPress={() => setShowLogModal(false)}
                    style={[styles.closeButton, { backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }]}
                  >
                    <Ionicons name="close" size={20} color={Colors.secondaryText} />
                  </PressableScale>
                </View>

                {/* Amount Input */}
                <View style={styles.inputContainer}>
                  <Text style={[styles.currencyPrefix, { color: Colors.electricTeal }]}>{currency}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: Colors.primaryText }]}
                    placeholder="0.00"
                    placeholderTextColor={Colors.tertiaryText}
                    keyboardType="decimal-pad"
                    value={spendingAmount}
                    onChangeText={setSpendingAmount}
                    autoFocus
                  />
                </View>

                {/* Category Selection */}
                <Text style={[styles.inputLabel, { color: Colors.secondaryText }]}>Category</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                  {ALL_CATEGORIES.map((cat) => (
                    <PressableScale
                      key={cat.key}
                      onPress={() => setSelectedCategory(cat.key)}
                      style={[
                        styles.categoryChip,
                        selectedCategory === cat.key && { backgroundColor: cat.color + '20', borderColor: cat.color },
                        { borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)' }
                      ]}
                    >
                      <Ionicons
                        name={cat.icon}
                        size={16}
                        color={selectedCategory === cat.key ? cat.color : Colors.tertiaryText}
                      />
                      <Text
                        style={[
                          styles.categoryChipText,
                          { color: selectedCategory === cat.key ? cat.color : Colors.secondaryText }
                        ]}
                      >
                        {cat.label}
                      </Text>
                    </PressableScale>
                  ))}
                </ScrollView>

                {/* Description Input */}
                <Text style={[styles.inputLabel, { color: Colors.secondaryText, marginTop: Spacing.md }]}>
                  Note (Optional)
                </Text>
                <TextInput
                  style={[
                    styles.descriptionInput,
                    {
                      backgroundColor: isDark ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.03)',
                      color: Colors.primaryText,
                      borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)'
                    }
                  ]}
                  placeholder="What's this for?"
                  placeholderTextColor={Colors.tertiaryText}
                  value={spendingDescription}
                  onChangeText={setSpendingDescription}
                />

                {/* Submit Button */}
                <PressableScale
                  onPress={handleLogSpending}
                  disabled={isSubmitting}
                  style={[
                    styles.submitButton,
                    { backgroundColor: Colors.electricTeal, opacity: isSubmitting ? 0.7 : 1 }
                  ]}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>Logging...</Text>
                  ) : (
                    <Text style={styles.submitButtonText}>Log Expense</Text>
                  )}
                </PressableScale>
              </GlassCard>
            </Animated.View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════ FLOATING AI COACH BUTTON ════════ */}
      <Animated.View
        style={[
          styles.floatingCoachButtonContainer, // New style for positioning
          {
            bottom: insets.bottom + 100,
            transform: [{ scale: coachButtonPulse }], // Native Driver Animation
          },
        ]}
        nativeID="floating-coach-icon"
      >
        <Animated.View
          style={[
            styles.floatingCoachButtonShadow, // New style for shadow
            {
              shadowColor: Colors.electricTeal,
              shadowOffset: { width: 0, height: 8 },
              shadowRadius: 24,
              shadowOpacity: coachButtonGlow as any, // JS Driver Animation
              elevation: 12,
            }
          ]}
        >
          <PressableScale onPress={handleOpenCoach} scaleValue={0.92}>
            <BlurView
              intensity={isDark ? 50 : 30}
              tint={isDark ? 'dark' : 'light'}
              style={[
                styles.floatingCoachBlur,
                {
                  borderColor: isDark ? 'rgba(45, 212, 191, 0.4)' : 'rgba(20, 184, 166, 0.3)',
                },
              ]}
            >
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : 'rgba(255, 255, 255, 0.9)',
                    borderRadius: 30,
                  },
                ]}
              />
              <LinearGradient
                colors={
                  isDark
                    ? ['rgba(45, 212, 191, 0.15)', 'rgba(45, 212, 191, 0.05)']
                    : ['rgba(20, 184, 166, 0.1)', 'rgba(20, 184, 166, 0.02)']
                }
                style={styles.floatingCoachGradient}
              >
                <Ionicons
                  name="chatbubble-ellipses"
                  size={28}
                  color={isDark ? Colors.white : Colors.silverGrey}
                />
              </LinearGradient>
            </BlurView>
          </PressableScale>
        </Animated.View>
      </Animated.View>
    </LinearGradient>
  );
}

// =============================================================================
// STYLES
// =============================================================================
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerBrand: {
    fontSize: 28,
    fontFamily: 'Outfit-Bold',
    letterSpacing: -0.5,
  },
  greeting: {
    fontSize: 15,
    fontFamily: 'Outfit-Medium',
    marginTop: 2,
    opacity: 0.8,
  },
  notificationButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.round,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },

  // Daily Win
  dailyWinCard: {
    padding: 0,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    height: 80,
    justifyContent: 'center',
  },
  dailyWinGradient: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'center',
  },
  dailyWinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dailyWinTextContainer: {
    flex: 1,
  },
  dailyWinTitle: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
    marginBottom: 2,
  },
  dailyWinMessage: {
    fontSize: 13,
    fontFamily: 'Outfit-Medium',
  },
  dailyWinBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Transactions
  transactionSection: {
    marginTop: Spacing.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },
  transactionCount: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  transactionCountText: {
    fontSize: 12,
    fontFamily: 'Outfit-Bold',
  },
  transactionList: {
    gap: Spacing.sm,
  },
  transactionCard: {
    padding: Spacing.md,
    marginBottom: 0,
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  transactionIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    fontSize: 16,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: 2,
  },
  transactionMeta: {
    fontSize: 12,
    fontFamily: 'Outfit-Medium',
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: 4,
  },
  transactionAmount: {
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },
  deleteButton: {
    padding: 6,
    borderRadius: 10,
  },

  // Error State
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
  coachButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Outfit-Bold',
  },

  // Modal
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    width: '100%',
    padding: Spacing.md,
  },
  modalCard: {
    borderRadius: 24,
    padding: Spacing.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  modalTitle: {
    fontSize: 20,
    fontFamily: 'Outfit-Bold',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.lg,
  },
  currencyPrefix: {
    fontSize: 32,
    fontFamily: 'Outfit-Bold',
    marginRight: 4,
  },
  amountInput: {
    fontSize: 48,
    fontFamily: 'Outfit-Bold',
    minWidth: 100,
  },
  inputLabel: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
    marginBottom: Spacing.sm,
  },
  categoryScroll: {
    flexGrow: 0,
    marginBottom: Spacing.md,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: Spacing.sm,
    gap: 6,
  },
  categoryChipText: {
    fontSize: 14,
    fontFamily: 'Outfit-SemiBold',
  },
  descriptionInput: {
    height: 50,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    borderWidth: 1,
    fontSize: 16,
    fontFamily: 'Outfit-Medium',
    marginBottom: Spacing.xl,
  },
  submitButton: {
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Outfit-Bold',
  },

  // Floating Coach
  floatingCoachButtonContainer: {
    position: 'absolute',
    right: Spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 50,
  },
  floatingCoachButtonShadow: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'transparent', // Shadow needs background color often but here we use shadow props
    // Elevation requires background color on Android usually
  },
  floatingCoachBlur: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1,
  },
  floatingCoachGradient: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
