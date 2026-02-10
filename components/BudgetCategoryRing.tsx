import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { LinearGradient } from 'expo-linear-gradient';

interface BudgetCategoryRingProps {
  label: string;
  allocated: number;
  spent: number;
  currency: string;
  size?: number;
  strokeWidth?: number;
  tealColor?: string;
  amberColor?: string;
}

export const BudgetCategoryRing: React.FC<BudgetCategoryRingProps> = ({
  label,
  allocated,
  spent,
  currency,
  size = 100,
  strokeWidth = 10,
  tealColor = '#14B8A6',
  amberColor = '#F59E0B',
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percentage = allocated > 0 ? (spent / allocated) * 100 : 0;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  // Color transitions from Teal to Amber as limit approaches
  const getStrokeColor = () => {
    if (percentage < 70) return tealColor;
    if (percentage < 90) return '#F59E0B'; // Amber
    return '#EF4444'; // Red for over-budget
  };

  return (
    <View style={styles.container}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={getStrokeColor()}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <View style={[styles.centerContent, { width: size, height: size }]}>
        <Text style={styles.percentage}>{Math.round(percentage)}%</Text>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.amount}>
          {currency}{spent.toFixed(0)}/{allocated.toFixed(0)}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  percentage: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  label: {
    fontSize: 11,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 2,
  },
  amount: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginTop: 2,
  },
});
