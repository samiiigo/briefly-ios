/**
 * Shared client-state conventions (scaffold).
 * Feature stores remain in apps; only cross-app store utilities belong here.
 */
export type StorePersistAdapter = {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => void | Promise<void>;
  removeItem: (name: string) => void | Promise<void>;
};
