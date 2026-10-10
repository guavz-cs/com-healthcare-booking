import { useEffect, useMemo, useRef, useState } from 'react';
import { useAnnouncer } from '../context/AnnouncerContext.jsx';
import { useDebouncedValue } from '../hooks.js';
import { CATEGORIES, PRACTITIONERS, SERVICES, availabilityFor, hasOpeningToday } from '../data/clinic.js';

export const REFRESH_DELAY_MS = 800;
export const ANNOUNCE_DEBOUNCE_MS = 500;

function filterServices(query, categories, sameDayOnly) {
  const q = query.trim().toLowerCase();
  return SERVICES.filter((s) => {
    const matchesText = !q || `${s.name} ${s.description} ${s.category}`.toLowerCase().includes(q);
    const matchesCat = categories.length === 0 || categories.includes(s.category);
    const matchesDay = !sameDayOnly || s.sameDay;
    return matchesText && matchesCat && matchesDay;
  });
}

export default function Services({ headingRef }) {
  const { announce } = useAnnouncer();
  const [query, setQuery] = useState('');
  const [categories, setCategories] = useState([]);     // selected category names
  const [sameDayOnly, setSameDayOnly] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(true); // accordion state -> aria-expanded
  const [tick, setTick] = useState(0);                   // availability "version"
  const [loading, setLoading] = useState(false);         // -> aria-busy
  const refreshTimer = useRef(null);

  // What is on screen updates immediately...
  const results = useMemo(() => filterServices(query, categories, sameDayOnly), [query, categories, sameDayOnly]);

  // ...but what is SPOKEN waits until typing pauses, so a screen reader is not interrupted on every keystroke.
  const debouncedQuery = useDebouncedValue(query, ANNOUNCE_DEBOUNCE_MS);
  const spokenCount = useMemo(
    () => filterServices(debouncedQuery, categories, sameDayOnly).length,
    [debouncedQuery, categories, sameDayOnly]
  );

  // Announce the count once per change: not on first load, not on every keystroke.
  const skipFirstAnnounce = useRef(true);
  useEffect(() => {
    if (skipFirstAnnounce.current) {
      skipFirstAnnounce.current = false;
      return;
    }
    announce(`${spokenCount} ${spokenCount === 1 ? 'service' : 'services'} found.`);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [spokenCount, debouncedQuery, categories, sameDayOnly]);

  useEffect(() => () => clearTimeout(refreshTimer.current), []);

  function toggleCategory(cat) {
    setCategories((prev) => (prev.includes(cat) ? prev.filter((c) => c !== cat) : [...prev, cat]));
  }

  function clearFilters() {
    setQuery('');
    setCategories([]);
    setSameDayOnly(false);
  }

  function refreshAvailability() {
    if (loading) return; // aria-disabled buttons still receive clicks, so guard here
    setLoading(true);
    refreshTimer.current = setTimeout(() => {
      const nextTick = tick + 1;
      setTick(nextTick);
      setLoading(false);
      const withOpenings = PRACTITIONERS.filter((p) => hasOpeningToday(availabilityFor(p, nextTick))).length;
      announce(`Availability updated. ${withOpenings} of ${PRACTITIONERS.length} practitioners have openings today.`);
    }, REFRESH_DELAY_MS);
  }

  const activeCount = categories.length + (sameDayOnly ? 1 : 0);
  const showClear = (activeCount > 0 || query) && results.length > 0;

  return (
    <>
      <section aria-labelledby="page-heading">
        <p className="eyebrow">Explore healthcare</p>
        <h1 id="page-heading" ref={headingRef} tabIndex={-1}>Find a service</h1>
        <p>
          Search the clinic directory to explore healthcare services, review example appointment information and
          find booking options. Results update as you search and filter.
        </p>
      </section>

      <div className="content-grid">
        <section aria-labelledby="results-heading">
          <h2 id="results-heading">Healthcare services</h2>

          <form className="search-form" role="search" aria-label="Search healthcare services" onSubmit={(e) => e.preventDefault()}>
            <div className="field">
              <label htmlFor="service-search">Search by service name</label>
              <p className="hint" id="service-search-hint">
                Enter a service or health topic, such as vaccination, diabetes or blood pressure.
              </p>
              <input
                id="service-search"
                type="search"
                value={query}
                aria-describedby="service-search-hint"
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </form>

          <p className="results-summary" id="results-summary">
            <strong>Showing {results.length} of {SERVICES.length} services</strong>
            {showClear && (
              <>
                {' '}
                <button type="button" className="link-button" onClick={clearFilters}>Clear search and filters</button>
              </>
            )}
          </p>

          {results.length === 0 ? (
            <div className="help-panel">
              <p><strong>No services match your search.</strong></p>
              <p>Try a shorter word, or remove a filter.</p>
              <button type="button" className="button button-secondary" onClick={clearFilters}>Clear search and filters</button>
            </div>
          ) : (
            <ul className="service-grid results">
              {results.map((s) => (
                <li key={s.id}>
                  <article className="service-card" aria-labelledby={`svc-${s.id}`}>
                    <h3 id={`svc-${s.id}`}>{s.name}</h3>
                    <p><strong>Category:</strong> {s.category}</p>
                    {s.sameDay && <p><span className="badge">Same-day available</span></p>}
                    <p>{s.description}</p>
                    <a href={`#/book?service=${s.id}`}>Book {s.name.toLowerCase()}</a>
                  </article>
                </li>
              ))}
            </ul>
          )}
        </section>

        <aside className="help-panel" aria-labelledby="filters-heading">
          <p className="eyebrow">Narrow your search</p>
          {/* Accordion header: a real <button> inside the heading. aria-expanded mirrors React state. */}
          <h2 id="filters-heading" className="accordion-heading">
            <button
              type="button"
              className="accordion-btn"
              aria-expanded={filtersOpen}
              aria-controls="filter-panel"
              onClick={() => setFiltersOpen((o) => !o)}
            >
              <span aria-hidden="true">{filtersOpen ? '−' : '+'} </span>
              Filters{activeCount > 0 ? ` (${activeCount} active)` : ''}
            </button>
          </h2>
          <div id="filter-panel" hidden={!filtersOpen}>
            <fieldset>
              <legend>Service category</legend>
              <div className="chips">
                {CATEGORIES.map((cat) => {
                  const pressed = categories.includes(cat);
                  return (
                    <button key={cat} type="button" className="chip" aria-pressed={pressed} onClick={() => toggleCategory(cat)}>
                      <span aria-hidden="true">{pressed ? '✓ ' : ''}</span>
                      {cat}
                    </button>
                  );
                })}
              </div>
            </fieldset>

            <fieldset>
              <legend>When do you prefer to be seen?</legend>
              <p className="hint">This is a preference filter, not a medical urgency assessment.</p>
              <button type="button" className="chip" aria-pressed={sameDayOnly} onClick={() => setSameDayOnly((v) => !v)}>
                <span aria-hidden="true">{sameDayOnly ? '✓ ' : ''}</span>
                Same-day appointments only
              </button>
            </fieldset>
          </div>
        </aside>
      </div>

      <section aria-labelledby="avail-heading" aria-busy={loading} className="availability">
        <h2 id="avail-heading">Practitioner availability</h2>
        <p>
          Select a time to start booking it. Use the refresh button to check for new openings; the update is
          announced to your screen reader.
        </p>
        <p>
          <button
            type="button"
            className="button button-secondary"
            aria-disabled={loading ? 'true' : undefined}
            onClick={refreshAvailability}
          >
            {loading ? 'Refreshing availability' : 'Refresh availability'}
          </button>
        </p>
        <div className="table-scroll" role="region" aria-labelledby="avail-caption" tabIndex={0}>
          <table>
            <caption id="avail-caption">Next available appointments by practitioner</caption>
            <thead>
              <tr>
                <th scope="col">Practitioner</th>
                <th scope="col">Role and service</th>
                <th scope="col">Next available</th>
              </tr>
            </thead>
            <tbody>
              {PRACTITIONERS.map((p) => {
                const slots = availabilityFor(p, tick);
                const service = SERVICES.find((s) => s.id === p.serviceId);
                return (
                  <tr key={p.id}>
                    <th scope="row">{p.name}</th>
                    <td>{p.role}{service ? `, ${service.name.toLowerCase()}` : ''}</td>
                    <td>
                      {slots.length ? (
                        <ul className="slot-list">
                          {slots.map((s) => (
                            <li key={s}>
                              <a href={`#/book?service=${p.serviceId}&practitioner=${p.id}&slot=${encodeURIComponent(s)}`}>
                                {s}
                                <span className="sr-only"> with {p.name}, book this appointment</span>
                              </a>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        'No openings this week'
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
