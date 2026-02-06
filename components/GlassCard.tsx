import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { getThemeColors } from '@/constants/Colors';
import { useTheme } from '@/contexts/ThemeContext';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style }: GlassCardProps) {
  const { theme } = useTheme();
  const Colors = getThemeColors(theme === 'dark');

  const containerStyle = {
    borderRadius: 24,
    backgroundColor: Colors.cardBackground,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    shadowColor: theme === 'dark' ? '#2DD4BF' : '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: theme === 'dark' ? 0.15 : 0.06,
    shadowRadius: 12,
    elevation: 3,
  };

  return (
    <View style={[containerStyle, style]}>
      <View style={styles.content}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 20,
  },
});
