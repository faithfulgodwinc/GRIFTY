import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Modal,
  TextInput,
  Alert,
  Animated,
  RefreshControl,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, getGradients, getThemeColors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { EmptyState } from '@/components/EmptyState';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const TIP_CARD_WIDTH = SCREEN_WIDTH * 0.72;

// ─── Wealth Tips Data (Formerly Mom Tips) ──────────────────────────────────
const WEALTH_TIPS = [
  {
    id: '1',
    icon: 'restaurant-outline',
    title: 'Meal Prep Master',
    description: 'Prep meals for the week and save up to 40% on food costs. Efficient & delicious.',
    gradient: ['#10B981', '#2DD4BF'] as const,
    iconBg: 'rgba(16, 185, 129, 0.15)',
    iconColor: '#10B981',
  },
  {
    id: '2',
    icon: 'cart-outline',
    title: 'Smart Grocery Lists',
    description: 'Always shop with a list. Strategic planning saves an average of £50/week.',
    gradient: ['#F59E0B', '#EF4444'] as const,
    iconBg: 'rgba(245, 158, 11, 0.15)',
    iconColor: '#F59E0B',
  },
  {
    id: '3',
    icon: 'snow-outline',
    title: 'Freeze Surplus',
    description: 'Freeze leftover portions instead of binning them. Compounds to hundreds saved annually.',
    gradient: ['#3B82F6', '#6366F1'] as const,
    iconBg: 'rgba(59, 130, 246, 0.15)',
    iconColor: '#3B82F6',
  },
  {
    id: '4',
    icon: 'pricetag-outline',
    title: 'Discount Hunter',
    description: 'Target reduced items strategically. Freeze bargains for future premium meals.',
    gradient: ['#EC4899', '#A855F7'] as const,
    iconBg: 'rgba(236, 72, 153, 0.15)',
    iconColor: '#EC4899',
  },
  {
    id: '5',
    icon: 'cash-outline',
    title: 'Cashback Stacking',
    description: 'Use cashback apps on every purchase. Small returns compound into significant wealth.',
    gradient: ['#A855F7', '#2DD4BF'] as const,
    iconBg: 'rgba(168, 85, 247, 0.15)',
    iconColor: '#A855F7',
  },
];

// ─── Win Accent Color Palettes ──────────────────────────────────────────────
const WIN_ACCENTS = [
  { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', icon: '#10B981' },
  { bg: 'rgba(45, 212, 191, 0.08)', border: 'rgba(45, 212, 191, 0.15)', icon: '#2DD4BF' },
  { bg: 'rgba(168, 85, 247, 0.06)', border: 'rgba(168, 85, 247, 0.12)', icon: '#A855F7' },
  { bg: 'rgba(99, 102, 241, 0.06)', border: 'rgba(99, 102, 241, 0.12)', icon: '#6366F1' },
  { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.12)', icon: '#F59E0B' },
  { bg: 'rgba(236, 72, 153, 0.06)', border: 'rgba(236, 72, 153, 0.12)', icon: '#EC4899' },
];

// ─── SVG Progress Ring ──────────────────────────────────────────────────────
function ProgressRing({
  progress,
  size = 140,
  strokeWidth = 12,
  tealColor,
  greenColor,
  trackColor,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  tealColor: string;
  greenColor: string;
  trackColor: string;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clampedProgress = Math.min(Math.max(progress, 0), 100);
  const strokeDashoffset = circumference - (clampedProgress / 100) * circumference;
  const center = size / 2;

  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Defs>
        <SvgGradient id="savingsProgressGrad" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0%" stopColor={tealColor} />
          <Stop offset="100%" stopColor={greenColor} />
        </SvgGradient>
      </Defs>
      {/* Track */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke={trackColor}
        strokeWidth={strokeWidth}
        fill="none"
      />
      {/* Progress arc */}
      <Circle
        cx={center}
        cy={center}
        r={radius}
        stroke="url(#savingsProgressGrad)"
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={`${circumference} ${circumference}`}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        transform={`rotate(-90 ${center} ${center})`}
      />
    </Svg>
  );
}

// ─── Sparkle Decorations ────────────────────────────────────────────────────
function SparkleEffects({
  progress,
  tealColor,
  amberColor,
}: {
  progress: number;
  tealColor: string;
  amberColor: string;
}) {
  if (progress < 20) return null;

  const sparkleCount = progress >= 100 ? 6 : progress >= 75 ? 4 : progress >= 50 ? 3 : 2;
  const sparklePositions = [
    { top: -4, right: 24 },
    { top: 24, right: -6 },
    { bottom: 12, right: -2 },
    { bottom: -4, left: 28 },
    { top: 10, left: -4 },
    { bottom: 28, left: -6 },
  ];

  return (
    <>
      {sparklePositions.slice(0, sparkleCount).map((pos, i) => (
        <View
          key={i}
          style={[
            styles.sparkle,
            pos as any,
            {
              width: i % 2 === 0 ? 6 : 4,
              height: i % 2 === 0 ? 6 : 4,
              borderRadius: i % 2 === 0 ? 3 : 2,
              backgroundColor: i % 3 === 0 ? amberColor : tealColor,
              opacity: 0.6 + i * 0.05,
            },
          ]}
        />
      ))}
    </>
  );
}

// ─── Animated Fire Icon ────────────────────────────────────────────────────
function AnimatedFire({ streak }: { streak: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (streak > 0) {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, { toValue: 1.15, duration: 800, useNativeDriver: true }),
          Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }
  }, [streak, pulseAnim]);

  return (
    <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
      <Ionicons name="flame" size={32} color={Colors.sunKissedAmber} />
    </Animated.View>
  );
}

// =============================================================================
// SAVINGS HUB SCREEN
// =============================================================================
export default function SavingsScreen() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const {
    profile,
    financialData,
    savingsWins,
    totalSavings,
    momentumStreak,
    isLoading,
    isRefreshing,
    actions,
  } = useFinancialData();

  // ─── Local State ────────────────────────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [winTitle, setWinTitle] = useState('');
  const [winAmount, setWinAmount] = useState('');
  const [winDescription, setWinDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ─── Derived Values ─────────────────────────────────────────────────────────
  const currency = profile?.currency || financialData?.currency || '\u00A3';
  const savingsGoal = financialData?.savingsGoal || profile?.savingsGoal || 0;
  const progressPercentage = savingsGoal > 0
    ? Math.min((totalSavings / savingsGoal) * 100, 100)
    : 0;
  const ringTrackColor = 'rgba(255, 255, 255, 0.1)';

  // ─── Formatters ─────────────────────────────────────────────────────────────
  const formatCurrency = (amount: number, decimals = 2): string => {
    return `${currency}${Math.abs(amount).toFixed(decimals)}`;
  };

  const formatCurrencyWhole = (amount: number): string => {
    return `${currency}${Math.abs(amount).toFixed(0)}`;
  };

  const formatDate = (dateString: string): string => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  };

  // ─── Handlers ───────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await actions.refreshAll();
  }, [actions]);

  const handleOpenAddModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setWinTitle('');
    setWinAmount('');
    setWinDescription('');
    setShowAddModal(true);
  }, []);

  const handleAddSavingsWin = useCallback(async () => {
    const amount = parseFloat(winAmount);
    if (!winTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your savings win.');
      return;
    }
    if (!amount || amount <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid savings amount.');
      return;
    }

    setIsSubmitting(true);
    try {
      const success = await actions.addSavingsWin({
        title: winTitle.trim(),
        amount,
        description: winDescription.trim() || undefined,
      });

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setShowAddModal(false);
        setWinTitle('');
        setWinAmount('');
        setWinDescription('');
      } else {
        Alert.alert('Error', 'Failed to add savings win. Please try again.');
      }
    } catch (error) {
      console.error('Failed to add savings win:', error);
      Alert.alert('Error', 'Failed to add savings win. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  }, [winTitle, winAmount, winDescription, actions]);

  // ─── Loading State ──────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <DashboardSkeleton />
      </View>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

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
            progressBackgroundColor={Colors.richBlack}
          />
        }
      >
        {/* ════════ HEADER ════════ */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.labelMedium, styles.headerBrand]}>
              WEALTH VAULT
            </Text>
            <Text style={[Typography.displaySmall, styles.headerTitle, { color: isDark ? Colors.white : Colors.primaryText }]}>
              Grow Your Net Worth
            </Text>
          </View>
        </View>

        {/* ════════ TOTAL SAVINGS CARD ════════ */}
        <GlassCard style={styles.totalSavingsCard} animated delay={0}>
          <View style={styles.totalSavingsHeader}>
            <Text style={[Typography.labelMedium, { color: isDark ? Colors.white : Colors.tertiaryText }]}>
              TOTAL SAVINGS
            </Text>
            <View
              style={[
                styles.growthBadge,
                { backgroundColor: 'rgba(52, 211, 153, 0.15)' },
              ]}
            >
              <Ionicons name="trending-up" size={14} color={Colors.glowingGreen} />
              <Text style={[Typography.labelSmall, { color: Colors.glowingGreen }]}>
                Growing
              </Text>
            </View>
          </View>
          <Text style={[Typography.displayLarge, styles.totalSavingsValue, { color: isDark ? Colors.white : Colors.primaryText }]}>
            {formatCurrency(totalSavings)}
          </Text>
          <Text style={[Typography.bodyMedium, styles.totalSavingsSubtext]}>
            {savingsGoal > 0
              ? `${formatCurrencyWhole(Math.max(savingsGoal - totalSavings, 0))} to reach your goal`
              : 'Consistent saving builds lasting wealth.'}
          </Text>
        </GlassCard>

        {/* ════════ SAVINGS GOAL PROGRESS RING ════════ */}
        {savingsGoal > 0 && (
          <GlassCard style={styles.goalCard} animated delay={100}>
            <View style={styles.goalHeader}>
              <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                Savings Goal
              </Text>
              <Text style={[Typography.headlineMedium, { color: isDark ? Colors.white : Colors.electricTeal }]}>
                {progressPercentage.toFixed(0)}%
              </Text>
            </View>

            <View style={styles.goalVisualization}>
              {/* Progress Ring */}
              <View style={styles.progressRingContainer}>
                <SparkleEffects
                  progress={progressPercentage}
                  tealColor={Colors.electricTeal}
                  amberColor={Colors.sunKissedAmber}
                />
                <ProgressRing
                  progress={progressPercentage}
                  size={140}
                  strokeWidth={12}
                  tealColor={Colors.electricTeal}
                  greenColor={Colors.glowingGreen}
                  trackColor={ringTrackColor}
                />
                <View style={styles.progressRingCenter}>
                  <Text style={[Typography.headlineMedium, { color: Colors.primaryText }]}>
                    {formatCurrencyWhole(totalSavings)}
                  </Text>
                  <Text style={[Typography.labelSmall, { color: isDark ? Colors.white : Colors.tertiaryText }]}>
                    SAVED
                  </Text>
                </View>
              </View>

              {/* Goal Details */}
              <View style={styles.goalDetails}>
                <View style={styles.goalDetailRow}>
                  <Text style={[Typography.bodyMedium, { color: Colors.secondaryText }]}>
                    Goal
                  </Text>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    {formatCurrencyWhole(savingsGoal)}
                  </Text>
                </View>
                <View style={[styles.goalDetailRow, { marginTop: Spacing.sm }]}>
                  <Text style={[Typography.bodyMedium, { color: Colors.secondaryText }]}>
                    Remaining
                  </Text>
                  <Text style={[Typography.titleMedium, { color: isDark ? Colors.white : Colors.electricTeal }]}>
                    {formatCurrencyWhole(Math.max(savingsGoal - totalSavings, 0))}
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
                      <Ionicons name="trophy" size={18} color="#FFFFFF" />
                      <Text style={styles.goalAchievedText}>Goal Achieved!</Text>
                    </LinearGradient>
                  </View>
                ) : null}
              </View>
            </View>
          </GlassCard>
        )}

        {/* ════════ WEALTH TIPS CAROUSEL ════════ */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsSectionHeader}>
            <View style={[
              styles.tipsSectionIconBg,
              { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
            ]}>
              <Ionicons name="bulb" size={18} color={Colors.sunKissedAmber} />
            </View>
            <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
              Wealth Wisdom
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tipsCarousel}
            decelerationRate="fast"
            snapToInterval={TIP_CARD_WIDTH + Spacing.md}
            snapToAlignment="start"
          >
            {WEALTH_TIPS.map((tip, index) => (
              <GlassCard
                key={tip.id}
                style={[styles.tipCard, { width: TIP_CARD_WIDTH }]}
              >
                <LinearGradient
                  colors={tip.gradient}
                  style={styles.tipCardAccent}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                />
                <View style={styles.tipCardContent}>
                  <View style={[styles.tipEmojiContainer, { backgroundColor: tip.iconBg }]}>
                    <Ionicons name={tip.icon as any} size={24} color={tip.iconColor} />
                  </View>
                  <Text
                    style={[Typography.titleMedium, styles.tipTitle]}
                    numberOfLines={1}
                  >
                    {tip.title}
                  </Text>
                  <Text
                    style={[Typography.bodyMedium, styles.tipDescription]}
                    numberOfLines={3}
                  >
                    {tip.description}
                  </Text>
                </View>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* ════════ SAVINGS STREAK ════════ */}
        <GlassCard style={styles.streakCard} animated delay={200}>
          <View style={styles.streakContent}>
            <View style={styles.streakLeft}>
              <View style={[
                styles.streakIconWrap,
                { backgroundColor: 'rgba(245, 158, 11, 0.12)' },
              ]}>
                <AnimatedFire streak={momentumStreak} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                  {momentumStreak > 0
                    ? `${momentumStreak}-Day Streak!`
                    : 'Start Your Streak!'}
                </Text>
                <Text style={[Typography.bodySmall, { color: Colors.secondaryText }]}>
                  {momentumStreak > 0
                    ? 'Consecutive days under budget'
                    : 'Stay under budget to build momentum'}
                </Text>
              </View>
            </View>
            <View style={styles.streakRight}>
              <Text style={[styles.streakValue, { color: Colors.sunKissedAmber }]}>
                {momentumStreak}
              </Text>
              <Text style={[Typography.labelSmall, { color: Colors.tertiaryText }]}>
                {momentumStreak === 1 ? 'DAY' : 'DAYS'}
              </Text>
            </View>
          </View>

          {/* Streak Progress Dots */}
          {momentumStreak > 0 && (
            <View style={[styles.streakDotsContainer, { borderTopColor: Colors.glassBorder }]}>
              {Array.from({ length: Math.min(momentumStreak, 7) }).map((_, i) => (
                <LinearGradient
                  key={`streak-dot-${i}`}
                  colors={['#FF6B35', '#F59E0B']}
                  style={styles.streakDot}
                />
              ))}
              {momentumStreak > 7 && (
                <Text style={[Typography.labelSmall, { color: Colors.sunKissedAmber, marginLeft: 8 }]}>
                  +{momentumStreak - 7} more
                </Text>
              )}
            </View>
          )}
        </GlassCard>

        {/* ════════ SAVINGS WINS HISTORY ════════ */}
        <View style={styles.winsSection}>
          <View style={styles.winsSectionHeader}>
            <Text style={[Typography.titleLarge, { color: Colors.primaryText }]}>
              Savings Wins
            </Text>
            <PressableScale
              onPress={handleOpenAddModal}
              style={[styles.addWinButton, { backgroundColor: Colors.electricTeal }]}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </PressableScale>
          </View>

          {savingsWins.length === 0 ? (
            <GlassCard style={styles.emptyWinsCard} animated delay={300}>
              <EmptyState
                icon="trophy-outline"
                iconColor={Colors.sunKissedAmber}
                title="No savings wins yet"
                description="Start tracking your savings achievements and watch your wealth grow!"
                actionLabel="Add First Win"
                onAction={handleOpenAddModal}
                gradientColors={[Colors.electricTeal, Colors.glowingGreen]}
              />
            </GlassCard>
          ) : (
            savingsWins.map((win, index) => {
              const accent = WIN_ACCENTS[index % WIN_ACCENTS.length];
              return (
                <GlassCard
                  key={win.id}
                  style={styles.winCard}
                  animated
                  delay={300 + index * 80}
                >
                  <View style={styles.winCardInner}>
                    <View
                      style={[
                        styles.winGradientOverlay,
                        { backgroundColor: accent.bg },
                      ]}
                    />
                    <View style={styles.winContent}>
                      <View
                        style={[
                          styles.winIconContainer,
                          {
                            backgroundColor: accent.bg,
                            borderWidth: 1,
                            borderColor: accent.border,
                          },
                        ]}
                      >
                        <Ionicons
                          name="checkmark-circle"
                          size={24}
                          color={accent.icon}
                        />
                      </View>
                      <View style={styles.winDetails}>
                        <Text
                          style={[Typography.titleMedium, { color: Colors.primaryText }]}
                          numberOfLines={1}
                        >
                          {win.title}
                        </Text>
                        {win.description ? (
                          <Text
                            style={[Typography.bodyMedium, { color: Colors.secondaryText }]}
                            numberOfLines={1}
                          >
                            {win.description}
                          </Text>
                        ) : null}
                        <Text style={[Typography.labelSmall, { color: Colors.tertiaryText, marginTop: 4 }]}>
                          {formatDate(win.winDate || win.createdAt)}
                        </Text>
                      </View>
                      <Text style={[Typography.headlineSmall, { color: Colors.glowingGreen }]}>
                        +{formatCurrencyWhole(win.amount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
        </View>
      </ScrollView>

      {/* ════════ ADD SAVINGS WIN MODAL ════════ */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalBackdropContainer}>
            <LinearGradient colors={['rgba(0,0,0,0.8)', 'rgba(0,0,0,0.95)']} style={StyleSheet.absoluteFill} />
          </View>

          <View style={styles.modalContentWrapper}>
            <View style={styles.modalHeader}>
              <Text style={[Typography.displaySmall, styles.modalTitle]}>
                Add Win
              </Text>
              <PressableScale
                onPress={() => setShowAddModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color={Colors.white} />
              </PressableScale>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
              <Text style={[Typography.labelMedium, styles.inputLabel]}>TITLE</Text>
              <GlassCard style={styles.glassInputContainer}>
                <TextInput
                  style={styles.glassInput}
                  placeholder="e.g. Skipped Latte"
                  placeholderTextColor={Colors.tertiaryText}
                  value={winTitle}
                  onChangeText={setWinTitle}
                  autoFocus
                />
              </GlassCard>

              <Text style={[Typography.labelMedium, styles.inputLabel]}>AMOUNT SAVED</Text>
              <GlassCard style={styles.glassInputContainer}>
                <Text style={styles.currencyPrefix}>{currency}</Text>
                <TextInput
                  style={styles.glassInput}
                  placeholder="0.00"
                  placeholderTextColor={Colors.tertiaryText}
                  value={winAmount}
                  onChangeText={setWinAmount}
                  keyboardType="decimal-pad"
                />
              </GlassCard>

              <Text style={[Typography.labelMedium, styles.inputLabel]}>DESCRIPTION (OPTIONAL)</Text>
              <GlassCard style={[styles.glassInputContainer, { height: 100 }]}>
                <TextInput
                  style={[styles.glassInput, { height: 80, textAlignVertical: 'top' }]}
                  placeholder="Add details..."
                  placeholderTextColor={Colors.tertiaryText}
                  value={winDescription}
                  onChangeText={setWinDescription}
                  multiline
                />
              </GlassCard>
            </ScrollView>

            <PressableScale
              onPress={handleAddSavingsWin}
              disabled={isSubmitting}
              style={styles.submitButton}
            >
              <LinearGradient
                colors={Gradients.primary}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[Typography.titleMedium, models.submitButtonText]}>
                  {isSubmitting ? 'Saving...' : 'Log Victory'}
                </Text>
              </LinearGradient>
            </PressableScale>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.richBlack,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
  },
  header: {
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xs,
  },
  headerBrand: {
    color: Colors.electricTeal,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.primaryText,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  totalSavingsCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  totalSavingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
    gap: 4,
  },
  totalSavingsValue: {
    color: Colors.primaryText,
    marginBottom: Spacing.xs,
  },
  totalSavingsSubtext: {
    color: Colors.tertiaryText,
  },
  goalCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  goalVisualization: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.lg,
  },
  progressRingContainer: {
    width: 140,
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressRingCenter: {
    position: 'absolute',
    alignItems: 'center',
  },
  goalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  goalDetailRow: {
    marginBottom: Spacing.sm,
  },
  goalAchievedBanner: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
    marginTop: Spacing.sm,
  },
  goalAchievedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  goalAchievedText: {
    ...Typography.labelMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  goalMotivation: {
    ...Typography.bodySmall,
    marginTop: 4,
  },
  tipsSection: {
    marginBottom: Spacing.xl,
  },
  tipsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
    gap: 12,
    paddingHorizontal: Spacing.xs,
  },
  tipsSectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCarousel: {
    paddingRight: Spacing.md,
  },
  tipCard: {
    marginRight: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  tipCardInner: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    height: 160,
  },
  tipCardAccent: {
    height: 6,
    width: '100%',
  },
  tipCardContent: {
    padding: Spacing.lg,
  },
  tipEmojiContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipTitle: {
    color: Colors.primaryText,
    marginBottom: 4,
  },
  tipDescription: {
    color: Colors.secondaryText,
  },
  tipCardDecor: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
    borderTopLeftRadius: 80,
    overflow: 'hidden',
  },
  tipCardDecorGradient: {
    flex: 1,
  },
  streakCard: {
    padding: Spacing.lg,
    marginBottom: Spacing.xl,
  },
  streakContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  streakLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  streakIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
  },
  streakInfo: {
    flex: 1,
  },
  streakRight: {
    alignItems: 'flex-end',
  },
  streakValue: {
    fontSize: 32,
    fontWeight: '800',
    lineHeight: 32,
  },
  streakDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.md,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    gap: 6,
  },
  streakDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  winsSection: {
    marginBottom: Spacing.xl,
  },
  winsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xs,
  },
  addWinButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: Colors.electricTeal,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  winCard: {
    marginBottom: Spacing.md,
    padding: 0,
    overflow: 'hidden',
  },
  winCardInner: {
    position: 'relative',
  },
  winGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.1,
  },
  winContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: Spacing.md,
    gap: Spacing.md,
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
  emptyWinsCard: {
    padding: Spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addWinCta: {
    marginVertical: Spacing.xl,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    shadowColor: Colors.electricTeal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  addWinCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    gap: 8,
  },
  addWinCtaText: {
    ...Typography.titleMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalBackdropContainer: {
    ...StyleSheet.absoluteFillObject,
  },
  modalContentWrapper: {
    backgroundColor: Colors.richBlack,
    borderTopLeftRadius: BorderRadius.xl,
    borderTopRightRadius: BorderRadius.xl,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.xxl + 20,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    height: '85%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  modalTitle: {
    color: Colors.primaryText,
  },
  modalCloseButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputLabel: {
    color: Colors.tertiaryText,
    marginBottom: Spacing.sm,
    marginTop: Spacing.md,
  },
  glassInputContainer: {
    paddingHorizontal: Spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
  },
  glassInput: {
    flex: 1,
    ...Typography.bodyLarge,
    color: Colors.primaryText,
    paddingVertical: 12,
  },
  currencyPrefix: {
    ...Typography.titleLarge,
    color: Colors.electricTeal,
    marginRight: 8,
  },
  submitButton: {
    marginTop: Spacing.xl,
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
    ...Shadows.glow(Colors.radiantMagenta),
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    color: Colors.white,
    fontWeight: '700',
  },
  sparkle: {
    position: 'absolute',
  },
});

const models = StyleSheet.create({
  submitButtonText: {
    color: Colors.white,
    fontWeight: '700',
  }
});
