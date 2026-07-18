import { AppIcon, type AppIconName } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';

export function PlaceholderPage({
  title,
  description,
  icon = 'tasks',
  action,
}: {
  title: string;
  description: string;
  icon?: AppIconName;
  action?: { label: string; onClick: () => void };
}) {
  return (
    <div className="mvp-page mvp-placeholder-page">
      <Card className="mvp-placeholder-card">
        <CardHeader>
          <span className="mvp-placeholder-card__icon">
            <AppIcon name={icon} size={24} />
          </span>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{description}</p>
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
