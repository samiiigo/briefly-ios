export function parseSummaryBullets(summary: string): string[] {
  const trimmed = summary.trim();
  if (!trimmed) return [];
  const lines = trimmed
    .split(/\n+/)
    .map((line) => line.replace(/^[-•*]\s*/, '').trim())
    .filter(Boolean);
  if (lines.length > 1) return lines;
  const sentences = trimmed
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  if (sentences.length > 1) return sentences;
  return [trimmed];
}
