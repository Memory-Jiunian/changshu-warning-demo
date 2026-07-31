import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import type { UserRole } from '../domain/users';
import { useDemo } from '../state/DemoProvider';
import { AbnormalReportPage } from '../pages/AbnormalReportPage';
import { DirectorHomePage } from '../pages/DirectorHomePage';
import { PlaceholderPage } from '../pages/PlaceholderPage';
import { ProfilePage } from '../pages/ProfilePage';
import { RetestReminderPage } from '../pages/RetestReminderPage';
import { RoleSelectPage } from '../pages/RoleSelectPage';
import { TeacherHomePage } from '../pages/TeacherHomePage';
import { TeacherReportDetailPage } from '../pages/TeacherReportDetailPage';
import { TeacherReportListPage } from '../pages/TeacherReportListPage';
import { ObservationFeedbackPage } from '../pages/ObservationFeedbackPage';
import { TeacherTaskDetailPage } from '../pages/TeacherTaskDetailPage';
import { TeacherTaskListPage } from '../pages/TeacherTaskListPage';
import { GradeDirectorTasksPage } from '../pages/GradeDirectorTasksPage';
import { canTaskAcceptObservation } from '../selectors/taskSelectors';
import {
  type NavigationGuardRegistration,
  formatDraftSavedTime,
} from '../state/navigationGuard';
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

function isApprovedCurrentTeacherRoute(route: MvpRoute) {
  return (
    route.name === 'retest' || route.name === 'report'
  );
}

function getCurrentRouteRole(route: MvpRoute): MvpRole | null {
  if (route.name === 'supervision') return 'grade_director';
  if (isApprovedCurrentTeacherRoute(route)) return 'head_teacher';
  return null;
}

function replaceHash(hash: string) {
  window.history.replaceState(null, '', `${window.location.pathname}${window.location.search}${hash}`);
}

interface PendingNavigation {
  hash: string;
  replace: boolean;
  beforeNavigate?: () => void;
}

export function MvpApp({
  renderLegacy,
}: {
  renderLegacy: (roleId: LegacyRoleId) => ReactNode;
}) {
  const {
    currentRole,
    currentUser,
    students,
    tasks,
    observations,
    abnormalReports,
    now,
    loading,
    switchDemoRole,
    getTaskById,
    getAbnormalReportById,
    markTaskRead,
    submitObservation,
    submitObservationRevision,
    submitAbnormalReport,
    confirmRetestReminder,
    simulateNextWriteFailure,
    retestSchedules,
    teacherActionItems,
    gradeDirectorSupervisionItems,
    addCurrentSupervisionRecord,
    error,
  } = useDemo();
  const [route, setRoute] = useState<MvpRoute>(() => getMvpRoute());
  const [selectedRole, setSelectedRole] = useState<MvpRole | null>(() =>
    getCurrentRouteRole(getMvpRoute()) ?? readStoredRole(),
  );
  const [navigationGuard, setNavigationGuardState] =
    useState<NavigationGuardRegistration | null>(null);
  const [pendingNavigation, setPendingNavigation] =
    useState<PendingNavigation | null>(null);
  const navigationGuardRef = useRef<NavigationGuardRegistration | null>(null);
  const acceptedHashRef = useRef(window.location.hash || '#/');
  const allowNextHashChangeRef = useRef(false);

  const updateNavigationGuard = useCallback(
    (registration: NavigationGuardRegistration | null) => {
      navigationGuardRef.current = registration;
      setNavigationGuardState(registration);
    },
    [],
  );

  const performNavigation = useCallback((transition: PendingNavigation) => {
    transition.beforeNavigate?.();
    if (transition.replace) {
      replaceHash(transition.hash);
      acceptedHashRef.current = transition.hash;
      setRoute(getMvpRoute());
      return;
    }
    if (window.location.hash === transition.hash) {
      acceptedHashRef.current = transition.hash;
      setRoute(getMvpRoute());
      return;
    }
    allowNextHashChangeRef.current = true;
    window.location.hash = transition.hash;
  }, []);

  const requestNavigation = useCallback(
    (
      hash: string,
      options: { replace?: boolean; beforeNavigate?: () => void } = {},
    ) => {
      if (
        hash === acceptedHashRef.current &&
        !options.beforeNavigate
      ) {
        return;
      }
      const transition: PendingNavigation = {
        hash,
        replace: Boolean(options.replace),
        beforeNavigate: options.beforeNavigate,
      };
      if (navigationGuardRef.current?.dirty) {
        setPendingNavigation(transition);
        return;
      }
      performNavigation(transition);
    },
    [performNavigation],
  );

  useEffect(() => {
    const handleHashChange = () => {
      const nextHash = window.location.hash || '#/';
      if (allowNextHashChangeRef.current) {
        allowNextHashChangeRef.current = false;
        acceptedHashRef.current = nextHash;
        setRoute(getMvpRoute());
        return;
      }
      if (
        navigationGuardRef.current?.dirty &&
        nextHash !== acceptedHashRef.current
      ) {
        replaceHash(acceptedHashRef.current);
        setPendingNavigation({ hash: nextHash, replace: false });
        return;
      }
      acceptedHashRef.current = nextHash;
      setRoute(getMvpRoute());
    };
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

  const navigate = useCallback(
    (hash: string) => requestNavigation(hash),
    [requestNavigation],
  );

  const navigateReplace = useCallback(
    (hash: string) => requestNavigation(hash, { replace: true }),
    [requestNavigation],
  );

  const taskListHash = () => {
    const filter = window.sessionStorage.getItem('changshu-demo:teacher-task-last-filter');
    const view = window.sessionStorage.getItem('changshu-demo:teacher-task-last-view');
    const params = new URLSearchParams();
    if (view === 'history') params.set('view', 'history');
    if (filter && !['action', 'history'].includes(filter)) params.set('filter', filter);
    const query = params.toString();
    return query ? `#/mvp/teacher/tasks?${query}` : '#/mvp/teacher/tasks';
  };

  const selectRole = (role: MvpRole) => {
    const result = switchDemoRole(role);
    if (!result.ok) return;
    window.sessionStorage.setItem(ROLE_STORAGE_KEY, role);
    setSelectedRole(role);
    replaceHash('#/mvp/home');
    acceptedHashRef.current = '#/mvp/home';
    setRoute({ name: 'home' });
  };

  const performRoleReset = useCallback(() => {
    window.sessionStorage.removeItem(ROLE_STORAGE_KEY);
    setSelectedRole(null);
  }, []);

  const resetRole = useCallback(() => {
    requestNavigation('#/select-role', {
      replace: true,
      beforeNavigate: performRoleReset,
    });
  }, [performRoleReset, requestNavigation]);

  const continueCurrentForm = useCallback(() => {
    setPendingNavigation(null);
  }, []);

  const leaveCurrentForm = useCallback(() => {
    if (!pendingNavigation) return;
    if (navigationGuardRef.current?.saveStatus === 'error') {
      navigationGuardRef.current.discardDraft();
    }
    updateNavigationGuard(null);
    setPendingNavigation(null);
    performNavigation(pendingNavigation);
  }, [pendingNavigation, performNavigation, updateNavigationGuard]);

  if (route.name === 'legacyPrincipal') {
    return <>{renderLegacy('principal')}</>;
  }

  if (route.name === 'legacyCounselor') {
    if (currentRole !== 'psychologist') return <LoadingState text="正在进入心理老师页面…" />;
    return <>{renderLegacy('counselor')}</>;
  }

  if (!selectedRole || route.name === 'roleSelect') {
    return <RoleSelectPage onSelect={selectRole} />;
  }

  if (currentRole !== selectedRole) {
    return <LoadingState text="正在切换角色…" />;
  }

  if (error && !['legacyTask', 'legacyReport'].includes(route.name)) {
    return (
      <AccessState
        title="数据暂时不可用"
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

  const reportAccess =
    route.name === 'reportDetail' && route.reportId
      ? getAbnormalReportById(route.reportId)
      : null;

  if (
    route.name === 'reportDetail' &&
    (!route.reportId || !reportAccess?.ok)
  ) {
    return (
      <AccessState
        title="无权查看该上报记录"
        description={
          reportAccess && !reportAccess.ok
            ? reportAccess.message
            : '记录不存在或当前角色无权查看。'
        }
        actionLabel="返回我的上报"
        onAction={() => navigate('#/mvp/teacher/reports')}
      />
    );
  }

  const retestAction =
    route.name === 'retest' && route.taskId
      ? teacherActionItems.find(
          (item) =>
            item.kind === 'retest_reminder' &&
            item.target.name === 'retest' &&
            item.target.taskId === route.taskId,
        )
      : null;
  const retestTaskAccess =
    retestAction && route.taskId
      ? getTaskById(route.taskId)
      : null;
  const retestTask = retestTaskAccess?.ok ? retestTaskAccess.data : null;
  const retestSchedule = retestTask
    ? retestSchedules.find((item) => item.taskId === retestTask.id)
    : null;

  if (
    route.name === 'retest' &&
    (!retestTask ||
      retestTask.type !== 'retest_reminder' ||
      !retestSchedule)
  ) {
    return (
      <AccessState
        title="无权查看该复测提醒"
        description={
          retestTaskAccess && !retestTaskAccess.ok
            ? retestTaskAccess.message
            : '未找到当前角色可见的复测提醒。'
        }
        actionLabel="返回我的待办"
        onAction={() => navigate('#/feedback/tasks')}
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
    <AppShell
      role={selectedRole}
      activeNavigation={activeNavigation}
      onNavigate={navigate}
      showMainContentPlate={!['teacherFeedback', 'report', 'supervision'].includes(route.name)}
      showBottomNavigation={
        ![
          'teacherTaskDetail',
          'teacherFeedback',
          'retest',
          'report',
          'supervision',
        ].includes(route.name)
      }
    >
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
          view={route.view}
          loading={loading}
          onView={(view) =>
            navigate(
              view === 'history'
                ? '#/mvp/teacher/tasks?view=history'
                : '#/mvp/teacher/tasks',
            )
          }
          onFilter={(view, filter) => {
            const params = new URLSearchParams();
            if (view === 'history') params.set('view', 'history');
            if (!['action', 'history'].includes(filter)) params.set('filter', filter);
            const query = params.toString();
            navigate(query ? `#/mvp/teacher/tasks?${query}` : '#/mvp/teacher/tasks');
          }}
          onOpen={(task) =>
            navigate(
              task.type === 'retest_reminder'
                ? `#/mvp/teacher/retest/${task.id}`
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
          onNavigationGuardChange={updateNavigationGuard}
          submitObservation={submitObservation}
          submitObservationRevision={submitObservationRevision}
        />
      ) : null}
      {route.name === 'report' ? (
        <AbnormalReportPage
          currentUser={currentUser}
          students={students}
          now={now}
          loading={loading}
          onBack={() => navigate('#/feedback/tasks')}
          onNavigationGuardChange={updateNavigationGuard}
          submitAbnormalReport={submitAbnormalReport}
        />
      ) : null}
      {route.name === 'reports' ? (
        <TeacherReportListPage
          currentUser={currentUser}
          reports={abnormalReports}
          onBack={() => navigate('#/mvp/profile')}
          onCreate={() => navigate('#/mvp/teacher/report')}
          onOpen={(reportId) =>
            navigate(`#/mvp/teacher/reports/${reportId}`)
          }
        />
      ) : null}
      {route.name === 'reportDetail' && reportAccess?.ok ? (
        <TeacherReportDetailPage
          report={reportAccess.data}
          justSubmitted={Boolean(route.justSubmitted)}
          onBack={() => navigate('#/mvp/teacher/reports')}
          onViewRecord={() =>
            navigateReplace(`#/mvp/teacher/reports/${reportAccess.data.id}`)
          }
          onHome={() => navigate('#/mvp/home')}
        />
      ) : null}
      {route.name === 'supervision' ? (
        <GradeDirectorTasksPage
          currentUser={currentUser}
          items={gradeDirectorSupervisionItems}
          loading={loading}
          onSubmit={addCurrentSupervisionRecord}
        />
      ) : null}
      {route.name === 'profile' ? (
        <ProfilePage onSwitchRole={resetRole} onNavigate={navigate} />
      ) : null}
      {route.name === 'retest' && retestTask && retestSchedule ? (
        <RetestReminderPage
          task={retestTask}
          schedule={retestSchedule}
          currentUser={currentUser}
          now={now}
          loading={loading}
          onBack={() => navigate('#/feedback/tasks')}
          onConfirmed={() => navigateReplace('#/feedback/tasks')}
          markTaskRead={markTaskRead}
          confirmRetestReminder={confirmRetestReminder}
        />
      ) : null}
      {route.name === 'notFound' ? (
        <PlaceholderPage
          title="页面不存在"
          description="当前链接对应的页面不存在。"
          icon="alert"
          action={{ label: '返回首页', onClick: () => navigate('#/mvp/home') }}
        />
      ) : null}
      <NavigationGuardDialog
        guard={navigationGuard}
        open={Boolean(pendingNavigation)}
        onContinue={continueCurrentForm}
        onLeave={leaveCurrentForm}
      />
    </AppShell>
  );
}

function NavigationGuardDialog({
  guard,
  open,
  onContinue,
  onLeave,
}: {
  guard: NavigationGuardRegistration | null;
  open: boolean;
  onContinue: () => void;
  onLeave: () => void;
}) {
  if (!guard) return null;
  const saving =
    guard.saveStatus === 'idle' || guard.saveStatus === 'saving';
  const failed = guard.saveStatus === 'error';
  const savedTime = formatDraftSavedTime(guard.savedAt);

  return (
    <ConfirmDialog
      open={open}
      title={failed ? '草稿尚未保存' : '尚未提交'}
      description={
        failed
          ? '当前内容尚未保存。请重试保存，或明确舍弃后离开。'
          : saving
            ? '正在自动保存草稿，请稍候。'
            : '当前内容已自动保存为草稿，离开后可继续填写。'
      }
      cancelLabel="继续填写"
      confirmLabel={failed ? '舍弃并离开' : '离开页面'}
      confirmDisabled={saving}
      onCancel={onContinue}
      onConfirm={onLeave}
    >
      {failed ? (
        <Button variant="secondary" fullWidth onClick={guard.retrySave}>
          重试保存
        </Button>
      ) : (
        <p className="mvp-muted-copy">
          {savedTime
            ? `草稿已自动保存于 ${savedTime}，但尚未正式提交。`
            : '草稿已保存，但尚未正式提交。'}
        </p>
      )}
    </ConfirmDialog>
  );
}

function getRouteAccessError(route: MvpRoute, role: MvpRole) {
  if (role === 'head_teacher' && route.name === 'supervision') {
    return '督办入口仅对年级主任开放。';
  }
  if (
    role === 'grade_director' &&
    [
      'tasks',
      'teacherTaskDetail',
      'teacherFeedback',
      'report',
      'reports',
      'reportDetail',
      'retest',
    ].includes(route.name)
  ) {
    return '该页面属于班主任协作范围。';
  }
  return null;
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
