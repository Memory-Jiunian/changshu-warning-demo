import type { ReactNode } from 'react';
import { Button } from './Button';

export function Dialog({
  open,
  title,
  description,
  children,
  cancelLabel = '取消',
  confirmLabel,
  submitting = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  children?: ReactNode;
  cancelLabel?: string | null;
  confirmLabel: string;
  submitting?: boolean;
  onCancel?: () => void;
  onConfirm: () => void;
}) {
  if (!open) return null;
  return (
    <div className="ff-dialog-layer" role="presentation">
      <section className="ff-dialog" role="dialog" aria-modal="true" aria-labelledby="ff-dialog-title">
        <div className="ff-dialog__body">
          <h2 id="ff-dialog-title">{title}</h2>
          {description ? <p>{description}</p> : null}
          {children}
        </div>
        <footer className={`ff-dialog__actions${cancelLabel ? '' : ' ff-dialog__actions--single'}`}>
          {cancelLabel ? (
            <Button variant="secondary" fullWidth disabled={submitting} onClick={onCancel}>
              {cancelLabel}
            </Button>
          ) : null}
          <Button fullWidth disabled={submitting} onClick={onConfirm}>
            {submitting ? '提交中' : confirmLabel}
          </Button>
        </footer>
      </section>
    </div>
  );
}
