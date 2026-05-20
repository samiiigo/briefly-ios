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

/** Monday 00:00 local time for the ISO-style week containing `d`. */
function startOfWeekMonday(d: Date): Date {
  const x = new Date(d);
  const day = x.getDay(); // 0 Sun … 6 Sat
  const mondayOffset = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + mondayOffset);
  x.setHours(0, 0, 0, 0);
  return x;
}

function sameWeek(a: Date, b: Date): boolean {
  return startOfWeekMonday(a).getTime() === startOfWeekMonday(b).getTime();
}

function sameMonthAndYear(a: Date, b: Date): boolean {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth();
}

/** Weekday name for per-day sections (e.g. "Friday") after Today / Yesterday. */
function formatWeekdayLabel(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

/** How many prior days in the current week get their own section before "This week". */
const NAMED_WEEKDAY_SLOTS_AFTER_YESTERDAY = 2;

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

/**
 * Section title for grouping recordings by created time (Home, folder browse).
 * Buckets: Today → Yesterday → up to two weekday names in the current week →
 * This week (older days still in the week) → Last week → Past two weeks →
 * This month → Last month → month + year for older items.
 */
export function formatGroupLabel(timestamp: number, nowMs?: number): string {
  const ts = toTimestampMs(timestamp);
  const date = new Date(ts);
  const now = nowMs != null ? new Date(nowMs) : new Date();

  const todayStart = startOfDay(now);
  const dateStart = startOfDay(date);
  const diffMs = todayStart.getTime() - dateStart.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';

  if (sameWeek(date, now)) {
    const namedThrough =
      1 + NAMED_WEEKDAY_SLOTS_AFTER_YESTERDAY; /* diffDays 2 … 3 */
    if (diffDays >= 2 && diffDays <= namedThrough) {
      return formatWeekdayLabel(date);
    }
    if (diffDays >= 2) {
      return 'This week';
    }
  }

  const mondayThisWeek = startOfWeekMonday(now);
  const mondayLastWeek = new Date(mondayThisWeek);
  mondayLastWeek.setDate(mondayLastWeek.getDate() - 7);

  if (sameWeek(date, mondayLastWeek)) {
    return 'Last week';
  }

  if (
    diffDays >= 2 &&
    diffDays <= 14 &&
    !sameWeek(date, now) &&
    !sameWeek(date, mondayLastWeek)
  ) {
    return 'Past two weeks';
  }

  if (sameMonthAndYear(date, now)) {
    return 'This month';
  }

  const firstOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  if (sameMonthAndYear(date, firstOfLastMonth)) {
    return 'Last month';
  }

  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
}

/** Subtitle on recents entry cards, e.g. "April 10, 26 . 8:00". */
export function formatRecentsCardDate(timestamp: number): string {
  const ts = toTimestampMs(timestamp);
  const date = new Date(ts);
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' });
  const year = String(date.getFullYear()).slice(-2);
  const time = date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: false,
  });
  return `${monthDay}, ${year} . ${time}`;
}

/** Section titles for the recents feed (same buckets as {@link formatGroupLabel}). */
export function formatRecentsGroupLabel(timestamp: number): string {
  return formatGroupLabel(timestamp);
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}
