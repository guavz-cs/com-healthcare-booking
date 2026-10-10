import BookingForm from '../components/BookingForm.jsx';

export default function Book({ headingRef, initialService, practitionerId = '', slot = '' }) {
  return (
    <div className="booking-layout">
      <section className="booking-intro">
        <p className="eyebrow">Request a visit</p>
        <h1 id="booking-heading" ref={headingRef} tabIndex={-1}>Book an appointment</h1>
        <p>
          Use this form to request a clinic appointment. Required fields are marked with an asterisk (*) and the
          word &ldquo;required&rdquo;.
        </p>
        <p id="form-instructions">
          Please provide your contact details and preferred appointment information. The clinic must confirm
          availability.
        </p>
      </section>

      <aside className="help-panel before-panel" aria-labelledby="before-heading">
        <h2 id="before-heading">Before you book</h2>
        <p>Bring your health card and a list of any medicines you take when attending your appointment.</p>

        <h3>Need urgent medical help?</h3>
        <p>
          Do not rely on this booking form for emergencies. Contact your local emergency service if you need
          immediate assistance.
        </p>

        <h3>Your privacy</h3>
        <p>
          This prototype keeps what you type in your browser only. Nothing is sent to the clinic or stored.
        </p>

        <p>
          <a href="#/services">Back to services</a>
        </p>
      </aside>

      <BookingForm initialService={initialService} practitionerId={practitionerId} slot={slot} />
    </div>
  );
}
