import type { CollaborationTask } from '../../domain/tasks';
import { getTaskDisplayState } from '../../selectors/taskSelectors';
import { Badge } from '../ui/Badge';

export function TaskStatusBadge({
  task,
  now,
}: {
  task: CollaborationTask;
  now: Date;
}) {
  const display = getTaskDisplayState(task, now);
  const variant =
    task.status === 'completed'
      ? 'success'
      : task.status === 'cancelled'
        ? 'neutral'
        : display.isOverdue
        ? 'error'
        : task.status === 'returned'
          ? 'warning'
          : task.status === 'submitted'
            ? 'info'
            : 'brand';
  return <Badge variant={variant}>{display.label}</Badge>;
}
