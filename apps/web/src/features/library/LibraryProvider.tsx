'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type { Recording, UserFolder } from '@briefly/types';
import { useAuth } from '@/features/auth';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import {
  pullFolders,
  pullRecordings,
  pushRecording,
} from '@/features/library/api/accountLibraryApi';
import {
  computeLibraryFolderCounts,
  type LibraryFolderCounts,
} from '@/features/library/utils/folderCounts';
import { filterRecordingsForFolder } from '@/features/library/utils/filterFolderRecordings';
import { folderFlagsFor } from '@/features/library/utils/recordingFolder';

export interface LibraryContextValue {
  recordings: Recording[];
  folders: UserFolder[];
  counts: LibraryFolderCounts;
  loading: boolean;
  error: string | null;
  lastRefreshedAt: number | null;
  refresh: () => Promise<void>;
  getFolderRecordings: (folderId: string, folderType: 'built-in' | 'user') => Recording[];
  toggleFavorite: (recordingId: string) => Promise<void>;
  softDeleteRecording: (recordingId: string) => Promise<void>;
  restoreRecording: (recordingId: string) => Promise<void>;
  getRecordingById: (recordingId: string) => Recording | undefined;
}

const EMPTY_COUNTS: LibraryFolderCounts = {
  all: 0,
  unlisted: 0,
  imports: 0,
  favorites: 0,
  archived: 0,
  recentlyDeleted: 0,
  byUserFolderId: new Map(),
};

const LibraryContext = createContext<LibraryContextValue | null>(null);

export function LibraryProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [folders, setFolders] = useState<UserFolder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState<number | null>(null);

  const isAuthenticated = status === 'authenticated' && user != null;

  const refresh = useCallback(async () => {
    if (!isAuthenticated) {
      setRecordings([]);
      setFolders([]);
      setLastRefreshedAt(null);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [nextRecordings, nextFolders] = await Promise.all([
        pullRecordings(supabase),
        pullFolders(supabase),
      ]);
      setRecordings(nextRecordings);
      setFolders(nextFolders);
      setLastRefreshedAt(Date.now());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load library');
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, supabase]);

  useEffect(() => {
    if (status === 'loading') return;
    void refresh();
  }, [status, refresh]);

  const persistRecording = useCallback(
    async (recording: Recording) => {
      if (!user) return;
      const withStamp = { ...recording, updatedAt: Date.now() };
      setRecordings((prev) => {
        const idx = prev.findIndex((r) => r.id === withStamp.id);
        if (idx === -1) return [withStamp, ...prev];
        const next = [...prev];
        next[idx] = withStamp;
        return next;
      });
      try {
        await pushRecording(supabase, user.id, withStamp);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save recording');
      }
    },
    [supabase, user],
  );

  const getRecordingById = useCallback(
    (recordingId: string) => recordings.find((r) => r.id === recordingId),
    [recordings],
  );

  const getFolderRecordings = useCallback(
    (folderId: string, folderType: 'built-in' | 'user') =>
      filterRecordingsForFolder(recordings, folderId, folderType).sort(
        (a, b) => b.createdAt - a.createdAt,
      ),
    [recordings],
  );

  const toggleFavorite = useCallback(
    async (recordingId: string) => {
      const current = recordings.find((r) => r.id === recordingId);
      if (!current) return;
      await persistRecording({
        ...current,
        isFavorite: !current.isFavorite,
      });
    },
    [recordings, persistRecording],
  );

  const softDeleteRecording = useCallback(
    async (recordingId: string) => {
      const current = recordings.find((r) => r.id === recordingId);
      if (!current) return;
      await persistRecording({
        ...current,
        ...folderFlagsFor('recently-deleted', current),
      });
    },
    [recordings, persistRecording],
  );

  const restoreRecording = useCallback(
    async (recordingId: string) => {
      const current = recordings.find((r) => r.id === recordingId);
      if (!current) return;
      await persistRecording({
        ...current,
        ...folderFlagsFor('unlisted', current),
      });
    },
    [recordings, persistRecording],
  );

  const counts = useMemo(() => computeLibraryFolderCounts(recordings), [recordings]);

  const value = useMemo<LibraryContextValue>(
    () => ({
      recordings,
      folders,
      counts,
      loading,
      error,
      lastRefreshedAt,
      refresh,
      getFolderRecordings,
      toggleFavorite,
      softDeleteRecording,
      restoreRecording,
      getRecordingById,
    }),
    [
      recordings,
      folders,
      counts,
      loading,
      error,
      lastRefreshedAt,
      refresh,
      getFolderRecordings,
      toggleFavorite,
      softDeleteRecording,
      restoreRecording,
      getRecordingById,
    ],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibraryContext(): LibraryContextValue {
  const context = useContext(LibraryContext);
  if (!context) {
    return {
      recordings: [],
      folders: [],
      counts: EMPTY_COUNTS,
      loading: false,
      error: null,
      lastRefreshedAt: null,
      refresh: async () => {},
      getFolderRecordings: () => [],
      toggleFavorite: async () => {},
      softDeleteRecording: async () => {},
      restoreRecording: async () => {},
      getRecordingById: () => undefined,
    };
  }
  return context;
}
