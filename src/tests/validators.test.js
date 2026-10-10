import { describe, expect, it } from 'vitest';
import { validateAll, validateField, todayString } from '../validators.js';

const now = new Date(2030, 0, 2); // Wed 2 Jan 2030

describe('validators', () => {
  it('requires a name of at least 2 characters and says how to fix it', () => {
    expect(validateField('name', { name: '' })).toMatch(/enter your full name/i);
    expect(validateField('name', { name: 'A' })).toMatch(/at least 2/i);
    expect(validateField('name', { name: 'Aisha Mbeki' })).toBe('');
  });

  it('checks email shape', () => {
    expect(validateField('email', { email: 'nope' })).toMatch(/name@example\.com/);
    expect(validateField('email', { email: 'aisha@example.com' })).toBe('');
  });

  it('treats phone as optional but validates it when present', () => {
    expect(validateField('phone', { phone: '' })).toBe('');
    expect(validateField('phone', { phone: 'abc' })).toMatch(/digits/i);
    expect(validateField('phone', { phone: '031 555 0100' })).toBe('');
  });

  it('rejects past dates and Sundays', () => {
    expect(validateField('date', { date: '2029-12-31' }, now)).toMatch(/passed/i);
    expect(validateField('date', { date: '2030-01-06' }, now)).toMatch(/Sundays/i); // a Sunday
    expect(validateField('date', { date: '2030-01-07' }, now)).toBe('');           // a Monday
  });

  it('requires consent', () => {
    expect(validateField('consent', { consent: false })).toMatch(/tick the box/i);
    expect(validateField('consent', { consent: true })).toBe('');
  });

  it('validateAll returns one error per bad field', () => {
    const errs = validateAll({ name: '', email: '', phone: '', service: '', date: '', notes: '', consent: false }, now);
    expect(Object.keys(errs)).toEqual(['name', 'email', 'service', 'date', 'consent']);
  });

  it('formats todayString as YYYY-MM-DD', () => {
    expect(todayString(now)).toBe('2030-01-02');
  });
});
