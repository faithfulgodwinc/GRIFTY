import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_DATA: '@grit_user_data',
  EXPENSES: '@grit_expenses',
  FINANCIAL_DATA: '@grit_financial_data',
  MILESTONES: '@grit_milestones',
  ONBOARDING_COMPLETE: '@grit_onboarding_complete',
  BLUEPRINT_COMPLETE: '@grit_blueprint_complete',
  CHAT_HISTORY: '@grit_chat_history',
  STREAKS: '@grit_streaks',
  DAILY_ROLLOVER: '@grit_daily_rollover',
  TOUR_COMPLETE: '@grit_tour_complete',
} as const;

interface StorageError {
  error: true;
  message: string;
}

// Safe JSON parse with error handling
const safeJsonParse = <T>(data: string | null, fallback: T): T => {
  if (!data) return fallback;

  try {
    return JSON.parse(data) as T;
  } catch (error) {
    console.error('Failed to parse JSON from storage:', error);
    return fallback;
  }
};

// Safe JSON stringify with error handling
const safeJsonStringify = (data: any): string | null => {
  try {
    return JSON.stringify(data);
  } catch (error) {
    console.error('Failed to stringify data:', error);
    return null;
  }
};

export const storage = {
  async setUserData(data: any): Promise<boolean> {
    try {
      const jsonData = safeJsonStringify(data);
      if (!jsonData) return false;
      await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, jsonData);
      return true;
    } catch (error) {
      console.error('Failed to save user data:', error);
      return false;
    }
  },

  async getUserData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
      return safeJsonParse(data, null);
    } catch (error) {
      console.error('Failed to get user data:', error);
      return null;
    }
  },

  async setExpenses(expenses: any[]): Promise<boolean> {
    try {
      const jsonData = safeJsonStringify(expenses);
      if (!jsonData) return false;
      await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, jsonData);
      return true;
    } catch (error) {
      console.error('Failed to save expenses:', error);
      return false;
    }
  },

  async getExpenses(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
      return safeJsonParse(data, []);
    } catch (error) {
      console.error('Failed to get expenses:', error);
      return [];
    }
  },

  async setFinancialData(data: any): Promise<boolean> {
    try {
      const jsonData = safeJsonStringify(data);
      if (!jsonData) return false;
      await AsyncStorage.setItem(STORAGE_KEYS.FINANCIAL_DATA, jsonData);
      return true;
    } catch (error) {
      console.error('Failed to save financial data:', error);
      return false;
    }
  },

  async getFinancialData(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.FINANCIAL_DATA);
      return safeJsonParse(data, null);
    } catch (error) {
      console.error('Failed to get financial data:', error);
      return null;
    }
  },

  async setOnboardingComplete(complete: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
      return true;
    } catch (error) {
      console.error('Failed to save onboarding status:', error);
      return false;
    }
  },

  async getOnboardingComplete(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
      return safeJsonParse(data, false);
    } catch (error) {
      console.error('Failed to get onboarding status:', error);
      return false;
    }
  },

  async setChatHistory(messages: any[]): Promise<boolean> {
    try {
      const jsonData = safeJsonStringify(messages);
      if (!jsonData) return false;
      await AsyncStorage.setItem(STORAGE_KEYS.CHAT_HISTORY, jsonData);
      return true;
    } catch (error) {
      console.error('Failed to save chat history:', error);
      return false;
    }
  },

  async getChatHistory(): Promise<any[]> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.CHAT_HISTORY);
      return safeJsonParse(data, []);
    } catch (error) {
      console.error('Failed to get chat history:', error);
      return [];
    }
  },

  async setStreaks(streaks: any): Promise<boolean> {
    try {
      const jsonData = safeJsonStringify(streaks);
      if (!jsonData) return false;
      await AsyncStorage.setItem(STORAGE_KEYS.STREAKS, jsonData);
      return true;
    } catch (error) {
      console.error('Failed to save streaks:', error);
      return false;
    }
  },

  async getStreaks(): Promise<any | null> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.STREAKS);
      return safeJsonParse(data, null);
    } catch (error) {
      console.error('Failed to get streaks:', error);
      return null;
    }
  },

  async clear(): Promise<boolean> {
    try {
      await AsyncStorage.clear();
      return true;
    } catch (error) {
      console.error('Failed to clear storage:', error);
      return false;
    }
  },

  async removeItem(key: keyof typeof STORAGE_KEYS): Promise<boolean> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEYS[key]);
      return true;
    } catch (error) {
      console.error(`Failed to remove item ${key}:`, error);
      return false;
    }
  },

  async setBlueprintComplete(complete: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.BLUEPRINT_COMPLETE, JSON.stringify(complete));
      return true;
    } catch (error) {
      console.error('Failed to save blueprint status:', error);
      return false;
    }
  },

  async getBlueprintComplete(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.BLUEPRINT_COMPLETE);
      return safeJsonParse(data, false);
    } catch (error) {
      console.error('Failed to get blueprint status:', error);
      return false;
    }
  },

  async setTourComplete(complete: boolean): Promise<boolean> {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.TOUR_COMPLETE, JSON.stringify(complete));
      return true;
    } catch (error) {
      console.error('Failed to save tour status:', error);
      return false;
    }
  },

  async getTourComplete(): Promise<boolean> {
    try {
      const data = await AsyncStorage.getItem(STORAGE_KEYS.TOUR_COMPLETE);
      return safeJsonParse(data, false);
    } catch (error) {
      console.error('Failed to get tour status:', error);
      return false;
    }
  },
};
