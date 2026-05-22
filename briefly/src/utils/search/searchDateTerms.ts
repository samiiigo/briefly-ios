import { formatRecentsCardDate } from '@/utils/formatting/formatting';
function toTimestampMs(timestamp: number): number {
  if (timestamp <= 0 || !Number.isFinite(timestamp)) return timestamp;
  if (timestamp < 1e12 && timestamp > 1e9) return timestamp * 1000;
  return timestamp;
}
/** Lowercase date/month tokens appended to recording search haystacks. */
export function buildRecordingDateSearchTerms(timestamp: number): string {
  const ts = toTimestampMs(timestamp);
  const date = new Date(ts);
  const monthLong = date.toLocaleDateString('en-US', { month: 'long' }).toLowerCase();
  const monthShort = date.toLocaleDateString('en-US', { month: 'short' }).toLowerCase();
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  const yearShort = String(year).slice(-2);
  const recentsLine = formatRecentsCardDate(ts).toLowerCase();
  const parts = [
    monthLong,
    monthShort,
    String(day),
    String(year),
    yearShort,
    `${monthLong} ${day}`,
    `${monthShort} ${day}`,
    `${day} ${monthLong}`,
    `${day} ${monthShort}`,
    `${month}/${day}`,
    `${month}/${day}/${year}`,
    `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}`,
    `${String(month).padStart(2, '0')}/${String(day).padStart(2, '0')}/${year}`,
    `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`,
    recentsLine,
    recentsLine.replace(' . ', ' '),
  ];
  return parts.join('\u0001');
}
