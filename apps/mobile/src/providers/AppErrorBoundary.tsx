import { Component, type ErrorInfo, type ReactNode } from 'react';
import { Pressable, Text, View } from 'react-native';
import { logger } from '@/lib/utils/logging/logger';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
}

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo): void {
    logger.error('SYSTEM', 'Unhandled render error', {
      message: error.message,
      componentStack: info.componentStack,
    });
    import('@/core/services/crashReporter').then(({ crashReporter }) => {
      crashReporter.captureException(error, { componentStack: info.componentStack });
    });
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false });
  };

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <View
          style={{
            flex: 1,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            backgroundColor: '#000',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: '600', marginBottom: 8 }}>
            Something went wrong
          </Text>
          <Text style={{ color: '#aaa', textAlign: 'center', marginBottom: 20 }}>
            Briefly hit an unexpected error. You can try again without restarting the app.
          </Text>
          <Pressable
            onPress={this.handleRetry}
            style={{
              backgroundColor: '#5EB0E5',
              paddingHorizontal: 20,
              paddingVertical: 12,
              borderRadius: 12,
            }}
          >
            <Text style={{ color: '#000', fontWeight: '600' }}>Try again</Text>
          </Pressable>
        </View>
      );
    }

    return this.props.children;
  }
}
