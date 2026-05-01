import { Recording } from '../types';
import { formatGroupLabel } from './formatting';

export function generateId(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function generateTitle(): string {
  const now = new Date();
  const date = now.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const time = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  return `Recording \u2013 ${date} at ${time}`;
}

export function ensureUniqueTitle(title: string, existingTitles: string[]): string {
  if (!existingTitles.includes(title)) return title;
  let counter = 2;
  while (existingTitles.includes(`${title} (${counter})`)) {
    counter++;
  }
  return `${title} (${counter})`;
}

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
