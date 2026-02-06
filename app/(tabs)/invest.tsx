import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { useTheme } from '@/contexts/ThemeContext';
import Svg, { Path, Circle, Line } from 'react-native-svg';

const { width } = Dimensions.get('window');

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
  { name: 'Gold', symbol: 'GLD', value: '$2,645', change: 0.8, icon: '🏆' },
  { name: 'Tech Index', symbol: 'QQQ', value: '512', change: 2.1, icon: '💻' },
  { name: 'Oil', symbol: 'WTI', value: '$78.45', change: -0.5, icon: '🛢️' },
];

const INVESTMENT_VEHICLES: InvestmentVehicle[] = [
  {
    id: '1',
    name: 'Low-Cost Index ETF',
    category: 'ETF',
    riskLevel: 'Low',
    historicalReturn: 8.5,
    minInvestment: 100,
    description: 'Broad market exposure with minimal fees. Perfect for long-term wealth building.',
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
    description: 'FDIC-insured savings with competitive interest rates. Zero risk, steady growth.',
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
    description: 'Quality companies with consistent dividend payments. Income + growth.',
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
    description: 'Stable income from government and corporate bonds. Lower volatility.',
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
    description: 'High-growth technology companies. Higher risk, higher potential returns.',
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
    description: 'Diversified real estate investment trust. Rental income + property appreciation.',
    expertVerified: true,
    icon: '🏠',
    color: '#EC4899',
  },
];

export default function InvestScreen() {
  const [selectedVehicle, setSelectedVehicle] = useState<InvestmentVehicle | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState(1000);
  const [timeHorizon, setTimeHorizon] = useState(10);
  const { theme } = useTheme();

  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  const calculateProjectedReturn = (vehicle: InvestmentVehicle, amount: number, years: number) => {
    const rate = vehicle.historicalReturn / 100;
    const futureValue = amount * Math.pow(1 + rate, years);
    return futureValue;
  };

  const generateProjectionPath = (vehicle: InvestmentVehicle) => {
    const chartWidth = width - 80;
    const chartHeight = 120;
    const points = 20;
    const rate = vehicle.historicalReturn / 100;

    let path = `M 0 ${chartHeight}`;

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * chartWidth;
      const years = (i / points) * timeHorizon;
      const value = investmentAmount * Math.pow(1 + rate, years);
      const maxValue = investmentAmount * Math.pow(1 + rate, timeHorizon);
      const y = chartHeight - (value / maxValue) * chartHeight * 0.7 - 15;

      path += ` L ${x} ${y}`;
    }

    return path;
  };

  const handleSelectVehicle = (vehicle: InvestmentVehicle) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setSelectedVehicle(vehicle);
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
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.title, { color: Colors.primaryText }]}>Investment Hub</Text>
            <Text style={[styles.subtitle, { color: Colors.electricTeal }]}>
              Expert-verified wealth building
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.infoButton, { backgroundColor: Colors.white, borderColor: Colors.glassBorder }]}
            onPress={() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)}
          >
            <Ionicons name="information-circle-outline" size={24} color={Colors.electricTeal} />
          </TouchableOpacity>
        </View>

        {/* Live Market Pulse */}
        <View style={styles.marketPulseSection}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleContainer}>
              <View style={[styles.pulseIndicator, { backgroundColor: Colors.glowingGreen }]} />
              <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>Live Market Pulse</Text>
            </View>
            <Text style={[styles.lastUpdated, { color: Colors.tertiaryText }]}>Updated 2m ago</Text>
          </View>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.marketCards}
          >
            {MARKET_DATA.map((market, index) => (
              <GlassCard key={index} style={styles.marketCard}>
                <View style={styles.marketHeader}>
                  <Text style={styles.marketIcon}>{market.icon}</Text>
                  <View style={[styles.changeIndicator, { backgroundColor: market.change >= 0 ? Colors.glowingGreen : Colors.error }]}>
                    <Ionicons
                      name={market.change >= 0 ? 'trending-up' : 'trending-down'}
                      size={14}
                      color={Colors.white}
                    />
                  </View>
                </View>
                <Text style={[styles.marketSymbol, { color: Colors.tertiaryText }]}>{market.symbol}</Text>
                <Text style={[styles.marketValue, { color: Colors.primaryText }]}>{market.value}</Text>
                <Text
                  style={[
                    styles.marketChange,
                    { color: market.change >= 0 ? Colors.glowingGreen : Colors.error },
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
              <Ionicons name="shield-checkmark" size={20} color={Colors.electricTeal} />
              <Text style={[styles.sectionTitle, { color: Colors.primaryText }]}>
                Expert-Verified Vehicles
              </Text>
            </View>
          </View>

          <View style={styles.vehiclesList}>
            {INVESTMENT_VEHICLES.map((vehicle) => (
              <TouchableOpacity
                key={vehicle.id}
                style={styles.vehicleCard}
                onPress={() => handleSelectVehicle(vehicle)}
                activeOpacity={0.8}
              >
                <LinearGradient
                  colors={
                    selectedVehicle?.id === vehicle.id
                      ? [Colors.electricTeal + '15', Colors.amethyst + '15']
                      : [Colors.white, Colors.white]
                  }
                  style={[
                    styles.vehicleCardGradient,
                    {
                      borderColor:
                        selectedVehicle?.id === vehicle.id
                          ? Colors.electricTeal
                          : Colors.glassBorder,
                      borderWidth: selectedVehicle?.id === vehicle.id ? 2 : 1,
                    },
                  ]}
                >
                  <View style={styles.vehicleHeader}>
                    <View style={[styles.vehicleIcon, { backgroundColor: vehicle.color + '20' }]}>
                      <Text style={styles.vehicleEmoji}>{vehicle.icon}</Text>
                    </View>
                    <View style={styles.vehicleInfo}>
                      <View style={styles.vehicleTopRow}>
                        <Text style={[styles.vehicleName, { color: Colors.primaryText }]}>
                          {vehicle.name}
                        </Text>
                        {vehicle.expertVerified && (
                          <View style={[styles.verifiedBadge, { backgroundColor: Colors.electricTeal }]}>
                            <Ionicons name="checkmark" size={12} color={Colors.white} />
                          </View>
                        )}
                      </View>
                      <Text style={[styles.vehicleCategory, { color: Colors.tertiaryText }]}>
                        {vehicle.category}
                      </Text>
                    </View>
                  </View>

                  <Text style={[styles.vehicleDescription, { color: Colors.secondaryText }]}>
                    {vehicle.description}
                  </Text>

                  <View style={styles.vehicleStats}>
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: Colors.tertiaryText }]}>
                        Historical Return
                      </Text>
                      <Text style={[styles.statValue, { color: vehicle.color }]}>
                        {vehicle.historicalReturn}% p.a.
                      </Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: Colors.tertiaryText }]}>Risk Level</Text>
                      <View style={styles.riskBadge}>
                        <View
                          style={[styles.riskDot, { backgroundColor: getRiskColor(vehicle.riskLevel) }]}
                        />
                        <Text style={[styles.statValue, { color: Colors.primaryText }]}>
                          {vehicle.riskLevel}
                        </Text>
                      </View>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.statItem}>
                      <Text style={[styles.statLabel, { color: Colors.tertiaryText }]}>Min. Investment</Text>
                      <Text style={[styles.statValue, { color: Colors.primaryText }]}>
                        £{vehicle.minInvestment}
                      </Text>
                    </View>
                  </View>

                  {/* Projection Visualization */}
                  {selectedVehicle?.id === vehicle.id && (
                    <View style={styles.projectionSection}>
                      <View style={styles.projectionHeader}>
                        <Text style={[styles.projectionTitle, { color: Colors.primaryText }]}>
                          Growth Projection
                        </Text>
                        <Text style={[styles.projectionSubtitle, { color: Colors.tertiaryText }]}>
                          £{investmentAmount} over {timeHorizon} years
                        </Text>
                      </View>

                      <View style={styles.chartContainer}>
                        <Svg width={width - 80} height={130}>
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

                          {/* Growth curve */}
                          <Path
                            d={generateProjectionPath(vehicle)}
                            stroke={vehicle.color}
                            strokeWidth={3}
                            fill="none"
                            strokeLinecap="round"
                          />

                          {/* End point */}
                          <Circle cx={width - 80} cy={15} r={6} fill={vehicle.color} />
                        </Svg>
                      </View>

                      <View style={styles.projectionResult}>
                        <View style={styles.projectionItem}>
                          <Text style={[styles.projectionLabel, { color: Colors.tertiaryText }]}>
                            Initial Investment
                          </Text>
                          <Text style={[styles.projectionValue, { color: Colors.secondaryText }]}>
                            £{investmentAmount.toLocaleString()}
                          </Text>
                        </View>
                        <Ionicons name="arrow-forward" size={20} color={Colors.mediumGray} />
                        <View style={styles.projectionItem}>
                          <Text style={[styles.projectionLabel, { color: Colors.tertiaryText }]}>
                            Projected Value
                          </Text>
                          <Text style={[styles.projectionValue, { color: vehicle.color, fontWeight: 'bold' }]}>
                            £{calculateProjectedReturn(vehicle, investmentAmount, timeHorizon).toFixed(0)}
                          </Text>
                        </View>
                      </View>

                      <View style={[styles.returnHighlight, { backgroundColor: vehicle.color + '15' }]}>
                        <Ionicons name="trending-up" size={20} color={vehicle.color} />
                        <Text style={[styles.returnText, { color: vehicle.color }]}>
                          Potential Return: £
                          {(
                            calculateProjectedReturn(vehicle, investmentAmount, timeHorizon) -
                            investmentAmount
                          ).toFixed(0)}{' '}
                          ({vehicle.historicalReturn}% annually)
                        </Text>
                      </View>
                    </View>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Disclaimer */}
        <GlassCard style={styles.disclaimerCard}>
          <View style={styles.disclaimerHeader}>
            <Ionicons name="alert-circle-outline" size={20} color={Colors.sunKissedAmber} />
            <Text style={[styles.disclaimerTitle, { color: Colors.primaryText }]}>Important Notice</Text>
          </View>
          <Text style={[styles.disclaimerText, { color: Colors.secondaryText }]}>
            Historical returns are not guaranteed. All investments carry risk. Past performance does not
            guarantee future results. Consult a financial advisor before investing.
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
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 28,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: '600',
    marginTop: 4,
  },
  infoButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    marginBottom: 32,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  lastUpdated: {
    fontSize: 12,
    fontWeight: '500',
  },
  marketCards: {
    gap: 12,
    paddingRight: 20,
  },
  marketCard: {
    width: 140,
    padding: 16,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  marketIcon: {
    fontSize: 28,
  },
  changeIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  marketSymbol: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  marketValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  marketChange: {
    fontSize: 14,
    fontWeight: '700',
  },
  vehiclesSection: {
    marginBottom: 32,
  },
  vehiclesList: {
    gap: 16,
  },
  vehicleCard: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  vehicleCardGradient: {
    padding: 20,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 4,
  },
  vehicleHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 12,
  },
  vehicleIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
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
    gap: 8,
    marginBottom: 4,
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
  },
  verifiedBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vehicleCategory: {
    fontSize: 13,
    fontWeight: '600',
  },
  vehicleDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 16,
  },
  vehicleStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  statItem: {
    flex: 1,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  statDivider: {
    width: 1,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
  },
  riskBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  riskDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  projectionSection: {
    marginTop: 20,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  projectionHeader: {
    marginBottom: 16,
  },
  projectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  projectionSubtitle: {
    fontSize: 13,
    fontWeight: '500',
  },
  chartContainer: {
    marginBottom: 20,
  },
  projectionResult: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 8,
  },
  projectionItem: {
    flex: 1,
  },
  projectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  projectionValue: {
    fontSize: 18,
    fontWeight: '600',
  },
  returnHighlight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 12,
  },
  returnText: {
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
  },
  disclaimerCard: {
    marginBottom: 20,
  },
  disclaimerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  disclaimerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  disclaimerText: {
    fontSize: 13,
    lineHeight: 20,
  },
});
