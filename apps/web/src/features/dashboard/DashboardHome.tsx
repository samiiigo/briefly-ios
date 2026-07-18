'use client';

import Link from 'next/link';
import { Button, Stack, Text } from '@briefly/ui';
import { useAuth } from '@/features/auth';
import { useLibrary } from '@/features/library';

export function DashboardHome() {
  const { user, status } = useAuth();
  const { recordings, folders, counts, loading } = useLibrary();

  const greeting =
    status === 'loading'
      ? 'Welcome back'
      : user?.fullName || user?.email
        ? `Welcome back, ${user.fullName ?? user.email}`
        : 'Welcome back';

  const recent = [...recordings]
    .filter((r) => r.deletedAt == null)
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, 5);

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Dashboard
        </Text>
        <Text as="p" variant="body">
          {greeting}. Your library syncs from your Briefly account.
        </Text>
      </header>

      <div className="stat-grid">
        <div className="stat-card">
          <Text as="span" variant="caption">
            Total recordings
          </Text>
          <Text as="span" variant="title" className="stat-card__value">
            {loading ? '…' : counts.all}
          </Text>
        </div>
        <div className="stat-card">
          <Text as="span" variant="caption">
            Favorites
          </Text>
          <Text as="span" variant="title" className="stat-card__value">
            {loading ? '…' : counts.favorites}
          </Text>
        </div>
        <div className="stat-card">
          <Text as="span" variant="caption">
            Folders
          </Text>
          <Text as="span" variant="title" className="stat-card__value">
            {loading ? '…' : folders.length}
          </Text>
        </div>
        <div className="stat-card">
          <Text as="span" variant="caption">
            Recently deleted
          </Text>
          <Text as="span" variant="title" className="stat-card__value">
            {loading ? '…' : counts.recentlyDeleted}
          </Text>
        </div>
      </div>

      <div className="dashboard-actions">
        <Link href="/library">
          <Button variant="primary">Open library</Button>
        </Link>
        <Link href="/search">
          <Button variant="secondary">Search recordings</Button>
        </Link>
      </div>

      <section>
        <Text as="h2" variant="label">
          Recent recordings
        </Text>
        {loading ? (
          <Text as="p" variant="caption">
            Loading…
          </Text>
        ) : recent.length === 0 ? (
          <Text as="p" variant="caption">
            No recordings yet. Record on mobile to sync here.
          </Text>
        ) : (
          <ul className="recording-list recording-list--compact">
            {recent.map((recording) => (
              <li key={recording.id} className="recording-row">
                <Link href={`/recording/${recording.id}`} className="recording-row__link">
                  <span className="recording-row__emoji" aria-hidden>
                    {recording.mainEmoji ?? '🎙️'}
                  </span>
                  <Text as="span" variant="label">
                    {recording.title}
                  </Text>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Stack>
  );
}
