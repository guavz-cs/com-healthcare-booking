import { SERVICES } from '../data/clinic.js';

export default function Home({ headingRef }) {
  const popular = SERVICES.filter((s) => ['general-checkup', 'childhood-vaccinations', 'counselling'].includes(s.id));
  return (
    <>
      <section className="hero" aria-labelledby="hero-heading">
        <p className="eyebrow">Community healthcare</p>
        <h1 id="hero-heading" ref={headingRef} tabIndex={-1}>Healthcare that works for everyone</h1>
        <p className="hero-copy">
          Find a healthcare service, review appointment information and explore booking options. This site is
          designed for keyboard navigation and assistive technology.
        </p>
        <div className="hero-actions">
          <a className="button" href="#/services">Find a healthcare service</a>
          <a className="button button-secondary" href="#/book">Book an appointment</a>
        </div>
      </section>

      <div className="content-grid">
        <section className="services-section" aria-labelledby="services-heading">
          <div className="section-heading">
            <p className="eyebrow">Explore care</p>
            <h2 id="services-heading">Healthcare services</h2>
            <p>Explore common services and find the information you need before making a booking.</p>
          </div>

          <div className="service-grid">
            {popular.map((s) => (
              <article className="service-card" key={s.id} aria-labelledby={`pop-${s.id}`}>
                <h3 id={`pop-${s.id}`}>{s.name}</h3>
                <p>{s.description}</p>
                <a href={`#/book?service=${s.id}`}>Book {s.name.toLowerCase()}</a>
              </article>
            ))}
          </div>
        </section>

        <aside className="help-panel" aria-labelledby="help-heading">
          <p className="eyebrow">We&rsquo;re here to help</p>
          <h2 id="help-heading">Need help using this website?</h2>
          <p>
            If you have difficulty using this website, contact the clinic through its verified contact channels for
            help accessing services or booking an appointment.
          </p>
          <a href="#/services">View appointment options</a>

          <div className="availability-note">
            <h3>Appointment availability</h3>
            <p>Check the services page for current availability and appointment information.</p>
          </div>
        </aside>
      </div>

      <section className="accessibility-note" aria-labelledby="accessibility-heading">
        <h2 id="accessibility-heading">Designed for accessible use</h2>
        <p>
          You can navigate this website with a keyboard and use headings and landmarks to move through the page. If
          something prevents you from completing a task, please contact the clinic using its verified contact
          details.
        </p>
      </section>
    </>
  );
}
