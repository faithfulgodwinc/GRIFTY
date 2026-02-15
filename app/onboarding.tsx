import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
  FlatList,
  Animated,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, Shadows, BorderRadius } from '@/constants/Theme';
import { storage } from '@/utils/storage';
import * as Haptics from 'expo-haptics';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { useTheme } from '@/contexts/ThemeContext';

const { width, height } = Dimensions.get('window');

const slides = [
  {
    id: '1',
    title: 'Master Your\nMoney Flow',
    description: 'Track savings like a pro. Build wealth without the overwhelm.',
    icon: 'wallet-outline',
  },
  {
    id: '2',
    title: 'Secure Their\nFuture',
    description: 'Smart strategies that grow while you focus on what matters most.',
    icon: 'shield-checkmark-outline',
  },
  {
    id: '3',
    title: 'Your Personal\nWealth Coach',
    description: 'AI-powered guidance that understands your life. Real results, zero judgment.',
    icon: 'sparkles-outline',
  },
];

export default function OnboardingScreen() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const slidesRef = useRef<FlatList>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const { theme } = useTheme();
  const Colors = getThemeColors(theme === 'dark');
  const Gradients = getGradients(theme === 'dark');

  React.useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleNext = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    if (currentIndex < slides.length - 1) {
      slidesRef.current?.scrollToIndex({ index: currentIndex + 1 });
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    await storage.setOnboardingComplete(true);
    router.replace('/(auth)/signup');
  };

  const viewableItemsChanged = useRef(({ viewableItems }: any) => {
    setCurrentIndex(viewableItems[0]?.index || 0);
  }).current;

  const viewConfig = useRef({ viewAreaCoveragePercentThreshold: 50 }).current;

  const renderSlide = ({ item, index }: any) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];

    const scale = scrollX.interpolate({
      inputRange,
      outputRange: [0.8, 1, 0.8],
      extrapolate: 'clamp',
    });

    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0.3, 1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <View style={styles.slide}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale }], opacity }]}>
          <LinearGradient
            colors={theme === 'dark' ? ['rgba(255,255,255,0.1)', 'rgba(255,255,255,0.05)'] : ['rgba(0,0,0,0.05)', 'rgba(0,0,0,0.02)']}
            style={[styles.iconCircle, { borderColor: Colors.glassBorder }]}
          >
            <Ionicons name={item.icon} size={80} color={Colors.electricTeal} />
          </LinearGradient>
          <View style={[styles.glowRing, { borderColor: Colors.electricTeal }]} />
        </Animated.View>

        <View style={styles.textContainer}>
          <Text style={[Typography.displayMedium, styles.title, { color: Colors.primaryText }]}>{item.title}</Text>
          <Text style={[Typography.bodyLarge, styles.description, { color: Colors.secondaryText }]}>{item.description}</Text>
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: Colors.background }]}>
      <LinearGradient colors={Gradients.mesh} style={StyleSheet.absoluteFill} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} />

      {/* Abstract Background Shapes */}
      <View style={[styles.bgShape1, { backgroundColor: Colors.electricTeal }]} />
      <View style={[styles.bgShape2, { backgroundColor: Colors.amethyst }]} />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <FlatList
          ref={slidesRef}
          data={slides}
          renderItem={renderSlide}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          bounces={false}
          keyExtractor={(item) => item.id}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { x: scrollX } } }],
            { useNativeDriver: false }
          )}
          onViewableItemsChanged={viewableItemsChanged}
          viewabilityConfig={viewConfig}
        />

        <View style={styles.footer}>
          <View style={styles.pagination}>
            {slides.map((_, index) => {
              const inputRange = [
                (index - 1) * width,
                index * width,
                (index + 1) * width,
              ];

              const dotWidth = scrollX.interpolate({
                inputRange,
                outputRange: [8, 24, 8],
                extrapolate: 'clamp',
              });

              const dotOpacity = scrollX.interpolate({
                inputRange,
                outputRange: [0.4, 1, 0.4],
                extrapolate: 'clamp',
              });

              return (
                <Animated.View
                  key={index}
                  style={[
                    styles.dot,
                    {
                      width: dotWidth,
                      opacity: dotOpacity,
                      backgroundColor: currentIndex === index ? Colors.electricTeal : Colors.tertiaryText,
                    },
                  ]}
                />
              );
            })}
          </View>

          <TouchableOpacity
            style={[styles.buttonWrapper, Shadows.glow(Colors.radiantMagenta)]}
            onPress={handleNext}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={Gradients.primary}
              style={styles.button}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={[styles.buttonText, { color: Colors.white }]}>
                {currentIndex === slides.length - 1 ? "Start Your Journey" : 'Continue'}
              </Text>
              <Ionicons
                name={currentIndex === slides.length - 1 ? "rocket-outline" : "arrow-forward"}
                size={20}
                color={Colors.white}
                style={{ marginLeft: 8 }}
              />
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginButton}
            onPress={() => {
              Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
              router.push('/(auth)/login');
            }}
          >
            <Text style={[Typography.bodyMedium, { color: Colors.secondaryText }]}>
              Already have an account? <Text style={{ color: Colors.electricTeal, fontWeight: '700' }}>Log In</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View >
    </View >
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  bgShape1: {
    position: 'absolute',
    top: -100,
    left: -100,
    width: 400,
    height: 400,
    borderRadius: 200,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  bgShape2: {
    position: 'absolute',
    bottom: -50,
    right: -50,
    width: 300,
    height: 300,
    borderRadius: 150,
    opacity: 0.15,
    transform: [{ scale: 1.5 }],
  },
  content: {
    flex: 1,
    justifyContent: 'space-between',
  },
  slide: {
    width,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  iconContainer: {
    marginBottom: Spacing.xxl,
    justifyContent: 'center',
    alignItems: 'center',
    width: 160,
    height: 160,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  glowRing: {
    position: 'absolute',
    width: 160,
    height: 160,
    borderRadius: 80,
    borderWidth: 1,
    opacity: 0.3,
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    textAlign: 'center',
    marginBottom: Spacing.md,
  },
  description: {
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 24,
  },
  footer: {
    paddingBottom: Platform.OS === 'ios' ? 60 : 40,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  pagination: {
    flexDirection: 'row',
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: Spacing.xl,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  buttonWrapper: {
    width: '100%',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 18,
    borderRadius: BorderRadius.round,
  },
  buttonText: {
    ...Typography.titleMedium,
    fontWeight: '700',
  },
  loginButton: {
    paddingVertical: 16,
    alignItems: 'center',
  },
});
