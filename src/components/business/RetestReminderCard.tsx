import type { CollaborationTask, RetestSchedule } from '../../domain/tasks';
import { formatCompactDateTime } from '../../selectors/homeSelectors';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../ui/Card';
import { AppIcon } from '../ui/AppIcon';

export function RetestReminderCard({
  task,
  schedule,
  onOpen,
}: {
  task: CollaborationTask;
  schedule: RetestSchedule;
  onOpen: () => void;
}) {
  return (
    <Card as="article" className="mvp-retest-card" tone="soft">
      <CardHeader>
        <div className="mvp-card-heading">
          <div>
            <span className="mvp-card-kicker">{task.student.className}</span>
            <CardTitle>{task.student.name}</CardTitle>
          </div>
          <Badge variant={schedule.reminderConfirmedAt ? 'success' : 'warning'}>
            {schedule.reminderConfirmedAt ? '已提醒' : '待提醒'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mvp-task-meta-list">
          <div><span>复测时间</span><strong>{formatCompactDateTime(schedule.scheduledAt)}</strong></div>
          <div><span>提醒要求</span><strong>{schedule.instructions}</strong></div>
        </div>
      </CardContent>
      <CardFooter>
        <Button
          variant="secondary"
          fullWidth
          trailingIcon={<AppIcon name="arrowRight" size={17} />}
          onClick={onOpen}
        >
          查看提醒
        </Button>
      </CardFooter>
    </Card>
  );
}
