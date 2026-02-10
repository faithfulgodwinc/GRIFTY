import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  Alert,
  Linking,
  Animated,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { PressableScale } from '@/components/PressableScale';
import { ChatSkeleton } from '@/components/SkeletonLoader';
import { getThemeColors, getGradients } from '@/constants/Colors';
import { Typography, Spacing, BorderRadius } from '@/constants/Theme';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import * as Haptics from 'expo-haptics';
import { storage } from '@/utils/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '@/contexts/ThemeContext';
import { useFinancialData } from '@/contexts/FinancialDataContext';
import { useRouter } from 'expo-router';
import { BlurView } from 'expo-blur';
import { useSubscription } from '@/contexts/SubscriptionContext';
import { GritifyElitePaywall } from '@/components/premium/GritifyElitePaywall';
import { usePremiumFeature } from '@/hooks/usePremiumFeature';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  youtubeVideos?: YouTubeVideo[];
}

interface YouTubeVideo {
  title: string;
  videoId: string;
  thumbnail: string;
}

const QUICK_REPLIES = [
  { id: '1', text: 'How can I save £50 this week?', icon: '💰' },
  { id: '2', text: 'Best budget meal ideas?', icon: '🥗' },
  { id: '3', text: 'Analyze my spending', icon: '📊' },
  { id: '4', text: 'Tips to boost my streak', icon: '🔥' },
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  text: "Hello! I'm your AI financial P.A. How can I help you save today?",
  isUser: false,
  timestamp: new Date(),
};

// Animated typing dot component
function TypingDot({ delay }: { delay: number }) {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 500,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();
    return () => animation.stop();
  }, [opacity, delay]);

  return <Animated.View style={[typingStyles.dot, { opacity }]} />;
}

const typingStyles = StyleSheet.create({
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2DD4BF',
    marginHorizontal: 3,
  },
});

export default function CoachChatScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();
  const router = useRouter();
  const { paywall, refreshProfile, isPaywallVisible, hidePaywall } = useSubscription();
  const { requirePremium } = usePremiumFeature();

  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const { generateText, isLoading } = useTextGeneration();
  const {
    profile,
    financialData,
    spendableToday,
    dailyAllowance,
    momentumStreak,
    totalSavings,
    wellnessScore,
    todayExpenses,
    monthlySpentSoFar,
  } = useFinancialData();

  const currency = profile?.currency || financialData?.currency || '£';
  const monthlyIncome = financialData?.monthlyIncome || profile?.monthlyIncome || 0;
  const savingsGoal = financialData?.savingsGoal || profile?.savingsGoal || 0;
  const todaySpent = todayExpenses.reduce((sum, e) => sum + Number(e.amount), 0);

  // Avatar glow animation
  const avatarGlow = useRef(new Animated.Value(0.4)).current;
  const headerFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Header entrance animation
    Animated.timing(headerFadeAnim, {
      toValue: 1,
      duration: 400,
      useNativeDriver: true,
    }).start();

    // Avatar glow animation
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 0.9,
          duration: 2500,
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlow, {
          toValue: 0.4,
          duration: 2500,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, [avatarGlow, headerFadeAnim]);

  const loadChatHistory = async () => {
    try {
      const history = await storage.getChatHistory();
      if (history && history.length > 0) {
        const parsedMessages = history.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp),
        }));
        setMessages(parsedMessages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
      Alert.alert('Info', 'Starting a fresh conversation');
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const saveChatHistory = useCallback(async () => {
    try {
      await storage.setChatHistory(messages);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  // Load chat history on mount
  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Save chat history whenever messages change
  useEffect(() => {
    if (!isLoadingHistory && messages.length > 1) {
      saveChatHistory();
    }
  }, [messages, isLoadingHistory, saveChatHistory]);

  const generateYouTubeRecommendations = (query: string): YouTubeVideo[] => {
    const searchQuery = query.replace(/[?]/g, '').trim();
    const encodedQuery = encodeURIComponent(`${searchQuery} tutorial how to`);

    const videos: YouTubeVideo[] = [
      {
        title: `How to: ${searchQuery}`,
        videoId: `search?q=${encodedQuery}`,
        thumbnail: '🎥',
      },
      {
        title: `DIY ${searchQuery} - Step by Step`,
        videoId: `search?q=${encodedQuery}+step+by+step`,
        thumbnail: '📺',
      },
      {
        title: `${searchQuery} - Beginner's Guide`,
        videoId: `search?q=${encodedQuery}+beginners+guide`,
        thumbnail: '🎬',
      },
    ];

    return videos;
  };

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputText('');

    try {
      const systemContext = `You are Savvy Sidekick, a friendly AI financial personal assistant for busy moms. You speak in a warm, empowering tone.

Current user financial context:
- Name: ${profile?.name || 'there'}
- Monthly income: ${currency}${monthlyIncome.toFixed(0)}
- Savings goal: ${currency}${savingsGoal.toFixed(0)}/month
- Today's allowance: ${currency}${dailyAllowance.toFixed(2)}
- Spent today: ${currency}${todaySpent.toFixed(2)}
- Remaining today: ${currency}${spendableToday.toFixed(2)}
- Current streak: ${momentumStreak} days under budget
- Total savings: ${currency}${totalSavings.toFixed(2)}
- Monthly spent so far: ${currency}${monthlySpentSoFar.toFixed(2)}
- Wellness score: ${wellnessScore}/100

${momentumStreak >= 5 ? `Amazing! They're on a ${momentumStreak}-day streak! Celebrate this achievement.` : ''}
${wellnessScore >= 80 ? 'They have a great wellness score. Encourage them!' : wellnessScore < 50 ? 'Their wellness score needs improvement. Be supportive and provide actionable tips.' : ''}

Guidelines:
- Give personalized advice based on their REAL financial data above
- Be concise (3-5 sentences max)
- Focus on practical, actionable money-saving tips
- Use their actual numbers when giving advice
- Be encouraging and celebrate their wins
- If asked to analyze spending, reference their real spending data`;

      const response = await generateText(`${systemContext}

The user asked: "${text.trim()}"

Response:`);

      // Generate YouTube recommendations for DIY/how-to queries
      const isDIYQuery = /how to|diy|fix|make|create|repair|clean|build/i.test(text.trim());
      const youtubeVideos = isDIYQuery ? generateYouTubeRecommendations(text.trim()) : undefined;

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response || "I'm here to help! Could you provide more details?",
        isUser: false,
        timestamp: new Date(),
        youtubeVideos,
      };

      setMessages((prev) => [...prev, aiMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error('AI generation error:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please check your internet connection and try again.",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
    }
  };

  const handleClearHistory = () => {
    Alert.alert(
      'Clear Chat History',
      'Are you sure you want to clear all messages? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            await storage.setChatHistory([]);
            setMessages([INITIAL_MESSAGE]);
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          },
        },
      ]
    );
  };

  const handleQuickReply = (text: string) => {
  };

  const handlePaywallSuccess = async (profile: any) => {
    await refreshProfile();
    hidePaywall();
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleOpenYouTube = async (videoId: string) => {
    try {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      const url = `https://www.youtube.com/${videoId}`;
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', 'Unable to open YouTube');
      }
    } catch (error) {
      console.error('Failed to open YouTube:', error);
      Alert.alert('Error', 'Unable to open YouTube');
    }
  };

  const handleBack = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    router.back();
  };

  // Loading state with ChatSkeleton
  if (isLoadingHistory) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <Animated.View
          style={[
            styles.header,
            {
              opacity: headerFadeAnim,
              paddingTop: insets.top + 8,
              borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : Colors.glassBorder,
            },
          ]}
        >
          <View style={styles.headerContent}>
            <PressableScale onPress={handleBack} scaleValue={0.9}>
              <View
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDark ? 'rgba(45, 212, 191, 0.1)' : 'rgba(20, 184, 166, 0.08)',
                    borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(20, 184, 166, 0.15)',
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.electricTeal} />
              </View>
            </PressableScale>
            <View style={styles.headerCenter}>
              <View style={styles.headerAvatarGlow}>
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.amethyst]}
                  style={styles.headerAvatar}
                >
                  <Text style={styles.headerAvatarEmoji}>✨</Text>
                </LinearGradient>
              </View>
              <View>
                <Text style={[styles.headerTitle, { color: Colors.primaryText }]}>Savvy Sidekick</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                  <Text style={[styles.statusText, { color: Colors.silverGrey }]}>Ready to help</Text>
                </View>
              </View>
            </View>
            <View style={{ width: 48 }} />
          </View>
        </Animated.View>
        <ChatSkeleton />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      {/* Gritify Elite Paywall */}
      {isPaywallVisible && paywall && (
        <GritifyElitePaywall
          visible={isPaywallVisible}
          paywall={paywall}
          onSuccess={handlePaywallSuccess}
          onClose={hidePaywall}
        />
      )}

      {/* Premium Header with Back Button */}
      <Animated.View
        style={[
          styles.header,
          {
            opacity: headerFadeAnim,
            paddingTop: insets.top + 8,
            borderBottomColor: isDark ? 'rgba(255, 255, 255, 0.08)' : Colors.glassBorder,
          },
        ]}
      >
          <BlurView
            intensity={isDark ? 30 : 20}
            tint={isDark ? 'dark' : 'light'}
            style={StyleSheet.absoluteFill}
          />
          <View
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark ? 'rgba(10, 6, 18, 0.7)' : 'rgba(255, 255, 255, 0.85)',
              },
            ]}
          />
          <View style={styles.headerContent}>
            <PressableScale onPress={handleBack} scaleValue={0.9}>
              <View
                style={[
                  styles.backButton,
                  {
                    backgroundColor: isDark ? 'rgba(45, 212, 191, 0.1)' : 'rgba(20, 184, 166, 0.08)',
                    borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(20, 184, 166, 0.15)',
                    shadowColor: isDark ? Colors.electricTeal : '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.15 : 0.08,
                    shadowRadius: 8,
                    elevation: 3,
                  },
                ]}
              >
                <Ionicons name="arrow-back" size={20} color={Colors.electricTeal} />
              </View>
            </PressableScale>
            <View style={styles.headerCenter}>
              <Animated.View
                style={[
                  styles.headerAvatarGlow,
                  {
                    shadowColor: Colors.electricTeal,
                    shadowOffset: { width: 0, height: 0 },
                    shadowRadius: 12,
                    shadowOpacity: avatarGlow as any,
                    elevation: 8,
                  },
                ]}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.amethyst]}
                  style={styles.headerAvatar}
                >
                  <Text style={styles.headerAvatarEmoji}>✨</Text>
                </LinearGradient>
              </Animated.View>
              <View>
                <Text style={[styles.headerTitle, { color: Colors.primaryText }]}>Savvy Sidekick</Text>
                <View style={styles.statusRow}>
                  <View style={[styles.statusDot, { backgroundColor: Colors.success }]} />
                  <Text style={[styles.statusText, { color: Colors.silverGrey }]}>Ready to help</Text>
                </View>
              </View>
            </View>
            {messages.length > 1 && (
              <PressableScale
                onPress={handleClearHistory}
                style={[
                  styles.clearButton,
                  {
                    backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : Colors.white,
                    borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : Colors.glassBorder,
                  },
                ]}
                scaleValue={0.9}
              >
                <Ionicons
                  name="trash-outline"
                  size={18}
                  color={isDark ? Colors.electricTeal : Colors.tertiaryText}
                />
              </PressableScale>
            )}
            {messages.length <= 1 && <View style={{ width: 48 }} />}
          </View>
        </Animated.View>

      {/* Messages */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.scrollView}
        contentContainerStyle={[styles.scrollContent, { paddingBottom: 180 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageRow,
                  message.isUser ? styles.messageRowUser : styles.messageRowAI,
                ]}
              >
                {/* AI Avatar */}
                {!message.isUser && (
                  <View
                    style={[
                      styles.aiAvatarOuter,
                      {
                        shadowColor: Colors.electricTeal,
                        shadowOffset: { width: 0, height: 0 },
                        shadowOpacity: isDark ? 0.4 : 0.2,
                        shadowRadius: 10,
                        elevation: 5,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[Colors.electricTeal, Colors.amethyst]}
                      style={styles.aiAvatarGradient}
                    >
                      <Text style={styles.aiAvatarEmoji}>✨</Text>
                    </LinearGradient>
                  </View>
                )}

                {/* Message Bubble */}
                {message.isUser ? (
                  <View
                    style={[
                      styles.bubbleUser,
                      {
                        shadowColor: Colors.amethyst,
                        shadowOffset: { width: 0, height: 6 },
                        shadowOpacity: 0.25,
                        shadowRadius: 16,
                        elevation: 6,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={[Colors.electricTeal, Colors.amethyst] as const}
                      start={{ x: 0, y: 0 }}
                      end={{ x: 1, y: 1 }}
                      style={styles.bubbleUserGradient}
                    >
                      <Text
                        style={[
                          styles.messageText,
                          {
                            color: '#FFFFFF',
                            fontSize: Typography.bodyMedium.fontSize,
                            lineHeight: Typography.bodyMedium.lineHeight,
                            letterSpacing: Typography.bodyMedium.letterSpacing,
                          },
                        ]}
                      >
                        {message.text}
                      </Text>
                    </LinearGradient>
                  </View>
                ) : (
                  <View
                    style={[
                      styles.bubbleAIOuter,
                      {
                        borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(20, 184, 166, 0.12)',
                        shadowColor: isDark ? Colors.electricTeal : '#000000',
                        shadowOffset: { width: 0, height: 3 },
                        shadowOpacity: isDark ? 0.12 : 0.06,
                        shadowRadius: 14,
                        elevation: 4,
                      },
                    ]}
                  >
                    <BlurView
                      intensity={isDark ? 40 : 20}
                      tint={isDark ? 'dark' : 'light'}
                      style={styles.bubbleAIBlur}
                    >
                      <LinearGradient
                        colors={
                          isDark
                            ? ['rgba(20, 10, 36, 0.95)', 'rgba(20, 10, 36, 0.90)'] as const
                            : ['rgba(255, 255, 255, 0.98)', 'rgba(255, 255, 255, 0.92)'] as const
                        }
                        style={styles.bubbleAIInner}
                      >
                        <Text
                          style={[
                            styles.messageText,
                            {
                              color: Colors.primaryText,
                              fontSize: Typography.bodyMedium.fontSize,
                              lineHeight: Typography.bodyMedium.lineHeight,
                              letterSpacing: Typography.bodyMedium.letterSpacing,
                            },
                          ]}
                        >
                          {message.text}
                        </Text>
                      </LinearGradient>
                    </BlurView>
                  </View>
                )}

                {/* User Avatar */}
                {message.isUser && (
                  <LinearGradient
                    colors={[Colors.radiantMagenta, Colors.neonPink] as const}
                    style={styles.userAvatar}
                  >
                    <Ionicons name="person" size={16} color="#FFFFFF" />
                  </LinearGradient>
                )}
              </View>

              {/* Watch & Learn Section */}
              {!message.isUser && message.youtubeVideos && message.youtubeVideos.length > 0 && (
                <View style={styles.watchLearnSection}>
                  <View style={styles.watchLearnHeader}>
                    <Ionicons name="play-circle" size={18} color={Colors.radiantMagenta} />
                    <Text
                      style={[
                        styles.watchLearnTitle,
                        {
                          color: Colors.primaryText,
                          ...Typography.titleSmall,
                        },
                      ]}
                    >
                      Watch & Learn
                    </Text>
                  </View>
                  <View style={styles.videoList}>
                    {message.youtubeVideos.map((video, index) => (
                      <PressableScale
                        key={index}
                        onPress={() => handleOpenYouTube(video.videoId)}
                        scaleValue={0.97}
                      >
                        <View
                          style={[
                            styles.videoCard,
                            {
                              backgroundColor: isDark ? 'rgba(20, 10, 36, 0.85)' : Colors.white,
                              borderColor: isDark
                                ? 'rgba(45, 212, 191, 0.15)'
                                : 'rgba(0, 0, 0, 0.06)',
                              shadowColor: isDark ? Colors.electricTeal : '#000000',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: isDark ? 0.12 : 0.08,
                              shadowRadius: 16,
                              elevation: 3,
                            },
                          ]}
                        >
                          <View style={[styles.videoThumbnail, { overflow: 'hidden' }]}>
                            <LinearGradient
                              colors={
                                isDark
                                  ? ['rgba(45, 27, 61, 0.8)', 'rgba(45, 212, 191, 0.1)'] as const
                                  : ['rgba(245, 242, 238, 1)', 'rgba(20, 184, 166, 0.08)'] as const
                              }
                              style={styles.videoThumbnailGradient}
                            >
                              <Text style={styles.videoEmoji}>{video.thumbnail}</Text>
                            </LinearGradient>
                          </View>
                          <View style={styles.videoInfo}>
                            <Text
                              style={[
                                styles.videoTitle,
                                {
                                  color: Colors.primaryText,
                                  ...Typography.labelLarge,
                                },
                              ]}
                              numberOfLines={2}
                            >
                              {video.title}
                            </Text>
                            <View style={styles.videoFooter}>
                              <Ionicons name="logo-youtube" size={14} color={Colors.error} />
                              <Text
                                style={[
                                  styles.videoSource,
                                  {
                                    color: Colors.silverGrey,
                                    ...Typography.labelSmall,
                                  },
                                ]}
                              >
                                YouTube Tutorial
                              </Text>
                            </View>
                          </View>
                          <Ionicons
                            name="chevron-forward"
                            size={18}
                            color={Colors.silverGrey}
                          />
                        </View>
                      </PressableScale>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}

          {/* Typing Indicator with Animated Dots */}
          {isLoading && (
            <View style={styles.messageRow}>
              <View
                style={[
                  styles.aiAvatarOuter,
                  {
                    shadowColor: Colors.electricTeal,
                    shadowOffset: { width: 0, height: 0 },
                    shadowOpacity: isDark ? 0.4 : 0.2,
                    shadowRadius: 10,
                    elevation: 5,
                  },
                ]}
              >
                <LinearGradient
                  colors={[Colors.electricTeal, Colors.amethyst]}
                  style={styles.aiAvatarGradient}
                >
                  <Text style={styles.aiAvatarEmoji}>✨</Text>
                </LinearGradient>
              </View>
              <BlurView
                intensity={isDark ? 40 : 20}
                tint={isDark ? 'dark' : 'light'}
                style={[
                  styles.typingBubble,
                  {
                    borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : Colors.glassBorder,
                    shadowColor: isDark ? Colors.electricTeal : '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.12 : 0.06,
                    shadowRadius: 12,
                    elevation: 3,
                  },
                ]}
              >
                <View
                  style={[
                    StyleSheet.absoluteFill,
                    {
                      backgroundColor: isDark ? 'rgba(20, 10, 36, 0.95)' : 'rgba(255, 255, 255, 0.98)',
                    },
                  ]}
                />
                <View style={styles.typingDotsContainer}>
                  <TypingDot delay={0} />
                  <TypingDot delay={200} />
                  <TypingDot delay={400} />
                </View>
              </BlurView>
            </View>
          )}
        </ScrollView>

      {/* Quick Replies - Luxury Chips */}
      {messages.length <= 1 && (
        <View style={styles.quickRepliesContainer} nativeID="quick-replies-section">
          <Text
            style={[
              styles.quickRepliesLabel,
              {
                color: Colors.silverGrey,
                ...Typography.labelMedium,
              },
            ]}
          >
            QUICK QUESTIONS
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.quickRepliesScroll}
          >
            {QUICK_REPLIES.map((reply) => (
              <PressableScale
                key={reply.id}
                onPress={() => handleQuickReply(reply.text)}
                disabled={isLoading}
                scaleValue={0.95}
              >
                <View style={styles.quickReplyChipOuter}>
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.amethyst] as const}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 1 }}
                    style={styles.quickReplyBorderGradient}
                  >
                    <View
                      style={[
                        styles.quickReplyChipInner,
                        {
                          backgroundColor: isDark ? '#0A0612' : '#FAF8F5',
                        },
                      ]}
                    >
                      <Text style={styles.quickReplyIcon}>{reply.icon}</Text>
                      <Text
                        style={[
                          styles.quickReplyLabel,
                          {
                            color: Colors.primaryText,
                            ...Typography.labelLarge,
                            fontWeight: '500',
                          },
                        ]}
                      >
                        {reply.text}
                      </Text>
                    </View>
                  </LinearGradient>
                </View>
              </PressableScale>
            ))}
          </ScrollView>
        </View>
      )}

      {/* Floating Premium Input Bar - Absolute Bottom with KeyboardAvoidingView */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingContainer}
        keyboardVerticalOffset={0}
      >
        <View
          style={[
            styles.inputContainer,
            { paddingBottom: Math.max(insets.bottom, 8) }
          ]}
          nativeID="coach-input-area"
        >
          <BlurView
            intensity={isDark ? 50 : 30}
            tint={isDark ? 'dark' : 'light'}
            style={[
              styles.inputWrapper,
              {
                borderColor: isDark ? 'rgba(45, 212, 191, 0.25)' : 'rgba(20, 184, 166, 0.12)',
                shadowColor: isDark ? Colors.electricTeal : '#000000',
                shadowOffset: { width: 0, height: 10 },
                shadowOpacity: isDark ? 0.2 : 0.12,
                shadowRadius: 28,
                elevation: 14,
              },
            ]}
          >
            <View
              style={[
                StyleSheet.absoluteFill,
                {
                  backgroundColor: isDark ? 'rgba(20, 10, 36, 0.95)' : 'rgba(255, 255, 255, 0.95)',
                  borderRadius: BorderRadius.xxl + 4,
                },
              ]}
            />
            <TextInput
              style={[
                styles.input,
                {
                  color: Colors.primaryText,
                  fontSize: Typography.bodyMedium.fontSize,
                },
              ]}
              placeholder="Ask me how to save or spend wisely..."
              placeholderTextColor={Colors.silverGrey}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <PressableScale
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
              scaleValue={0.88}
              style={styles.sendButtonContainer}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.glowingGreen] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[
                  styles.sendButtonGradient,
                  {
                    shadowColor: Colors.electricTeal,
                    shadowOffset: { width: 0, height: 4 },
                    shadowOpacity: 0.4,
                    shadowRadius: 12,
                    elevation: 6,
                  },
                ]}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </LinearGradient>
            </PressableScale>
          </BlurView>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoidingContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },
  headerCenter: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    marginLeft: Spacing.md,
  },
  headerAvatarGlow: {
    borderRadius: BorderRadius.round,
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarEmoji: {
    fontSize: 20,
  },
  headerTitle: {
    ...Typography.headlineSmall,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: 2,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    ...Typography.bodySmall,
  },
  clearButton: {
    width: 48,
    height: 48,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // ── Messages ScrollView ─────────────────────────────────────────────────
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    flexGrow: 1,
  },

  // ── Message Rows ────────────────────────────────────────────────────────
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.lg,
    alignItems: 'flex-end',
    gap: Spacing.sm + 2,
  },
  messageRowUser: {
    justifyContent: 'flex-end',
  },
  messageRowAI: {
    justifyContent: 'flex-start',
  },

  // ── AI Avatar ───────────────────────────────────────────────────────────
  aiAvatarOuter: {
    borderRadius: BorderRadius.round,
  },
  aiAvatarGradient: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarEmoji: {
    fontSize: 16,
  },

  // ── User Avatar ─────────────────────────────────────────────────────────
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Chat Bubbles ────────────────────────────────────────────────────────
  bubbleUser: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xl + 4,
    borderBottomRightRadius: BorderRadius.sm,
    overflow: 'hidden',
  },
  bubbleUserGradient: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
  },
  bubbleAIOuter: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xl + 4,
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bubbleAIBlur: {
    borderRadius: BorderRadius.xl + 4,
    overflow: 'hidden',
  },
  bubbleAIInner: {
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl + 4,
  },
  messageText: {
    // fontSize and lineHeight set dynamically via Typography.bodyMedium
  },

  // ── Typing Indicator ────────────────────────────────────────────────────
  typingBubble: {
    borderRadius: BorderRadius.xl + 4,
    borderBottomLeftRadius: BorderRadius.sm,
    borderWidth: 1,
    overflow: 'hidden',
  },
  typingDotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md + 2,
    paddingHorizontal: Spacing.lg,
  },

  // ── Watch & Learn / YouTube ─────────────────────────────────────────────
  watchLearnSection: {
    marginLeft: 44,
    marginRight: Spacing.lg,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
  },
  watchLearnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    marginBottom: Spacing.md,
  },
  watchLearnTitle: {
    // Typography applied dynamically
  },
  videoList: {
    gap: Spacing.sm,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    padding: Spacing.md,
    gap: Spacing.md,
  },
  videoThumbnail: {
    width: 56,
    height: 56,
    borderRadius: BorderRadius.md,
  },
  videoThumbnailGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.md,
  },
  videoEmoji: {
    fontSize: 26,
  },
  videoInfo: {
    flex: 1,
    gap: Spacing.xs,
  },
  videoTitle: {
    // Typography applied dynamically
  },
  videoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  videoSource: {
    // Typography applied dynamically
  },

  // ── Quick Replies ───────────────────────────────────────────────────────
  quickRepliesContainer: {
    position: 'absolute',
    bottom: 120,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: 'transparent',
  },
  quickRepliesLabel: {
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  quickRepliesScroll: {
    gap: Spacing.sm + 2,
  },
  quickReplyChipOuter: {
    borderRadius: BorderRadius.round,
    overflow: 'hidden',
  },
  quickReplyBorderGradient: {
    borderRadius: BorderRadius.round,
    padding: 1.5,
  },
  quickReplyChipInner: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: BorderRadius.round,
    paddingVertical: Spacing.sm + 3,
    paddingHorizontal: Spacing.md + 2,
    gap: Spacing.sm,
  },
  quickReplyIcon: {
    fontSize: 17,
  },
  quickReplyLabel: {
    // Typography applied dynamically
  },

  // ── Floating Input Bar ──────────────────────────────────────────────────
  inputContainer: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.xxl + 4,
    borderWidth: 1.5,
    paddingHorizontal: Spacing.md + 2,
    paddingVertical: Spacing.sm + 2,
    gap: Spacing.sm,
    overflow: 'hidden',
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: Spacing.sm + 2,
  },
  sendButtonContainer: {
    width: 44,
    height: 44,
    borderRadius: BorderRadius.xl,
    overflow: 'hidden',
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BorderRadius.xl,
  },
});
