import { useEffect, useState, type ReactNode } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import type { UserRole } from '../domain/users';
import { formatCompactDateTime } from '../selectors/homeSelectors';
import { useDemo } from '../state/DemoProvider';
import { DirectorHomePage } from '../pages/DirectorHomePage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RoleSelectPage } from '../pages/RoleSelectPage';
import { TeacherHomePage } from '../pages/TeacherHomePage';
import { ObservationFeedbackPage } from '../pages/ObservationFeedbackPage';
import { TeacherTaskDetailPage } from '../pages/TeacherTaskDetailPage';
import { TeacherTaskListPage } from '../pages/TeacherTaskListPage';
import { canTaskAcceptObservation } from '../selectors/taskSelectors';
import { getActiveNavigation, getMvpRoute, type MvpRoute } from './routes';
import './mvp.css';

export type MvpRole = Extract<UserRole, 'head_teacher' | 'grade_director'>;
export type LegacyRoleId = 'homeroomTeacher' | 'gradeDirector' | 'counselor' | 'principal';

const ROLE_STORAGE_KEY = 'changshu-mvp-demo-role';

function readStoredRole(): MvpRole | null {
  const value = window.sessionStorage.getItem(ROLE_STORAGE_KEY);
  return value === 'head_teacher' || value === 'grade_director' ? value : null;
}

function roleToLegacyRole(role: MvpRole): LegacyRoleId {
  return role === 'grade_director' ? 'gradeDirector' : 'homeroomTeacher';
}

function replaceHash(hash: string) {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
}

function filterIntentLabel(filter?: string) {
  if (filter === 'overdue') return '筛选意图：仅查看已超时任务';
  if (filter === 'pending') return '筛选意图：仅查看待处理任务';
  if (filter === 'today') return '筛选意图：仅查看今日新增事项';
  return '进入后将展示当前角色可见的全部事项';
}

export function MvpApp({
  renderLegacy,
}: {
  renderLegacy: (roleId: LegacyRoleId) => ReactNode;
}) {
  const {
    currentRole,
    currentUser,
    tasks,
    observations,
    now,
    loading,
    switchDemoRole,
    getTaskById,
    markTaskRead,
    submitObservation,
    submitObservationRevision,
    simulateNextWriteFailure,
    retestSchedules,
    error,
  } = useDemo();
  const [selectedRole, setSelectedRole] = useState<MvpRole | null>(() => readStoredRole());
  const [route, setRoute] = useState<MvpRoute>(() => getMvpRoute());

  useEffect(() => {
    const handleHashChange = () => setRoute(getMvpRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (route.name === 'legacyCounselor') {
      if (currentRole !== 'psychologist') switchDemoRole('psychologist');
      return;
    }
    if (selectedRole && currentRole !== selectedRole) switchDemoRole(selectedRole);
  }, [currentRole, route.name, selectedRole, switchDemoRole]);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('failNextWrite') !== '1') return;
    simulateNextWriteFailure();
    params.delete('failNextWrite');
    const search = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${search ? `?${search}` : ''}${window.location.hash}`,
    );
  }, [simulateNextWriteFailure]);

  const navigate = (hash: string) => {
    window.location.hash = hash;
  };

  const navigateReplace = (hash: string) => {
    replaceHash(hash);
    setRoute(getMvpRoute());
  };

  const taskListHash = () => {
    const filter = window.sessionStorage.getItem('changshu-demo:teacher-task-last-filter');
    return filter && filter !== 'all'
      ? `#/mvp/teacher/tasks?filter=${encodeURIComponent(filter)}`
      : '#/mvp/teacher/tasks';
  };

  const selectRole = (role: MvpRole) => {
    const result = switchDemoRole(role);
    if (!result.ok) return;
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    setSelectedRole(role);
    replaceHash('#/mvp/home');
    setRoute({ name: 'home' });
  };

  const resetRole = () => {
    window.sessionStorage.removeItem(ROLE_STORAGE_KEY);
    setSelectedRole(null);
    replaceHash('#/select-role');
    setRoute({ name: 'roleSelect' });
  };

  if (route.name === 'legacyPrincipal') {
    return <>{renderLegacy('principal')}</>;
  }

  if (route.name === 'legacyCounselor') {
    if (currentRole !== 'psychologist') return <LoadingState text="正在进入旧版心理老师演示…" />;
    return <>{renderLegacy('counselor')}</>;
  }

  if (!selectedRole || route.name === 'roleSelect') {
    return <RoleSelectPage onSelect={selectRole} />;
  }

  if (currentRole !== selectedRole) {
    return <LoadingState text="正在切换演示角色…" />;
  }

  if (error && !['legacyTask', 'legacyReport'].includes(route.name)) {
    return (
      <AccessState
        title="演示数据暂时不可用"
        description={error}
        actionLabel="返回角色选择"
        onAction={resetRole}
      />
    );
  }

  if (route.name === 'legacyTask') {
    const access = route.taskId ? getTaskById(route.taskId) : null;
    if (!access?.ok) {
      return (
        <AccessState
          title="无权查看该任务"
          description={access && !access.ok ? access.message : '任务不存在或当前角色无权查看。'}
          actionLabel="返回首页"
          onAction={() => navigate('#/mvp/home')}
        />
      );
    }
    return <>{renderLegacy(roleToLegacyRole(selectedRole))}</>;
  }

  if (route.name === 'legacyReport') {
    if (selectedRole !== 'head_teacher') {
      return (
        <AccessState
          title="当前角色不可上报"
          description="主动上报仅属于班主任协作入口。"
          actionLabel="返回首页"
          onAction={() => navigate('#/mvp/home')}
        />
      );
    }
    return <>{renderLegacy('homeroomTeacher')}</>;
  }

  const accessError = getRouteAccessError(route, selectedRole);
  if (accessError) {
    return (
      <AccessState
        title="当前角色无权进入"
        description={accessError}
        actionLabel="返回当前角色首页"
        onAction={() => navigate('#/mvp/home')}
      />
    );
  }

  const phase3TaskAccess =
    ['teacherTaskDetail', 'teacherFeedback'].includes(route.name) && route.taskId
      ? getTaskById(route.taskId)
      : null;

  if (
    ['teacherTaskDetail', 'teacherFeedback'].includes(route.name) &&
    (!route.taskId || !phase3TaskAccess?.ok)
  ) {
    return (
      <AccessState
        title="无权查看该任务"
        description={
          phase3TaskAccess && !phase3TaskAccess.ok
            ? phase3TaskAccess.message
            : '任务不存在或当前角色无权查看。'
        }
        actionLabel="返回任务列表"
        onAction={() => navigate(taskListHash())}
      />
    );
  }

  if (
    route.name === 'teacherFeedback' &&
    phase3TaskAccess?.ok &&
    !canTaskAcceptObservation(phase3TaskAccess.data)
  ) {
    return (
      <AccessState
        title="当前任务不可提交"
        description={
          phase3TaskAccess.data.status === 'completed'
            ? '任务已完成，只能查看历史记录。'
            : phase3TaskAccess.data.status === 'cancelled'
              ? '任务已取消，草稿不能继续提交。'
              : '该任务当前处于只读状态。'
        }
        actionLabel="返回任务详情"
        onAction={() => navigateReplace(`#/mvp/teacher/tasks/${phase3TaskAccess.data.id}`)}
      />
    );
  }

  const activeNavigation = getActiveNavigation(route);
  return (
    <AppShell role={selectedRole} activeNavigation={activeNavigation} onNavigate={navigate}>
      {route.name === 'home' && selectedRole === 'head_teacher' ? (
        <TeacherHomePage onNavigate={navigate} />
      ) : null}
      {route.name === 'home' && selectedRole === 'grade_director' ? (
        <DirectorHomePage onNavigate={navigate} />
      ) : null}
      {route.name === 'tasks' ? (
        <TeacherTaskListPage
          userId={currentUser.id}
          tasks={tasks}
          now={now}
          filter={route.filter}
          loading={loading}
          onBack={() => navigate('#/mvp/home')}
          onFilter={(filter) =>
            navigate(
              filter === 'all'
                ? '#/mvp/teacher/tasks'
                : `#/mvp/teacher/tasks?filter=${filter}`,
            )
          }
          onOpen={(task) =>
            navigate(
              task.type === 'retest_reminder'
                ? `#/mvp/retest/${task.id}`
                : `#/mvp/teacher/tasks/${task.id}`,
            )
          }
        />
      ) : null}
      {route.name === 'teacherTaskDetail' && phase3TaskAccess?.ok ? (
        <TeacherTaskDetailPage
          task={phase3TaskAccess.data}
          observations={observations}
          now={now}
          highlightRecordId={route.highlightRecordId}
          onBack={() => navigate(taskListHash())}
          onFeedback={() =>
            navigate(`#/mvp/teacher/tasks/${phase3TaskAccess.data.id}/feedback`)
          }
          markTaskRead={markTaskRead}
        />
      ) : null}
      {route.name === 'teacherFeedback' && phase3TaskAccess?.ok ? (
        <ObservationFeedbackPage
          task={phase3TaskAccess.data}
          currentUserId={currentUser.id}
          observations={observations}
          now={now}
          loading={loading}
          onBack={() =>
            navigateReplace(`#/mvp/teacher/tasks/${phase3TaskAccess.data.id}`)
          }
          onSubmitted={(recordId) =>
            navigateReplace(
              `#/mvp/teacher/tasks/${phase3TaskAccess.data.id}?highlight=${recordId}`,
            )
          }
          submitObservation={submitObservation}
          submitObservationRevision={submitObservationRevision}
        />
      ) : null}
      {route.name === 'report' ? (
        <PlaceholderPage
          title="主动上报"
          phase="Phase 4"
          description="新版上报写入将在 Phase 4 接入统一 Repository，本轮不创建第二套状态。"
          detail="当前可进入旧页面查看既有表单结构。"
          icon="report"
          action={{ label: '进入旧版上报页', onClick: () => navigate('#/report') }}
        />
      ) : null}
      {route.name === 'supervision' ? (
        <PlaceholderPage
          title="督办事项"
          phase="Phase 5"
          description="这里将承接当前年级主任可见的超时和明确指派事项。"
          detail={`${filterIntentLabel(route.filter)}${route.taskId ? ` · 事项 ${route.taskId}` : ''}`}
          icon="supervision"
        />
      ) : null}
      {route.name === 'profile' ? <ProfilePage onSwitchRole={resetRole} /> : null}
      {route.name === 'retest' ? (
        <RetestPlaceholder
          taskId={route.taskId}
          onBack={() => navigate('#/mvp/home')}
          getTaskById={getTaskById}
          schedules={retestSchedules}
        />
      ) : null}
      {route.name === 'notFound' ? (
        <PlaceholderPage
          title="页面不存在"
          phase="路由提示"
          description="当前链接不属于本轮已开放的演示页面。"
          icon="alert"
          action={{ label: '返回首页', onClick: () => navigate('#/mvp/home') }}
        />
      ) : null}
    </AppShell>
  );
}

function getRouteAccessError(route: MvpRoute, role: MvpRole) {
  if (role === 'head_teacher' && route.name === 'supervision') {
    return '督办入口仅对年级主任开放。';
  }
  if (
    role === 'grade_director' &&
    ['tasks', 'teacherTaskDetail', 'teacherFeedback', 'report', 'retest'].includes(route.name)
  ) {
    return '该页面属于班主任协作范围。';
  }
  return null;
}

function RetestPlaceholder({
  taskId,
  onBack,
  getTaskById,
  schedules,
}: {
  taskId?: string;
  onBack: () => void;
  getTaskById: ReturnType<typeof useDemo>['getTaskById'];
  schedules: ReturnType<typeof useDemo>['retestSchedules'];
}) {
  const access = taskId ? getTaskById(taskId) : null;
  const task = access?.ok ? access.data : null;
  const schedule = task ? schedules.find((item) => item.taskId === task.id) : null;

  if (!task || task.type !== 'retest_reminder' || !schedule) {
    return (
      <PlaceholderPage
        title="无权查看该提醒"
        phase="权限提示"
        description={access && !access.ok ? access.message : '未找到当前角色可见的复测提醒。'}
        icon="alert"
        action={{ label: '返回首页', onClick: onBack }}
      />
    );
  }

  return (
    <PlaceholderPage
      title={`${task.student.name} · 复测提醒`}
      phase="Phase 4 只读占位"
      description={`${task.student.className}，安排时间 ${formatCompactDateTime(schedule.scheduledAt)}。`}
      detail={`${schedule.instructions} 本轮不提供确认操作。`}
      icon="calendar"
      action={{ label: '返回首页', onClick: onBack }}
    />
  );
}

function LoadingState({ text }: { text: string }) {
  return (
    <main className="mvp-system-state" aria-live="polite">
      <span className="mvp-system-state__icon">
        <AppIcon name="clock" size={23} />
      </span>
      <p>{text}</p>
    </main>
  );
}

function AccessState({
  title,
  description,
  actionLabel,
  onAction,
}: {
  title: string;
  description: string;
  actionLabel: string;
  onAction: () => void;
}) {
  return (
    <main className="mvp-system-state">
      <Card>
        <CardHeader>
          <span className="mvp-system-state__icon">
            <AppIcon name="shield" size={23} />
          </span>
          <CardTitle>{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{description}</p>
          <Button fullWidth onClick={onAction}>{actionLabel}</Button>
        </CardContent>
      </Card>
    </main>
  );
}
