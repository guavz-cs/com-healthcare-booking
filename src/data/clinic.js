import { todayString } from '../validators.js';

export const CATEGORIES = [
  'Primary care',
  'Long-term conditions',
  'Children and families',
  'Mental health',
];

export const SERVICES = [
  { id: 'general-checkup', name: 'General check-up', category: 'Primary care', sameDay: true,
    description: 'A 30-minute visit with a family doctor for routine health questions.' },
  { id: 'blood-pressure', name: 'Blood pressure check', category: 'Primary care', sameDay: true,
    description: 'A quick nurse-led check. No long wait, no appointment needed for a repeat reading.' },
  { id: 'wound-care', name: 'Minor wound care', category: 'Primary care', sameDay: true,
    description: 'Cleaning and dressing of minor cuts, burns and grazes.' },
  { id: 'diabetes-review', name: 'Diabetes review', category: 'Long-term conditions', sameDay: false,
    description: 'Annual and follow-up reviews with a diabetes nurse, including foot and eye screening referrals.' },
  { id: 'asthma-review', name: 'Asthma review', category: 'Long-term conditions', sameDay: false,
    description: 'Check your inhaler technique and update your asthma action plan.' },
  { id: 'childhood-vaccinations', name: 'Childhood vaccinations', category: 'Children and families', sameDay: true,
    description: 'Booked and walk-in slots for scheduled childhood vaccines.' },
  { id: 'baby-clinic', name: 'Baby growth clinic', category: 'Children and families', sameDay: false,
    description: 'Weight and growth checks for babies under 12 months.' },
  { id: 'counselling', name: 'Counselling session', category: 'Mental health', sameDay: false,
    description: 'Talk to a counsellor in person or by phone. Sessions last 50 minutes.' },
];

export const PRACTITIONERS = [
  { id: 'naidoo', name: 'Dr. Naidoo', role: 'Family doctor', serviceId: 'general-checkup',
    slots: [['Today 14:30', 'Tomorrow 09:30'], [], ['Today 16:00']] },
  { id: 'dlamini', name: 'Nurse Dlamini', role: 'Diabetes nurse', serviceId: 'diabetes-review',
    slots: [['Wednesday 11:00'], ['Today 15:00', 'Wednesday 11:00'], ['Thursday 10:00']] },
  { id: 'pillay', name: 'Nurse Pillay', role: 'Vaccination nurse', serviceId: 'childhood-vaccinations',
    slots: [[], ['Thursday 08:30'], ['Today 13:00', 'Thursday 08:30']] },
  { id: 'khumalo', name: 'Counsellor Khumalo', role: 'Mental health counsellor', serviceId: 'counselling',
    slots: [['Friday 10:00'], ['Friday 10:00', 'Friday 14:00'], []] },
];

// Which slots are shown depends on the "tick" (how many refreshes have happened).
export function availabilityFor(practitioner, tick) {
  return practitioner.slots[tick % practitioner.slots.length];
}

export function hasOpeningToday(slots) {
  return slots.some((s) => s.startsWith('Today'));
}

const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

// Turns a slot label such as "Today 14:30", "Tomorrow 09:30" or "Wednesday 11:00"
// into a YYYY-MM-DD date, so the booking form can pre-fill "Preferred date".
// A weekday name means its next occurrence (never today), which is how people read it.
export function slotToDate(slot, now = new Date()) {
  const word = (slot || '').split(' ')[0].toLowerCase();
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (word === 'today') return todayString(d);
  if (word === 'tomorrow') {
    d.setDate(d.getDate() + 1);
    return todayString(d);
  }
  const index = DAY_NAMES.indexOf(word);
  if (index === -1) return '';
  let ahead = (index - d.getDay() + 7) % 7;
  if (ahead === 0) ahead = 7;
  d.setDate(d.getDate() + ahead);
  return todayString(d);
}
