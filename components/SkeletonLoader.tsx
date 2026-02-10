import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';
import { getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';
import { Spacing, BorderRadius } from '@/constants/Theme';

interface SkeletonLoaderProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: ViewStyle;
}

function SkeletonItem({ width = '100%', height = 20, borderRadius = BorderRadius.md, style }: SkeletonLoaderProps) {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 0.7,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {
          width: width as any,
          height,
          borderRadius,
          backgroundColor: isDark ? 'rgba(45, 27, 61, 0.6)' : 'rgba(0, 0, 0, 0.06)',
          opacity: pulseAnim,
        },
        style,
      ]}
    />
  );
}

// Dashboard skeleton
export function DashboardSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  return (
    <View style={styles.container}>
      {/* Header skeleton */}
      <View style={styles.header}>
        <View>
          <SkeletonItem width={180} height={32} borderRadius={BorderRadius.md} />
          <SkeletonItem width={120} height={16} borderRadius={BorderRadius.sm} style={{ marginTop: Spacing.sm }} />
        </View>
        <SkeletonItem width={48} height={48} borderRadius={24} />
      </View>

      {/* Main card skeleton */}
      <View style={[styles.card, { backgroundColor: Colors.cardBackground, borderColor: Colors.glassBorder }]}>
        <View style={styles.cardHeader}>
          <SkeletonItem width={100} height={16} />
          <SkeletonItem width={120} height={28} />
        </View>
        <SkeletonItem width="100%" height={12} borderRadius={6} style={{ marginTop: Spacing.md }} />
        <SkeletonItem width={160} height={14} style={{ marginTop: Spacing.md }} />
      </View>

      {/* Metric cards */}
      <View style={styles.metricsRow}>
        <View style={[styles.metricCard, { backgroundColor: Colors.cardBackground, borderColor: Colors.glassBorder }]}>
          <SkeletonItem width={40} height={40} borderRadius={BorderRadius.md} />
          <SkeletonItem width={80} height={20} style={{ marginTop: Spacing.sm }} />
          <SkeletonItem width={60} height={12} style={{ marginTop: Spacing.xs }} />
        </View>
        <View style={[styles.metricCard, { backgroundColor: Colors.cardBackground, borderColor: Colors.glassBorder }]}>
          <SkeletonItem width={40} height={40} borderRadius={BorderRadius.md} />
          <SkeletonItem width={80} height={20} style={{ marginTop: Spacing.sm }} />
          <SkeletonItem width={60} height={12} style={{ marginTop: Spacing.xs }} />
        </View>
      </View>

      {/* Button skeleton */}
      <SkeletonItem width="100%" height={56} borderRadius={20} style={{ marginTop: Spacing.md }} />

      {/* Section skeleton */}
      <SkeletonItem width={140} height={20} style={{ marginTop: Spacing.xl }} />
      <View style={[styles.card, { backgroundColor: Colors.cardBackground, borderColor: Colors.glassBorder, marginTop: Spacing.md }]}>
        <SkeletonItem width="100%" height={16} />
        <SkeletonItem width="80%" height={16} style={{ marginTop: Spacing.sm }} />
        <SkeletonItem width="60%" height={16} style={{ marginTop: Spacing.sm }} />
      </View>
    </View>
  );
}

// Chat skeleton
export function ChatSkeleton() {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  return (
    <View style={styles.chatContainer}>
      {[0, 1, 2].map((i) => (
        <View key={i} style={[styles.chatBubble, i % 2 === 1 && styles.chatBubbleRight]}>
          {i % 2 === 0 && <SkeletonItem width={32} height={32} borderRadius={16} />}
          <View style={[
            styles.chatBubbleContent,
            {
              backgroundColor: Colors.cardBackground,
              borderColor: Colors.glassBorder,
            },
          ]}>
            <SkeletonItem width={i % 2 === 0 ? 180 : 140} height={14} />
            <SkeletonItem width={i % 2 === 0 ? 140 : 100} height={14} style={{ marginTop: 6 }} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: 120,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
  },
  card: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  metricsRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.md,
  },
  metricCard: {
    flex: 1,
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.lg,
    alignItems: 'center',
  },
  chatContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.md,
  },
  chatBubble: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: Spacing.sm,
  },
  chatBubbleRight: {
    justifyContent: 'flex-end',
  },
  chatBubbleContent: {
    borderRadius: 20,
    borderWidth: 1,
    padding: Spacing.md,
  },
});

export { SkeletonItem };
