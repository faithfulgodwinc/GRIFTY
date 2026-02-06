import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { ProtectedLayout } from '@fastshot/auth';
import { getThemeColors } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ErrorBoundary } from '@/components/ErrorBoundary';
import { useTheme } from '@/contexts/ThemeContext';
import { BlurView } from 'expo-blur';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);

  // Calculate safe bottom padding - ensure minimum 20px gap for that floating feel
  const bottomPadding = Math.max(insets.bottom, 20);
  const tabBarHeight = 70; // Base tab bar height
  const totalHeight = tabBarHeight + bottomPadding;

  return (
    <ErrorBoundary>
      <ProtectedLayout redirectTo="/(auth)/login">
      <Tabs
        screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: isDark ? Colors.electricTeal : Colors.electricTeal,
        tabBarInactiveTintColor: isDark ? 'rgba(156, 163, 175, 0.6)' : Colors.mediumGray,
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
                    backgroundColor: 'rgba(10, 6, 18, 0.75)',
                    borderTopWidth: 1,
                    borderTopColor: 'rgba(45, 212, 191, 0.15)',
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
          paddingTop: 12,
          shadowColor: isDark ? '#2DD4BF' : '#000',
          shadowOffset: { width: 0, height: isDark ? -4 : -2 },
          shadowOpacity: isDark ? 0.15 : 0.06,
          shadowRadius: isDark ? 16 : 8,
          elevation: isDark ? 12 : 8,
          position: isDark ? 'absolute' : 'relative' as const,
          ...(isDark && {
            left: 0,
            right: 0,
            bottom: 0,
          }),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 4,
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'home' : 'home-outline'} size={24} color={color} />
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
              <Ionicons name={focused ? 'wallet' : 'wallet-outline'} size={24} color={color} />
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
              <Ionicons name={focused ? 'trending-up' : 'trending-up-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="coach"
        options={{
          title: 'Coach',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'chatbubbles' : 'chatbubbles-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, focused }) => (
            <View style={focused && isDark ? styles.activeIconGlow : undefined}>
              <Ionicons name={focused ? 'person' : 'person-outline'} size={24} color={color} />
            </View>
          ),
        }}
      />
      </Tabs>
      </ProtectedLayout>
    </ErrorBoundary>
  );
}

const styles = StyleSheet.create({
  activeIconGlow: {
    shadowColor: '#2DD4BF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 8,
    elevation: 6,
  },
});
