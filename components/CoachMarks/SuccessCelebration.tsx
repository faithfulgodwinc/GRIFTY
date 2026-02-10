import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
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
import * as Haptics from 'expo-haptics';

interface SuccessCelebrationProps {
  visible: boolean;
  onClose: () => void;
}

export function SuccessCelebration({ visible, onClose }: SuccessCelebrationProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  const scaleAnim = useRef(new Animated.Value(0.5)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const sparkle1 = useRef(new Animated.Value(0)).current;
  const sparkle2 = useRef(new Animated.Value(0)).current;
  const sparkle3 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Enhanced haptic pattern for a premium celebration feel
      setTimeout(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success), 0);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 120);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium), 240);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 360);
      setTimeout(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light), 480);

      // Buttery smooth main entrance
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 45,
          friction: 9,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
      ]).start();

      // Enhanced sparkle animations with smoother timing
      const sparkleSequence = (anim: Animated.Value, delay: number) => {
        return Animated.sequence([
          Animated.delay(delay),
          Animated.spring(anim, {
            toValue: 1,
            tension: 80,
            friction: 6,
            useNativeDriver: true,
          }),
        ]);
      };

      Animated.parallel([
        sparkleSequence(sparkle1, 250),
        sparkleSequence(sparkle2, 400),
        sparkleSequence(sparkle3, 550),
      ]).start();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <Modal visible transparent animationType="none" statusBarTranslucent>
      <View style={styles.overlay}>
        <View
          style={[
            StyleSheet.absoluteFill,
            {
              backgroundColor: isDark ? 'rgba(0, 0, 0, 0.92)' : 'rgba(0, 0, 0, 0.8)',
            },
          ]}
        />

        <Animated.View
          style={[
            styles.celebrationCard,
            {
              transform: [{ scale: scaleAnim }],
              opacity: opacityAnim,
            },
          ]}
        >
          <BlurView
            intensity={isDark ? 70 : 50}
            tint={isDark ? 'dark' : 'light'}
            style={styles.blurContainer}
          >
            <LinearGradient
              colors={
                isDark
                  ? ['rgba(20, 10, 36, 0.95)', 'rgba(20, 10, 36, 0.92)']
                  : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.95)']
              }
              style={[
                styles.contentContainer,
                {
                  borderColor: isDark
                    ? 'rgba(45, 212, 191, 0.35)'
                    : 'rgba(20, 184, 166, 0.25)',
                },
              ]}
            >
              {/* Sparkle Decorations */}
              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle1,
                  {
                    opacity: sparkle1,
                    transform: [
                      {
                        scale: sparkle1.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                      {
                        rotate: sparkle1.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '45deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.sparkleText}>✨</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle2,
                  {
                    opacity: sparkle2,
                    transform: [
                      {
                        scale: sparkle2.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                      {
                        rotate: sparkle2.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '-30deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.sparkleText}>🎉</Text>
              </Animated.View>

              <Animated.View
                style={[
                  styles.sparkle,
                  styles.sparkle3,
                  {
                    opacity: sparkle3,
                    transform: [
                      {
                        scale: sparkle3.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0, 1],
                        }),
                      },
                      {
                        rotate: sparkle3.interpolate({
                          inputRange: [0, 1],
                          outputRange: ['0deg', '60deg'],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <Text style={styles.sparkleText}>🌟</Text>
              </Animated.View>

              {/* Premium Trophy Icon */}
              <View
                style={[
                  styles.iconContainer,
                  {
                    shadowColor: '#FFD700',
                    shadowOffset: { width: 0, height: 8 },
                    shadowOpacity: 0.6,
                    shadowRadius: 24,
                    elevation: 14,
                  },
                ]}
              >
                <LinearGradient
                  colors={[Colors.sunKissedAmber, Colors.radiantMagenta]}
                  style={styles.iconGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                >
                  {/* Inner glow effect */}
                  <View
                    style={[
                      StyleSheet.absoluteFill,
                      {
                        borderRadius: 52,
                        backgroundColor: 'rgba(255, 215, 0, 0.1)',
                      },
                    ]}
                  />
                  <Text style={styles.trophyEmoji}>🏆</Text>
                </LinearGradient>
              </View>

              {/* Success Message */}
              <Text
                style={[
                  Typography.displaySmall,
                  {
                    color: Colors.primaryText,
                    textAlign: 'center',
                    marginTop: Spacing.lg,
                    marginBottom: Spacing.sm,
                  },
                ]}
              >
                You're Ready to GRIT!
              </Text>

              <Text
                style={[
                  Typography.bodyLarge,
                  {
                    color: Colors.secondaryText,
                    textAlign: 'center',
                    lineHeight: 24,
                    marginBottom: Spacing.xl,
                    paddingHorizontal: Spacing.md,
                  },
                ]}
              >
                You've explored your Dashboard, Savings Hub, and Investment Hub. Now it's time to take control, build momentum, and watch your wealth grow. You've got this! 💪
              </Text>

              {/* Achievement Badge */}
              <View
                style={[
                  styles.achievementBadge,
                  {
                    backgroundColor: isDark
                      ? 'rgba(45, 212, 191, 0.12)'
                      : 'rgba(20, 184, 166, 0.08)',
                    borderColor: isDark
                      ? 'rgba(45, 212, 191, 0.25)'
                      : 'rgba(20, 184, 166, 0.15)',
                  },
                ]}
              >
                <Ionicons name="checkmark-circle" size={18} color={Colors.electricTeal} />
                <Text
                  style={[
                    Typography.titleSmall,
                    {
                      color: Colors.electricTeal,
                      fontWeight: '600',
                    },
                  ]}
                >
                  Ready to Grit!
                </Text>
              </View>

              {/* Get Started Button */}
              <PressableScale onPress={onClose} scaleValue={0.96} style={{ width: '100%', marginTop: Spacing.xl }}>
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.glowingGreen]}
                  style={styles.button}
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
                    Get Started
                  </Text>
                  <Ionicons name="rocket" size={20} color="#FFFFFF" />
                </LinearGradient>
              </PressableScale>
            </LinearGradient>
          </BlurView>
        </Animated.View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  celebrationCard: {
    width: '100%',
    maxWidth: 400,
  },
  blurContainer: {
    borderRadius: BorderRadius.xxl + 8,
    overflow: 'hidden',
  },
  contentContainer: {
    borderRadius: BorderRadius.xxl + 8,
    borderWidth: 2,
    padding: Spacing.xxl,
    alignItems: 'center',
    position: 'relative',
  },

  // ─── Premium Icon ──────────────────────────────────────────────────────────
  iconContainer: {
    width: 104,
    height: 104,
    borderRadius: 52,
  },
  iconGradient: {
    width: 104,
    height: 104,
    borderRadius: 52,
    justifyContent: 'center',
    alignItems: 'center',
  },
  trophyEmoji: {
    fontSize: 52,
  },

  // ─── Enhanced Sparkles ─────────────────────────────────────────────────────
  sparkle: {
    position: 'absolute',
    ...Platform.select({
      ios: {
        shadowColor: '#FFD700',
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.6,
        shadowRadius: 8,
      },
      android: { elevation: 4 },
    }),
  },
  sparkle1: {
    top: 35,
    right: 25,
  },
  sparkle2: {
    top: 75,
    left: 15,
  },
  sparkle3: {
    bottom: 115,
    right: 20,
  },
  sparkleText: {
    fontSize: 32,
  },

  // ─── Badge ─────────────────────────────────────────────────────────────────
  achievementBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.round,
    borderWidth: 1,
  },

  // ─── Button ────────────────────────────────────────────────────────────────
  button: {
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
