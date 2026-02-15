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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Circle, Defs, RadialGradient as SvgRadialGradient, Stop, Polygon } from 'react-native-svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// ─── Position Configuration ──────────────────────────────────────────────────
interface PositionConfig {
  tooltipTop?: number;
  tooltipBottom?: number;
  beakDirection: 'up' | 'down' | 'left' | 'right';
  beakPosition: 'top' | 'bottom';
  spotlightY: number;
}

interface TooltipProps {
  step: TourStep;
  currentIndex: number;
  totalSteps: number;
  onNext: () => void;
  onSkip: () => void;
  positionConfig: PositionConfig;
}

// ─── Glassmorphic Pointer/Beak ───────────────────────────────────────────────
// ─── Animated Pointer (Hand) ────────────────────────────────────────────────
function AnimatedPointer({
  direction,
  position,
  isDark
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  position: 'top' | 'bottom';
  isDark: boolean;
}) {
  const Colors = getThemeColors(isDark);
  const bounceAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    loop.start();
    return () => loop.stop();
  }, []);

  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, position === 'top' ? -8 : 8],
  });

  const pointerStyle = position === 'top'
    ? {
      position: 'absolute' as const,
      left: SCREEN_WIDTH / 2 - 24, // Center align
      top: -40, // Float above
      transform: [{ translateY }],
      zIndex: 10,
    }
    : {
      position: 'absolute' as const,
      left: SCREEN_WIDTH / 2 - 24,
      bottom: -40, // Float below
      transform: [{ translateY }],
      zIndex: 10,
    };

  // Determine icon based on position relative to tooltip
  // If pointer is on TOP of tooltip, it should point DOWN (hand-down)
  // If pointer is on BOTTOM of tooltip, it should point UP (hand-up)
  // Rotating hand-left to point up/down is easier than finding exact match sometimes, 
  // but let's use proper rotation.

  const rotation = position === 'top' ? '-90deg' : '90deg';

  return (
    <Animated.View style={pointerStyle}>
      <View style={{ transform: [{ rotate: rotation }] }}>
        <Ionicons
          name="hand-left"
          size={40}
          color={Colors.electricTeal}
          style={{
            textShadowColor: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(255,255,255,0.5)',
            textShadowOffset: { width: 0, height: 2 },
            textShadowRadius: 4
          }}
        />
      </View>
    </Animated.View>
  );
}

// ─── Pagination Dots ─────────────────────────────────────────────────────────
function PaginationDot({
  isActive,
  isDark,
}: {
  isActive: boolean;
  isDark: boolean;
}) {
  const Colors = getThemeColors(isDark);
  const widthAnim = useRef(new Animated.Value(isActive ? 20 : 6)).current;

  useEffect(() => {
    Animated.spring(widthAnim, {
      toValue: isActive ? 20 : 6,
      tension: 50,
      friction: 8,
      useNativeDriver: false, // Width is a layout property, must use JS driver
    }).start();
  }, [isActive, widthAnim]);

  return (
    <Animated.View
      style={[
        styles.paginationDot,
        {
          backgroundColor: isActive
            ? Colors.electricTeal
            : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
          width: widthAnim,
        },
      ]}
    />
  );
}

function PaginationDots({
  currentIndex,
  totalSteps,
  isDark
}: {
  currentIndex: number;
  totalSteps: number;
  isDark: boolean;
}) {
  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => (
        <PaginationDot
          key={index}
          isActive={index === currentIndex}
          isDark={isDark}
        />
      ))}
    </View>
  );
}

function GlassmorphicTooltip({ step, currentIndex, totalSteps, onNext, onSkip, positionConfig }: TooltipProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();

  // Animated values for premium motion
  const translateY = useRef(new Animated.Value(0)).current;
  const translateX = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Reset animations
    translateY.setValue(positionConfig.beakDirection === 'down' ? -60 : 60);
    translateX.setValue(0);
    scaleAnim.setValue(0.92);
    opacityAnim.setValue(0);

    // Premium glide-in animation with spring physics that feels "weighty"
    // Using tension/friction to achieve heavy, controlled movement
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 38,        // Lower tension = more "weight" and slower movement
        friction: 14,       // Higher friction = slower, more controlled deceleration
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,        // Slightly higher for subtle spring
        friction: 13,       // Balanced friction for smooth landing
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // "Thud" haptic when card lands - feels expensive
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    });

    // No exit animation to avoid conflict with next step's entry
  }, [step.id, positionConfig]);

  // Calculate tooltip position with tab bar boundary enforcement
  const TAB_BAR_BASE_HEIGHT = 72;
  const bottomPadding = Math.max(insets.bottom, 20);
  const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_BASE_HEIGHT + bottomPadding;
  const MIN_BOTTOM_CLEARANCE = TAB_BAR_TOTAL_HEIGHT + 20; // Tab bar + extra margin

  // Calculate available height for tooltip to prevent overflow
  const maxTooltipHeight = SCREEN_HEIGHT - insets.top - TAB_BAR_TOTAL_HEIGHT - 60; // 60px total margins

  const tooltipStyle = positionConfig.tooltipTop !== undefined
    ? {
      top: Math.max(positionConfig.tooltipTop, insets.top + 20),
      maxHeight: maxTooltipHeight,
    }
    : {
      bottom: Math.max(positionConfig.tooltipBottom || 0, MIN_BOTTOM_CLEARANCE),
      maxHeight: maxTooltipHeight,
    };

  return (
    <Animated.View
      style={[
        styles.tooltipContainer,
        tooltipStyle,
        {
          transform: [{ translateY }, { translateX }, { scale: scaleAnim }],
          opacity: opacityAnim,
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
        {/* Animated Pointer */}
        <AnimatedPointer
          direction={positionConfig.beakDirection}
          position={positionConfig.beakPosition}
          isDark={isDark}
        />

        {/* Enhanced Glassmorphic Background */}
        <BlurView
          intensity={isDark ? 80 : 60}
          tint={isDark ? 'dark' : 'light'}
          style={styles.tooltipBlur}
        >
          <LinearGradient
            colors={
              isDark
                ? ['rgba(20, 10, 36, 0.98)', 'rgba(20, 10, 36, 0.95)']
                : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.96)']
            }
            style={[
              styles.tooltipGradient,
              {
                borderColor: isDark ? 'rgba(45, 212, 191, 0.35)' : 'rgba(20, 184, 166, 0.25)',
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
                  borderColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.08)',
                  pointerEvents: 'none',
                },
              ]}
            />

            {/* Content */}
            <View style={styles.tooltipContent}>
              {/* Header Row with Skip Button */}
              <View style={styles.tooltipHeader}>
                <PaginationDots
                  currentIndex={currentIndex}
                  totalSteps={totalSteps}
                  isDark={isDark}
                />
                <PressableScale onPress={onSkip} scaleValue={0.88}>
                  <View
                    style={[
                      styles.skipButton,
                      {
                        backgroundColor: isDark
                          ? 'rgba(255, 255, 255, 0.08)'
                          : 'rgba(0, 0, 0, 0.05)',
                      },
                    ]}
                  >
                    <Ionicons
                      name="close"
                      size={16}
                      color={Colors.silverGrey}
                      style={{ marginRight: 4 }}
                    />
                    <Text
                      style={[
                        Typography.labelMedium,
                        {
                          color: Colors.silverGrey,
                          fontWeight: '600',
                        },
                      ]}
                    >
                      Skip
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

// ─── Calculate Dynamic Position ─────────────────────────────────────────────
function calculatePosition(step: TourStep, spotlightSize: number, insets: any): PositionConfig {
  const TOOLTIP_HEIGHT = 280; // Approximate tooltip height
  const SAFE_MARGIN = 20;
  const BEAK_MARGIN = 40; // Space for beak

  // CRITICAL: Account for bottom navigation bar height
  // Tab bar is ~72px + safe area insets (can be 92-110px total on iPhone with notch)
  const TAB_BAR_BASE_HEIGHT = 72;
  const bottomPadding = Math.max(insets.bottom, 20);
  const TAB_BAR_TOTAL_HEIGHT = TAB_BAR_BASE_HEIGHT + bottomPadding;

  // This is the hard boundary - tooltip must stay above this line
  const BOTTOM_NAVIGATION_BOUNDARY = SCREEN_HEIGHT - TAB_BAR_TOTAL_HEIGHT;

  // Determine spotlight Y position based on step configuration
  let spotlightY: number;

  if (step.position === 'top') {
    spotlightY = SCREEN_HEIGHT * 0.2;
  } else if (step.position === 'center') {
    // Ensure center position also respects bottom boundary
    const idealCenterY = SCREEN_HEIGHT * 0.4;
    const maxCenterY = BOTTOM_NAVIGATION_BOUNDARY - spotlightSize / 2 - TOOLTIP_HEIGHT - BEAK_MARGIN - SAFE_MARGIN;
    spotlightY = Math.min(idealCenterY, maxCenterY);
  } else {
    // bottom - ensure spotlight doesn't overlap tab bar and leaves room for tooltip above
    // For bottom position, we need space for: spotlight radius + beak + tooltip + margins
    const requiredClearance = spotlightSize / 2 + BEAK_MARGIN + TOOLTIP_HEIGHT + SAFE_MARGIN * 2;
    const maxBottomSpotlight = BOTTOM_NAVIGATION_BOUNDARY - requiredClearance;
    const idealBottomY = SCREEN_HEIGHT * 0.35;

    spotlightY = Math.min(idealBottomY, maxBottomSpotlight);

    // If still too low, push up further
    if (spotlightY + spotlightSize / 2 > BOTTOM_NAVIGATION_BOUNDARY - SAFE_MARGIN) {
      spotlightY = BOTTOM_NAVIGATION_BOUNDARY - spotlightSize / 2 - SAFE_MARGIN;
    }
  }

  const spotlightBottom = spotlightY + spotlightSize / 2;
  const spotlightTop = spotlightY - spotlightSize / 2;

  // Calculate available space above spotlight and below (accounting for tab bar)
  const spaceAbove = spotlightTop - insets.top - SAFE_MARGIN;
  const spaceBelow = BOTTOM_NAVIGATION_BOUNDARY - spotlightBottom - SAFE_MARGIN;

  let config: PositionConfig;

  // Decision: Can we fit tooltip below the spotlight?
  if (spaceBelow >= TOOLTIP_HEIGHT + BEAK_MARGIN) {
    // Place below spotlight, ensuring it stays above tab bar
    const tooltipTop = spotlightBottom + BEAK_MARGIN;
    const tooltipBottomEdge = tooltipTop + TOOLTIP_HEIGHT;

    // Check if tooltip would overlap tab bar
    if (tooltipBottomEdge > BOTTOM_NAVIGATION_BOUNDARY - SAFE_MARGIN) {
      // Would overlap - force it above spotlight instead
      config = {
        tooltipBottom: SCREEN_HEIGHT - spotlightTop + BEAK_MARGIN,
        beakDirection: 'down',
        beakPosition: 'bottom',
        spotlightY,
      };
    } else {
      config = {
        tooltipTop,
        beakDirection: 'up',
        beakPosition: 'top',
        spotlightY,
      };
    }
  } else if (spaceAbove >= TOOLTIP_HEIGHT + BEAK_MARGIN) {
    // Place above spotlight
    config = {
      tooltipBottom: SCREEN_HEIGHT - spotlightTop + BEAK_MARGIN,
      beakDirection: 'down',
      beakPosition: 'bottom',
      spotlightY,
    };
  } else {
    // Not enough space above or below - place in safest position
    // Always prefer above when near bottom to avoid tab bar
    if (spotlightY > SCREEN_HEIGHT * 0.5) {
      // Bottom half of screen - place above
      config = {
        tooltipBottom: Math.max(
          SCREEN_HEIGHT - spotlightTop + 20,
          SCREEN_HEIGHT - BOTTOM_NAVIGATION_BOUNDARY + TOOLTIP_HEIGHT + SAFE_MARGIN
        ),
        beakDirection: 'down',
        beakPosition: 'bottom',
        spotlightY,
      };
    } else {
      // Top half - try below but with hard limit
      const tooltipTop = Math.max(spotlightBottom + 20, insets.top + SAFE_MARGIN);
      const maxAllowedTop = BOTTOM_NAVIGATION_BOUNDARY - TOOLTIP_HEIGHT - SAFE_MARGIN;

      config = {
        tooltipTop: Math.min(tooltipTop, maxAllowedTop),
        beakDirection: 'up',
        beakPosition: 'top',
        spotlightY,
      };
    }
  }

  return config;
}

// ─── Main Overlay Component ─────────────────────────────────────────────────
export function CoachMarkOverlay() {
  const { theme } = useTheme();
  const { isTourActive, currentStep, currentStepIndex, nextStep, skipTour } = useCoachMarks();
  const [showWelcome, setShowWelcome] = useState(true);
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const insets = useSafeAreaInsets();

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const spotlightY = useRef(new Animated.Value(0)).current;

  // Calculate position config early (before any returns)
  const spotlightSize = currentStep?.spotlightSize || 360;
  const positionConfig = currentStep ? calculatePosition(currentStep, spotlightSize, insets) : null;

  // All hooks must be called before any conditional returns
  useEffect(() => {
    if (isTourActive && currentStep) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      fadeAnim.setValue(0);
    }
  }, [isTourActive, currentStep, fadeAnim]);

  // Animate spotlight position smoothly
  useEffect(() => {
    if (positionConfig) {
      Animated.spring(spotlightY, {
        toValue: positionConfig.spotlightY,
        tension: 42,        // Smooth, controlled spotlight movement
        friction: 15,       // Higher friction for gentle, weighty transition
        useNativeDriver: true,
      }).start();
    }
  }, [positionConfig?.spotlightY, spotlightY]);

  // Now we can safely do conditional returns
  if (!isTourActive || !currentStep || !positionConfig) return null;

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

  return (
    <Modal visible transparent animationType="fade" statusBarTranslucent>
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        {/* Dimmed Background */}
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.88)' : 'rgba(0, 0, 0, 0.75)',
            },
          ]}
        />

        {/* Spotlight Glow - Dynamically positioned */}
        <Animated.View
          style={[
            styles.spotlightContainer,
            {
              transform: [
                { translateX: -spotlightSize / 2 },
                { translateY: spotlightY },
              ],
            },
          ]}
        >
          <SpotlightGlow size={spotlightSize} />
        </Animated.View>

        {/* Dynamic Tooltip */}
        <GlassmorphicTooltip
          step={currentStep}
          currentIndex={currentStepIndex}
          totalSteps={8}
          onNext={nextStep}
          onSkip={skipTour}
          positionConfig={positionConfig}
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
        tension: 48,        // Balanced spring for welcoming entrance
        friction: 11,       // Controlled bounce without overshoot
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
                  <Ionicons name="sparkles" size={32} color={Colors.electricTeal} />
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
                Take a quick 30-second tour through your new financial command center. We&apos;ll show you how to save smarter, build wealth faster, and stay in control—all while juggling everything else!
              </Text>

              {/* Start Button */}
              <PressableScale onPress={onStart} scaleValue={0.96}>
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
    left: SCREEN_WIDTH / 2,
    top: 0,
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
    overflow: 'visible', // Changed to show beak
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
    flexShrink: 1, // Allow content to shrink if needed
  },
  tooltipHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },

  // ─── Pagination Dots ───────────────────────────────────────────────────────
  paginationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  paginationDot: {
    height: 6,
    borderRadius: 3,
  },

  // ─── Buttons ───────────────────────────────────────────────────────────────
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs + 2,
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

  welcomeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm + 2,
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.xxl,
    minWidth: 220,
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
