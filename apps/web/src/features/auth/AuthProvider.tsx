'use client';

import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { AuthSessionState, AuthUserProfile } from '@briefly/auth';
import { mapUser } from '@briefly/auth';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';

type AuthContextValue = AuthSessionState & {
  signInWithEmail: (email: string) => Promise<void>;
  signOutUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({
  children,
  initialUser = null,
}: {
  children: ReactNode;
  initialUser?: AuthUserProfile | null;
}) {
  const [status, setStatus] = useState<AuthSessionState['status']>(
    initialUser ? 'authenticated' : 'loading',
  );
  const [user, setUser] = useState<AuthUserProfile | null>(initialUser);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);

  useEffect(() => {
    let mounted = true;

    void supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        setStatus('unauthenticated');
        setUser(null);
        setErrorMessage(error.message);
        return;
      }
      const nextUser = mapUser(data.session?.user ?? null);
      setUser(nextUser);
      setStatus(nextUser ? 'authenticated' : 'unauthenticated');
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUser = mapUser(session?.user ?? null);
      setUser(nextUser);
      setStatus(nextUser ? 'authenticated' : 'unauthenticated');
      setErrorMessage(null);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      errorMessage,
      async signInWithEmail(email: string) {
        setErrorMessage(null);
        const redirectTo = `${window.location.origin}/auth/callback`;
        const { error } = await supabase.auth.signInWithOtp({
          email: email.trim(),
          options: { emailRedirectTo: redirectTo },
        });
        if (error) {
          setErrorMessage(error.message);
          throw error;
        }
      },
      async signOutUser() {
        setErrorMessage(null);
        const { error } = await supabase.auth.signOut();
        if (error) {
          setErrorMessage(error.message);
          throw error;
        }
      },
    }),
    [status, user, errorMessage, supabase],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider.');
  }
  return context;
}
