import { describe, expect, it } from 'vitest';
import { isNewer, nativeLevelOf } from './version';

describe('wersje', () => {
  it('porównuje liczbowo, nie tekstowo', () => {
    expect(isNewer('1.2.10', '1.2.9')).toBe(true);
    expect(isNewer('1.2.9', '1.2.10')).toBe(false);
    expect(isNewer('1.2.9', '1.2.9')).toBe(false);
    expect(isNewer('1.3.1', '1.2.40')).toBe(true);
    expect(isNewer('1.2.7', '1.0.0')).toBe(true);
  });

  it('poziom części natywnej to środkowy numer', () => {
    expect(nativeLevelOf('1.2.15')).toBe(2);
    expect(nativeLevelOf('1.0')).toBe(0);
  });
});
