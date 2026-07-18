import React, { createContext, useContext } from 'react';

const ChromeFadeColorContext = createContext<string | null>(null);

/** Override the edge-blur fade target (e.g. settings sheet surface grey). */
export function ChromeFadeColorProvider({
  color,
  children,
}: {
  color: string;
  children: React.ReactNode;
}) {
  return (
    <ChromeFadeColorContext.Provider value={color}>{children}</ChromeFadeColorContext.Provider>
  );
}

export function useChromeFadeColor(): string | null {
  return useContext(ChromeFadeColorContext);
}
