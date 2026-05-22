import { Recording } from '@/types';
import { formatDate, formatDuration } from '../formatting/formatting';
import { prepareSummaryMarkdownBlocks } from '../summary/parseSummaryMarkdown';
import { blocksToMarkdown } from './recordingExport';
export interface RecordingSummaryMarkdownOptions {
  folderLabel?: string;
  includeTranscript?: boolean;
}
function escapeMarkdownInline(text: string): string {
  return text.replace(/([\\`*_[\]])/g, '\\$1');
}
function bulletLines(items: string[]): string {
  return items.map((item) => `- ${escapeMarkdownInline(item)}`).join('\n');
}
/**
 * Builds a structured Markdown document for a recording summary screen or share sheet.
 */
export function buildRecordingSummaryMarkdown(
  recording: Recording,
  options: RecordingSummaryMarkdownOptions = {},
): string {
  const { folderLabel, includeTranscript = false } = options;
  const title = escapeMarkdownInline(recording.title.trim() || 'Untitled recording');
  const recorded = `${formatDate(recording.createdAt)} · ${formatDuration(recording.duration)}`;
  const insights = (recording.keyInsights ?? []).map((i) => i.text.trim()).filter(Boolean);
  const summaryRaw = recording.summary?.trim() ?? '';
  const lines: string[] = [`# ${title}`, '', `**Recorded:** ${recorded}`];
  if (folderLabel?.trim()) {
    lines.push(`**Folder:** ${escapeMarkdownInline(folderLabel.trim())}`);
  }
  lines.push('', '---', '');
  if (insights.length > 0) {
    lines.push('## Key insights', '', bulletLines(insights), '');
  }
  if (summaryRaw) {
    const blocks = prepareSummaryMarkdownBlocks(summaryRaw, {
      hasKeyInsights: insights.length > 0,
    });
    lines.push('## Summary', '', blocksToMarkdown(blocks), '');
  } else if (recording.status !== 'ready') {
    lines.push(
      '## Summary',
      '',
      '_Summary not available yet. Process this recording to generate one._',
      '',
    );
  }
  if (includeTranscript) {
    const segments = recording.transcript ?? [];
    lines.push('## Transcript', '');
    if (segments.length === 0) {
      lines.push('_No transcript available._', '');
    } else {
      for (const segment of segments) {
        const range = `${formatDuration(segment.startTime)} – ${formatDuration(segment.endTime)}`;
        lines.push(`**${range}**`, '', segment.text.trim(), '');
      }
    }
  }
  lines.push('---', '', '_Generated with Briefly_');
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
