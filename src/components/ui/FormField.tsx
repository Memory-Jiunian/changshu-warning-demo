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
    <div className="ui-form-field">
      <label className="ui-form-field__label" htmlFor={htmlFor}>
        {label}
        {required ? <span aria-hidden="true"> *</span> : null}
      </label>
      {children}
      {helper ? <span className={error ? 'ui-form-field__error' : 'ui-form-field__hint'}>{helper}</span> : null}
    </div>
  );
}
