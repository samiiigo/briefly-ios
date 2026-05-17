import { Recording } from '@/types';

/** Leading emoji from a title string, if present. */
export function leadingEmojiFromText(text: string): string | null {
  const match = text.trim().match(/^(\p{Extended_Pictographic})/u);
  return match?.[1] ?? null;
}

/** Normalizes AI mainEmoji to a single pictographic character. */
export function normalizeMainEmoji(raw: unknown): string | undefined {
  if (typeof raw !== 'string') return undefined;
  return leadingEmojiFromText(raw) ?? undefined;
}

/** Picks a contextual emoji from recording title, summary, transcript, and insights. */
export function getRecordingContentEmoji(recording: Recording): string {
  if (recording.mainEmoji) return recording.mainEmoji;

  const titleEmoji = leadingEmojiFromText(recording.title ?? '');
  if (titleEmoji) return titleEmoji;

  const parts: string[] = [recording.title ?? ''];
  if (recording.summary) parts.push(recording.summary);
  if (recording.transcript?.length) {
    parts.push(recording.transcript.map((s) => s.text).join(' '));
  }
  if (recording.keyInsights) parts.push(...recording.keyInsights.map((k) => k.text));
  const text = parts.join(' ').toLowerCase();

  if (/\b(lecture|class|course|lesson|seminar|webinar|workshop|tutorial)\b/.test(text)) {
    return '🎓';
  }
  if (/\b(podcast|episode|show|stream)\b/.test(text)) {
    return '🎧';
  }
  if (/\b(brainstorm|idea|ideas|strategy|roadmap|vision|concept)\b/.test(text)) {
    return '💡';
  }
  if (/\b(meeting|sync|standup|stand-up|retro|retrospective|planning|check-in|checkin)\b/.test(text)) {
    return '📊';
  }
  if (/\b(1:1|one-on-one|one on one)\b/.test(text)) {
    return '🤝';
  }
  if (/\b(call|zoom|teams|google meet|meet|hangouts|phone)\b/.test(text)) {
    return '📞';
  }
  if (/\b(journal|diary|reflection|reflections|therapy|counseling|counselling|mood|feelings)\b/.test(text)) {
    return '🧠';
  }
  if (/\b(sales|deal|pipeline|crm|client|customer|prospect|proposal|contract|invoice|quote)\b/.test(text)) {
    return '💼';
  }

  return '📄';
}

export function isRecordingProcessing(recording: Recording): boolean {
  return recording.status === 'transcribing' || recording.status === 'summarizing';
}
