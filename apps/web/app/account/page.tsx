'use client';

import { Button, Text, Stack } from '@briefly/ui';
import { useAuth } from '@/features/auth';

export default function AccountPage() {
  const { user, status, signOutUser, errorMessage } = useAuth();

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Account
        </Text>
        <Text as="p" variant="body">
          Manage the identity used across Briefly mobile and web.
        </Text>
      </header>

      <div className="account-card">
        <Text as="p" variant="label">
          {status === 'loading' ? 'Loading…' : (user?.fullName ?? 'Signed in')}
        </Text>
        <Text as="p" variant="body">
          {user?.email ?? 'No email on this session'}
        </Text>
        {errorMessage ? (
          <Text as="p" variant="caption" className="auth-error">
            {errorMessage}
          </Text>
        ) : null}
        <Button
          variant="secondary"
          onClick={() => {
            void signOutUser();
          }}
        >
          Sign out
        </Button>
      </div>
    </Stack>
  );
}
