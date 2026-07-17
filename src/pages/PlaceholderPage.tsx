import { AppIcon, type AppIconName } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';

export function PlaceholderPage({
  title,
  description,
  phase,
  icon = 'tasks',
  detail,
  action,
}: {
  title: string;
  description: string;
  phase: string;
  icon?: AppIconName;
  detail?: string;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mvp-page mvp-placeholder-page">
      <Card className="mvp-placeholder-card">
        <CardHeader>
          <span className="mvp-placeholder-card__icon">
            <AppIcon name={icon} size={24} />
          </span>
          <span className="mvp-card-kicker">{phase}</span>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{description}</p>
          <div className="mvp-alert">
            <p>该功能将在后续阶段迁移。</p>
          </div>
          {detail ? <p className="mvp-placeholder-card__detail">{detail}</p> : null}
        </CardContent>
        {action ? (
          <CardFooter>
            <Button fullWidth onClick={action.onClick}>{action.label}</Button>
          </CardFooter>
        ) : null}
      </Card>
    </div>
  );
}
