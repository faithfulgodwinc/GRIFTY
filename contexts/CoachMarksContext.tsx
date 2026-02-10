import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@fastshot/auth';
import { router } from 'expo-router';

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
    title: 'Your Daily Power Number 💰',
    description: 'This is YOUR number—what you can spend guilt-free today! Calculated from your income and goals. Stay under it, build momentum, and watch your savings grow!',
    position: 'top',
    spotlightSize: 380,
  },
  {
    id: 'home-momentum-streak',
    screen: 'home',
    targetId: 'momentum-streak-card',
    title: 'Build Your Winning Streak 🔥',
    description: 'Every day you stay under budget, you\'re leveling up! Stack these wins to unlock achievements and build unstoppable financial confidence.',
    position: 'center',
    spotlightSize: 360,
  },
  {
    id: 'home-quick-log',
    screen: 'home',
    targetId: 'quick-log-section',
    title: 'Track in 2 Seconds Flat ⚡',
    description: 'Busy mom? No problem! One tap to log expenses—no typing, no hassle. Track your spending faster than ordering coffee.',
    position: 'bottom',
    spotlightSize: 340,
  },

  // SAVINGS SCREEN STEPS
  {
    id: 'savings-wins',
    screen: 'savings',
    targetId: 'savings-wins-section',
    title: 'Celebrate Every Win 🏆',
    description: 'Got a discount? Resisted impulse buying? Log it here! Big or small, every smart money move deserves recognition. You\'re crushing it!',
    position: 'top',
    spotlightSize: 360,
  },
  {
    id: 'savings-mom-tips',
    screen: 'savings',
    targetId: 'mom-tips-carousel',
    title: 'Real Mom Money Hacks 💡',
    description: 'Tested-and-approved tips from moms who GET IT. Swipe through for practical, no-BS strategies that actually work in real life.',
    position: 'center',
    spotlightSize: 340,
  },

  // INVEST SCREEN STEPS
  {
    id: 'invest-power',
    screen: 'invest',
    targetId: 'investment-power-card',
    title: 'Your Future, Amplified 💪',
    description: 'See how your savings translate to real wealth! These aren\'t fantasies—they\'re projections based on YOUR actual progress. Keep saving, keep growing!',
    position: 'top',
    spotlightSize: 360,
  },
  {
    id: 'invest-market-pulse',
    screen: 'invest',
    targetId: 'market-pulse-section',
    title: 'Stay Market-Smart 📈',
    description: 'Live market insights to empower your decisions. You don\'t need to be a Wall Street pro—just informed, confident, and ready to grow your wealth!',
    position: 'center',
    spotlightSize: 340,
  },

  // BACK TO HOME - FLOATING COACH
  {
    id: 'home-floating-coach',
    screen: 'home',
    targetId: 'floating-coach-icon',
    title: 'Your AI Money Concierge 💬',
    description: 'Meet your 24/7 financial bestie! Tap this floating button anytime for instant advice, budgeting tips, and personalized guidance. We\'ve got your back!',
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
  const checkTourStatus = useCallback(async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('has_completed_tour')
        .eq('id', user.id)
        .single();

      if (error) throw error;

      const completed = data?.has_completed_tour ?? false;
      setHasCompletedTour(completed);

      // Auto-start tour if not completed
      if (!completed) {
        // Delay to let the app fully load
        setTimeout(() => {
          startTour();
        }, 1500);
      }
    } catch (error) {
      console.error('Failed to check tour status:', error);
    }
  }, [user?.id]);

  // ─── Start Tour ────────────────────────────────────────────────────────────
  const startTour = useCallback(async () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setCurrentStepIndex(0);
    setVisitedScreens(new Set());
    setIsTourActive(true);
  }, []);

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

    // Mark as completed in Supabase
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ has_completed_tour: true })
          .eq('id', user.id);

        setHasCompletedTour(true);
      } catch (error) {
        console.error('Failed to mark tour as skipped:', error);
      }
    }
  }, [user?.id]);

  // ─── Complete Tour ─────────────────────────────────────────────────────────
  const completeTour = useCallback(async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setIsTourActive(false);
    setCurrentStepIndex(0);

    // Mark as completed in Supabase
    if (user?.id) {
      try {
        await supabase
          .from('profiles')
          .update({ has_completed_tour: true })
          .eq('id', user.id);

        setHasCompletedTour(true);
      } catch (error) {
        console.error('Failed to mark tour as completed:', error);
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
