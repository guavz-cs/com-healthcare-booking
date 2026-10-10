import { useEffect, useRef, useState } from 'react';

// Returns `value`, but only after it has stopped changing for `delay` ms.
// We use it so a screen reader is not interrupted on every keystroke.
export function useDebouncedValue(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);
  return debounced;
}

// True only during the very first render. Lets effects skip "on mount" announcements.
export function useIsFirstRender() {
  const first = useRef(true);
  useEffect(() => {
    first.current = false;
  }, []);
  return first.current;
}
