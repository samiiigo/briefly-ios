import { useMemo } from 'react';
import { useThemedColors } from '@/theme';
/** Root + stack content backgrounds that follow the active theme. */
export function useThemedStackShell() {
  const colors = useThemedColors();
  return useMemo(
    () => ({
      root: { flex: 1 as const, backgroundColor: colors.background },
      contentStyle: { backgroundColor: colors.background },
    }),
    [colors.background],
  );
}
