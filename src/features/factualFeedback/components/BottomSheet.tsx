import type { ReactNode } from 'react';
import { AppIcon } from '../../../components/ui/AppIcon';
import { Button } from './Button';

export function BottomSheet({
  open,
  title,
  meta,
  children,
  footer,
  onClose,
}: {
  open: boolean;
  title: string;
  meta?: ReactNode;
  children: ReactNode;
  footer: ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="ff-sheet-layer">
      <section className="ff-sheet" role="dialog" aria-modal="true" aria-labelledby="ff-sheet-title">
        <header className="ff-sheet__header">
          <span className="ff-sheet__header-spacer" aria-hidden="true" />
          <div className="ff-sheet__heading">
            <h2 id="ff-sheet-title">{title}</h2>
            {meta}
          </div>
          <Button variant="icon" aria-label="关闭反馈详情" onClick={onClose}>
            <AppIcon name="close" size={22} />
          </Button>
        </header>
        <div className="ff-sheet__content">{children}</div>
        <footer className="ff-sheet__footer">{footer}</footer>
      </section>
    </div>
  );
}
