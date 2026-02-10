import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import * as Haptics from 'expo-haptics';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@fastshot/auth';

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
    title: 'Spendable Today 💰',
    description: 'Your daily budget calculated from income, goals, and rollover. Stay under this to build momentum!',
    position: 'bottom',
    spotlightSize: 380,
  },
  {
    id: 'home-momentum-streak',
    screen: 'home',
    targetId: 'momentum-streak-card',
    title: 'Momentum Streak 🔥',
    description: 'Days in a row you\'ve stayed under budget. Keep it going to unlock milestones and rewards!',
    position: 'bottom',
    spotlightSize: 360,
  },
  {
    id: 'home-quick-log',
    screen: 'home',
    targetId: 'quick-log-section',
    title: 'Quick-Log Buttons ⚡',
    description: 'One-tap spending tracking! Log expenses instantly for your most common categories.',
    position: 'bottom',
    spotlightSize: 340,
  },
  {
    id: 'home-floating-coach',
    screen: 'home',
    targetId: 'floating-coach-icon',
    title: 'Savvy Sidekick 💬',
    description: 'Your AI financial concierge is always here! Tap this floating icon anytime for instant personalized advice, smart spending tips, and financial guidance.',
    position: 'bottom',
    spotlightSize: 200,
  },

  // SAVINGS SCREEN STEPS
  {
    id: 'savings-wins',
    screen: 'savings',
    targetId: 'savings-wins-section',
    title: 'Savings Wins 🏆',
    description: 'Track and celebrate your smart money decisions! Every pound saved is a victory worth logging.',
    position: 'bottom',
    spotlightSize: 360,
  },
  {
    id: 'savings-mom-tips',
    screen: 'savings',
    targetId: 'mom-tips-carousel',
    title: 'Mom-Tip Carousel 💡',
    description: 'Expert-curated money-saving tips from real moms. Swipe through for practical advice that works!',
    position: 'bottom',
    spotlightSize: 340,
  },

  // INVEST SCREEN STEPS
  {
    id: 'invest-power',
    screen: 'invest',
    targetId: 'investment-power-card',
    title: 'Investment Power 💪',
    description: 'Your real savings drive these projections. Every pound you save grows your investment potential!',
    position: 'bottom',
    spotlightSize: 360,
  },
  {
    id: 'invest-market-pulse',
    screen: 'invest',
    targetId: 'market-pulse-section',
    title: 'Live Market Pulse 📈',
    description: 'Real-time market data to help you make informed investment decisions. Knowledge is power!',
    position: 'bottom',
    spotlightSize: 340,
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
    setIsTourActive(true);
  }, []);

  // ─── Next Step ─────────────────────────────────────────────────────────────
  const nextStep = useCallback(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentStepIndex < TOUR_STEPS.length - 1) {
      setCurrentStepIndex((prev) => prev + 1);
    } else {
      // Tour completed
      completeTour();
    }
  }, [currentStepIndex]);

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
