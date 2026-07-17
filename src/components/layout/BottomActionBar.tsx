import type { ReactNode } from 'react';

export function BottomActionBar({ children }: { children: ReactNode }) {
  return <div className="mvp-bottom-action-bar">{children}</div>;
}
