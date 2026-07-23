import type { CollaborationTask } from '../../../domain/tasks';
import { getTaskDisplayState } from '../../../selectors/taskSelectors';
import { formatFeedbackRemaining } from '../feedbackPresentation';
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
        <h2>{task.student.name}</h2>
        <StatusBadge label="待反馈" tone="neutral" />
      </div>
      <p className="ff-task-card__purpose">
        <span>反馈需求：</span>{task.purpose}
      </p>
      <p className={`ff-task-card__deadline${display.isOverdue ? ' ff-text-danger' : ''}`}>
        {formatFeedbackRemaining(task, now)}
      </p>
      <div className="ff-task-card__footer">
        <Button
          variant="secondary"
          fullWidth
          onClick={onOpen}
        >
          查看详情
        </Button>
      </div>
    </article>
  );
}
