import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  Modal,
  Alert,
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
import { storage } from '@/utils/storage';
import { supabaseSync } from '@/utils/supabase-sync';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';
import Svg, {
  Path,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
  Circle,
} from 'react-native-svg';

interface SavingsWin {
  id: string;
  date: string;
  amount: number;
  description: string;
}

// Accent color palettes for unique win card patterns
const WIN_ACCENTS = [
  { bg: 'rgba(16, 185, 129, 0.08)', border: 'rgba(16, 185, 129, 0.15)', icon: '#10B981' },
  { bg: 'rgba(45, 212, 191, 0.08)', border: 'rgba(45, 212, 191, 0.15)', icon: '#2DD4BF' },
  { bg: 'rgba(168, 85, 247, 0.06)', border: 'rgba(168, 85, 247, 0.12)', icon: '#A855F7' },
  { bg: 'rgba(99, 102, 241, 0.06)', border: 'rgba(99, 102, 241, 0.12)', icon: '#6366F1' },
  { bg: 'rgba(245, 158, 11, 0.06)', border: 'rgba(245, 158, 11, 0.12)', icon: '#F59E0B' },
  { bg: 'rgba(236, 72, 153, 0.06)', border: 'rgba(236, 72, 153, 0.12)', icon: '#EC4899' },
];

// Decorative SVG patterns for each win card
function WinPattern({ index, size = 48 }: { index: number; size?: number }) {
  const patternType = index % 6;

  switch (patternType) {
    case 0:
      // Concentric circles
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" style={styles.winPatternSvg}>
          <Circle cx="24" cy="24" r="20" stroke="rgba(16, 185, 129, 0.1)" strokeWidth="1" fill="none" />
          <Circle cx="24" cy="24" r="14" stroke="rgba(16, 185, 129, 0.08)" strokeWidth="1" fill="none" />
          <Circle cx="24" cy="24" r="8" stroke="rgba(16, 185, 129, 0.06)" strokeWidth="1" fill="none" />
        </Svg>
      );
    case 1:
      // Diagonal lines
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" style={styles.winPatternSvg}>
          <Path d="M0 48L48 0" stroke="rgba(45, 212, 191, 0.08)" strokeWidth="1" />
          <Path d="M-12 48L36 0" stroke="rgba(45, 212, 191, 0.06)" strokeWidth="1" />
          <Path d="M12 48L60 0" stroke="rgba(45, 212, 191, 0.06)" strokeWidth="1" />
        </Svg>
      );
    case 2:
      // Diamond shape
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" style={styles.winPatternSvg}>
          <Path d="M24 4L44 24L24 44L4 24Z" stroke="rgba(168, 85, 247, 0.1)" strokeWidth="1" fill="none" />
          <Path d="M24 12L36 24L24 36L12 24Z" stroke="rgba(168, 85, 247, 0.07)" strokeWidth="1" fill="none" />
        </Svg>
      );
    case 3:
      // Dot grid
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" style={styles.winPatternSvg}>
          {[8, 20, 32, 44].map((cx) =>
            [8, 20, 32, 44].map((cy) => (
              <Circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.5" fill="rgba(99, 102, 241, 0.12)" />
            ))
          )}
        </Svg>
      );
    case 4:
      // Wave pattern
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" style={styles.winPatternSvg}>
          <Path d="M0 24C8 16 16 32 24 24C32 16 40 32 48 24" stroke="rgba(245, 158, 11, 0.1)" strokeWidth="1" fill="none" />
          <Path d="M0 32C8 24 16 40 24 32C32 24 40 40 48 32" stroke="rgba(245, 158, 11, 0.07)" strokeWidth="1" fill="none" />
        </Svg>
      );
    case 5:
      // Cross-hatch
      return (
        <Svg width={size} height={size} viewBox="0 0 48 48" style={styles.winPatternSvg}>
          <Path d="M0 16H48" stroke="rgba(236, 72, 153, 0.07)" strokeWidth="0.75" />
          <Path d="M0 32H48" stroke="rgba(236, 72, 153, 0.07)" strokeWidth="0.75" />
          <Path d="M16 0V48" stroke="rgba(236, 72, 153, 0.07)" strokeWidth="0.75" />
          <Path d="M32 0V48" stroke="rgba(236, 72, 153, 0.07)" strokeWidth="0.75" />
        </Svg>
      );
    default:
      return null;
  }
}

// SVG progress ring component
function ProgressRing({
  progress,
  size = 130,
  strokeWidth = 10,
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
        <SvgGradient id="progressGradient" x1="0" y1="0" x2="1" y2="1">
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
        stroke="url(#progressGradient)"
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

// Sparkle / celebration decorations around the ring
function SparkleEffects({
  progress,
  tealColor,
  amberColor,
}: {
  progress: number;
  tealColor: string;
  amberColor: string;
}) {
  if (progress < 25) return null;

  const sparkleCount = progress >= 100 ? 6 : progress >= 75 ? 4 : progress >= 50 ? 3 : 2;

  const sparklePositions = [
    { top: -4, right: 20 },
    { top: 20, right: -6 },
    { bottom: 10, right: -2 },
    { bottom: -4, left: 24 },
    { top: 8, left: -4 },
    { bottom: 24, left: -6 },
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
              opacity: 0.6 + (i * 0.05),
            },
          ]}
        />
      ))}
    </>
  );
}

export default function SavingsScreen() {
  const [showAddSavingsModal, setShowAddSavingsModal] = useState(false);
  const [savingsAmount, setSavingsAmount] = useState('');
  const [savingsDescription, setSavingsDescription] = useState('');
  const [totalSavings, setTotalSavings] = useState(0);
  const [savingsGoal, setSavingsGoal] = useState(0);
  const [savingsWins, setSavingsWins] = useState<SavingsWin[]>([]);
  const [currency, setCurrency] = useState('\u00A3');
  const [isLoading, setIsLoading] = useState(true);
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
      const [financialData, userData] = await Promise.all([
        storage.getFinancialData(),
        storage.getUserData(),
      ]);

      if (financialData) {
        setTotalSavings(financialData.monthlySavings || 0);
        setSavingsGoal(financialData.savingsGoal || 0);
        setCurrency(financialData.currency || '\u00A3');
      }

      if (userData) {
        setCurrency(userData.currency || '\u00A3');
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
        supabaseSync.syncFinancialData(financialData).catch((err: any) =>
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
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatCurrency = (amount: number, decimals = 2) => {
    return `${currency}${amount.toFixed(decimals)}`;
  };

  const formatCurrencyWhole = (amount: number) => {
    return `${currency}${amount.toFixed(0)}`;
  };

  // Loading state
  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <DashboardSkeleton />
      </LinearGradient>
    );
  }

  const progressPercentage = calculateProgress();
  const ringTrackColor = isDark ? 'rgba(45, 27, 61, 0.6)' : 'rgba(0, 0, 0, 0.06)';

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: Colors.primaryText }]}>
              Savings Hub
            </Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>
              Build Your Wealth
            </Text>
          </View>
          <PressableScale
            onPress={() => router.push('/(tabs)/profile')}
            style={[
              styles.settingsButton,
              {
                backgroundColor: Colors.cardBackground,
                borderColor: Colors.glassBorder,
              },
            ]}
          >
            <Ionicons name="settings-outline" size={24} color={Colors.electricTeal} />
          </PressableScale>
        </View>

        {/* Total Savings Card */}
        <GlassCard style={styles.totalSavingsCard} animated delay={0}>
          <View style={styles.totalSavingsHeader}>
            <Text style={[styles.sectionLabel, { color: Colors.tertiaryText }]}>
              Total Savings
            </Text>
            <View
              style={[
                styles.trendBadge,
                { backgroundColor: Colors.glowingGreen + '20' },
              ]}
            >
              <Ionicons name="trending-up" size={14} color={Colors.glowingGreen} />
              <Text style={[styles.trendText, { color: Colors.glowingGreen }]}>
                Growing
              </Text>
            </View>
          </View>
          <Text style={[styles.totalSavingsValue, { color: Colors.primaryText }]}>
            {formatCurrency(totalSavings)}
          </Text>
          <Text style={[styles.totalSavingsSubtext, { color: Colors.tertiaryText }]}>
            Keep up the great work!
          </Text>
        </GlassCard>

        {/* Savings Goal Progress */}
        <GlassCard style={styles.goalCard} animated delay={100}>
          <View style={styles.goalHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
              Savings Goal
            </Text>
            <Text style={[styles.goalPercentage, { color: Colors.electricTeal }]}>
              {progressPercentage.toFixed(0)}%
            </Text>
          </View>

          {/* Progress Ring Visualization */}
          <View style={styles.goalVisualization}>
            <View style={styles.progressRingContainer}>
              <SparkleEffects
                progress={progressPercentage}
                tealColor={Colors.electricTeal}
                amberColor={Colors.sunKissedAmber}
              />
              <ProgressRing
                progress={progressPercentage}
                size={130}
                strokeWidth={10}
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
                    <Ionicons name="trophy" size={20} color="#FFFFFF" />
                    <Text style={styles.goalAchievedText}>Goal Achieved!</Text>
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
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
              Savings Wins
            </Text>
            <PressableScale
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                setShowAddSavingsModal(true);
              }}
              style={[styles.addWinButton, { backgroundColor: Colors.electricTeal }]}
            >
              <Ionicons name="add" size={20} color="#FFFFFF" />
            </PressableScale>
          </View>

          {savingsWins.length === 0 ? (
            <GlassCard style={styles.emptyWinsCard} animated delay={200}>
              <EmptyState
                icon="trophy-outline"
                iconColor={Colors.sunKissedAmber}
                title="No savings wins yet"
                description="Start tracking your savings achievements and watch your wealth grow!"
                actionLabel="Add First Win"
                onAction={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                  setShowAddSavingsModal(true);
                }}
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
                  delay={200 + index * 80}
                >
                  <View style={styles.winCardInner}>
                    {/* Subtle background pattern unique to each card */}
                    <View style={styles.winPatternContainer}>
                      <WinPattern index={index} size={48} />
                    </View>

                    {/* Subtle gradient overlay tint */}
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
                          style={[
                            styles.winDescription,
                            { color: Colors.primaryText },
                          ]}
                          numberOfLines={1}
                        >
                          {win.description}
                        </Text>
                        <Text
                          style={[styles.winDate, { color: Colors.tertiaryText }]}
                        >
                          {formatDate(win.date)}
                        </Text>
                      </View>
                      <Text
                        style={[styles.winAmount, { color: Colors.glowingGreen }]}
                      >
                        +{formatCurrencyWhole(win.amount)}
                      </Text>
                    </View>
                  </View>
                </GlassCard>
              );
            })
          )}
        </View>

        {/* Tips Card */}
        <GlassCard style={styles.tipsCard} animated delay={500}>
          <View style={styles.tipsHeader}>
            <View
              style={[
                styles.tipsIconContainer,
                {
                  backgroundColor: isDark
                    ? 'rgba(245, 158, 11, 0.12)'
                    : 'rgba(245, 158, 11, 0.08)',
                },
              ]}
            >
              <Ionicons name="bulb" size={22} color={Colors.sunKissedAmber} />
            </View>
            <Text style={[styles.tipsTitle, { color: Colors.primaryText }]}>
              Savings Tip
            </Text>
          </View>
          <Text style={[styles.tipsText, { color: Colors.tertiaryText }]}>
            Automate your savings! Set aside a fixed amount each week before
            spending on anything else. Even small amounts add up over time.
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
          <View
            style={[
              styles.modalContent,
              { backgroundColor: Colors.cardBackground },
            ]}
          >
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

            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>
                Add Savings Win
              </Text>
              <PressableScale
                onPress={() => setShowAddSavingsModal(false)}
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

            <Text style={[styles.inputLabel, { color: Colors.tertiaryText }]}>
              Amount Saved
            </Text>
            <View
              style={[
                styles.amountInput,
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
                style={[styles.input, { color: Colors.primaryText }]}
                placeholder="0.00"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="decimal-pad"
                value={savingsAmount}
                onChangeText={setSavingsAmount}
              />
            </View>

            <Text
              style={[
                styles.inputLabel,
                { color: Colors.tertiaryText, marginTop: Spacing.lg },
              ]}
            >
              Description
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
              placeholder={`e.g., Meal prep saved ${currency}50 this week`}
              placeholderTextColor={Colors.mediumGray}
              value={savingsDescription}
              onChangeText={setSavingsDescription}
              multiline
            />

            <PressableScale
              onPress={handleAddSavings}
              style={styles.submitButton}
              haptic
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons
                  name="checkmark-circle-outline"
                  size={22}
                  color="#FFFFFF"
                  style={{ marginRight: Spacing.sm }}
                />
                <Text style={styles.submitButtonText}>Add Savings Win</Text>
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
    paddingBottom: 140,
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.headlineLarge,
  },
  subtitle: {
    ...Typography.titleSmall,
    marginTop: Spacing.xs,
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

  // Total Savings Card
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
  trendBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.md,
  },
  trendText: {
    ...Typography.labelMedium,
  },
  totalSavingsValue: {
    ...Typography.displayLarge,
    marginBottom: Spacing.xs,
  },
  totalSavingsSubtext: {
    ...Typography.bodyMedium,
  },

  // Goal Card
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
    width: 130,
    height: 130,
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

  // Wins Section
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
  winPatternContainer: {
    position: 'absolute',
    top: 0,
    right: 0,
    opacity: 1,
  },
  winPatternSvg: {
    // positioned by parent
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
  winDescription: {
    ...Typography.titleMedium,
    marginBottom: Spacing.xs,
  },
  winDate: {
    ...Typography.bodySmall,
  },
  winAmount: {
    ...Typography.headlineSmall,
  },

  // Tips Card
  tipsCard: {
    marginBottom: Spacing.lg,
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.md,
  },
  tipsIconContainer: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.round,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipsTitle: {
    ...Typography.titleMedium,
  },
  tipsText: {
    ...Typography.bodyMedium,
    lineHeight: 22,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl + 8,
    borderTopRightRadius: BorderRadius.xxl + 8,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxl,
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
  inputLabel: {
    ...Typography.titleSmall,
    marginBottom: Spacing.sm,
  },
  amountInput: {
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
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: '700',
    paddingVertical: Spacing.md,
  },
  textInput: {
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    ...Typography.bodyLarge,
    minHeight: 80,
    textAlignVertical: 'top',
  },
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
