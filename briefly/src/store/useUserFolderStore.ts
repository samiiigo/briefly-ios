import { create } from 'zustand';
import { UserFolder } from '../types';
import { StorageService } from '../services/StorageService';
import { generateId } from '../utils';

export const useUserFolderStore = create<UserFolderStore>((set, get) => ({
  folders: [],
  hasLoaded: false,

  loadFolders: async () => {
    const folders = await StorageService.loadUserFolders();
    set({ folders, hasLoaded: true });
  },

  addFolder: async (name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Folder name cannot be empty');
    const existing = get().folders;
    const duplicate = existing.some(
      (f) => f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw new Error('A folder with this name already exists');
    const folder: UserFolder = { id: `uf_${generateId()}`, name: trimmed };
    await StorageService.saveUserFolder(folder);
    set((s) => ({ folders: [...s.folders, folder] }));
    return folder;
  },

  renameFolder: async (id, name) => {
    const trimmed = name.trim();
    if (!trimmed) throw new Error('Folder name cannot be empty');
    const existing = get().folders;
    const duplicate = existing.some(
      (f) => f.id !== id && f.name.toLowerCase() === trimmed.toLowerCase()
    );
    if (duplicate) throw new Error('A folder with this name already exists');
    const folder = existing.find((f) => f.id === id);
    if (!folder) throw new Error('Folder not found');
    const updated = { ...folder, name: trimmed };
    await StorageService.saveUserFolder(updated);
    set((s) => ({
      folders: s.folders.map((f) => (f.id === id ? updated : f)),
    }));
  },

  deleteFolder: async (id) => {
    await StorageService.deleteUserFolder(id);
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));
  },
}));
