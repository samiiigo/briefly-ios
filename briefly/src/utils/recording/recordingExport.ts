import { Recording } from '@/types';
import { formatDate, formatDuration } from '../formatting/formatting';
import {
  prepareSummaryMarkdownBlocks,
  SummaryMarkdownBlock,
} from '../summary/parseSummaryMarkdown';
export interface RecordingExportOptions {
  includeTranscript?: boolean;
  folderLabel?: string;
}
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
/** Converts **bold** markers to HTML within already-escaped text. */
export function inlineMarkdownToHtml(text: string): string {
  const escaped = escapeHtml(text);
  return escaped.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
}
export function blocksToMarkdown(blocks: SummaryMarkdownBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'h2':
        parts.push(`## ${block.text}`);
        break;
      case 'h3':
        parts.push(`### ${block.text}`);
        break;
      case 'p':
        parts.push(block.text);
        break;
      case 'ul':
        parts.push(block.items.map((item) => `- ${item}`).join('\n'));
        break;
      default:
        break;
    }
  }
  return parts.join('\n\n').trim();
}
function blocksToPlainText(blocks: SummaryMarkdownBlock[]): string {
  const parts: string[] = [];
  for (const block of blocks) {
    switch (block.type) {
      case 'h2':
      case 'h3':
        parts.push(block.text);
        break;
      case 'p':
        parts.push(block.text);
        break;
      case 'ul':
        parts.push(block.items.map((item) => `• ${item}`).join('\n'));
        break;
      default:
        break;
    }
  }
  return parts.join('\n\n').trim();
}
function blocksToHtml(blocks: SummaryMarkdownBlock[]): string {
  if (blocks.length === 0) return '';
  return blocks
    .map((block) => {
      switch (block.type) {
        case 'h2':
          return `<h3 class="summary-h2">${inlineMarkdownToHtml(block.text)}</h3>`;
        case 'h3':
          return `<h4 class="summary-h3">${inlineMarkdownToHtml(block.text)}</h4>`;
        case 'p':
          return `<p class="summary-p">${inlineMarkdownToHtml(block.text)}</p>`;
        case 'ul':
          return `<ul class="summary-ul">${block.items
            .map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`)
            .join('')}</ul>`;
        default:
          return '';
      }
    })
    .join('');
}
function getKeyInsightTexts(recording: Recording): string[] {
  return (recording.keyInsights ?? []).map((i) => i.text.trim()).filter(Boolean);
}
function prepareExportSummaryBlocks(recording: Recording): SummaryMarkdownBlock[] {
  const summaryRaw = recording.summary?.trim() ?? '';
  if (!summaryRaw) return [];
  return prepareSummaryMarkdownBlocks(summaryRaw, {
    hasKeyInsights: getKeyInsightTexts(recording).length > 0,
  });
}
function formatKeyInsightsForExport(
  recording: Recording,
  format: 'html' | 'plain',
): string {
  const insights = getKeyInsightTexts(recording);
  if (insights.length === 0) return '';
  if (format === 'html') {
    return `<ul class="insights">${insights
      .map((item) => `<li>${inlineMarkdownToHtml(item)}</li>`)
      .join('')}</ul>`;
  }
  return insights.map((item) => `• ${item}`).join('\n');
}
function formatSummaryForExport(
  recording: Recording,
  format: 'html' | 'plain',
): string {
  const summaryRaw = recording.summary?.trim() ?? '';
  if (!summaryRaw) {
    return format === 'html'
      ? '<p class="muted">No summary available.</p>'
      : 'No summary available.';
  }
  const blocks = prepareExportSummaryBlocks(recording);
  if (blocks.length === 0) {
    return format === 'html'
      ? `<p class="summary-p">${inlineMarkdownToHtml(summaryRaw)}</p>`
      : summaryRaw;
  }
  return format === 'html' ? blocksToHtml(blocks) : blocksToPlainText(blocks);
}
/** Plain-text export: title → key insights → summary → optional transcript. */
export function buildRecordingExportPlainText(
  recording: Recording,
  options: RecordingExportOptions = {},
): string {
  const { includeTranscript = false, folderLabel } = options;
  const lines: string[] = [
    recording.title.trim() || 'Untitled recording',
    `${formatDate(recording.createdAt)} · ${formatDuration(recording.duration)}`,
  ];
  if (folderLabel?.trim()) {
    lines.push(`Folder: ${folderLabel.trim()}`);
  }
  lines.push('');
  const insightsPlain = formatKeyInsightsForExport(recording, 'plain');
  if (insightsPlain) {
    lines.push('Key insights', '', insightsPlain, '');
  }
  lines.push('Summary', '', formatSummaryForExport(recording, 'plain'));
  if (includeTranscript) {
    lines.push('', 'Transcript', '');
    const segments = recording.transcript ?? [];
    if (segments.length === 0) {
      lines.push('No transcript available.');
    } else {
      for (const segment of segments) {
        const range = `${formatDuration(segment.startTime)} – ${formatDuration(segment.endTime)}`;
        lines.push(`${range}`, segment.text.trim(), '');
      }
    }
  }
  return lines.join('\n').replace(/\n{3,}/g, '\n\n').trim();
}
/** Page inset for PDF export (iOS `margins` option + `@page` for Android). */
export const PDF_PAGE_MARGIN_PX = 48;
const PDF_STYLES = `
  @page { margin: ${PDF_PAGE_MARGIN_PX}px; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif; padding: 0; color: #111; line-height: 1.5; }
  .doc-title { font-size: 28px; font-weight: 700; margin: 0 0 8px; line-height: 1.25; }
  .doc-meta { font-size: 13px; color: #666; margin: 0 0 28px; }
  .section { margin-bottom: 28px; }
  .section-title { font-size: 13px; font-weight: 700; letter-spacing: 0.06em; text-transform: uppercase; margin: 0 0 12px; color: #333; }
  .insights { margin: 0; padding-left: 20px; }
  .insights li { margin-bottom: 10px; font-size: 15px; line-height: 1.55; }
  .summary-card { background: #f7f8fa; border: 1px solid #e8eaed; border-radius: 12px; padding: 16px 18px; }
  .summary-h2 { font-size: 17px; font-weight: 700; margin: 16px 0 8px; }
  .summary-h2:first-child { margin-top: 0; }
  .summary-h3 { font-size: 15px; font-weight: 600; margin: 14px 0 6px; }
  .summary-p { font-size: 15px; line-height: 1.6; margin: 0 0 12px; color: #222; }
  .summary-p:last-child { margin-bottom: 0; }
  .summary-ul { margin: 0 0 12px; padding-left: 20px; }
  .summary-ul li { margin-bottom: 6px; font-size: 15px; line-height: 1.55; }
  .segment { border-bottom: 1px solid #ececec; padding: 12px 0; }
  .segment:last-child { border-bottom: none; }
  .segment-time { font-size: 12px; color: #666; margin-bottom: 4px; }
  .segment-text { font-size: 14px; line-height: 1.6; }
  .muted { color: #666; font-size: 14px; margin: 0; }
  strong { font-weight: 600; color: #111; }
`;
/** PDF HTML export: title → key insights (card) → summary → optional transcript. */
export function buildRecordingExportPdfHtml(
  recording: Recording,
  options: RecordingExportOptions = {},
): string {
  const { includeTranscript = false, folderLabel } = options;
  const title = escapeHtml(recording.title.trim() || 'Untitled recording');
  const metaParts = [
    `Created ${escapeHtml(formatDate(recording.createdAt))}`,
    `Duration ${escapeHtml(formatDuration(recording.duration))}`,
  ];
  if (folderLabel?.trim()) {
    metaParts.push(`Folder ${escapeHtml(folderLabel.trim())}`);
  }
  const meta = metaParts.join(' · ');
  const insightsHtml = formatKeyInsightsForExport(recording, 'html');
  const summaryHtml = formatSummaryForExport(recording, 'html');
  const transcript = recording.transcript ?? [];
  const transcriptHtml = transcript.length
    ? transcript
        .map((segment) => {
          const start = escapeHtml(formatDuration(segment.startTime));
          const end = escapeHtml(formatDuration(segment.endTime));
          const text = escapeHtml(segment.text);
          return [
            '<div class="segment">',
            `<div class="segment-time">${start} – ${end}</div>`,
            '<div class="segment-text">' + text + '</div>',
            '</div>',
          ].join('');
        })
        .join('')
    : '<p class="muted">No transcript available.</p>';
  const sections: string[] = [
    `<header>
      <h1 class="doc-title">${title}</h1>
      <p class="doc-meta">${meta}</p>
    </header>`,
  ];
  if (insightsHtml) {
    sections.push(
      `<section class="section">
        <h2 class="section-title">Key insights</h2>
        <div class="summary-card">${insightsHtml}</div>
      </section>`,
    );
  }
  sections.push(
    `<section class="section">
      <h2 class="section-title">Summary</h2>
      ${summaryHtml}
    </section>`,
  );
  if (includeTranscript) {
    sections.push(
      `<section class="section">
        <h2 class="section-title">Transcript</h2>
        ${transcriptHtml}
      </section>`,
    );
  }
  return `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>${PDF_STYLES}</style>
  </head>
  <body>
    ${sections.join('\n')}
  </body>
</html>`;
}
