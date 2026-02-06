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

export type ExpenseCategory = 'household' | 'self-care' | 'education' | 'emergency' | 'groceries' | 'kids' | 'home' | 'other';

export interface BudgetCategory {
  id: string;
  name: string;
  allocated: number;
  spent: number;
  icon: string;
  color: string;
}

export interface FinancialData {
  dailyWellnessScore: number;
  budgetHealthScore?: number;
  monthlySavings: number;
  dailySpending: number;
  savingsGoal: number;
  dailyBudget: number;
  streakDays: number;
  monthlyIncome: number;
  currency: string;
  budgetCategories?: BudgetCategory[];
}

// Daily Spending Rollover Engine Types
export interface DailyRolloverEntry {
  date: string; // YYYY-MM-DD
  baseAllowance: number; // (income - savings) / daysRemaining
  rolloverFromPrevious: number; // positive = surplus, negative = overage
  effectiveLimit: number; // baseAllowance + rollover
  totalSpent: number;
  remainingAtEndOfDay: number; // effectiveLimit - totalSpent
  underBudget: boolean;
}

export interface DailyRolloverState {
  currentDate: string; // YYYY-MM-DD
  todayEntry: DailyRolloverEntry;
  tomorrowForecast: number; // projected tomorrow's limit
  momentumStreak: number; // consecutive days under budget
  history: DailyRolloverEntry[]; // last 30 days
  lastUpdated: string; // ISO timestamp
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
