import type { SupabaseClient } from '@supabase/supabase-js';
import type { Recording, UserFolder } from '@briefly/types';
import type { AccountSettingsPayload } from '../../services/settingsService.js';

interface AccountRecordingRow {
  payload: Recording;
}

interface AccountFolderRow {
  payload: UserFolder;
}

interface AccountSettingsRow {
  payload: AccountSettingsPayload;
}

/** List account-scoped recordings for a user (newest first). */
export async function listRecordings(
  supabase: SupabaseClient,
  userId: string,
): Promise<Recording[]> {
  const { data, error } = await supabase
    .from('account_recordings')
    .select('payload')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: AccountRecordingRow) => row.payload);
}

/** List account-scoped user folders for a user. */
export async function listFolders(supabase: SupabaseClient, userId: string): Promise<UserFolder[]> {
  const { data, error } = await supabase
    .from('account_folders')
    .select('payload')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row: AccountFolderRow) => row.payload);
}

/** Read synced settings payload from account_settings. */
export async function getSettings(
  supabase: SupabaseClient,
  userId: string,
): Promise<AccountSettingsPayload | null> {
  const { data, error } = await supabase
    .from('account_settings')
    .select('payload')
    .eq('user_id', userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    return null;
  }

  return (data as AccountSettingsRow).payload;
}
