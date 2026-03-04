import React, {createContext, useContext, useMemo, useState} from 'react';
import type {ReactNode} from 'react';
import {
  BrieflyStore,
  createInMemoryStorage,
  createLocalSummarizer,
  createCloudSummarizer,
} from '@briefly/shared';

const BrieflyStoreContext = createContext<BrieflyStore | null>(null);

export function BrieflyStoreProvider({children}: {children: ReactNode}) {
  const [store] = useState(
    () =>
      new BrieflyStore({
        storage: createInMemoryStorage(),
        localSummarizer: createLocalSummarizer(),
        cloudSummarizer: createCloudSummarizer(),
      }),
  );

  const value = useMemo(() => store, [store]);

  return (
    <BrieflyStoreContext.Provider value={value}>
      {children}
    </BrieflyStoreContext.Provider>
  );
}

export function useBrieflyStore() {
  const store = useContext(BrieflyStoreContext);
  if (!store) {
    throw new Error('useBrieflyStore must be used within BrieflyStoreProvider');
  }
  return store;
}
