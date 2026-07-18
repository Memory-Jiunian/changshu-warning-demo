import { RoleHeader } from '../components/layout/RoleHeader';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import {
  getDirectorGradeLabel,
  getTeacherClassLabel,
} from '../selectors/homeSelectors';
import { useDemo } from '../state/DemoProvider';

export function ProfilePage({
  onSwitchRole,
  onNavigate,
}: {
  onSwitchRole: () => void;
  onNavigate: (hash: string) => void;
}) {
  const { currentUser, tasks } = useDemo();
  const isDirector = currentUser.role === 'grade_director';
  const scopeLabel = isDirector
    ? getDirectorGradeLabel(currentUser, tasks)
    : getTeacherClassLabel(currentUser, tasks);

  return (
    <div className="mvp-page">
      <RoleHeader user={currentUser} scopeLabel={scopeLabel} />
      {!isDirector ? (
        <Card>
          <CardHeader>
            <CardTitle>我的记录</CardTitle>
          </CardHeader>
          <CardContent className="mvp-profile-links">
            <Button
              variant="secondary"
              fullWidth
              trailingIcon={<AppIcon name="arrowRight" size={17} />}
              onClick={() => onNavigate('#/mvp/teacher/tasks')}
            >
              我的任务
            </Button>
            <Button
              variant="secondary"
              fullWidth
              trailingIcon={<AppIcon name="arrowRight" size={17} />}
              onClick={() => onNavigate('#/mvp/teacher/reports')}
            >
              我的上报
            </Button>
          </CardContent>
        </Card>
      ) : null}

      <details className="mvp-disclosure">
        <summary>隐私与使用说明</summary>
        <div className="mvp-disclosure__content">
          <p className="mvp-muted-copy">
            仅查看职责范围内的最小必要信息。测评原文、AI 原始判断和专业干预记录不在此端展示。
          </p>
        </div>
      </details>

      <Button
        variant="secondary"
        fullWidth
        leadingIcon={<AppIcon name="switch" size={18} />}
        onClick={onSwitchRole}
      >
        切换演示角色
      </Button>
    </div>
  );
}
