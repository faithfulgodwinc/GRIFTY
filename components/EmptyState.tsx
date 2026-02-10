import React from 'react';
import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { PressableScale } from './PressableScale';
import { Spacing, Typography, BorderRadius } from '@/constants/Theme';

interface EmptyStateProps {
  icon: string;
  iconColor?: string;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  gradientColors?: readonly [string, string, ...string[]];
  style?: ViewStyle;
}

export function EmptyState({
  icon,
  iconColor,
  title,
  description,
  actionLabel,
  onAction,
  gradientColors,
  style,
}: EmptyStateProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  const defaultGradient: readonly [string, string] = [Colors.electricTeal, Colors.glowingGreen];
  const resolvedGradient = gradientColors || defaultGradient;

  return (
    <View style={[styles.container, style]}>
      {/* Decorative icon container */}
      <View style={[styles.iconContainer, { backgroundColor: isDark ? 'rgba(45, 27, 61, 0.4)' : 'rgba(0, 0, 0, 0.03)' }]}>
        <LinearGradient
          colors={[`${iconColor || Colors.electricTeal}20`, `${iconColor || Colors.amethyst}10`]}
          style={styles.iconGradient}
        >
          <Ionicons
            name={icon as any}
            size={40}
            color={iconColor || Colors.electricTeal}
          />
        </LinearGradient>
      </View>

      {/* Decorative dots */}
      <View style={styles.dotsRow}>
        {[0, 1, 2].map((i) => (
          <View
            key={i}
            style={[
              styles.dot,
              {
                backgroundColor: isDark
                  ? `rgba(45, 212, 191, ${0.15 + i * 0.1})`
                  : `rgba(20, 184, 166, ${0.1 + i * 0.08})`,
                width: 4 + i * 2,
                height: 4 + i * 2,
                borderRadius: (4 + i * 2) / 2,
              },
            ]}
          />
        ))}
      </View>

      <Text style={[styles.title, { color: Colors.primaryText }]}>{title}</Text>
      <Text style={[styles.description, { color: Colors.tertiaryText }]}>{description}</Text>

      {actionLabel && onAction && (
        <PressableScale onPress={onAction} style={styles.actionButton}>
          <LinearGradient
            colors={resolvedGradient}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
          >
            <Ionicons name="add-circle-outline" size={20} color="#FFFFFF" />
            <Text style={styles.actionText}>{actionLabel}</Text>
          </LinearGradient>
        </PressableScale>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.lg,
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  iconGradient: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: Spacing.md,
  },
  dot: {},
  title: {
    ...Typography.headlineSmall,
    textAlign: 'center',
    marginBottom: Spacing.sm,
  },
  description: {
    ...Typography.bodyMedium,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 280,
    marginBottom: Spacing.lg,
  },
  actionButton: {
    borderRadius: BorderRadius.xxl,
    overflow: 'hidden',
    shadowColor: '#14B8A6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: 14,
    paddingHorizontal: Spacing.lg,
  },
  actionText: {
    ...Typography.titleSmall,
    color: '#FFFFFF',
  },
});
