import React from 'react';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { GritElitePaywall } from './GritElitePaywall';

export function GlobalPaywallWrapper() {
  const { isPaywallVisible, packages, hidePaywall } = useSubscription();

  const handleSuccess = () => {
    hidePaywall();
  };

  if (!isPaywallVisible || packages.length === 0) {
    return null;
  }

  return (
    <GritElitePaywall
      visible={isPaywallVisible}
      packages={packages}
      onSuccess={handleSuccess}
      onClose={hidePaywall}
    />
  );
}
