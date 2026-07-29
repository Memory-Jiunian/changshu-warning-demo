import type { CollaborationTask } from '../../../domain/tasks';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import { getTaskDisplayState } from '../../../selectors/taskSelectors';
import { formatFeedbackRemaining } from '../feedbackPresentation';

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
    <Card
      as="article"
      variant="figma-v01"
      className={`ff-task-card${display.isOverdue ? ' ff-task-card--overdue' : ''}`}
    >
      <CardHeader className="ff-task-card__top">
        <CardTitle>{task.student.name}</CardTitle>
        <Badge designSystem="figma-v01" variant="default">待反馈</Badge>
      </CardHeader>
      <CardContent>
        <p className="ff-task-card__purpose">
          <span>反馈需求：</span>{task.purpose}
        </p>
      </CardContent>
      <CardFooter className="ff-task-card__footer">
        <p className={`ff-task-card__deadline${display.isOverdue ? ' ff-text-danger' : ''}`}>
          {formatFeedbackRemaining(task, now)}
        </p>
        <Button
          variant="inverse"
          size="xs"
          onClick={onOpen}
        >
          查看详情
        </Button>
      </CardFooter>
    </Card>
  );
}
