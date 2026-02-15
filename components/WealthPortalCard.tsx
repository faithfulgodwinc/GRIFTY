import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated, Platform } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

interface WealthPortalCardProps {
    spendableToday: number;
    totalLimit: number;
    wellnessScore: number;
    currency?: string;
}

// Seamless Wellness Ring integrated into the card
function IntegratedWellnessRing({ score, size = 120, strokeWidth = 6 }: { score: number; size?: number; strokeWidth?: number }) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const animatedValue = useRef(new Animated.Value(0)).current;
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const clampedScore = Math.max(0, Math.min(score, 100));

    useEffect(() => {
        Animated.timing(animatedValue, {
            toValue: clampedScore,
            duration: 1500,
            useNativeDriver: false, // SVG props often need JS driver
        }).start();
    }, [clampedScore]);

    const strokeDashoffset = circumference - (circumference * clampedScore) / 100;

    return (
        <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <SvgGradient id="wellnessGlow" x1="0" y1="0" x2="1" y2="1">
                        <Stop offset="0%" stopColor="#10B981" stopOpacity="1" />
                        <Stop offset="100%" stopColor="#34D399" stopOpacity="0.8" />
                    </SvgGradient>
                </Defs>
                {/* Background Track - Subtle */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255, 255, 255, 0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                />
                {/* Progress Arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#wellnessGlow)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-90"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
            {/* Centered Score */}
            <View style={StyleSheet.absoluteFill}>
                <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
                    <Text style={[Typography.headlineLarge, { color: isDark ? '#FFFFFF' : '#0F172A', fontSize: 32 }]}>
                        {clampedScore}
                    </Text>
                    <Text style={[Typography.labelSmall, { color: isDark ? 'rgba(255, 255, 255, 0.6)' : 'rgba(15, 23, 42, 0.6)', textTransform: 'uppercase', letterSpacing: 1 }]}>
                        Wellness
                    </Text>
                </View>
            </View>
        </View>
    );
}

export function WealthPortalCard({
    spendableToday,
    totalLimit,
    currency = '₦',
}: Omit<WealthPortalCardProps, 'wellnessScore'>) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const Colors = getThemeColors(isDark);

    // Subtle breathing animation for the background mesh
    const meshAnim = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.loop(
            Animated.sequence([
                Animated.timing(meshAnim, { toValue: 1, duration: 4000, useNativeDriver: false }),
                Animated.timing(meshAnim, { toValue: 0, duration: 4000, useNativeDriver: false }),
            ])
        ).start();
    }, []);

    const gradientColors = isDark
        ? ['#0A0A0C', '#0A0A0C']
        : ['#FFFFFF', '#FFFFFF'];

    return (
        <View style={[styles.container, Shadows.medium]}>
            {/* Background Layer with Mesh Gradient Simulation */}
            <LinearGradient
                colors={gradientColors as any}
                style={StyleSheet.absoluteFill}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
            />

            {/* Glass Overlay for depth */}
            <BlurView intensity={isDark ? 40 : 20} tint={isDark ? 'dark' : 'light'} style={StyleSheet.absoluteFill} />

            {/* Content Container */}
            <View style={styles.content}>
                <View style={styles.leftColumn}>
                    <Text style={[Typography.labelSmall, styles.label]}>SPENDABLE TODAY</Text>
                    <View style={styles.amountContainer}>
                        <Text style={[Typography.displayMedium, styles.currency, { color: Colors.electricTeal }]}>
                            {currency}
                        </Text>
                        <Text style={[Typography.displayLarge, styles.amount, { color: Colors.primaryText }]}>
                            {Math.floor(spendableToday).toLocaleString()}
                        </Text>
                        <Text style={[Typography.titleMedium, styles.decimals, { color: Colors.tertiaryText }]}>
                            .{spendableToday.toFixed(2).split('.')[1]}
                        </Text>
                    </View>

                    {/* Progress Bar (Integrated) */}
                    <View style={styles.progressBarContainer}>
                        <View style={[styles.progressBarFill, { width: `${Math.min((spendableToday / totalLimit) * 100, 100)}%`, backgroundColor: Colors.electricTeal }]} />
                    </View>
                    <Text style={[Typography.labelSmall, { color: Colors.tertiaryText, marginTop: Spacing.xs }]}>
                        {currency}{spendableToday.toFixed(2)} remaining of {currency}{totalLimit.toFixed(2)}
                    </Text>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        borderRadius: 32, // Large rounded corners for premium feel
        overflow: 'hidden',
        height: 220,
        width: '100%',
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.08)',
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        padding: Spacing.xl,
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    leftColumn: {
        flex: 1,
        justifyContent: 'center',
    },
    rightColumn: {
        justifyContent: 'center',
        alignItems: 'center',
    },
    label: {
        color: '#94A3B8', // Slate 400
        letterSpacing: 1.5,
        marginBottom: Spacing.xs,
    },
    amountContainer: {
        flexDirection: 'row',
        alignItems: 'flex-start', // Align currency top
    },
    currency: {
        fontSize: 24,
        lineHeight: 32,
        marginTop: 6,
        fontWeight: '600',
    },
    amount: {
        fontSize: 48,
        fontWeight: '800',
        letterSpacing: -1.5,
    },
    decimals: {
        fontSize: 20,
        marginTop: 6,
        marginLeft: 2,
        fontWeight: '600',
    },
    progressBarContainer: {
        height: 6,
        backgroundColor: 'rgba(255, 255, 255, 0.1)',
        borderRadius: BorderRadius.round,
        marginTop: Spacing.lg,
        overflow: 'hidden',
        width: '90%',
    },
    progressBarFill: {
        height: '100%',
        borderRadius: BorderRadius.round,
    }
});
