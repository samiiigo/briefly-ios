export type SettingsProfilePlan = 'free' | 'plus';

export type SettingsProfile = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  plan: SettingsProfilePlan;
};

/** Dummy until auth/profile API exists. Swap the body of {@link fetchSettingsProfile}. */
const DUMMY_PROFILE: SettingsProfile = {
  email: 'you@briefly.app',
  displayName: 'You',
  avatarUrl: null,
  plan: 'free',
};

/** Backend seam — replace with a real GET /me (or equivalent). */
export async function fetchSettingsProfile(): Promise<SettingsProfile> {
  // ponytail: dummy until auth lands; return await api.get('/me')
  return DUMMY_PROFILE;
}

export function useSettingsProfile() {
  // ponytail: no React Query yet — sync dummy; swap for useQuery(fetchSettingsProfile) later
  return {
    profile: DUMMY_PROFILE,
    loading: false,
    error: null as string | null,
    refresh: fetchSettingsProfile,
  };
}
