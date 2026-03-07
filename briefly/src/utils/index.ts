import { Recording } from '../types';

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);

  if (h > 0) {
    return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  }
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

export function formatTimestamp(seconds: number): string {
  return formatDuration(seconds);
}

export function formatDate(timestamp: number): string {
  const ts = toTimestampMs(timestamp);
  const date = new Date(ts);
  const now = new Date();

  const todayStart = startOfDay(now);
  const dateStart = startOfDay(date);
  const diffMs = todayStart.getTime() - dateStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }
  if (diffDays === 1) return 'Yesterday';

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

/** Normalize timestamp: if it looks like seconds (1e9–2e9 range), convert to ms. */
function toTimestampMs(timestamp: number): number {
  if (timestamp <= 0 || !Number.isFinite(timestamp)) return timestamp;
  if (timestamp < 1e12 && timestamp > 1e9) return timestamp * 1000;
  return timestamp;
}

/** Start of calendar day (midnight) in local timezone. */
function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

export function formatGroupLabel(timestamp: number): string {
  const ts = toTimestampMs(timestamp);
  const date = new Date(ts);
  const now = new Date();

  const todayStart = startOfDay(now);
  const dateStart = startOfDay(date);
  const diffMs = todayStart.getTime() - dateStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays >= 2 && diffDays <= 7) return 'Previous 7 Days';
  if (diffDays >= 8 && diffDays <= 30) return 'Previous 30 Days';

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

// ─── Cloud provider detection ─────────────────────────────────────────────────

export type CloudProvider = 'openai' | 'gemini' | 'anthropic' | 'github';

/**
 * Detects the cloud provider from an API key based on its prefix format:
 *   sk-ant-…       → Anthropic Claude
 *   sk-proj-… / sk-… → OpenAI
 *   AIza…          → Google Gemini
 *   github_pat_… / ghp_… → GitHub Models (OpenAI-compatible)
 */
export function detectProvider(key: string): CloudProvider | null {
  const k = key.trim();
  if (!k) return null;
  if (k.startsWith('sk-ant-')) return 'anthropic';
  if (k.startsWith('sk-proj-') || k.startsWith('sk-')) return 'openai';
  if (k.startsWith('AIza')) return 'gemini';
  if (k.startsWith('github_pat_') || k.startsWith('ghp_')) return 'github';
  return null;
}

export function providerEndpoint(provider: CloudProvider): string {
  switch (provider) {
    case 'openai':    return 'https://api.openai.com/v1';
    case 'gemini':    return 'https://generativelanguage.googleapis.com/v1beta';
    case 'anthropic': return 'https://api.anthropic.com/v1';
    case 'github':    return 'https://models.inference.ai.azure.com';
  }
}

export function providerLabel(provider: CloudProvider): string {
  switch (provider) {
    case 'openai':    return 'OpenAI';
    case 'gemini':    return 'Google Gemini';
    case 'anthropic': return 'Anthropic Claude';
    case 'github':    return 'GitHub Models';
  }
}

export function generateTitle(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `Recording – ${date} at ${time}`;
}

export function ensureUniqueTitle(title: string, existingTitles: string[]): string {
  if (!existingTitles.includes(title)) return title;
  let counter = 2;
  while (existingTitles.includes(`${title} (${counter})`)) {
    counter++;
  }
  return `${title} (${counter})`;
}

/**
 * Groups recordings into time buckets based on createdAt:
 * Today, Yesterday, Previous 7 Days, Previous 30 Days, then by month.
 * Recordings are sorted newest-first within each bucket.
 */
export function groupRecordingsByTime(
  recordings: Recording[]
): { title: string; data: Recording[] }[] {
  if (!recordings.length) return [];

  const sorted = [...recordings].sort((a, b) => b.createdAt - a.createdAt);
  const sections: { title: string; data: Recording[] }[] = [];
  const sectionMap = new Map<string, Recording[]>();

  for (const recording of sorted) {
    const label = formatGroupLabel(recording.createdAt);
    let bucket = sectionMap.get(label);
    if (!bucket) {
      bucket = [];
      sectionMap.set(label, bucket);
      sections.push({ title: label, data: bucket });
    }
    bucket.push(recording);
  }

  return sections;
}
