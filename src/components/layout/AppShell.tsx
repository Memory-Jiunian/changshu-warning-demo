import type { ReactNode } from 'react';
import type { UserRole } from '../../domain/users';
import { BottomNavigation } from './BottomNavigation';

export function AppShell({
  role,
  activeNavigation,
  children,
  onNavigate,
  showBottomNavigation = true,
}: {
  role: UserRole;
  activeNavigation: string;
  children: ReactNode;
  onNavigate: (hash: string) => void;
  showBottomNavigation?: boolean;
}) {
  return (
    <main className={`mvp-app-shell ${showBottomNavigation ? 'has-bottom-navigation' : 'has-no-bottom-navigation'}`}>
      <div className="mvp-app-shell__content">{children}</div>
      {showBottomNavigation ? (
        <BottomNavigation
          role={role}
          activeKey={activeNavigation}
          onNavigate={onNavigate}
        />
      ) : null}
    </main>
  );
}
