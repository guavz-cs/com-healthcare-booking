import { useEffect, useRef, useState } from 'react';
import Field from './Field.jsx';
import Modal from './Modal.jsx';
import { useAnnouncer } from '../context/AnnouncerContext.jsx';
import { PRACTITIONERS, SERVICES, slotToDate } from '../data/clinic.js';
import { FIELD_LABELS, FIELD_ORDER, NOTES_MAX, todayString, validateAll, validateField } from '../validators.js';

const EMPTY = { name: '', email: '', phone: '', service: '', date: '', urgency: 'routine', notes: '', consent: false };

export default function BookingForm({ initialService = '', practitionerId = '', slot = '' }) {
  const { announce } = useAnnouncer();
  const [values, setValues] = useState({ ...EMPTY, service: initialService });
  const [errors, setErrors] = useState({});
  const [attempt, setAttempt] = useState(0); // increments on each failed submit -> triggers focus effect
  const [confirmation, setConfirmation] = useState(null);
  const dirty = useRef(new Set()); // fields the user has actually touched

  // An appointment chosen from the availability table (practitioner + time).
  const [appointment, setAppointment] = useState(null);
  useEffect(() => {
    const practitioner = PRACTITIONERS.find((p) => p.id === practitionerId);
    if (practitioner && slot) {
      setAppointment({ practitioner, slot });
      const slotDate = slotToDate(slot);
      setValues((v) => ({ ...v, date: v.date || slotDate }));
    } else {
      setAppointment(null);
    }
  }, [practitionerId, slot]);

  // If the user arrives from "Book <service>", pre-select it.
  useEffect(() => {
    if (initialService) setValues((v) => ({ ...v, service: initialService }));
  }, [initialService]);

  function focusField(field) {
    document.getElementById(`field-${field}`)?.focus();
  }

  // After a failed submit the errors are rendered; ONLY THEN move focus to the first invalid field,
  // so the screen reader reads the label AND the freshly linked error text together.
  useEffect(() => {
    if (attempt === 0) return;
    const firstInvalid = FIELD_ORDER.find((f) => errors[f]);
    if (firstInvalid) focusField(firstInvalid);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [attempt]);

  function handleChange(field, value) {
    dirty.current.add(field);
    const next = { ...values, [field]: value };
    setValues(next);
    // Once a field is flagged, re-check as the user types so the error clears the moment it is fixed.
    // Clearing is SILENT: we do not announce "error gone" on every keystroke (live-region verbosity).
    if (errors[field]) {
      const msg = validateField(field, next);
      setErrors((prev) => {
        const copy = { ...prev };
        if (msg) copy[field] = msg;
        else delete copy[field];
        return copy;
      });
    }
  }

  // Blur validation: focus has already moved to the next control, so the user would never hear
  // this error. A POLITE live message queues it after the next control's name.
  function handleBlur(field) {
    if (!dirty.current.has(field)) return; // do not nag people who are just tabbing through
    const msg = validateField(field, values);
    setErrors((prev) => {
      const copy = { ...prev };
      if (msg) copy[field] = msg;
      else delete copy[field];
      return copy;
    });
    if (msg) announce(`${FIELD_LABELS[field]}: ${msg}`, 'polite');
  }

  function handleSubmit(e) {
    e.preventDefault();
    const found = validateAll(values);
    setErrors(found);
    const count = Object.keys(found).length;
    if (count > 0) {
      // ASSERTIVE: this is blocking. We interrupt once, with the count only.
      announce(`Booking not sent. ${count} ${count === 1 ? 'problem' : 'problems'} found.`, 'assertive');
      setAttempt((a) => a + 1);
      return;
    }
    const svc = SERVICES.find((s) => s.id === values.service);
    setConfirmation({
      ...values,
      serviceName: svc ? svc.name : values.service,
      appointment: appointment ? `${appointment.slot} with ${appointment.practitioner.name}` : '',
    });
  }

  function closeConfirmation() {
    setConfirmation(null);
    setAppointment(null);
    setValues({ ...EMPTY });
    setErrors({});
    dirty.current = new Set();
  }

  const errorList = FIELD_ORDER.filter((f) => errors[f]);

  return (
    <>
      <form onSubmit={handleSubmit} noValidate aria-labelledby="booking-heading">
        {errorList.length > 0 && attempt > 0 && (
          <section className="error-summary" aria-labelledby="summary-heading">
            <h2 id="summary-heading">
              Fix {errorList.length} {errorList.length === 1 ? 'problem' : 'problems'} to book
            </h2>
            <ul>
              {errorList.map((f) => (
                <li key={f}>
                  <button type="button" className="link-button" onClick={() => focusField(f)}>
                    {FIELD_LABELS[f]}: {errors[f]}
                  </button>
                </li>
              ))}
            </ul>
          </section>
        )}

        {appointment && (
          <section aria-labelledby="appt-heading" className="help-panel selected-appt">
            <h2 id="appt-heading">Your selected appointment</h2>
            <p>
              <strong>{appointment.slot}</strong> with {appointment.practitioner.name} ({appointment.practitioner.role}).
            </p>
            <p><a href="#/services">Choose a different time</a></p>
          </section>
        )}

        <section aria-labelledby="about-heading">
          <h2 id="about-heading">About you</h2>

          <Field id="field-name" label="Full name" required error={errors.name} hint="Enter your full name as it appears on your health card.">
            {(p) => (
              <input {...p} name="name" type="text" autoComplete="name" value={values.name}
                onChange={(e) => handleChange('name', e.target.value)} onBlur={() => handleBlur('name')} />
            )}
          </Field>

          <Field id="field-email" label="Email address" required error={errors.email}
            hint="We will use this address to contact you about your request. Example: name@example.com">
            {(p) => (
              <input {...p} name="email" type="email" autoComplete="email" value={values.email}
                onChange={(e) => handleChange('email', e.target.value)} onBlur={() => handleBlur('email')} />
            )}
          </Field>

          <Field id="field-phone" label="Phone number" optional error={errors.phone}
            hint="Provide a number where the clinic can reach you if needed.">
            {(p) => (
              <input {...p} name="phone" type="tel" autoComplete="tel" value={values.phone}
                onChange={(e) => handleChange('phone', e.target.value)} onBlur={() => handleBlur('phone')} />
            )}
          </Field>
        </section>

        <section aria-labelledby="visit-heading">
          <h2 id="visit-heading">Your visit</h2>

          <Field id="field-service" label="Service" required error={errors.service} hint="Select the healthcare service you need.">
            {(p) => (
              <select {...p} name="service" value={values.service}
                onChange={(e) => handleChange('service', e.target.value)} onBlur={() => handleBlur('service')}>
                <option value="">Choose a service</option>
                {SERVICES.map((s) => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
            )}
          </Field>

          <Field id="field-date" label="Preferred date" required error={errors.date}
            hint={
              appointment
                ? 'Filled in from your selected appointment. Change it if you need a different day. The clinic is open Monday to Saturday.'
                : 'Select your preferred date. The clinic must confirm appointment availability. The clinic is open Monday to Saturday.'
            }>
            {(p) => (
              <input {...p} name="date" type="date" min={todayString()} value={values.date}
                onChange={(e) => handleChange('date', e.target.value)} onBlur={() => handleBlur('date')} />
            )}
          </Field>

          <fieldset aria-describedby="urgency-hint">
            <legend>How urgent is your appointment?</legend>
            <p className="hint" id="urgency-hint">Choose the option that best describes when you need care.</p>
            {[
              ['today', 'I need to be seen today'],
              ['week', 'Within a week'],
              ['routine', 'Routine'],
            ].map(([val, text]) => (
              <div className="radio-option" key={val}>
                <input type="radio" id={`field-urgency-${val}`} name="urgency" value={val}
                  checked={values.urgency === val} onChange={() => handleChange('urgency', val)} />
                <label htmlFor={`field-urgency-${val}`}>{text}</label>
              </div>
            ))}
          </fieldset>

          <Field id="field-notes" label="Accessibility needs or additional information" optional error={errors.notes}
            hint={`For example, mention wheelchair access or communication assistance. Avoid sharing unnecessary sensitive details. Up to ${NOTES_MAX} characters.`}>
            {(p) => (
              <textarea {...p} name="notes" rows={4} value={values.notes}
                onChange={(e) => handleChange('notes', e.target.value)} onBlur={() => handleBlur('notes')} />
            )}
          </Field>

          <div className={`field${errors.consent ? ' has-error' : ''}`}>
            <div className="filter-option">
              <input
                type="checkbox"
                id="field-consent"
                checked={values.consent}
                aria-required="true"
                aria-invalid={errors.consent ? 'true' : undefined}
                aria-describedby={errors.consent ? 'field-consent-error' : undefined}
                onChange={(e) => handleChange('consent', e.target.checked)}
                onBlur={() => handleBlur('consent')}
              />
              <label htmlFor="field-consent">
                I agree that the clinic may contact me about this booking{' '}
                <span className="required-mark" aria-hidden="true">*</span>{' '}
                <span className="required-text">(required)</span>
              </label>
            </div>
            {errors.consent && (
              <p className="error" id="field-consent-error">
                <span className="error-prefix">Error: </span>
                {errors.consent}
              </p>
            )}
          </div>
        </section>

        <button type="submit" className="button">Submit appointment request</button>
      </form>

      {confirmation && (
        <Modal titleId="confirm-title" onClose={closeConfirmation}>
          <h2 id="confirm-title" tabIndex={-1} data-autofocus>Appointment requested</h2>
          <p>
            The clinic must confirm availability. In the live service, a confirmation would be emailed to{' '}
            {confirmation.email}. This prototype does not send any data.
          </p>
          <dl>
            <dt>Name</dt><dd>{confirmation.name}</dd>
            <dt>Service</dt><dd>{confirmation.serviceName}</dd>
            {confirmation.appointment && (<><dt>Appointment</dt><dd>{confirmation.appointment}</dd></>)}
            <dt>Preferred date</dt><dd>{confirmation.date}</dd>
          </dl>
          <button type="button" className="button" onClick={closeConfirmation}>Close</button>
        </Modal>
      )}
    </>
  );
}
