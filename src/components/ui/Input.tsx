import type { InputHTMLAttributes } from 'react';
import './ui.css';

type InputDesignSystem = 'legacy' | 'figma-v01';

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  designSystem?: InputDesignSystem;
  error?: boolean;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Input({
  className,
  designSystem = 'legacy',
  error = false,
  'aria-invalid': ariaInvalid,
  ...props
}: InputProps) {
  return (
    <input
      className={cx(
        'ui-input',
        designSystem === 'figma-v01' && 'ui-input--figma-v01',
        error && 'ui-input--error',
        className,
      )}
      aria-invalid={error ? true : ariaInvalid}
      {...props}
    />
  );
}
