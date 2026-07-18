import type { SupabaseClient } from '@supabase/supabase-js';
import type { Recording, UserFolder } from '@briefly/types';
import { folderUpdatedAt, recordingUpdatedAt } from './merge';

export async function pullRecordings(client: SupabaseClient): Promise<Recording[]> {
  const { data, error } = await client.from('account_recordings').select('payload');
  if (error) return [];
  return (data ?? [])
    .map((row) => row.payload as Recording)
    .filter((recording) => recording && typeof recording.id === 'string');
}

export async function pullFolders(client: SupabaseClient): Promise<UserFolder[]> {
  const { data, error } = await client.from('account_folders').select('payload');
  if (error) return [];
  return (data ?? [])
    .map((row) => row.payload as UserFolder)
    .filter((folder) => folder && typeof folder.id === 'string');
}

export async function pullSettings(
  client: SupabaseClient,
): Promise<Record<string, unknown> | null> {
  const { data, error } = await client.from('account_settings').select('payload').maybeSingle();
  if (error) return null;
  return (data?.payload as Record<string, unknown> | undefined) ?? null;
}

export async function pushRecording(
  client: SupabaseClient,
  userId: string,
  recording: Recording,
): Promise<void> {
  const withStamp: Recording = {
    ...recording,
    updatedAt: recording.updatedAt ?? Date.now(),
  };
  await client.from('account_recordings').upsert(
    {
      user_id: userId,
      recording_id: withStamp.id,
      payload: withStamp,
      updated_at: new Date(recordingUpdatedAt(withStamp)).toISOString(),
    },
    { onConflict: 'user_id,recording_id' },
  );
}

export async function pushFolder(
  client: SupabaseClient,
  userId: string,
  folder: UserFolder,
): Promise<void> {
  const withStamp: UserFolder = {
    ...folder,
    updatedAt: folder.updatedAt ?? Date.now(),
  };
  await client.from('account_folders').upsert(
    {
      user_id: userId,
      folder_id: withStamp.id,
      payload: withStamp,
      updated_at: new Date(folderUpdatedAt(withStamp) || Date.now()).toISOString(),
    },
    { onConflict: 'user_id,folder_id' },
  );
}

export async function deleteRecording(
  client: SupabaseClient,
  userId: string,
  recordingId: string,
): Promise<void> {
  await client
    .from('account_recordings')
    .delete()
    .eq('user_id', userId)
    .eq('recording_id', recordingId);
}

export async function deleteFolder(
  client: SupabaseClient,
  userId: string,
  folderId: string,
): Promise<void> {
  await client.from('account_folders').delete().eq('user_id', userId).eq('folder_id', folderId);
}

export async function pushSettings(
  client: SupabaseClient,
  userId: string,
  payload: Record<string, unknown>,
): Promise<void> {
  await client.from('account_settings').upsert(
    {
      user_id: userId,
      payload,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id' },
  );
}
