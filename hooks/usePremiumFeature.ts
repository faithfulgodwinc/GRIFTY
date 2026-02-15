import { useSubscription } from '@/contexts/SubscriptionContext';
import * as Haptics from 'expo-haptics';

import { Alert } from 'react-native';

/**
 * Hook to gate premium features
 *
 * @example
 * ```tsx
 * const { isPremium, requirePremium } = usePremiumFeature();
 *
 * const handlePremiumAction = () => {
 *   if (!requirePremium()) return;
 *   // Execute premium feature
 * };
 * ```
 */
export function usePremiumFeature() {
  const { isPremium, showPaywall, packages, isLoading } = useSubscription();

  /**
   * Check if user has premium access, show paywall if not
   * @returns true if user has premium access, false otherwise
   */
  const requirePremium = (): boolean => {
    if (isPremium) {
      return true;
    }

    if (isLoading) {
      Alert.alert('Please wait', 'Loading premium features...');
      return false;
    }

    if (packages.length === 0) {
      Alert.alert(
        'Connection Error',
        'Unable to load premium features. Please check your internet connection.'
      );
      return false;
    }

    // Show paywall with haptic feedback
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    showPaywall();
    return false;
  };

  return {
    isPremium,
    requirePremium,
    showPaywall,
  };
}
