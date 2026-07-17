import type { ReactNode } from 'react';
import { Button } from './Button';
import { Sheet } from './Sheet';

export function ConfirmDialog({
  open,
  title,
  description,
  children,
  confirmLabel,
  cancelLabel = '取消',
  confirmDisabled = false,
  submitting = false,
  onCancel,
  onConfirm,
}: {
  open: boolean;
  title: string;
  description?: string;
  children: ReactNode;
  confirmLabel: string;
  cancelLabel?: string;
  confirmDisabled?: boolean;
  submitting?: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  return (
    <Sheet
      open={open}
      title={title}
      description={description}
      onClose={onCancel}
      footer={
        <>
          <Button variant="secondary" fullWidth disabled={submitting} onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            fullWidth
            disabled={confirmDisabled || submitting}
            onClick={onConfirm}
          >
            {submitting ? '提交中…' : confirmLabel}
          </Button>
        </>
      }
    >
      {children}
    </Sheet>
  );
}
