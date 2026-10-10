/*
  Wraps a label + hint + error around any control and wires up the ARIA relationships:
    <label htmlFor>       -> programmatic name (what the control IS)
    hint  <p id>          -> referenced by aria-describedby (how to fill it in)
    error <p id>          -> ALSO referenced by aria-describedby when present (what went wrong)
    aria-invalid          -> only set while there is an error
  The asterisk is decoration (aria-hidden); the words "(required)" / "(optional)" carry the meaning,
  so nobody has to see a symbol to know whether a field is needed.
  The control is passed in as a function so it receives the right props.
*/
export default function Field({ id, label, hint, error, required = false, optional = false, children }) {
  const hintId = `${id}-hint`;
  const errorId = `${id}-error`;
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className={`field${error ? ' has-error' : ''}`}>
      <label htmlFor={id}>
        {label}
        {required && (
          <>
            {' '}
            <span className="required-mark" aria-hidden="true">*</span>{' '}
            <span className="required-text">(required)</span>
          </>
        )}
        {optional && <span className="required-text"> (optional)</span>}
      </label>
      {hint && (
        <p className="hint" id={hintId}>
          {hint}
        </p>
      )}
      {error && (
        <p className="error" id={errorId}>
          <span className="error-prefix">Error: </span>
          {error}
        </p>
      )}
      {children({
        id,
        'aria-describedby': describedBy,
        'aria-invalid': error ? 'true' : undefined,
        'aria-required': required ? 'true' : undefined,
      })}
    </div>
  );
}
