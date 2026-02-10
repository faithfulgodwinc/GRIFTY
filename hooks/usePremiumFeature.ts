import { useSubscription } from '@/contexts/SubscriptionContext';
import * as Haptics from 'expo-haptics';

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
  const { isPremium, showPaywall } = useSubscription();

  /**
   * Check if user has premium access, show paywall if not
   * @returns true if user has premium access, false otherwise
   */
  const requirePremium = (): boolean => {
    if (isPremium) {
      return true;
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
