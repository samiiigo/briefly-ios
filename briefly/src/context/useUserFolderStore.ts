import { create } from 'zustand';
import { UserFolder } from '@/types';
import { FolderStorageService } from '@/services/storage';
import type { FolderRepository } from '@/services/storage';
import { generateId } from '@/utils';
import { MAX_PINNED_FOLDERS } from '@/constants/userFolders';
import { sortUserFolders } from '@/utils/folders/userFolderSort';

export interface UserFolderStore {
  folders: UserFolder[];
  hasLoaded: boolean;
  loadFolders: () => Promise<void>;
  addFolder: (name: string) => Promise<UserFolder>;
  renameFolder: (id: string, name: string) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  toggleFolderPinned: (id: string) => Promise<void>;
}

function normalizeFolderName(name: string): string {
  return name.trim();
}

function hasDuplicateFolderName(folders: UserFolder[], name: string, excludeId?: string): boolean {
  const normalized = name.toLowerCase();
  return folders.some((folder) => {
    if (excludeId && folder.id === excludeId) {
      return false;
    }
    return folder.name.toLowerCase() === normalized;
  });
}

let folderRepository: FolderRepository = FolderStorageService;

export function configureFolderRepository(repository: FolderRepository): void {
  folderRepository = repository;
}

export function resetFolderRepository(): void {
  folderRepository = FolderStorageService;
}

export const useUserFolderStore = create<UserFolderStore>((set, get) => ({
  folders: [],
  hasLoaded: false,

  loadFolders: async () => {
    const raw = await folderRepository.loadAll();
    const folders = sortUserFolders(raw);
    set({ folders, hasLoaded: true });
  },

  addFolder: async (name: string) => {
    const trimmed = normalizeFolderName(name);
    if (!trimmed) throw new Error('Folder name cannot be empty');
    const existing = get().folders;
    const duplicate = hasDuplicateFolderName(existing, trimmed);
    if (duplicate) throw new Error('A folder with this name already exists');
    const folder: UserFolder = { id: `uf_${generateId()}`, name: trimmed };
    await folderRepository.save(folder);
    set((state) => ({ folders: sortUserFolders([...state.folders, folder]) }));
    return folder;
  },

  renameFolder: async (id: string, name: string) => {
    const trimmed = normalizeFolderName(name);
    if (!trimmed) throw new Error('Folder name cannot be empty');
    const existing = get().folders;
    const duplicate = hasDuplicateFolderName(existing, trimmed, id);
    if (duplicate) throw new Error('A folder with this name already exists');
    const folder = existing.find((folderItem) => folderItem.id === id);
    if (!folder) throw new Error('Folder not found');
    const updated = { ...folder, name: trimmed };
    await folderRepository.save(updated);
    set((state) => ({
      folders: sortUserFolders(
        state.folders.map((folderItem) => (folderItem.id === id ? updated : folderItem))
      ),
    }));
  },

  toggleFolderPinned: async (id: string) => {
    const existing = get().folders.find((f) => f.id === id);
    if (!existing) return;
    const nextPinned = !existing.pinned;
    if (nextPinned) {
      const pinnedCount = get().folders.filter((f) => f.pinned).length;
      if (pinnedCount >= MAX_PINNED_FOLDERS) {
        throw new Error(`You can pin up to ${MAX_PINNED_FOLDERS} folders`);
      }
    }
    const updated: UserFolder = {
      ...existing,
      pinned: nextPinned,
      pinnedAt: nextPinned ? Date.now() : undefined,
    };
    await folderRepository.save(updated);
    set((state) => ({
      folders: sortUserFolders(
        state.folders.map((f) => (f.id === id ? updated : f))
      ),
    }));
  },

  deleteFolder: async (id: string) => {
    await folderRepository.remove(id);
    set((state) => ({ folders: state.folders.filter((folderItem) => folderItem.id !== id) }));
  },
}));
