import type { ReactNode } from 'react';
import { AppIcon, type AppIconName } from './AppIcon';

export function EmptyState({
  title,
  description,
  icon = 'clipboard',
  action,
}: {
  title: string;
  description: string;
  icon?: AppIconName;
  action?: ReactNode;
}) {
  return (
    <div className="mvp-empty-state">
      <span className="mvp-empty-state__icon">
        <AppIcon name={icon} size={22} />
      </span>
      <strong>{title}</strong>
      <p>{description}</p>
      {action}
    </div>
  );
}
