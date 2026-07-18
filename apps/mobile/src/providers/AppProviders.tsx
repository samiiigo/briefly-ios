import type { ReactNode } from 'react';
import { AuthProvider } from '@/providers/AuthProvider';
import { AppErrorBoundary } from '@/providers/AppErrorBoundary';
import { ThemeProvider } from '@/shared/theme';

export function AppProviders({ children }: { children: ReactNode }) {
  return (
    <AppErrorBoundary>
      <ThemeProvider>
        <AuthProvider>{children}</AuthProvider>
      </ThemeProvider>
    </AppErrorBoundary>
  );
}
