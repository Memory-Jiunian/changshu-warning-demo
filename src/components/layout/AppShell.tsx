import type { ReactNode } from 'react';
import type { UserRole } from '../../domain/users';
import { BottomNavigation } from './BottomNavigation';

export function AppShell({
  role,
  activeNavigation,
  children,
  onNavigate,
}: {
  role: UserRole;
  activeNavigation: string;
  children: ReactNode;
  onNavigate: (hash: string) => void;
}) {
  return (
    <main className="mvp-app-shell">
      <div className="mvp-app-shell__content">{children}</div>
      <BottomNavigation
        role={role}
        activeKey={activeNavigation}
        onNavigate={onNavigate}
      />
    </main>
  );
}
