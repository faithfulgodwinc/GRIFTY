import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, ViewStyle, Animated, StyleProp } from 'react-native';
import { getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing } from '@/constants/Theme';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
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
    borderRadius: 24, // Slightly more rounded for modern feel
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: isDark ? '#000000' : 'rgba(148, 163, 184, 0.1)', // Subtler shadow color
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: isDark ? 0.3 : 1,
    shadowRadius: 24,
    elevation: 4,
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
