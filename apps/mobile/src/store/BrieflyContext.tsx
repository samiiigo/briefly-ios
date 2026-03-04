import React, {createContext, useContext, useEffect, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {
  BrieflyStore,
  createInMemoryStorage,
  createLocalSummarizer,
  createCloudSummarizer,
} from '@briefly/shared';

type BrieflyStoreContextValue = {
  store: BrieflyStore;
  version: number;
};

const BrieflyStoreContext = createContext<BrieflyStoreContextValue | null>(null);

export function BrieflyStoreProvider({children}: {children: ReactNode}) {
  const [store] = useState(
    () =>
      new BrieflyStore({
        storage: createInMemoryStorage(),
        localSummarizer: createLocalSummarizer(),
        cloudSummarizer: createCloudSummarizer(),
      }),
  );
  const [version, setVersion] = useState(0);

  useEffect(() => {
    void store.hydrate();
  }, [store]);

  useEffect(() => store.subscribe(() => setVersion(current => current + 1)), [store]);

  const value = useMemo(() => ({store, version}), [store, version]);

  return (
    <BrieflyStoreContext.Provider value={value}>
      {children}
    </BrieflyStoreContext.Provider>
  );
}

export function useBrieflyStore() {
  const context = useContext(BrieflyStoreContext);
  if (!context) {
    throw new Error('useBrieflyStore must be used within BrieflyStoreProvider');
  }
  return context.store;
}

export function useBrieflyStoreVersion() {
  const context = useContext(BrieflyStoreContext);
  if (!context) {
    throw new Error('useBrieflyStoreVersion must be used within BrieflyStoreProvider');
  }
  return context.version;
}
