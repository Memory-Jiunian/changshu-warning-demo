import type { ReactNode } from 'react';
import './ui.css';

export interface FormFieldProps {
  label: string;
  children: ReactNode;
  hint?: string;
  error?: string;
  required?: boolean;
  htmlFor?: string;
}

export function FormField({ label, children, hint, error, required = false, htmlFor }: FormFieldProps) {
  const helper = error || hint;

  return (
    <label className="ui-form-field" htmlFor={htmlFor}>
      <span className="ui-form-field__label">
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </span>
      {children}
      {helper ? <span className={error ? 'ui-form-field__error' : 'ui-form-field__hint'}>{helper}</span> : null}
    </label>
  );
}

