import type { CollaborationTask } from '../../domain/tasks';
import { taskTypeLabels } from '../../selectors/homeSelectors';
import { formatTaskDeadline } from '../../selectors/taskSelectors';
import { AppIcon } from '../ui/AppIcon';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
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
    <Card
      as="article"
      className="mvp-teacher-task-card mvp-clickable-card"
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
      <CardHeader>
        <div className="mvp-card-heading">
          <div>
            <span className="mvp-card-kicker">{task.student.gradeName} · {task.student.className}</span>
            <CardTitle>{task.student.name}</CardTitle>
          </div>
          <TaskStatusBadge task={task} now={now} />
        </div>
      </CardHeader>
      <CardContent>
        <p className="mvp-v2-task-card__type">{taskTypeLabels[task.type]}</p>
        <p className="mvp-task-purpose">{task.purpose}</p>
        <p className="mvp-v2-task-card__time">
          <AppIcon name="clock" size={15} />
          <span>{formatTaskDeadline(task, now)}</span>
        </p>
      </CardContent>
    </Card>
  );
}
