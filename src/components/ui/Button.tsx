import type { ButtonHTMLAttributes, ReactNode } from 'react';
import './ui.css';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth = false,
  leadingIcon,
  trailingIcon,
  className,
  children,
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        'ui-button',
        `ui-button--${variant}`,
        `ui-button--${size}`,
        fullWidth && 'ui-button--full',
        className,
      )}
      {...props}
    >
      {leadingIcon ? <span className="ui-button__icon">{leadingIcon}</span> : null}
      {children ? <span className="ui-button__label">{children}</span> : null}
      {trailingIcon ? <span className="ui-button__icon">{trailingIcon}</span> : null}
    </button>
  );
}

