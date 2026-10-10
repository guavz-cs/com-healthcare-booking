import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/*
  Accessible modal dialog. What it does and why:
  1. role="dialog" + aria-modal + aria-labelledby   -> screen reader announces "<title>, dialog".
  2. Moves focus INTO the dialog on open            -> keyboard/SR users are not left behind it.
  3. Traps Tab / Shift+Tab inside the dialog        -> focus cannot wander to the page behind.
  4. Escape and a visible Close button both close   -> the trap is NOT a keyboard trap (WCAG 2.1.2).
  5. Marks the page behind as `inert`               -> SR virtual cursor cannot read it either.
  6. Restores focus to the element that opened it   -> user returns to exactly where they were.
  It renders in a portal (document.body) so `inert` on the app shell does not disable the dialog.
*/
export default function Modal({ titleId, onClose, children }) {
  const dialogRef = useRef(null);
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  useEffect(() => {
    const opener = document.activeElement;
    const shell = document.getElementById('app-shell');
    if (shell) shell.inert = true;

    const dialog = dialogRef.current;
    const first = dialog.querySelector('[data-autofocus]') || dialog;
    first.focus();

    function onKeyDown(e) {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCloseRef.current();
        return;
      }
      if (e.key !== 'Tab') return;
      const items = Array.from(dialog.querySelectorAll(FOCUSABLE));
      if (items.length === 0) return;
      const firstItem = items[0];
      const lastItem = items[items.length - 1];
      const active = document.activeElement;
      if (e.shiftKey && (active === firstItem || active === dialog || active.hasAttribute('data-autofocus'))) {
        e.preventDefault();
        lastItem.focus();
      } else if (!e.shiftKey && active === lastItem) {
        e.preventDefault();
        firstItem.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      if (shell) shell.inert = false;
      if (opener && typeof opener.focus === 'function') opener.focus();
    };
  }, []);

  return createPortal(
    <div className="modal-backdrop">
      <div
        ref={dialogRef}
        className="modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}
