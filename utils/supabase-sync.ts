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
  }) {
    try {
      const result = await retryOperation(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            email: user.email,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', user.id)
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
  async syncFinancialData(financialData: FinancialData) {
    try {
      const result = await retryOperation(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        const { data, error } = await supabase
          .from('financial_data')
          .upsert({
            user_id: user.id,
            daily_wellness_score: financialData.dailyWellnessScore,
            monthly_savings: financialData.monthlySavings,
            daily_spending: financialData.dailySpending,
            savings_goal: financialData.savingsGoal,
            daily_budget: financialData.dailyBudget,
            streak_days: financialData.streakDays,
            monthly_income: financialData.monthlyIncome,
            currency: financialData.currency,
            updated_at: new Date().toISOString(),
          })
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('financial_data')
        .select('*')
        .eq('user_id', user.id)
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('expenses')
        .insert({
          user_id: user.id,
          amount: expense.amount,
          category: expense.category,
          description: expense.description,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      let query = supabase
        .from('expenses')
        .select('*')
        .eq('user_id', user.id)
        .order('expense_date', { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get expenses:', error);
      return { success: false, error };
    }
  },

  /**
   * Initialize default milestones for user with retry and duplication check
   */
  async initializeMilestones() {
    try {
      const result = await retryOperation(async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('No authenticated user');

        // Check if milestones already exist
        const { data: existingMilestones, error: checkError } = await supabase
          .from('milestones')
          .select('id')
          .eq('user_id', user.id)
          .limit(1);

        if (checkError) throw checkError;

        // If milestones already exist, skip initialization
        if (existingMilestones && existingMilestones.length > 0) {
          console.log('Milestones already initialized for user');
          return { alreadyExists: true };
        }

        const defaultMilestones = [
          { title: 'First Steps', description: 'Created your account', icon: '👶', amount: 0, unlocked: true },
          { title: 'Savings Started', description: 'Saved your first 100', icon: '🌱', amount: 100, unlocked: false },
          { title: 'Budget Master', description: 'Stayed under budget for 7 days', icon: '🎯', amount: 0, unlocked: false },
          { title: 'Debt Destroyer', description: 'Paid off a debt', icon: '💪', amount: 0, unlocked: false },
          { title: 'Emergency Fund', description: 'Built 1000 emergency fund', icon: '🛡️', amount: 1000, unlocked: false },
          { title: 'Investment Pro', description: 'Started investing for the future', icon: '📈', amount: 0, unlocked: false },
          { title: 'Financial Freedom', description: 'Reached 10,000 savings', icon: '👑', amount: 10000, unlocked: false },
        ];

        const milestonesToInsert = defaultMilestones.map(m => ({
          ...m,
          user_id: user.id,
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('No authenticated user');

      const { data, error } = await supabase
        .from('milestones')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error('Failed to get milestones:', error);
      return { success: false, error };
    }
  },
};
