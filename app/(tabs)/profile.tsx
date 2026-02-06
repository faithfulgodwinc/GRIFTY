import React, { useState, useEffect, useRef } from 'react';
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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { useAuth } from '@fastshot/auth';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface Milestone {
  id: string;
  title: string;
  description: string;
  amount: number;
  unlocked: boolean;
  icon: string;
}

const MILESTONES: Milestone[] = [
  { id: '1', title: 'First Steps', description: 'Created your account', amount: 0, unlocked: true, icon: '👶' },
  { id: '2', title: 'Savings Started', description: 'Saved your first £100', amount: 100, unlocked: false, icon: '🌱' },
  { id: '3', title: 'Budget Master', description: 'Stayed under budget for 7 days', amount: 0, unlocked: false, icon: '🎯' },
  { id: '4', title: 'Emergency Fund', description: 'Built £1000 emergency fund', amount: 1000, unlocked: false, icon: '🛡️' },
  { id: '5', title: 'Investment Pro', description: 'Started investing for the future', amount: 0, unlocked: false, icon: '📈' },
  { id: '6', title: 'Financial Freedom', description: 'Reached £10,000 savings', amount: 10000, unlocked: false, icon: '👑' },
];

export default function ProfileScreen() {
  const [userData, setUserData] = useState<any>(null);
  const [financialData, setFinancialData] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editIncome, setEditIncome] = useState('');
  const [editSavingsGoal, setEditSavingsGoal] = useState('');
  const [isRecalculating, setIsRecalculating] = useState(false);
  const { signOut, user } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const insets = useSafeAreaInsets();

  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const recalculateAnim = useRef(new Animated.Value(0)).current;
  const toggleAnim = useRef(new Animated.Value(theme === 'dark' ? 1 : 0)).current;

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    Animated.timing(toggleAnim, {
      toValue: isDark ? 1 : 0,
      duration: 300,
      useNativeDriver: false,
    }).start();
  }, [isDark]);

  const loadData = async () => {
    try {
      const user = await storage.getUserData();
      const financial = await storage.getFinancialData();
      setUserData(user);
      setFinancialData(financial);
      if (financial) {
        setEditIncome(financial.monthlyIncome?.toString() || '');
        setEditSavingsGoal(financial.savingsGoal?.toString() || '');
      }
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const currency = financialData?.currency || '£';

  const handleEditBlueprint = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowEditModal(true);
  };

  const handleSaveBlueprint = async () => {
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

    try {
      setIsRecalculating(true);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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

      const dailyBudget = (income - goal) / 30;

      const updatedUserData = {
        ...userData,
        monthlyIncome: income,
        savingsGoal: goal,
        dailyBudget,
      };

      const updatedFinancialData = {
        ...financialData,
        monthlyIncome: income,
        savingsGoal: goal,
        dailyBudget,
      };

      await storage.setUserData(updatedUserData);
      await storage.setFinancialData(updatedFinancialData);

      setUserData(updatedUserData);
      setFinancialData(updatedFinancialData);

      setTimeout(() => {
        setIsRecalculating(false);
        setShowEditModal(false);
      }, 600);
    } catch (error) {
      console.error('Failed to update blueprint:', error);
      setIsRecalculating(false);
      Alert.alert('Update Failed', 'Unable to save your changes. Please try again.');
    }
  };

  const handleSignOut = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    signOut();
  };

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

  const unlockedCount = MILESTONES.filter((m) => m.unlocked).length;

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md, paddingBottom: 140 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header with Theme Toggle */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.headlineLarge, { color: Colors.primaryText }]}>
              Your Journey
            </Text>
            <Text
              style={[
                Typography.titleSmall,
                { color: Colors.electricTeal, marginTop: Spacing.xs },
              ]}
            >
              Legacy Map
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

        {/* Profile Card */}
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
                  {userData?.avatarUrl &&
                  !userData.avatarUrl.startsWith('http') ? (
                    <View
                      style={[
                        styles.emojiAvatarContainer,
                        { backgroundColor: isDark ? Colors.lightCream : Colors.lightCream },
                      ]}
                    >
                      <Text style={styles.emojiAvatar}>{userData.avatarUrl}</Text>
                    </View>
                  ) : (
                    <LinearGradient
                      colors={Gradients.hero}
                      style={styles.avatarGradientFill}
                    >
                      <Text style={[styles.avatarInitial, { color: '#FFFFFF' }]}>
                        {userData?.name?.charAt(0) || 'M'}
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
                {userData?.name || 'Super Mom'}
              </Text>
              <Text
                style={[
                  Typography.bodyMedium,
                  { color: Colors.silverGrey, marginTop: Spacing.xs },
                ]}
                numberOfLines={1}
              >
                {user?.email || 'mom@grit.app'}
              </Text>
            </View>
          </View>

          {/* Stats Row */}
          <View
            style={[
              styles.statsContainer,
              { borderTopColor: Colors.glassBorder },
            ]}
          >
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
                {financialData?.streakDays || 0}
              </Text>
              <Text style={[Typography.labelSmall, { color: Colors.silverGrey, marginTop: 2 }]}>
                Day Streak
              </Text>
            </View>

            <View style={[styles.statDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Saved Stat */}
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
                {currency}{financialData?.monthlySavings || 0}
              </Text>
              <Text style={[Typography.labelSmall, { color: Colors.silverGrey, marginTop: 2 }]}>
                Saved
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

        {/* Financial Blueprint Card */}
        <GlassCard animated delay={100} style={{ marginBottom: Spacing.lg }}>
          <View style={styles.blueprintHeader}>
            <View>
              <Text
                style={[Typography.headlineSmall, { color: Colors.primaryText }]}
              >
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
            <PressableScale onPress={handleEditBlueprint} scaleValue={0.9}>
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

          {isRecalculating && (
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
            <View
              style={[
                styles.blueprintRow,
                { borderBottomColor: Colors.glassBorder, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[Typography.bodyMedium, { color: Colors.silverGrey }]}>
                Monthly Earnings
              </Text>
              <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                {currency}{financialData?.monthlyIncome?.toFixed(0) || '0'}
              </Text>
            </View>

            <View
              style={[
                styles.blueprintRow,
                { borderBottomColor: Colors.glassBorder, borderBottomWidth: 1 },
              ]}
            >
              <Text style={[Typography.bodyMedium, { color: Colors.silverGrey }]}>
                Savings Goal
              </Text>
              <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                {currency}{financialData?.savingsGoal?.toFixed(0) || '0'}
              </Text>
            </View>

            <View style={styles.blueprintRow}>
              <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                Daily Budget
              </Text>
              <Text
                style={[
                  Typography.headlineMedium,
                  { color: Colors.electricTeal },
                ]}
              >
                {currency}{financialData?.dailyBudget?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Milestones Section */}
        <GlassCard animated delay={200} style={{ marginBottom: Spacing.lg }} noPadding>
          <View style={{ paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: Spacing.md }}>
            <Text style={[Typography.headlineSmall, { color: Colors.primaryText }]}>
              Milestones
            </Text>
            <Text
              style={[
                Typography.bodySmall,
                { color: Colors.silverGrey, marginTop: Spacing.xs },
              ]}
            >
              {unlockedCount} of {MILESTONES.length} unlocked
            </Text>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.milestonesScroll}
          >
            {MILESTONES.map((milestone) => (
              <View key={milestone.id} style={styles.milestoneItem}>
                {milestone.unlocked ? (
                  <LinearGradient
                    colors={Gradients.hero}
                    style={styles.milestoneIconContainer}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                  >
                    <Text style={styles.milestoneEmoji}>{milestone.icon}</Text>
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
              </View>
            ))}
          </ScrollView>
        </GlassCard>

        {/* Settings Section */}
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
            {/* Edit Profile */}
            <PressableScale onPress={() => {}} scaleValue={0.98}>
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
                    <Ionicons name="person-outline" size={18} color={Colors.electricTeal} />
                  </View>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    Edit Profile
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={Colors.silverGrey} />
              </View>
            </PressableScale>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            {/* Notifications */}
            <PressableScale onPress={() => {}} scaleValue={0.98}>
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
            <PressableScale onPress={() => {}} scaleValue={0.98}>
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
                    <Ionicons name="help-circle-outline" size={18} color={Colors.vibrantPurple} />
                  </View>
                  <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>
                    Help & Support
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
      </ScrollView>

      {/* Edit Blueprint Modal */}
      <Modal
        visible={showEditModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowEditModal(false)}
      >
        <View style={styles.modalOverlay}>
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
              <Text style={[Typography.headlineMedium, { color: Colors.primaryText }]}>
                Edit Blueprint
              </Text>
              <PressableScale onPress={() => setShowEditModal(false)} scaleValue={0.85}>
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

            <Text
              style={[
                Typography.labelLarge,
                { color: Colors.primaryText, marginTop: Spacing.lg },
              ]}
            >
              Monthly Earnings
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
                keyboardType="numeric"
                value={editIncome}
                onChangeText={setEditIncome}
              />
            </View>

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
                keyboardType="numeric"
                value={editSavingsGoal}
                onChangeText={setEditSavingsGoal}
              />
            </View>

            <PressableScale
              onPress={handleSaveBlueprint}
              style={{ marginTop: Spacing.lg }}
              disabled={isRecalculating}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={[Typography.titleLarge, { color: '#FFFFFF' }]}>
                  {isRecalculating ? 'Saving...' : 'Save Changes'}
                </Text>
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
    paddingHorizontal: Spacing.lg,
  },

  /* Header */
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },

  /* Premium Pill Theme Toggle */
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

  /* Profile Card */
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

  /* Stats */
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

  /* Blueprint */
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

  /* Milestones */
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

  /* Settings */
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

  /* Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: BorderRadius.xxl,
    borderTopRightRadius: BorderRadius.xxl,
    paddingHorizontal: Spacing.lg,
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
  saveButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    borderRadius: BorderRadius.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
  },
});
