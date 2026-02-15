import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
  Animated,
  Platform,
  RefreshControl,
  KeyboardAvoidingView,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { DashboardSkeleton } from '@/components/SkeletonLoader';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useCoachMarks } from '@/contexts/CoachMarksContext';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { storage } from '@/utils/storage';


// ─── Currency Formatter ──────────────────────────────────────────────────────
const formatCurrency = (currency: string, value: number): string => {
  return `${currency}${Math.abs(value).toFixed(value % 1 === 0 ? 0 : 2)}`;
};

// =============================================================================
// PROFILE COMMAND CENTER
// =============================================================================
export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { startTour } = useCoachMarks();
  const { isPremium, showPaywall, packages, isLoading: isSubscriptionLoading } = useSubscription();

  const handleUnlockPress = () => {
    if (isSubscriptionLoading) {
      Alert.alert('Please wait', 'Loading subscription packages...');
      return;
    }
    if (packages.length === 0) {
      Alert.alert(
        'Connection Error',
        'Unable to load subscription packages. Please check your internet connection and try again.'
      );
      return;
    }
    showPaywall();
  };

  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const {
    profile,
    financialData,
    milestones,
    totalSavings,
    momentumStreak,
    dailyAllowance,
    isLoading,
    isRefreshing,
    wellnessScore,
    daysRemainingInMonth,
    actions,
  } = useFinancialData();

  // ─── Local State ───────────────────────────────────────────────────────────
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIncome, setEditIncome] = useState('');
  const [editSavingsGoal, setEditSavingsGoal] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // ─── Animation Refs ────────────────────────────────────────────────────────
  const toggleAnim = useRef(new Animated.Value(isDark ? 1 : 0)).current;
  const recalculateAnim = useRef(new Animated.Value(0)).current;

  // ─── Theme Toggle Animation ────────────────────────────────────────────────
  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark, toggleAnim]);

  // ─── Derived Values ────────────────────────────────────────────────────────
  const currency = profile?.currency || financialData?.currency || '\u00A3';
  const monthlyIncome = financialData?.monthlyIncome || profile?.monthlyIncome || 0;
  const savingsGoal = financialData?.savingsGoal || profile?.savingsGoal || 0;
  const unlockedMilestones = milestones.filter((m) => m.unlocked);
  const unlockedCount = unlockedMilestones.length;

  // ─── Toggle Interpolations ─────────────────────────────────────────────────
  const toggleTranslateX = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [2, 26],
  });

  const toggleTrackColor = toggleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [
      isDark ? 'rgba(255,255,255,0.12)' : 'rgba(0,0,0,0.08)',
      isDark ? 'rgba(168,85,247,0.4)' : 'rgba(20,184,166,0.3)',
    ],
  });

  // ─── Handlers ──────────────────────────────────────────────────────────────
  const handleRefresh = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    await actions.refreshAll();
  }, [actions]);

  const handleOpenEditModal = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setEditIncome(monthlyIncome > 0 ? monthlyIncome.toString() : '');
    setEditSavingsGoal(savingsGoal > 0 ? savingsGoal.toString() : '');
    setShowEditModal(true);
  }, [monthlyIncome, savingsGoal]);

  const handleSaveBlueprint = useCallback(async () => {
    const income = parseFloat(editIncome);
    const goal = parseFloat(editSavingsGoal);

    if (!income || income <= 0) {
      Alert.alert('Invalid Income', 'Please enter a valid monthly income.');
      return;
    }

    if (!goal || goal <= 0) {
      Alert.alert('Invalid Goal', 'Please enter a valid savings goal.');
      return;
    }

    if (goal >= income) {
      Alert.alert('Invalid Goal', 'Your savings goal should be less than your monthly income.');
      return;
    }

    setIsSaving(true);

    // Recalculate animation
    Animated.sequence([
      Animated.timing(recalculateAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(recalculateAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();

    try {
      const success = await actions.updateBlueprint(income, goal, currency);

      if (success) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setTimeout(() => {
          setIsSaving(false);
          setShowEditModal(false);
        }, 400);
      } else {
        setIsSaving(false);
        Alert.alert('Update Failed', 'Unable to save your changes. Please try again.');
      }
    } catch (error) {
      console.error('Failed to update blueprint:', error);
      setIsSaving(false);
      Alert.alert('Update Failed', 'Unable to save your changes. Please try again.');
    }
  }, [editIncome, editSavingsGoal, currency, actions, recalculateAnim]);

  const handleSignOut = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            // Clear local storage to prevent data leakage
            await storage.clear();
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
            signOut();
          },
        },
      ],
    );
  }, [signOut]);

  const handleRestartTour = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    startTour();
  }, [startTour]);

  // ─── Loading State ─────────────────────────────────────────────────────────
  if (isLoading) {
    return (
      <View style={styles.container}>
        <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />
        <DashboardSkeleton />
      </View>
    );
  }

  // ─── Main Render ───────────────────────────────────────────────────────────
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
            progressBackgroundColor={Colors.cardBackground}
          />
        }
      >
        {/* ════════ HEADER WITH THEME TOGGLE ════════ */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.displaySmall, { color: Colors.primaryText }]}>
              Command Center
            </Text>
            <Text
              style={[
                Typography.titleSmall,
                { color: Colors.electricTeal, marginTop: Spacing.xs },
              ]}
            >
              Your Financial HQ
            </Text>
          </View>

          {/* Premium Pill-Shaped Theme Toggle */}
          <PressableScale onPress={toggleTheme} scaleValue={0.92}>
            <Animated.View
              style={[
                styles.themeTogglePill,
                {
                  backgroundColor: toggleTrackColor,
                  borderColor: isDark ? 'rgba(168,85,247,0.25)' : 'rgba(0,0,0,0.06)',
                  ...Platform.select({
                    ios: {
                      shadowColor: isDark ? '#A855F7' : '#14B8A6',
                      shadowOffset: { width: 0, height: 2 },
                      shadowOpacity: isDark ? 0.3 : 0.15,
                      shadowRadius: 8,
                    },
                    android: { elevation: 4 },
                  }),
                },
              ]}
            >
              <Animated.View
                style={[
                  styles.themeToggleKnob,
                  {
                    transform: [{ translateX: toggleTranslateX }],
                    backgroundColor: isDark ? '#A855F7' : '#14B8A6',
                  },
                ]}
              >
                <Ionicons
                  name={isDark ? 'moon' : 'sunny'}
                  size={14}
                  color="#FFFFFF"
                />
              </Animated.View>
            </Animated.View>
          </PressableScale>
        </View>

        {/* ════════ PROFILE CARD ════════ */}
        <GlassCard animated delay={0} style={{ marginBottom: Spacing.lg }}>
          <View style={styles.profileHeader}>
            {/* Premium Avatar with Gradient Ring */}
            <View style={styles.avatarRingOuter}>
              <LinearGradient
                colors={Gradients.hero}
                style={styles.avatarGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[
                    styles.avatarInner,
                    { backgroundColor: Colors.cardBackground },
                  ]}
                >
                  {profile?.avatarUrl && !profile.avatarUrl.startsWith('http') ? (
                    <View
                      style={[
                        styles.emojiAvatarContainer,
                        { backgroundColor: isDark ? Colors.lightCream : Colors.lightCream },
                      ]}
                    >
                      <Text style={styles.emojiAvatar}>{profile.avatarUrl}</Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={Gradients.hero}
                      style={styles.avatarGradientFill}
                    >
                      <Text style={[styles.avatarInitial, { color: isDark ? '#FFFFFF' : Colors.primaryText }]}>
                        {profile?.name?.charAt(0)?.toUpperCase() || 'M'}
                      </Text>
                    </LinearGradient>
                  )}
                </View>
              </LinearGradient>
            </View>

            <View style={styles.profileInfo}>
              <Text
                style={[Typography.headlineMedium, { color: Colors.primaryText }]}
                numberOfLines={1}
              >
                {profile?.name || 'Super Mom'}
              </Text>
              <Text
                style={[
                  Typography.bodyMedium,
                  { color: Colors.silverGrey, marginTop: Spacing.xs },
                ]}
                numberOfLines={1}
              >
                {profile?.email || user?.email || 'mom@grit.app'}
              </Text>
              {/* Wellness Badge */}
              <View style={[
                styles.wellnessBadge,
                {
                  backgroundColor: isDark
                    ? 'rgba(45, 212, 191, 0.12)'
                    : 'rgba(20, 184, 166, 0.08)',
                },
              ]}>
                <Ionicons name="heart" size={12} color={Colors.electricTeal} />
                <Text style={[Typography.labelSmall, { color: Colors.electricTeal }]}>
                  Wellness: {wellnessScore}/100
                </Text>
              </View>
            </View>
          </View>

          {/* Live Stats Row */}
          <View
            style={[
              styles.statsContainer,
              { borderTopColor: Colors.glassBorder },
            ]}
          >
            {/* Total Savings Stat */}
            <View style={styles.stat}>
              <View
                style={[
                  styles.statIconBg,
                  { backgroundColor: isDark ? 'rgba(45,212,191,0.12)' : 'rgba(20,184,166,0.08)' },
                ]}
              >
                <Ionicons name="wallet" size={16} color={Colors.electricTeal} />
              </View>
              <Text
                style={[
                  Typography.headlineMedium,
                  { color: Colors.electricTeal, marginTop: Spacing.xs },
                ]}
                numberOfLines={1}
              >
                {currency}{totalSavings.toFixed(0)}
              </Text>
              <Text style={[Typography.labelSmall, { color: Colors.silverGrey, marginTop: 2 }]}>
                Saved
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Streak Stat */}
            <View style={styles.stat}>
              <View
                style={[
                  styles.statIconBg,
                  { backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)' },
                ]}
              >
                <Ionicons name="flame" size={16} color={Colors.sunKissedAmber} />
              </View>
              <Text
                style={[
                  Typography.headlineMedium,
                  { color: Colors.electricTeal, marginTop: Spacing.xs },
                ]}
              >
                {momentumStreak}
              </Text>
              <Text style={[Typography.labelSmall, { color: Colors.silverGrey, marginTop: 2 }]}>
                Day Streak
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Milestones Stat */}
            <View style={styles.stat}>
              <View
                style={[
                  styles.statIconBg,
                  { backgroundColor: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)' },
                ]}
              >
                <Ionicons name="trophy" size={16} color={Colors.amethyst} />
              </View>
              <Text
                style={[
                  Typography.headlineMedium,
                  { color: Colors.electricTeal, marginTop: Spacing.xs },
                ]}
              >
                {unlockedCount}
              </Text>
              <Text style={[Typography.labelSmall, { color: Colors.silverGrey, marginTop: 2 }]}>
                Milestones
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* ════════ GRITIFY ELITE STATUS CARD ════════ */}
        {isPremium ? (
          <GlassCard animated delay={50} style={{ marginBottom: Spacing.lg }}>
            <View style={styles.premiumCard}>
              <View style={styles.premiumHeader}>
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.amethyst]}
                  style={styles.premiumBadge}
                >
                  <Ionicons name="trophy" size={20} color="#FFFFFF" />
                </LinearGradient>
                <View style={styles.premiumInfo}>
                  <Text style={[Typography.headlineSmall, { color: Colors.primaryText }]}>
                    Grit Elite
                  </Text>
                  <Text style={[Typography.bodySmall, { color: Colors.silverGrey, marginTop: 2 }]}>
                    Premium Mom-Boss Access
                  </Text>
                </View>
                <View
                  style={[
                    styles.activeStatusDot,
                    { backgroundColor: Colors.success },
                  ]}
                />
              </View>
              <View style={styles.premiumFeatures}>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.electricTeal} />
                  <Text style={[Typography.bodySmall, { color: Colors.secondaryText, marginLeft: Spacing.sm }]}>
                    Unlimited AI Coach Access
                  </Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.electricTeal} />
                  <Text style={[Typography.bodySmall, { color: Colors.secondaryText, marginLeft: Spacing.sm }]}>
                    Advanced Financial Hubs
                  </Text>
                </View>
                <View style={styles.premiumFeature}>
                  <Ionicons name="checkmark-circle" size={16} color={Colors.electricTeal} />
                  <Text style={[Typography.bodySmall, { color: Colors.secondaryText, marginLeft: Spacing.sm }]}>
                    Exclusive Challenges & Rewards
                  </Text>
                </View>
              </View>
            </View>
          </GlassCard>
        ) : (
          <PressableScale onPress={handleUnlockPress} scaleValue={0.98}>
            <GlassCard animated delay={50} style={{ marginBottom: Spacing.lg }}>
              <View style={styles.premiumCard}>
                <View style={[styles.upgradeContent, { paddingVertical: Spacing.sm }]}>
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.amethyst]}
                    style={[styles.upgradeIcon, { width: 48, height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' }]}
                  >
                    <Ionicons name="rocket" size={24} color="#FFFFFF" />
                  </LinearGradient>
                  <View style={styles.upgradeText}>
                    <Text style={[Typography.titleMedium, { color: Colors.primaryText, fontWeight: '700' }]}>
                      Unlock Elite Access
                    </Text>
                    <Text style={[Typography.bodySmall, { color: Colors.secondaryText, marginTop: 2 }]} numberOfLines={1}>
                      Unlimited coaching & premium tools
                    </Text>
                  </View>
                  <View style={{
                    width: 32, height: 32, borderRadius: 16,
                    backgroundColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                    alignItems: 'center', justifyContent: 'center'
                  }}>
                    <Ionicons name="arrow-forward" size={18} color={Colors.electricTeal} />
                  </View>
                </View>
              </View>
            </GlassCard>
          </PressableScale>
        )}

        {/* ════════ FINANCIAL BLUEPRINT CARD ════════ */}
        <GlassCard animated delay={100} style={{ marginBottom: Spacing.lg }}>
          <View style={styles.blueprintHeader}>
            <View>
              <Text style={[Typography.headlineSmall, { color: Colors.primaryText }]}>
                Financial Blueprint
              </Text>
              <Text
                style={[
                  Typography.bodySmall,
                  { color: Colors.silverGrey, marginTop: Spacing.xs },
                ]}
              >
                Your monthly plan
              </Text>
            </View>

            {/* Edit Button with Gradient Ring */}
            <PressableScale onPress={handleOpenEditModal} scaleValue={0.9}>
              <LinearGradient
                colors={[Colors.electricTeal, Colors.amethyst]}
                style={styles.editButtonGradientRing}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <View
                  style={[
                    styles.editButtonInner,
                    { backgroundColor: Colors.cardBackground },
                  ]}
                >
                  <Ionicons name="create-outline" size={18} color={Colors.electricTeal} />
                </View>
              </LinearGradient>
            </PressableScale>
          </View>

          {isSaving && (
            <Animated.View
              style={[
                styles.recalculatingBanner,
                {
                  opacity: recalculateAnim,
                  transform: [{ scale: recalculateAnim }],
                },
              ]}
            >
              <LinearGradient
                colors={[Colors.amethyst, Colors.electricTeal]}
                style={styles.recalculatingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="sync" size={14} color="#FFFFFF" />
                <Text style={[Typography.labelMedium, { color: '#FFFFFF', marginLeft: Spacing.sm }]}>
                  Recalculating...
                </Text>
              </LinearGradient>
            </Animated.View>
          )}

          <View style={styles.blueprintDetails}>
            {/* Monthly Income */}
            <View
              style={[
                styles.blueprintRow,
                { borderBottomColor: Colors.glassBorder, borderBottomWidth: 1 },
              ]}
            >
              <View style={styles.blueprintRowLeft}>
                <View style={[
                  styles.blueprintIconBg,
                  { backgroundColor: isDark ? 'rgba(45,212,191,0.12)' : 'rgba(20,184,166,0.08)' },
                ]}>
                  <Ionicons name="cash-outline" size={16} color={Colors.electricTeal} />
                </View>
                <Text style={[Typography.bodyMedium, { color: Colors.silverGrey }]}>
                  Monthly Income
                </Text>
              </View>
              <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                {currency}{monthlyIncome.toFixed(0)}
              </Text>
            </View>

            {/* Savings Goal */}
            <View
              style={[
                styles.blueprintRow,
                { borderBottomColor: Colors.glassBorder, borderBottomWidth: 1 },
              ]}
            >
              <View style={styles.blueprintRowLeft}>
                <View style={[
                  styles.blueprintIconBg,
                  { backgroundColor: isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)' },
                ]}>
                  <Ionicons name="flag-outline" size={16} color={Colors.amethyst} />
                </View>
                <Text style={[Typography.bodyMedium, { color: Colors.silverGrey }]}>
                  Savings Goal
                </Text>
              </View>
              <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                {currency}{savingsGoal.toFixed(0)}
              </Text>
            </View>

            {/* Daily Allowance */}
            <View style={styles.blueprintRow}>
              <View style={styles.blueprintRowLeft}>
                <View style={[
                  styles.blueprintIconBg,
                  { backgroundColor: isDark ? 'rgba(245,158,11,0.12)' : 'rgba(245,158,11,0.08)' },
                ]}>
                  <Ionicons name="today-outline" size={16} color={Colors.sunKissedAmber} />
                </View>
                <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                  Daily Allowance
                </Text>
              </View>
              <Text
                style={[
                  Typography.headlineMedium,
                  { color: Colors.electricTeal },
                ]}
              >
                {currency}{dailyAllowance.toFixed(2)}
              </Text>
            </View>

            {/* Days remaining info */}
            <View style={[
              styles.daysRemainingBadge,
              {
                backgroundColor: isDark
                  ? 'rgba(168,85,247,0.08)'
                  : 'rgba(168,85,247,0.05)',
              },
            ]}>
              <Ionicons name="calendar-outline" size={14} color={Colors.amethyst} />
              <Text style={[Typography.labelSmall, { color: Colors.amethyst }]}>
                {daysRemainingInMonth} days remaining this month
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* ════════ MILESTONES SECTION ════════ */}
        <GlassCard animated delay={200} style={{ marginBottom: Spacing.lg }} noPadding>
          <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }}>
            <View style={styles.milestonesHeader}>
              <View>
                <Text style={[Typography.headlineSmall, { color: Colors.primaryText }]}>
                  Milestones
                </Text>
                <Text
                  style={[
                    Typography.bodySmall,
                    { color: Colors.silverGrey, marginTop: Spacing.xs },
                  ]}
                >
                  {unlockedCount} of {milestones.length} unlocked
                </Text>
              </View>
              {unlockedCount > 0 && (
                <View style={[
                  styles.milestoneCountBadge,
                  { backgroundColor: isDark ? 'rgba(168,85,247,0.15)' : 'rgba(168,85,247,0.1)' },
                ]}>
                  <Ionicons name="star" size={14} color={Colors.amethyst} />
                  <Text style={[Typography.labelMedium, { color: Colors.amethyst }]}>
                    {unlockedCount}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {milestones.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.milestonesScroll}
            >
              {milestones.map((milestone) => (
                <PressableScale
                  key={milestone.id}
                  onPress={() => {
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                    if (milestone.unlocked) {
                      Alert.alert(
                        milestone.title,
                        `${milestone.description}${milestone.unlockedAt ? `\nUnlocked: ${new Date(milestone.unlockedAt).toLocaleDateString()}` : ''}`,
                      );
                    } else {
                      Alert.alert(
                        'Locked',
                        milestone.description,
                      );
                    }
                  }}
                  scaleValue={0.93}
                  haptic={false}
                >
                  <View style={styles.milestoneItem}>
                    {milestone.unlocked ? (
                      <LinearGradient
                        colors={Gradients.hero}
                        style={styles.milestoneIconContainer}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                      >
                        <Text style={styles.milestoneEmoji}>
                          {milestone.icon || '\uD83C\uDFC6'}
                        </Text>
                      </LinearGradient>
                    ) : (
                      <View
                        style={[
                          styles.milestoneIconContainer,
                          {
                            backgroundColor: isDark
                              ? 'rgba(255,255,255,0.05)'
                              : 'rgba(0,0,0,0.04)',
                          },
                        ]}
                      >
                        <View style={styles.milestoneLockOverlay}>
                          <Ionicons
                            name="lock-closed"
                            size={20}
                            color={isDark ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.15)'}
                          />
                        </View>
                      </View>
                    )}
                    <Text
                      style={[
                        Typography.labelSmall,
                        {
                          color: milestone.unlocked
                            ? Colors.primaryText
                            : Colors.silverGrey,
                          marginTop: Spacing.sm,
                          textAlign: 'center',
                        },
                      ]}
                      numberOfLines={2}
                    >
                      {milestone.title}
                    </Text>
                    {milestone.unlocked && (
                      <View style={[
                        styles.milestoneUnlockedDot,
                        { backgroundColor: Colors.glowingGreen },
                      ]} />
                    )}
                  </View>
                </PressableScale>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyMilestones}>
              <Ionicons name="trophy-outline" size={32} color={Colors.silverGrey} />
              <Text style={[Typography.bodyMedium, { color: Colors.silverGrey, marginTop: Spacing.sm, textAlign: 'center' }]}>
                Start saving to unlock milestones
              </Text>
            </View>
          )}
        </GlassCard>

        {/* ════════ SETTINGS SECTION ════════ */}
        <View style={{ marginBottom: Spacing.lg }}>
          <Text
            style={[
              Typography.headlineSmall,
              { color: Colors.primaryText, marginBottom: Spacing.md },
            ]}
          >
            Settings
          </Text>

          <GlassCard animated delay={300}>
            {/* Theme Toggle */}
            <View style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <View
                  style={[
                    styles.settingIconBg,
                    {
                      backgroundColor: isDark
                        ? 'rgba(168,85,247,0.12)'
                        : 'rgba(168,85,247,0.08)',
                    },
                  ]}
                >
                  <Ionicons
                    name={isDark ? 'moon' : 'sunny'}
                    size={18}
                    color={Colors.amethyst}
                  />
                </View>
                <View>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    Dark Mode
                  </Text>
                  <Text style={[Typography.bodySmall, { color: Colors.silverGrey }]}>
                    {isDark ? 'On' : 'Off'}
                  </Text>
                </View>
              </View>
              <PressableScale onPress={toggleTheme} scaleValue={0.92}>
                <Animated.View
                  style={[
                    styles.settingTogglePill,
                    {
                      backgroundColor: toggleTrackColor,
                      borderColor: isDark ? 'rgba(168,85,247,0.25)' : 'rgba(0,0,0,0.06)',
                    },
                  ]}
                >
                  <Animated.View
                    style={[
                      styles.settingToggleKnob,
                      {
                        transform: [{ translateX: toggleTranslateX }],
                        backgroundColor: isDark ? '#A855F7' : '#14B8A6',
                      },
                    ]}
                  >
                    <Ionicons
                      name={isDark ? 'moon' : 'sunny'}
                      size={12}
                      color="#FFFFFF"
                    />
                  </Animated.View>
                </Animated.View>
              </PressableScale>
            </View>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Notifications */}
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Notifications', 'Notification preferences coming soon.');
              }}
              scaleValue={0.98}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconBg,
                      {
                        backgroundColor: isDark
                          ? 'rgba(245,158,11,0.12)'
                          : 'rgba(245,158,11,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="notifications-outline" size={18} color={Colors.sunKissedAmber} />
                  </View>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    Notifications
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.silverGrey} />
              </View>
            </PressableScale>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Help & Support */}
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                Alert.alert('Help & Support', 'Need assistance? Contact us at support@grit.app');
              }}
              scaleValue={0.98}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconBg,
                      {
                        backgroundColor: isDark
                          ? 'rgba(45,212,191,0.12)'
                          : 'rgba(20,184,166,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="help-circle-outline" size={18} color={Colors.electricTeal} />
                  </View>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    Help & Support
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.silverGrey} />
              </View>
            </PressableScale>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Take Tour Again */}
            <PressableScale
              onPress={handleRestartTour}
              scaleValue={0.98}
            >
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconBg,
                      {
                        backgroundColor: isDark
                          ? 'rgba(168,85,247,0.12)'
                          : 'rgba(168,85,247,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="school-outline" size={18} color={Colors.amethyst} />
                  </View>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    Take the Tour Again
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.silverGrey} />
              </View>
            </PressableScale>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Sign Out */}
            <PressableScale onPress={handleSignOut} scaleValue={0.98}>
              <View style={styles.settingItem}>
                <View style={styles.settingLeft}>
                  <View
                    style={[
                      styles.settingIconBg,
                      {
                        backgroundColor: isDark
                          ? 'rgba(225,29,72,0.12)'
                          : 'rgba(225,29,72,0.08)',
                      },
                    ]}
                  >
                    <Ionicons name="log-out-outline" size={18} color={Colors.radiantMagenta} />
                  </View>
                  <Text
                    style={[
                      Typography.titleMedium,
                      { color: Colors.radiantMagenta },
                    ]}
                  >
                    Sign Out
                  </Text>
                </View>
              </View>
            </PressableScale>
          </GlassCard>
        </View>

        {/* ════════ APP VERSION ════════ */}
        <View style={styles.versionContainer}>
          <Text style={[Typography.labelSmall, { color: Colors.silverGrey }]}>
            Grit: Mom-Boss Edition v1.0.0
          </Text>
        </View>
      </ScrollView>

      {/* ════════ EDIT BLUEPRINT MODAL ════════ */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => !isSaving && setShowEditModal(false)}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalOverlay}>
            <PressableScale
              onPress={() => !isSaving && setShowEditModal(false)}
              style={styles.modalBackdrop}
              haptic={false}
            >
              <View />
            </PressableScale>
            <View
              style={[
                styles.modalContent,
                {
                  backgroundColor: isDark
                    ? 'rgba(20, 10, 36, 0.95)'
                    : Colors.white,
                  borderColor: isDark ? Colors.glassBorder : 'transparent',
                  borderWidth: isDark ? 1 : 0,
                  paddingBottom: Math.max(insets.bottom, Spacing.xxl),
                },
              ]}
            >
              {/* Handle Bar */}
              <View style={styles.modalHandleContainer}>
                <View
                  style={[
                    styles.modalHandle,
                    {
                      backgroundColor: isDark
                        ? 'rgba(255,255,255,0.2)'
                        : 'rgba(0,0,0,0.12)',
                    },
                  ]}
                />
              </View>

              <View style={styles.modalHeader}>
                <View>
                  <Text style={[Typography.headlineMedium, { color: Colors.primaryText }]}>
                    Edit Blueprint
                  </Text>
                  <Text style={[Typography.bodySmall, { color: Colors.silverGrey, marginTop: Spacing.xs }]}>
                    Update your financial plan
                  </Text>
                </View>
                <PressableScale
                  onPress={() => !isSaving && setShowEditModal(false)}
                  scaleValue={0.85}
                  disabled={isSaving}
                >
                  <View
                    style={[
                      styles.modalCloseButton,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255,255,255,0.08)'
                          : 'rgba(0,0,0,0.05)',
                      },
                    ]}
                  >
                    <Ionicons name="close" size={20} color={Colors.primaryText} />
                  </View>
                </PressableScale>
              </View>

              <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
                {/* Monthly Income Input */}
                <Text
                  style={[
                    Typography.labelLarge,
                    { color: Colors.primaryText, marginTop: Spacing.lg },
                  ]}
                >
                  Monthly Income
                </Text>
                <View
                  style={[
                    styles.amountInput,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : Colors.lightCream,
                      borderColor: Colors.glassBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.headlineMedium,
                      { color: Colors.electricTeal, marginRight: Spacing.sm },
                    ]}
                  >
                    {currency}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      Typography.headlineMedium,
                      { color: Colors.primaryText },
                    ]}
                    placeholder="3000"
                    placeholderTextColor={Colors.silverGrey}
                    keyboardType="decimal-pad"
                    value={editIncome}
                    onChangeText={setEditIncome}
                    editable={!isSaving}
                  />
                </View>

                {/* Savings Goal Input */}
                <Text
                  style={[
                    Typography.labelLarge,
                    { color: Colors.primaryText, marginTop: Spacing.lg },
                  ]}
                >
                  Savings Goal
                </Text>
                <View
                  style={[
                    styles.amountInput,
                    {
                      backgroundColor: isDark ? 'rgba(255,255,255,0.05)' : Colors.lightCream,
                      borderColor: Colors.glassBorder,
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.headlineMedium,
                      { color: Colors.electricTeal, marginRight: Spacing.sm },
                    ]}
                  >
                    {currency}
                  </Text>
                  <TextInput
                    style={[
                      styles.input,
                      Typography.headlineMedium,
                      { color: Colors.primaryText },
                    ]}
                    placeholder="500"
                    placeholderTextColor={Colors.silverGrey}
                    keyboardType="decimal-pad"
                    value={editSavingsGoal}
                    onChangeText={setEditSavingsGoal}
                    editable={!isSaving}
                  />
                </View>

                {/* Preview Card */}
                {editIncome && editSavingsGoal && parseFloat(editIncome) > 0 && parseFloat(editSavingsGoal) > 0 && parseFloat(editSavingsGoal) < parseFloat(editIncome) && (
                  <View style={[
                    styles.previewCard,
                    {
                      backgroundColor: isDark ? 'rgba(45, 212, 191, 0.08)' : 'rgba(20, 184, 166, 0.06)',
                      borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(20, 184, 166, 0.15)',
                    },
                  ]}>
                    <View style={styles.previewRow}>
                      <Ionicons name="calculator-outline" size={16} color={Colors.electricTeal} />
                      <Text style={[Typography.labelLarge, { color: Colors.electricTeal }]}>
                        Preview
                      </Text>
                    </View>
                    <View style={styles.previewDetails}>
                      <Text style={[Typography.bodyMedium, { color: Colors.secondaryText }]}>
                        New daily allowance:
                      </Text>
                      <Text style={[Typography.titleMedium, { color: Colors.electricTeal, fontWeight: '700' }]}>
                        {formatCurrency(
                          currency,
                          (parseFloat(editIncome) - parseFloat(editSavingsGoal)) / daysRemainingInMonth,
                        )}
                      </Text>
                    </View>
                  </View>
                )}
              </ScrollView>

              {/* Save Button */}
              <PressableScale
                onPress={handleSaveBlueprint}
                style={{ marginTop: Spacing.lg }}
                disabled={isSaving}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.saveButtonGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={[Typography.titleLarge, { color: '#FFFFFF' }]}>
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </LinearGradient>
              </PressableScale>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
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

  // ─── Header ────────────────────────────────────────────────────────────────
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  // ─── Premium Pill Theme Toggle ─────────────────────────────────────────────
  themeTogglePill: {
    width: 52,
    height: 28,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    justifyContent: 'center',
  },
  themeToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },

  // ─── Profile Card ─────────────────────────────────────────────────────────
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.lg,
    gap: Spacing.md,
  },
  avatarRingOuter: {
    width: 80,
    height: 80,
  },
  avatarGradientRing: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 3,
  },
  avatarInner: {
    width: 74,
    height: 74,
    borderRadius: 37,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emojiAvatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 37,
  },
  emojiAvatar: {
    fontSize: 40,
  },
  avatarGradientFill: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarInitial: {
    ...Typography.headlineLarge,
    color: '#FFFFFF',
  },
  profileInfo: {
    flex: 1,
  },
  wellnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
    alignSelf: 'flex-start',
    marginTop: Spacing.sm,
  },

  // ─── Stats ─────────────────────────────────────────────────────────────────
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
    flex: 1,
  },
  statIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statDivider: {
    width: 1,
    height: 48,
  },

  // ─── Blueprint ─────────────────────────────────────────────────────────────
  blueprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  editButtonGradientRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 2,
  },
  editButtonInner: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalculatingBanner: {
    marginBottom: Spacing.md,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  recalculatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.sm,
  },
  blueprintDetails: {},
  blueprintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  blueprintRowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  blueprintIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  daysRemainingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.md,
    marginTop: Spacing.sm,
  },

  // ─── Milestones ────────────────────────────────────────────────────────────
  milestonesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  milestoneCountBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  milestonesScroll: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.lg,
    gap: Spacing.md,
  },
  milestoneItem: {
    alignItems: 'center',
    width: 72,
  },
  milestoneIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  milestoneEmoji: {
    fontSize: 28,
  },
  milestoneLockOverlay: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneUnlockedDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginTop: 4,
  },
  emptyMilestones: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
  },

  // ─── Settings ──────────────────────────────────────────────────────────────
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.md,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
  },
  settingIconBg: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  settingDivider: {
    height: 1,
    marginLeft: 52,
  },
  settingTogglePill: {
    width: 52,
    height: 28,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
    justifyContent: 'center',
  },
  settingToggleKnob: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      },
      android: { elevation: 3 },
    }),
  },

  // ─── Version ───────────────────────────────────────────────────────────────
  versionContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.lg,
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
    borderRadius: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    marginTop: Spacing.sm,
  },
  input: {
    flex: 1,
    paddingVertical: Spacing.md,
  },
  previewCard: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    marginTop: Spacing.lg,
  },
  previewRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  previewDetails: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  saveButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
    borderRadius: BorderRadius.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
        marginBottom: 50,
      },
      android: { elevation: 6 },
    }),
  },

  // Premium Status Card
  premiumCard: {
    padding: Spacing.lg,
  },
  premiumHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  premiumBadge: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  premiumInfo: {
    flex: 1,
  },
  activeStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    position: 'absolute',
    top: 0,
    right: 0,
  },
  premiumFeatures: {
    gap: Spacing.sm,
  },
  premiumFeature: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  // Upgrade Card
  upgradeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  upgradeIcon: {
    // styles handled inline
  },
  upgradeText: {
    flex: 1,
  },
});
