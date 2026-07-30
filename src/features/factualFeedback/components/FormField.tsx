import type { ReactNode } from 'react';

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  counter,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  counter?: ReactNode;
  children: ReactNode;
}) {
  const message = error || hint;

  return (
    <div
      className={`ff-form-field${error ? ' ff-form-field--error' : ''}`}
      data-feedback-field={id}
      data-error={Boolean(error)}
    >
      <label htmlFor={id}>
        {required ? <span aria-hidden="true">*</span> : null}
        {label}
      </label>
      {children}
      {message || counter ? (
        <div className="ff-field-helper-row">
          {error ? (
            <p id={`${id}-error`} className="ff-field-message ff-field-message--error" role="alert">
              {error}
            </p>
          ) : hint ? (
            <p className="ff-field-message">{hint}</p>
          ) : (
            <span />
          )}
          {counter ? <span className="ff-character-count">{counter}</span> : null}
        </div>
      ) : null}
    </div>
  );
}
