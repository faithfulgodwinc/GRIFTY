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
function TooltipBeak({
  direction,
  position,
  isDark
}: {
  direction: 'up' | 'down' | 'left' | 'right';
  position: 'top' | 'bottom';
  isDark: boolean;
}) {
  const Colors = getThemeColors(isDark);

  const beakStyle = position === 'top'
    ? {
        position: 'absolute' as const,
        left: SCREEN_WIDTH / 2 - Spacing.lg - 12,
        top: -12,
      }
    : {
        position: 'absolute' as const,
        left: SCREEN_WIDTH / 2 - Spacing.lg - 12,
        bottom: -12,
      };

  const getPoints = () => {
    if (direction === 'down') {
      return '12,0 24,20 0,20'; // Points down
    } else {
      return '0,0 24,0 12,20'; // Points up
    }
  };

  return (
    <View style={beakStyle}>
      <Svg width={24} height={20} viewBox="0 0 24 20">
        <Defs>
          <SvgRadialGradient id="beakGrad" cx="50%" cy="50%">
            <Stop offset="0%" stopColor={isDark ? 'rgba(20, 10, 36, 0.98)' : 'rgba(255, 255, 255, 0.98)'} stopOpacity="1" />
            <Stop offset="100%" stopColor={isDark ? 'rgba(20, 10, 36, 0.92)' : 'rgba(255, 255, 255, 0.92)'} stopOpacity="1" />
          </SvgRadialGradient>
        </Defs>
        <Polygon
          points={getPoints()}
          fill="url(#beakGrad)"
          stroke={isDark ? 'rgba(45, 212, 191, 0.3)' : 'rgba(20, 184, 166, 0.2)'}
          strokeWidth={1.5}
        />
      </Svg>
    </View>
  );
}

// ─── Pagination Dots ─────────────────────────────────────────────────────────
function PaginationDots({
  currentIndex,
  totalSteps,
  isDark
}: {
  currentIndex: number;
  totalSteps: number;
  isDark: boolean;
}) {
  const Colors = getThemeColors(isDark);

  return (
    <View style={styles.paginationContainer}>
      {Array.from({ length: totalSteps }).map((_, index) => {
        const isActive = index === currentIndex;
        return (
          <Animated.View
            key={index}
            style={[
              styles.paginationDot,
              {
                backgroundColor: isActive
                  ? Colors.electricTeal
                  : isDark ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
                width: isActive ? 20 : 6,
              },
            ]}
          />
        );
      })}
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
    Animated.parallel([
      Animated.spring(translateY, {
        toValue: 0,
        tension: 45,        // Lower tension = more "weight"
        friction: 14,       // Higher friction = slower, more controlled
        mass: 1.2,          // Increased mass = heavier feel
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 42,
        friction: 13,
        mass: 1.1,
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

    return () => {
      // Smooth exit
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: positionConfig.beakDirection === 'down' ? 60 : -60,
          duration: 280,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    };
  }, [step.id, positionConfig]);

  // Calculate tooltip position
  const tooltipStyle = positionConfig.tooltipTop !== undefined
    ? { top: Math.max(positionConfig.tooltipTop, insets.top + 20) }
    : { bottom: Math.max(positionConfig.tooltipBottom || 0, insets.bottom + 20) };

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
        {/* Glassmorphic Pointer/Beak */}
        <TooltipBeak
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

  // Determine spotlight Y position based on step configuration
  let spotlightY: number;

  if (step.position === 'top') {
    spotlightY = SCREEN_HEIGHT * 0.2;
  } else if (step.position === 'center') {
    spotlightY = SCREEN_HEIGHT * 0.4;
  } else {
    // bottom
    spotlightY = SCREEN_HEIGHT * 0.35;
  }

  const spotlightBottom = spotlightY + spotlightSize / 2;
  const spotlightTop = spotlightY - spotlightSize / 2;

  // Calculate available space above and below spotlight
  const spaceAbove = spotlightTop - insets.top - SAFE_MARGIN;
  const spaceBelow = SCREEN_HEIGHT - spotlightBottom - insets.bottom - SAFE_MARGIN;

  let config: PositionConfig;

  // Decision: Can we fit tooltip below the spotlight?
  if (spaceBelow >= TOOLTIP_HEIGHT + BEAK_MARGIN) {
    // Place below spotlight
    config = {
      tooltipTop: spotlightBottom + BEAK_MARGIN,
      beakDirection: 'up',
      beakPosition: 'top',
      spotlightY,
    };
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
    if (spaceBelow > spaceAbove) {
      config = {
        tooltipTop: spotlightBottom + 20,
        beakDirection: 'up',
        beakPosition: 'top',
        spotlightY,
      };
    } else {
      config = {
        tooltipBottom: SCREEN_HEIGHT - spotlightTop + 20,
        beakDirection: 'down',
        beakPosition: 'bottom',
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
        tension: 40,
        friction: 14,
        mass: 1.2,
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
