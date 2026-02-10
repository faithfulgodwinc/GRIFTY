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
import { ExpenseCategory, Expense } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';
import { BlurView } from 'expo-blur';
import { useRouter } from 'expo-router';

// ─── Quick-Log Category Definitions ──────────────────────────────────────────
const QUICK_CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
  darkColor: string;
}[] = [
  { key: 'groceries', label: 'Groceries', emoji: '\uD83D\uDED2', color: '#10B981', darkColor: '#10B981' },
  { key: 'kids', label: 'Kids', emoji: '\uD83D\uDC76', color: '#A855F7', darkColor: '#A855F7' },
  { key: 'home', label: 'Home', emoji: '\uD83C\uDFE0', color: '#F59E0B', darkColor: '#F59E0B' },
  { key: 'self-care', label: 'Self-Care', emoji: '\uD83D\uDC86\u200D\u2640\uFE0F', color: '#EC4899', darkColor: '#EC4899' },
];

// ─── All Categories for Modal ────────────────────────────────────────────────
const ALL_CATEGORIES: {
  key: ExpenseCategory;
  label: string;
  emoji: string;
  color: string;
}[] = [
  { key: 'groceries', label: 'Groceries', emoji: '\uD83D\uDED2', color: '#10B981' },
  { key: 'kids', label: 'Kids', emoji: '\uD83D\uDC76', color: '#A855F7' },
  { key: 'home', label: 'Home', emoji: '\uD83C\uDFE0', color: '#F59E0B' },
  { key: 'self-care', label: 'Self-Care', emoji: '\uD83D\uDC86\u200D\u2640\uFE0F', color: '#EC4899' },
  { key: 'transport', label: 'Transport', emoji: '\uD83D\uDE97', color: '#3B82F6' },
  { key: 'dining', label: 'Dining', emoji: '\uD83C\uDF7D\uFE0F', color: '#EF4444' },
  { key: 'entertainment', label: 'Fun', emoji: '\uD83C\uDFAC', color: '#8B5CF6' },
  { key: 'health', label: 'Health', emoji: '\uD83D\uDC8A', color: '#14B8A6' },
  { key: 'education', label: 'Education', emoji: '\uD83D\uDCDA', color: '#6366F1' },
  { key: 'other', label: 'Other', emoji: '\uD83D\uDCCC', color: '#6B7280' },
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

// ─── Wellness Score Ring ─────────────────────────────────────────────────────
function WellnessRing({
  score,
  size = 100,
  strokeWidth = 8,
}: {
  score: number;
  size?: number;
  strokeWidth?: number;
}) {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedScore = Math.max(0, Math.min(score, 100));

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: clampedScore,
      duration: 1200,
      useNativeDriver: false,
    }).start();
  }, [clampedScore, animatedValue]);

  const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgGradient id="wellnessGrad" x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0%" stopColor="#2DD4BF" />
            <Stop offset="50%" stopColor="#A855F7" />
            <Stop offset="100%" stopColor="#EC4899" />
          </SvgGradient>
        </Defs>
        {/* Background track */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="rgba(255,255,255,0.08)"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress arc */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="url(#wellnessGrad)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={`${circumference}`}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={StyleSheet.absoluteFill as any}>
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
          <Text style={styles.wellnessScoreValue}>{clampedScore}</Text>
          <Text style={styles.wellnessScoreLabel}>Score</Text>
        </View>
      </View>
    </View>
  );
}

// ─── Animated Progress Bar ───────────────────────────────────────────────────
function AnimatedProgressBar({
  percentage,
  isUnderBudget,
  colors,
  gradients,
  isDark,
}: {
  percentage: number;
  isUnderBudget: boolean;
  colors: ReturnType<typeof getThemeColors>;
  gradients: ReturnType<typeof getGradients>;
  isDark: boolean;
}) {
  const widthAnim = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: Math.min(percentage, 100),
      duration: 800,
      useNativeDriver: false,
    }).start();
  }, [percentage, widthAnim]);

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 0.8, duration: 1500, useNativeDriver: false }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1500, useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [glowAnim]);

  const animatedWidth = widthAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[
      styles.progressBarContainer,
      { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : colors.lightCream },
    ]}>
      <Animated.View
        style={[
          styles.progressBarGlow,
          {
            width: animatedWidth as any,
            shadowColor: isUnderBudget ? colors.electricTeal : colors.radiantMagenta,
            shadowOpacity: glowAnim,
          },
        ]}
      >
        <LinearGradient
          colors={
            !isUnderBudget
              ? [colors.radiantMagenta, colors.sunKissedAmber]
              : gradients.neonBar
          }
          style={styles.progressBarFill}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        />
      </Animated.View>
    </View>
  );
}

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
  const spendingPercentage = todayEffectiveLimit > 0
    ? Math.min((todayTotalSpent / todayEffectiveLimit) * 100, 100)
    : 0;
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

    // Navigate to coach chat
    router.push('/coach-chat');
  }, [router]);

  const getStreakLabel = (): string => {
    if (momentumStreak === 0) return 'Start your streak!';
    if (momentumStreak === 1) return 'Day';
    return 'Days';
  };

  const getCategoryEmoji = (category: string): string => {
    const found = ALL_CATEGORIES.find((c) => c.key === category);
    return found?.emoji || '\uD83D\uDCCC';
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

  const getDailyWinMessage = (): string => {
    const remaining = todayRemaining;
    if (remaining >= todayEffectiveLimit * 0.5) return 'Crushing it! Over 50% remaining!';
    if (remaining >= todayEffectiveLimit * 0.25) return 'Looking great! Staying disciplined.';
    if (remaining > 0) return 'Under budget! Keep the momentum.';
    return '';
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
            <Text style={styles.retryButtonText}>Retry</Text>
          </PressableScale>
        </View>
      </LinearGradient>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────
  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
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
              Grit: Mom-Boss Edition
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

        {/* ════════ HERO: SPENDABLE TODAY + WELLNESS RING ════════ */}
        <Animated.View style={{ opacity: heroOpacityAnim, transform: [{ scale: heroScaleAnim }] }}>
          <GlassCard animated delay={0} style={styles.heroCard}>
            <View style={styles.heroContent}>
              {/* Left side - Spendable Amount */}
              <View style={styles.heroLeft}>
                <Text style={[styles.heroLabel, { color: Colors.tertiaryText }]}>
                  Spendable Today
                </Text>
                <Text style={[
                  styles.heroAmount,
                  {
                    color: isUnderBudget ? Colors.electricTeal : Colors.radiantMagenta,
                  },
                ]}>
                  {formatCurrency(currency, Math.max(spendableToday, 0))}
                </Text>
                <Text style={[styles.heroDate, { color: Colors.tertiaryText }]}>
                  {new Date().toLocaleDateString('en-GB', {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'short',
                  })}
                </Text>

                {/* Rollover badge */}
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
                      {rolloverState.todayEntry.rolloverFromPrevious > 0 ? '+' : '-'}
                      {formatCurrency(currency, rolloverState.todayEntry.rolloverFromPrevious)} rollover
                    </Text>
                  </View>
                )}
              </View>

              {/* Right side - Wellness Ring */}
              <View style={styles.heroRight}>
                <WellnessRing score={wellnessScore} size={100} strokeWidth={8} />
                <Text style={[styles.wellnessLabel, { color: Colors.tertiaryText }]}>
                  Wellness
                </Text>
              </View>
            </View>

            {/* Neon Glow Progress Bar */}
            <View style={styles.progressSection}>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabelText, { color: Colors.tertiaryText }]}>
                  Spent: {formatCurrency(currency, todayTotalSpent)}
                </Text>
                <Text style={[styles.progressLabelText, { color: Colors.tertiaryText }]}>
                  Limit: {formatCurrency(currency, todayEffectiveLimit)}
                </Text>
              </View>
              <AnimatedProgressBar
                percentage={spendingPercentage}
                isUnderBudget={isUnderBudget}
                colors={Colors}
                gradients={Gradients}
                isDark={isDark}
              />
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
        </Animated.View>

        {/* ════════ DAILY WIN ════════ */}
        {isUnderBudget && todayTotalSpent > 0 && (
          <Animated.View style={{
            opacity: dailyWinAnim,
            transform: [{ scale: dailyWinAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }],
          }}>
            <GlassCard animated delay={100} style={styles.dailyWinCard}>
              <LinearGradient
                colors={isDark ? ['rgba(16, 185, 129, 0.08)', 'rgba(45, 212, 191, 0.04)'] : ['rgba(16, 185, 129, 0.06)', 'rgba(20, 184, 166, 0.03)']}
                style={styles.dailyWinGradient}
              >
                <View style={styles.dailyWinContent}>
                  <Text style={styles.dailyWinEmoji}>{'\u2B50'}</Text>
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

        {/* ════════ QUICK-LOG CATEGORIES ════════ */}
        <View style={styles.quickLogSection}>
          <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Quick Log</Text>
          <View style={styles.quickLogRow}>
            {QUICK_CATEGORIES.map((cat) => (
              <PressableScale
                key={cat.key}
                onPress={() => handleOpenLogModal(cat.key)}
                style={styles.quickLogItem}
                scaleValue={0.93}
              >
                <LinearGradient
                  colors={[cat.color + '20', cat.color + '08']}
                  style={[
                    styles.quickLogIconWrap,
                    { borderColor: cat.color + '30' },
                  ]}
                >
                  <Text style={styles.quickLogEmoji}>{cat.emoji}</Text>
                </LinearGradient>
                <Text style={[styles.quickLogLabel, { color: Colors.secondaryText }]} numberOfLines={1}>
                  {cat.label}
                </Text>
              </PressableScale>
            ))}
          </View>
        </View>

        {/* ════════ LOG SPENDING CTA ════════ */}
        <PressableScale
          onPress={() => handleOpenLogModal()}
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
            <Text style={styles.logSpendingText}>Log Spending</Text>
          </LinearGradient>
        </PressableScale>

        {/* ════════ BURN RATE + TOMORROW FORECAST ROW ════════ */}
        <View style={styles.metricsRow}>
          <GlassCard animated delay={200} style={styles.metricCard}>
            <View style={[styles.metricIconBg, { backgroundColor: isDark ? 'rgba(225, 29, 72, 0.15)' : '#E11D4815' }]}>
              <Ionicons name="speedometer-outline" size={20} color={Colors.radiantMagenta} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.primaryText }]}>
              {burnRate}%
            </Text>
            <Text style={[styles.metricLabel, { color: Colors.tertiaryText }]}>Burn Rate</Text>
          </GlassCard>

          <GlassCard animated delay={300} style={styles.metricCard}>
            <View style={[styles.metricIconBg, { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.15)' : '#A855F715' }]}>
              <Ionicons name="telescope-outline" size={20} color={Colors.amethyst} />
            </View>
            <Text style={[styles.metricValue, { color: Colors.primaryText }]}>
              {formatCurrency(currency, tomorrowForecast)}
            </Text>
            <Text style={[styles.metricLabel, { color: Colors.tertiaryText }]}>Tomorrow</Text>
          </GlassCard>
        </View>

        {/* ════════ MOMENTUM STREAK ════════ */}
        <GlassCard animated delay={400} style={styles.momentumStreakCard}>
          <View style={styles.momentumStreakContent}>
            <View style={styles.momentumStreakLeft}>
              <View style={[
                styles.streakIconWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(245, 158, 11, 0.08)',
                },
              ]}>
                <Text style={styles.streakEmoji}>{'\uD83D\uDD25'}</Text>
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

        {/* ════════ TOMORROW FORECAST SECTION ════════ */}
        <GlassCard animated delay={450} style={styles.forecastCard}>
          <View style={styles.forecastContent}>
            <View style={styles.forecastLeft}>
              <View style={[
                styles.forecastIconWrap,
                { backgroundColor: isDark ? 'rgba(168, 85, 247, 0.12)' : 'rgba(168, 85, 247, 0.08)' },
              ]}>
                <Ionicons name="sunny-outline" size={22} color={Colors.amethyst} />
              </View>
              <View style={styles.forecastInfo}>
                <Text style={[styles.forecastTitle, { color: Colors.primaryText }]}>
                  Tomorrow&apos;s Forecast
                </Text>
                <Text style={[styles.forecastSubtitle, { color: Colors.tertiaryText }]}>
                  {isUnderBudget
                    ? 'Your savings roll over!'
                    : 'Overage will reduce tomorrow'
                  }
                </Text>
              </View>
            </View>
            <Text style={[styles.forecastAmount, {
              color: tomorrowForecast >= dailyAllowance ? Colors.electricTeal : Colors.sunKissedAmber,
            }]}>
              {formatCurrency(currency, tomorrowForecast)}
            </Text>
          </View>
        </GlassCard>

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
                description="Tap 'Log Spending' or use Quick Log to track your first expense today."
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
                          <Text style={styles.transactionEmoji}>{getCategoryEmoji(expense.category)}</Text>
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
        animationType="slide"
        transparent
        onRequestClose={() => setShowLogModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <PressableScale
              onPress={() => setShowLogModal(false)}
              style={styles.modalBackdrop}
              haptic={false}
            >
              <View />
            </PressableScale>
            <View style={[
              styles.modalContent,
              {
                backgroundColor: isDark ? Colors.darkPurple : Colors.white,
                borderColor: Colors.glassBorder,
                paddingBottom: Math.max(insets.bottom, Spacing.lg),
              },
            ]}>
              <View style={[styles.modalHandle, { backgroundColor: Colors.tertiaryText }]} />

              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Log Spending</Text>
                <PressableScale onPress={() => setShowLogModal(false)}>
                  <Ionicons name="close-circle" size={28} color={Colors.tertiaryText} />
                </PressableScale>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Current Status Card */}
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
                      {isUnderBudget ? '' : '-'}{formatCurrency(currency, todayRemaining)}
                    </Text>
                  </View>
                </View>

                {/* Amount Input */}
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Amount</Text>
                <View style={[styles.amountInputField, {
                  backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                  borderColor: Colors.glassBorder,
                }]}>
                  <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>{currency}</Text>
                  <TextInput
                    style={[styles.amountInput, { color: Colors.primaryText }]}
                    placeholder="0.00"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="decimal-pad"
                    value={spendingAmount}
                    onChangeText={setSpendingAmount}
                    autoFocus
                  />
                </View>

                {/* Category Selection */}
                <Text style={[styles.inputLabel, { color: Colors.primaryText, marginTop: Spacing.lg }]}>Category</Text>
                <View style={styles.categoryGrid}>
                  {ALL_CATEGORIES.map((cat) => (
                    <PressableScale
                      key={cat.key}
                      onPress={() => {
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                        setSelectedCategory(cat.key);
                      }}
                      style={[
                        styles.categoryChip,
                        {
                          backgroundColor: selectedCategory === cat.key
                            ? cat.color + '20'
                            : (isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream),
                          borderColor: selectedCategory === cat.key
                            ? cat.color
                            : Colors.glassBorder,
                        },
                      ]}
                      scaleValue={0.93}
                    >
                      <Text style={styles.categoryChipEmoji}>{cat.emoji}</Text>
                      <Text style={[
                        styles.categoryChipLabel,
                        {
                          color: selectedCategory === cat.key
                            ? cat.color
                            : Colors.secondaryText,
                        },
                      ]}>
                        {cat.label}
                      </Text>
                    </PressableScale>
                  ))}
                </View>

                {/* Description Input */}
                <Text style={[styles.inputLabel, { color: Colors.primaryText, marginTop: Spacing.lg }]}>
                  Description (optional)
                </Text>
                <TextInput
                  style={[styles.descriptionInput, {
                    backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : Colors.lightCream,
                    borderColor: Colors.glassBorder,
                    color: Colors.primaryText,
                  }]}
                  placeholder="e.g., Weekly shop at Tesco"
                  placeholderTextColor={Colors.mediumGray}
                  value={spendingDescription}
                  onChangeText={setSpendingDescription}
                  maxLength={100}
                />

                {/* Spending Preview */}
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
              </ScrollView>

              {/* Submit Button */}
              <PressableScale
                onPress={handleLogSpending}
                style={styles.saveButton}
                scaleValue={0.97}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <Text style={styles.saveButtonText}>Saving...</Text>
                  ) : (
                    <Text style={styles.saveButtonText}>Log Spending</Text>
                  )}
                </LinearGradient>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* ════════ FLOATING AI COACH BUTTON ════════ */}
      <Animated.View
        style={[
          styles.floatingCoachButton,
          {
            bottom: insets.bottom + 100,
            transform: [{ scale: coachButtonPulse }],
            shadowColor: Colors.electricTeal,
            shadowOffset: { width: 0, height: 8 },
            shadowRadius: 24,
            shadowOpacity: coachButtonGlow as any,
            elevation: 12,
          },
        ]}
        nativeID="floating-coach-icon"
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
  scrollContent: {
    paddingHorizontal: Spacing.lg,
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

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerLeft: {
    flex: 1,
  },
  headerBrand: {
    ...Typography.labelMedium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  greeting: {
    ...Typography.headlineLarge,
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    ...Shadows.soft,
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
  },

  // ─── Hero Card ─────────────────────────────────────────────────────────────
  heroCard: {
    marginBottom: Spacing.md,
  },
  heroContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  heroLeft: {
    flex: 1,
    marginRight: Spacing.md,
  },
  heroLabel: {
    ...Typography.labelMedium,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: Spacing.xs,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: -1.5,
    lineHeight: 48,
    marginBottom: Spacing.xs,
  },
  heroDate: {
    ...Typography.labelMedium,
    marginBottom: Spacing.sm,
  },
  heroRight: {
    alignItems: 'center',
  },
  wellnessLabel: {
    ...Typography.labelSmall,
    marginTop: Spacing.xs,
  },

  // ─── Wellness Ring ─────────────────────────────────────────────────────────
  wellnessScoreValue: {
    fontSize: 26,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  wellnessScoreLabel: {
    fontSize: 9,
    fontWeight: '600',
    color: 'rgba(255,255,255,0.5)',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // ─── Rollover Badge ────────────────────────────────────────────────────────
  rolloverBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  rolloverText: {
    ...Typography.labelMedium,
  },

  // ─── Progress Bar ──────────────────────────────────────────────────────────
  progressSection: {
    marginTop: Spacing.lg,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  progressLabelText: {
    ...Typography.labelSmall,
  },
  progressBarContainer: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: Spacing.md,
  },
  progressBarGlow: {
    height: '100%',
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 8,
    elevation: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 6,
  },

  // ─── Status ────────────────────────────────────────────────────────────────
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

  // ─── Daily Win ─────────────────────────────────────────────────────────────
  dailyWinCard: {
    marginBottom: Spacing.md,
  },
  dailyWinGradient: {
    borderRadius: BorderRadius.lg,
    margin: -Spacing.lg,
    padding: Spacing.lg,
  },
  dailyWinContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  dailyWinEmoji: {
    fontSize: 28,
  },
  dailyWinTextContainer: {
    flex: 1,
  },
  dailyWinTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  dailyWinMessage: {
    ...Typography.bodySmall,
  },
  dailyWinBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Quick Log ─────────────────────────────────────────────────────────────
  quickLogSection: {
    marginBottom: Spacing.md,
  },
  quickLogRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.md,
    gap: Spacing.sm,
  },
  quickLogItem: {
    flex: 1,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  quickLogIconWrap: {
    width: 60,
    height: 60,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  quickLogEmoji: {
    fontSize: 26,
  },
  quickLogLabel: {
    ...Typography.labelSmall,
    textAlign: 'center',
  },

  // ─── Log Spending Button ───────────────────────────────────────────────────
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

  // ─── Metrics Row ───────────────────────────────────────────────────────────
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

  // ─── Momentum Streak ──────────────────────────────────────────────────────
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
  streakIconWrap: {
    width: 52,
    height: 52,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakEmoji: {
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

  // ─── Tomorrow Forecast ─────────────────────────────────────────────────────
  forecastCard: {
    marginBottom: Spacing.lg,
  },
  forecastContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  forecastLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  forecastIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  forecastInfo: {
    flex: 1,
  },
  forecastTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  forecastSubtitle: {
    ...Typography.bodySmall,
  },
  forecastAmount: {
    ...Typography.headlineSmall,
    fontWeight: '700',
    paddingLeft: Spacing.sm,
  },

  // ─── Transactions ──────────────────────────────────────────────────────────
  transactionSection: {
    marginBottom: Spacing.lg,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
  },
  transactionCount: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    minWidth: 28,
    alignItems: 'center',
  },
  transactionCountText: {
    ...Typography.labelMedium,
    fontWeight: '700',
  },
  transactionList: {
    gap: Spacing.sm,
  },
  transactionCard: {
    // No extra margin - gap handled by parent
  },
  transactionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  transactionIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  transactionEmoji: {
    fontSize: 20,
  },
  transactionDetails: {
    flex: 1,
  },
  transactionName: {
    ...Typography.titleSmall,
    marginBottom: 2,
  },
  transactionMeta: {
    ...Typography.labelSmall,
  },
  transactionRight: {
    alignItems: 'flex-end',
    gap: Spacing.xs,
  },
  transactionAmount: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  deleteButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Modal ─────────────────────────────────────────────────────────────────
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalBackdrop: {
    flex: 1,
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl + 8,
    borderTopRightRadius: BorderRadius.xxl + 8,
    borderWidth: 1,
    borderBottomWidth: 0,
    padding: Spacing.lg,
    maxHeight: '90%',
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

  // ─── Log Status Card ───────────────────────────────────────────────────────
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

  // ─── Amount Input ──────────────────────────────────────────────────────────
  inputLabel: {
    ...Typography.titleSmall,
    marginBottom: Spacing.sm,
  },
  amountInputField: {
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
  amountInput: {
    flex: 1,
    ...Typography.headlineSmall,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },

  // ─── Category Grid ─────────────────────────────────────────────────────────
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    borderWidth: 1.5,
  },
  categoryChipEmoji: {
    fontSize: 16,
  },
  categoryChipLabel: {
    ...Typography.labelMedium,
  },

  // ─── Description Input ─────────────────────────────────────────────────────
  descriptionInput: {
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    ...Typography.bodyLarge,
  },

  // ─── Spending Preview ──────────────────────────────────────────────────────
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

  // ─── Save Button ───────────────────────────────────────────────────────────
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

  // ─── Floating AI Coach Button ──────────────────────────────────────────────
  floatingCoachButton: {
    position: 'absolute',
    right: Spacing.lg,
    width: 60,
    height: 60,
    borderRadius: 30,
    zIndex: 1000,
  },
  floatingCoachBlur: {
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'hidden',
    borderWidth: 1.5,
  },
  floatingCoachGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
