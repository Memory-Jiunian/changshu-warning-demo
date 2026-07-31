import { useCallback, useState } from 'react';
import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { MainContentPlate } from '../components/layout/PageFrame';
import { MOBILE_DEMO_ROLES } from '../app/mobileDemo';
import type { CurrentRouteRole } from '../app/currentRouteAuthority';
import './role-select.css';

const roleIcons = {
  head_teacher: 'clipboard',
  grade_director: 'users',
  principal: 'shield',
} as const;

export function RoleSelectPage({
  onSelect,
  onReset,
}: {
  onSelect: (role: CurrentRouteRole) => void;
  onReset: () => { ok: boolean; message?: string };
}) {
  const [resetOpen, setResetOpen] = useState(false);
  const [toast, setToast] = useState('');
  const dismissToast = useCallback(() => setToast(''), []);

  const confirmReset = () => {
    const result = onReset();
    if (!result.ok) {
      setToast(result.message ?? '演示数据重置失败');
      return;
    }
    setResetOpen(false);
    setToast('演示数据已重置');
    window.setTimeout(dismissToast, 2400);
  };

  return (
    <main className="mvp-role-select">
      <section className="mvp-role-select__intro">
        <Badge variant="brand">演示模式</Badge>
        <h1>选择体验角色</h1>
        <p>选择角色进入对应的校园预警协作 Demo。</p>
      </section>
      <MainContentPlate>
        <div className="mvp-role-select__list">
          {MOBILE_DEMO_ROLES.map((option) => (
            <Card key={option.role} as="article" className="mvp-role-option">
              <CardHeader>
                <span className="mvp-role-option__icon">
                  <AppIcon name={roleIcons[option.role]} size={25} />
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
      </MainContentPlate>
      <p className="mvp-role-select__notice">
        本入口仅用于作品演示，不提供真实账号登录。
      </p>
      <Button variant="ghost" size="sm" onClick={() => setResetOpen(true)}>
        重置演示数据
      </Button>
      <ConfirmDialog
        open={resetOpen}
        title="重置演示数据"
        description="这会恢复默认演示状态，并清除当前 Demo 中产生的操作记录。"
        confirmLabel="确认重置"
        onCancel={() => setResetOpen(false)}
        onConfirm={confirmReset}
      >
        <></>
      </ConfirmDialog>
      {toast ? <div className="toast" role="status" aria-live="polite">{toast}</div> : null}
    </main>
  );
}
