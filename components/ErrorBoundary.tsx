import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Gradients } from '@/constants/Colors';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo);
    this.setState({
      error,
      errorInfo,
    });
  }

  handleReset = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <LinearGradient colors={Gradients.background} style={styles.container}>
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.iconContainer}>
              <Ionicons name="alert-circle" size={80} color={Colors.radiantMagenta} />
            </View>

            <Text style={styles.title}>Oops! Something went wrong</Text>
            <Text style={styles.subtitle}>
              We encountered an unexpected error. Don&apos;t worry, your data is safe.
            </Text>

            {__DEV__ && this.state.error && (
              <View style={styles.errorDetails}>
                <Text style={styles.errorTitle}>Error Details:</Text>
                <Text style={styles.errorText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.errorStack}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}

            <TouchableOpacity style={styles.button} onPress={this.handleReset}>
              <LinearGradient
                colors={[Colors.electricTeal, Colors.vibrantPurple]}
                style={styles.buttonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Ionicons name="refresh" size={20} color={Colors.white} />
                <Text style={styles.buttonText}>Try Again</Text>
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </LinearGradient>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: Colors.primaryText,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.secondaryText,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  errorDetails: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    width: '100%',
  },
  errorTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primaryText,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 12,
    color: Colors.radiantMagenta,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  errorStack: {
    fontSize: 10,
    color: Colors.tertiaryText,
    fontFamily: 'monospace',
  },
  button: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 6,
  },
  buttonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.white,
  },
});
