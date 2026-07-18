/**
 * Shared authentication capabilities (scaffold).
 * Platform-specific Apple/Google/Expo flows stay in apps/mobile.
 */
export type { AuthStatus, AuthUserProfile, AuthSessionState, AuthProviderId } from '@briefly/types';

export type AuthAdapter = {
  getSession: () => Promise<unknown>;
  signOut: () => Promise<void>;
};

let adapter: AuthAdapter | null = null;

export function configureAuthAdapter(next: AuthAdapter): void {
  adapter = next;
}

export function getAuthAdapter(): AuthAdapter {
  if (!adapter) {
    throw new Error('@briefly/auth: configureAuthAdapter() before use');
  }
  return adapter;
}
