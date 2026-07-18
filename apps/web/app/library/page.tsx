import { Text, Stack } from '@briefly/ui';
import type { Recording } from '@briefly/types';
import { BUILT_IN_LIBRARY_FOLDERS } from '@briefly/config';

/** Placeholder until library sync API is wired for web. */
const PREVIEW: Pick<Recording, 'id' | 'title' | 'status'>[] = [];

export default function LibraryPage() {
  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Library
        </Text>
        <Text as="p" variant="body">
          Browse recordings across {BUILT_IN_LIBRARY_FOLDERS.length} built-in folders. Sync with
          your mobile library is coming next.
        </Text>
      </header>

      <ul className="folder-list">
        {BUILT_IN_LIBRARY_FOLDERS.map((folder) => (
          <li key={folder.id} className="folder-list__item">
            <span className="folder-list__swatch" style={{ background: folder.accent }} />
            <Text as="span" variant="label">
              {folder.name}
            </Text>
          </li>
        ))}
      </ul>

      {PREVIEW.length === 0 ? (
        <Text as="p" variant="caption">
          No recordings loaded in the web client yet.
        </Text>
      ) : null}
    </Stack>
  );
}
