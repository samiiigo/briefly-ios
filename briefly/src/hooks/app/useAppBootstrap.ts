import { useEffect } from 'react';
import { useRecordingStore } from '@/context/useRecordingStore';
import {
  installStartupLogging,
  loadRecordingsOnStartup,
  runAfterSettingsHydrated,
  subscribeSettingsHydration,
} from '@/bootstrap/appStartup';
export function useAppBootstrap(iconFontsLoaded: boolean) {
  const loadRecordings = useRecordingStore((s) => s.loadRecordings);
  useEffect(() => {
    if (!iconFontsLoaded) return;
    installStartupLogging();
    let hydrationUnsub: (() => void) | undefined;
    void (async () => {
      await loadRecordingsOnStartup(loadRecordings);
      hydrationUnsub = subscribeSettingsHydration(runAfterSettingsHydrated);
    })();
    return () => hydrationUnsub?.();
  }, [iconFontsLoaded, loadRecordings]);
}
