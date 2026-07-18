'use client';

import { Button, Stack, Text } from '@briefly/ui';
import { useAuth } from '@/features/auth';
import { useLibrary } from '@/features/library';

export function AccountPanel() {
  const { user, status, signOutUser, errorMessage } = useAuth();
  const { recordings, folders, loading, lastRefreshedAt, refresh } = useLibrary();

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
        {user?.id ? (
          <Text as="p" variant="caption">
            User ID: {user.id}
          </Text>
        ) : null}
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

      <div className="account-card">
        <Text as="p" variant="label">
          Sync status
        </Text>
        <Text as="p" variant="body">
          {loading ? 'Syncing…' : `${recordings.length} recordings · ${folders.length} folders`}
        </Text>
        <Text as="p" variant="caption">
          Last refreshed: {lastRefreshedAt ? new Date(lastRefreshedAt).toLocaleString() : 'Not yet'}
        </Text>
        <Button
          variant="primary"
          onClick={() => {
            void refresh();
          }}
          disabled={loading}
        >
          Refresh library
        </Button>
      </div>
    </Stack>
  );
}
