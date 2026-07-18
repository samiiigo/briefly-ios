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
import type { CloudProvider, ProcessingMode, TranscriptionMode } from '@briefly/types';
import type { ThemePreference } from '@briefly/theme/native';
import { resolveColorScheme } from '@briefly/theme/native';
import { useAuth } from '@/features/auth';
import { createBrowserSupabaseClient } from '@/lib/supabase/browser';
import { pullSettings, pushSettings } from '@/features/library/api/accountLibraryApi';

export interface SettingsState {
  summarizationMode: ProcessingMode;
  transcriptionMode: TranscriptionMode;
  themePreference: ThemePreference;
  cloudProvider: CloudProvider;
}

export interface SettingsContextValue extends SettingsState {
  loading: boolean;
  saving: boolean;
  error: string | null;
  setSummarizationMode: (mode: ProcessingMode) => void;
  setTranscriptionMode: (mode: TranscriptionMode) => void;
  setThemePreference: (preference: ThemePreference) => void;
  setCloudProvider: (provider: CloudProvider) => void;
}

const DEFAULTS: SettingsState = {
  summarizationMode: 'cloud-shared-openrouter',
  transcriptionMode: 'cloud',
  themePreference: 'system',
  cloudProvider: 'openrouter',
};

const SettingsContext = createContext<SettingsContextValue | null>(null);

function normalizeSummarizationMode(value: unknown): ProcessingMode {
  if (value === 'cloud-user-key' || value === 'cloud') return 'cloud-user-key';
  if (value === 'cloud-shared-openrouter') return 'cloud-shared-openrouter';
  return DEFAULTS.summarizationMode;
}

function normalizeTranscriptionMode(value: unknown): TranscriptionMode {
  return value === 'local' ? 'local' : 'cloud';
}

function normalizeThemePreference(value: unknown): ThemePreference {
  if (value === 'light' || value === 'dark' || value === 'system') return value;
  return DEFAULTS.themePreference;
}

function normalizeCloudProvider(value: unknown): CloudProvider {
  if (value === 'openai' || value === 'gemini' || value === 'openrouter') return value;
  return DEFAULTS.cloudProvider;
}

function applyThemePreference(preference: ThemePreference): void {
  if (typeof document === 'undefined') return;
  const systemScheme = window.matchMedia('(prefers-color-scheme: light)').matches
    ? 'light'
    : 'dark';
  const resolved = resolveColorScheme(preference, systemScheme);
  document.documentElement.dataset.theme = resolved;
}

export function SettingsProvider({ children }: { children: ReactNode }) {
  const { status, user } = useAuth();
  const supabase = useMemo(() => createBrowserSupabaseClient(), []);
  const [state, setState] = useState<SettingsState>(DEFAULTS);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAuthenticated = status === 'authenticated' && user != null;

  const persist = useCallback(
    async (next: SettingsState) => {
      if (!user) return;
      setSaving(true);
      setError(null);
      try {
        await pushSettings(supabase, user.id, {
          summarizationMode: next.summarizationMode,
          transcriptionMode: next.transcriptionMode,
          themePreference: next.themePreference,
          cloudProvider: next.cloudProvider,
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to save settings');
      } finally {
        setSaving(false);
      }
    },
    [supabase, user],
  );

  useEffect(() => {
    if (status === 'loading') return;
    if (!isAuthenticated) {
      setState(DEFAULTS);
      applyThemePreference(DEFAULTS.themePreference);
      return;
    }

    let cancelled = false;
    setLoading(true);
    void pullSettings(supabase)
      .then((payload) => {
        if (cancelled) return;
        if (!payload) {
          setState(DEFAULTS);
          applyThemePreference(DEFAULTS.themePreference);
          return;
        }
        const next: SettingsState = {
          summarizationMode: normalizeSummarizationMode(payload.summarizationMode),
          transcriptionMode: normalizeTranscriptionMode(payload.transcriptionMode),
          themePreference: normalizeThemePreference(payload.themePreference),
          cloudProvider: normalizeCloudProvider(payload.cloudProvider),
        };
        setState(next);
        applyThemePreference(next.themePreference);
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load settings');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [status, isAuthenticated, supabase]);

  useEffect(() => {
    applyThemePreference(state.themePreference);
    const media = window.matchMedia('(prefers-color-scheme: light)');
    const onChange = () => applyThemePreference(state.themePreference);
    media.addEventListener('change', onChange);
    return () => media.removeEventListener('change', onChange);
  }, [state.themePreference]);

  const update = useCallback(
    (patch: Partial<SettingsState>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        void persist(next);
        return next;
      });
    },
    [persist],
  );

  const value = useMemo<SettingsContextValue>(
    () => ({
      ...state,
      loading,
      saving,
      error,
      setSummarizationMode: (mode) => update({ summarizationMode: mode }),
      setTranscriptionMode: (mode) => update({ transcriptionMode: mode }),
      setThemePreference: (preference) => update({ themePreference: preference }),
      setCloudProvider: (provider) => update({ cloudProvider: provider }),
    }),
    [state, loading, saving, error, update],
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const context = useContext(SettingsContext);
  if (!context) {
    return {
      ...DEFAULTS,
      loading: false,
      saving: false,
      error: null,
      setSummarizationMode: () => {},
      setTranscriptionMode: () => {},
      setThemePreference: () => {},
      setCloudProvider: () => {},
    };
  }
  return context;
}
