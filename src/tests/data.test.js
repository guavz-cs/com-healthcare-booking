import { describe, expect, it } from 'vitest';
import { slotToDate } from '../data/clinic.js';

const friday = new Date(2026, 9, 9); // Fri 9 Oct 2026

describe('slotToDate', () => {
  it('turns relative and weekday slot labels into dates the booking form can use', () => {
    expect(slotToDate('Today 14:30', friday)).toBe('2026-10-09');
    expect(slotToDate('Tomorrow 09:30', friday)).toBe('2026-10-10');
    expect(slotToDate('Wednesday 11:00', friday)).toBe('2026-10-14');
    expect(slotToDate('Friday 10:00', friday)).toBe('2026-10-16'); // same weekday means next week
  });

  it('returns an empty string for labels it does not understand', () => {
    expect(slotToDate('Someday', friday)).toBe('');
    expect(slotToDate('', friday)).toBe('');
  });
});
