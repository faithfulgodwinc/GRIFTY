import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  Modal,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { getThemeColors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { PressableScale } from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { useCoachMarks, TourStep } from '@/contexts/CoachMarksContext';
import * as Haptics from 'expo-haptics';
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface TooltipProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
}

function GlassmorphicTooltip({ step, currentIndex, totalSteps, onNext, onSkip }: TooltipProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.85)).current;

  useEffect(() => {
    // Smoother entrance animation with refined spring parameters
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 65,
        friction: 12,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 10,
        useNativeDriver: true,
      }),
    ]).start();

    // Refined haptic feedback - lighter and more elegant
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    return () => {
      // Smooth exit animation
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.85,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }, [step.id]);

  const translateY = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [step.position === 'top' ? -50 : 50, 0],
  });

  // Position tooltip based on step position
  const tooltipStyle =
    step.position === 'top'
      ? { bottom: SCREEN_HEIGHT * 0.25 }
      : step.position === 'bottom'
        ? { top: SCREEN_HEIGHT * 0.55 }
        : { top: SCREEN_HEIGHT * 0.45 };

  return (
    <Animated.View
      style={[
        styles.tooltipContainer,
        tooltipStyle,
        {
          transform: [{ translateY }, { scale: scaleAnim }],
        },
      ]}
    >
      <View
        style={[
          styles.tooltipOuter,
          {
            shadowColor: isDark ? Colors.electricTeal : '#000000',
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: isDark ? 0.35 : 0.15,
            shadowRadius: 24,
            elevation: 12,
          },
        ]}
      >
        {/* Enhanced Glassmorphic Background */}
        <BlurView
          intensity={isDark ? 70 : 50}
          tint={isDark ? 'dark' : 'light'}
          style={styles.tooltipBlur}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(20, 10, 36, 0.96)', 'rgba(20, 10, 36, 0.94)']
                : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.94)']
            }
            style={[
              styles.tooltipGradient,
              {
                borderColor: isDark ? 'rgba(45, 212, 191, 0.3)' : 'rgba(20, 184, 166, 0.2)',
              },
            ]}
          >
            {/* Enhanced border accent with subtle inner glow */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: BorderRadius.xxl,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.06)',
                  pointerEvents: 'none',
                },
              ]}
            />

            {/* Content */}
            <View style={styles.tooltipContent}>
              {/* Header Row */}
              <View style={styles.tooltipHeader}>
                <View
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor: isDark
                        ? 'rgba(45, 212, 191, 0.15)'
                        : 'rgba(20, 184, 166, 0.1)',
                    },
                  ]}
                >
                  <Text
                    style={[
                      Typography.labelSmall,
                      {
                        color: Colors.electricTeal,
                        fontWeight: '700',
                        letterSpacing: 0.8,
                      },
                    ]}
                  >
                    {currentIndex + 1} / {totalSteps}
                  </Text>
                </View>
                <PressableScale onPress={onSkip} scaleValue={0.88}>
                  <View
                    style={[
                      styles.skipButton,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.06)'
                          : 'rgba(0, 0, 0, 0.04)',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        Typography.labelMedium,
                        {
                          color: Colors.silverGrey,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Skip Tour
                    </Text>
                  </View>
                </PressableScale>
              </View>

              {/* Title */}
              <Text
                style={[
                  Typography.headlineSmall,
                  {
                    color: Colors.primaryText,
                    marginTop: Spacing.md,
                    marginBottom: Spacing.sm,
                  },
                ]}
              >
                {step.title}
              </Text>

              {/* Description */}
              <Text
                style={[
                  Typography.bodyMedium,
                  {
                    color: Colors.secondaryText,
                    lineHeight: 22,
                    marginBottom: Spacing.lg,
                  },
                ]}
              >
                {step.description}
              </Text>

              {/* Premium Next Button */}
              <PressableScale onPress={onNext} scaleValue={0.97}>
                <View
                  style={[
                    styles.nextButtonContainer,
                    {
                      shadowColor: Colors.electricTeal,
                      shadowOffset: { width: 0, height: 6 },
                      shadowOpacity: 0.4,
                      shadowRadius: 16,
                      elevation: 8,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.glowingGreen]}
                    style={styles.nextButton}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text
                      style={[
                        Typography.titleMedium,
                        {
                          color: '#FFFFFF',
                          fontWeight: '700',
                        },
                      ]}
                    >
                      {currentIndex === totalSteps - 1 ? 'Finish Tour' : 'Next'}
                    </Text>
                    <Ionicons name="arrow-forward" size={19} color="#FFFFFF" />
                  </LinearGradient>
                </View>
              </PressableScale>
            </View>
          </LinearGradient>
        </BlurView>
      </View>
    </Animated.View>
  );
}

// ─── Pulsing Spotlight Component ────────────────────────────────────────────
function SpotlightGlow({ size }: { size: number }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    // Smoother, more subtle pulse animation
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.08,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    // Gentle opacity pulse for a breathing effect
    const opacityPulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacityAnim, {
          toValue: 0.85,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0.6,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );

    pulse.start();
    opacityPulse.start();
    return () => {
      pulse.stop();
      opacityPulse.stop();
    };
  }, [pulseAnim, opacityAnim]);

  return (
    <Animated.View
      style={[
        styles.spotlightGlow,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
          opacity: opacityAnim,
        },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgRadialGradient id="spotlightGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.5" />
            <Stop offset="40%" stopColor="#2DD4BF" stopOpacity="0.25" />
            <Stop offset="70%" stopColor="#2DD4BF" stopOpacity="0.1" />
            <Stop offset="100%" stopColor="#2DD4BF" stopOpacity="0" />
          </SvgRadialGradient>
        </Defs>
        <Circle cx={size / 2} cy={size / 2} r={size / 2} fill="url(#spotlightGrad)" />
      </Svg>
    </Animated.View>
  );
}

// ─── Main Overlay Component ─────────────────────────────────────────────────
export function CoachMarkOverlay() {
  const { theme } = useTheme();
  const { isTourActive, currentStep, currentStepIndex, nextStep, skipTour } = useCoachMarks();
  const [showWelcome, setShowWelcome] = useState(true);
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (isTourActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isTourActive]);

  if (!isTourActive || !currentStep) return null;

  // Show welcome modal on first step
  if (currentStepIndex === 0 && showWelcome) {
    return (
      <WelcomeModal
        onStart={() => {
          setShowWelcome(false);
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        }}
        onSkip={() => {
          setShowWelcome(false);
          skipTour();
        }}
      />
    );
  }

  const spotlightSize = currentStep.spotlightSize || 360;

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Dimmed Background */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.85)' : 'rgba(0, 0, 0, 0.7)',
            },
          ]}
        />

        {/* Spotlight Glow */}
        <View style={styles.spotlightContainer}>
          <SpotlightGlow size={spotlightSize} />
        </View>

        {/* Tooltip */}
        <GlassmorphicTooltip
          step={currentStep}
          currentIndex={currentStepIndex}
          totalSteps={8}
          onNext={nextStep}
          onSkip={skipTour}
        />
      </Animated.View>
    </Modal>
  );
}

// ─── Welcome Modal ──────────────────────────────────────────────────────────
function WelcomeModal({ onStart, onSkip }: { onStart: () => void; onSkip: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Refined entrance animation for welcome modal
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 11,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
    ]).start();

    // Subtle haptic feedback
    setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }, 100);
  }, []);

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.welcomeOverlay}>
        <View
          style={[
            StyleSheet.absoluteFill,
            { backgroundColor: isDark ? 'rgba(0, 0, 0, 0.9)' : 'rgba(0, 0, 0, 0.75)' },
          ]}
        />

        <Animated.View
          style={[
            styles.welcomeModal,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 70 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={styles.welcomeBlur}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(20, 10, 36, 0.95)', 'rgba(20, 10, 36, 0.92)']
                  : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']
              }
              style={[
                styles.welcomeContent,
                {
                  borderColor: isDark
                    ? 'rgba(45, 212, 191, 0.3)'
                    : 'rgba(20, 184, 166, 0.2)',
                },
              ]}
            >
              {/* Sparkle Icon */}
              <View
                style={[
                  styles.welcomeIcon,
                  {
                    shadowColor: Colors.electricTeal,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 16,
                    elevation: 8,
                  },
                ]}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.amethyst]}
                  style={styles.welcomeIconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  <Text style={styles.welcomeEmoji}>✨</Text>
                </LinearGradient>
              </View>

              {/* Title */}
              <Text
                style={[
                  Typography.displaySmall,
                  {
                    color: Colors.primaryText,
                    textAlign: 'center',
                    marginBottom: Spacing.sm,
                  },
                ]}
              >
                Ready to Level Up?
              </Text>

              {/* Description */}
              <Text
                style={[
                  Typography.bodyLarge,
                  {
                    color: Colors.secondaryText,
                    textAlign: 'center',
                    lineHeight: 24,
                    marginBottom: Spacing.xl,
                  },
                ]}
              >
                Take a quick 30-second tour through your new financial command center. We'll show you how to save smarter, build wealth faster, and stay in control—all while juggling everything else!
              </Text>

              {/* Start Button */}
              <PressableScale onPress={onStart} scaleValue={0.96} style={{ width: '100%' }}>
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.welcomeButton}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text
                    style={[
                      Typography.titleLarge,
                      {
                        color: '#FFFFFF',
                        fontWeight: '700',
                      },
                    ]}
                  >
                    Start Tour
                  </Text>
                  <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
                </LinearGradient>
              </PressableScale>

              {/* Skip Link */}
              <PressableScale onPress={onSkip} scaleValue={0.92} style={{ marginTop: Spacing.md }}>
                <Text
                  style={[
                    Typography.bodyMedium,
                    {
                      color: Colors.silverGrey,
                      textAlign: 'center',
                    },
                  ]}
                >
                  Skip for now
                </Text>
              </PressableScale>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  // ─── Overlay ───────────────────────────────────────────────────────────────
  overlay: {
    flex: 1,
    position: 'relative',
  },
  spotlightContainer: {
    position: 'absolute',
    top: SCREEN_HEIGHT * 0.25,
    left: SCREEN_WIDTH / 2 - 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  spotlightGlow: {
    position: 'absolute',
  },

  // ─── Tooltip ───────────────────────────────────────────────────────────────
  tooltipContainer: {
    position: 'absolute',
    left: Spacing.lg,
    right: Spacing.lg,
  },
  tooltipOuter: {
    borderRadius: BorderRadius.xxl + 4,
    overflow: 'hidden',
  },
  tooltipBlur: {
    borderRadius: BorderRadius.xxl + 4,
    overflow: 'hidden',
  },
  tooltipGradient: {
    borderRadius: BorderRadius.xxl + 4,
    borderWidth: 1.5,
    overflow: 'hidden',
  },
  tooltipContent: {
    padding: Spacing.xl + 4,
    paddingBottom: Spacing.xl,
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  stepBadge: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  skipButton: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 1,
    borderRadius: BorderRadius.round,
  },
  nextButtonContainer: {
    borderRadius: BorderRadius.xxl,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: Spacing.md + 4,
    borderRadius: BorderRadius.xxl,
  },

  // ─── Welcome Modal ─────────────────────────────────────────────────────────
  welcomeOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  welcomeModal: {
    width: '100%',
    maxWidth: 400,
  },
  welcomeBlur: {
    borderRadius: BorderRadius.xxl + 8,
    overflow: 'hidden',
  },
  welcomeContent: {
    borderRadius: BorderRadius.xxl + 8,
    borderWidth: 2,
    padding: Spacing.xxl + 4,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 88,
    height: 88,
    marginBottom: Spacing.lg + 4,
    borderRadius: 44,
  },
  welcomeIconGradient: {
    width: 88,
    height: 88,
    borderRadius: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 40,
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: Spacing.lg + 2,
    borderRadius: BorderRadius.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.45,
        shadowRadius: 20,
      },
      android: { elevation: 10 },
    }),
  },
});
