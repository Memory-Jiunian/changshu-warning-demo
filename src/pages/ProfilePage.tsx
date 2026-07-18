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
      <Card>
        <CardHeader>
          <CardTitle>当前身份</CardTitle>
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
          <p className="mvp-muted-copy">当前暂不提供历史汇总，可从任务页查看已有记录。</p>
        </CardContent>
      </Card>
      {!isDirector ? (
        <Card>
          <CardHeader>
            <CardTitle>我的上报</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mvp-muted-copy">查看本人提交的异常情况事实记录，不展示专业复核结论。</p>
            <Button
              variant="secondary"
              fullWidth
              trailingIcon={<AppIcon name="arrowRight" size={17} />}
              onClick={() => onNavigate('#/mvp/teacher/reports')}
            >
              查看我的上报
            </Button>
          </CardContent>
        </Card>
      ) : null}
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
        切换角色
      </Button>
    </div>
  );
}
