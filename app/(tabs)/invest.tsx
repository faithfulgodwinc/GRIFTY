import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import * as Haptics from 'expo-haptics';
import Svg, { Path, Circle } from 'react-native-svg';

const { width } = Dimensions.get('window');

type RiskLevel = 'safe' | 'steady' | 'aggressive';

const RISK_PROFILES = {
  safe: { returnRate: 0.05, color: Colors.glowingGreen, label: 'Safe' },
  steady: { returnRate: 0.08, color: Colors.sunKissedAmber, label: 'Steady' },
  aggressive: { returnRate: 0.12, color: Colors.radiantMagenta, label: 'Aggressive' },
};

export default function InvestScreen() {
  const [investAmount, setInvestAmount] = useState(100);
  const [duration, setDuration] = useState(10);
  const [riskLevel, setRiskLevel] = useState<RiskLevel>('steady');
  const [projectedReturn, setProjectedReturn] = useState(0);

  useEffect(() => {
    calculateReturn();
  }, [investAmount, duration, riskLevel]);

  const calculateReturn = () => {
    const rate = RISK_PROFILES[riskLevel].returnRate;
    const futureValue = investAmount * Math.pow(1 + rate, duration);
    setProjectedReturn(futureValue);
  };

  const generateChartPath = () => {
    const chartWidth = width - 80;
    const chartHeight = 200;
    const points = 20;
    const rate = RISK_PROFILES[riskLevel].returnRate;

    let path = `M 0 ${chartHeight}`;

    for (let i = 0; i <= points; i++) {
      const x = (i / points) * chartWidth;
      const years = (i / points) * duration;
      const value = investAmount * Math.pow(1 + rate, years);
      const maxValue = investAmount * Math.pow(1 + rate, duration);
      const y = chartHeight - (value / maxValue) * chartHeight * 0.8 - 20;

      path += ` L ${x} ${y}`;
    }

    return path;
  };

  const handleRiskChange = (level: RiskLevel) => {
    setRiskLevel(level);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  return (
    <LinearGradient colors={[Colors.background, Colors.darkPurple]} style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Future Fund Simulator</Text>
          <Text style={styles.subtitle}>Plan your kids' financial future</Text>
        </View>

        {/* Investment Chart */}
        <GlassCard style={styles.chartCard}>
          <Text style={styles.chartTitle}>Growth Projection</Text>
          <View style={styles.chartContainer}>
            <Svg width={width - 80} height={220}>
              {/* Grid lines */}
              <Path
                d={`M 0 220 L ${width - 80} 220`}
                stroke={Colors.glassBorder}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <Path
                d={`M 0 165 L ${width - 80} 165`}
                stroke={Colors.glassBorder}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <Path
                d={`M 0 110 L ${width - 80} 110`}
                stroke={Colors.glassBorder}
                strokeWidth={1}
                strokeDasharray="4,4"
              />
              <Path
                d={`M 0 55 L ${width - 80} 55`}
                stroke={Colors.glassBorder}
                strokeWidth={1}
                strokeDasharray="4,4"
              />

              {/* Growth curve */}
              <Path
                d={generateChartPath()}
                stroke={RISK_PROFILES[riskLevel].color}
                strokeWidth={4}
                fill="none"
                strokeLinecap="round"
              />

              {/* End point */}
              <Circle
                cx={width - 80}
                cy={20}
                r={8}
                fill={RISK_PROFILES[riskLevel].color}
              />
            </Svg>
          </View>

          <View style={styles.projectionContainer}>
            <Text style={styles.projectionLabel}>Projected Value in {duration} years</Text>
            <LinearGradient
              colors={[RISK_PROFILES[riskLevel].color, Colors.electricTeal]}
              style={styles.projectionValue}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.projectionAmount}>£{projectedReturn.toFixed(0)}</Text>
            </LinearGradient>
            <Text style={styles.returnAmount}>
              Total Return: £{(projectedReturn - investAmount * duration * 12).toFixed(0)}
            </Text>
          </View>
        </GlassCard>

        {/* Investment Amount */}
        <GlassCard style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Monthly Investment</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.valueAmount}>£{investAmount}</Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={50}
            maximumValue={1000}
            step={10}
            value={investAmount}
            onValueChange={setInvestAmount}
            minimumTrackTintColor={Colors.electricTeal}
            maximumTrackTintColor={Colors.darkGray}
            thumbTintColor={Colors.electricTeal}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>£50</Text>
            <Text style={styles.sliderLabel}>£1000</Text>
          </View>
        </GlassCard>

        {/* Duration */}
        <GlassCard style={styles.controlCard}>
          <View style={styles.controlHeader}>
            <Text style={styles.controlLabel}>Investment Duration</Text>
            <View style={styles.valueContainer}>
              <Text style={styles.valueAmount}>{duration} years</Text>
            </View>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={30}
            step={1}
            value={duration}
            onValueChange={setDuration}
            minimumTrackTintColor={Colors.sunKissedAmber}
            maximumTrackTintColor={Colors.darkGray}
            thumbTintColor={Colors.sunKissedAmber}
          />
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabel}>1 year</Text>
            <Text style={styles.sliderLabel}>30 years</Text>
          </View>
        </GlassCard>

        {/* Risk Mode Toggle */}
        <GlassCard style={styles.riskCard}>
          <Text style={styles.controlLabel}>Risk Mode</Text>
          <View style={styles.riskButtons}>
            {(Object.keys(RISK_PROFILES) as RiskLevel[]).map((level) => (
              <TouchableOpacity
                key={level}
                style={[
                  styles.riskButton,
                  riskLevel === level && styles.riskButtonActive,
                  riskLevel === level && { borderColor: RISK_PROFILES[level].color },
                ]}
                onPress={() => handleRiskChange(level)}
                activeOpacity={0.7}
              >
                <View
                  style={[
                    styles.riskIndicator,
                    { backgroundColor: RISK_PROFILES[level].color },
                  ]}
                />
                <View>
                  <Text
                    style={[
                      styles.riskLabel,
                      riskLevel === level && { color: RISK_PROFILES[level].color },
                    ]}
                  >
                    {RISK_PROFILES[level].label}
                  </Text>
                  <Text style={styles.riskReturn}>
                    {(RISK_PROFILES[level].returnRate * 100).toFixed(0)}% annually
                  </Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        </GlassCard>

        {/* Info Box */}
        <GlassCard style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle" size={24} color={Colors.electricTeal} />
            <Text style={styles.infoTitle}>How It Works</Text>
          </View>
          <Text style={styles.infoText}>
            This simulator shows how compound interest can grow your investments over time.
            The actual returns may vary based on market conditions.
          </Text>
          <View style={styles.infoStats}>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>
                £{(investAmount * duration * 12).toFixed(0)}
              </Text>
              <Text style={styles.infoStatLabel}>Total Invested</Text>
            </View>
            <View style={styles.infoStat}>
              <Text style={styles.infoStatValue}>
                {((projectedReturn / (investAmount * duration * 12) - 1) * 100).toFixed(0)}%
              </Text>
              <Text style={styles.infoStatLabel}>Growth</Text>
            </View>
          </View>
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
    paddingBottom: 30,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: Colors.white,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.lightGray,
  },
  chartCard: {
    marginBottom: 20,
  },
  chartTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.white,
    marginBottom: 20,
  },
  chartContainer: {
    marginBottom: 20,
  },
  projectionContainer: {
    alignItems: 'center',
    marginTop: 10,
  },
  projectionLabel: {
    fontSize: 14,
    color: Colors.lightGray,
    marginBottom: 12,
  },
  projectionValue: {
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 8,
  },
  projectionAmount: {
    fontSize: 36,
    fontWeight: 'bold',
    color: Colors.white,
  },
  returnAmount: {
    fontSize: 14,
    color: Colors.electricTeal,
    fontWeight: '600',
  },
  controlCard: {
    marginBottom: 20,
  },
  controlHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  controlLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  valueContainer: {
    backgroundColor: Colors.electricTeal,
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 12,
  },
  valueAmount: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  sliderLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  sliderLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
  riskCard: {
    marginBottom: 20,
  },
  riskButtons: {
    marginTop: 16,
    gap: 12,
  },
  riskButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.cardBackground,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: Colors.glassBorder,
    padding: 16,
    gap: 16,
  },
  riskButtonActive: {
    borderWidth: 2,
  },
  riskIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  riskLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.mediumGray,
    marginBottom: 4,
  },
  riskReturn: {
    fontSize: 12,
    color: Colors.lightGray,
  },
  infoCard: {
    marginBottom: 20,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
  infoText: {
    fontSize: 14,
    color: Colors.lightGray,
    lineHeight: 20,
    marginBottom: 16,
  },
  infoStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  infoStat: {
    alignItems: 'center',
  },
  infoStatValue: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.electricTeal,
    marginBottom: 4,
  },
  infoStatLabel: {
    fontSize: 12,
    color: Colors.mediumGray,
  },
});
