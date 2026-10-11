import { describe, expect, it } from 'vitest';
import { addDays, dayKey, dayRange, daysBetween, timeOnDay, weekStart, weekdayMon0 } from './dates';

describe('dni logiczne', () => {
  it('noc po północy należy do poprzedniego dnia', () => {
    expect(dayKey(new Date(2026, 9, 10, 23, 0).getTime(), 6)).toBe('2026-10-10');
    expect(dayKey(new Date(2026, 9, 11, 1, 30).getTime(), 6)).toBe('2026-10-10');
    expect(dayKey(new Date(2026, 9, 11, 6, 0).getTime(), 6)).toBe('2026-10-11');
    expect(dayKey(new Date(2026, 9, 11, 1, 30).getTime(), 0)).toBe('2026-10-11');
  });

  it('zakres dnia', () => {
    const [s, e] = dayRange('2026-10-10', 6);
    expect(new Date(s).getHours()).toBe(6);
    expect(new Date(e).getDate()).toBe(11);
  });

  it('godzina na dniu logicznym', () => {
    const t = timeOnDay('2026-10-10', 1, 30, 6);
    expect(new Date(t).getDate()).toBe(11);
    expect(dayKey(t, 6)).toBe('2026-10-10');
    expect(new Date(timeOnDay('2026-10-10', 21, 0, 6)).getDate()).toBe(10);
  });

  it('arytmetyka dat (także przez zmianę czasu)', () => {
    expect(addDays('2026-10-31', 1)).toBe('2026-11-01');
    expect(daysBetween('2026-03-28', '2026-03-30')).toBe(2);
    expect(daysBetween('2026-10-24', '2026-10-26')).toBe(2);
    expect(weekdayMon0('2026-10-12')).toBe(0); // poniedziałek
    expect(weekStart('2026-10-11')).toBe('2026-10-05');
  });
});
