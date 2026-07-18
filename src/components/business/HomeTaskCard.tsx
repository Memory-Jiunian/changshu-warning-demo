import type { CollaborationTask } from '../../domain/tasks';
import { taskTypeLabels, urgencyLabels } from '../../selectors/homeSelectors';
import { getTaskDisplayState } from '../../selectors/taskSelectors';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { AppIcon } from '../ui/AppIcon';
import { DeadlineBadge } from './DeadlineBadge';

export function HomeTaskCard({
  task,
  now,
  mode,
  assigneeName,
  latestSupervision,
  onOpen,
}: {
  task: CollaborationTask;
  now: Date;
  mode: 'teacher' | 'director';
  assigneeName?: string;
  latestSupervision?: string;
  onOpen: () => void;
}) {
  const display = getTaskDisplayState(task, now);
  const statusVariant = display.isOverdue
    ? 'error'
    : task.status === 'submitted'
      ? 'info'
      : task.status === 'returned'
        ? 'warning'
        : 'neutral';

  return (
    <Card as="article" className="mvp-home-task-card">
      <CardHeader>
        <div className="mvp-card-heading">
          <div>
            <span className="mvp-card-kicker">
              {mode === 'director' ? task.student.className : task.student.className}
            </span>
            <CardTitle>
              {mode === 'director' ? '年级督办' : task.student.name}
            </CardTitle>
          </div>
          <Badge variant={statusVariant}>{display.label}</Badge>
        </div>
      </CardHeader>
      <CardContent>
        {mode === 'teacher' ? (
          <>
            <div className="mvp-task-type-line">
              <Badge variant="brand">{taskTypeLabels[task.type]}</Badge>
              <Badge variant="outline">{urgencyLabels[task.urgency]}</Badge>
            </div>
            <p className="mvp-task-purpose">{task.purpose}</p>
          </>
        ) : (
          <div className="mvp-task-meta-list">
            <div><span>责任班主任</span><strong>{assigneeName ?? '责任班主任'}</strong></div>
            <div><span>最近督办</span><strong>{latestSupervision ?? '暂无督办记录'}</strong></div>
          </div>
        )}
        <DeadlineBadge task={task} now={now} />
      </CardContent>
      <CardFooter>
        <Button
          variant="secondary"
          fullWidth
          trailingIcon={<AppIcon name="arrowRight" size={17} />}
          onClick={onOpen}
        >
          {mode === 'director' ? '查看督办' : '查看任务'}
        </Button>
      </CardFooter>
    </Card>
  );
}
