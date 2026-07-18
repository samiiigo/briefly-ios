'use client';

import Link from 'next/link';
import { formatDate, formatDuration } from '@briefly/utils';
import { Button, Text } from '@briefly/ui';
import type { Recording } from '@briefly/types';
import { useLibrary } from '@/features/library/hooks/useLibrary';

export interface RecordingListProps {
  recordings: Recording[];
  showRestore?: boolean;
  emptyMessage?: string;
}

export function RecordingList({
  recordings,
  showRestore = false,
  emptyMessage = 'No recordings in this folder.',
}: RecordingListProps) {
  const { toggleFavorite, restoreRecording } = useLibrary();

  if (recordings.length === 0) {
    return (
      <Text as="p" variant="caption">
        {emptyMessage}
      </Text>
    );
  }

  return (
    <ul className="recording-list">
      {recordings.map((recording) => (
        <li key={recording.id} className="recording-row">
          <Link href={`/recording/${recording.id}`} className="recording-row__link">
            <span className="recording-row__emoji" aria-hidden>
              {recording.mainEmoji ?? '🎙️'}
            </span>
            <span className="recording-row__body">
              <Text as="span" variant="label" className="recording-row__title">
                {recording.title}
              </Text>
              <Text as="span" variant="caption" className="recording-row__meta">
                {formatDate(recording.createdAt)} · {formatDuration(recording.duration)} ·{' '}
                {recording.status}
              </Text>
            </span>
          </Link>
          <div className="recording-row__actions">
            <Button
              variant="ghost"
              className={recording.isFavorite ? 'recording-row__star--active' : ''}
              aria-label={recording.isFavorite ? 'Remove from favorites' : 'Add to favorites'}
              onClick={() => {
                void toggleFavorite(recording.id);
              }}
            >
              {recording.isFavorite ? '★' : '☆'}
            </Button>
            {showRestore ? (
              <Button
                variant="secondary"
                onClick={() => {
                  void restoreRecording(recording.id);
                }}
              >
                Restore
              </Button>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  );
}
