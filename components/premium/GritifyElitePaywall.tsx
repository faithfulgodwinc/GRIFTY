import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Animated,
  ActivityIndicator,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Haptics from 'expo-haptics';
import { adapty } from 'react-native-adapty';
import type { AdaptyPaywall, AdaptyPaywallProduct, AdaptyProfile } from 'react-native-adapty';
import { PressableScale } from '@/components/PressableScale';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { useTheme } from '@/contexts/ThemeContext';
import ConfettiCannon from 'react-native-confetti-cannon';

const { width, height } = Dimensions.get('window');

interface GritifyElitePaywallProps {
  visible: boolean;
  paywall: AdaptyPaywall;
  onSuccess: (profile: AdaptyProfile) => void;
  onClose: () => void;
}

export function GritifyElitePaywall({
  visible,
  paywall,
  onSuccess,
  onClose,
}: GritifyElitePaywallProps) {
  const [products, setProducts] = useState<AdaptyPaywallProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<AdaptyPaywallProduct | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isPurchasing, setIsPurchasing] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current;
  const cardShimmer = useRef(new Animated.Value(0)).current;
  const buttonShimmer = useRef(new Animated.Value(-width)).current;
  const confettiRef = useRef<any>(null);

  useEffect(() => {
    if (visible) {
      loadProducts();
      animateIn();
      startShimmers();
    }
  }, [visible]);

  const animateIn = () => {
    Animated.spring(slideAnim, {
      toValue: 0,
      useNativeDriver: true,
      damping: 20,
      stiffness: 90,
    }).start();
  };

  const animateOut = (callback: () => void) => {
    Animated.timing(slideAnim, {
      toValue: height,
      duration: 300,
      useNativeDriver: true,
    }).start(callback);
  };

  const startShimmers = () => {
    // Card shimmer
    Animated.loop(
      Animated.sequence([
        Animated.timing(cardShimmer, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(cardShimmer, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Button shimmer
    Animated.loop(
      Animated.timing(buttonShimmer, {
        toValue: width * 2,
        duration: 2500,
        useNativeDriver: true,
      })
    ).start();
  };

  const loadProducts = async () => {
    try {
      setIsLoading(true);
      const paywallProducts = await adapty.getPaywallProducts(paywall);

      // Sort products: annual first (if it's the best value)
      const sorted = paywallProducts.sort((a, b) => {
        const aIsAnnual = a.subscription?.subscriptionPeriod?.unit === 'year';
        const bIsAnnual = b.subscription?.subscriptionPeriod?.unit === 'year';
        if (aIsAnnual && !bIsAnnual) return -1;
        if (!aIsAnnual && bIsAnnual) return 1;
        return 0;
      });

      setProducts(sorted);
      // Pre-select annual plan (best value)
      const annual = sorted.find((p) => p.subscription?.subscriptionPeriod?.unit === 'year');
      setSelectedProduct(annual || sorted[0]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load plans');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectProduct = (product: AdaptyPaywallProduct) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setSelectedProduct(product);
  };

  const handlePurchase = async () => {
    if (!selectedProduct || isPurchasing) return;

    try {
      setIsPurchasing(true);
      setError(null);

      const result = await adapty.makePurchase(selectedProduct);

      switch (result.type) {
        case 'success':
          // Festive sparkle haptic
          await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setShowCelebration(true);
          confettiRef.current?.start();

          // Wait for celebration, then close
          setTimeout(() => {
            onSuccess(result.profile);
          }, 3000);
          break;

        case 'user_cancelled':
          // User closed the dialog - no error
          break;

        case 'pending':
          setError('Purchase is pending approval. Check back soon!');
          break;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Purchase failed. Please try again.');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleRestore = async () => {
    try {
      setIsPurchasing(true);
      const profile = await adapty.restorePurchases();
      const isPremium = profile?.accessLevels?.['premium']?.isActive ?? false;

      if (isPremium) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        onSuccess(profile);
      } else {
        setError('No purchases found to restore.');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Restore failed');
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    } finally {
      setIsPurchasing(false);
    }
  };

  const handleClose = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    animateOut(() => onClose());
  };

  const openLink = async (url: string) => {
    try {
      const canOpen = await Linking.canOpenURL(url);
      if (canOpen) {
        await Linking.openURL(url);
      }
    } catch (error) {
      console.error('Failed to open link:', error);
    }
  };

  const formatPrice = (product: AdaptyPaywallProduct): string => {
    return product.price?.localizedString || 'N/A';
  };

  const formatPeriod = (product: AdaptyPaywallProduct): string => {
    const period = product.subscription?.subscriptionPeriod;
    if (!period) return '';
    const { numberOfUnits, unit } = period;
    if (unit === 'month') return 'monthly';
    if (unit === 'year') return 'annually';
    return `per ${numberOfUnits} ${unit}`;
  };

  const isAnnual = (product: AdaptyPaywallProduct): boolean => {
    return product.subscription?.subscriptionPeriod?.unit === 'year';
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={handleClose}>
      <View style={styles.modalOverlay}>
        <BlurView intensity={isDark ? 60 : 40} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
              paddingTop: insets.top + 20,
              paddingBottom: Math.max(insets.bottom, 20),
            },
          ]}
        >
          <LinearGradient colors={Gradients.background} style={styles.gradientContainer}>
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
                  <Ionicons name="close" size={24} color={Colors.silverGrey} />
                </View>
              </PressableScale>
            </View>

            <ScrollView
              style={styles.scrollView}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Hero Card - Virtual Member Card */}
              <View style={styles.heroSection}>
                <Animated.View
                  style={[
                    styles.memberCardOuter,
                    {
                      opacity: cardShimmer.interpolate({
                        inputRange: [0, 0.5, 1],
                        outputRange: [1, 0.85, 1],
                      }),
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.amethyst]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.memberCardBorder}
                  >
                    <BlurView intensity={isDark ? 50 : 30} tint={isDark ? 'dark' : 'light'} style={styles.memberCardBlur}>
                      <View
                        style={[
                          styles.memberCardInner,
                          { backgroundColor: isDark ? 'rgba(20, 10, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)' },
                        ]}
                      >
                        <View style={styles.cardHeader}>
                          <Text style={[styles.cardTitle, { color: Colors.primaryText }]}>GRITIFY ELITE</Text>
                          <View style={styles.cardBadge}>
                            <LinearGradient
                              colors={[Colors.electricTeal, Colors.glowingGreen]}
                              style={styles.badgeGradient}
                            >
                              <Text style={styles.badgeText}>VIP</Text>
                            </LinearGradient>
                          </View>
                        </View>
                        <Text style={[styles.cardSubtitle, { color: Colors.silverGrey }]}>
                          Premium Mom-Boss Access
                        </Text>
                      </View>
                    </BlurView>
                  </LinearGradient>
                </Animated.View>

                <Text style={[styles.heroTitle, { color: Colors.primaryText }]}>
                  Unlock Your{'\n'}Financial Power
                </Text>
                <Text style={[styles.heroSubtitle, { color: Colors.secondaryText }]}>
                  Join elite moms achieving their money goals
                </Text>
              </View>

              {/* Feature List */}
              <View style={styles.featuresSection}>
                <FeatureRow
                  icon="sparkles"
                  title="Newell AI Coach"
                  subtitle="24/7 personal financial assistant"
                  isDark={isDark}
                  Colors={Colors}
                />
                <FeatureRow
                  icon="analytics"
                  title="Advanced Financial Hubs"
                  subtitle="Smart Shopper, Premium Savings Tools"
                  isDark={isDark}
                  Colors={Colors}
                />
                <FeatureRow
                  icon="trophy"
                  title="Exclusive Challenges"
                  subtitle="Bonus rewards and streak boosters"
                  isDark={isDark}
                  Colors={Colors}
                />
                <FeatureRow
                  icon="lock-closed"
                  title="Priority Support"
                  subtitle="Direct access to our elite team"
                  isDark={isDark}
                  Colors={Colors}
                />
              </View>

              {/* Plan Selection */}
              {isLoading ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color={Colors.electricTeal} />
                  <Text style={[styles.loadingText, { color: Colors.silverGrey }]}>Loading plans...</Text>
                </View>
              ) : (
                <View style={styles.plansSection}>
                  {products.map((product) => {
                    const selected = selectedProduct?.vendorProductId === product.vendorProductId;
                    const annual = isAnnual(product);

                    return (
                      <PressableScale
                        key={product.vendorProductId}
                        onPress={() => handleSelectProduct(product)}
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
                                  Billed {formatPeriod(product)}
                                </Text>
                              </View>
                            </View>
                            <Text style={[styles.planPrice, { color: Colors.primaryText }]}>{formatPrice(product)}</Text>
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
                disabled={isPurchasing || isLoading || !selectedProduct}
                scaleValue={0.97}
                style={styles.purchaseButtonContainer}
              >
                <Animated.View
                  style={[
                    styles.purchaseButtonOuter,
                    {
                      opacity: isPurchasing || isLoading ? 0.5 : 1,
                    },
                  ]}
                >
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.glowingGreen]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={styles.purchaseButtonGradient}
                  >
                    {/* Shimmer overlay */}
                    <Animated.View
                      style={[
                        styles.shimmerOverlay,
                        {
                          transform: [{ translateX: buttonShimmer }],
                        },
                      ]}
                    />

                    {isPurchasing ? (
                      <ActivityIndicator size="small" color="#FFFFFF" />
                    ) : (
                      <Text style={styles.purchaseButtonText}>Unlock Elite Access</Text>
                    )}
                  </LinearGradient>
                </Animated.View>
              </PressableScale>

              {/* Restore & Links */}
              <View style={styles.footerLinks}>
                <TouchableOpacity onPress={handleRestore} disabled={isPurchasing}>
                  <Text style={[styles.linkText, { color: Colors.electricTeal }]}>Restore Purchases</Text>
                </TouchableOpacity>

                <View style={styles.legalLinks}>
                  <TouchableOpacity onPress={() => openLink('https://yourapp.com/terms')}>
                    <Text style={[styles.legalText, { color: Colors.tertiaryText }]}>Terms of Service</Text>
                  </TouchableOpacity>
                  <Text style={[styles.legalSeparator, { color: Colors.tertiaryText }]}>•</Text>
                  <TouchableOpacity onPress={() => openLink('https://yourapp.com/privacy')}>
                    <Text style={[styles.legalText, { color: Colors.tertiaryText }]}>Privacy Policy</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>
          </LinearGradient>
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
              <Text style={[styles.celebrationTitle, { color: Colors.primaryText }]}>Welcome to Elite!</Text>
              <Text style={[styles.celebrationSubtitle, { color: Colors.secondaryText }]}>
                You&apos;re now a Gritify VIP Mom-Boss
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
    justifyContent: 'flex-end',
  },
  modalContainer: {
    height: height * 0.92,
    borderTopLeftRadius: BorderRadius.xxl + 8,
    borderTopRightRadius: BorderRadius.xxl + 8,
    overflow: 'hidden',
  },
  gradientContainer: {
    flex: 1,
  },
  header: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    alignItems: 'flex-end',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
  },

  // Hero Section
  heroSection: {
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  memberCardOuter: {
    width: '100%',
    marginBottom: Spacing.xl,
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
    ...Typography.displaySmall,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  heroSubtitle: {
    ...Typography.bodyLarge,
    textAlign: 'center',
  },

  // Features
  featuresSection: {
    marginBottom: Spacing.xl,
    gap: Spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  featureIconContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.lg,
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
    gap: Spacing.md,
    marginBottom: Spacing.lg,
  },
  planCard: {
    borderRadius: BorderRadius.xl,
    padding: Spacing.lg,
    position: 'relative',
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
    ...Typography.headlineSmall,
    fontWeight: '700',
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
    marginBottom: Spacing.lg,
  },
  purchaseButtonOuter: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
  },
  purchaseButtonGradient: {
    paddingVertical: Spacing.lg,
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
    gap: Spacing.md,
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
  },

  // Celebration
  celebrationOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  celebrationContent: {
    alignItems: 'center',
  },
  celebrationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  celebrationEmoji: {
    fontSize: 50,
  },
  celebrationTitle: {
    ...Typography.displaySmall,
    marginBottom: Spacing.xs,
  },
  celebrationSubtitle: {
    ...Typography.bodyLarge,
  },
});
