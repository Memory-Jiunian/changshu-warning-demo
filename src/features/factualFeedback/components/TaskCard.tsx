import type { Slice2Action } from '../../../selectors/factualFeedbackSelectors';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '../../../components/ui/Card';
import { Badge } from '../../../components/ui/Badge';
import { Button } from '../../../components/ui/Button';
import {
  formatActionDateTime,
  getActionCardContent,
} from '../feedbackPresentation';

export function TaskCard({
  action,
  onOpen,
}: {
  action: Slice2Action;
  onOpen: () => void;
}) {
  const content = getActionCardContent(action);
  return (
    <Card
      as="article"
      variant="figma-v01"
      className={`ff-task-card${
        action.kind === 'feedback_request' && action.status === 'overdue'
          ? ' ff-task-card--overdue'
          : ''
      }`}
    >
      <CardHeader className="ff-task-card__top">
        <div className="ff-task-card__identity">
          <div className="ff-task-card__identity-row">
            <CardTitle>{action.student.name}</CardTitle>
            <span className="ff-task-card__type">{content.taskType}</span>
          </div>
        </div>
        <Badge designSystem="figma-v01" variant={content.statusVariant}>
          {content.statusLabel}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="ff-task-card__purpose">
          <span>{content.requirementLabel}：</span>{action.requirement}
        </p>
      </CardContent>
      <CardFooter className="ff-task-card__footer">
        <p className={`ff-task-card__deadline${
          action.kind === 'feedback_request' && action.status === 'overdue'
            ? ' ff-text-danger'
            : ''
        }`}>
          {content.timeLabel}：{formatActionDateTime(action.actionAt)}
        </p>
        <Button
          variant="inverse"
          size="xs"
          onClick={onOpen}
        >
          {content.cta}
        </Button>
      </CardFooter>
    </Card>
  );
}
