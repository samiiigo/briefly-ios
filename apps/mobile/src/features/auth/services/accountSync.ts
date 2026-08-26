import type { Recording, UserFolder } from '@briefly/types';
import { getSupabaseClient } from '@/api/supabaseClient';
import type { AuthUserProfile } from '@briefly/auth';
import { getActiveStorageUserId } from '@/core/services/storage/storageScope';
import { logger } from '@/lib/utils/logging/logger';
import {
  folderUpdatedAt,
  mergeFoldersByUpdatedAt,
  mergeRecordingsByUpdatedAt,
  recordingUpdatedAt,
} from '@/features/auth/services/accountSyncMerge';

export { mergeFoldersByUpdatedAt, mergeRecordingsByUpdatedAt };

async function requireUserId(): Promise<string | null> {
  const scoped = getActiveStorageUserId();
  if (scoped) return scoped;
  const { data, error } = await getSupabaseClient().auth.getUser();
  if (error || !data.user) return null;
  return data.user.id;
}

export async function upsertUserProfile(user: AuthUserProfile): Promise<void> {
  const client = getSupabaseClient();
  const { error } = await client.from('profiles').upsert(
    {
      id: user.id,
      email: user.email ?? null,
      full_name: user.fullName ?? null,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'id' },
  );
  if (error) {
    logger.warn('AccountSync', 'Failed to upsert profile', { message: error.message });
  }
}

export async function pullRemoteRecordings(): Promise<Recording[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('account_recordings').select('payload');
  if (error) {
    logger.warn('AccountSync', 'Failed to pull recordings', { message: error.message });
    return [];
  }
  return (data ?? [])
    .map((row) => row.payload as Recording)
    .filter((recording) => recording && typeof recording.id === 'string');
}

export async function pullRemoteFolders(): Promise<UserFolder[]> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('account_folders').select('payload');
  if (error) {
    logger.warn('AccountSync', 'Failed to pull folders', { message: error.message });
    return [];
  }
  return (data ?? [])
    .map((row) => row.payload as UserFolder)
    .filter((folder) => folder && typeof folder.id === 'string');
}

export async function pullRemoteSettingsPayload(): Promise<Record<string, unknown> | null> {
  const client = getSupabaseClient();
  const { data, error } = await client.from('account_settings').select('payload').maybeSingle();
  if (error) {
    logger.warn('AccountSync', 'Failed to pull settings', { message: error.message });
    return null;
  }
  return (data?.payload as Record<string, unknown> | undefined) ?? null;
}

export async function pushRecording(recording: Recording): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const client = getSupabaseClient();
  const withStamp: Recording = {
    ...recording,
    updatedAt: recording.updatedAt ?? Date.now(),
  };
  const { error } = await client.from('account_recordings').upsert(
    {
      user_id: userId,
      recording_id: withStamp.id,
      payload: withStamp,
      updated_at: new Date(recordingUpdatedAt(withStamp)).toISOString(),
    },
    { onConflict: 'user_id,recording_id' },
  );
  if (error) {
    logger.warn('AccountSync', 'Failed to push recording', {
      id: recording.id,
      message: error.message,
    });
  }
}

export async function pushAllRecordings(recordings: Recording[]): Promise<void> {
  const userId = await requireUserId();
  if (!userId || recordings.length === 0) return;
  const client = getSupabaseClient();
  const rows = recordings.map((recording) => {
    const withStamp: Recording = {
      ...recording,
      updatedAt: recording.updatedAt ?? Date.now(),
    };
    return {
      user_id: userId,
      recording_id: withStamp.id,
      payload: withStamp,
      updated_at: new Date(recordingUpdatedAt(withStamp)).toISOString(),
    };
  });
  const { error } = await client.from('account_recordings').upsert(rows, {
    onConflict: 'user_id,recording_id',
  });
  if (error) {
    logger.warn('AccountSync', 'Failed to push recordings batch', { message: error.message });
  }
}

export async function deleteRemoteRecording(recordingId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const client = getSupabaseClient();
  const { error } = await client
    .from('account_recordings')
    .delete()
    .eq('user_id', userId)
    .eq('recording_id', recordingId);
  if (error) {
    logger.warn('AccountSync', 'Failed to delete remote recording', {
      id: recordingId,
      message: error.message,
    });
  }
}

export async function pushFolder(folder: UserFolder): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const client = getSupabaseClient();
  const withStamp: UserFolder = {
    ...folder,
    updatedAt: folder.updatedAt ?? Date.now(),
  };
  const { error } = await client.from('account_folders').upsert(
    {
      user_id: userId,
      folder_id: withStamp.id,
      payload: withStamp,
      updated_at: new Date(folderUpdatedAt(withStamp) || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,folder_id' },
  );
  if (error) {
    logger.warn('AccountSync', 'Failed to push folder', { id: folder.id, message: error.message });
  }
}

export async function pushAllFolders(folders: UserFolder[]): Promise<void> {
  const userId = await requireUserId();
  if (!userId || folders.length === 0) return;
  const client = getSupabaseClient();
  const rows = folders.map((folder) => {
    const withStamp: UserFolder = {
      ...folder,
      updatedAt: folder.updatedAt ?? Date.now(),
    };
    return {
      user_id: userId,
      folder_id: withStamp.id,
      payload: withStamp,
      updated_at: new Date(folderUpdatedAt(withStamp) || Date.now()).toISOString(),
    };
  });
  const { error } = await client.from('account_folders').upsert(rows, {
    onConflict: 'user_id,folder_id',
  });
  if (error) {
    logger.warn('AccountSync', 'Failed to push folders batch', { message: error.message });
  }
}

export async function deleteRemoteFolder(folderId: string): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const client = getSupabaseClient();
  const { error } = await client
    .from('account_folders')
    .delete()
    .eq('user_id', userId)
    .eq('folder_id', folderId);
  if (error) {
    logger.warn('AccountSync', 'Failed to delete remote folder', {
      id: folderId,
      message: error.message,
    });
  }
}

export async function pushSettingsPayload(payload: Record<string, unknown>): Promise<void> {
  const userId = await requireUserId();
  if (!userId) return;
  const client = getSupabaseClient();
  const { error } = await client.from('account_settings').upsert(
    {
      user_id: userId,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
  if (error) {
    logger.warn('AccountSync', 'Failed to push settings', { message: error.message });
  }
}
