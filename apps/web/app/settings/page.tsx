import { Text, Stack } from '@briefly/ui';

export default function SettingsPage() {
  return (
    <Stack gap="md">
      <header className="page-header">
        <Text as="h1" variant="title">
          Settings
        </Text>
        <Text as="p" variant="body">
          Appearance, transcription, and summarization preferences will sync from your Briefly
          account.
        </Text>
      </header>
    </Stack>
  );
}
