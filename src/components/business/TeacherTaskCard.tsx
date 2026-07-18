import type { CollaborationTask } from '../../domain/tasks';
import { taskTypeLabels } from '../../selectors/homeSelectors';
import { formatTaskDeadline } from '../../selectors/taskSelectors';
import { AppIcon } from '../ui/AppIcon';
import { TaskStatusBadge } from './TaskStatusBadge';

export function TeacherTaskCard({
  task,
  now,
  onOpen,
}: {
  task: CollaborationTask;
  now: Date;
  onOpen: () => void;
}) {
  return (
    <article
      className="mvp-teacher-task-row mvp-clickable-card"
      role="link"
      tabIndex={0}
      aria-label={`查看${task.student.name}的${taskTypeLabels[task.type]}`}
      onClick={onOpen}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          onOpen();
        }
      }}
    >
      <div className="mvp-teacher-task-row__heading">
        <div>
          <strong>{task.student.name}</strong>
          <span>{task.student.gradeName} · {task.student.className}</span>
        </div>
        <TaskStatusBadge task={task} now={now} />
      </div>
      <p className="mvp-teacher-task-row__summary">
        <span>{taskTypeLabels[task.type]}</span>
        {task.purpose}
      </p>
      <p className="mvp-v2-task-card__time">
        <AppIcon name="clock" size={15} />
        <span>{formatTaskDeadline(task, now)}</span>
      </p>
    </article>
  );
}
