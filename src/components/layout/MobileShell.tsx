import type { ReactNode } from 'react';
import { Button } from '../ui/Button';
import './layout.css';

export interface MobileShellProps {
  title: string;
  roleLabel?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  rightSlot?: ReactNode;
  showBack?: boolean;
  onBack?: () => void;
}

export function MobileShell({ title, roleLabel, subtitle, children, footer, rightSlot, showBack = false, onBack }: MobileShellProps) {
  return (
    <main className="layout-mobile-shell">
      <header className="layout-mobile-shell__topbar">
        <div className="layout-mobile-shell__leading">
          {showBack ? (
            <Button variant="secondary" size="icon" aria-label="返回" onClick={onBack}>
              ←
            </Button>
          ) : null}
          <div>
            {roleLabel ? <p>{roleLabel}</p> : null}
            <h1>{title}</h1>
            {subtitle ? <span>{subtitle}</span> : null}
          </div>
        </div>
        {rightSlot ? <div className="layout-mobile-shell__right">{rightSlot}</div> : null}
      </header>
      <div className="layout-mobile-shell__content">{children}</div>
      {footer ? <div className="layout-mobile-shell__footer">{footer}</div> : null}
    </main>
  );
}

