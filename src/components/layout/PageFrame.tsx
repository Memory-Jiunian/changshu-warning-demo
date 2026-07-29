import type { ReactNode } from 'react';

export function MainContentPlate({
  children,
  className = '',
  padded = true,
}: {
  children: ReactNode;
  className?: string;
  padded?: boolean;
}) {
  const classes = [
    'layout-main-content-plate',
    padded ? 'layout-main-content-plate--padded' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
