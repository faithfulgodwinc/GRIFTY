export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  currency?: string;
  monthlyIncome?: number;
  savingsGoal?: number;
  dailyBudget?: number;
  onboardingComplete: boolean;
  blueprintComplete: boolean;
  totalSavings?: number;
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

export type ExpenseCategory =
  | 'groceries'
  | 'kids'
  | 'self-care'
  | 'home'
  | 'transport'
  | 'dining'
  | 'entertainment'
  | 'health'
  | 'education'
  | 'other';

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
  totalSavings?: number;
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
  amount?: number;
}

export interface SavingsWin {
  id: string;
  userId: string;
  title: string;
  amount: number;
  description?: string;
  winDate: string;
  createdAt: string;
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

// Context types for centralized state
export interface FinancialContextState {
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
}
