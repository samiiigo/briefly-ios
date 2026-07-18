import Link from 'next/link';
import { Button, Text, Stack } from '@briefly/ui';
import { createServerSupabaseClient } from '@/lib/supabase/server';
import { mapUser } from '@briefly/auth';

export default async function HomePage() {
  let greeting = 'Welcome back';
  try {
    const supabase = await createServerSupabaseClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    const profile = mapUser(user);
    if (profile?.fullName || profile?.email) {
      greeting = `Welcome back, ${profile.fullName ?? profile.email}`;
    }
  } catch {
    // Env may be unset in local preview without .env
  }

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Dashboard
        </Text>
        <Text as="p" variant="body">
          {greeting}. Your library, search, and account settings live in the sidebar.
        </Text>
      </header>

      <div className="dashboard-actions">
        <Link href="/library">
          <Button variant="primary">Open library</Button>
        </Link>
        <Link href="/search">
          <Button variant="secondary">Search recordings</Button>
        </Link>
      </div>
    </Stack>
  );
}
