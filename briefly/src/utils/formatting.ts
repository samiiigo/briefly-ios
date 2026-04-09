/** Normalize timestamp: if it looks like seconds (1e9-2e9 range), convert to ms. */
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
