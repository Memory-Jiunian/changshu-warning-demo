import type { HTMLAttributes } from 'react';
import './ui.css';

type BadgeVariant = 'default' | 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info' | 'outline';
type BadgeDesignSystem = 'legacy' | 'figma-v01';

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
  designSystem?: BadgeDesignSystem;
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Badge({
  variant = 'neutral',
  designSystem = 'legacy',
  className,
  ...props
}: BadgeProps) {
  return (
    <span
      className={cx(
        'ui-badge',
        `ui-badge--${variant}`,
        designSystem === 'figma-v01' && 'ui-badge--figma-v01',
        className,
      )}
      {...props}
    />
  );
}
