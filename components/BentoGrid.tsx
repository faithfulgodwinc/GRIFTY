import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/contexts/ThemeContext';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius, Shadows } from '@/constants/Theme';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Defs, LinearGradient as SvgGradient, Stop } from 'react-native-svg';

interface BentoGridProps {
    streakDays: number;
    burnRate: number; // 0-100 percentage of daily limit used effectively
    forecast: number; // Amount remaining for tomorrow
    currency: string;
}

// ─── Sub-Component: Burn Rate Gauge ──────────────────────────────────────────
function BurnRateGauge({ rate }: { rate: number }) {
    const size = 80;
    const strokeWidth = 8;
    const radius = (size - strokeWidth) / 2;
    const circumference = Math.PI * radius; // Semi-circle
    const clampedRate = Math.max(0, Math.min(rate, 100));
    const strokeDashoffset = circumference - (circumference * clampedRate) / 100;

    return (
        <View style={{ width: size, height: size / 2, alignItems: 'center', justifyContent: 'flex-end', overflow: 'hidden' }}>
            <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                <Defs>
                    <SvgGradient id="burnGrad" x1="0" y1="0" x2="1" y2="0">
                        <Stop offset="0%" stopColor="#34D399" />
                        <Stop offset="50%" stopColor="#F59E0B" />
                        <Stop offset="100%" stopColor="#EF4444" />
                    </SvgGradient>
                </Defs>
                {/* Background Arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="rgba(255,255,255,0.1)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeLinecap="round"
                    rotation="-180"
                    origin={`${size / 2}, ${size / 2}`}
                />
                {/* Progress Arc */}
                <Circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    stroke="url(#burnGrad)"
                    strokeWidth={strokeWidth}
                    fill="none"
                    strokeDasharray={`${circumference} ${circumference}`}
                    strokeDashoffset={strokeDashoffset}
                    strokeLinecap="round"
                    rotation="-180"
                    origin={`${size / 2}, ${size / 2}`}
                />
            </Svg>
        </View>
    );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export function BentoGrid({ streakDays, burnRate, forecast, currency }: BentoGridProps) {
    const { theme } = useTheme();
    const isDark = theme === 'dark';
    const Colors = getThemeColors(isDark);

    return (
        <View style={styles.container}>

            {/* Block 1: The Streak (Big Square) */}
            <View style={[styles.card, styles.streakCard]}>
                <LinearGradient
                    colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F1F5F9']}
                    style={StyleSheet.absoluteFill}
                />
                <View style={styles.cardHeader}>
                    <Ionicons name="flame" size={24} color={Colors.sunKissedAmber} />
                    <Text style={[Typography.titleMedium, { color: Colors.primaryText }]}>Streak</Text>
                </View>
                <View style={styles.streakContent}>
                    <Text style={[Typography.displayLarge, { color: Colors.primaryText, fontSize: 56 }]}>
                        {streakDays}
                    </Text>
                    <Text style={[Typography.labelMedium, { color: Colors.tertiaryText }]}>DAYS</Text>
                </View>
            </View>

            {/* Right Column */}
            <View style={styles.rightColumn}>

                {/* Block 2: Burn Rate (Wide Rectangle) */}
                <View style={[styles.card, styles.smallCard]}>
                    <LinearGradient
                        colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F1F5F9']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.rowBetween}>
                        <View style={{ flex: 1, paddingRight: 4 }}>
                            <Text style={[Typography.labelSmall, { color: Colors.tertiaryText, fontSize: 10 }]} numberOfLines={1}>BURN RATE</Text>
                            <Text style={[Typography.headlineSmall, { color: Colors.primaryText, fontSize: 20 }]}>{burnRate}%</Text>
                        </View>
                        <BurnRateGauge rate={burnRate} />
                    </View>
                </View>

                {/* Block 3: Forecast (Wide Rectangle) */}
                <View style={[styles.card, styles.smallCard]}>
                    <LinearGradient
                        colors={isDark ? ['#1E293B', '#0F172A'] : ['#FFFFFF', '#F1F5F9']}
                        style={StyleSheet.absoluteFill}
                    />
                    <View style={styles.cardContent}>
                        <Text style={[Typography.labelSmall, { color: Colors.tertiaryText, fontSize: 10 }]} numberOfLines={1}>TOMORROW</Text>
                        <Text
                            style={[
                                Typography.headlineSmall,
                                { color: Colors.electricTeal, fontSize: 20, marginVertical: 2 }
                            ]}
                            numberOfLines={1}
                            adjustsFontSizeToFit
                        >
                            {currency}{forecast.toFixed(2)}
                        </Text>
                        <Text style={[Typography.labelSmall, { color: Colors.tertiaryText, fontSize: 9 }]} numberOfLines={1}>
                            Estimated Rollover
                        </Text>
                    </View>
                </View>

            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.xl,
        height: 180,
    },
    card: {
        borderRadius: 24,
        overflow: 'hidden',
        padding: Spacing.md,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    streakCard: {
        flex: 1,
        justifyContent: 'space-between',
    },
    rightColumn: {
        flex: 1,
        flexDirection: 'column',
        gap: Spacing.md,
    },
    smallCard: {
        flex: 1,
        justifyContent: 'center',
    },
    cardHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    streakContent: {
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1,
    },
    rowBetween: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    cardContent: {
        justifyContent: 'center',
    }
});
