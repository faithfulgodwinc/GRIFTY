import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Dimensions,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { GlassCard } from '@/components/GlassCard';
import { PressableScale } from '@/components/PressableScale';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
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
  { name: 'S&P 500', symbol: 'SPX', value: '5,875', change: 1.2, icon: '📈' },
  { name: 'Gold', symbol: 'GLD', value: '£2,645', change: 0.8, icon: '🏆' },
  { name: 'Tech Index', symbol: 'QQQ', value: '512', change: 2.1, icon: '💻' },
  { name: 'Oil', symbol: 'WTI', value: '£78.45', change: -0.5, icon: '🛢️' },
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
    icon: '📊',
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
    icon: '💰',
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
    icon: '💵',
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
    icon: '📜',
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
    icon: '🚀',
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
    icon: '🏠',
    color: '#EC4899',
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

export default function InvestScreen() {
  const [selectedVehicle, setSelectedVehicle] =
    useState<InvestmentVehicle | null>(null);
  const [investmentAmount] = useState(1000);
  const [timeHorizon] = useState(10);
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

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
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text
              style={[
                styles.title,
                Typography.displaySmall,
                { color: Colors.primaryText },
              ]}
            >
              Investment Hub
            </Text>
            <Text
              style={[
                styles.subtitle,
                Typography.titleSmall,
                { color: Colors.electricTeal },
              ]}
            >
              Expert-verified wealth building
            </Text>
          </View>
          <PressableScale
            onPress={() =>
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
            }
            scaleValue={0.92}
            style={[
              styles.infoButton,
              {
                backgroundColor: isDark
                  ? Colors.cardBackground
                  : Colors.white,
                borderColor: Colors.glassBorder,
              },
            ]}
          >
            <Ionicons
              name="information-circle-outline"
              size={24}
              color={Colors.electricTeal}
            />
          </PressableScale>
        </View>

        {/* Live Market Pulse */}
        <View style={styles.marketPulseSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <PulsingDot color={Colors.glowingGreen} />
              <Text
                style={[
                  Typography.headlineSmall,
                  { color: Colors.primaryText },
                ]}
              >
                Live Market Pulse
              </Text>
            </View>
            <Text
              style={[
                Typography.bodySmall,
                { color: Colors.tertiaryText },
              ]}
            >
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
                  <Text style={styles.marketIcon}>{market.icon}</Text>
                  <View
                    style={[
                      styles.changeIndicator,
                      {
                        backgroundColor:
                          market.change >= 0
                            ? Colors.glowingGreen
                            : Colors.error,
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
                    Typography.headlineSmall,
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
                          : Colors.error,
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

        {/* Expert-Verified Investment Vehicles */}
        <View style={styles.vehiclesSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <Ionicons
                name="shield-checkmark"
                size={20}
                color={Colors.electricTeal}
              />
              <Text
                style={[
                  Typography.headlineSmall,
                  { color: Colors.primaryText },
                ]}
              >
                Expert-Verified Vehicles
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
                  <LinearGradient
                    colors={
                      isSelected
                        ? ([
                            Colors.electricTeal + '15',
                            Colors.amethyst + '15',
                          ] as const)
                        : isDark
                          ? ([
                              'rgba(20, 10, 36, 0.85)',
                              'rgba(20, 10, 36, 0.85)',
                            ] as const)
                          : ([Colors.white, Colors.white] as const)
                    }
                    style={[
                      styles.vehicleCardGradient,
                      {
                        borderColor: isSelected
                          ? Colors.electricTeal
                          : Colors.glassBorder,
                        borderWidth: isSelected ? 2 : 1,
                      },
                    ]}
                  >
                    {/* Selected glow overlay */}
                    {isSelected && (
                      <View
                        style={[
                          styles.selectedGlowOverlay,
                          {
                            shadowColor: Colors.electricTeal,
                          },
                        ]}
                      />
                    )}

                    <View style={styles.vehicleHeader}>
                      <View
                        style={[
                          styles.vehicleIcon,
                          { backgroundColor: vehicle.color + '20' },
                        ]}
                      >
                        <Text style={styles.vehicleEmoji}>
                          {vehicle.icon}
                        </Text>
                      </View>
                      <View style={styles.vehicleInfo}>
                        <View style={styles.vehicleTopRow}>
                          <Text
                            style={[
                              Typography.titleLarge,
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
                          £{vehicle.minInvestment}
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
                          <Text
                            style={[
                              Typography.bodySmall,
                              { color: Colors.tertiaryText },
                            ]}
                          >
                            £{investmentAmount.toLocaleString()} over{' '}
                            {timeHorizon} years
                          </Text>
                        </View>

                        <View style={styles.chartContainer}>
                          <Svg
                            width={width - 80}
                            height={130}
                          >
                            <Defs>
                              <SvgGradient
                                id={`chartGrad-${vehicle.id}`}
                                x1="0"
                                y1="0"
                                x2="0"
                                y2="1"
                              >
                                <Stop
                                  offset="0%"
                                  stopColor={vehicle.color}
                                  stopOpacity="0.35"
                                />
                                <Stop
                                  offset="100%"
                                  stopColor={vehicle.color}
                                  stopOpacity="0.02"
                                />
                              </SvgGradient>
                            </Defs>

                            {/* Grid lines */}
                            <Line
                              x1={0}
                              y1={120}
                              x2={width - 80}
                              y2={120}
                              stroke={Colors.glassBorder}
                              strokeWidth={1}
                              strokeDasharray="4,4"
                            />
                            <Line
                              x1={0}
                              y1={80}
                              x2={width - 80}
                              y2={80}
                              stroke={Colors.glassBorder}
                              strokeWidth={1}
                              strokeDasharray="4,4"
                            />
                            <Line
                              x1={0}
                              y1={40}
                              x2={width - 80}
                              y2={40}
                              stroke={Colors.glassBorder}
                              strokeWidth={1}
                              strokeDasharray="4,4"
                            />

                            {/* Gradient fill under curve */}
                            <Path
                              d={generateFillPath(vehicle)}
                              fill={`url(#chartGrad-${vehicle.id})`}
                            />

                            {/* Smooth growth curve */}
                            <Path
                              d={generateCurvePath(vehicle)}
                              stroke={vehicle.color}
                              strokeWidth={3}
                              fill="none"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />

                            {/* Start point */}
                            <Circle
                              cx={0}
                              cy={
                                120 -
                                (1 / Math.pow(1 + vehicle.historicalReturn / 100, timeHorizon)) *
                                  120 *
                                  0.7 -
                                15
                              }
                              r={4}
                              fill={vehicle.color}
                              opacity={0.6}
                            />

                            {/* End point with halo */}
                            <Circle
                              cx={width - 80}
                              cy={15}
                              r={10}
                              fill={vehicle.color}
                              opacity={0.15}
                            />
                            <Circle
                              cx={width - 80}
                              cy={15}
                              r={6}
                              fill={vehicle.color}
                            />
                          </Svg>
                        </View>

                        <View style={styles.projectionResult}>
                          <View style={styles.projectionItem}>
                            <Text
                              style={[
                                Typography.labelMedium,
                                {
                                  color: Colors.tertiaryText,
                                  marginBottom: Spacing.xs,
                                },
                              ]}
                            >
                              Initial Investment
                            </Text>
                            <Text
                              style={[
                                Typography.titleLarge,
                                {
                                  color: Colors.secondaryText,
                                },
                              ]}
                            >
                              £
                              {investmentAmount.toLocaleString()}
                            </Text>
                          </View>
                          <Ionicons
                            name="arrow-forward"
                            size={20}
                            color={Colors.mediumGray}
                          />
                          <View
                            style={[
                              styles.projectionItem,
                              { alignItems: 'flex-end' },
                            ]}
                          >
                            <Text
                              style={[
                                Typography.labelMedium,
                                {
                                  color: Colors.tertiaryText,
                                  marginBottom: Spacing.xs,
                                },
                              ]}
                            >
                              Projected Value
                            </Text>
                            <Text
                              style={[
                                Typography.titleLarge,
                                {
                                  color: vehicle.color,
                                  fontWeight: '800',
                                },
                              ]}
                            >
                              £
                              {calculateProjectedReturn(
                                vehicle,
                                investmentAmount,
                                timeHorizon,
                              ).toFixed(0)}
                            </Text>
                          </View>
                        </View>

                        <View
                          style={[
                            styles.returnHighlight,
                            {
                              backgroundColor:
                                vehicle.color + '15',
                              borderColor:
                                vehicle.color + '20',
                            },
                          ]}
                        >
                          <Ionicons
                            name="trending-up"
                            size={20}
                            color={vehicle.color}
                          />
                          <Text
                            style={[
                              Typography.titleSmall,
                              {
                                color: vehicle.color,
                                fontWeight: '700',
                                flex: 1,
                              },
                            ]}
                          >
                            Potential Return: £
                            {(
                              calculateProjectedReturn(
                                vehicle,
                                investmentAmount,
                                timeHorizon,
                              ) - investmentAmount
                            ).toFixed(0)}{' '}
                            ({vehicle.historicalReturn}% annually)
                          </Text>
                        </View>
                      </View>
                    )}
                  </LinearGradient>
                </PressableScale>
              );
            })}
          </View>
        </View>

        {/* Disclaimer */}
        <GlassCard style={styles.disclaimerCardOuter} animated delay={200}>
          <View style={styles.disclaimerHeader}>
            <Ionicons
              name="alert-circle-outline"
              size={20}
              color={Colors.sunKissedAmber}
            />
            <Text
              style={[
                Typography.titleSmall,
                { color: Colors.primaryText, fontWeight: '700' },
              ]}
            >
              Important Notice
            </Text>
          </View>
          <Text
            style={[
              Typography.bodySmall,
              { color: Colors.secondaryText, lineHeight: 20 },
            ]}
          >
            Historical returns are not guaranteed. All investments carry risk.
            Past performance does not guarantee future results. Consult a
            financial advisor before investing.
          </Text>
        </GlassCard>
      </ScrollView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 140,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  title: {
    marginBottom: Spacing.xs,
  },
  subtitle: {
    marginTop: Spacing.xs,
  },
  infoButton: {
    width: Spacing.xxxl,
    height: Spacing.xxxl,
    borderRadius: BorderRadius.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  marketPulseSection: {
    marginBottom: Spacing.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  pulsingDotContainer: {
    width: Spacing.md,
    height: Spacing.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pulsingDotRing: {
    position: 'absolute',
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
  },
  pulsingDotCore: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
  },
  marketCards: {
    gap: MARKET_CARD_GAP,
    paddingRight: Spacing.lg,
  },
  marketCardOuter: {
    width: MARKET_CARD_WIDTH,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  marketIcon: {
    fontSize: 28,
  },
  changeIndicator: {
    width: Spacing.lg,
    height: Spacing.lg,
    borderRadius: BorderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehiclesSection: {
    marginBottom: Spacing.xl,
  },
  vehiclesList: {
    gap: Spacing.md,
  },
  vehicleCardWrapper: {
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  vehicleCardGradient: {
    padding: Spacing.lg,
    borderRadius: BorderRadius.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  selectedGlowOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: BorderRadius.xl,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 0,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: Spacing.md,
    gap: Spacing.md,
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.lg,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleEmoji: {
    fontSize: 28,
  },
  vehicleInfo: {
    flex: 1,
  },
  vehicleTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  statItem: {
    flex: 1,
  },
  statDivider: {
    width: 1,
    height: Spacing.xl,
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskDot: {
    width: Spacing.sm,
    height: Spacing.sm,
    borderRadius: Spacing.xs,
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
    marginBottom: Spacing.lg,
  },
  projectionResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
    paddingHorizontal: Spacing.sm,
  },
  projectionItem: {
    flex: 1,
  },
  returnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
  },
  disclaimerCardOuter: {
    marginBottom: Spacing.lg,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
});
