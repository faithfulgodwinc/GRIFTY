export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  currency?: string; // Symbol like $, £, €, etc.
  monthlyIncome?: number;
  savingsGoal?: number;
  dailyBudget?: number;
  onboardingComplete: boolean;
  blueprintComplete: boolean;
}

export interface Expense {
  id: string;
  userId: string;
  amount: number;
  category: ExpenseCategory;
  description: string;
  date: string;
  createdAt: string;
}

export type ExpenseCategory = 'groceries' | 'kids' | 'self-care' | 'home' | 'other';

export interface FinancialData {
  dailyWellnessScore: number;
  monthlySavings: number;
  dailySpending: number;
  savingsGoal: number;
  dailyBudget: number;
  streakDays: number;
  monthlyIncome: number;
  currency: string;
}

export interface Currency {
  code: string;
  symbol: string;
  name: string;
  flag: string;
}

export interface Milestone {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt?: string;
}

export interface FinancialHack {
  id: string;
  title: string;
  thumbnail: string;
  duration: string;
  category: string;
}

export interface InvestmentData {
  amount: number;
  duration: number; // years
  riskLevel: 'safe' | 'steady' | 'aggressive';
  projectedReturn: number;
}
