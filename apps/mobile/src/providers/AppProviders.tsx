import type { ReactNode } from 'react';
import { ThemeProvider } from '@briefly/theme/native';
import { useSettingsStore } from '@/features/settings/state/useSettingsStore';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppErrorBoundary } from '@/providers/AppErrorBoundary';

function ThemedApp({ children }: { children: ReactNode }) {
  const preference = useSettingsStore((s) => s.themePreference);
  return <ThemeProvider preference={preference}>{children}</ThemeProvider>;
}

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <ThemedApp>
        <AuthProvider>{children}</AuthProvider>
      </ThemedApp>
    </AppErrorBoundary>
  );
}
