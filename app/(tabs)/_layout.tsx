import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { ProtectedLayout } from '@fastshot/auth';
import { getThemeColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';
import { Typography } from '@/constants/Theme';
import { useCoachMarks } from '@/contexts/CoachMarksContext';
import { CoachMarkOverlay } from '@/components/CoachMarks/CoachMarkOverlay';
import { SuccessCelebration } from '@/components/CoachMarks/SuccessCelebration';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const { checkTourStatus, isTourActive } = useCoachMarks();
  const [showSuccess, setShowSuccess] = useState(false);

  const bottomPadding = Math.max(insets.bottom, 20);
  const tabBarHeight = 72;
  const totalHeight = tabBarHeight + bottomPadding;

  // Check tour status on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      checkTourStatus();
    }, 1000);
    return () => clearTimeout(timer);
  }, [checkTourStatus]);

  // Watch for tour completion
  useEffect(() => {
    if (!isTourActive && showSuccess === false) {
      // Tour just completed, show success
      const checkCompletion = async () => {
        // Small delay to ensure completion animation finishes
        setTimeout(() => {
          setShowSuccess(true);
        }, 300);
      };
      checkCompletion();
    }
  }, [isTourActive]);

  return (
    <ErrorBoundary>
      <ProtectedLayout redirectTo="/(auth)/login">
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: Colors.electricTeal,
        tabBarInactiveTintColor: isDark ? 'rgba(139, 146, 160, 0.5)' : Colors.tertiaryText,
        tabBarBackground: () =>
          isDark ? (
            <View style={StyleSheet.absoluteFill}>
              <BlurView
                intensity={40}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: 'rgba(10, 6, 18, 0.82)',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(255, 255, 255, 0.06)',
                  },
                ]}
              />
            </View>
          ) : null,
        tabBarStyle: {
          backgroundColor: isDark ? 'transparent' : Colors.white,
          borderTopColor: isDark ? 'transparent' : Colors.glassBorder,
          borderTopWidth: isDark ? 0 : 1,
          paddingBottom: bottomPadding,
          height: totalHeight,
          paddingTop: 10,
          shadowColor: isDark ? 'rgba(45, 212, 191, 0.06)' : 'rgba(0, 0, 0, 0.04)',
          shadowOffset: { width: 0, height: isDark ? -2 : -1 },
          shadowOpacity: 1,
          shadowRadius: isDark ? 20 : 12,
          elevation: isDark ? 12 : 8,
          position: isDark ? 'absolute' : 'relative' as const,
          ...(isDark && {
            left: 0,
            right: 0,
            bottom: 0,
          }),
        },
        tabBarLabelStyle: {
          fontSize: Typography.labelSmall.fontSize,
          fontWeight: Typography.labelSmall.fontWeight,
          letterSpacing: Typography.labelSmall.letterSpacing,
          marginTop: 2,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="savings"
        options={{
          title: 'Savings',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="invest"
        options={{
          title: 'Invest',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          href: null,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={22} color={color} />
            </View>
          ),
        }}
      />
      </Tabs>
      <CoachMarkOverlay />
      <SuccessCelebration
        visible={showSuccess}
        onClose={() => {
          setShowSuccess(false);
        }}
      />
      </ProtectedLayout>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  activeIconGlow: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 6,
  },
});
