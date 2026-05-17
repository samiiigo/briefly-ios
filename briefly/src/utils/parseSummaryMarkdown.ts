export type SummaryMarkdownBlock =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ul'; items: string[] };

/** Parses the limited Markdown subset used in AI summaries. */
export function parseSummaryMarkdown(source: string): SummaryMarkdownBlock[] {
  const lines = source.trim().split(/\r?\n/);
  const blocks: SummaryMarkdownBlock[] = [];
  let bulletBuffer: string[] = [];

  const flushBullets = () => {
    if (bulletBuffer.length === 0) return;
    blocks.push({ type: 'ul', items: bulletBuffer });
    bulletBuffer = [];
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) {
      flushBullets();
      continue;
    }

    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    const bullet = trimmed.match(/^[-*]\s+(.+)$/);

    if (h2) {
      flushBullets();
      blocks.push({ type: 'h2', text: h2[1].trim() });
    } else if (h3) {
      flushBullets();
      blocks.push({ type: 'h3', text: h3[1].trim() });
    } else if (bullet) {
      bulletBuffer.push(bullet[1].trim());
    } else {
      flushBullets();
      blocks.push({ type: 'p', text: trimmed });
    }
  }

  flushBullets();
  return blocks;
}

const KEY_POINTS_HEADING = /^(key points?|key takeaways?|highlights?|action items?)$/i;

function isKeyPointsHeading(block: SummaryMarkdownBlock): boolean {
  return (
    (block.type === 'h2' || block.type === 'h3') && KEY_POINTS_HEADING.test(block.text.trim())
  );
}

const REDUNDANT_TOP_HEADINGS = new Set(['summary', 'overview']);

/** Drops a leading h2 when SummaryMarkdownSection already shows "Summary". */
export function omitRedundantSummaryHeading(blocks: SummaryMarkdownBlock[]): SummaryMarkdownBlock[] {
  if (blocks.length === 0) return blocks;
  const first = blocks[0];
  if (first.type === 'h2' && REDUNDANT_TOP_HEADINGS.has(first.text.trim().toLowerCase())) {
    return blocks.slice(1);
  }
  return blocks;
}

/** Removes key-points sections when they are shown separately in Key insights. */
export function omitKeyPointsSection(blocks: SummaryMarkdownBlock[]): SummaryMarkdownBlock[] {
  const result: SummaryMarkdownBlock[] = [];
  let index = 0;

  while (index < blocks.length) {
    if (isKeyPointsHeading(blocks[index])) {
      index += 1;
      while (index < blocks.length && blocks[index].type !== 'h2' && blocks[index].type !== 'h3') {
        index += 1;
      }
      continue;
    }
    result.push(blocks[index]);
    index += 1;
  }

  return result;
}

export function prepareSummaryMarkdownBlocks(
  source: string,
  options: { hasKeyInsights?: boolean } = {},
): SummaryMarkdownBlock[] {
  let blocks = omitRedundantSummaryHeading(parseSummaryMarkdown(source));
  if (options.hasKeyInsights) {
    blocks = omitKeyPointsSection(blocks);
  }
  return blocks;
}
