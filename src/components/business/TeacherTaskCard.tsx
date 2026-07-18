import type { CollaborationTask } from '../../domain/tasks';
import { taskTypeLabels } from '../../selectors/homeSelectors';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';
import { DeadlineBadge } from './DeadlineBadge';
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
        <div className="mvp-task-type-line">
          <Badge variant="outline">{taskTypeLabels[task.type]}</Badge>
        </div>
        <p className="mvp-task-purpose">{task.purpose}</p>
        <DeadlineBadge task={task} now={now} />
      </CardContent>
    </Card>
  );
}
