import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Purchases, { CustomerInfo, PurchasesPackage } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import { useAuth } from './AuthContext';

interface SubscriptionContextType {
  isPremium: boolean;
  isLoading: boolean;
  packages: PurchasesPackage[];
  restorePurchases: () => Promise<CustomerInfo | null>;
  purchasePackage: (pack: PurchasesPackage) => Promise<void>;
  showPaywall: () => void;
  hidePaywall: () => void;
  isPaywallVisible: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const API_KEYS = {
  ios: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_IOS || 'appl_placeholder',
  android: process.env.EXPO_PUBLIC_REVENUECAT_API_KEY_ANDROID || 'goog_placeholder',
};

const PAYWALL_SHOWN_KEY = '@grit_paywall_shown_after_onboarding';
const ENTITLEMENT_ID = 'premium'; // Ensure this matches your RevenueCat Entitlement ID

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [isPremium, setIsPremium] = useState(false);
  const [packages, setPackages] = useState<PurchasesPackage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  const { user, isAuthenticated } = useAuth();

  useEffect(() => {
    initializePurchases();
  }, []);

  // Sync Identity with RevenueCat
  useEffect(() => {
    const syncIdentity = async () => {
      try {
        if (isAuthenticated && user?.id) {
          // Identify user in RevenueCat
          await Purchases.logIn(user.id);
          // console.log('[RevenueCat] Identified user:', user.id);
        } else if (!isAuthenticated) {
          // Reset to anonymous ID
          await Purchases.logOut();
          // console.log('[RevenueCat] Logged out user');
        }

        // Refresh customer info after identity change
        const customerInfo = await Purchases.getCustomerInfo();
        updateCustomerStatus(customerInfo);
      } catch (e) {
        console.error('[RevenueCat] Identity sync failed:', e);
      }
    };

    if (!isLoading) {
      syncIdentity();
    }
  }, [isAuthenticated, user?.id, isLoading]);

  const initializePurchases = async () => {
    try {
      if (Platform.OS === 'ios') {
        Purchases.configure({ apiKey: API_KEYS.ios });
      } else if (Platform.OS === 'android') {
        Purchases.configure({ apiKey: API_KEYS.android });
      }

      const customerInfo = await Purchases.getCustomerInfo();
      updateCustomerStatus(customerInfo);
      await loadOfferings();
    } catch (error) {
      console.error('[RevenueCat] Initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadOfferings = async () => {
    try {
      const offerings = await Purchases.getOfferings();
      if (offerings.current && offerings.current.availablePackages.length > 0) {
        setPackages(offerings.current.availablePackages);
      }
    } catch (error) {
      console.error('[RevenueCat] Failed to load offerings:', error);
    }
  };

  const updateCustomerStatus = (customerInfo: CustomerInfo) => {
    const isPro = customerInfo.entitlements.active[ENTITLEMENT_ID] !== undefined;
    setIsPremium(isPro);
  };

  const restorePurchases = async () => {
    try {
      const customerInfo = await Purchases.restorePurchases();
      updateCustomerStatus(customerInfo);
      return customerInfo;
    } catch (error) {
      console.error('[RevenueCat] Restore failed:', error);
      return null;
    }
  };

  const purchasePackage = async (pack: PurchasesPackage) => {
    try {
      const { customerInfo } = await Purchases.purchasePackage(pack);
      updateCustomerStatus(customerInfo);
      setIsPaywallVisible(false);
    } catch (error: any) {
      if (!error.userCancelled) {
        console.error('[RevenueCat] Purchase failed:', error);
        throw error;
      }
    }
  };

  const showPaywall = () => setIsPaywallVisible(true);
  const hidePaywall = () => setIsPaywallVisible(false);

  // Check if paywall should be shown after onboarding tour completion
  useEffect(() => {
    const checkAndShowPaywall = async () => {
      if (!isLoading && packages.length > 0 && !isPremium) {
        const shouldShow = await shouldShowPaywallAfterOnboarding();
        if (shouldShow) {
          setTimeout(() => {
            setIsPaywallVisible(true);
          }, 1500);
        }
      }
    };

    checkAndShowPaywall();
  }, [isLoading, packages, isPremium]);

  return (
    <SubscriptionContext.Provider
      value={{
        isPremium,
        isLoading,
        packages,
        restorePurchases,
        purchasePackage,
        showPaywall,
        hidePaywall,
        isPaywallVisible,
      }}
    >
      {children}
    </SubscriptionContext.Provider>
  );
}

export function useSubscription() {
  const context = useContext(SubscriptionContext);
  if (!context) {
    throw new Error('useSubscription must be used within SubscriptionProvider');
  }
  return context;
}

export async function shouldShowPaywallAfterOnboarding(): Promise<boolean> {
  try {
    const shown = await AsyncStorage.getItem(PAYWALL_SHOWN_KEY);
    return shown !== 'true';
  } catch {
    return true;
  }
}

export async function markPaywallShownAfterOnboarding(): Promise<void> {
  try {
    await AsyncStorage.setItem(PAYWALL_SHOWN_KEY, 'true');
  } catch (error) {
    console.error('Failed to mark paywall as shown:', error);
  }
}
