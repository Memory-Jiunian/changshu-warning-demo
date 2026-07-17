import { RoleHeader } from '../components/layout/RoleHeader';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import {
  formatDemoDate,
  getDirectorGradeLabel,
  getTeacherClassLabel,
} from '../selectors/homeSelectors';
import { useDemo } from '../state/DemoProvider';

export function ProfilePage({
  onSwitchRole,
}: {
  onSwitchRole: () => void;
}) {
  const { currentUser, tasks, now } = useDemo();
  const isDirector = currentUser.role === 'grade_director';
  const scopeLabel = isDirector
    ? getDirectorGradeLabel(currentUser, tasks)
    : getTeacherClassLabel(currentUser, tasks);

  return (
    <div className="mvp-page">
      <RoleHeader user={currentUser} scopeLabel={scopeLabel} demoDate={formatDemoDate(now)} />
      <Card>
        <CardHeader>
          <CardTitle>我的演示信息</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mvp-profile-row">
            <span>当前身份</span>
            <strong>{isDirector ? '年级主任' : '班主任'}</strong>
          </div>
          <div className="mvp-profile-row">
            <span>{isDirector ? '管理年级' : '所属班级'}</span>
            <strong>{scopeLabel}</strong>
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>{isDirector ? '督办历史' : '我的历史任务'}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mvp-muted-copy">该功能将在后续阶段迁移。</p>
          {!isDirector ? <p className="mvp-muted-copy">我的上报记录也将在 Phase 4 统一接入。</p> : null}
        </CardContent>
      </Card>
      <Card tone="soft">
        <CardHeader>
          <CardTitle>隐私与使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mvp-muted-copy">
            仅查看职责范围内的最小必要信息。测评原文、AI 原始判断和专业干预记录不在此端展示。
          </p>
        </CardContent>
      </Card>
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
