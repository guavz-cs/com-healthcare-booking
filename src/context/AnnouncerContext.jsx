import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

/*
  Live-region architecture
  ------------------------
  Screen readers only announce changes to a live region that ALREADY exists in the DOM.
  If we created a new <div aria-live> each time, many readers would say nothing.
  So we render two permanent, visually hidden regions once, at the app root:

    polite    (role="status") : waits for the user to finish speaking. Used for results counts,
                                availability refreshes and per-field validation.
    assertive (role="alert")  : interrupts. Used ONLY for blocking problems (form could not be sent).

  Any component calls  announce('text')  or  announce('text', 'assertive').
*/

const AnnouncerContext = createContext({ announce: () => {} });

export function AnnouncerProvider({ children }) {
  const [polite, setPolite] = useState('');
  const [assertive, setAssertive] = useState('');
  const timers = useRef([]);

  const announce = useCallback((message, priority = 'polite') => {
    const set = priority === 'assertive' ? setAssertive : setPolite;
    // Clear first, then set on the next tick: this makes the SAME message announce again if repeated.
    set('');
    const id = setTimeout(() => set(message), 60);
    timers.current.push(id);
  }, []);

  useEffect(() => () => timers.current.forEach(clearTimeout), []);

  const value = useMemo(() => ({ announce }), [announce]);

  return (
    <AnnouncerContext.Provider value={value}>
      {children}
      <div className="sr-only" role="status" aria-live="polite" aria-atomic="true" data-testid="live-polite">
        {polite}
      </div>
      <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true" data-testid="live-assertive">
        {assertive}
      </div>
    </AnnouncerContext.Provider>
  );
}

export function useAnnouncer() {
  return useContext(AnnouncerContext);
}
