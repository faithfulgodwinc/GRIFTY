import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  USER_DATA: '@grit_user_data',
  EXPENSES: '@grit_expenses',
  FINANCIAL_DATA: '@grit_financial_data',
  MILESTONES: '@grit_milestones',
  ONBOARDING_COMPLETE: '@grit_onboarding_complete',
};

export const storage = {
  async setUserData(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.USER_DATA, JSON.stringify(data));
  },

  async getUserData() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.USER_DATA);
    return data ? JSON.parse(data) : null;
  },

  async setExpenses(expenses: any[]) {
    await AsyncStorage.setItem(STORAGE_KEYS.EXPENSES, JSON.stringify(expenses));
  },

  async getExpenses() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.EXPENSES);
    return data ? JSON.parse(data) : [];
  },

  async setFinancialData(data: any) {
    await AsyncStorage.setItem(STORAGE_KEYS.FINANCIAL_DATA, JSON.stringify(data));
  },

  async getFinancialData() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.FINANCIAL_DATA);
    return data ? JSON.parse(data) : null;
  },

  async setOnboardingComplete(complete: boolean) {
    await AsyncStorage.setItem(STORAGE_KEYS.ONBOARDING_COMPLETE, JSON.stringify(complete));
  },

  async getOnboardingComplete() {
    const data = await AsyncStorage.getItem(STORAGE_KEYS.ONBOARDING_COMPLETE);
    return data ? JSON.parse(data) : false;
  },

  async clear() {
    await AsyncStorage.clear();
  },
};
