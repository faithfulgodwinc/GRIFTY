import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { BlurView } from 'expo-blur';
import { Colors } from '@/constants/Colors';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
}

export function GlassCard({ children, style, intensity = 20 }: GlassCardProps) {
  return (
    <View style={[styles.container, style]}>
      <BlurView intensity={intensity} style={styles.blur}>
        <View style={styles.content}>
          {children}
        </View>
      </BlurView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  blur: {
    backgroundColor: Colors.cardBackground,
  },
  content: {
    padding: 20,
  },
});
