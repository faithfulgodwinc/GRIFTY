import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
  Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import * as Haptics from 'expo-haptics';
import { storage } from '@/utils/storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

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

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([INITIAL_MESSAGE]);
  const [inputText, setInputText] = useState('');
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const scrollViewRef = useRef<ScrollView>(null);
  const insets = useSafeAreaInsets();

  const { generateText, isLoading } = useTextGeneration();

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
  }, [messages, isLoadingHistory]);

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

  const saveChatHistory = async () => {
    try {
      await storage.setChatHistory(messages);
    } catch (error) {
      console.error('Failed to save chat history:', error);
    }
  };

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

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

  if (isLoadingHistory) {
    return (
      <LinearGradient colors={Gradients.background} style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.electricTeal} />
          <Text style={styles.loadingText}>Loading your conversation...</Text>
        </View>
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
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.avatarContainer}>
            <LinearGradient
              colors={[Colors.electricTeal, Colors.vibrantPurple]}
              style={styles.avatar}
            >
              <Text style={styles.avatarEmoji}>✨</Text>
            </LinearGradient>
            <View>
              <Text style={styles.title}>DIY Expert Coach</Text>
              <Text style={styles.status}>🟢 Ready to help</Text>
            </View>
          </View>
          {messages.length > 1 && (
            <TouchableOpacity
              onPress={handleClearHistory}
              style={styles.clearButton}
            >
              <Ionicons name="trash-outline" size={20} color={Colors.tertiaryText} />
            </TouchableOpacity>
          )}
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View key={message.id}>
              <View
                style={[
                  styles.messageWrapper,
                  message.isUser ? styles.userMessageWrapper : styles.aiMessageWrapper,
                ]}
              >
                {!message.isUser && (
                  <View style={styles.aiAvatar}>
                    <Text style={styles.aiAvatarEmoji}>✨</Text>
                  </View>
                )}
                <View
                  style={[
                    styles.messageBubble,
                    message.isUser ? styles.userMessage : styles.aiMessage,
                  ]}
                >
                  <Text style={styles.messageText}>{message.text}</Text>
                </View>
                {message.isUser && (
                  <View style={styles.userAvatar}>
                    <Ionicons name="person" size={20} color={Colors.white} />
                  </View>
                )}
              </View>

              {/* Watch & Learn Section */}
              {!message.isUser && message.youtubeVideos && message.youtubeVideos.length > 0 && (
                <View style={styles.watchLearnSection}>
                  <View style={styles.watchLearnHeader}>
                    <Ionicons name="play-circle" size={20} color={Colors.radiantMagenta} />
                    <Text style={styles.watchLearnTitle}>Watch & Learn</Text>
                  </View>
                  <View style={styles.videoList}>
                    {message.youtubeVideos.map((video, index) => (
                      <TouchableOpacity
                        key={index}
                        style={styles.videoCard}
                        onPress={() => handleOpenYouTube(video.videoId)}
                        activeOpacity={0.7}
                      >
                        <View style={styles.videoThumbnail}>
                          <Text style={styles.videoEmoji}>{video.thumbnail}</Text>
                        </View>
                        <View style={styles.videoInfo}>
                          <Text style={styles.videoTitle} numberOfLines={2}>
                            {video.title}
                          </Text>
                          <View style={styles.videoFooter}>
                            <Ionicons name="logo-youtube" size={16} color={Colors.error} />
                            <Text style={styles.videoSource}>YouTube Tutorial</Text>
                          </View>
                        </View>
                        <Ionicons name="chevron-forward" size={20} color={Colors.mediumGray} />
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </View>
          ))}

          {isLoading && (
            <View style={styles.typingIndicator}>
              <View style={styles.aiAvatar}>
                <Text style={styles.aiAvatarEmoji}>✨</Text>
              </View>
              <View style={styles.loadingBubble}>
                <ActivityIndicator size="small" color={Colors.electricTeal} />
              </View>
            </View>
          )}
        </ScrollView>

        {/* Quick Replies */}
        {messages.length <= 1 && (
          <View style={styles.quickRepliesContainer}>
            <Text style={styles.quickRepliesTitle}>Quick DIY Questions</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.quickReplies}
            >
              {QUICK_REPLIES.map((reply) => (
                <TouchableOpacity
                  key={reply.id}
                  style={styles.quickReply}
                  onPress={() => handleQuickReply(reply.text)}
                  disabled={isLoading}
                >
                  <LinearGradient
                    colors={[Colors.electricTeal, Colors.vibrantPurple]}
                    style={styles.quickReplyGradient}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                  >
                    <Text style={styles.quickReplyEmoji}>{reply.icon}</Text>
                    <Text style={styles.quickReplyText}>{reply.text}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}

        {/* Floating Input */}
        <View style={[styles.inputContainer, { paddingBottom: insets.bottom + 90 }]}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask me how to do something..."
              placeholderTextColor={Colors.mediumGray}
              value={inputText}
              onChangeText={setInputText}
              multiline
              maxLength={500}
              editable={!isLoading}
            />
            <TouchableOpacity
              style={[styles.sendButton, (!inputText.trim() || isLoading) && styles.sendButtonDisabled]}
              onPress={() => handleSendMessage(inputText)}
              disabled={!inputText.trim() || isLoading}
            >
              <LinearGradient
                colors={[Colors.electricTeal, Colors.vibrantPurple] as const}
                style={styles.sendButtonGradient}
              >
                <Ionicons name="send" size={20} color={Colors.white} />
              </LinearGradient>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.secondaryText,
    fontWeight: '500',
  },
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarEmoji: {
    fontSize: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.primaryText,
  },
  status: {
    fontSize: 12,
    color: Colors.secondaryText,
    marginTop: 2,
    fontWeight: '500',
  },
  messagesContainer: {
    paddingHorizontal: 20,
    paddingVertical: 20,
    paddingBottom: 140,
    flexGrow: 1,
  },
  messageWrapper: {
    flexDirection: 'row',
    marginBottom: 16,
    alignItems: 'flex-end',
    gap: 8,
  },
  userMessageWrapper: {
    justifyContent: 'flex-end',
  },
  aiMessageWrapper: {
    justifyContent: 'flex-start',
  },
  messageBubble: {
    maxWidth: '75%',
    padding: 16,
    borderRadius: 20,
  },
  userMessage: {
    backgroundColor: Colors.electricTeal,
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: Colors.primaryText,
    lineHeight: 22,
  },
  aiAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.glassBorder,
  },
  aiAvatarEmoji: {
    fontSize: 16,
  },
  userAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: Colors.radiantMagenta,
    justifyContent: 'center',
    alignItems: 'center',
  },
  typingIndicator: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    marginBottom: 16,
  },
  loadingBubble: {
    backgroundColor: Colors.white,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 16,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  quickRepliesContainer: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  quickRepliesTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.secondaryText,
    marginBottom: 12,
  },
  quickReplies: {
    gap: 8,
  },
  quickReply: {
    borderRadius: 20,
    overflow: 'hidden',
  },
  quickReplyGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyEmoji: {
    fontSize: 16,
  },
  quickReplyText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  inputContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 20,
    paddingTop: 12,
    backgroundColor: 'transparent',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.white,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: Colors.electricTeal,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    shadowColor: Colors.electricTeal,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: Colors.primaryText,
    maxHeight: 100,
    paddingVertical: 8,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  sendButtonGradient: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  watchLearnSection: {
    marginLeft: 40,
    marginRight: 20,
    marginTop: 12,
    marginBottom: 16,
  },
  watchLearnHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  watchLearnTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primaryText,
  },
  videoList: {
    gap: 10,
  },
  videoCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.white,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  videoThumbnail: {
    width: 56,
    height: 56,
    borderRadius: 12,
    backgroundColor: Colors.lightCream,
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoEmoji: {
    fontSize: 28,
  },
  videoInfo: {
    flex: 1,
    gap: 6,
  },
  videoTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
    lineHeight: 18,
  },
  videoFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  videoSource: {
    fontSize: 12,
    color: Colors.tertiaryText,
    fontWeight: '500',
  },
});
