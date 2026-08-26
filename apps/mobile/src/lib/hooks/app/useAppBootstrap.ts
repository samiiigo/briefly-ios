import { useEffect } from 'react';
import { useRecordingStore } from '@/features/recording/state/useRecordingStore';
import {
  installStartupLogging,
  loadRecordingsOnStartup,
  runAfterSettingsHydrated,
  subscribeSettingsHydration,
} from '@/core/bootstrap/appStartup';
export function useAppBootstrap(iconFontsLoaded: boolean, isAuthenticated: boolean) {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  useEffect(() => {
    if (!iconFontsLoaded || !isAuthenticated) return;
    installStartupLogging();
    let hydrationUnsub: (() => void) | undefined;
    void (async () => {
      await loadRecordingsOnStartup(loadRecordings);
      hydrationUnsub = subscribeSettingsHydration(runAfterSettingsHydrated);
    })();
    return () => hydrationUnsub?.();
  }, [iconFontsLoaded, isAuthenticated, loadRecordings]);
}
