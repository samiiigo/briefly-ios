/**
 * Gemma 4 E2B instruction-tuned chat formatting for on-device summarization.
 *
 * Matches google/gemma-4-E2B-it chat_template.jinja:
 * - Turns: <|turn>{role}\n{content} \n
 * - Generation prompt ends with <|turn>model\n
 *
 * Title field must remain plain text (no emojis).
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
/** End-of-turn marker in Gemma 4 templates (space + newline). */
export const GEMMA4_TURN_SUFFIX = ' \n';
const turn = (role: 'system' | 'user' | 'model', content: string) =>
  `<|turn>${role}\n${content.trim()}${GEMMA4_TURN_SUFFIX}`;
/**
 * Serializes system + user turns and opens the model turn for generation.
 * Equivalent to chat_template.jinja with add_generation_prompt=true.
 */
export function buildGemmaSummarizationPrompt(transcript: string): string {
  const userContent = `Transcript:\n${transcript.trim()}`;
  return (
    turn('system', ON_DEVICE_SUMMARIZATION_SYSTEM) +
    turn('user', userContent) +
    '<|turn>model\n'
  );
}
/** Messages for llama.rn Jinja chat formatting (preferred at inference). */
export function buildGemmaSummarizationMessages(transcript: string) {
  return [
    { role: 'system' as const, content: ON_DEVICE_SUMMARIZATION_SYSTEM },
    {
      role: 'user' as const,
      content: `Transcript:\n${transcript.trim()}`,
    },
  ];
}
