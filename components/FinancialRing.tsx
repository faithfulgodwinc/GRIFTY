import React, { useEffect } from 'react';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { Colors } from '@/constants/Colors';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface FinancialRingProps {
  value: number;
  maxValue: number;
  color: string;
  size: number;
  strokeWidth: number;
}

export function FinancialRing({ value, maxValue, color, size, strokeWidth }: FinancialRingProps) {
  const progress = useSharedValue(0);
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withTiming(Math.min(value / maxValue, 1), {
      duration: 1500,
      easing: Easing.bezier(0.4, 0, 0.2, 1),
    });
  }, [value, maxValue]);

  const animatedProps = useAnimatedProps(() => ({
    strokeDashoffset: circumference * (1 - progress.value),
  }));

  return (
    <Svg width={size} height={size} style={{ transform: [{ rotate: '-90deg' }] }}>
      {/* Background circle */}
      <Circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={Colors.lightGray}
        strokeWidth={strokeWidth}
        fill="none"
        opacity={0.2}
      />
      {/* Progress circle */}
      <AnimatedCircle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        animatedProps={animatedProps}
        strokeLinecap="round"
      />
    </Svg>
  );
}
