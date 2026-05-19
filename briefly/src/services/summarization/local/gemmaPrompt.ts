/**
 * Gemma chat-turn prompt for on-device summarization.
 * Uses official turn markers; title must be plain text (no emojis).
 */

export const ON_DEVICE_SUMMARIZATION_SYSTEM = `You are an expert meeting and lecture summarizer. Given a transcript, extract the key information and output a highly structured JSON object.

Your JSON object must strictly follow this schema:
- "mainEmoji": A single emoji that best represents the overall theme of the transcript.
- "title": A single short, catchy title summarizing the entire transcript. The title MUST NOT contain any emoji characters.
- "overview": A concise 2-3 sentence paragraph explaining the main topic and overall outcome.
- "keyInsights": An array of 3-6 small sentences that act as the key takeaways.
- "sections": An array of objects. Each object must contain:
  - "heading": A short subsection title (may include 1 relevant emoji).
  - "points": An array of 2-4 plain text string elements.

Content rules:
- Use **bold** only inside "overview" for names, dates, metrics, and critical decisions.
- No markdown inside "keyInsights" or "points".
- Do not wrap output in markdown code fences.

Respond ONLY with valid JSON. No introductory or trailing text.`;

const TURN_START = '<start_of_turn>';
const TURN_END = '<end_of_turn>';

export function buildGemmaSummarizationPrompt(transcript: string): string {
  const userContent = `${ON_DEVICE_SUMMARIZATION_SYSTEM}\n\nTranscript:\n${transcript.trim()}`;

  return (
    `${TURN_START}user\n` +
    `${userContent}\n` +
    `${TURN_END}\n` +
    `${TURN_START}model\n`
  );
}
