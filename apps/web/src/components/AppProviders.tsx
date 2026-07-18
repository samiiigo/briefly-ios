import { mapUser } from '@briefly/auth';
import { AuthProvider } from '@/features/auth';
import { LibraryProvider } from '@/features/library';
import { SettingsProvider } from '@/features/settings';
import { createServerSupabaseClient } from '@/lib/supabase/server';

export async function AppProviders({ children }: { children: React.ReactNode }) {
  let initialUser = null;
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    initialUser = mapUser(user);
  } catch {
    initialUser = null;
  }

  return (
    <AuthProvider initialUser={initialUser}>
      <LibraryProvider>
        <SettingsProvider>{children}</SettingsProvider>
      </LibraryProvider>
    </AuthProvider>
  );
}
