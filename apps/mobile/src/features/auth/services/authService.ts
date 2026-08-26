import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import * as AppleAuthentication from 'expo-apple-authentication';
import { makeRedirectUri } from 'expo-auth-session';
import type { Session } from '@supabase/supabase-js';
import { mapUser, type AuthUserProfile } from '@briefly/auth';
import { getSupabaseClient } from '@/api/supabaseClient';

WebBrowser.maybeCompleteAuthSession();

const redirectTo = makeRedirectUri({ scheme: 'briefly', path: 'auth/callback' });

export async function getCurrentSession(): Promise<Session | null> {
  const { data, error } = await getSupabaseClient().auth.getSession();
  if (error) throw error;
  return data.session;
}

export async function getCurrentAuthUser(): Promise<AuthUserProfile | null> {
  const session = await getCurrentSession();
  return mapUser(session?.user ?? null);
}

export async function signInWithEmailOtp(email: string): Promise<void> {
  const { error } = await getSupabaseClient().auth.signInWithOtp({
    email: email.trim(),
    options: { emailRedirectTo: redirectTo },
  });
  if (error) throw error;
}

export async function signInWithAppleNative(): Promise<AuthUserProfile> {
  const credential = await AppleAuthentication.signInAsync({
    requestedScopes: [
      AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
      AppleAuthentication.AppleAuthenticationScope.EMAIL,
    ],
  });
  if (!credential.identityToken) {
    throw new Error('Apple Sign-In did not return an identity token.');
  }
  const { data, error } = await getSupabaseClient().auth.signInWithIdToken({
    provider: 'apple',
    token: credential.identityToken,
  });
  if (error) throw error;
  if (credential.fullName?.givenName || credential.fullName?.familyName) {
    const fullName = [credential.fullName.givenName, credential.fullName.familyName]
      .filter(Boolean)
      .join(' ');
    if (fullName) {
      await getSupabaseClient().auth.updateUser({
        data: { full_name: fullName },
      });
    }
  }
  const user = mapUser(data.user);
  if (!user) throw new Error('Apple Sign-In succeeded but no user was returned.');
  return user;
}

export async function signInWithGoogleOAuth(): Promise<AuthUserProfile> {
  const { data, error } = await getSupabaseClient().auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo,
      skipBrowserRedirect: true,
    },
  });
  if (error) throw error;
  if (!data.url) throw new Error('Google Sign-In did not return an authorization URL.');

  const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
  if (result.type !== 'success' || !result.url) {
    throw new Error('Google Sign-In was cancelled.');
  }
  await createSessionFromUrl(result.url);
  const user = await getCurrentAuthUser();
  if (!user) throw new Error('Google Sign-In succeeded but no session was created.');
  return user;
}

export async function createSessionFromUrl(url: string): Promise<void> {
  const parsed = Linking.parse(url);
  const queryParams = parsed.queryParams ?? {};
  const accessToken =
    typeof queryParams.access_token === 'string' ? queryParams.access_token : undefined;
  const refreshToken =
    typeof queryParams.refresh_token === 'string' ? queryParams.refresh_token : undefined;
  if (accessToken && refreshToken) {
    const { error } = await getSupabaseClient().auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    if (error) throw error;
    return;
  }

  const code = typeof queryParams.code === 'string' ? queryParams.code : undefined;
  if (code) {
    const { error } = await getSupabaseClient().auth.exchangeCodeForSession(code);
    if (error) throw error;
  }
}

export async function signOut(): Promise<void> {
  const { error } = await getSupabaseClient().auth.signOut();
  if (error) throw error;
}

export function subscribeToAuthChanges(
  onChange: (user: AuthUserProfile | null) => void,
): () => void {
  const { data } = getSupabaseClient().auth.onAuthStateChange((_event, session) => {
    onChange(mapUser(session?.user ?? null));
  });
  return () => data.subscription.unsubscribe();
}

export async function handleIncomingAuthUrl(url: string | null): Promise<void> {
  if (!url || !url.includes('auth/callback')) return;
  await createSessionFromUrl(url);
}

export function isAppleSignInAvailable(): boolean {
  return AppleAuthentication.isAvailableAsync !== undefined;
}

export async function canUseAppleSignIn(): Promise<boolean> {
  try {
    return await AppleAuthentication.isAvailableAsync();
  } catch {
    return false;
  }
}

export { mapUser } from '@briefly/auth';
