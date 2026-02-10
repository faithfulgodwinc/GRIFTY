import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated } from 'react-native';
import { getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  animated?: boolean;
  delay?: number;
  noPadding?: boolean;
}

export function GlassCard({ children, style, animated = false, delay = 0, noPadding = false }: GlassCardProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  const fadeAnim = useRef(new Animated.Value(animated ? 0 : 1)).current;
  const slideAnim = useRef(new Animated.Value(animated ? 16 : 0)).current;

  useEffect(() => {
    if (animated) {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [animated, delay, fadeAnim, slideAnim]);

  const containerStyle = {
    borderRadius: 20,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: isDark ? 'rgba(45, 212, 191, 0.08)' : 'rgba(0, 0, 0, 0.04)',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 1,
    shadowRadius: 16,
    elevation: 3,
    overflow: 'hidden' as const,
  };

  const content = (
    <View style={containerStyle}>
      <View style={noPadding ? undefined : styles.content}>
        {children}
      </View>
    </View>
  );

  if (animated) {
    return (
      <Animated.View
        style={[
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
          style,
        ]}
      >
        {content}
      </Animated.View>
    );
  }

  return (
    <View style={style}>
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: Spacing.lg,
  },
});
