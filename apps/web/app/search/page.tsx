import { Text, Stack, Input, Button } from '@briefly/ui';
import { SEARCH_PLACEHOLDER, MAX_RECENT_SEARCHES } from '@briefly/config';

export default function SearchPage() {
  return (
    <Stack gap="lg">
      <header className="page-header">
        <Text as="h1" variant="title">
          Search
        </Text>
        <Text as="p" variant="body">
          Search titles, transcripts, and summaries. Recent searches are capped at{' '}
          {MAX_RECENT_SEARCHES}.
        </Text>
      </header>

      <form className="search-form" action="/search">
        <Input name="q" type="search" placeholder={SEARCH_PLACEHOLDER} aria-label="Search" />
        <Button type="submit" variant="primary">
          Search
        </Button>
      </form>
    </Stack>
  );
}
