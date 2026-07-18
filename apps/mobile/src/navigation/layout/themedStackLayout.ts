import { useMemo } from 'react';
import { useThemedColors } from '@briefly/theme/native';
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
