import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { storage } from '@/utils/storage';
import { useAuth } from '@fastshot/auth';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

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
  const { signOut, user } = useAuth();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const user = await storage.getUserData();
    const financial = await storage.getFinancialData();
    setUserData(user);
    setFinancialData(financial);
  };

  const renderJourneyPath = () => {
    const pathHeight = MILESTONES.length * 120;
    const midX = width / 2;

    let path = `M ${midX} 0`;

    MILESTONES.forEach((_, index) => {
      const y = (index + 1) * 120;
      const offsetX = index % 2 === 0 ? 40 : -40;
      path += ` Q ${midX + offsetX} ${y - 40} ${midX} ${y}`;
    });

    return path;
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Your Journey</Text>
            <Text style={styles.subtitle}>Legacy Map</Text>
          </View>
          <TouchableOpacity style={styles.settingsButton}>
            <Ionicons name="settings-outline" size={24} color={Colors.primaryText} />
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
                <View style={styles.emojiAvatarContainer}>
                  <Text style={styles.emojiAvatar}>
                    {userData?.avatarUrl || '👩'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.userName}>{userData?.name || 'Super Mom'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'mom@grit.app'}</Text>
            </View>
          </View>

          <View style={styles.statsContainer}>
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {financialData?.streakDays || 0}
              </Text>
              <Text style={styles.statLabel}>Day Streak</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {financialData?.currency || '£'}{financialData?.monthlySavings || 0}
              </Text>
              <Text style={styles.statLabel}>Saved</Text>
            </View>
            <View style={styles.statDivider} />
            <View style={styles.stat}>
              <Text style={styles.statValue}>
                {MILESTONES.filter((m) => m.unlocked).length}
              </Text>
              <Text style={styles.statLabel}>Milestones</Text>
            </View>
          </View>
        </GlassCard>

        {/* Streak Fire */}
        <GlassCard style={styles.streakCard}>
          <View style={styles.streakContent}>
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              style={styles.fireContainer}
            >
              <Text style={styles.fireEmoji}>🔥</Text>
            </LinearGradient>
            <View style={styles.streakInfo}>
              <Text style={styles.streakTitle}>Streak Fire</Text>
              <Text style={styles.streakDescription}>
                {financialData?.streakDays || 0} days of staying on budget!
              </Text>
            </View>
          </View>
          <View style={styles.streakProgress}>
            <View style={styles.streakBar}>
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                style={[
                  styles.streakBarFill,
                  { width: `${Math.min(((financialData?.streakDays || 0) / 30) * 100, 100)}%` },
                ]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              />
            </View>
            <Text style={styles.streakTarget}>30 days goal</Text>
          </View>
        </GlassCard>

        {/* Legacy Map */}
        <View style={styles.journeySection}>
          <Text style={styles.sectionTitle}>Your Legacy Map</Text>
          <Text style={styles.sectionSubtitle}>
            Unlock milestones as you progress
          </Text>

          <View style={styles.journeyMap}>
            {MILESTONES.map((milestone, index) => (
              <View
                key={milestone.id}
                style={[
                  styles.milestoneContainer,
                  index % 2 === 0 ? styles.milestoneLeft : styles.milestoneRight,
                ]}
              >
                <View style={styles.milestoneNode}>
                  <View
                    style={[
                      styles.milestoneCircle,
                      milestone.unlocked && styles.milestoneUnlocked,
                    ]}
                  >
                    {milestone.unlocked ? (
                      <LinearGradient
                        colors={[Colors.electricTeal, Colors.vibrantPurple]}
                        style={styles.milestoneGradient}
                      >
                        <Text style={styles.milestoneIcon}>{milestone.icon}</Text>
                      </LinearGradient>
                    ) : (
                      <View style={styles.milestoneLocked}>
                        <Ionicons name="lock-closed" size={20} color={Colors.mediumGray} />
                      </View>
                    )}
                  </View>
                  {index < MILESTONES.length - 1 && (
                    <View style={styles.milestoneLine} />
                  )}
                </View>

                <TouchableOpacity
                  style={styles.milestoneCard}
                  onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
                  activeOpacity={0.8}
                >
                  <GlassCard>
                    <Text style={styles.milestoneTitle}>{milestone.title}</Text>
                    <Text style={styles.milestoneDescription}>
                      {milestone.description}
                    </Text>
                    {milestone.unlocked && (
                      <View style={styles.unlockedBadge}>
                        <Ionicons name="checkmark-circle" size={16} color={Colors.glowingGreen} />
                        <Text style={styles.unlockedText}>Unlocked!</Text>
                      </View>
                    )}
                  </GlassCard>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Settings</Text>
          <GlassCard>
            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="person-outline" size={24} color={Colors.electricTeal} />
                <Text style={styles.settingText}>Edit Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="notifications-outline" size={24} color={Colors.sunKissedAmber} />
                <Text style={styles.settingText}>Notifications</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

            <TouchableOpacity style={styles.settingItem}>
              <View style={styles.settingLeft}>
                <Ionicons name="help-circle-outline" size={24} color={Colors.vibrantPurple} />
                <Text style={styles.settingText}>Help & Support</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
            </TouchableOpacity>

            <View style={styles.settingDivider} />

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
    color: Colors.primaryText,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.electricTeal,
    marginTop: 4,
    fontWeight: '600',
  },
  settingsButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
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
    color: Colors.white,
  },
  emojiAvatarContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.lightCream,
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
    color: Colors.primaryText,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  stat: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.electricTeal,
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: Colors.tertiaryText,
    fontWeight: '500',
  },
  statDivider: {
    width: 1,
    backgroundColor: Colors.glassBorder,
  },
  streakCard: {
    marginBottom: 30,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 16,
  },
  fireContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  fireEmoji: {
    fontSize: 32,
  },
  streakInfo: {
    flex: 1,
  },
  streakTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 4,
  },
  streakDescription: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  streakProgress: {
    marginTop: 8,
  },
  streakBar: {
    height: 8,
    backgroundColor: Colors.darkGray,
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  streakBarFill: {
    height: '100%',
  },
  streakTarget: {
    fontSize: 12,
    color: Colors.tertiaryText,
    textAlign: 'right',
    fontWeight: '500',
  },
  journeySection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 24,
    fontWeight: '500',
  },
  journeyMap: {
    paddingVertical: 20,
  },
  milestoneContainer: {
    flexDirection: 'row',
    marginBottom: 40,
    gap: 16,
  },
  milestoneLeft: {
    justifyContent: 'flex-start',
  },
  milestoneRight: {
    flexDirection: 'row-reverse',
  },
  milestoneNode: {
    alignItems: 'center',
  },
  milestoneCircle: {
    width: 56,
    height: 56,
    borderRadius: 28,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: Colors.lightGray,
  },
  milestoneUnlocked: {
    borderColor: Colors.electricTeal,
  },
  milestoneGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneLocked: {
    width: '100%',
    height: '100%',
    backgroundColor: Colors.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  milestoneIcon: {
    fontSize: 28,
  },
  milestoneLine: {
    width: 3,
    height: 40,
    backgroundColor: Colors.lightGray,
    marginTop: 8,
  },
  milestoneCard: {
    flex: 1,
  },
  milestoneTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 6,
  },
  milestoneDescription: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
    fontWeight: '500',
  },
  unlockedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  unlockedText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.glowingGreen,
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
    color: Colors.primaryText,
    fontWeight: '500',
  },
  settingDivider: {
    height: 1,
    backgroundColor: Colors.glassBorder,
  },
});
