import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabaseSync } from '@/utils/supabase-sync';
import { initializeDailyRollover, updateDailySpending, logSpending, calculateBaseAllowance } from '@/utils/dailyRollover';
import { storage } from '@/utils/storage';
import { Expense, ExpenseCategory, FinancialData, Milestone, SavingsWin, DailyRolloverState, User } from '@/types';

// Helper to get days remaining in current month
const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1;
};

// Calculate wellness score (0-100)
const calculateWellnessScore = (
  todaySpent: number,
  dailyAllowance: number,
  streakDays: number,
  totalSavings: number,
  savingsGoal: number
): number => {
  if (dailyAllowance <= 0) return 50;

  // Budget adherence (0-50 points)
  const spendRatio = todaySpent / dailyAllowance;
  let budgetScore = 0;
  if (spendRatio <= 0.5) budgetScore = 50;
  else if (spendRatio <= 0.75) budgetScore = 45;
  else if (spendRatio <= 1.0) budgetScore = 35;
  else if (spendRatio <= 1.25) budgetScore = 20;
  else budgetScore = 5;

  // Streak bonus (0-30 points)
  const streakScore = Math.min(streakDays * 3, 30);

  // Savings progress (0-20 points)
  const savingsProgress = savingsGoal > 0 ? Math.min((totalSavings / savingsGoal) * 20, 20) : 10;

  return Math.round(Math.min(budgetScore + streakScore + savingsProgress, 100));
};

interface FinancialContextActions {
  // Data fetching
  refreshAll: () => Promise<void>;
  refreshExpenses: () => Promise<void>;

  // Expense actions
  addExpense: (expense: { amount: number; category: string; description?: string }) => Promise<boolean>;
  deleteExpense: (expenseId: string) => Promise<boolean>;

  // Savings actions
  addSavingsWin: (win: { title: string; amount: number; description?: string }) => Promise<boolean>;

  // Blueprint actions
  updateBlueprint: (income: number, savingsGoal: number, currency: string) => Promise<boolean>;

  // Profile
  updateProfile: (data: { name?: string; avatarUrl?: string }) => Promise<boolean>;
}

interface FinancialContextValue {
  // User profile
  profile: User | null;
  // Financial data
  financialData: FinancialData | null;
  // Daily rollover engine
  rolloverState: DailyRolloverState | null;
  // Expenses
  todayExpenses: Expense[];
  monthExpenses: Expense[];
  // Savings
  savingsWins: SavingsWin[];
  totalSavings: number;
  // Milestones
  milestones: Milestone[];
  // Loading states
  isLoading: boolean;
  isRefreshing: boolean;
  // Computed values
  spendableToday: number;
  dailyAllowance: number;
  momentumStreak: number;
  daysRemainingInMonth: number;
  monthlySpentSoFar: number;
  wellnessScore: number;
  // Actions
  actions: FinancialContextActions;
}

const FinancialDataContext = createContext<FinancialContextValue | null>(null);

export function FinancialDataProvider({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, user } = useAuth();

  // State
  const [profile, setProfile] = useState<User | null>(null);
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [rolloverState, setRolloverState] = useState<DailyRolloverState | null>(null);
  const [todayExpenses, setTodayExpenses] = useState<Expense[]>([]);
  const [monthExpenses, setMonthExpenses] = useState<Expense[]>([]);
  const [savingsWins, setSavingsWins] = useState<SavingsWin[]>([]);
  const [milestones, setMilestones] = useState<Milestone[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const initialLoadDone = useRef(false);

  // Computed values
  const totalSavings = financialData?.totalSavings || financialData?.monthlySavings || 0;
  const daysRemainingInMonth = getDaysRemainingInMonth();
  const monthlyIncome = financialData?.monthlyIncome || profile?.monthlyIncome || 0;
  const savingsGoal = financialData?.savingsGoal || profile?.savingsGoal || 0;
  const dailyAllowance = calculateBaseAllowance(monthlyIncome, savingsGoal, daysRemainingInMonth);
  const spendableToday = rolloverState?.todayEntry?.effectiveLimit
    ? Math.max(rolloverState.todayEntry.effectiveLimit - rolloverState.todayEntry.totalSpent, 0)
    : Math.max(dailyAllowance - (financialData?.dailySpending || 0), 0);
  const momentumStreak = rolloverState?.momentumStreak || financialData?.streakDays || 0;
  const monthlySpentSoFar = monthExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const todaySpent = rolloverState?.todayEntry?.totalSpent || todayExpenses.reduce((sum, exp) => sum + (Number(exp.amount) || 0), 0);
  const wellnessScore = calculateWellnessScore(todaySpent, dailyAllowance, momentumStreak, totalSavings, savingsGoal);

  // Map DB row to Expense type
  const mapDbExpense = (row: Record<string, unknown>): Expense => ({
    id: row.id as string,
    userId: row.user_id as string,
    amount: Number(row.amount) || 0,
    category: ((row.category as string) || 'other') as ExpenseCategory,
    description: (row.description as string) || '',
    date: (row.expense_date as string) || '',
    createdAt: (row.created_at as string) || '',
  });

  // Map DB row to SavingsWin type
  const mapDbSavingsWin = (row: Record<string, unknown>): SavingsWin => ({
    id: row.id as string,
    userId: row.user_id as string,
    title: (row.title as string) || '',
    amount: Number(row.amount) || 0,
    description: (row.description as string) || '',
    winDate: (row.win_date as string) || '',
    createdAt: (row.created_at as string) || '',
  });

  // Map DB row to Milestone type
  const mapDbMilestone = (row: Record<string, unknown>): Milestone => ({
    id: row.id as string,
    title: (row.title as string) || '',
    description: (row.description as string) || '',
    icon: (row.icon as string) || '',
    unlocked: (row.unlocked as boolean) || false,
    unlockedAt: row.unlocked_at as string | undefined,
    amount: Number(row.amount) || 0,
  });

  // Load all data
  const loadAllData = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // Fetch all data in parallel
      const [profileResult, financialResult, todayExpResult, monthExpResult, winsResult, milestonesResult] = await Promise.allSettled([
        supabaseSync.getUserProfile(),
        supabaseSync.getFinancialData(),
        supabaseSync.getTodayExpenses(),
        supabaseSync.getMonthExpenses(),
        supabaseSync.getSavingsWins(20),
        supabaseSync.getMilestones(),
      ]);

      // Process profile
      if (profileResult.status === 'fulfilled' && profileResult.value.success && profileResult.value.data) {
        const p = profileResult.value.data;
        const mappedProfile: User = {
          id: p.id,
          email: p.email || user?.email || '',
          name: p.name,
          avatarUrl: p.avatar_url,
          currency: p.currency || '£',
          monthlyIncome: Number(p.monthly_income) || 0,
          savingsGoal: Number(p.savings_goal) || 0,
          dailyBudget: Number(p.daily_budget) || 0,
          onboardingComplete: true,
          blueprintComplete: p.blueprint_complete || false,
          totalSavings: Number(p.total_savings) || 0,
        };
        setProfile(mappedProfile);
        await storage.setUserData(mappedProfile);
      } else {
        // Fallback to local
        const localUser = await storage.getUserData();
        if (localUser) setProfile(localUser);
      }

      // Process financial data
      if (financialResult.status === 'fulfilled' && financialResult.value.success && financialResult.value.data) {
        const fd = financialResult.value.data;
        const mappedFinancial: FinancialData = {
          dailyWellnessScore: Number(fd.daily_wellness_score) || 0,
          monthlySavings: Number(fd.monthly_savings) || 0,
          dailySpending: Number(fd.daily_spending) || 0,
          savingsGoal: Number(fd.savings_goal) || 0,
          dailyBudget: Number(fd.daily_budget) || 0,
          streakDays: Number(fd.streak_days) || 0,
          monthlyIncome: Number(fd.monthly_income) || 0,
          currency: fd.currency || '£',
          totalSavings: Number(fd.total_savings) || 0,
        };
        setFinancialData(mappedFinancial);
        await storage.setFinancialData(mappedFinancial);

        // Initialize daily rollover
        try {
          const rollover = await initializeDailyRollover(mappedFinancial);
          setRolloverState(rollover);
        } catch (e) {
          console.warn('Rollover init error:', e);
        }
      } else {
        const localFD = await storage.getFinancialData();
        if (localFD) setFinancialData(localFD);
      }

      // Process expenses
      if (todayExpResult.status === 'fulfilled' && todayExpResult.value.success) {
        setTodayExpenses((todayExpResult.value.data || []).map(mapDbExpense));
      }
      if (monthExpResult.status === 'fulfilled' && monthExpResult.value.success) {
        setMonthExpenses((monthExpResult.value.data || []).map(mapDbExpense));
      }

      // Process savings wins
      if (winsResult.status === 'fulfilled' && winsResult.value.success) {
        setSavingsWins((winsResult.value.data || []).map(mapDbSavingsWin));
      }

      // Process milestones
      if (milestonesResult.status === 'fulfilled' && milestonesResult.value.success) {
        setMilestones((milestonesResult.value.data || []).map(mapDbMilestone));
      }
    } catch (error) {
      console.error('Error loading financial data:', error);
      // Fallback to local storage
      const localUser = await storage.getUserData();
      const localFD = await storage.getFinancialData();
      if (localUser) setProfile(localUser);
      if (localFD) setFinancialData(localFD);
    }
  }, [isAuthenticated, user?.email]);

  // Initial load
  useEffect(() => {
    if (isAuthenticated && !initialLoadDone.current) {
      initialLoadDone.current = true;
      setIsLoading(true);
      loadAllData().finally(() => setIsLoading(false));
    }
    if (!isAuthenticated) {
      initialLoadDone.current = false;
      setProfile(null);
      setFinancialData(null);
      setRolloverState(null);
      setTodayExpenses([]);
      setMonthExpenses([]);
      setSavingsWins([]);
      setMilestones([]);
      setIsLoading(false);
    }
  }, [isAuthenticated, loadAllData]);

  // Actions
  const refreshAll = useCallback(async () => {
    setIsRefreshing(true);
    await loadAllData();
    setIsRefreshing(false);
  }, [loadAllData]);

  const refreshExpenses = useCallback(async () => {
    const [todayResult, monthResult] = await Promise.allSettled([
      supabaseSync.getTodayExpenses(),
      supabaseSync.getMonthExpenses(),
    ]);
    if (todayResult.status === 'fulfilled' && todayResult.value.success) {
      setTodayExpenses((todayResult.value.data || []).map(mapDbExpense));
    }
    if (monthResult.status === 'fulfilled' && monthResult.value.success) {
      setMonthExpenses((monthResult.value.data || []).map(mapDbExpense));
    }
  }, []);

  const addExpenseAction = useCallback(async (expense: { amount: number; category: string; description?: string }): Promise<boolean> => {
    try {
      const result = await supabaseSync.addExpense(expense);
      if (!result.success) return false;

      // Refresh expenses
      await refreshExpenses();

      // Update rollover state
      if (financialData) {
        const newTodaySpent = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0) + expense.amount;
        const newRollover = await updateDailySpending(newTodaySpent, financialData);
        setRolloverState(newRollover);

        // Update daily spending in financial data
        const updatedFD = { ...financialData, dailySpending: newTodaySpent };
        setFinancialData(updatedFD);

        // Sync to Supabase
        supabaseSync.syncFinancialData({ dailySpending: newTodaySpent, streakDays: newRollover.momentumStreak });
        supabaseSync.updateStreak(newRollover.momentumStreak, newTodaySpent, newRollover.todayEntry.effectiveLimit);
      }

      // Check milestones
      supabaseSync.checkAndUnlockMilestones(totalSavings, momentumStreak).then(async (result) => {
        if (result.success && result.unlocked && result.unlocked.length > 0) {
          const milestonesResult = await supabaseSync.getMilestones();
          if (milestonesResult.success) {
            setMilestones((milestonesResult.data || []).map(mapDbMilestone));
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add expense:', error);
      return false;
    }
  }, [financialData, todayExpenses, refreshExpenses, totalSavings, momentumStreak]);

  const deleteExpenseAction = useCallback(async (expenseId: string): Promise<boolean> => {
    try {
      const result = await supabaseSync.deleteExpense(expenseId);
      if (!result.success) return false;

      await refreshExpenses();

      // Recalculate rollover
      if (financialData) {
        const remaining = todayExpenses.filter(e => e.id !== expenseId);
        const newTodaySpent = remaining.reduce((sum, e) => sum + Number(e.amount), 0);
        const newRollover = await updateDailySpending(newTodaySpent, financialData);
        setRolloverState(newRollover);
        setFinancialData({ ...financialData, dailySpending: newTodaySpent });
        supabaseSync.syncFinancialData({ dailySpending: newTodaySpent });
      }

      return true;
    } catch (error) {
      console.error('Failed to delete expense:', error);
      return false;
    }
  }, [financialData, todayExpenses, refreshExpenses]);

  const addSavingsWinAction = useCallback(async (win: { title: string; amount: number; description?: string }): Promise<boolean> => {
    try {
      const result = await supabaseSync.addSavingsWin(win);
      if (!result.success) return false;

      // Update total savings locally
      const newTotal = totalSavings + win.amount;
      if (financialData) {
        const updatedFD = {
          ...financialData,
          totalSavings: newTotal,
          monthlySavings: (financialData.monthlySavings || 0) + win.amount,
        };
        setFinancialData(updatedFD);
      }

      // Refresh wins
      const winsResult = await supabaseSync.getSavingsWins(20);
      if (winsResult.success) {
        setSavingsWins((winsResult.data || []).map(mapDbSavingsWin));
      }

      // Check milestones
      supabaseSync.checkAndUnlockMilestones(newTotal, momentumStreak).then(async (result) => {
        if (result.success && result.unlocked && result.unlocked.length > 0) {
          const milestonesResult = await supabaseSync.getMilestones();
          if (milestonesResult.success) {
            setMilestones((milestonesResult.data || []).map(mapDbMilestone));
          }
        }
      });

      return true;
    } catch (error) {
      console.error('Failed to add savings win:', error);
      return false;
    }
  }, [totalSavings, financialData, momentumStreak]);

  const updateBlueprintAction = useCallback(async (income: number, newSavingsGoal: number, currency: string): Promise<boolean> => {
    try {
      const newDailyBudget = (income - newSavingsGoal) / getDaysRemainingInMonth();

      // Update profile
      await supabaseSync.syncUserProfile({
        monthlyIncome: income,
        savingsGoal: newSavingsGoal,
        dailyBudget: newDailyBudget,
        currency,
      });

      // Update financial data
      await supabaseSync.syncFinancialData({
        monthlyIncome: income,
        savingsGoal: newSavingsGoal,
        dailyBudget: newDailyBudget,
        currency,
      });

      // Refresh all data
      await refreshAll();

      return true;
    } catch (error) {
      console.error('Failed to update blueprint:', error);
      return false;
    }
  }, [refreshAll]);

  const updateProfileAction = useCallback(async (data: { name?: string; avatarUrl?: string }): Promise<boolean> => {
    try {
      await supabaseSync.syncUserProfile(data);
      if (profile) {
        setProfile({ ...profile, ...data });
      }
      return true;
    } catch (error) {
      console.error('Failed to update profile:', error);
      return false;
    }
  }, [profile]);

  const actions: FinancialContextActions = {
    refreshAll,
    refreshExpenses,
    addExpense: addExpenseAction,
    deleteExpense: deleteExpenseAction,
    addSavingsWin: addSavingsWinAction,
    updateBlueprint: updateBlueprintAction,
    updateProfile: updateProfileAction,
  };

  const value: FinancialContextValue = {
    profile,
    financialData,
    rolloverState,
    todayExpenses,
    monthExpenses,
    savingsWins,
    totalSavings,
    milestones,
    isLoading,
    isRefreshing,
    spendableToday,
    dailyAllowance,
    momentumStreak,
    daysRemainingInMonth,
    monthlySpentSoFar,
    wellnessScore,
    actions,
  };

  return (
    <FinancialDataContext.Provider value={value}>
      {children}
    </FinancialDataContext.Provider>
  );
}

export function useFinancialData(): FinancialContextValue {
  const context = useContext(FinancialDataContext);
  if (!context) {
    // Return safe defaults when outside provider
    return {
      profile: null,
      financialData: null,
      rolloverState: null,
      todayExpenses: [],
      monthExpenses: [],
      savingsWins: [],
      totalSavings: 0,
      milestones: [],
      isLoading: true,
      isRefreshing: false,
      spendableToday: 0,
      dailyAllowance: 0,
      momentumStreak: 0,
      daysRemainingInMonth: getDaysRemainingInMonth(),
      monthlySpentSoFar: 0,
      wellnessScore: 50,
      actions: {
        refreshAll: async () => { },
        refreshExpenses: async () => { },
        addExpense: async () => false,
        deleteExpense: async () => false,
        addSavingsWin: async () => false,
        updateBlueprint: async () => false,
        updateProfile: async () => false,
      },
    };
  }
  return context;
}
