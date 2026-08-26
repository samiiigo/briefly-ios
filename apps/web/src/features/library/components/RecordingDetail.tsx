'use client';

import Link from 'next/link';
import { formatDate, formatDuration } from '@briefly/utils';
import { Button, Stack, Text } from '@briefly/ui';
import { useLibrary } from '@/features/library/hooks/useLibrary';

export function RecordingDetail({ recordingId }: { recordingId: string }) {
  const { getRecordingById, toggleFavorite, softDeleteRecording, restoreRecording } = useLibrary();
  const recording = getRecordingById(recordingId);

  if (!recording) {
    return (
      <Stack gap="md">
        <Text as="h1" variant="title">
          Recording not found
        </Text>
        <Link href="/library">
          <Button variant="secondary">Back to library</Button>
        </Link>
      </Stack>
    );
  }

  const isDeleted = recording.deletedAt != null;

  return (
    <Stack gap="lg">
      <header className="page-header">
        <Link href="/library" className="recording-detail__back">
          <Text as="span" variant="caption">
            ← Library
          </Text>
        </Link>
        <Text as="h1" variant="title">
          {recording.mainEmoji ? `${recording.mainEmoji} ` : ''}
          {recording.title}
        </Text>
        <Text as="p" variant="body">
          {formatDate(recording.createdAt)} · {formatDuration(recording.duration)} ·{' '}
          {recording.status}
        </Text>
      </header>

      <div className="recording-detail__actions">
        <Button
          variant="ghost"
          onClick={() => {
            void toggleFavorite(recording.id);
          }}
        >
          {recording.isFavorite ? '★ Favorited' : '☆ Favorite'}
        </Button>
        {isDeleted ? (
          <Button
            variant="secondary"
            onClick={() => {
              void restoreRecording(recording.id);
            }}
          >
            Restore
          </Button>
        ) : (
          <Button
            variant="secondary"
            onClick={() => {
              void softDeleteRecording(recording.id);
            }}
          >
            Delete
          </Button>
        )}
      </div>

      {recording.summary ? (
        <section className="recording-detail__section">
          <Text as="h2" variant="label">
            Summary
          </Text>
          <Text as="p" variant="body">
            {recording.summary}
          </Text>
        </section>
      ) : null}

      {recording.keyInsights && recording.keyInsights.length > 0 ? (
        <section className="recording-detail__section">
          <Text as="h2" variant="label">
            Key insights
          </Text>
          <ul className="insight-list">
            {recording.keyInsights.map((insight) => (
              <li key={insight.id}>
                <Text as="span" variant="body">
                  {insight.text}
                </Text>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {recording.transcript && recording.transcript.length > 0 ? (
        <section className="recording-detail__section">
          <Text as="h2" variant="label">
            Transcript
          </Text>
          <div className="transcript-block">
            {recording.transcript.map((segment) => (
              <p key={segment.id} className="transcript-segment">
                {segment.speaker ? (
                  <Text as="span" variant="label" className="transcript-speaker">
                    {segment.speaker}:{' '}
                  </Text>
                ) : null}
                <Text as="span" variant="body">
                  {segment.text}
                </Text>
              </p>
            ))}
          </div>
        </section>
      ) : null}

      {recording.errorMessage ? (
        <Text as="p" variant="caption" className="auth-error">
          {recording.errorMessage}
        </Text>
      ) : null}
    </Stack>
  );
}
