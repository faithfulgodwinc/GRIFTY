import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  ActivityIndicator,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import ConfettiCannon from 'react-native-confetti-cannon';
import { PurchasesPackage } from 'react-native-purchases';
import { useSubscription } from '@/contexts/SubscriptionContext';

import { Colors as StaticColors, Gradients as StaticGradients, getThemeColors, getGradients } from '@/constants/Colors';
import { Spacing, BorderRadius, Typography } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

interface Props {
  visible: boolean;
  packages: PurchasesPackage[];
  onSuccess: () => void;
  onClose: () => void;
}

const PressableScale = ({ onPress, scaleValue = 0.95, children, style, disabled }: any) => {
  const animated = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(animated, {
      toValue: scaleValue,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(animated, {
      toValue: 1,
      useNativeDriver: true,
      speed: 20,
    }).start();
  };

  return (
    <TouchableOpacity
      activeOpacity={1}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={style}
    >
      <Animated.View style={{ transform: [{ scale: animated }] }}>
        {children}
      </Animated.View>
    </TouchableOpacity>
  );
};

export function GritElitePaywall({ visible, packages, onSuccess, onClose }: Props) {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);
  const { purchasePackage, restorePurchases, isLoading: isContextLoading } = useSubscription();

  const [selectedPackage, setSelectedPackage] = useState<PurchasesPackage | null>(null);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);

  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;


  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      // Reset state
      setError(null);
      setIsPurchasing(false);
      setShowCelebration(false);

      // Pre-select annual or first package
      if (packages.length > 0) {
        const annual = packages.find(p => p.product.subscriptionPeriod === 'P1Y');
        setSelectedPackage(annual || packages[0]);
      }

      // Enter animations
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        damping: 20,
        stiffness: 90,
      }).start();


    } else {
      Animated.timing(slideAnim, {
        toValue: height,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, packages, slideAnim]);



  const handleClose = () => {
    if (isPurchasing) return;
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(() => onClose());
  };

  const handleSelectPackage = (pack: PurchasesPackage) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setSelectedPackage(pack);
    setError(null);
  };

  const handlePurchase = async () => {
    if (!selectedPackage) return;

    try {
      setIsPurchasing(true);
      setError(null);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      await purchasePackage(selectedPackage);

      // Success sequence
      setShowCelebration(true);
      confettiRef.current?.start();
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      setTimeout(() => {
        onSuccess();
      }, 3000);
    } catch (err: any) {
      setIsPurchasing(false);
      setError('Purchase failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      setError(null);
      const customerInfo = await restorePurchases();
      setIsPurchasing(false);

      if (customerInfo?.entitlements.active['premium']) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess();
      } else {
        setError('No active subscriptions found to restore.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err) {
      setIsPurchasing(false);
      setError('Failed to restore purchases.');
    }
  };

  const formatPeriod = (pack: PurchasesPackage) => {
    const period = pack.product.subscriptionPeriod;
    if (period === 'P1Y') return 'Yearly';
    if (period === 'P1M') return 'Monthly';
    if (period === 'P1W') return 'Weekly';
    return 'Period';
  };

  const isAnnual = (pack: PurchasesPackage) => {
    return pack.product.subscriptionPeriod === 'P1Y';
  };

  if (!visible) return null;

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingTop: insets.top + 10,
              paddingBottom: Math.max(insets.bottom, 10),
            },
          ]}
        >
          <View
            style={[
              styles.gradientContainer,
              {
                backgroundColor: isDark ? '#0A0612' : '#FFFFFF',
                padding: Spacing.md,
                borderRadius: BorderRadius.xxl,
              }
            ]}
          >
            {/* Header */}
            <View style={styles.header}>
              <PressableScale onPress={handleClose} scaleValue={0.9}>
                <View
                  style={[
                    styles.closeButton,
                    {
                      backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : Colors.white,
                      borderColor: Colors.glassBorder,
                    },
                  ]}
                >
                  <Ionicons name="close" size={20} color={Colors.silverGrey} />
                </View>
              </PressableScale>
            </View>

            {/* Premium Heading */}
            <View style={styles.premiumHeadingSection}>
              <Text style={[styles.premiumTitle, { color: Colors.primaryText }]}>
                Grit Premium
              </Text>
              <Text style={[styles.premiumSubtitle, { color: Colors.silverGrey }]}>
                Unlock advanced financial tools and AI coaching
              </Text>
            </View>

            <View style={styles.contentContainer}>
              {/* Plan Selection */}
              {isContextLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.electricTeal} />
                  <Text style={[styles.loadingText, { color: Colors.silverGrey }]}>Loading plans...</Text>
                </View>
              ) : (
                <View style={styles.plansSection}>
                  {packages.map((pack) => {
                    const selected = selectedPackage?.identifier === pack.identifier;
                    const annual = isAnnual(pack);

                    return (
                      <PressableScale
                        key={pack.identifier}
                        onPress={() => handleSelectPackage(pack)}
                        scaleValue={0.97}
                      >
                        <View
                          style={[
                            styles.planCard,
                            {
                              backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : Colors.white,
                              borderColor: selected
                                ? Colors.electricTeal
                                : isDark
                                  ? 'rgba(45, 212, 191, 0.2)'
                                  : Colors.glassBorder,
                              borderWidth: selected ? 2 : 1,
                            },
                          ]}
                        >
                          {annual && (
                            <View style={styles.bestValueBadge}>
                              <LinearGradient
                                colors={[Colors.sunKissedAmber, Colors.radiantMagenta]}
                                start={{ x: 0, y: 0 }}
                                end={{ x: 1, y: 0 }}
                                style={styles.bestValueGradient}
                              >
                                <Text style={styles.bestValueText}>BEST VALUE</Text>
                              </LinearGradient>
                            </View>
                          )}

                          <View style={styles.planContent}>
                            <View style={styles.planLeft}>
                              <View
                                style={[
                                  styles.radioOuter,
                                  {
                                    borderColor: selected ? Colors.electricTeal : Colors.silverGrey,
                                  },
                                ]}
                              >
                                {selected && (
                                  <LinearGradient
                                    colors={[Colors.electricTeal, Colors.glowingGreen]}
                                    style={styles.radioInner}
                                  />
                                )}
                              </View>
                              <View>
                                <Text style={[styles.planName, { color: Colors.primaryText }]}>
                                  {annual ? 'Annual Mastery' : 'Monthly Growth'}
                                </Text>
                                <Text style={[styles.planPeriod, { color: Colors.silverGrey }]}>
                                  Billed {formatPeriod(pack)}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.planPrice, { color: Colors.primaryText }]}>
                              {pack.product.priceString}
                            </Text>
                          </View>
                        </View>
                      </PressableScale>
                    );
                  })}
                </View>
              )}

              {/* Error Message */}
              {error && (
                <View style={[styles.errorContainer, { backgroundColor: isDark ? 'rgba(239, 68, 68, 0.1)' : '#FEE' }]}>
                  <Ionicons name="alert-circle" size={20} color={Colors.error} />
                  <Text style={[styles.errorText, { color: Colors.error }]}>{error}</Text>
                </View>
              )}

              {/* Purchase Button */}
              <PressableScale
                onPress={handlePurchase}
                disabled={isPurchasing || isContextLoading || !selectedPackage}
                scaleValue={0.97}
                style={styles.purchaseButtonContainer}
              >
                <Animated.View
                  style={[
                    styles.purchaseButtonOuter,
                    {
                      opacity: isPurchasing || isContextLoading ? 0.5 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.glowingGreen]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.purchaseButtonGradient}
                  >


                    {isPurchasing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.purchaseButtonText}>Unlock</Text>
                    )}
                  </LinearGradient>
                </Animated.View>
              </PressableScale>

              {/* Restore & Links */}
              <View style={styles.legalLinks}>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={[styles.legalText, { color: Colors.tertiaryText }]}>Terms</Text>
                </TouchableOpacity>
                <Text style={[styles.legalSeparator, { color: Colors.tertiaryText }]}>•</Text>
                <TouchableOpacity onPress={() => { }}>
                  <Text style={[styles.legalText, { color: Colors.tertiaryText }]}>Privacy</Text>
                </TouchableOpacity>
                <Text style={[styles.legalSeparator, { color: Colors.tertiaryText }]}>•</Text>
                <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
                  <Text style={[styles.linkText, { color: Colors.electricTeal }]}>Restore</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Animated.View>

        {/* Celebration Overlay */}
        {showCelebration && (
          <View style={styles.celebrationOverlay} pointerEvents="none">
            <ConfettiCannon
              ref={confettiRef}
              count={150}
              origin={{ x: width / 2, y: -10 }}
              fadeOut
              colors={[Colors.electricTeal, Colors.amethyst, Colors.neonPink, '#FFD700']}
            />
            <View style={styles.celebrationContent}>
              <LinearGradient
                colors={[Colors.electricTeal, Colors.amethyst]}
                style={styles.celebrationIcon}
              >
                <Text style={styles.celebrationEmoji}>👑</Text>
              </LinearGradient>
              <Text style={[styles.celebrationTitle, { color: Colors.primaryText }]}>Welcome to Grit Elite!</Text>
              <Text style={[styles.celebrationSubtitle, { color: Colors.secondaryText }]}>
                You&apos;re now a Grit VIP Mom-Boss
              </Text>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

interface FeatureRowProps {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  isDark: boolean;
  Colors: any;
}

function FeatureRow({ icon, title, subtitle, isDark, Colors }: FeatureRowProps) {
  return (
    <View style={styles.featureRow}>
      <View
        style={[
          styles.featureIconContainer,
          {
            backgroundColor: isDark ? 'rgba(45, 212, 191, 0.1)' : 'rgba(20, 184, 166, 0.08)',
          },
        ]}
      >
        <Ionicons name={icon} size={20} color={Colors.electricTeal} />
      </View>
      <View style={styles.featureText}>
        <Text style={[styles.featureTitle, { color: Colors.primaryText }]}>{title}</Text>
        <Text style={[styles.featureSubtitle, { color: Colors.silverGrey }]}>{subtitle}</Text>
      </View>
      <Ionicons name="checkmark-circle" size={22} color={Colors.success} />
    </View>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 500,
    height: '85%',
    maxHeight: 700,
    borderRadius: BorderRadius.xxl + 8,
    overflow: 'hidden',
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    opacity: 0, // Hide close button visually but keep layout if needed, or just remove
  },

  // Premium Heading
  premiumHeadingSection: {
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  premiumTitle: {
    ...Typography.headlineLarge,
    fontWeight: '800',
    marginBottom: Spacing.xs,
    textAlign: 'center',
  },
  premiumSubtitle: {
    ...Typography.bodySmall,
    textAlign: 'center',
    opacity: 0.8,
  },

  contentContainer: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.sm, // Reduced
  },
  memberCardOuter: {
    width: '100%',
    marginBottom: Spacing.xs, // Reduced
    transform: [{ scale: 0.85 }], // Reduced scale
  },
  memberCardBorder: {
    borderRadius: BorderRadius.xl + 4,
    padding: 2,
  },
  memberCardBlur: {
    borderRadius: BorderRadius.xl + 2,
    overflow: 'hidden',
  },
  memberCardInner: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl + 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  cardTitle: {
    ...Typography.headlineSmall,
    fontWeight: '700',
    letterSpacing: 1.5,
  },
  cardBadge: {
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  badgeGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  badgeText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  cardSubtitle: {
    ...Typography.bodyMedium,
  },
  heroTitle: {
    ...Typography.headlineMedium, // Smaller than displaySmall
    textAlign: 'center',
    marginBottom: 0,
    fontWeight: '700',
  },
  heroSubtitle: {
    ...Typography.bodyMedium, // Smaller than bodyLarge
    textAlign: 'center',
    color: 'transparent', // Hide subtitle to save space
    height: 0,
  },

  // Features
  featuresSection: {
    marginBottom: Spacing.md, // Reduced
    gap: 4, // Tighter gap
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  featureIconContainer: {
    width: 28, // Reduced from 36
    height: 28, // Reduced from 36
    borderRadius: BorderRadius.sm,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.labelLarge,
    fontWeight: '600',
  },
  featureSubtitle: {
    ...Typography.bodySmall,
  },

  // Plans
  plansSection: {
    gap: Spacing.sm,
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    width: '100%',
    paddingHorizontal: Spacing.lg,
  },
  planCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.md,
    position: 'relative',
    borderWidth: 2,
  },
  bestValueBadge: {
    position: 'absolute',
    top: -10,
    right: Spacing.lg,
    borderRadius: BorderRadius.md,
    overflow: 'hidden',
  },
  bestValueGradient: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  bestValueText: {
    ...Typography.labelSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    flex: 1,
    paddingRight: Spacing.md,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 14,
    height: 14,
    borderRadius: 7,
  },
  planName: {
    ...Typography.labelLarge,
    fontWeight: '600',
  },
  planPeriod: {
    ...Typography.bodySmall,
  },
  planPrice: {
    ...Typography.titleLarge,
    fontWeight: '700',
    textAlign: 'right',
  },

  // Loading & Error
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: Spacing.xl,
  },
  loadingText: {
    ...Typography.bodyMedium,
    marginTop: Spacing.md,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    marginBottom: Spacing.lg,
  },
  errorText: {
    ...Typography.bodyMedium,
    flex: 1,
  },

  // Purchase Button
  purchaseButtonContainer: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.xl,
  },
  purchaseButtonOuter: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  purchaseButtonGradient: {
    paddingVertical: Spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  shimmerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: width,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    transform: [{ skewX: '-20deg' }],
  },
  purchaseButtonText: {
    ...Typography.headlineSmall,
    color: '#FFFFFF',
    fontWeight: '700',
  },

  // Footer
  footerLinks: {
    alignItems: 'center',
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  linkText: {
    ...Typography.labelLarge,
    fontWeight: '600',
  },
  legalLinks: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  legalText: {
    ...Typography.bodySmall,
  },
  legalSeparator: {
    ...Typography.bodySmall,
    marginHorizontal: Spacing.xs,
  },
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  celebrationContent: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    padding: Spacing.xl,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 10,
    transform: [{ scale: 1.1 }],
  },
  celebrationIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  celebrationEmoji: {
    fontSize: 32,
  },
  celebrationTitle: {
    ...Typography.headlineSmall,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  celebrationSubtitle: {
    ...Typography.bodyMedium,
    textAlign: 'center',
  },
});
