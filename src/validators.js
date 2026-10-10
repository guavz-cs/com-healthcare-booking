export const NOTES_MAX = 300;

export function todayString(now = new Date()) {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export const FIELD_LABELS = {
  name: 'Full name',
  email: 'Email address',
  phone: 'Phone number',
  service: 'Service',
  date: 'Preferred date',
  notes: 'Notes',
  consent: 'Consent',
};

export function validateField(field, values, now = new Date()) {
  const v = (values[field] ?? '').toString().trim();
  switch (field) {
    case 'name':
      if (!v) return 'Enter your full name.';
      if (v.length < 2) return 'Enter your full name. It must be at least 2 characters.';
      return '';
    case 'email':
      if (!v) return 'Enter your email address, for example name@example.com.';
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v))
        return 'Enter an email address like name@example.com. It needs an @ sign and a domain.';
      return '';
    case 'phone':
      if (!v) return ''; // optional
      if (!/^\+?[\d\s()-]{7,}$/.test(v))
        return 'Enter a phone number using digits only, for example 031 555 0100.';
      return '';
    case 'service':
      return v ? '' : 'Choose a service from the list.';
    case 'date': {
      if (!v) return 'Choose a preferred date.';
      if (v < todayString(now)) return 'Choose today or a future date. That date has already passed.';
      const [y, m, d] = v.split('-').map(Number);
      if (new Date(y, m - 1, d).getDay() === 0)
        return 'The clinic is closed on Sundays. Choose a date from Monday to Saturday.';
      return '';
    }
    case 'notes':
      return v.length > NOTES_MAX
        ? `Shorten your notes to ${NOTES_MAX} characters or fewer. You have ${v.length}.`
        : '';
    case 'consent':
      return values.consent ? '' : 'Tick the box to agree that we may contact you about this booking.';
    default:
      return '';
  }
}

export const FIELD_ORDER = ['name', 'email', 'phone', 'service', 'date', 'notes', 'consent'];

export function validateAll(values, now = new Date()) {
  const errors = {};
  for (const f of FIELD_ORDER) {
    const msg = validateField(f, values, now);
    if (msg) errors[f] = msg;
  }
  return errors;
}
