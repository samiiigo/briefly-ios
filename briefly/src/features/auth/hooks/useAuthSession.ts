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
import type { AuthSessionState } from '@/features/auth/types/auth.types';
import { activateStorageScopeForUser, deactivateStorageScope } from '@/features/auth/services/storageActivation';

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

  const applyUser = useCallback(async (user: AuthSessionState['user']) => {
    if (user) {
      await activateStorageScopeForUser(user.id);
      setState({ status: 'authenticated', user, errorMessage: null });
      return;
    }
    deactivateStorageScope();
    setState({ status: 'unauthenticated', user: null, errorMessage: null });
  }, []);

  useEffect(() => {
    let mounted = true;
    void (async () => {
      const [user, apple] = await Promise.all([getCurrentAuthUser(), canUseAppleSignIn()]);
      if (!mounted) return;
      setAppleAvailable(apple);
      await applyUser(user);
    })();

    const unsubscribe = subscribeToAuthChanges((user) => {
      void applyUser(user);
    });

    const linkSub = Linking.addEventListener('url', ({ url }) => {
      void handleIncomingAuthUrl(url);
    });

    void Linking.getInitialURL().then((url) => handleIncomingAuthUrl(url));

    return () => {
      mounted = false;
      unsubscribe();
      linkSub.remove();
    };
  }, [applyUser]);

  const signInWithEmail = useCallback(async (email: string) => {
    setState((prev) => ({ ...prev, errorMessage: null }));
    await signInWithEmailOtp(email);
  }, []);

  const signInWithApple = useCallback(async () => {
    setState((prev) => ({ ...prev, errorMessage: null }));
    const user = await signInWithAppleNative();
    await applyUser(user);
  }, [applyUser]);

  const signInWithGoogle = useCallback(async () => {
    setState((prev) => ({ ...prev, errorMessage: null }));
    const user = await signInWithGoogleOAuth();
    await applyUser(user);
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
