import { useCallback, useEffect, useState } from 'react';
import * as Linking from 'expo-linking';
import {
  canUseAppleSignIn,
  getCurrentAuthUser,
  handleIncomingAuthUrl,
  signInWithAppleNative,
  signInWithEmailOtp,
  signInWithGoogleOAuth,
  signOut,
  subscribeToAuthChanges,
} from '@/features/auth/services/authService';
import type { AuthSessionState, AuthUserProfile } from '@briefly/auth';
import {
  activateStorageScopeForUser,
  deactivateStorageScope,
} from '@/features/auth/services/storageActivation';

export function useAuthSession(): AuthSessionState & {
  signInWithEmail: (email: string) => Promise<void>;
  signInWithApple: () => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signOutUser: () => Promise<void>;
  appleAvailable: boolean;
} {
  const [state, setState] = useState<AuthSessionState>({
    status: 'loading',
    user: null,
    errorMessage: null,
  });
  const [appleAvailable, setAppleAvailable] = useState(false);

  const applyUser = useCallback(async (user: AuthUserProfile | null) => {
    if (user) {
      await activateStorageScopeForUser(user);
      setState({ status: 'authenticated', user, errorMessage: null });
      return;
    }
    deactivateStorageScope();
    setState({ status: 'unauthenticated', user: null, errorMessage: null });
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const [user, apple] = await Promise.all([getCurrentAuthUser(), canUseAppleSignIn()]);
        if (!mounted) return;
        setAppleAvailable(apple);
        await applyUser(user);
      } catch (error) {
        if (!mounted) return;
        setAppleAvailable(false);
        deactivateStorageScope();
        setState({
          status: 'unauthenticated',
          user: null,
          errorMessage:
            error instanceof Error
              ? error.message
              : 'Unable to restore your session. Please sign in.',
        });
      }
    })();

    const unsubscribe = subscribeToAuthChanges((user) => {
      void applyUser(user).catch((error) => {
        if (!mounted) return;
        setState({
          status: 'unauthenticated',
          user: null,
          errorMessage:
            error instanceof Error ? error.message : 'Unable to activate your account data.',
        });
      });
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingAuthUrl(url).catch(() => undefined);
    });

    void Linking.getInitialURL().then((url) => handleIncomingAuthUrl(url).catch(() => undefined));

    return () => {
      mounted = false;
      unsubscribe();
      linkSub.remove();
    };
  }, [applyUser]);

  const signInWithEmail = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, errorMessage: null }));
    try {
      await signInWithEmailOtp(email);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unable to send sign-in email.';
      setState((prev) => ({ ...prev, errorMessage: message }));
      throw error;
    }
  }, []);

  const signInWithApple = useCallback(async () => {
    setState((prev) => ({ ...prev, errorMessage: null }));
    try {
      const user = await signInWithAppleNative();
      await applyUser(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Apple Sign-In failed.';
      setState((prev) => ({ ...prev, errorMessage: message }));
      throw error;
    }
  }, [applyUser]);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, errorMessage: null }));
    try {
      const user = await signInWithGoogleOAuth();
      await applyUser(user);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Google Sign-In failed.';
      setState((prev) => ({ ...prev, errorMessage: message }));
      throw error;
    }
  }, [applyUser]);

  const signOutUser = useCallback(async () => {
    await signOut();
    await applyUser(null);
  }, [applyUser]);

  return {
    ...state,
    signInWithEmail,
    signInWithApple,
    signInWithGoogle,
    signOutUser,
    appleAvailable,
  };
}
