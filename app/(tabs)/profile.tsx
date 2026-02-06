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
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { useAuth } from '@fastshot/auth';
import { useTheme } from '@/contexts/ThemeContext';
import * as Haptics from 'expo-haptics';

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

  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  const recalculateAnim = new Animated.Value(0);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await storage.getUserData();
    const financial = await storage.getFinancialData();
    setUserData(user);
    setFinancialData(financial);
    if (financial) {
      setEditIncome(financial.monthlyIncome?.toString() || '');
      setEditSavingsGoal(financial.savingsGoal?.toString() || '');
    }
  };

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

      // Trigger recalculating animation
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

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header with Theme Toggle */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: Colors.primaryText }]}>Your Journey</Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>Legacy Map</Text>
          </View>
          <TouchableOpacity
            style={[styles.themeToggle, { backgroundColor: Colors.cardBackground, borderColor: Colors.glassBorder }]}
            onPress={toggleTheme}
          >
            <Ionicons
              name={theme === 'dark' ? 'moon' : 'sunny'}
              size={24}
              color={theme === 'dark' ? Colors.amethyst : Colors.sunKissedAmber}
            />
          </TouchableOpacity>
        </View>

        {/* Profile Card */}
        <GlassCard style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.avatarLarge}>
              {userData?.avatarUrl && userData.avatarUrl.startsWith('http') ? (
                <LinearGradient
                  colors={Gradients.hero}
                  style={styles.avatarGradient}
                >
                  <Text style={styles.avatarText}>
                    {userData?.name?.charAt(0) || 'M'}
                  </Text>
                </LinearGradient>
              ) : (
                <View style={[styles.emojiAvatarContainer, { backgroundColor: Colors.lightCream }]}>
                  <Text style={styles.emojiAvatar}>
                    {userData?.avatarUrl || '👩'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={[styles.userName, { color: Colors.primaryText }]}>{userData?.name || 'Super Mom'}</Text>
              <Text style={[styles.userEmail, { color: Colors.secondaryText }]}>{user?.email || 'mom@grit.app'}</Text>
            </View>
          </View>

          <View style={[styles.statsContainer, { borderTopColor: Colors.glassBorder }]}>
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.electricTeal }]}>
                {financialData?.streakDays || 0}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.tertiaryText }]}>Day Streak</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: Colors.glassBorder }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.electricTeal }]}>
                {financialData?.currency || '£'}{financialData?.monthlySavings || 0}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.tertiaryText }]}>Saved</Text>
            </View>
            <View style={[styles.statDivider, { backgroundColor: Colors.glassBorder }]} />
            <View style={styles.stat}>
              <Text style={[styles.statValue, { color: Colors.electricTeal }]}>
                {MILESTONES.filter((m) => m.unlocked).length}
              </Text>
              <Text style={[styles.statLabel, { color: Colors.tertiaryText }]}>Milestones</Text>
            </View>
          </View>
        </GlassCard>

        {/* Financial Blueprint Card */}
        <GlassCard style={styles.blueprintCard}>
          <View style={styles.blueprintHeader}>
            <View>
              <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Financial Blueprint</Text>
              <Text style={[styles.blueprintSubtitle, { color: Colors.secondaryText }]}>
                Your monthly plan
              </Text>
            </View>
            <TouchableOpacity
              style={[styles.editButton, { backgroundColor: Colors.electricTeal }]}
              onPress={handleEditBlueprint}
            >
              <Ionicons name="create-outline" size={20} color={Colors.white} />
            </TouchableOpacity>
          </View>

          {isRecalculating && (
            <Animated.View style={[styles.recalculatingBanner, {
              opacity: recalculateAnim,
              transform: [{ scale: recalculateAnim }],
            }]}>
              <LinearGradient
                colors={[Colors.amethyst, Colors.electricTeal]}
                style={styles.recalculatingGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="sync" size={16} color={Colors.white} />
                <Text style={styles.recalculatingText}>Recalculating...</Text>
              </LinearGradient>
            </Animated.View>
          )}

          <View style={styles.blueprintDetails}>
            <View style={[styles.blueprintRow, { borderBottomColor: Colors.glassBorder }]}>
              <Text style={[styles.blueprintLabel, { color: Colors.secondaryText }]}>Monthly Earnings</Text>
              <Text style={[styles.blueprintValue, { color: Colors.primaryText }]}>
                {financialData?.currency || '£'}{financialData?.monthlyIncome?.toFixed(0) || '0'}
              </Text>
            </View>
            <View style={[styles.blueprintRow, { borderBottomColor: Colors.glassBorder }]}>
              <Text style={[styles.blueprintLabel, { color: Colors.secondaryText }]}>Savings Goal</Text>
              <Text style={[styles.blueprintValue, { color: Colors.primaryText }]}>
                {financialData?.currency || '£'}{financialData?.savingsGoal?.toFixed(0) || '0'}
              </Text>
            </View>
            <View style={styles.blueprintRow}>
              <Text style={[styles.blueprintLabelHighlight, { color: Colors.primaryText }]}>Daily Budget</Text>
              <Text style={[styles.blueprintValueHighlight, { color: Colors.electricTeal }]}>
                {financialData?.currency || '£'}{financialData?.dailyBudget?.toFixed(2) || '0.00'}
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Settings</Text>
          <GlassCard>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={24} color={Colors.electricTeal} />
                <Text style={[styles.settingText, { color: Colors.primaryText }]}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color={Colors.sunKissedAmber} />
                <Text style={[styles.settingText, { color: Colors.primaryText }]}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.vibrantPurple} />
                <Text style={[styles.settingText, { color: Colors.primaryText }]}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>

            <View style={[styles.settingDivider, { backgroundColor: Colors.glassBorder }]} />

            <TouchableOpacity
              style={styles.settingItem}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
                signOut();
              }}
            >
              <View style={styles.settingLeft}>
                <Ionicons name="log-out-outline" size={24} color={Colors.radiantMagenta} />
                <Text style={[styles.settingText, { color: Colors.radiantMagenta }]}>
                  Sign Out
                </Text>
              </View>
            </TouchableOpacity>
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
          <View style={[styles.modalContent, { backgroundColor: Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Edit Blueprint</Text>
              <TouchableOpacity onPress={() => setShowEditModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Monthly Earnings</Text>
            <View style={[styles.amountInput, { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder }]}>
              <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>
                {financialData?.currency || '£'}
              </Text>
              <TextInput
                style={[styles.input, { color: Colors.primaryText }]}
                placeholder="3000"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="numeric"
                value={editIncome}
                onChangeText={setEditIncome}
              />
            </View>

            <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Savings Goal</Text>
            <View style={[styles.amountInput, { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder }]}>
              <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>
                {financialData?.currency || '£'}
              </Text>
              <TextInput
                style={[styles.input, { color: Colors.primaryText }]}
                placeholder="500"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="numeric"
                value={editSavingsGoal}
                onChangeText={setEditSavingsGoal}
              />
            </View>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBlueprint}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Save Changes</Text>
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
  themeToggle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 6,
  },
  profileCard: {
    marginBottom: 20,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
    gap: 16,
  },
  avatarLarge: {
    width: 80,
    height: 80,
    borderRadius: 40,
    overflow: 'hidden',
  },
  avatarGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  emojiAvatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 40,
  },
  emojiAvatar: {
    fontSize: 48,
  },
  profileInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
  },
  blueprintCard: {
    marginBottom: 20,
  },
  blueprintHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  blueprintSubtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  editButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  recalculatingBanner: {
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  recalculatingGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    gap: 8,
  },
  recalculatingText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  blueprintDetails: {},
  blueprintRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  blueprintLabel: {
    fontSize: 16,
    fontWeight: '500',
  },
  blueprintValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  blueprintLabelHighlight: {
    fontSize: 18,
    fontWeight: '700',
  },
  blueprintValueHighlight: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  settingsSection: {
    marginBottom: 20,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  settingText: {
    fontSize: 16,
    fontWeight: '500',
  },
  settingDivider: {
    height: 1,
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
});
