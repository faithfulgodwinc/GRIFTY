import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { FinancialRing } from '@/components/FinancialRing';
import { storage } from '@/utils/storage';
import { FinancialData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadFinancialData();
  }, []);

  const loadFinancialData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await storage.getFinancialData();

      // If no data exists, initialize with default values
      if (!data) {
        const defaultData: FinancialData = {
          dailySpending: 35,
          dailyBudget: 50,
          monthlySavings: 420,
          savingsGoal: 1000,
          dailyWellnessScore: 92,
          streakDays: 0,
        };
        await storage.setFinancialData(defaultData);
        setFinancialData(defaultData);
      } else {
        setFinancialData(data);
      }
    } catch (error) {
      console.error('Failed to load financial data:', error);
      setError('Unable to load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.electricTeal} />
          <Text style={styles.loadingText}>Loading your dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error || !financialData) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.radiantMagenta} />
          <Text style={styles.errorText}>{error || 'Unable to load data'}</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadFinancialData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const savingsProgress = (financialData.monthlySavings / financialData.savingsGoal) * 100;
  const spendingProgress = (financialData.dailySpending / financialData.dailyBudget) * 100;

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Good Morning! 👋</Text>
            <Text style={styles.subtitle}>Mom-Boss Edition</Text>
          </View>
          <TouchableOpacity
            style={styles.notificationButton}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.primaryText} />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>
        </View>

        {/* Financial Rings */}
        <GlassCard style={styles.ringsCard}>
          <View style={styles.ringsContainer}>
            <View style={styles.ringWrapper}>
              <View style={styles.ring}>
                <FinancialRing
                  value={financialData.dailySpending}
                  maxValue={financialData.dailyBudget}
                  color={Colors.radiantMagenta}
                  size={140}
                  strokeWidth={12}
                />
                <View style={styles.ringCenter}>
                  <FinancialRing
                    value={financialData.monthlySavings}
                    maxValue={financialData.savingsGoal}
                    color={Colors.sunKissedAmber}
                    size={100}
                    strokeWidth={10}
                  />
                  <View style={styles.ringInner}>
                    <FinancialRing
                      value={financialData.dailySpending}
                      maxValue={financialData.dailyBudget}
                      color={Colors.electricTeal}
                      size={60}
                      strokeWidth={8}
                    />
                  </View>
                </View>
              </View>
              <View style={styles.ringLabels}>
                <View style={styles.ringLabel}>
                  <View style={[styles.colorDot, { backgroundColor: Colors.radiantMagenta }]} />
                  <Text style={styles.ringLabelText}>Daily Budget</Text>
                </View>
                <View style={styles.ringLabel}>
                  <View style={[styles.colorDot, { backgroundColor: Colors.sunKissedAmber }]} />
                  <Text style={styles.ringLabelText}>Monthly Goal</Text>
                </View>
                <View style={styles.ringLabel}>
                  <View style={[styles.colorDot, { backgroundColor: Colors.electricTeal }]} />
                  <Text style={styles.ringLabelText}>Grocery Savings</Text>
                </View>
              </View>
            </View>

            {/* Wellness Score */}
            <View style={styles.wellnessScoreContainer}>
              <Text style={styles.wellnessLabel}>Daily Wellness Score:</Text>
              <LinearGradient
                colors={Gradients.wellness}
                style={styles.wellnessScore}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.wellnessValue}>{financialData.dailyWellnessScore}</Text>
                <Text style={styles.wellnessMax}>/100</Text>
              </LinearGradient>
            </View>
          </View>
        </GlassCard>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick-Log</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <LinearGradient
              colors={['#E11D48', '#C4124A']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="cart" size={28} color={Colors.white} />
              <Text style={styles.quickActionText}>Groceries</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <LinearGradient
              colors={['#F59E0B', '#D97706']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="people" size={28} color={Colors.white} />
              <Text style={styles.quickActionText}>Kids</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <LinearGradient
              colors={['#2DD4BF', '#14B8A6']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="home" size={28} color={Colors.white} />
              <Text style={styles.quickActionText}>Home</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
          >
            <LinearGradient
              colors={['#EC4899', '#DB2777']}
              style={styles.quickActionGradient}
            >
              <Ionicons name="sparkles" size={28} color={Colors.white} />
              <Text style={styles.quickActionText}>Self Care</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        {/* Burn Rate & Daily Win */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Burn Rate 🔥</Text>
            </View>
            <View style={styles.burnRateCircle}>
              <Text style={styles.burnRateValue}>£{financialData.dailySpending.toFixed(0)}</Text>
              <Text style={styles.burnRateLabel}>Remaining</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={styles.statTitle}>Daily Win</Text>
            </View>
            <View style={styles.dailyWinContent}>
              <Text style={styles.dailyWinEmoji}>🎉</Text>
              <Text style={styles.dailyWinText}>Stayed under{'\n'}budget!</Text>
            </View>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  loadingText: {
    color: Colors.secondaryText,
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    color: Colors.primaryText,
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    backgroundColor: Colors.electricTeal,
    borderRadius: 12,
  },
  retryButtonText: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 30,
  },
  greeting: {
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
  notificationButton: {
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
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.radiantMagenta,
  },
  ringsCard: {
    marginBottom: 30,
  },
  ringsContainer: {
    alignItems: 'center',
  },
  ringWrapper: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ring: {
    position: 'relative',
    marginBottom: 20,
  },
  ringCenter: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  ringInner: {
    position: 'absolute',
    top: 20,
    left: 20,
  },
  ringLabels: {
    gap: 8,
  },
  ringLabel: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  colorDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 8,
  },
  ringLabelText: {
    fontSize: 14,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  wellnessScoreContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  wellnessLabel: {
    fontSize: 14,
    color: Colors.secondaryText,
    marginBottom: 8,
    fontWeight: '600',
  },
  wellnessScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
  },
  wellnessValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
  },
  wellnessMax: {
    fontSize: 20,
    color: Colors.white,
    opacity: 0.7,
    marginLeft: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
    marginBottom: 16,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  quickAction: {
    width: (width - 60) / 4,
    borderRadius: 16,
    overflow: 'hidden',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  quickActionGradient: {
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  quickActionText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.white,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  statCard: {
    flex: 1,
  },
  statHeader: {
    marginBottom: 16,
  },
  statTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
  },
  burnRateCircle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  burnRateValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.radiantMagenta,
  },
  burnRateLabel: {
    fontSize: 12,
    color: Colors.tertiaryText,
    marginTop: 4,
    fontWeight: '500',
  },
  dailyWinContent: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  dailyWinEmoji: {
    fontSize: 40,
    marginBottom: 8,
  },
  dailyWinText: {
    fontSize: 12,
    color: Colors.tertiaryText,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
});
