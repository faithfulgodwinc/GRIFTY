import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyRolloverEntry, DailyRolloverState, FinancialData } from '@/types';

const ROLLOVER_STORAGE_KEY = '@grit_daily_rollover';

// Get today's date as YYYY-MM-DD
const getToday = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
};

// Get days remaining in current month (including today)
const getDaysRemainingInMonth = (): number => {
  const now = new Date();
  const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return lastDay - now.getDate() + 1; // +1 to include today
};

// Get tomorrow's date as YYYY-MM-DD
const getTomorrow = (): string => {
  const now = new Date();
  const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
  return `${tomorrow.getFullYear()}-${String(tomorrow.getMonth() + 1).padStart(2, '0')}-${String(tomorrow.getDate()).padStart(2, '0')}`;
};

// Get days remaining in month for a specific date
const getDaysRemainingForDate = (dateStr: string): number => {
  const date = new Date(dateStr);
  const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  return lastDay - date.getDate() + 1;
};

// Calculate base daily allowance
export const calculateBaseAllowance = (
  monthlyIncome: number,
  savingsGoal: number,
  daysRemaining?: number
): number => {
  const remaining = daysRemaining ?? getDaysRemainingInMonth();
  if (remaining <= 0) return 0;
  const spendableBudget = Math.max(monthlyIncome - savingsGoal, 0);
  return Math.round((spendableBudget / remaining) * 100) / 100;
};

// Load rollover state from storage
export const loadRolloverState = async (): Promise<DailyRolloverState | null> => {
  try {
    const data = await AsyncStorage.getItem(ROLLOVER_STORAGE_KEY);
    if (!data) return null;
    return JSON.parse(data) as DailyRolloverState;
  } catch (error) {
    console.error('Failed to load rollover state:', error);
    return null;
  }
};

// Save rollover state to storage
export const saveRolloverState = async (state: DailyRolloverState): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(ROLLOVER_STORAGE_KEY, JSON.stringify(state));
    return true;
  } catch (error) {
    console.error('Failed to save rollover state:', error);
    return false;
  }
};

// Calculate momentum streak from history
const calculateMomentumStreak = (history: DailyRolloverEntry[], todayUnderBudget: boolean): number => {
  let streak = todayUnderBudget ? 1 : 0;

  if (!todayUnderBudget) return 0;

  // Sort history by date descending (most recent first), excluding today
  const sortedHistory = [...history]
    .sort((a, b) => b.date.localeCompare(a.date));

  for (const entry of sortedHistory) {
    if (entry.date === getToday()) continue; // skip today, already counted
    if (entry.underBudget) {
      streak++;
    } else {
      break;
    }
  }

  return streak;
};

// Initialize or advance to today's rollover state
export const initializeDailyRollover = async (
  financialData: FinancialData
): Promise<DailyRolloverState> => {
  const today = getToday();
  const existingState = await loadRolloverState();

  // If we already have today's entry, return existing state
  if (existingState && existingState.currentDate === today) {
    return existingState;
  }

  const daysRemaining = getDaysRemainingInMonth();
  const baseAllowance = calculateBaseAllowance(
    financialData.monthlyIncome,
    financialData.savingsGoal,
    daysRemaining
  );

  // Calculate rollover from previous day
  let rolloverFromPrevious = 0;
  let history = existingState?.history || [];

  if (existingState && existingState.todayEntry) {
    // The previous "today" entry is now yesterday - finalize it
    const prevEntry = existingState.todayEntry;
    rolloverFromPrevious = prevEntry.effectiveLimit - prevEntry.totalSpent;

    // Add the finalized previous entry to history
    const existsInHistory = history.some((e) => e.date === prevEntry.date);
    if (!existsInHistory) {
      history = [
        {
          ...prevEntry,
          remainingAtEndOfDay: prevEntry.effectiveLimit - prevEntry.totalSpent,
          underBudget: prevEntry.totalSpent <= prevEntry.effectiveLimit,
        },
        ...history,
      ];
    }

    // Handle multi-day gaps: check if there are missing days between last entry and today
    const lastDate = new Date(prevEntry.date);
    const todayDate = new Date(today);
    const dayGap = Math.floor((todayDate.getTime() - lastDate.getTime()) / (1000 * 60 * 60 * 24));

    if (dayGap > 1) {
      // For each missing day, assume $0 spent, so full allowance rolls over
      for (let i = 1; i < dayGap; i++) {
        const gapDate = new Date(lastDate.getTime() + i * 24 * 60 * 60 * 1000);
        const gapDateStr = `${gapDate.getFullYear()}-${String(gapDate.getMonth() + 1).padStart(2, '0')}-${String(gapDate.getDate()).padStart(2, '0')}`;
        const gapDaysRemaining = getDaysRemainingForDate(gapDateStr);
        const gapBaseAllowance = calculateBaseAllowance(
          financialData.monthlyIncome,
          financialData.savingsGoal,
          gapDaysRemaining
        );
        const gapEffectiveLimit = gapBaseAllowance + rolloverFromPrevious;

        history = [
          {
            date: gapDateStr,
            baseAllowance: gapBaseAllowance,
            rolloverFromPrevious: rolloverFromPrevious,
            effectiveLimit: gapEffectiveLimit,
            totalSpent: 0,
            remainingAtEndOfDay: gapEffectiveLimit,
            underBudget: true,
          },
          ...history,
        ];
        rolloverFromPrevious = gapEffectiveLimit; // full amount rolls over
      }
    }
  }

  // Keep only last 30 days of history
  history = history.slice(0, 30);

  const effectiveLimit = Math.max(baseAllowance + rolloverFromPrevious, 0);

  const todayEntry: DailyRolloverEntry = {
    date: today,
    baseAllowance,
    rolloverFromPrevious,
    effectiveLimit,
    totalSpent: financialData.dailySpending || 0,
    remainingAtEndOfDay: effectiveLimit - (financialData.dailySpending || 0),
    underBudget: (financialData.dailySpending || 0) <= effectiveLimit,
  };

  // Calculate tomorrow's forecast
  const tomorrowDaysRemaining = Math.max(daysRemaining - 1, 1);
  const tomorrowBaseAllowance = calculateBaseAllowance(
    financialData.monthlyIncome,
    financialData.savingsGoal,
    tomorrowDaysRemaining
  );
  const projectedRemainingToday = effectiveLimit - todayEntry.totalSpent;
  const tomorrowForecast = tomorrowBaseAllowance + projectedRemainingToday;

  // Calculate momentum streak
  const momentumStreak = calculateMomentumStreak(history, todayEntry.underBudget);

  const state: DailyRolloverState = {
    currentDate: today,
    todayEntry,
    tomorrowForecast: Math.max(tomorrowForecast, 0),
    momentumStreak,
    history,
    lastUpdated: new Date().toISOString(),
  };

  await saveRolloverState(state);
  return state;
};

// Update today's spending and recalculate rollover
export const updateDailySpending = async (
  newSpending: number,
  financialData: FinancialData
): Promise<DailyRolloverState> => {
  const state = await initializeDailyRollover(financialData);

  state.todayEntry.totalSpent = newSpending;
  state.todayEntry.remainingAtEndOfDay = state.todayEntry.effectiveLimit - newSpending;
  state.todayEntry.underBudget = newSpending <= state.todayEntry.effectiveLimit;

  // Recalculate tomorrow's forecast
  const daysRemaining = getDaysRemainingInMonth();
  const tomorrowDaysRemaining = Math.max(daysRemaining - 1, 1);
  const tomorrowBaseAllowance = calculateBaseAllowance(
    financialData.monthlyIncome,
    financialData.savingsGoal,
    tomorrowDaysRemaining
  );
  const projectedRemainingToday = state.todayEntry.effectiveLimit - newSpending;
  state.tomorrowForecast = Math.max(tomorrowBaseAllowance + projectedRemainingToday, 0);

  // Recalculate momentum streak
  state.momentumStreak = calculateMomentumStreak(state.history, state.todayEntry.underBudget);

  state.lastUpdated = new Date().toISOString();
  await saveRolloverState(state);

  return state;
};

// Log daily spending amount (add to today's total)
export const logSpending = async (
  amount: number,
  financialData: FinancialData
): Promise<DailyRolloverState> => {
  const state = await initializeDailyRollover(financialData);
  const newTotal = state.todayEntry.totalSpent + amount;
  return updateDailySpending(newTotal, financialData);
};
