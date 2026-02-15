import React, { useEffect, useState } from 'react';
import { View, StyleSheet, Platform, ActivityIndicator } from 'react-native';
import { Tabs, router } from 'expo-router';
import { useFinancialData } from '@/contexts/FinancialDataContext';
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
import { GlobalPaywallWrapper } from '@/components/premium/GlobalPaywallWrapper';

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

  // Check onboarding status
  const { profile, isLoading } = useFinancialData();

  useEffect(() => {
    if (!isLoading) {
      if (!profile || !profile.blueprintComplete) {
        router.replace('/blueprint-setup');
      }
    }
  }, [isLoading, profile]);

  if (isLoading || !profile) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.background, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={Colors.electricTeal} />
      </View>
    );
  }

  return (
    <ErrorBoundary>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: Colors.electricTeal,
          tabBarInactiveTintColor: isDark ? 'rgba(139, 146, 160, 0.5)' : Colors.tertiaryText,
          tabBarBackground: () => (
            <View style={StyleSheet.absoluteFill}>
              {/* Blur Effect */}
              <BlurView
                intensity={Platform.OS === 'ios' ? 80 : 100}
                tint={isDark ? 'dark' : 'light'}
                style={StyleSheet.absoluteFill}
              />
              {/* Color Overlay - High transparency for glass effect, but enough to be readable */}
              <View
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark ? 'rgba(10, 10, 12, 0.85)' : 'rgba(255, 255, 255, 0.85)',
                    borderTopWidth: 1,
                    borderTopColor: isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.05)',
                  },
                ]}
              />
            </View>
          ),
          tabBarStyle: {
            backgroundColor: isDark ? 'transparent' : Colors.white,
            borderTopColor: isDark ? 'transparent' : Colors.glassBorder,
            borderTopWidth: isDark ? 0 : 1,
            paddingBottom: bottomPadding,
            height: totalHeight,
            paddingTop: 10,
            shadowColor: '#000',
            shadowOffset: { width: 0, height: -2 },
            shadowOpacity: 0.05,
            shadowRadius: 10,
            elevation: 5,
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
            marginTop: 4,
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="savings"
          options={{
            title: 'Savings',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
            ),
          }}
        />
        <Tabs.Screen
          name="invest"
          options={{
            title: 'Invest',
            tabBarIcon: ({ color, focused }) => (
              <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={24} color={color} />
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
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
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
      <GlobalPaywallWrapper />
    </ErrorBoundary >
  );
}

const styles = StyleSheet.create({
  // Removed activeIconGlow style
});
