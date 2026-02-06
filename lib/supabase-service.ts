import { supabase } from './supabase';
import type {
  User,
  Expense,
  FinancialData,
  Milestone,
  InvestmentData,
} from '@/types';

// ==================== PROFILES ====================
export const profileService = {
  async getProfile(userId: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) throw error;
    return data;
  },

  async updateProfile(userId: string, updates: Partial<User>) {
    const { data, error } = await supabase
      .from('profiles')
      .update(updates)
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async completeOnboarding(userId: string, profileData: {
    name?: string;
    monthly_income?: number;
    savings_goal?: number;
    daily_budget?: number;
  }) {
    const { data, error } = await supabase
      .from('profiles')
      .update({
        ...profileData,
        onboarding_complete: true,
      })
      .eq('id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== EXPENSES ====================
export const expenseService = {
  async getExpenses(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('expenses')
      .select('*')
      .eq('user_id', userId)
      .order('expense_date', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async addExpense(userId: string, expense: Omit<Expense, 'id' | 'userId' | 'createdAt'>) {
    const { data, error} = await supabase
      .from('expenses')
      .insert({
        user_id: userId,
        amount: expense.amount,
        category: expense.category,
        description: expense.description,
        expense_date: expense.date,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateExpense(expenseId: string, updates: Partial<Expense>) {
    const { data, error } = await supabase
      .from('expenses')
      .update({
        amount: updates.amount,
        category: updates.category,
        description: updates.description,
        expense_date: updates.date,
      })
      .eq('id', expenseId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteExpense(expenseId: string) {
    const { error } = await supabase
      .from('expenses')
      .delete()
      .eq('id', expenseId);

    if (error) throw error;
  },

  async getTodayTotal(userId: string) {
    const today = new Date().toISOString().split('T')[0];
    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .eq('expense_date', today);

    if (error) throw error;
    return data.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  },

  async getMonthTotal(userId: string) {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    const startDate = startOfMonth.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('expenses')
      .select('amount')
      .eq('user_id', userId)
      .gte('expense_date', startDate);

    if (error) throw error;
    return data.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  },
};

// ==================== FINANCIAL DATA ====================
export const financialService = {
  async getFinancialData(userId: string) {
    const { data, error } = await supabase
      .from('financial_data')
      .select('*')
      .eq('user_id', userId)
      .single();

    if (error) {
      // If no data exists, create initial data
      if (error.code === 'PGRST116') {
        return await this.initializeFinancialData(userId);
      }
      throw error;
    }
    return data;
  },

  async initializeFinancialData(userId: string) {
    const { data, error } = await supabase
      .from('financial_data')
      .insert({
        user_id: userId,
        daily_wellness_score: 0,
        monthly_savings: 0,
        daily_spending: 0,
        streak_days: 0,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateFinancialData(userId: string, updates: Partial<FinancialData>) {
    const { data, error } = await supabase
      .from('financial_data')
      .update({
        daily_wellness_score: updates.dailyWellnessScore,
        monthly_savings: updates.monthlySavings,
        daily_spending: updates.dailySpending,
        streak_days: updates.streakDays,
      })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async updateWellnessScore(userId: string, score: number) {
    const { data, error } = await supabase
      .from('financial_data')
      .update({ daily_wellness_score: score })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async calculateAndUpdateWellnessScore(userId: string) {
    // Get profile data
    const profile = await profileService.getProfile(userId);
    const todaySpending = await expenseService.getTodayTotal(userId);
    const financialData = await this.getFinancialData(userId);

    // Calculate wellness score (0-100)
    let score = 50; // Base score

    // Budget adherence (up to 40 points)
    if (profile.daily_budget) {
      const budgetRatio = todaySpending / profile.daily_budget;
      if (budgetRatio <= 0.8) score += 40;
      else if (budgetRatio <= 1.0) score += 20;
      else score -= 20;
    }

    // Savings progress (up to 30 points)
    if (profile.savings_goal && financialData.monthly_savings) {
      const savingsRatio = financialData.monthly_savings / profile.savings_goal;
      if (savingsRatio >= 1.0) score += 30;
      else score += savingsRatio * 30;
    }

    // Streak bonus (up to 30 points)
    const streakPoints = Math.min(financialData.streak_days * 2, 30);
    score += streakPoints;

    const finalScore = Math.max(0, Math.min(100, Math.round(score)));
    return await this.updateWellnessScore(userId, finalScore);
  },
};

// ==================== CHAT MESSAGES ====================
export const chatService = {
  async getChatHistory(userId: string, limit = 50) {
    const { data, error } = await supabase
      .from('chat_messages')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw error;
    return data;
  },

  async addMessage(userId: string, messageText: string, isUserMessage: boolean) {
    const { data, error } = await supabase
      .from('chat_messages')
      .insert({
        user_id: userId,
        message_text: messageText,
        is_user_message: isUserMessage,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async clearChatHistory(userId: string) {
    const { error } = await supabase
      .from('chat_messages')
      .delete()
      .eq('user_id', userId);

    if (error) throw error;
  },
};

// ==================== MILESTONES ====================
export const milestoneService = {
  async getMilestones(userId: string) {
    const { data, error } = await supabase
      .from('milestones')
      .select('*')
      .eq('user_id', userId)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  },

  async unlockMilestone(milestoneId: string) {
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
    return data;
  },

  async checkAndUnlockMilestones(userId: string) {
    const milestones = await this.getMilestones(userId);
    const financialData = await financialService.getFinancialData(userId);
    const profile = await profileService.getProfile(userId);

    for (const milestone of milestones) {
      if (!milestone.unlocked) {
        let shouldUnlock = false;

        // Check based on milestone title (basic logic)
        if (milestone.title === 'Savings Started' && financialData.monthly_savings >= 100) {
          shouldUnlock = true;
        } else if (milestone.title === 'Budget Master' && financialData.streak_days >= 7) {
          shouldUnlock = true;
        } else if (milestone.title === 'Emergency Fund' && financialData.monthly_savings >= 1000) {
          shouldUnlock = true;
        } else if (milestone.title === 'Financial Freedom' && financialData.monthly_savings >= 10000) {
          shouldUnlock = true;
        }

        if (shouldUnlock) {
          await this.unlockMilestone(milestone.id);
        }
      }
    }
  },
};

// ==================== MOM TIPS ====================
export const momTipsService = {
  async getActiveTips() {
    const { data, error } = await supabase
      .from('mom_tips')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data;
  },
};

// ==================== INVESTMENT SIMULATIONS ====================
export const investmentService = {
  async getActiveSimulation(userId: string) {
    const { data, error } = await supabase
      .from('investment_simulations')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') throw error;
    return data || null;
  },

  async saveSimulation(userId: string, simulation: {
    monthlyAmount: number;
    durationYears: number;
    riskLevel: 'safe' | 'steady' | 'aggressive';
    projectedReturn: number;
  }) {
    // Deactivate previous simulations
    await supabase
      .from('investment_simulations')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('is_active', true);

    const { data, error } = await supabase
      .from('investment_simulations')
      .insert({
        user_id: userId,
        monthly_amount: simulation.monthlyAmount,
        duration_years: simulation.durationYears,
        risk_level: simulation.riskLevel,
        projected_return: simulation.projectedReturn,
        is_active: true,
      })
      .select()
      .single();

    if (error) throw error;
    return data;
  },
};

// ==================== SAVINGS STREAKS ====================
export const streakService = {
  async recordDailyStreak(userId: string, stayedOnBudget: boolean) {
    const today = new Date().toISOString().split('T')[0];
    const profile = await profileService.getProfile(userId);
    const dailySpending = await expenseService.getTodayTotal(userId);

    const { data, error } = await supabase
      .from('savings_streaks')
      .insert({
        user_id: userId,
        streak_date: today,
        stayed_on_budget: stayedOnBudget,
        daily_spending: dailySpending,
        daily_budget: profile.daily_budget,
      })
      .select()
      .single();

    if (error) {
      // If already exists for today, update it
      if (error.code === '23505') {
        const { data: updated, error: updateError } = await supabase
          .from('savings_streaks')
          .update({
            stayed_on_budget: stayedOnBudget,
            daily_spending: dailySpending,
          })
          .eq('user_id', userId)
          .eq('streak_date', today)
          .select()
          .single();

        if (updateError) throw updateError;
        return updated;
      }
      throw error;
    }

    // Update streak in financial_data
    const { data: streakData } = await supabase.rpc('calculate_current_streak', {
      p_user_id: userId,
    });

    await financialService.updateFinancialData(userId, {
      streakDays: streakData || 0,
    } as any);

    return data;
  },

  async getCurrentStreak(userId: string) {
    const { data, error } = await supabase.rpc('calculate_current_streak', {
      p_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  },
};
