import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { GritifyElitePaywall } from './GritifyElitePaywall';

export function GlobalPaywallWrapper() {
  const { isPaywallVisible, paywall, hidePaywall, refreshProfile } = useSubscription();

  const handleSuccess = async (profile: any) => {
    await refreshProfile();
    hidePaywall();
  };

  if (!paywall || !isPaywallVisible) {
    return null;
  }

  return (
    <GritifyElitePaywall
      visible={isPaywallVisible}
      paywall={paywall}
      onSuccess={handleSuccess}
      onClose={hidePaywall}
    />
  );
}
