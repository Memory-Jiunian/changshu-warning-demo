import type { HTMLAttributes, ReactNode } from 'react';
import './ui.css';

type CardTone = 'default' | 'soft' | 'glass' | 'warning';
type CardVariant = 'legacy' | 'figma-v01';

export interface CardProps extends HTMLAttributes<HTMLElement> {
  tone?: CardTone;
  variant?: CardVariant;
  as?: 'article' | 'section' | 'div';
}

function cx(...classes: Array<string | false | null | undefined>) {
  return classes.filter(Boolean).join(' ');
}

export function Card({
  tone = 'default',
  variant = 'legacy',
  as: Component = 'section',
  className,
  ...props
}: CardProps) {
  return (
    <Component
      className={cx(
        'ui-card',
        variant === 'figma-v01' ? 'ui-card--figma-v01' : `ui-card--${tone}`,
        className,
      )}
      {...props}
    />
  );
}

export function CardHeader({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('ui-card__header', className)} {...props} />;
}

export function CardTitle({ className, ...props }: HTMLAttributes<HTMLHeadingElement>) {
  return <h3 className={cx('ui-card__title', className)} {...props} />;
}

export function CardDescription({ className, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cx('ui-card__description', className)} {...props} />;
}

export function CardContent({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('ui-card__content', className)} {...props} />;
}

export function CardFooter({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children?: ReactNode }) {
  return (
    <div className={cx('ui-card__footer', className)} {...props}>
      {children}
    </div>
  );
}
