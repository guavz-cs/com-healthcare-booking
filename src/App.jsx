import { useEffect, useRef, useState } from 'react';
import { AnnouncerProvider } from './context/AnnouncerContext.jsx';
import Home from './pages/Home.jsx';
import Services from './pages/Services.jsx';
import Book from './pages/Book.jsx';

const TITLES = {
  home: 'Home',
  services: 'Find a service',
  book: 'Book an appointment',
};

// Tiny hash router: "#/services", "#/book?service=general-checkup".
// Real <a href> links mean the browser Back button, middle-click and "copy link" all work.
export function parseHash(hash) {
  const raw = hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const view = TITLES[path] ? path : 'home';
  const params = new URLSearchParams(qs);
  return {
    view,
    service: params.get('service') || '',
    practitioner: params.get('practitioner') || '',
    slot: params.get('slot') || '',
  };
}

export default function App() {
  const [route, setRoute] = useState(() => parseHash(window.location.hash));
  const headingRef = useRef(null);
  const mainRef = useRef(null);
  const firstRender = useRef(true);

  useEffect(() => {
    const onHashChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  // View switch: update the document title (SC 2.4.2) and move focus to the new page's <h1>,
  // so the screen reader announces the new page instead of staying on the old link.
  // Skipped on first load, where the browser's normal behaviour is correct.
  useEffect(() => {
    document.title = `${TITLES[route.view]} | Gqeberha Community Clinic`;
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    headingRef.current?.focus();
  }, [route.view]);

  // A plain href="#main" would change the hash and trigger the router, so both links focus <main> directly.
  function focusMain(e) {
    e.preventDefault();
    mainRef.current?.focus();
  }

  return (
    <AnnouncerProvider>
      <div id="app-shell">
        <a className="skip-link" href="#main" onClick={focusMain}>Skip to main content</a>

        <header className="site-header">
          <div className="wrap header-inner">
            <a className="brand" href="#/">Gqeberha Community Clinic</a>
            <nav aria-label="Main navigation">
              <ul className="nav-list">
                {['home', 'services', 'book'].map((key) => (
                  <li key={key}>
                    <a
                      href={key === 'home' ? '#/' : `#/${key}`}
                      aria-current={route.view === key ? 'page' : undefined}
                    >
                      {key === 'home' ? 'Home' : key === 'services' ? 'Find a service' : 'Book an appointment'}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          </div>
        </header>

        <main id="main" ref={mainRef} className="site-main" tabIndex={-1}>
          <div className="wrap">
            {route.view === 'home' && <Home headingRef={headingRef} />}
            {route.view === 'services' && <Services headingRef={headingRef} />}
            {route.view === 'book' && (
              <Book
                headingRef={headingRef}
                initialService={route.service}
                practitionerId={route.practitioner}
                slot={route.slot}
              />
            )}
          </div>
        </main>

        <footer className="site-footer">
          <div className="wrap footer-inner">
            <div>
              <p className="footer-brand">Gqeberha Community Clinic</p>
              <p className="footer-note">Accessible community healthcare booking portal prototype.</p>
            </div>
            <div>
              <h2 className="footer-heading">Contact and safety</h2>
              <p>Clinic address and opening hours: to be confirmed.</p>
              <p>For emergencies, contact the appropriate local emergency service.</p>
              <p><a href="#main" onClick={focusMain}>Back to main content</a></p>
            </div>
          </div>
        </footer>
      </div>
    </AnnouncerProvider>
  );
}
