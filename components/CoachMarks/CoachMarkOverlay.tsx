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
    // Entrance animation with spring
    Animated.parallel([
      Animated.spring(slideAnim, {
        toValue: 1,
        tension: 80,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();

    // Haptic feedback
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    return () => {
      slideAnim.setValue(0);
      scaleAnim.setValue(0.85);
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
        {/* Glassmorphic Background */}
        <BlurView
          intensity={isDark ? 60 : 40}
          tint={isDark ? 'dark' : 'light'}
          style={styles.tooltipBlur}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(20, 10, 36, 0.92)', 'rgba(20, 10, 36, 0.88)']
                : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.90)']
            }
            style={[
              styles.tooltipGradient,
              {
                borderColor: isDark ? 'rgba(45, 212, 191, 0.25)' : 'rgba(20, 184, 166, 0.15)',
              },
            ]}
          >
            {/* Ultra-thin silver border accent */}
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  borderRadius: BorderRadius.xxl,
                  borderWidth: 1,
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.04)',
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

              {/* Next Button */}
              <PressableScale onPress={onNext} scaleValue={0.96}>
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
                  <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
                </LinearGradient>
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

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.15,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        styles.spotlightGlow,
        {
          width: size,
          height: size,
          transform: [{ scale: pulseAnim }],
        },
      ]}
    >
      <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <Defs>
          <SvgRadialGradient id="spotlightGrad" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.4" />
            <Stop offset="50%" stopColor="#2DD4BF" stopOpacity="0.15" />
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
          totalSteps={9}
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
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 60,
        friction: 10,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
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
                Welcome to Grit!
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
                Take a quick 30-second tour to discover how Grit helps you save smarter, not harder.
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
    borderWidth: 1,
    overflow: 'hidden',
  },
  tooltipContent: {
    padding: Spacing.xl,
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
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.round,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md + 2,
    borderRadius: BorderRadius.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.35,
        shadowRadius: 12,
      },
      android: { elevation: 6 },
    }),
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
    padding: Spacing.xxl,
    alignItems: 'center',
  },
  welcomeIcon: {
    width: 80,
    height: 80,
    marginBottom: Spacing.lg,
    borderRadius: 40,
  },
  welcomeIconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  welcomeEmoji: {
    fontSize: 36,
  },
  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.lg,
    borderRadius: BorderRadius.xxl,
    ...Platform.select({
      ios: {
        shadowColor: '#14B8A6',
        shadowOffset: { width: 0, height: 6 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
      },
      android: { elevation: 8 },
    }),
  },
});
