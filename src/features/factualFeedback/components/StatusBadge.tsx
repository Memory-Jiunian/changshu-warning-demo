import type { TaskDisplayState } from '../../../domain/tasks';

export function StatusBadge({
  display,
  label,
  tone,
}: {
  display?: TaskDisplayState;
  label?: string;
  tone?: 'brand' | 'warning' | 'danger' | 'success' | 'neutral';
}) {
  const resolvedTone =
    tone ??
    (display?.isOverdue
      ? 'danger'
      : display?.key === 'due_today' || display?.key === 'returned'
        ? 'warning'
        : display?.key === 'submitted'
          ? 'brand'
          : display?.key === 'completed'
            ? 'success'
            : 'neutral');

  return (
    <span className={`ff-status ff-status--${resolvedTone}`}>
      {label ?? display?.label ?? '待反馈'}
    </span>
  );
}
