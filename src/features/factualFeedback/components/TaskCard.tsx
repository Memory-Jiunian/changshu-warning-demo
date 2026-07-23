import type { CollaborationTask } from '../../../domain/tasks';
import { formatTaskDeadline, getTaskDisplayState } from '../../../selectors/taskSelectors';
import { AppIcon } from '../../../components/ui/AppIcon';
import { Button } from './Button';
import { StatusBadge } from './StatusBadge';

export function TaskCard({
  task,
  now,
  onOpen,
}: {
  task: CollaborationTask;
  now: Date;
  onOpen: () => void;
}) {
  const display = getTaskDisplayState(task, now);
  return (
    <article
      className={`ff-task-card${display.isOverdue ? ' ff-task-card--overdue' : ''}`}
    >
      <div className="ff-task-card__top">
        <div>
          <h2>{task.student.name}</h2>
          <p>{task.student.gradeName} · {task.student.className}</p>
        </div>
        <StatusBadge display={display} />
      </div>
      <p className="ff-task-card__purpose">{task.purpose}</p>
      <div className="ff-task-card__footer">
        <span className={display.isOverdue ? 'ff-text-danger' : ''}>
          <AppIcon name="clock" size={16} />
          {formatTaskDeadline(task, now)}
        </span>
        <Button
          variant="secondary"
          onClick={onOpen}
        >
          查看详情
        </Button>
      </div>
    </article>
  );
}
