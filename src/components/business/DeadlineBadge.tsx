import type { CollaborationTask } from '../../domain/tasks';
import { getTaskDisplayState } from '../../selectors/taskSelectors';
import { AppIcon } from '../ui/AppIcon';
import { Badge } from '../ui/Badge';

export function DeadlineBadge({
  task,
  now,
}: {
  task: CollaborationTask;
  now: Date;
}) {
  const state = getTaskDisplayState(task, now);
  const variant = state.isOverdue ? 'error' : state.key === 'due_today' ? 'warning' : 'outline';
  return (
    <Badge variant={variant} className="mvp-deadline-badge">
      <AppIcon name={state.isOverdue ? 'alert' : 'clock'} size={14} />
      {state.deadlineLabel}
    </Badge>
  );
}
