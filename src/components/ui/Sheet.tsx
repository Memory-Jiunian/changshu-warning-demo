import { useEffect, type ReactNode } from 'react';
import './ui.css';

export interface SheetProps {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function Sheet({ open, title, description, children, footer, onClose }: SheetProps) {
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="ui-sheet" role="dialog" aria-modal="true" aria-label={title}>
      <button className="ui-sheet__overlay" type="button" aria-label="关闭弹层" onClick={onClose} />
      <section className="ui-sheet__panel">
        <header className="ui-sheet__header">
          <div>
            <h2>{title}</h2>
            {description ? <p>{description}</p> : null}
          </div>
          <button className="ui-sheet__close" type="button" aria-label="关闭" onClick={onClose}>
            ×
          </button>
        </header>
        <div className="ui-sheet__body">{children}</div>
        {footer ? <footer className="ui-sheet__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

