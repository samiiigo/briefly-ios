import assert from 'node:assert/strict';
import { describe, it } from 'node:test';
import { formatGroupLabel } from './formatting';

/** Local noon on a specific calendar day (month 0-based). */
function atLocalNoon(year: number, month: number, day: number): number {
  const d = new Date(year, month, day, 12, 0, 0, 0);
  return d.getTime();
}

describe('formatGroupLabel current week', () => {
  it('names the next day in the week after yesterday (Wednesday → Monday)', () => {
    const wednesday = atLocalNoon(2026, 4, 20);

    assert.equal(formatGroupLabel(wednesday, wednesday), 'Today');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 19), wednesday), 'Yesterday');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 18), wednesday), 'Monday');
  });

  it('shows Friday and Thursday before This week when today is Sunday', () => {
    const sunday = atLocalNoon(2026, 4, 24);

    assert.equal(formatGroupLabel(sunday, sunday), 'Today');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 23), sunday), 'Yesterday');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 22), sunday), 'Friday');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 21), sunday), 'Thursday');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 20), sunday), 'This week');
    assert.equal(formatGroupLabel(atLocalNoon(2026, 4, 19), sunday), 'This week');
  });
});
