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

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function SignInScreen() {
  const colors = useThemedColors();
  const styles = useCreateStyles(createSignInStyles);
  const {
    status,
    errorMessage,
    signInWithEmail,
    signInWithApple,
    signInWithGoogle,
    appleAvailable,
  } = useAuth();
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [pending, setPending] = useState<'email' | 'apple' | 'google' | null>(null);

  const canSubmitEmail = useMemo(() => isValidEmail(email), [email]);
  const displayMessage = message ?? errorMessage;

  async function handleEmailSignIn(): Promise<void> {
    if (!canSubmitEmail || pending) return;
    setPending('email');
    setMessage(null);
    try {
      await signInWithEmail(email.trim());
      setMessage('Check your email for a magic link to finish signing in.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to send sign-in email.');
    } finally {
      setPending(null);
    }
  }

  async function handleProviderSignIn(provider: 'apple' | 'google'): Promise<void> {
    if (pending) return;
    setPending(provider);
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
      setPending(null);
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
        <Text style={[styles.brand, { color: colors.primary }]}>Briefly</Text>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Sign in to continue</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sign in to open the library for this account. Recordings stay with the account that
          created them.
        </Text>

        <TextInput
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoCorrect={false}
          keyboardType="email-address"
          textContentType="emailAddress"
          autoComplete="email"
          placeholder="Email address"
          placeholderTextColor={colors.textSecondary}
          editable={!pending}
          style={[
            styles.input,
            { color: colors.textPrimary, borderColor: colors.border, backgroundColor: colors.surface },
          ]}
        />

        <Pressable
          disabled={!canSubmitEmail || !!pending}
          onPress={() => void handleEmailSignIn()}
          style={[
            styles.primaryButton,
            { backgroundColor: colors.primary, opacity: !canSubmitEmail || pending ? 0.5 : 1 },
          ]}
        >
          {pending === 'email' ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.primaryButtonText}>Continue with email</Text>
          )}
        </Pressable>

        {appleAvailable ? (
          <Pressable
            disabled={!!pending}
            onPress={() => void handleProviderSignIn('apple')}
            style={[styles.secondaryButton, { borderColor: colors.border, opacity: pending ? 0.5 : 1 }]}
          >
            {pending === 'apple' ? (
              <ActivityIndicator color={colors.textPrimary} />
            ) : (
              <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
                Continue with Apple
              </Text>
            )}
          </Pressable>
        ) : null}

        <Pressable
          disabled={!!pending}
          onPress={() => void handleProviderSignIn('google')}
          style={[styles.secondaryButton, { borderColor: colors.border, opacity: pending ? 0.5 : 1 }]}
        >
          {pending === 'google' ? (
            <ActivityIndicator color={colors.textPrimary} />
          ) : (
            <Text style={[styles.secondaryButtonText, { color: colors.textPrimary }]}>
              Continue with Google
            </Text>
          )}
        </Pressable>

        {displayMessage ? (
          <Text style={[styles.message, { color: colors.textSecondary }]}>{displayMessage}</Text>
        ) : null}
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
    brand: {
      fontSize: 34,
      fontWeight: '800',
      letterSpacing: -0.5,
    },
    title: {
      fontSize: 22,
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
      minHeight: 48,
      justifyContent: 'center',
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
      minHeight: 48,
      justifyContent: 'center',
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
