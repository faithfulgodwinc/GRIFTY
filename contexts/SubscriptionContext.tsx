import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { adapty, shouldEnableMock } from 'react-native-adapty';
import type { AdaptyProfile, AdaptyPaywall } from 'react-native-adapty';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface SubscriptionContextType {
  profile: AdaptyProfile | null;
  isPremium: boolean;
  isLoading: boolean;
  paywall: AdaptyPaywall | null;
  refreshProfile: () => Promise<void>;
  showPaywall: () => void;
  hidePaywall: () => void;
  isPaywallVisible: boolean;
}

const SubscriptionContext = createContext<SubscriptionContextType | undefined>(undefined);

const ADAPTY_API_KEY = process.env.EXPO_PUBLIC_ADAPTY_API_KEY || 'mock_key';
const PLACEMENT_ID = process.env.EXPO_PUBLIC_ADAPTY_PLACEMENT_ID || 'default';
const PAYWALL_SHOWN_KEY = '@grit_paywall_shown_after_onboarding';

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<AdaptyProfile | null>(null);
  const [paywall, setPaywall] = useState<AdaptyPaywall | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPaywallVisible, setIsPaywallVisible] = useState(false);

  const isMockMode = shouldEnableMock();

  useEffect(() => {
    initializeAdapty();
  }, []);

  const initializeAdapty = async () => {
    try {
      console.log('[Adapty] Initializing...', { isMockMode });

      await adapty.activate(ADAPTY_API_KEY, {
        __ignoreActivationOnFastRefresh: __DEV__,
      });

      // Load profile and paywall
      await refreshProfile();
      await loadPaywall();
    } catch (error) {
      console.error('[Adapty] Initialization failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadPaywall = async () => {
    try {
      const paywallData = await adapty.getPaywall(PLACEMENT_ID);
      setPaywall(paywallData);
      console.log('[Adapty] Paywall loaded');
    } catch (error) {
      console.error('[Adapty] Failed to load paywall:', error);
    }
  };

  const refreshProfile = async () => {
    try {
      const profileData = await adapty.getProfile();
      setProfile(profileData);
      console.log('[Adapty] Profile refreshed', {
        isPremium: profileData?.accessLevels?.['premium']?.isActive ?? false,
      });
    } catch (error) {
      console.error('[Adapty] Failed to refresh profile:', error);
    }
  };

  const showPaywall = () => {
    setIsPaywallVisible(true);
  };

  const hidePaywall = () => {
    setIsPaywallVisible(false);
  };

  const isPremium = profile?.accessLevels?.['premium']?.isActive ?? false;

  // Check if paywall should be shown after onboarding tour completion
  useEffect(() => {
    const checkAndShowPaywall = async () => {
      if (!isLoading && paywall && !isPremium) {
        const shouldShow = await shouldShowPaywallAfterOnboarding();
        if (shouldShow) {
          // Small delay to let the user settle on the home screen
          setTimeout(() => {
            setIsPaywallVisible(true);
          }, 1500);
        }
      }
    };

    checkAndShowPaywall();
  }, [isLoading, paywall, isPremium]);

  return (
    <SubscriptionContext.Provider
      value={{
        profile,
        isPremium,
        isLoading,
        paywall,
        refreshProfile,
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

// Helper to check if paywall should be shown after onboarding
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
