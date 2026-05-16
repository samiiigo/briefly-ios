import { Recording, UserFolder } from '@/types';

export interface RecordingRepository {
  loadAll(): Promise<Recording[]>;
  save(recording: Recording): Promise<void>;
  update(id: string, updates: Partial<Recording>): Promise<void>;
  remove(id: string): Promise<void>;
  saveAll(recordings: Recording[]): Promise<void>;
}

export interface FolderRepository {
  loadAll(): Promise<UserFolder[]>;
  save(folder: UserFolder): Promise<void>;
  remove(id: string): Promise<void>;
}
