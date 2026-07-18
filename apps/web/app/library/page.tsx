import { Suspense } from 'react';
import { LibraryPage } from '@/features/library';

export default function Page() {
  return (
    <Suspense fallback={null}>
      <LibraryPage />
    </Suspense>
  );
}
