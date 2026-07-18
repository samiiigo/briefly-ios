import { useMemo } from 'react';
import { useAuth } from '@/providers/AuthProvider';

export type SettingsProfilePlan = 'free' | 'plus';

export type SettingsProfile = {
  email: string;
  displayName: string | null;
  avatarUrl: string | null;
  plan: SettingsProfilePlan;
};

export function useSettingsProfile() {
  const { user } = useAuth();
  const profile = useMemo<SettingsProfile>(
    () => ({
      email: user?.email ?? 'Signed in',
      displayName: user?.fullName ?? null,
      avatarUrl: user?.avatarUrl ?? null,
      plan: 'free',
    }),
    [user],
  );

  return {
    profile,
    loading: false,
    error: null as string | null,
    refresh: async () => profile,
  };
}
