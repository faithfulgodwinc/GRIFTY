import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  ActivityIndicator,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { BudgetCategoryRing } from '@/components/BudgetCategoryRing';
import { storage } from '@/utils/storage';
import { BudgetCategory, FinancialData } from '@/types';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { router } from 'expo-router';

const { width } = Dimensions.get('window');

// Available icons for budget categories
const AVAILABLE_ICONS = [
  { icon: 'home', label: 'Home' },
  { icon: 'cart', label: 'Shopping' },
  { icon: 'restaurant', label: 'Food' },
  { icon: 'car', label: 'Transport' },
  { icon: 'medkit', label: 'Health' },
  { icon: 'school', label: 'Education' },
  { icon: 'shirt', label: 'Clothing' },
  { icon: 'gift', label: 'Gifts' },
  { icon: 'football', label: 'Recreation' },
  { icon: 'sparkles', label: 'Self-Care' },
  { icon: 'alert-circle', label: 'Emergency' },
  { icon: 'leaf', label: 'Utilities' },
];

const AVAILABLE_COLORS = [
  '#E11D48', '#EC4899', '#F59E0B', '#14B8A6',
  '#10B981', '#6366F1', '#8B5CF6', '#EF4444',
];

export default function HomeScreen() {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [budgetCategories, setBudgetCategories] = useState<BudgetCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);
  const [showAddItemModal, setShowAddItemModal] = useState(false);
  const [newItemName, setNewItemName] = useState('');
  const [newItemIcon, setNewItemIcon] = useState('home');
  const [newItemColor, setNewItemColor] = useState('#E11D48');
  const [error, setError] = useState<string | null>(null);
  const { theme } = useTheme();

  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const financial = await storage.getFinancialData();
      const user = await storage.getUserData();

      if (!financial || !user) {
        setError('Please complete your financial blueprint setup.');
        return;
      }

      setFinancialData(financial);
      setUserData(user);

      // Load budget categories (user must create manually)
      if (financial.budgetCategories && financial.budgetCategories.length > 0) {
        setBudgetCategories(financial.budgetCategories);
      } else {
        setBudgetCategories([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      setError('Unable to load your data. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const calculateBudgetHealth = () => {
    if (!budgetCategories.length) return 100;

    const totalAllocated = budgetCategories.reduce((sum, cat) => sum + cat.allocated, 0);
    const totalSpent = budgetCategories.reduce((sum, cat) => sum + cat.spent, 0);

    if (totalAllocated === 0) return 100;

    const utilizationRate = (totalSpent / totalAllocated) * 100;

    // Score: 100 for perfect budget adherence, decreasing as overspending occurs
    if (utilizationRate <= 80) return 100;
    if (utilizationRate <= 90) return 90;
    if (utilizationRate <= 100) return 80;
    return Math.max(0, 80 - (utilizationRate - 100));
  };

  const handleOpenBudgetSetup = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setShowBudgetModal(true);
  };

  const handleSaveBudgetAllocations = async () => {
    try {
      const updatedFinancialData: FinancialData = {
        ...(financialData as FinancialData),
        budgetCategories,
        budgetHealthScore: calculateBudgetHealth(),
      };

      await storage.setFinancialData(updatedFinancialData);
      setFinancialData(updatedFinancialData);
      setShowBudgetModal(false);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('Failed to save budget:', error);
      Alert.alert('Save Failed', 'Unable to save budget allocations.');
    }
  };

  const handleSmartShopperPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    router.push('/smart-shopper');
  };

  const handleAddBudgetItem = () => {
    if (!newItemName.trim()) {
      Alert.alert('Required', 'Please enter a budget item name');
      return;
    }

    const newItem: BudgetCategory = {
      id: Date.now().toString(),
      name: newItemName.trim(),
      allocated: 0,
      spent: 0,
      icon: newItemIcon,
      color: newItemColor,
    };

    setBudgetCategories((prev) => [...prev, newItem]);
    setNewItemName('');
    setNewItemIcon('home');
    setNewItemColor('#E11D48');
    setShowAddItemModal(false);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteBudgetItem = (id: string) => {
    Alert.alert(
      'Delete Budget Item',
      'Are you sure you want to delete this budget item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            setBudgetCategories((prev) => prev.filter((item) => item.id !== id));
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  if (isLoading) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.electricTeal} />
          <Text style={[styles.loadingText, { color: Colors.secondaryText }]}>Loading your dashboard...</Text>
        </View>
      </LinearGradient>
    );
  }

  if (error || !financialData) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.centerContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.radiantMagenta} />
          <Text style={[styles.errorText, { color: Colors.primaryText }]}>{error || 'Unable to load data'}</Text>
          <TouchableOpacity
            style={[styles.retryButton, { backgroundColor: Colors.electricTeal }]}
            onPress={loadData}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    );
  }

  const budgetHealthScore = financialData.budgetHealthScore || calculateBudgetHealth();
  const currency = financialData?.currency || '£';

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: Colors.primaryText }]}>{getGreeting()}! 👋</Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>
              {userData?.name || 'Mom Boss'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.notificationButton, { backgroundColor: Colors.white, borderColor: Colors.glassBorder }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="notifications-outline" size={24} color={Colors.primaryText} />
            <View style={[styles.notificationBadge, { backgroundColor: Colors.radiantMagenta }]} />
          </TouchableOpacity>
        </View>

        {/* Budget Health Score */}
        <GlassCard style={styles.healthCard}>
          <View style={styles.healthHeader}>
            <Text style={[styles.healthLabel, { color: Colors.primaryText }]}>Budget Health:</Text>
            <LinearGradient
              colors={[Colors.electricTeal, Colors.amethyst]}
              style={styles.healthScore}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.healthValue}>{budgetHealthScore}</Text>
              <Text style={styles.healthMax}>/100</Text>
            </LinearGradient>
          </View>
        </GlassCard>

        {/* Monthly Budget Categories */}
        <View style={styles.budgetSection}>
          <View style={styles.budgetSectionHeader}>
            <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Monthly Budget</Text>
            <View style={styles.budgetHeaderActions}>
              <TouchableOpacity
                onPress={() => setShowAddItemModal(true)}
                style={[styles.addButton, { backgroundColor: Colors.electricTeal }]}
              >
                <Ionicons name="add" size={20} color={Colors.white} />
              </TouchableOpacity>
              {budgetCategories.length > 0 && (
                <TouchableOpacity onPress={handleOpenBudgetSetup}>
                  <Ionicons name="settings-outline" size={20} color={Colors.electricTeal} />
                </TouchableOpacity>
              )}
            </View>
          </View>

          {budgetCategories.length === 0 ? (
            <GlassCard style={styles.emptyStateCard}>
              <Text style={styles.emptyStateEmoji}>💰</Text>
              <Text style={[styles.emptyStateTitle, { color: Colors.primaryText }]}>
                Create Your Budget
              </Text>
              <Text style={[styles.emptyStateText, { color: Colors.secondaryText }]}>
                Start by adding custom budget items that match your spending needs.
              </Text>
              <TouchableOpacity
                style={styles.createFirstItemButton}
                onPress={() => setShowAddItemModal(true)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.createFirstItemGradient}
                >
                  <Ionicons name="add-circle-outline" size={24} color={Colors.white} />
                  <Text style={styles.createFirstItemText}>Create First Budget Item</Text>
                </LinearGradient>
              </TouchableOpacity>
            </GlassCard>
          ) : (
            <View style={styles.budgetGrid}>
              {budgetCategories.map((category) => (
                <View key={category.id} style={styles.budgetCategoryCard}>
                  <BudgetCategoryRing
                    label={category.name}
                    allocated={category.allocated}
                    spent={category.spent}
                    currency={currency}
                    size={100}
                    tealColor={Colors.electricTeal}
                    amberColor={Colors.sunKissedAmber}
                  />
                </View>
              ))}
            </View>
          )}
        </View>

        {/* Smart Shopper Tool */}
        <TouchableOpacity
          style={styles.smartShopperCard}
          onPress={handleSmartShopperPress}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={[Colors.amethyst, Colors.electricTeal]}
            style={styles.smartShopperGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.smartShopperContent}>
              <View style={styles.smartShopperIcon}>
                <Ionicons name="camera" size={40} color={Colors.white} />
              </View>
              <View style={styles.smartShopperText}>
                <Text style={styles.smartShopperTitle}>Smart Shopper 🛍️</Text>
                <Text style={styles.smartShopperSubtitle}>
                  Scan products, find cheaper alternatives
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={28} color={Colors.white} />
            </View>
          </LinearGradient>
        </TouchableOpacity>

        {/* Quick-Log */}
        <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Quick-Log</Text>
        <View style={styles.quickActions}>
          {budgetCategories.slice(0, 4).map((cat, index) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.quickAction}
              onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)}
            >
              <LinearGradient
                colors={[cat.color, cat.color + 'DD']}
                style={styles.quickActionGradient}
              >
                <Ionicons name={cat.icon as any} size={28} color={Colors.white} />
                <Text style={styles.quickActionText}>{cat.name}</Text>
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Burn Rate & Streak */}
        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={[styles.statTitle, { color: Colors.primaryText }]}>Burn Rate 🔥</Text>
            </View>
            <View style={styles.burnRateCircle}>
              <Text style={[styles.burnRateValue, { color: Colors.radiantMagenta }]}>
                {currency}{(financialData.dailyBudget - financialData.dailySpending).toFixed(0)}
              </Text>
              <Text style={[styles.burnRateLabel, { color: Colors.tertiaryText }]}>Remaining</Text>
            </View>
          </GlassCard>

          <GlassCard style={styles.statCard}>
            <View style={styles.statHeader}>
              <Text style={[styles.statTitle, { color: Colors.primaryText }]}>Streak</Text>
            </View>
            <View style={styles.streakContent}>
              <LinearGradient
                colors={['#F59E0B', '#EF4444']}
                style={styles.streakIcon}
              >
                <Text style={styles.streakEmoji}>🔥</Text>
              </LinearGradient>
              <Text style={[styles.streakValue, { color: Colors.primaryText }]}>
                {financialData.streakDays}
              </Text>
              <Text style={[styles.streakLabel, { color: Colors.tertiaryText }]}>Days</Text>
            </View>
          </GlassCard>
        </View>
      </ScrollView>

      {/* Budget Allocation Modal */}
      <Modal
        visible={showBudgetModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowBudgetModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>Set Budget</Text>
              <TouchableOpacity onPress={() => setShowBudgetModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView>
              {budgetCategories.map((category, index) => (
                <View key={category.id} style={styles.budgetInputRow}>
                  <View style={styles.budgetInputHeader}>
                    <View style={styles.budgetInputLabel}>
                      <Ionicons name={category.icon as any} size={20} color={category.color} />
                      <Text style={[styles.budgetInputName, { color: Colors.primaryText }]}>
                        {category.name}
                      </Text>
                    </View>
                    <TouchableOpacity
                      onPress={() => handleDeleteBudgetItem(category.id)}
                      style={styles.deleteItemButton}
                    >
                      <Ionicons name="trash-outline" size={18} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={[styles.budgetInputField, { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder }]}>
                    <Text style={[styles.currencySymbol, { color: Colors.electricTeal }]}>{currency}</Text>
                    <TextInput
                      style={[styles.budgetInput, { color: Colors.primaryText }]}
                      placeholder="0"
                      placeholderTextColor={Colors.mediumGray}
                      keyboardType="numeric"
                      value={category.allocated.toString()}
                      onChangeText={(value) => {
                        const newCategories = [...budgetCategories];
                        newCategories[index].allocated = parseFloat(value) || 0;
                        setBudgetCategories(newCategories);
                      }}
                    />
                  </View>
                </View>
              ))}
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleSaveBudgetAllocations}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Save Budget</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Add Budget Item Modal */}
      <Modal
        visible={showAddItemModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAddItemModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: Colors.white }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: Colors.primaryText }]}>New Budget Item</Text>
              <TouchableOpacity onPress={() => setShowAddItemModal(false)}>
                <Ionicons name="close" size={28} color={Colors.primaryText} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* Item Name */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Item Name</Text>
                <TextInput
                  style={[styles.textInput, { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder, color: Colors.primaryText }]}
                  placeholder="e.g., Groceries, Rent, Transportation"
                  placeholderTextColor={Colors.mediumGray}
                  value={newItemName}
                  onChangeText={setNewItemName}
                  maxLength={30}
                />
              </View>

              {/* Icon Selection */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Choose Icon</Text>
                <View style={styles.iconGrid}>
                  {AVAILABLE_ICONS.map((item) => (
                    <TouchableOpacity
                      key={item.icon}
                      style={[
                        styles.iconOption,
                        { backgroundColor: Colors.lightCream, borderColor: Colors.glassBorder },
                        newItemIcon === item.icon && {
                          borderColor: Colors.electricTeal,
                          borderWidth: 2,
                          backgroundColor: Colors.electricTeal + '15',
                        },
                      ]}
                      onPress={() => {
                        setNewItemIcon(item.icon);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      <Ionicons
                        name={item.icon as any}
                        size={24}
                        color={newItemIcon === item.icon ? Colors.electricTeal : Colors.secondaryText}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Color Selection */}
              <View style={styles.inputSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Choose Color</Text>
                <View style={styles.colorGrid}>
                  {AVAILABLE_COLORS.map((color) => (
                    <TouchableOpacity
                      key={color}
                      style={[
                        styles.colorOption,
                        { backgroundColor: color },
                        newItemColor === color && styles.colorOptionSelected,
                      ]}
                      onPress={() => {
                        setNewItemColor(color);
                        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                      }}
                    >
                      {newItemColor === color && (
                        <Ionicons name="checkmark" size={20} color={Colors.white} />
                      )}
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Preview */}
              <View style={styles.previewSection}>
                <Text style={[styles.inputLabel, { color: Colors.primaryText }]}>Preview</Text>
                <View style={[styles.previewCard, { backgroundColor: Colors.lightCream }]}>
                  <View style={[styles.previewIcon, { backgroundColor: newItemColor + '20' }]}>
                    <Ionicons name={newItemIcon as any} size={32} color={newItemColor} />
                  </View>
                  <Text style={[styles.previewText, { color: Colors.primaryText }]}>
                    {newItemName || 'Budget Item Name'}
                  </Text>
                </View>
              </View>
            </ScrollView>

            <TouchableOpacity
              style={styles.saveButton}
              onPress={handleAddBudgetItem}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen]}
                style={styles.saveButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.saveButtonText}>Create Budget Item</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    textAlign: 'center',
    fontWeight: '500',
  },
  errorText: {
    fontSize: 16,
    textAlign: 'center',
    marginTop: 16,
    fontWeight: '500',
  },
  retryButton: {
    marginTop: 16,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
    fontWeight: '600',
  },
  notificationButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
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
  },
  healthCard: {
    marginBottom: 24,
  },
  healthHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  healthLabel: {
    fontSize: 18,
    fontWeight: '600',
  },
  healthScore: {
    flexDirection: 'row',
    alignItems: 'baseline',
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 16,
  },
  healthValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  healthMax: {
    fontSize: 18,
    color: '#FFFFFF',
    opacity: 0.7,
    marginLeft: 4,
  },
  budgetSection: {
    marginBottom: 24,
  },
  budgetSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  budgetHeaderActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  budgetGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  budgetCategoryCard: {
    width: (width - 56) / 2,
    backgroundColor: 'rgba(255, 255, 255, 0.5)',
    borderRadius: 20,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0, 0, 0, 0.05)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  smartShopperCard: {
    marginBottom: 24,
    borderRadius: 24,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
  },
  smartShopperGradient: {
    padding: 20,
  },
  smartShopperContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  smartShopperIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  smartShopperText: {
    flex: 1,
  },
  smartShopperTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  smartShopperSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
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
    fontSize: 11,
    fontWeight: '600',
    color: '#FFFFFF',
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
  },
  burnRateCircle: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  burnRateValue: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  burnRateLabel: {
    fontSize: 12,
    marginTop: 4,
    fontWeight: '500',
  },
  streakContent: {
    alignItems: 'center',
  },
  streakIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  streakEmoji: {
    fontSize: 24,
  },
  streakValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  streakLabel: {
    fontSize: 12,
    marginTop: 2,
    fontWeight: '500',
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
    maxHeight: '80%',
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
  emptyStateCard: {
    padding: 32,
    alignItems: 'center',
  },
  emptyStateEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  createFirstItemButton: {
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  createFirstItemGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 24,
  },
  createFirstItemText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  budgetInputRow: {
    marginBottom: 20,
  },
  budgetInputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  budgetInputLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  deleteItemButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  budgetInputName: {
    fontSize: 16,
    fontWeight: '600',
  },
  budgetInputField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
  },
  currencySymbol: {
    fontSize: 20,
    fontWeight: 'bold',
    marginRight: 8,
  },
  budgetInput: {
    flex: 1,
    fontSize: 20,
    fontWeight: 'bold',
    paddingVertical: 12,
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
  inputSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 12,
  },
  textInput: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  iconOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  colorOption: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  previewSection: {
    marginBottom: 16,
  },
  previewCard: {
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    gap: 12,
  },
  previewIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  previewText: {
    fontSize: 18,
    fontWeight: 'bold',
  },
});
