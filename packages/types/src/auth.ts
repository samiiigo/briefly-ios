export type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

export interface AuthUserProfile {
  id: string;
  email?: string;
  fullName?: string;
  avatarUrl?: string;
}

export interface AuthSessionState {
  status: AuthStatus;
  user: AuthUserProfile | null;
  errorMessage: string | null;
}

export type AuthProviderId = 'email' | 'apple' | 'google';
