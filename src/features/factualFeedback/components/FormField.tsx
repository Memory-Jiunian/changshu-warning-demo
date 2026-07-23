import type { ReactNode } from 'react';

export function FormField({
  id,
  label,
  required = false,
  hint,
  error,
  children,
}: {
  id: string;
  label: string;
  required?: boolean;
  hint?: string;
  error?: string;
  children: ReactNode;
}) {
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
      {error ? (
        <p id={`${id}-error`} className="ff-field-message ff-field-message--error" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p className="ff-field-message">{hint}</p>
      ) : null}
    </div>
  );
}
