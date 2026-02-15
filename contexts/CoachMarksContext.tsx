import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { router } from 'expo-router';
import { shouldShowPaywallAfterOnboarding, markPaywallShownAfterOnboarding } from './SubscriptionContext';
import { storage } from '@/utils/storage';

export interface TourStep {
  id: string;
  screen: 'home' | 'savings' | 'invest';
  targetId: string;
  title: string;
  description: string;
  position: 'top' | 'bottom' | 'center';
  spotlightSize?: number;
}

interface CoachMarksContextType {
  isTourActive: boolean;
  currentStepIndex: number;
  currentStep: TourStep | null;
  startTour: () => Promise<void>;
  nextStep: () => void;
  skipTour: () => Promise<void>;
  completeTour: () => Promise<void>;
  hasCompletedTour: boolean;
  checkTourStatus: () => Promise<void>;
}

const CoachMarksContext = createContext<CoachMarksContextType | undefined>(undefined);

// ─── Tour Steps Configuration ────────────────────────────────────────────────
export const TOUR_STEPS: TourStep[] = [
  // HOME SCREEN STEPS
  {
    id: 'home-spendable-today',
    screen: 'home',
    targetId: 'spendable-today-card',
    title: 'Your Daily Power Number',
    description: 'Your guilt-free spending limit for today. Stay under it to build momentum and savings!',
    position: 'top',
    spotlightSize: 380,
  },
  {
    id: 'home-momentum-streak',
    screen: 'home',
    targetId: 'momentum-streak-card',
    title: 'Build Your Winning Streak',
    description: 'Stay under budget to level up! Stack daily wins to build unstoppable financial confidence.',
    position: 'center',
    spotlightSize: 360,
  },
  {
    id: 'home-quick-log',
    screen: 'home',
    targetId: 'quick-log-section',
    title: 'Track in 2 Seconds Flat',
    description: 'One tap to log expenses. No typing, no hassle—tracking faster than ordering coffee.',
    position: 'bottom',
    spotlightSize: 340,
  },

  // SAVINGS SCREEN STEPS
  {
    id: 'savings-wins',
    screen: 'savings',
    targetId: 'savings-wins-section',
    title: 'Celebrate Every Win',
    description: 'Got a discount? Resisted impulse buying? Log it here! Every smart move deserves recognition.',
    position: 'top',
    spotlightSize: 360,
  },
  {
    id: 'savings-mom-tips',
    screen: 'savings',
    targetId: 'mom-tips-carousel',
    title: 'Real Mom Money Hacks',
    description: 'Tested strategies from moms who GET IT. Swipe for practical, real-life money hacks.',
    position: 'center',
    spotlightSize: 340,
  },

  // INVEST SCREEN STEPS
  {
    id: 'invest-power',
    screen: 'invest',
    targetId: 'investment-power-card',
    title: 'Your Future, Amplified',
    description: 'See how your savings turn into real wealth! These are projections based on YOUR progress.',
    position: 'top',
    spotlightSize: 360,
  },
  {
    id: 'invest-market-pulse',
    screen: 'invest',
    targetId: 'market-pulse-section',
    title: 'Stay Market-Smart',
    description: 'Live insights to empower your decisions. You don\'t need to be a pro—just informed and ready to grow!',
    position: 'center',
    spotlightSize: 340,
  },

  // BACK TO HOME - FLOATING COACH
  {
    id: 'home-floating-coach',
    screen: 'home',
    targetId: 'floating-coach-icon',
    title: 'Your AI Money Concierge',
    description: 'Your 24/7 financial bestie! Tap for instant advice, budgeting tips, and personalized guidance.',
    position: 'bottom',
    spotlightSize: 200,
  },
];

interface CoachMarksProviderProps {
  children: ReactNode;
}

export function CoachMarksProvider({ children }: CoachMarksProviderProps) {
  const { user } = useAuth();
  const [isTourActive, setIsTourActive] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [hasCompletedTour, setHasCompletedTour] = useState(false);
  const [visitedScreens, setVisitedScreens] = useState<Set<string>>(new Set());

  const currentStep = TOUR_STEPS[currentStepIndex] || null;

  // ─── Check Tour Status ─────────────────────────────────────────────────────
  // ─── Start Tour ────────────────────────────────────────────────────────────
  const startTour = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStepIndex(0);
    setVisitedScreens(new Set());
    setIsTourActive(true);
  }, []);

  // ─── Check Tour Status ─────────────────────────────────────────────────────
  const checkTourStatus = useCallback(async () => {
    if (!user?.id) return;

    // Check local storage first (fastest)
    const localCompleted = await storage.getTourComplete();
    if (localCompleted) {
      setHasCompletedTour(true);
      return;
    }

    try {
      // Try fetching from Supabase, but handle missing column gracefully
      const { data, error } = await supabase
        .from('user_profiles')
        .select('has_completed_tour')
        .eq('id', user.id)
        .maybeSingle(); // Use maybeSingle to avoid 406/PGRST116 if row missing

      if (error) {
        // Ignore specific error for missing column "has_completed_tour" (42703)
        if (error.code !== '42703') {
          console.warn('Supabase tour check failed (non-critical):', error.message);
        }
      } else if (data?.has_completed_tour) {
        setHasCompletedTour(true);
        await storage.setTourComplete(true); // Sync back to local
        return;
      }

      // If we got here, tour is NOT complete locally or remotely
      // Delay to let the app fully load
      setTimeout(() => {
        startTour();
      }, 1500);

    } catch (error) {
      console.warn('Failed to check tour status (fallback to local):', error);
      // Fallback to start tour if uncertain
      setTimeout(() => {
        startTour();
      }, 1500);
    }
  }, [user?.id, startTour]);



  // ─── Next Step ─────────────────────────────────────────────────────────────
  const nextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStepIndex < TOUR_STEPS.length - 1) {
      const nextStepIndex = currentStepIndex + 1;
      const nextStepData = TOUR_STEPS[nextStepIndex];
      const currentStepData = TOUR_STEPS[currentStepIndex];

      // Track visited screen
      setVisitedScreens((prev) => new Set(prev).add(currentStepData.screen));

      // Check if we need to navigate to a different screen
      if (nextStepData.screen !== currentStepData.screen) {
        // Temporarily hide the tour overlay during navigation
        setIsTourActive(false);

        // Navigate to the appropriate tab with smooth animation timing
        setTimeout(() => {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

          if (nextStepData.screen === 'home') {
            router.replace('/(tabs)');
          } else if (nextStepData.screen === 'savings') {
            router.replace('/(tabs)/savings');
          } else if (nextStepData.screen === 'invest') {
            router.replace('/(tabs)/invest');
          }

          // Re-show the tour overlay after navigation completes
          setTimeout(() => {
            setCurrentStepIndex(nextStepIndex);
            setIsTourActive(true);
          }, 400);
        }, 300);
      } else {
        // Same screen, just advance to next step
        setCurrentStepIndex(nextStepIndex);
      }
    } else {
      // Track final screen visit
      const currentStepData = TOUR_STEPS[currentStepIndex];
      setVisitedScreens((prev) => new Set(prev).add(currentStepData.screen));

      // Tour completed - trigger celebration
      completeTour();
    }
  }, [currentStepIndex, visitedScreens]);

  // ─── Skip Tour ─────────────────────────────────────────────────────────────
  const skipTour = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
    setIsTourActive(false);
    setCurrentStepIndex(0);
    setHasCompletedTour(true);

    // Save locally
    await storage.setTourComplete(true);

    // Mark as completed in Supabase (best effort)
    if (user?.id) {
      try {
        await supabase
          .from('user_profiles')
          .update({ has_completed_tour: true })
          .eq('id', user.id);
      } catch (error) {
        // Silently fail if column doesn't exist
        console.warn('Failed to sync tour skip to Supabase (ignored):', error);
      }
    }
  }, [user?.id]);

  // ─── Complete Tour ─────────────────────────────────────────────────────────
  const completeTour = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsTourActive(false);
    setCurrentStepIndex(0);
    setHasCompletedTour(true);

    // Save locally
    await storage.setTourComplete(true);

    // Mark as completed in Supabase (best effort)
    if (user?.id) {
      try {
        await supabase
          .from('user_profiles')
          .update({ has_completed_tour: true })
          .eq('id', user.id);
      } catch (error) {
        console.warn('Failed to sync tour completion to Supabase (ignored):', error);
      }

      // Show paywall as "Grand Finale" if not shown yet
      try {
        const shouldShow = await shouldShowPaywallAfterOnboarding();
        if (shouldShow) {
          await markPaywallShownAfterOnboarding();
        }
      } catch (e) {
        console.warn('Failed to check paywall status:', e);
      }
    }
  }, [user?.id]);

  return (
    <CoachMarksContext.Provider
      value={{
        isTourActive,
        currentStepIndex,
        currentStep,
        startTour,
        nextStep,
        skipTour,
        completeTour,
        hasCompletedTour,
        checkTourStatus,
      }}
    >
      {children}
    </CoachMarksContext.Provider>
  );
}

export function useCoachMarks() {
  const context = useContext(CoachMarksContext);
  if (context === undefined) {
    throw new Error('useCoachMarks must be used within a CoachMarksProvider');
  }
  return context;
}
