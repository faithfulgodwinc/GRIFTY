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
  { id: '1', text: 'How to fix a leaky faucet?', icon: '🔧' },
  { id: '2', text: 'DIY budget meal prep ideas', icon: '🥗' },
  { id: '3', text: 'Home cleaning hacks', icon: '🧹' },
  { id: '4', text: 'DIY natural beauty products', icon: '✨' },
];

const INITIAL_MESSAGE: Message = {
  id: '0',
  text: "Hello! I'm your DIY Expert Coach. Ask me how-to questions and I'll guide you step-by-step to save money by doing things yourself!",
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
          duration: 400,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 400,
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

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();
  const { theme } = useTheme();

  const isDark = theme === 'dark';
  const Colors = getThemeColors(isDark);
  const Gradients = getGradients(isDark);

  const { generateText, isLoading } = useTextGeneration();

  // Avatar glow animation
  const avatarGlow = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const glowAnimation = Animated.loop(
      Animated.sequence([
        Animated.timing(avatarGlow, {
          toValue: 0.8,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(avatarGlow, {
          toValue: 0.4,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    glowAnimation.start();
    return () => glowAnimation.stop();
  }, [avatarGlow]);

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
    // Generate search-friendly query for YouTube
    const searchQuery = query.replace(/[?]/g, '').trim();
    const encodedQuery = encodeURIComponent(`${searchQuery} tutorial how to`);

    // Generate relevant video suggestions
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
      const response = await generateText(`You are a DIY Expert Coach helping busy mothers save money by doing things themselves.
        The user asked: "${text.trim()}"

        Provide clear, step-by-step instructions in a warm, empowering tone.
        Focus on:
        - Simple, actionable steps (numbered if possible)
        - Cost-saving benefits
        - Time estimates
        - Common mistakes to avoid
        - Encouraging, "you can do this!" attitude

        Keep responses concise but comprehensive (3-5 sentences with key steps).
        If it's a how-to question, break it down into simple steps.

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
    handleSendMessage(text);
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

  // Loading state with ChatSkeleton
  if (isLoadingHistory) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={[styles.header, { borderBottomColor: Colors.glassBorder }]}>
          <View style={styles.headerLeft}>
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
        </View>
        <ChatSkeleton />
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={0}
      >
        {/* Premium Header */}
        <View style={[styles.header, { borderBottomColor: Colors.glassBorder }]}>
          <View style={styles.headerLeft}>
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
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.scrollContent}
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
                        shadowOpacity: isDark ? 0.35 : 0.15,
                        shadowRadius: 8,
                        elevation: 4,
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
                        shadowOffset: { width: 0, height: 4 },
                        shadowOpacity: 0.2,
                        shadowRadius: 12,
                        elevation: 4,
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
                        borderColor: isDark ? 'rgba(45, 212, 191, 0.15)' : Colors.glassBorder,
                        shadowColor: isDark ? Colors.electricTeal : '#000000',
                        shadowOffset: { width: 0, height: 2 },
                        shadowOpacity: isDark ? 0.08 : 0.04,
                        shadowRadius: 12,
                        elevation: 3,
                      },
                    ]}
                  >
                    <LinearGradient
                      colors={
                        isDark
                          ? ['rgba(20, 10, 36, 0.92)', 'rgba(20, 10, 36, 0.88)'] as const
                          : ['rgba(255, 255, 255, 0.95)', 'rgba(255, 255, 255, 0.88)'] as const
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
                                ? 'rgba(45, 212, 191, 0.1)'
                                : 'rgba(0, 0, 0, 0.04)',
                              shadowColor: isDark ? Colors.electricTeal : '#000000',
                              shadowOffset: { width: 0, height: 4 },
                              shadowOpacity: isDark ? 0.1 : 0.06,
                              shadowRadius: 16,
                              elevation: 3,
                            },
                          ]}
                        >
                          <View
                            style={[
                              styles.videoThumbnail,
                              {
                                overflow: 'hidden',
                              },
                            ]}
                          >
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
                    shadowOpacity: isDark ? 0.35 : 0.15,
                    shadowRadius: 8,
                    elevation: 4,
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
              <View
                style={[
                  styles.typingBubble,
                  {
                    backgroundColor: isDark ? 'rgba(20, 10, 36, 0.92)' : Colors.white,
                    borderColor: isDark ? 'rgba(45, 212, 191, 0.15)' : Colors.glassBorder,
                    shadowColor: isDark ? Colors.electricTeal : '#000000',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: isDark ? 0.08 : 0.04,
                    shadowRadius: 12,
                    elevation: 3,
                  },
                ]}
              >
                <TypingDot delay={0} />
                <TypingDot delay={200} />
                <TypingDot delay={400} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Replies - Luxury Chips */}
        {messages.length <= 1 && (
          <View style={styles.quickRepliesContainer}>
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

        {/* Floating Premium Input Bar */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 90 }]}>
          <View
            style={[
              styles.inputWrapper,
              {
                backgroundColor: isDark ? 'rgba(20, 10, 36, 0.92)' : 'rgba(255, 255, 255, 0.92)',
                borderColor: isDark ? 'rgba(45, 212, 191, 0.2)' : 'rgba(0, 0, 0, 0.06)',
                shadowColor: isDark ? Colors.electricTeal : '#000000',
                shadowOffset: { width: 0, height: 8 },
                shadowOpacity: isDark ? 0.15 : 0.08,
                shadowRadius: 24,
                elevation: 12,
              },
            ]}
          >
            <TextInput
              style={[
                styles.input,
                {
                  color: Colors.primaryText,
                  fontSize: Typography.bodyMedium.fontSize,
                },
              ]}
              placeholder="Ask me how to do something..."
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
                colors={[Colors.electricTeal, Colors.amethyst] as const}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={18} color="#FFFFFF" />
              </LinearGradient>
            </PressableScale>
          </View>
        </View>
      </KeyboardAvoidingView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },

  // ── Header ──────────────────────────────────────────────────────────────
  header: {
    paddingTop: 60,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerAvatarGlow: {
    borderRadius: BorderRadius.round,
  },
  headerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerAvatarEmoji: {
    fontSize: 22,
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
    width: 40,
    height: 40,
    borderRadius: BorderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
  },

  // ── Messages ScrollView ─────────────────────────────────────────────────
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: 140,
    flexGrow: 1,
  },

  // ── Message Rows ────────────────────────────────────────────────────────
  messageRow: {
    flexDirection: 'row',
    marginBottom: Spacing.md,
    alignItems: 'flex-end',
    gap: Spacing.sm,
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
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  aiAvatarEmoji: {
    fontSize: 14,
  },

  // ── User Avatar ─────────────────────────────────────────────────────────
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // ── Chat Bubbles ────────────────────────────────────────────────────────
  bubbleUser: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xl,
    borderBottomRightRadius: BorderRadius.xs,
    overflow: 'hidden',
  },
  bubbleUserGradient: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  bubbleAIOuter: {
    maxWidth: '75%',
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
    overflow: 'hidden',
  },
  bubbleAIInner: {
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
  },
  messageText: {
    // fontSize and lineHeight set dynamically via Typography.bodyMedium
  },

  // ── Typing Indicator ────────────────────────────────────────────────────
  typingBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    borderRadius: BorderRadius.xl,
    borderBottomLeftRadius: BorderRadius.xs,
    borderWidth: 1,
  },

  // ── Watch & Learn / YouTube ─────────────────────────────────────────────
  watchLearnSection: {
    marginLeft: 40,
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
    width: 52,
    height: 52,
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
    fontSize: 24,
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
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
  },
  quickRepliesLabel: {
    marginBottom: Spacing.md,
    textTransform: 'uppercase',
  },
  quickRepliesScroll: {
    gap: Spacing.sm,
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
    paddingVertical: Spacing.sm + 2,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  quickReplyIcon: {
    fontSize: 16,
  },
  quickReplyLabel: {
    // Typography applied dynamically
  },

  // ── Floating Input Bar ──────────────────────────────────────────────────
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: BorderRadius.xxl + 4,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  input: {
    flex: 1,
    maxHeight: 100,
    paddingVertical: Spacing.sm,
  },
  sendButtonContainer: {
    width: 40,
    height: 40,
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
