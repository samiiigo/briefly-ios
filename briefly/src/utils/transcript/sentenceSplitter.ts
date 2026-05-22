const SENTENCE_BOUNDARY_REGEX = /[^.!?]+[.!?]+["')\]]*(?=\s|$)/g;
/**
 * Split text into complete sentences and a trailing remainder.
 */
export function splitCompleteSentences(text: string): { sentences: string[]; remainder: string } {
  const source = text.trim();
  if (!source) {
    return { sentences: [], remainder: '' };
  }
  const sentences: string[] = [];
  let lastBoundary = 0;
  SENTENCE_BOUNDARY_REGEX.lastIndex = 0;
  let match = SENTENCE_BOUNDARY_REGEX.exec(source);
  while (match) {
    const sentence = match[0].trim();
    if (sentence) {
      sentences.push(sentence);
    }
    lastBoundary = match.index + match[0].length;
    match = SENTENCE_BOUNDARY_REGEX.exec(source);
  }
  return {
    sentences,
    remainder: source.slice(lastBoundary).trim(),
  };
}
/**
 * Split text into sentence-level segments (no remainder — everything included).
 */
export function splitTextIntoSentences(text: string): string[] {
  const normalized = text.replace(/\s+/g, ' ').trim();
  if (!normalized) {
    return [];
  }
  const { sentences, remainder } = splitCompleteSentences(normalized);
  return remainder ? [...sentences, remainder] : sentences;
}
/**
 * Append a chunk to base text with a space separator.
 */
export function appendChunk(base: string, chunk: string): string {
  const left = base.trim();
  const right = chunk.trim();
  if (!left) return right;
  if (!right) return left;
  return `${left} ${right}`;
}
