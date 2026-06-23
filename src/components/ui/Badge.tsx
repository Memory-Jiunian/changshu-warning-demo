import type { HTMLAttributes } from 'react';
import './ui.css';

type BadgeVariant = 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'outline';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Badge({ variant = 'neutral', className, ...props }: BadgeProps) {
  return <span className={cx('ui-badge', `ui-badge--${variant}`, className)} {...props} />;
}

