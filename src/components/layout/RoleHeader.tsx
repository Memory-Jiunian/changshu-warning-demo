import type { DemoUser, UserRole } from '../../domain/users';
import { AppIcon } from '../ui/AppIcon';

const roleLabels: Record<UserRole, string> = {
  head_teacher: '班主任',
  grade_director: '年级主任',
  psychologist: '心理老师',
};

export function RoleHeader({
  user,
  scopeLabel,
  demoDate,
}: {
  user: DemoUser;
  scopeLabel: string;
  demoDate: string;
}) {
  const isDirector = user.role === 'grade_director';
  return (
    <header className="mvp-role-header">
      <div className="mvp-role-header__copy">
        <span className="mvp-role-header__eyebrow">演示模式 · {demoDate}</span>
        <h1>{user.name}，你好</h1>
        <p>{roleLabels[user.role]} · {scopeLabel}</p>
      </div>
      <span className="mvp-role-header__icon" aria-hidden="true">
        <AppIcon name={isDirector ? 'users' : 'clipboard'} size={25} />
      </span>
    </header>
  );
}
