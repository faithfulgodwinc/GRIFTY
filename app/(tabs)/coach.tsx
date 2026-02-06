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
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { GlassCard } from '@/components/GlassCard';
import { Ionicons } from '@expo/vector-icons';
import { useTextGeneration } from '@fastshot/ai';
import * as Haptics from 'expo-haptics';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

const QUICK_REPLIES = [
  { id: '1', text: 'Save £50 this week?', icon: '💰' },
  { id: '2', text: 'Meal prep budget tips', icon: '🥗' },
  { id: '3', text: 'Emergency fund advice', icon: '🆘' },
  { id: '4', text: 'Kids savings goals', icon: '🎓' },
];

export default function CoachScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      text: "Hello! I'm your AI financial PA. How can I help you save today?",
      isUser: false,
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);

  const { generateText, isLoading } = useTextGeneration();

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
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
      const response = await generateText(`You are a friendly, empathetic financial advisor for busy mothers.
        The user asked: "${text.trim()}"

        Provide practical, actionable advice in a warm, supportive tone.
        Keep responses concise (2-3 sentences) and focus on:
        - Budget-friendly tips
        - Time-saving strategies
        - Mom-specific financial challenges
        - Encouraging tone

        Response:`);

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: response || "I'm here to help! Could you provide more details?",
        isUser: false,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, I'm having trouble connecting right now. Please try again!",
        isUser: false,
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleQuickReply = (text: string) => {
    handleSendMessage(text);
  };

  return (
    <LinearGradient colors={Gradients.background} style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
        keyboardVerticalOffset={100}
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
              <Text style={styles.title}>Savvy Sidekick</Text>
              <Text style={styles.status}>🟢 Online</Text>
            </View>
          </View>
        </View>

        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          showsVerticalScrollIndicator={false}
        >
          {messages.map((message) => (
            <View
              key={message.id}
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
          ))}

          {isLoading && (
            <View style={styles.loadingContainer}>
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
            <Text style={styles.quickRepliesTitle}>Glow-Pills</Text>
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

        {/* Input */}
        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Ask your AI coach..."
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
  header: {
    paddingTop: 60,
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.glassBorder,
  },
  avatarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
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
  loadingContainer: {
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
    paddingHorizontal: 20,
    paddingBottom: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.glassBorder,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: Colors.glassBorder,
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
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
});
