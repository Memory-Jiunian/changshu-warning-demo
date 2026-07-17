import type { UserRole } from '../domain/users';
import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';

const roleOptions: Array<{
  role: Extract<UserRole, 'head_teacher' | 'grade_director'>;
  title: string;
  description: string;
  icon: 'clipboard' | 'users';
}> = [
  {
    role: 'head_teacher',
    title: '班主任',
    description: '处理心理老师发起的协作任务，提交日常事实观察，并接收复测提醒。',
    icon: 'clipboard',
  },
  {
    role: 'grade_director',
    title: '年级主任',
    description: '查看超时或被指派事项，协调班主任完成协作任务。',
    icon: 'users',
  },
];

export function RoleSelectPage({
  onSelect,
}: {
  onSelect: (role: Extract<UserRole, 'head_teacher' | 'grade_director'>) => void;
}) {
  return (
    <main className="mvp-role-select">
      <section className="mvp-role-select__intro">
        <Badge variant="brand">演示模式</Badge>
        <h1>选择体验角色</h1>
        <p>不同角色仅查看与自身职责相关的最小必要信息。</p>
      </section>
      <div className="mvp-role-select__list">
        {roleOptions.map((option) => (
          <Card key={option.role} as="article" className="mvp-role-option">
            <CardHeader>
              <span className="mvp-role-option__icon">
                <AppIcon name={option.icon} size={25} />
              </span>
              <CardTitle>{option.title}</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{option.description}</p>
            </CardContent>
            <CardFooter>
              <Button
                fullWidth
                trailingIcon={<AppIcon name="arrowRight" size={17} />}
                onClick={() => onSelect(option.role)}
              >
                进入{option.title}端
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>
      <p className="mvp-role-select__notice">
        本入口仅用于作品演示，不提供真实账号登录。
      </p>
    </main>
  );
}
