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
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
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

// ─── Mom Tips Data ──────────────────────────────────────────────────────────
const MOM_TIPS = [
  {
    id: '1',
    emoji: '\uD83E\uDD66',
    title: 'Meal Prep Sundays',
    description: 'Prep meals for the week and save up to 40% on food costs. Batch cook and freeze!',
    gradient: ['#10B981', '#2DD4BF'] as const,
    iconBg: 'rgba(16, 185, 129, 0.15)',
  },
  {
    id: '2',
    emoji: '\uD83D\uDED2',
    title: 'Smart Grocery Lists',
    description: 'Always shop with a list. Families who plan meals save an average of \u00A350/week.',
    gradient: ['#F59E0B', '#EF4444'] as const,
    iconBg: 'rgba(245, 158, 11, 0.15)',
  },
  {
    id: '3',
    emoji: '\u2744\uFE0F',
    title: 'Freeze Leftovers',
    description: 'Freeze leftover portions instead of binning them. It adds up to hundreds saved per year.',
    gradient: ['#3B82F6', '#6366F1'] as const,
    iconBg: 'rgba(59, 130, 246, 0.15)',
  },
  {
    id: '4',
    emoji: '\uD83C\uDFF7\uFE0F',
    title: 'Yellow Sticker Wins',
    description: 'Hit the reduced aisle at closing time. Freeze bargains for future meals.',
    gradient: ['#EC4899', '#A855F7'] as const,
    iconBg: 'rgba(236, 72, 153, 0.15)',
  },
  {
    id: '5',
    emoji: '\uD83D\uDCB0',
    title: 'Cashback Apps',
    description: 'Use cashback apps on every shop. Small amounts compound into big savings over time.',
    gradient: ['#A855F7', '#2DD4BF'] as const,
    iconBg: 'rgba(168, 85, 247, 0.15)',
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

// ─── Animated Fire Emoji ────────────────────────────────────────────────────
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
    <Animated.Text style={[styles.fireEmoji, { transform: [{ scale: pulseAnim }] }]}>
      {'\uD83D\uDD25'}
    </Animated.Text>
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
  const ringTrackColor = isDark ? 'rgba(45, 27, 61, 0.6)' : 'rgba(0, 0, 0, 0.06)';

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
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <DashboardSkeleton />
      </LinearGradient>
    );
  }

  // ─── Main Render ────────────────────────────────────────────────────────────
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
          <View>
            <Text style={[styles.headerBrand, { color: Colors.electricTeal }]}>
              Savings Hub
            </Text>
            <Text style={[styles.headerTitle, { color: Colors.primaryText }]}>
              Build Your Wealth
            </Text>
          </View>
          <PressableScale
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
            style={[
              styles.settingsButton,
              {
                backgroundColor: Colors.cardBackground,
                borderColor: Colors.glassBorder,
              },
            ]}
          >
            <Ionicons name="wallet-outline" size={24} color={Colors.electricTeal} />
          </PressableScale>
        </View>

        {/* ════════ SCAN RECEIPT BANNER ════════ */}
        <PressableScale
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          style={styles.receiptBanner}
          scaleValue={0.97}
        >
          <LinearGradient
            colors={isDark
              ? ['#A855F7', '#EC4899', '#F59E0B'] as const
              : ['#7C3AED', '#EC4899', '#F59E0B'] as const
            }
            style={styles.receiptBannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0.5 }}
          >
            <View style={styles.receiptBannerContent}>
              <View style={styles.receiptBannerLeft}>
                <View style={styles.receiptBannerIconBg}>
                  <Ionicons name="scan-outline" size={28} color="#FFFFFF" />
                </View>
                <View style={styles.receiptBannerText}>
                  <Text style={styles.receiptBannerTitle}>Scan Receipt for Savings</Text>
                  <Text style={styles.receiptBannerSubtitle}>
                    Track every penny you save
                  </Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={22} color="rgba(255,255,255,0.7)" />
            </View>
            {/* Decorative circles */}
            <View style={styles.receiptBannerDecor1} />
            <View style={styles.receiptBannerDecor2} />
          </LinearGradient>
        </PressableScale>

        {/* ════════ TOTAL SAVINGS CARD ════════ */}
        <GlassCard style={styles.totalSavingsCard} animated delay={0}>
          <View style={styles.totalSavingsHeader}>
            <Text style={[styles.sectionLabel, { color: Colors.tertiaryText }]}>
              Total Savings
            </Text>
            <View
              style={[
                styles.growthBadge,
                { backgroundColor: Colors.glowingGreen + '20' },
              ]}
            >
              <Ionicons name="trending-up" size={14} color={Colors.glowingGreen} />
              <Text style={[styles.growthText, { color: Colors.glowingGreen }]}>
                Growing
              </Text>
            </View>
          </View>
          <Text style={[styles.totalSavingsValue, { color: Colors.primaryText }]}>
            {formatCurrency(totalSavings)}
          </Text>
          <Text style={[styles.totalSavingsSubtext, { color: Colors.tertiaryText }]}>
            {savingsGoal > 0
              ? `${formatCurrencyWhole(Math.max(savingsGoal - totalSavings, 0))} to reach your goal`
              : 'Keep up the great work!'}
          </Text>
        </GlassCard>

        {/* ════════ SAVINGS GOAL PROGRESS RING ════════ */}
        {savingsGoal > 0 && (
          <GlassCard style={styles.goalCard} animated delay={100}>
            <View style={styles.goalHeader}>
              <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
                Savings Goal
              </Text>
              <Text style={[styles.goalPercentage, { color: Colors.electricTeal }]}>
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
                  <Text style={[styles.progressRingValue, { color: Colors.primaryText }]}>
                    {formatCurrencyWhole(totalSavings)}
                  </Text>
                  <Text style={[styles.progressRingLabel, { color: Colors.tertiaryText }]}>
                    saved
                  </Text>
                </View>
              </View>

              {/* Goal Details */}
              <View style={styles.goalDetails}>
                <View style={styles.goalDetailRow}>
                  <Text style={[styles.goalDetailLabel, { color: Colors.tertiaryText }]}>
                    Goal
                  </Text>
                  <Text style={[styles.goalDetailValue, { color: Colors.primaryText }]}>
                    {formatCurrencyWhole(savingsGoal)}
                  </Text>
                </View>
                <View style={styles.goalDetailRow}>
                  <Text style={[styles.goalDetailLabel, { color: Colors.tertiaryText }]}>
                    Remaining
                  </Text>
                  <Text style={[styles.goalDetailValue, { color: Colors.electricTeal }]}>
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
                ) : (
                  <Text style={[styles.goalMotivation, { color: Colors.tertiaryText }]}>
                    You&apos;re {progressPercentage.toFixed(0)}% of the way!
                  </Text>
                )}
              </View>
            </View>
          </GlassCard>
        )}

        {/* ════════ MOM-TIP CAROUSEL ════════ */}
        <View style={styles.tipsSection}>
          <View style={styles.tipsSectionHeader}>
            <View style={[
              styles.tipsSectionIconBg,
              { backgroundColor: isDark ? 'rgba(245, 158, 11, 0.12)' : 'rgba(245, 158, 11, 0.08)' },
            ]}>
              <Ionicons name="bulb" size={18} color={Colors.sunKissedAmber} />
            </View>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
              Mom-Tips
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
            {MOM_TIPS.map((tip, index) => (
              <PressableScale
                key={tip.id}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                style={[styles.tipCard, { width: TIP_CARD_WIDTH }]}
                scaleValue={0.97}
              >
                <View style={[
                  styles.tipCardInner,
                  {
                    backgroundColor: Colors.cardBackground,
                    borderColor: Colors.glassBorder,
                  },
                ]}>
                  <LinearGradient
                    colors={tip.gradient}
                    style={styles.tipCardAccent}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  />
                  <View style={styles.tipCardContent}>
                    <View style={[styles.tipEmojiContainer, { backgroundColor: tip.iconBg }]}>
                      <Text style={styles.tipEmoji}>{tip.emoji}</Text>
                    </View>
                    <Text
                      style={[styles.tipTitle, { color: Colors.primaryText }]}
                      numberOfLines={1}
                    >
                      {tip.title}
                    </Text>
                    <Text
                      style={[styles.tipDescription, { color: Colors.tertiaryText }]}
                      numberOfLines={3}
                    >
                      {tip.description}
                    </Text>
                  </View>
                  {/* Decorative corner gradient */}
                  <View style={styles.tipCardDecor}>
                    <LinearGradient
                      colors={[tip.gradient[0] + '15', 'transparent']}
                      style={styles.tipCardDecorGradient}
                    />
                  </View>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </View>

        {/* ════════ SAVINGS STREAK ════════ */}
        <GlassCard style={styles.streakCard} animated delay={200}>
          <View style={styles.streakContent}>
            <View style={styles.streakLeft}>
              <View style={[
                styles.streakIconWrap,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(245, 158, 11, 0.08)',
                },
              ]}>
                <AnimatedFire streak={momentumStreak} />
              </View>
              <View style={styles.streakInfo}>
                <Text style={[styles.streakTitle, { color: Colors.primaryText }]}>
                  {momentumStreak > 0
                    ? `${momentumStreak}-Day Streak!`
                    : 'Start Your Streak!'}
                </Text>
                <Text style={[styles.streakSubtitle, { color: Colors.tertiaryText }]}>
                  {momentumStreak > 0
                    ? 'Consecutive days under budget'
                    : 'Stay under budget to build momentum'}
                </Text>
              </View>
            </View>
            <View style={styles.streakRight}>
              <Text style={[styles.streakValue, {
                color: momentumStreak > 0
                  ? (isDark ? Colors.sunKissedAmber : Colors.radiantMagenta)
                  : Colors.tertiaryText,
              }]}>
                {momentumStreak}
              </Text>
              <Text style={[styles.streakLabel, { color: Colors.tertiaryText }]}>
                {momentumStreak === 1 ? 'Day' : 'Days'}
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
                <Text style={[styles.streakDotsMore, { color: Colors.sunKissedAmber }]}>
                  +{momentumStreak - 7}
                </Text>
              )}
            </View>
          )}
        </GlassCard>

        {/* ════════ SAVINGS WINS HISTORY ════════ */}
        <View style={styles.winsSection}>
          <View style={styles.winsSectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
              Savings Wins
            </Text>
            <PressableScale
              onPress={handleOpenAddModal}
              style={[styles.addWinButton, { backgroundColor: Colors.electricTeal }]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
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
                    {/* Subtle overlay tint */}
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
                          style={[styles.winTitle, { color: Colors.primaryText }]}
                          numberOfLines={1}
                        >
                          {win.title}
                        </Text>
                        {win.description ? (
                          <Text
                            style={[styles.winDescription, { color: Colors.secondaryText }]}
                            numberOfLines={1}
                          >
                            {win.description}
                          </Text>
                        ) : null}
                        <Text style={[styles.winDate, { color: Colors.tertiaryText }]}>
                          {formatDate(win.winDate || win.createdAt)}
                        </Text>
                      </View>
                      <Text style={[styles.winAmount, { color: Colors.glowingGreen }]}>
                        +{formatCurrencyWhole(win.amount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
        </View>

        {/* ════════ ADD WIN CTA (bottom) ════════ */}
        {savingsWins.length > 0 && (
          <PressableScale
            onPress={handleOpenAddModal}
            style={styles.addWinCta}
            scaleValue={0.96}
          >
            <LinearGradient
              colors={isDark
                ? [Colors.electricTeal, Colors.amethyst]
                : [Colors.electricTeal, Colors.glowingGreen]
              }
              style={styles.addWinCtaGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Ionicons name="add-circle-outline" size={22} color="#FFFFFF" />
              <Text style={styles.addWinCtaText}>Add Savings Win</Text>
            </LinearGradient>
          </PressableScale>
        )}
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
          <View style={styles.modalOverlay}>
            <PressableScale
              onPress={() => setShowAddModal(false)}
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
              {/* Handle bar */}
              <View style={styles.modalHandleContainer}>
                <View
                  style={[
                    styles.modalHandle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255, 255, 255, 0.2)'
                        : 'rgba(0, 0, 0, 0.15)',
                    },
                  ]}
                />
              </View>

              {/* Header */}
              <View style={styles.modalHeader}>
                <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>
                  Add Savings Win
                </Text>
                <PressableScale
                  onPress={() => setShowAddModal(false)}
                  scaleValue={0.9}
                >
                  <View
                    style={[
                      styles.modalCloseButton,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <Ionicons name="close" size={22} color={Colors.primaryText} />
                  </View>
                </PressableScale>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Title Input */}
                <Text style={[styles.inputLabel, { color: Colors.tertiaryText }]}>
                  Win Title
                </Text>
                <TextInput
                  style={[
                    styles.textInput,
                    {
                      backgroundColor: Colors.lightCream,
                      borderColor: Colors.glassBorder,
                      color: Colors.primaryText,
                    },
                  ]}
                  placeholder="e.g., Meal prep savings"
                  placeholderTextColor={Colors.mediumGray}
                  value={winTitle}
                  onChangeText={setWinTitle}
                  maxLength={80}
                  autoFocus
                />

                {/* Amount Input */}
                <Text
                  style={[
                    styles.inputLabel,
                    { color: Colors.tertiaryText, marginTop: Spacing.lg },
                  ]}
                >
                  Amount Saved
                </Text>
                <View
                  style={[
                    styles.amountInputRow,
                    {
                      backgroundColor: Colors.lightCream,
                      borderColor: Colors.glassBorder,
                    },
                  ]}
                >
                  <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>
                    {currency}
                  </Text>
                  <TextInput
                    style={[styles.amountInput, { color: Colors.primaryText }]}
                    placeholder="0.00"
                    placeholderTextColor={Colors.mediumGray}
                    keyboardType="decimal-pad"
                    value={winAmount}
                    onChangeText={setWinAmount}
                  />
                </View>

                {/* Description Input */}
                <Text
                  style={[
                    styles.inputLabel,
                    { color: Colors.tertiaryText, marginTop: Spacing.lg },
                  ]}
                >
                  Description (optional)
                </Text>
                <TextInput
                  style={[
                    styles.textAreaInput,
                    {
                      backgroundColor: Colors.lightCream,
                      borderColor: Colors.glassBorder,
                      color: Colors.primaryText,
                    },
                  ]}
                  placeholder={`e.g., Made lunches at home instead of buying out`}
                  placeholderTextColor={Colors.mediumGray}
                  value={winDescription}
                  onChangeText={setWinDescription}
                  multiline
                  maxLength={200}
                />
              </ScrollView>

              {/* Submit Button */}
              <PressableScale
                onPress={handleAddSavingsWin}
                style={styles.submitButton}
                scaleValue={0.97}
                disabled={isSubmitting}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.submitButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  {isSubmitting ? (
                    <Text style={styles.submitButtonText}>Adding...</Text>
                  ) : (
                    <>
                      <Ionicons
                        name="checkmark-circle-outline"
                        size={22}
                        color="#FFFFFF"
                        style={{ marginRight: Spacing.sm }}
                      />
                      <Text style={styles.submitButtonText}>Add Savings Win</Text>
                    </>
                  )}
                </LinearGradient>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
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

  // ─── Header ─────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  headerBrand: {
    ...Typography.labelMedium,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: Spacing.xs,
  },
  headerTitle: {
    ...Typography.headlineLarge,
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },

  // ─── Receipt Banner ─────────────────────────────────────────────────────────
  receiptBanner: {
    marginBottom: Spacing.lg,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 6,
  },
  receiptBannerGradient: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    overflow: 'hidden',
  },
  receiptBannerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    zIndex: 2,
  },
  receiptBannerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: Spacing.md,
  },
  receiptBannerIconBg: {
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  receiptBannerText: {
    flex: 1,
  },
  receiptBannerTitle: {
    ...Typography.titleMedium,
    color: '#FFFFFF',
    fontWeight: '700',
    marginBottom: 2,
  },
  receiptBannerSubtitle: {
    ...Typography.bodySmall,
    color: 'rgba(255, 255, 255, 0.75)',
  },
  receiptBannerDecor1: {
    position: 'absolute',
    top: -20,
    right: -20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  receiptBannerDecor2: {
    position: 'absolute',
    bottom: -30,
    left: -10,
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },

  // ─── Total Savings Card ─────────────────────────────────────────────────────
  totalSavingsCard: {
    marginBottom: Spacing.lg,
  },
  totalSavingsHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    ...Typography.titleMedium,
  },
  growthBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  growthText: {
    ...Typography.labelMedium,
  },
  totalSavingsValue: {
    ...Typography.displayLarge,
    marginBottom: Spacing.xs,
  },
  totalSavingsSubtext: {
    ...Typography.bodyMedium,
  },

  // ─── Goal Card ──────────────────────────────────────────────────────────────
  goalCard: {
    marginBottom: Spacing.lg,
  },
  goalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.headlineSmall,
  },
  goalPercentage: {
    ...Typography.headlineMedium,
  },
  goalVisualization: {
    flexDirection: 'row',
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
    justifyContent: 'center',
  },
  progressRingValue: {
    ...Typography.headlineSmall,
  },
  progressRingLabel: {
    ...Typography.bodySmall,
  },
  sparkle: {
    position: 'absolute',
  },
  goalDetails: {
    flex: 1,
    justifyContent: 'center',
  },
  goalDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  goalDetailLabel: {
    ...Typography.bodyMedium,
  },
  goalDetailValue: {
    ...Typography.titleMedium,
  },
  goalAchievedBanner: {
    marginTop: Spacing.sm,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  goalAchievedGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  goalAchievedText: {
    ...Typography.titleSmall,
    color: '#FFFFFF',
  },
  goalMotivation: {
    ...Typography.bodyMedium,
    marginTop: Spacing.sm,
  },

  // ─── Mom-Tips Carousel ──────────────────────────────────────────────────────
  tipsSection: {
    marginBottom: Spacing.lg,
  },
  tipsSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  tipsSectionIconBg: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsCarousel: {
    paddingRight: Spacing.lg,
    gap: Spacing.md,
  },
  tipCard: {
    // width set inline
  },
  tipCardInner: {
    borderRadius: BorderRadius.xl,
    borderWidth: 1,
    overflow: 'hidden',
  },
  tipCardAccent: {
    height: 4,
  },
  tipCardContent: {
    padding: Spacing.lg,
  },
  tipEmojiContainer: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  tipEmoji: {
    fontSize: 22,
  },
  tipTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  tipDescription: {
    ...Typography.bodySmall,
    lineHeight: 18,
  },
  tipCardDecor: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 80,
    height: 80,
    overflow: 'hidden',
  },
  tipCardDecorGradient: {
    width: 80,
    height: 80,
    borderTopLeftRadius: 80,
  },

  // ─── Savings Streak ─────────────────────────────────────────────────────────
  streakCard: {
    marginBottom: Spacing.lg,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  streakLeft: {
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
  fireEmoji: {
    fontSize: 28,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    ...Typography.titleMedium,
    fontWeight: '700',
    marginBottom: 2,
  },
  streakSubtitle: {
    ...Typography.bodySmall,
  },
  streakRight: {
    alignItems: 'center',
    paddingLeft: Spacing.md,
  },
  streakValue: {
    fontSize: 36,
    fontWeight: '800',
    lineHeight: 40,
    letterSpacing: -1,
  },
  streakLabel: {
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

  // ─── Savings Wins Section ───────────────────────────────────────────────────
  winsSection: {
    marginBottom: Spacing.lg,
  },
  winsSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  addWinButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  emptyWinsCard: {
    // EmptyState provides its own padding
  },
  winCard: {
    marginBottom: Spacing.md,
  },
  winCardInner: {
    position: 'relative',
    overflow: 'hidden',
  },
  winGradientOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.xl,
  },
  winContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  winIconContainer: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  winDetails: {
    flex: 1,
  },
  winTitle: {
    ...Typography.titleMedium,
    marginBottom: 2,
  },
  winDescription: {
    ...Typography.bodySmall,
    marginBottom: 2,
  },
  winDate: {
    ...Typography.labelSmall,
  },
  winAmount: {
    ...Typography.headlineSmall,
  },

  // ─── Add Win CTA ────────────────────────────────────────────────────────────
  addWinCta: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    marginBottom: Spacing.lg,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 14,
    elevation: 8,
  },
  addWinCtaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    gap: Spacing.sm,
  },
  addWinCtaText: {
    ...Typography.titleMedium,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // ─── Modal ──────────────────────────────────────────────────────────────────
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
    paddingHorizontal: Spacing.lg,
    maxHeight: '85%',
  },
  modalHandleContainer: {
    alignItems: 'center',
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  modalHandle: {
    width: 40,
    height: 4,
    borderRadius: BorderRadius.round,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    marginTop: Spacing.sm,
  },
  modalTitle: {
    ...Typography.headlineMedium,
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ─── Form Inputs ────────────────────────────────────────────────────────────
  inputLabel: {
    ...Typography.titleSmall,
    marginBottom: Spacing.sm,
  },
  textInput: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.bodyLarge,
  },
  amountInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: '700',
    marginRight: Spacing.sm,
  },
  amountInput: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  textAreaInput: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.bodyLarge,
    minHeight: 80,
    textAlignVertical: 'top',
  },

  // ─── Submit Button ──────────────────────────────────────────────────────────
  submitButton: {
    marginTop: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  submitButtonGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
  },
  submitButtonText: {
    ...Typography.titleLarge,
    color: '#FFFFFF',
  },
});
