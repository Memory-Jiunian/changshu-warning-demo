import type { CollaborationTask } from '../../domain/tasks';
import { taskTypeLabels } from '../../selectors/homeSelectors';
import { AppIcon } from '../ui/AppIcon';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
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
    <Card as="article" className="mvp-teacher-task-card">
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
      <CardFooter>
        <Button
          variant="secondary"
          fullWidth
          trailingIcon={<AppIcon name="arrowRight" size={17} />}
          onClick={onOpen}
        >
          {task.type === 'retest_reminder' ? '查看提醒' : '查看任务'}
        </Button>
      </CardFooter>
    </Card>
  );
}
