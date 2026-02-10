import { supabase } from '@/lib/supabase';
import { FinancialData } from '@/types';

// Retry configuration
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // ms

// Helper function to retry async operations
async function retryOperation<T>(
  operation: () => Promise<T>,
  retries = MAX_RETRIES,
  delay = RETRY_DELAY
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying operation... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await new Promise(resolve => setTimeout(resolve, delay));
      return retryOperation(operation, retries - 1, delay * 2);
    }
    throw error;
  }
}

// Helper to get authenticated user ID
async function getAuthUserId(): Promise<string> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No authenticated user');
  return user.id;
}

export const supabaseSync = {
  /**
   * Create or update user profile in Supabase with retry mechanism
   */
  async syncUserProfile(userData: {
    name?: string;
    avatarUrl?: string;
    currency?: string;
    monthlyIncome?: number;
    savingsGoal?: number;
    dailyBudget?: number;
    blueprintComplete?: boolean;
    totalSavings?: number;
  }) {
    try {
      const result = await retryOperation(async () => {
        const userId = await getAuthUserId();
        const { data: { user } } = await supabase.auth.getUser();

        const { data, error } = await supabase
          .from('user_profiles')
          .upsert({
            id: userId,
            email: user?.email,
            name: userData.name,
            avatar_url: userData.avatarUrl,
            currency: userData.currency,
            monthly_income: userData.monthlyIncome,
            savings_goal: userData.savingsGoal,
            daily_budget: userData.dailyBudget,
            blueprint_complete: userData.blueprintComplete,
            updated_at: new Date().toISOString(),
          })
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to sync user profile after retries:', error);
      return {
        success: false,
        error,
        message: error instanceof Error ? error.message : 'Failed to sync user profile'
      };
    }
  },

  /**
   * Get user profile from Supabase
   */
  async getUserProfile() {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get user profile:', error);
      return { success: false, error };
    }
  },

  /**
   * Sync financial data to Supabase with retry mechanism
   */
  async syncFinancialData(financialData: Partial<FinancialData>) {
    try {
      const result = await retryOperation(async () => {
        const userId = await getAuthUserId();

        const updateData: Record<string, unknown> = {
          user_id: userId,
          updated_at: new Date().toISOString(),
        };
        if (financialData.dailyWellnessScore !== undefined) updateData.daily_wellness_score = financialData.dailyWellnessScore;
        if (financialData.monthlySavings !== undefined) updateData.monthly_savings = financialData.monthlySavings;
        if (financialData.dailySpending !== undefined) updateData.daily_spending = financialData.dailySpending;
        if (financialData.savingsGoal !== undefined) updateData.savings_goal = financialData.savingsGoal;
        if (financialData.dailyBudget !== undefined) updateData.daily_budget = financialData.dailyBudget;
        if (financialData.streakDays !== undefined) updateData.streak_days = financialData.streakDays;
        if (financialData.monthlyIncome !== undefined) updateData.monthly_income = financialData.monthlyIncome;
        if (financialData.currency !== undefined) updateData.currency = financialData.currency;
        if (financialData.totalSavings !== undefined) updateData.total_savings = financialData.totalSavings;

        const { data, error } = await supabase
          .from('financial_data')
          .upsert(updateData)
          .select()
          .single();

        if (error) throw error;
        return data;
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to sync financial data after retries:', error);
      return {
        success: false,
        error,
        message: error instanceof Error ? error.message : 'Failed to sync financial data'
      };
    }
  },

  /**
   * Get financial data from Supabase
   */
  async getFinancialData() {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get financial data:', error);
      return { success: false, error };
    }
  },

  /**
   * Add expense to Supabase
   */
  async addExpense(expense: {
    amount: number;
    category: string;
    description?: string;
    date?: string;
  }) {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: userId,
          amount: expense.amount,
          category: expense.category,
          description: expense.description || '',
          expense_date: expense.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to add expense:', error);
      return { success: false, error };
    }
  },

  /**
   * Get user expenses from Supabase
   */
  async getExpenses(limit?: number) {
    try {
      const userId = await getAuthUserId();

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to get expenses:', error);
      return { success: false, data: [], error };
    }
  },

  /**
   * Get today's expenses
   */
  async getTodayExpenses() {
    try {
      const userId = await getAuthUserId();
      const today = new Date().toISOString().split('T')[0];

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .eq('expense_date', today)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to get today expenses:', error);
      return { success: false, data: [], error };
    }
  },

  /**
   * Get this month's expenses
   */
  async getMonthExpenses() {
    try {
      const userId = await getAuthUserId();
      const now = new Date();
      const monthStart = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;
      const monthEnd = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()).padStart(2, '0')}`;

      const { data, error } = await supabase
        .from('expenses')
        .select('*')
        .eq('user_id', userId)
        .gte('expense_date', monthStart)
        .lte('expense_date', monthEnd)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to get month expenses:', error);
      return { success: false, data: [], error };
    }
  },

  /**
   * Delete an expense
   */
  async deleteExpense(expenseId: string) {
    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', expenseId);

      if (error) throw error;
      return { success: true };
    } catch (error) {
      console.error('Failed to delete expense:', error);
      return { success: false, error };
    }
  },

  /**
   * Add savings win
   */
  async addSavingsWin(win: {
    title: string;
    amount: number;
    description?: string;
    date?: string;
  }) {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('savings_wins')
        .insert({
          user_id: userId,
          title: win.title,
          amount: win.amount,
          description: win.description || '',
          win_date: win.date || new Date().toISOString().split('T')[0],
        })
        .select()
        .single();

      if (error) throw error;

      // Update total savings in financial_data (fallback manual update)
      try {
        const { data: fd } = await supabase
          .from('financial_data')
          .select('total_savings, monthly_savings')
          .eq('user_id', userId)
          .single();

        if (fd) {
          await supabase
            .from('financial_data')
            .update({
              total_savings: (fd.total_savings || 0) + win.amount,
              monthly_savings: (fd.monthly_savings || 0) + win.amount,
              updated_at: new Date().toISOString(),
            })
            .eq('user_id', userId);
        }
      } catch (updateError) {
        console.warn('Failed to update total savings:', updateError);
      }

      return { success: true, data };
    } catch (error) {
      console.error('Failed to add savings win:', error);
      return { success: false, error };
    }
  },

  /**
   * Get savings wins
   */
  async getSavingsWins(limit?: number) {
    try {
      const userId = await getAuthUserId();

      let query = supabase
        .from('savings_wins')
        .select('*')
        .eq('user_id', userId)
        .order('win_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to get savings wins:', error);
      return { success: false, data: [], error };
    }
  },

  /**
   * Update streak
   */
  async updateStreak(streakDays: number, dailySpending: number, dailyBudget: number) {
    try {
      const userId = await getAuthUserId();
      const today = new Date().toISOString().split('T')[0];
      const stayedOnBudget = dailySpending <= dailyBudget;

      // Upsert streak entry for today
      await supabase
        .from('savings_streaks')
        .upsert({
          user_id: userId,
          streak_date: today,
          stayed_on_budget: stayedOnBudget,
          daily_spending: dailySpending,
          daily_budget: dailyBudget,
        }, { onConflict: 'user_id,streak_date' })
        .select();

      // Update financial_data with current streak count
      await supabase
        .from('financial_data')
        .update({
          streak_days: streakDays,
          last_streak_date: today,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      return { success: true };
    } catch (error) {
      console.error('Failed to update streak:', error);
      return { success: false, error };
    }
  },

  /**
   * Initialize default milestones for user with retry and duplication check
   */
  async initializeMilestones() {
    try {
      const result = await retryOperation(async () => {
        const userId = await getAuthUserId();

        // Check if milestones already exist
        const { data: existingMilestones, error: checkError } = await supabase
          .from('milestones')
          .select('id')
          .eq('user_id', userId)
          .limit(1);

        if (checkError) throw checkError;

        // If milestones already exist, skip initialization
        if (existingMilestones && existingMilestones.length > 0) {
          return { alreadyExists: true };
        }

        const defaultMilestones = [
          { title: 'First Steps', description: 'Created your account', icon: '👶', amount: 0, unlocked: true, sort_order: 1 },
          { title: 'Savings Started', description: 'Saved your first 100', icon: '🌱', amount: 100, unlocked: false, sort_order: 2 },
          { title: 'Budget Master', description: '7-day streak under budget', icon: '🎯', amount: 0, unlocked: false, sort_order: 3 },
          { title: 'Debt Destroyer', description: 'Paid off a debt', icon: '💪', amount: 0, unlocked: false, sort_order: 4 },
          { title: 'Emergency Fund', description: 'Built 1000 emergency fund', icon: '🛡️', amount: 1000, unlocked: false, sort_order: 5 },
          { title: 'Investment Pro', description: 'Started investing for the future', icon: '📈', amount: 0, unlocked: false, sort_order: 6 },
          { title: 'Financial Freedom', description: 'Reached 10,000 savings', icon: '👑', amount: 10000, unlocked: false, sort_order: 7 },
        ];

        const milestonesToInsert = defaultMilestones.map(m => ({
          ...m,
          user_id: userId,
          unlocked_at: m.unlocked ? new Date().toISOString() : null,
        }));

        const { data, error } = await supabase
          .from('milestones')
          .insert(milestonesToInsert)
          .select();

        if (error) throw error;
        return data;
      });

      return { success: true, data: result };
    } catch (error) {
      console.error('Failed to initialize milestones after retries:', error);
      return {
        success: false,
        error,
        message: error instanceof Error ? error.message : 'Failed to initialize milestones'
      };
    }
  },

  /**
   * Get user milestones from Supabase
   */
  async getMilestones() {
    try {
      const userId = await getAuthUserId();

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userId)
        .order('sort_order', { ascending: true });

      if (error) throw error;
      return { success: true, data: data || [] };
    } catch (error) {
      console.error('Failed to get milestones:', error);
      return { success: false, data: [], error };
    }
  },

  /**
   * Unlock a milestone
   */
  async unlockMilestone(milestoneId: string) {
    try {
      const { data, error } = await supabase
        .from('milestones')
        .update({
          unlocked: true,
          unlocked_at: new Date().toISOString(),
        })
        .eq('id', milestoneId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to unlock milestone:', error);
      return { success: false, error };
    }
  },

  /**
   * Check and unlock milestones based on user data
   */
  async checkAndUnlockMilestones(totalSavings: number, streakDays: number) {
    try {
      const userId = await getAuthUserId();

      const { data: milestones, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', userId)
        .eq('unlocked', false);

      if (error || !milestones) return { success: false, error };

      const unlocked: string[] = [];

      for (const milestone of milestones) {
        let shouldUnlock = false;

        if (milestone.title === 'Savings Started' && totalSavings >= 100) shouldUnlock = true;
        if (milestone.title === 'Budget Master' && streakDays >= 7) shouldUnlock = true;
        if (milestone.title === 'Emergency Fund' && totalSavings >= 1000) shouldUnlock = true;
        if (milestone.title === 'Financial Freedom' && totalSavings >= 10000) shouldUnlock = true;

        if (shouldUnlock) {
          await supabase
            .from('milestones')
            .update({ unlocked: true, unlocked_at: new Date().toISOString() })
            .eq('id', milestone.id);
          unlocked.push(milestone.title);
        }
      }

      return { success: true, unlocked };
    } catch (error) {
      console.error('Failed to check milestones:', error);
      return { success: false, error };
    }
  },

  /**
   * Update financial data fields for total savings
   */
  async updateTotalSavings(amount: number) {
    try {
      const userId = await getAuthUserId();

      const { data: fd } = await supabase
        .from('financial_data')
        .select('total_savings, monthly_savings')
        .eq('user_id', userId)
        .single();

      const newTotalSavings = (fd?.total_savings || 0) + amount;
      const newMonthlySavings = (fd?.monthly_savings || 0) + amount;

      const { error } = await supabase
        .from('financial_data')
        .update({
          total_savings: newTotalSavings,
          monthly_savings: newMonthlySavings,
          updated_at: new Date().toISOString(),
        })
        .eq('user_id', userId);

      if (error) throw error;
      return { success: true, totalSavings: newTotalSavings, monthlySavings: newMonthlySavings };
    } catch (error) {
      console.error('Failed to update total savings:', error);
      return { success: false, error };
    }
  },
};
