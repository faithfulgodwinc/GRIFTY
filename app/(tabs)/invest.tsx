import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients, getGradients, getThemeColors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, {
  Path,
  Circle,
  Line,
  Defs,
  LinearGradient as SvgGradient,
  Stop,
} from 'react-native-svg';

const { width } = Dimensions.get('window');

const MARKET_CARD_WIDTH = 148;
const MARKET_CARD_GAP = Spacing.md;
const SNAP_INTERVAL = MARKET_CARD_WIDTH + MARKET_CARD_GAP;

interface MarketData {
  name: string;
  symbol: string;
  value: string;
  change: number;
  icon: string;
}

interface InvestmentVehicle {
  id: string;
  name: string;
  category: string;
  riskLevel: 'Low' | 'Medium' | 'High';
  historicalReturn: number;
  minInvestment: number;
  description: string;
  expertVerified: boolean;
  icon: string;
  color: string;
}

const MARKET_DATA: MarketData[] = [
  { name: 'S&P 500', symbol: 'SPX', value: '5,875', change: 1.2, icon: 'trending-up' },
  { name: 'Gold', symbol: 'GLD', value: '£2,645', change: 0.8, icon: 'layers' },
  { name: 'Tech Index', symbol: 'QQQ', value: '512', change: 2.1, icon: 'hardware-chip' },
  { name: 'Oil', symbol: 'WTI', value: '£78.45', change: -0.5, icon: 'water' },
];

const INVESTMENT_VEHICLES: InvestmentVehicle[] = [
  {
    id: '1',
    name: 'Low-Cost Index ETF',
    category: 'ETF',
    riskLevel: 'Low',
    historicalReturn: 8.5,
    minInvestment: 100,
    description:
      'Broad market exposure with minimal fees. Perfect for long-term wealth building.',
    expertVerified: true,
    icon: 'bar-chart',
    color: '#10B981',
  },
  {
    id: '2',
    name: 'High-Yield Savings',
    category: 'Savings Account',
    riskLevel: 'Low',
    historicalReturn: 4.5,
    minInvestment: 0,
    description:
      'FDIC-insured savings with competitive interest rates. Zero risk, steady growth.',
    expertVerified: true,
    icon: 'wallet',
    color: '#14B8A6',
  },
  {
    id: '3',
    name: 'Dividend Growth ETF',
    category: 'ETF',
    riskLevel: 'Medium',
    historicalReturn: 9.2,
    minInvestment: 250,
    description:
      'Quality companies with consistent dividend payments. Income + growth.',
    expertVerified: true,
    icon: 'cash',
    color: '#F59E0B',
  },
  {
    id: '4',
    name: 'Bond Fund',
    category: 'Bonds',
    riskLevel: 'Low',
    historicalReturn: 5.8,
    minInvestment: 500,
    description:
      'Stable income from government and corporate bonds. Lower volatility.',
    expertVerified: true,
    icon: 'document-text',
    color: '#6366F1',
  },
  {
    id: '5',
    name: 'Growth Tech ETF',
    category: 'ETF',
    riskLevel: 'High',
    historicalReturn: 12.5,
    minInvestment: 500,
    description:
      'High-growth technology companies. Higher risk, higher potential returns.',
    expertVerified: true,
    icon: 'rocket',
    color: '#8B5CF6',
  },
  {
    id: '6',
    name: 'Real Estate Fund',
    category: 'REIT',
    riskLevel: 'Medium',
    historicalReturn: 7.8,
    minInvestment: 1000,
    description:
      'Diversified real estate investment trust. Rental income + property appreciation.',
    expertVerified: true,
    icon: 'home',
    color: '#EC4899',
  },
];

const VERIFIED_RESOURCES = [
  {
    id: '1',
    title: 'The Financial Diet',
    type: 'YouTube',
    description: 'Personal finance for the rest of us.',
    icon: 'logo-youtube',
    color: '#FF0000',
    link: 'https://www.youtube.com/c/thefinancialdiet',
  },
  {
    id: '2',
    title: 'Morning Brew',
    type: 'Newsletter',
    description: 'Daily business news found in your inbox.',
    icon: 'mail',
    color: '#6C5CE7',
    link: 'https://www.morningbrew.com',
  },
  {
    id: '3',
    title: 'Graham Stephan',
    type: 'YouTube',
    description: 'Real estate investing and financial independence.',
    icon: 'logo-youtube',
    color: '#FF0000',
    link: 'https://www.youtube.com/c/GrahamStephan',
  },
  {
    id: '4',
    title: 'The Hustle',
    type: 'Newsletter',
    description: 'Tech and business news for the smart.',
    icon: 'mail',
    color: '#00BFA5',
    link: 'https://thehustle.co',
  },
];

function PulsingDot({ color }: { color: string }) {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 2.4,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ]),
        Animated.parallel([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
          Animated.timing(opacityAnim, {
            toValue: 1,
            duration: 0,
            useNativeDriver: true,
          }),
        ]),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim, opacityAnim]);

  return (
    <View style={styles.pulsingDotContainer}>
      <Animated.View
        style={[
          styles.pulsingDotRing,
          {
            backgroundColor: color,
            transform: [{ scale: pulseAnim }],
            opacity: opacityAnim,
          },
        ]}
      />
      <View style={[styles.pulsingDotCore, { backgroundColor: color }]} />
    </View>
  );
}

// ... imports
// import { useRouter } from 'expo-router'; // Removed

export default function InvestScreen() {
  const [selectedVehicle, setSelectedVehicle] =
    useState<InvestmentVehicle | null>(null);
  const [timeHorizon] = useState(10);

  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const insets = useSafeAreaInsets();
  const {
    profile,
    financialData,
    totalSavings,
  } = useFinancialData();

  const currency = profile?.currency || financialData?.currency || '£';
  const monthlySavings = financialData?.monthlySavings || 0;
  const savingsGoal = financialData?.savingsGoal || profile?.savingsGoal || 0;

  // Use real monthly savings or savings goal for investment projections
  const investmentAmount = monthlySavings > 0 ? monthlySavings : savingsGoal > 0 ? savingsGoal : 500;

  const calculateProjectedReturn = (
    vehicle: InvestmentVehicle,
    amount: number,
    years: number,
  ) => {
    const rate = vehicle.historicalReturn / 100;
    const futureValue = amount * Math.pow(1 + rate, years);
    return futureValue;
  };

  const generateCurvePath = (vehicle: InvestmentVehicle) => {
    const chartWidth = width - 80;
    const chartHeight = 120;
    const points = 20;
    const rate = vehicle.historicalReturn / 100;
    const maxValue = investmentAmount * Math.pow(1 + rate, timeHorizon);

    const dataPoints: { x: number; y: number }[] = [];
    for (let i = 0; i <= points; i++) {
      const x = (i / points) * chartWidth;
      const years = (i / points) * timeHorizon;
      const value = investmentAmount * Math.pow(1 + rate, years);
      const y = chartHeight - (value / maxValue) * chartHeight * 0.7 - 15;
      dataPoints.push({ x, y });
    }

    let path = `M ${dataPoints[0].x} ${dataPoints[0].y}`;
    for (let i = 0; i < dataPoints.length - 1; i++) {
      const current = dataPoints[i];
      const next = dataPoints[i + 1];
      const cpx1 = current.x + (next.x - current.x) / 3;
      const cpy1 = current.y;
      const cpx2 = next.x - (next.x - current.x) / 3;
      const cpy2 = next.y;
      path += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${next.x} ${next.y}`;
    }

    return path;
  };

  const generateFillPath = (vehicle: InvestmentVehicle) => {
    const chartWidth = width - 80;
    const chartHeight = 120;
    const curvePath = generateCurvePath(vehicle);
    const lastPoint = chartWidth;
    return `${curvePath} L ${lastPoint} ${chartHeight} L 0 ${chartHeight} Z`;
  };

  const handleSelectVehicle = (vehicle: InvestmentVehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    if (selectedVehicle?.id === vehicle.id) {
      setSelectedVehicle(null);
    } else {
      setSelectedVehicle(vehicle);
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'Low':
        return Colors.glowingGreen;
      case 'Medium':
        return Colors.sunKissedAmber;
      case 'High':
        return Colors.radiantMagenta;
      default:
        return Colors.mediumGray;
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 120 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[Typography.labelMedium, styles.headerBrand]}>
              MARKET PULSE
            </Text>
            <Text style={[Typography.displaySmall, styles.headerTitle, { color: isDark ? Colors.white : Colors.primaryText }]}>
              Build Your Portfolio
            </Text>
          </View>
          <PressableScale
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            scaleValue={0.92}
            style={styles.infoButton}
          >
            <Ionicons
              name="analytics-outline"
              size={24}
              color={Colors.electricTeal}
            />
          </PressableScale>
        </View>

        {/* Your Savings Power Card */}
        <GlassCard style={{ marginBottom: Spacing.lg, marginHorizontal: Spacing.md }}>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
            <View>
              <Text style={[Typography.labelMedium, { color: Colors.tertiaryText, marginBottom: 4 }]}>
                INVESTABLE ASSETS
              </Text>
              <Text style={[Typography.displayMedium, { color: Colors.electricTeal, fontWeight: '800' }]}>
                {currency}{totalSavings.toFixed(0)}
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.secondaryText, marginTop: 2 }]}>
                Total Savings
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={[Typography.labelMedium, { color: Colors.tertiaryText, marginBottom: 4 }]}>
                MONTHLY GOAL
              </Text>
              <Text style={[Typography.titleLarge, { color: Colors.amethyst, fontWeight: '700' }]}>
                {currency}{savingsGoal.toFixed(0)}
              </Text>
              <Text style={[Typography.bodySmall, { color: Colors.secondaryText, marginTop: 2 }]}>
                per month
              </Text>
            </View>
          </View>
        </GlassCard>

        {/* Live Market Pulse */}
        <View style={styles.marketPulseSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <PulsingDot color={Colors.glowingGreen} />
              <Text style={[Typography.titleLarge, { color: Colors.primaryText, marginLeft: 8 }]}>
                Market Pulse
              </Text>
            </View>
            <Text style={[Typography.bodySmall, { color: Colors.tertiaryText }]}>
              Updated 2m ago
            </Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marketCards}
            decelerationRate="fast"
            snapToInterval={SNAP_INTERVAL}
            snapToAlignment="start"
          >
            {MARKET_DATA.map((market, index) => (
              <GlassCard
                key={index}
                style={styles.marketCardOuter}
                animated
                delay={index * 120}
              >
                <View style={styles.marketHeader}>
                  <Ionicons name={market.icon as any} size={24} color={Colors.electricTeal} />
                  <View
                    style={[
                      styles.changeIndicator,
                      {
                        backgroundColor:
                          market.change >= 0
                            ? Colors.glowingGreen
                            : Colors.radiantMagenta,
                      },
                    ]}
                  >
                    <Ionicons
                      name={
                        market.change >= 0
                          ? 'trending-up'
                          : 'trending-down'
                      }
                      size={14}
                      color="#FFFFFF"
                    />
                  </View>
                </View>
                <Text
                  style={[
                    Typography.labelMedium,
                    { color: Colors.tertiaryText, marginBottom: Spacing.xs },
                  ]}
                >
                  {market.symbol}
                </Text>
                <Text
                  style={[
                    Typography.titleLarge,
                    { color: Colors.primaryText, marginBottom: Spacing.xs },
                  ]}
                >
                  {market.value}
                </Text>
                <Text
                  style={[
                    Typography.titleSmall,
                    {
                      color:
                        market.change >= 0
                          ? Colors.glowingGreen
                          : Colors.radiantMagenta,
                      fontWeight: '700',
                    },
                  ]}
                >
                  {market.change >= 0 ? '+' : ''}
                  {market.change}%
                </Text>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Verified Resources Section */}
        <View style={styles.resourcesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons name="school-outline" size={24} color={Colors.amethyst} />
              <Text style={[Typography.titleLarge, { color: Colors.primaryText, marginLeft: 8 }]}>
                Learn to Invest
              </Text>
            </View>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.resourcesList}
            snapToInterval={260}
            decelerationRate="fast"
          >
            {VERIFIED_RESOURCES.map((resource, index) => (
              <GlassCard
                key={resource.id}
                style={styles.resourceCard}
                animated
                delay={index * 100}
              >
                <View style={styles.resourceHeader}>
                  <View style={[styles.resourceIcon, { backgroundColor: resource.color + '15' }]}>
                    <Ionicons name={resource.icon as any} size={20} color={resource.color} />
                  </View>
                  <View style={[styles.resourceBadge, { backgroundColor: resource.color + '10' }]}>
                    <Text style={[styles.resourceType, { color: resource.color }]}>
                      {resource.type}
                    </Text>
                  </View>
                </View>
                <Text style={[Typography.titleMedium, { color: Colors.primaryText, marginBottom: 4 }]}>
                  {resource.title}
                </Text>
                <Text style={[Typography.bodySmall, { color: Colors.tertiaryText }]} numberOfLines={2}>
                  {resource.description}
                </Text>
              </GlassCard>
            ))}
          </ScrollView>
        </View>

        {/* Expert-Verified Investment Vehicles */}
        <View style={styles.vehiclesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="shield-checkmark"
                size={24}
                color={Colors.electricTeal}
              />
              <Text style={[Typography.titleLarge, { color: Colors.primaryText, marginLeft: 8 }]}>
                Verified Vehicles
              </Text>
            </View>
          </View>

          <View style={styles.vehiclesList}>
            {INVESTMENT_VEHICLES.map((vehicle) => {
              const isSelected = selectedVehicle?.id === vehicle.id;

              return (
                <PressableScale
                  key={vehicle.id}
                  onPress={() => handleSelectVehicle(vehicle)}
                  scaleValue={0.98}
                  style={styles.vehicleCardWrapper}
                >
                  <GlassCard
                    style={[
                      styles.vehicleCard,
                      isSelected && { borderColor: Colors.electricTeal, borderWidth: 2 }
                    ]}
                  >
                    <View style={styles.vehicleHeader}>
                      <View
                        style={[
                          styles.vehicleIcon,
                          { backgroundColor: vehicle.color + '20' },
                        ]}
                      >
                        <Ionicons name={vehicle.icon as any} size={24} color={vehicle.color} />
                      </View>
                      <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleTopRow}>
                          <Text
                            style={[
                              Typography.titleMedium,
                              {
                                color: Colors.primaryText,
                                flex: 1,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {vehicle.name}
                          </Text>
                          {vehicle.expertVerified && (
                            <View
                              style={[
                                styles.verifiedBadge,
                                {
                                  backgroundColor:
                                    Colors.electricTeal,
                                },
                              ]}
                            >
                              <Ionicons
                                name="checkmark"
                                size={12}
                                color="#FFFFFF"
                              />
                            </View>
                          )}
                        </View>
                        <Text
                          style={[
                            Typography.labelMedium,
                            { color: Colors.tertiaryText },
                          ]}
                        >
                          {vehicle.category}
                        </Text>
                      </View>
                    </View>

                    <Text
                      style={[
                        Typography.bodyMedium,
                        {
                          color: Colors.secondaryText,
                          marginBottom: Spacing.md,
                        },
                      ]}
                    >
                      {vehicle.description}
                    </Text>

                    <View style={styles.vehicleStats}>
                      <View style={styles.statItem}>
                        <Text
                          style={[
                            Typography.labelSmall,
                            {
                              color: Colors.tertiaryText,
                              marginBottom: Spacing.xs,
                            },
                          ]}
                        >
                          Historical Return
                        </Text>
                        <Text
                          style={[
                            Typography.titleSmall,
                            {
                              color: vehicle.color,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {vehicle.historicalReturn}% p.a.
                        </Text>
                      </View>
                      <View
                        style={[
                          styles.statDivider,
                          { backgroundColor: Colors.glassBorder },
                        ]}
                      />
                      <View style={styles.statItem}>
                        <Text
                          style={[
                            Typography.labelSmall,
                            {
                              color: Colors.tertiaryText,
                              marginBottom: Spacing.xs,
                            },
                          ]}
                        >
                          Risk Level
                        </Text>
                        <View style={styles.riskBadge}>
                          <View
                            style={[
                              styles.riskDot,
                              {
                                backgroundColor: getRiskColor(
                                  vehicle.riskLevel,
                                ),
                              },
                            ]}
                          />
                          <Text
                            style={[
                              Typography.titleSmall,
                              {
                                color: Colors.primaryText,
                                fontWeight: '700',
                              },
                            ]}
                          >
                            {vehicle.riskLevel}
                          </Text>
                        </View>
                      </View>
                      <View
                        style={[
                          styles.statDivider,
                          { backgroundColor: Colors.glassBorder },
                        ]}
                      />
                      <View style={styles.statItem}>
                        <Text
                          style={[
                            Typography.labelSmall,
                            {
                              color: Colors.tertiaryText,
                              marginBottom: Spacing.xs,
                            },
                          ]}
                        >
                          Min. Investment
                        </Text>
                        <Text
                          style={[
                            Typography.titleSmall,
                            {
                              color: Colors.primaryText,
                              fontWeight: '700',
                            },
                          ]}
                        >
                          {currency}{vehicle.minInvestment}
                        </Text>
                      </View>
                    </View>

                    {/* Projection Visualization */}
                    {isSelected && (
                      <View
                        style={[
                          styles.projectionSection,
                          { borderTopColor: Colors.glassBorder },
                        ]}
                      >
                        <View style={styles.projectionHeader}>
                          <Text
                            style={[
                              Typography.titleMedium,
                              {
                                color: Colors.primaryText,
                                fontWeight: '700',
                                marginBottom: Spacing.xs,
                              },
                            ]}
                          >
                            Growth Projection
                          </Text>
                          <Text style={[Typography.bodySmall, { color: Colors.secondaryText }]}>
                            {timeHorizon} Years @ {currency}{monthlySavings}/mo
                          </Text>
                        </View>

                        <View style={styles.chartContainer}>
                          <Svg height="120" width={width - 80}>
                            <Defs>
                              <SvgGradient id="grad" x1="0" y1="0" x2="0" y2="1">
                                <Stop offset="0" stopColor={vehicle.color} stopOpacity="0.4" />
                                <Stop offset="1" stopColor={vehicle.color} stopOpacity="0" />
                              </SvgGradient>
                            </Defs>
                            <Path
                              d={generateFillPath(vehicle)}
                              fill="url(#grad)"
                            />
                            <Path
                              d={generateCurvePath(vehicle)}
                              stroke={vehicle.color}
                              strokeWidth="3"
                              fill="none"
                            />
                          </Svg>
                        </View>

                        <View style={styles.projectedValueContainer}>
                          <Text style={[Typography.titleSmall, { color: Colors.tertiaryText }]}>
                            Projected Value
                          </Text>
                          <Text style={[Typography.displaySmall, { color: vehicle.color }]}>
                            {currency}{calculateProjectedReturn(vehicle, investmentAmount * 12 * 10, 1).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </Text>
                        </View>
                      </View>
                    )}
                  </GlassCard>
                </PressableScale>
              );
            })}
          </View>
        </View>
      </ScrollView >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.richBlack,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  header: {
    marginBottom: Spacing.xl,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
  },
  headerBrand: {
    color: Colors.electricTeal,
    letterSpacing: 2,
    marginBottom: 4,
  },
  headerTitle: {
    color: Colors.white,
  },
  subtitle: {
    color: Colors.electricTeal,
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderColor: 'rgba(255,255,255,0.1)',
  },
  marketPulseSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  marketCards: {
    paddingHorizontal: Spacing.md,
  },
  marketCardOuter: {
    width: MARKET_CARD_WIDTH,
    marginRight: MARKET_CARD_GAP,
    padding: Spacing.md,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  changeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDotContainer: {
    width: 12,
    height: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDotRing: {
    position: 'absolute',
    width: 24,
    height: 24,
    borderRadius: 12,
  },
  pulsingDotCore: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  resourcesSection: {
    marginBottom: Spacing.xl,
  },
  resourcesList: {
    paddingHorizontal: Spacing.md,
  },
  resourceCard: {
    width: 240,
    marginRight: Spacing.md,
    padding: Spacing.md,
  },
  resourceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  resourceIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resourceBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: BorderRadius.sm,
  },
  resourceType: {
    ...Typography.bodySmall,
    fontWeight: '700',
    fontSize: 10,
  },
  vehiclesSection: {
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.xl,
  },
  vehiclesList: {
    gap: Spacing.md,
  },
  vehicleCardWrapper: {
    marginBottom: Spacing.xs,
  },
  vehicleCard: {
    padding: Spacing.lg,
  },
  vehicleCardGradient: {
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
  },
  selectedGlowOverlay: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: BorderRadius.lg,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
  },
  vehicleIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: Spacing.md,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  verifiedBadge: {
    width: 16,
    height: 16,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  vehicleStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: 24,
    marginHorizontal: Spacing.sm,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  projectionSection: {
    marginTop: Spacing.lg,
    paddingTop: Spacing.lg,
    borderTopWidth: 1,
  },
  projectionHeader: {
    marginBottom: Spacing.md,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.md,
    height: 120,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  projectedValueContainer: {
    alignItems: 'center',
  },
  title: {
    color: Colors.white,
  },
});
