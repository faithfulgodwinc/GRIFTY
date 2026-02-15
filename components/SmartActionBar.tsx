import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { PressableScale } from '@/components/PressableScale';
import { LinearGradient } from 'expo-linear-gradient';

export type ActionCategory = {
    key: string;
    label: string;
    icon: keyof typeof Ionicons.glyphMap;
    color: string;
};

interface SmartActionBarProps {
    categories: ActionCategory[];
    onLogPress: () => void;
    onCategoryPress: (category: string) => void;
}

export function SmartActionBar({ categories, onLogPress, onCategoryPress }: SmartActionBarProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const Colors = getThemeColors(isDark);

    return (
        <View style={styles.container}>
            <View style={styles.headerRow}>
                <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>Quick Actions</Text>
            </View>

            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.scrollContent}
                decelerationRate="fast"
            >
                {/* Primary Log Button - Consistent Place */}
                <PressableScale onPress={onLogPress} scaleValue={0.95} style={{ marginRight: Spacing.sm }}>
                    <LinearGradient
                        colors={isDark ? ['#10B981', '#059669'] : ['#10B981', '#34D399']}
                        style={styles.primaryAction}
                        start={{ x: 0, y: 0 }}
                        end={{ x: 1, y: 1 }}
                    >
                        <Ionicons name="add" size={24} color="#FFFFFF" />
                        <Text style={[Typography.labelMedium, { color: '#FFFFFF' }]}>Log</Text>
                    </LinearGradient>
                </PressableScale>

                {/* Categories as Glass Chips */}
                {categories.map((cat, index) => (
                    <PressableScale
                        key={cat.key}
                        onPress={() => onCategoryPress(cat.key)}
                        scaleValue={0.95}
                        style={{ marginRight: index === categories.length - 1 ? 0 : Spacing.sm }}
                    >
                        <BlurView
                            intensity={isDark ? 30 : 60}
                            tint={isDark ? 'dark' : 'light'}
                            style={[
                                styles.actionChip,
                                {
                                    borderColor: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.05)',
                                    backgroundColor: isDark ? 'rgba(30,41,59,0.4)' : 'rgba(255,255,255,0.6)'
                                }
                            ]}
                        >
                            <View style={[styles.iconCircle, { backgroundColor: cat.color + '20' }]}>
                                <Ionicons name={cat.icon} size={18} color={cat.color} />
                            </View>
                            <Text style={[Typography.labelMedium, { color: Colors.secondaryText }]}>
                                {cat.label}
                            </Text>
                        </BlurView>
                    </PressableScale>
                ))}
            </ScrollView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginVertical: Spacing.lg,
    },
    headerRow: {
        paddingHorizontal: Spacing.lg,
        marginBottom: Spacing.sm,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.xs,
    },
    primaryAction: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        height: 48,
        borderRadius: BorderRadius.xl,
        gap: Spacing.xs,
        ...Platform.select({
            ios: {
                shadowColor: '#10B981',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.3,
                shadowRadius: 8,
            },
            android: { elevation: 4 },
        }),
    },
    actionChip: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: Spacing.md,
        height: 48,
        borderRadius: BorderRadius.xl,
        gap: Spacing.sm,
        borderWidth: 1,
        overflow: 'hidden',
    },
    iconCircle: {
        width: 28,
        height: 28,
        borderRadius: BorderRadius.round,
        alignItems: 'center',
        justifyContent: 'center',
    }
});
