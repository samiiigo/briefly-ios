import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '@/providers/AuthProvider';
import { useCreateStyles, useThemedColors } from '@/shared/theme';
import type { ColorPalette } from '@/shared/theme';

export function SignInScreen() {
  const colors = useThemedColors();
  const styles = useCreateStyles(createSignInStyles);
  const { status, signInWithEmail, signInWithApple, signInWithGoogle, appleAvailable } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  const canSubmitEmail = useMemo(() => email.trim().includes('@'), [email]);

  async function handleEmailSignIn(): Promise<void> {
    if (!canSubmitEmail || pending) return;
    setPending(true);
    setMessage(null);
    try {
      await signInWithEmail(email.trim());
      setMessage('Check your email for a magic link to finish signing in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send sign-in email.');
    } finally {
      setPending(false);
    }
  }

  async function handleProviderSignIn(provider: 'apple' | 'google'): Promise<void> {
    if (pending) return;
    setPending(true);
    setMessage(null);
    try {
      if (provider === 'apple') {
        await signInWithApple();
      } else {
        await signInWithGoogle();
      }
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Sign-in failed.');
    } finally {
      setPending(false);
    }
  }

  if (status === 'loading') {
    return (
      <View style={[styles.root, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sign in to Briefly</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your recordings stay on this device and are scoped to your account.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          placeholder="Email address"
          placeholderTextColor={colors.textSecondary}
          style={[
            styles.input,
            { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />

        <Pressable
          disabled={!canSubmitEmail || pending}
          onPress={() => void handleEmailSignIn()}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: !canSubmitEmail || pending ? 0.5 : 1 },
          ]}
        >
          <Text style={styles.primaryButtonText}>Continue with email</Text>
        </Pressable>

        {appleAvailable ? (
          <Pressable
            disabled={pending}
            onPress={() => void handleProviderSignIn('apple')}
            style={[styles.secondaryButton, { borderColor: colors.border }]}
          >
            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
              Continue with Apple
            </Text>
          </Pressable>
        ) : null}

        <Pressable
          disabled={pending}
          onPress={() => void handleProviderSignIn('google')}
          style={[styles.secondaryButton, { borderColor: colors.border }]}
        >
          <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
            Continue with Google
          </Text>
        </Pressable>

        {message ? <Text style={[styles.message, { color: colors.textSecondary }]}>{message}</Text> : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const createSignInStyles = (colors: ColorPalette) =>
  StyleSheet.create({
    root: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    },
    card: {
      width: '100%',
      maxWidth: 420,
      gap: 12,
    },
    title: {
      fontSize: 28,
      fontWeight: '700',
    },
    subtitle: {
      fontSize: 15,
      lineHeight: 21,
      marginBottom: 8,
    },
    input: {
      borderWidth: 1,
      borderRadius: 12,
      paddingHorizontal: 14,
      paddingVertical: 12,
      fontSize: 16,
    },
    primaryButton: {
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    primaryButtonText: {
      color: '#000',
      fontWeight: '700',
      fontSize: 16,
    },
    secondaryButton: {
      borderWidth: 1,
      borderRadius: 12,
      paddingVertical: 14,
      alignItems: 'center',
    },
    secondaryButtonText: {
      fontSize: 16,
      fontWeight: '600',
    },
    message: {
      marginTop: 8,
      fontSize: 14,
      lineHeight: 20,
      color: colors.textSecondary,
    },
  });
