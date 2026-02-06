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
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { storage } from '@/utils/storage';
import { supabaseSync } from '@/utils/supabase-sync';

const { width } = Dimensions.get('window');

const FINANCIAL_HACKS = [
  { id: '1', title: 'Meal Prep Hacks', emoji: '🥗', category: 'Groceries' },
  { id: '2', title: 'Bulk-Buying Tips', emoji: '🛒', category: 'Savings' },
  { id: '3', title: 'Coupon Codes', emoji: '💰', category: 'Deals' },
  { id: '4', title: 'Kids Activities', emoji: '🎨', category: 'Free Fun' },
];

export default function SavingsScreen() {
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [amount, setAmount] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('groceries');
  const [streakDays, setStreakDays] = useState(0);
  const [currency, setCurrency] = useState('£');

  useEffect(() => {
    loadUserData();
  }, []);

  const loadUserData = async () => {
    try {
      const [financialData, userData] = await Promise.all([
        storage.getFinancialData(),
        storage.getUserData()
      ]);

      if (financialData && financialData.streakDays !== undefined) {
        setStreakDays(financialData.streakDays);
      }

      if (userData && userData.currency) {
        setCurrency(userData.currency);
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
    }
  };

  const categories = [
    { id: 'groceries', label: 'Groceries', color: Colors.radiantMagenta, icon: 'cart' },
    { id: 'kids', label: 'Kids', color: Colors.sunKissedAmber, icon: 'people' },
    { id: 'self-care', label: 'Self-Care', color: Colors.electricTeal, icon: 'sparkles' },
    { id: 'home', label: 'Home', color: Colors.vibrantPurple, icon: 'home' },
  ];

  const handleAddExpense = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Invalid Amount', 'Please enter a valid amount.');
      return;
    }

    try {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      const expenses = await storage.getExpenses();
      const newExpense = {
        id: Date.now().toString(),
        amount: parseFloat(amount),
        category: selectedCategory,
        description,
        date: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Save locally
      await storage.setExpenses([...expenses, newExpense]);

      // Update financial data locally
      const financialData = await storage.getFinancialData();
      if (financialData) {
        financialData.dailySpending += parseFloat(amount);
        await storage.setFinancialData(financialData);

        // Sync to Supabase (non-blocking)
        supabaseSync.syncFinancialData(financialData).catch(err =>
          console.error('Failed to sync financial data:', err)
        );
      }

      // Sync expense to Supabase (non-blocking)
      supabaseSync.addExpense({
        amount: parseFloat(amount),
        category: selectedCategory,
        description,
        date: new Date().toISOString().split('T')[0],
      }).catch(err => console.error('Failed to sync expense:', err));

      setShowExpenseModal(false);
      setAmount('');
      setDescription('');
    } catch (error) {
      console.error('Failed to add expense:', error);
      Alert.alert('Error', 'Failed to add expense. Please try again.');
    }
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => {}}>
            <Ionicons name="arrow-back" size={24} color={Colors.primaryText} />
          </TouchableOpacity>
          <Text style={styles.title}>Savings Hub</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* Receipt Scanner */}
        <TouchableOpacity
          style={styles.scannerCard}
          onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={['#E11D48', '#F59E0B']}
            style={styles.scannerGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.cameraIcon}>
              <Ionicons name="camera" size={48} color={Colors.white} />
            </View>
            <Text style={styles.scannerTitle}>Scan Receipt for Savings</Text>
            <Text style={styles.scannerSubtitle}>AI-powered expense tracking</Text>
          </LinearGradient>
        </TouchableOpacity>

        {/* Mom-Tip Carousel */}
        <View style={styles.carouselSection}>
          <View style={styles.carouselHeader}>
            <Text style={styles.sectionTitle}>Mom-Tip Carousel</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Story &gt;</Text>
            </TouchableOpacity>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.carousel}
          >
            {FINANCIAL_HACKS.map((hack) => (
              <TouchableOpacity
                key={hack.id}
                style={styles.hackCard}
                onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
              >
                <GlassCard style={styles.hackCardInner}>
                  <Text style={styles.hackEmoji}>{hack.emoji}</Text>
                  <Text style={styles.hackTitle}>{hack.title}</Text>
                  <Text style={styles.hackCategory}>{hack.category}</Text>
                </GlassCard>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Savings Streaks */}
        <GlassCard style={styles.streakCard}>
          <View style={styles.streakHeader}>
            <Text style={styles.sectionTitle}>Savings Streaks</Text>
          </View>
          <View style={styles.streakContent}>
            <LinearGradient
              colors={['#F59E0B', '#EF4444']}
              style={styles.fireIcon}
            >
              <Text style={styles.fireEmoji}>🔥</Text>
            </LinearGradient>
            <Text style={styles.streakValue}>{streakDays}-Day Streak!</Text>
          </View>
          <Text style={styles.streakDescription}>
            Keep it up! You&apos;re building amazing financial habits.
          </Text>
        </GlassCard>

        {/* Quick Log Expenses */}
        <TouchableOpacity
          style={styles.addButton}
          onPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
            setShowExpenseModal(true);
          }}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={[Colors.electricTeal, Colors.glowingGreen]}
            style={styles.addButtonGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add" size={28} color={Colors.white} />
            <Text style={styles.addButtonText}>Log Expense</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>

      {/* Expense Modal */}
      <Modal
        visible={showExpenseModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowExpenseModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Log Expense</Text>
              <TouchableOpacity onPress={() => setShowExpenseModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Amount</Text>
            <View style={styles.amountInput}>
              <Text style={styles.currencySymbol}>{currency}</Text>
              <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={Colors.mediumGray}
                keyboardType="decimal-pad"
                value={amount}
                onChangeText={setAmount}
              />
            </View>

            <Text style={styles.inputLabel}>Category</Text>
            <View style={styles.categoriesGrid}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.categoryButton,
                    selectedCategory === cat.id && styles.categoryButtonActive,
                  ]}
                  onPress={() => {
                    setSelectedCategory(cat.id);
                    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  }}
                >
                  <Ionicons
                    name={cat.icon as any}
                    size={24}
                    color={selectedCategory === cat.id ? cat.color : Colors.mediumGray}
                  />
                  <Text
                    style={[
                      styles.categoryLabel,
                      selectedCategory === cat.id && { color: cat.color },
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.inputLabel}>Description (Optional)</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g., Weekly grocery shopping"
              placeholderTextColor={Colors.mediumGray}
              value={description}
              onChangeText={setDescription}
              multiline
            />

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleAddExpense}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.submitButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.submitButtonText}>Add Expense</Text>
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
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  scannerCard: {
    marginBottom: 30,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: Colors.radiantMagenta,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  scannerGradient: {
    padding: 32,
    alignItems: 'center',
  },
  cameraIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  scannerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  scannerSubtitle: {
    fontSize: 14,
    color: Colors.white,
    opacity: 0.9,
  },
  carouselSection: {
    marginBottom: 30,
  },
  carouselHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  seeAllText: {
    fontSize: 14,
    color: Colors.electricTeal,
    fontWeight: '600',
  },
  carousel: {
    paddingRight: 20,
    gap: 12,
  },
  hackCard: {
    width: 150,
  },
  hackCardInner: {
    alignItems: 'center',
  },
  hackEmoji: {
    fontSize: 48,
    marginBottom: 12,
  },
  hackTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 4,
  },
  hackCategory: {
    fontSize: 12,
    color: Colors.electricTeal,
    fontWeight: '600',
  },
  streakCard: {
    marginBottom: 30,
  },
  streakHeader: {
    marginBottom: 16,
  },
  streakContent: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fireIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  fireEmoji: {
    fontSize: 32,
  },
  streakValue: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  streakDescription: {
    fontSize: 14,
    color: Colors.secondaryText,
    lineHeight: 20,
    fontWeight: '500',
  },
  addButton: {
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: Colors.electricTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  addButtonGradient: {
    flexDirection: 'row',
    paddingVertical: 18,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  addButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.white,
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
    color: Colors.primaryText,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 12,
    marginTop: 16,
  },
  amountInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightCream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 20,
  },
  currencySymbol: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.electricTeal,
    marginRight: 8,
  },
  input: {
    flex: 1,
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.primaryText,
    paddingVertical: 16,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  categoryButton: {
    width: (width - 84) / 2,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.lightCream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingVertical: 16,
    paddingHorizontal: 16,
    gap: 12,
  },
  categoryButtonActive: {
    borderColor: Colors.electricTeal,
    borderWidth: 2,
    backgroundColor: Colors.white,
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.mediumGray,
  },
  textInput: {
    backgroundColor: Colors.lightCream,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 20,
    paddingVertical: 16,
    fontSize: 16,
    color: Colors.primaryText,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitButton: {
    marginTop: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 6,
    shadowColor: Colors.electricTeal,
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
  },
  submitButtonGradient: {
    paddingVertical: 18,
    alignItems: 'center',
  },
  submitButtonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
