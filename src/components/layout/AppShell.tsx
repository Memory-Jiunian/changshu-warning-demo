import type { ReactNode } from 'react';
import type { UserRole } from '../../domain/users';
import { BottomNavigation } from './BottomNavigation';
import { MainContentPlate } from './PageFrame';

export function AppShell({
  role,
  activeNavigation,
  children,
  onNavigate,
  showBottomNavigation = true,
  showMainContentPlate = false,
}: {
  role: UserRole;
  activeNavigation: string;
  children: ReactNode;
  onNavigate: (hash: string) => void;
  showBottomNavigation?: boolean;
  showMainContentPlate?: boolean;
}) {
  return (
    <main className={`mvp-app-shell ${showBottomNavigation ? 'has-bottom-navigation' : 'has-no-bottom-navigation'}`}>
      <div className="mvp-app-shell__content">
        {showMainContentPlate ? (
          <MainContentPlate padded={false}>{children}</MainContentPlate>
        ) : (
          children
        )}
      </div>
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
