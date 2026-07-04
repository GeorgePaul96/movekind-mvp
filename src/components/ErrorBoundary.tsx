import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Button } from '@/components/Button';
import { colors } from '@/constants/colors';
import { ERROR_FALLBACK } from '@/constants/copy';
import { telemetry } from '@/services/telemetry';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
}

/**
 * App-level error boundary with a calm fallback — no red screens, no blame.
 * "Start fresh" re-renders the tree; server-side state (sessions, stats) is untouched.
 */
export class ErrorBoundary extends React.Component<Props, State> {
  override state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  override componentDidCatch(error: Error, info: React.ErrorInfo) {
    telemetry.capture('app_error_boundary', {
      message: error.message,
      componentStack: info.componentStack?.slice(0, 500) ?? null,
    });
  }

  private reset = () => {
    this.setState({ hasError: false });
  };

  override render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <View style={styles.container} accessibilityRole="alert">
        <View style={styles.card}>
          <Text style={styles.title} accessibilityRole="header">
            {ERROR_FALLBACK.title}
          </Text>
          <Text style={styles.body}>{ERROR_FALLBACK.body}</Text>
          <Button label={ERROR_FALLBACK.action} onPress={this.reset} variant="sage-soft" />
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 24,
    width: '100%',
    maxWidth: 420,
    gap: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.ink,
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    color: colors.muted,
  },
});
