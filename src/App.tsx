import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { StatusBadge as UiStatusBadge } from './components/business/StatusBadge';
import { Badge as UiBadge } from './components/ui/Badge';
import { Button as UiButton } from './components/ui/Button';
import { Card as UiCard } from './components/ui/Card';
import { FormField as UiFormField } from './components/ui/FormField';
import {
  flowSteps,
  initialTasks,
  rolePermissions,
  roles,
  schoolOverview,
  type AttentionLevel,
  type FollowUpRecord,
  type HandlingTimelineItem,
  type Role,
  type RoleId,
  type StatusKey,
  type WarningTask,
} from './mockData';

type RouteName = 'home' | 'task' | 'record' | 'report' | 'progress' | 'schoolOverview';
type Route = { name: RouteName; taskId?: string };
type Action = { label: string; hash?: string; tone: 'primary' | 'secondary'; toast?: string; onClick?: () => void; disabled?: boolean; hidden?: boolean };
type HomeStatusDefinition = { label: string; match: (task: WarningTask) => boolean };
type ConfirmDialog =
  | { kind: 'supplement'; taskId: string }
  | { kind: 'directorReminder'; taskId: string }
  | { kind: 'principalAction'; itemKey: string; actionLabel: string; subject: string; progress: string; target: string };

const statusTone: Record<StatusKey, string> = {
  waitingFeedback: 'pending',
  overdue: 'overdue',
  pendingCounselorConfirm: 'confirm',
  active: 'active',
  continuousAttention: 'attention',
  retestPending: 'retest',
  referral: 'referral',
  closed: 'closed',
};

type IconName =
  | 'arrowLeft'
  | 'plus'
  | 'clipboardList'
  | 'heartPulse'
  | 'usersRound'
  | 'shieldAlert'
  | 'clock'
  | 'shieldCheck'
  | 'fileClock'
  | 'send'
  | 'triangleAlert';

const iconPaths: Record<IconName, ReactNode> = {
  arrowLeft: <path d="M15 18l-6-6 6-6M9 12h12" />,
  plus: <path d="M12 5v14M5 12h14" />,
  clipboardList: (
    <>
      <path d="M9 5h6a2 2 0 0 1 2 2v1H7V7a2 2 0 0 1 2-2Z" />
      <path d="M8 6H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-2" />
      <path d="M8 12h8M8 16h5" />
    </>
  ),
  heartPulse: (
    <>
      <path d="M19.5 12.8 12 20l-7.5-7.2A5 5 0 0 1 12 6.4a5 5 0 0 1 7.5 6.4Z" />
      <path d="M7.5 12h2l1.2-2.5 2.1 5 1.2-2.5h2.5" />
    </>
  ),
  usersRound: (
    <>
      <path d="M16 19a4 4 0 0 0-8 0" />
      <circle cx="12" cy="9" r="3" />
      <path d="M22 19a3.5 3.5 0 0 0-5-3.2M2 19a3.5 3.5 0 0 1 5-3.2" />
      <path d="M18 11.5a2.5 2.5 0 0 0 0-5M6 11.5a2.5 2.5 0 0 1 0-5" />
    </>
  ),
  shieldAlert: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="M12 8v5M12 16h.01" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10Z" />
      <path d="m9 12 2 2 4-4" />
    </>
  ),
  fileClock: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8Z" />
      <path d="M14 2v6h6" />
      <circle cx="12" cy="15" r="3" />
      <path d="M12 13.5V15l1 1" />
    </>
  ),
  send: (
    <>
      <path d="m22 2-7 20-4-9-9-4Z" />
      <path d="M22 2 11 13" />
    </>
  ),
  triangleAlert: (
    <>
      <path d="m12 3 10 18H2Z" />
      <path d="M12 9v5M12 17h.01" />
    </>
  ),
};

function Icon({ name, className = '', size = 20 }: { name: IconName; className?: string; size?: number }) {
  return (
    <svg className={`ui-icon ${className}`} width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {iconPaths[name]}
    </svg>
  );
}

function roleHeroIcon(roleId: RoleId): IconName {
  if (roleId === 'homeroomTeacher') return 'clipboardList';
  if (roleId === 'counselor') return 'heartPulse';
  if (roleId === 'gradeDirector') return 'usersRound';
  return 'shieldAlert';
}

function RoleHeroIcon({ roleId }: { roleId: RoleId }) {
  return (
    <span className="hero-icon-badge">
      <Icon name={roleHeroIcon(roleId)} size={24} />
    </span>
  );
}

export function App() {
  const [roleId, setRoleId] = useState<RoleId>('homeroomTeacher');
  const [warningTasks, setWarningTasks] = useState<WarningTask[]>(initialTasks);
  const [filter, setFilter] = useState('待反馈');
  const [route, setRoute] = useState<Route>(getRoute());
  const [toast, setToast] = useState('');
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialog | null>(null);
  const [principalLogs, setPrincipalLogs] = useState<Record<string, string>>({});
  const demoMode = isDemoMode();

  useEffect(() => {
    const handleHashChange = () => setRoute(getRoute());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(''), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const role = roles.find((item) => item.id === roleId) ?? roles[0];
  const task = warningTasks.find((item) => item.id === route.taskId) ?? warningTasks[0];
  const navigate = (hash: string) => {
    window.location.hash = hash;
  };
  const showToast = (message: string) => setToast(message);
  const changeRole = (nextRoleId: RoleId) => {
    setRoleId(nextRoleId);
    const nextRole = roles.find((item) => item.id === nextRoleId) ?? roles[0];
    setFilter(homeStatusDefinitions(nextRole)[0]?.label ?? '');
    if (nextRoleId === 'principal') navigate('#/school-overview');
    if (nextRoleId !== 'principal' && route.name === 'schoolOverview') navigate('#/');
  };

  const submitFollowUp = (taskId: string) => {
    setWarningTasks((current) =>
      current.map((item) => {
        if (item.id !== taskId) return item;
        const now = '刚刚';
        const record: FollowUpRecord = {
          by: role.teacherName ?? '班主任',
          role: '班主任',
          time: now,
          text: '观察时间段：今天上午；观察场景：课堂与课间；异常表现：课堂回应较少，课间多独处；发生频率：近两天偶发；影响程度：轻度影响课堂参与；已采取措施：完成一次低压力关心；事实描述：能回应简单询问，暂未发现冲突升级；需要心理老师尽快查看：是。',
          tag: '已反馈待确认',
        };
        const timeline: HandlingTimelineItem = {
          id: `feedback-${Date.now()}`,
          time: now,
          role: '班主任',
          action: '班主任提交观察反馈',
          status: '已反馈待确认',
          note: '班主任提交事实观察反馈，当前内容仅作为协作线索，等待心理老师确认。',
          audience: ['all'],
        };
        return {
          ...item,
          status: '已反馈待确认',
          statusKey: 'pendingCounselorConfirm',
          nextAction: '查看已提交反馈',
          records: [...item.records, record],
          timeline: [...item.timeline, timeline],
        };
      }),
    );
    showToast('已提交给心理老师。当前内容仅作为观察线索，后续由心理老师结合访谈、测评和既有记录进行专业判断。');
    navigate(`#/task/${taskId}`);
  };

  const applyCounselorAction = (
    taskId: string,
    action: string,
    status: string,
    statusKey: StatusKey,
    result: WarningTask['result'],
    nextAction: string,
    note: string,
  ) => {
    setWarningTasks((current) =>
      current.map((item) => {
        if (item.id !== taskId) return item;
        const timeline: HandlingTimelineItem = {
          id: `counselor-${Date.now()}`,
          time: '刚刚',
          role: '心理老师',
          action,
          status,
          note,
          audience: ['all'],
        };
        return {
          ...item,
          status,
          statusKey,
          result,
          nextAction,
          timeline: [...item.timeline, timeline],
          records: item.records.map((record) => (record.tag === '已反馈待确认' ? { ...record, tag: '心理老师已确认' } : record)),
        };
      }),
    );
    showToast(`${action}已记录，处置状态已同步更新`);
  };

  const confirmFeedback = (taskId: string) =>
    applyCounselorAction(taskId, '确认进入干预', '跟进中', 'active', '持续关注', '已进入干预处理', '确认班主任反馈后进入干预跟进，由心理老师继续判断后续处置。');

  const requestSupplement = (taskId: string) => setConfirmDialog({ kind: 'supplement', taskId });

  const sendSupplementRequest = (taskId: string) => {
    setWarningTasks((current) =>
      current.map((item) => {
        if (item.id !== taskId) return item;
        const timeline: HandlingTimelineItem = {
          id: `supplement-${Date.now()}`,
          time: '刚刚',
          role: '心理老师',
          action: '心理老师发送补充请求',
          status: '需补充',
          note:
            `发送对象：${item.owner}；补充原因：观察时间不明确、场景描述不足、缺少近期行为变化；` +
            '补充说明：请补充近 3 天课堂、课间和家校沟通中的具体观察事实，避免主观判断。；补充时限：今天 18:00 前；通知方式：小程序待办 + 短信提醒。',
          audience: ['all'],
        };
        return {
          ...item,
          status: '需补充',
          statusKey: 'waitingFeedback',
          nextAction: '补充观察反馈',
          timeline: [...item.timeline, timeline],
        };
      }),
    );
    setConfirmDialog(null);
    showToast('已发送补充请求，并记录到处置时间线');
  };

  const openDirectorReminder = (taskId: string) => setConfirmDialog({ kind: 'directorReminder', taskId });

  const sendDirectorReminder = (taskId: string) => {
    setWarningTasks((current) =>
      current.map((item) => {
        if (item.id !== taskId) return item;
        const message = `${item.owner}，您有一条学生观察反馈待办，请于今天 18:00 前进入心理健康小程序完成反馈。`;
        const timeline: HandlingTimelineItem = {
          id: `director-reminder-${Date.now()}`,
          time: '刚刚',
          role: '年级主任',
          action: '年级主任发送督办提醒',
          status: item.status,
          note: `提醒对象：${item.owner}；通知方式：小程序待办 + 短信提醒；消息内容：${message}；发送时间：刚刚。`,
          audience: ['director', 'counselor'],
        };
        return {
          ...item,
          timeline: [...item.timeline, timeline],
        };
      }),
    );
    setConfirmDialog(null);
    showToast('已发送提醒，并记录到督办留痕');
  };

  const openPrincipalAction = (item: (typeof schoolOverview.attentionItems)[number]) => {
    const target = item.actionLabel.includes('心理') ? '心理负责人' : '年级负责人';
    setConfirmDialog({
      kind: 'principalAction',
      itemKey: `${item.subject}-${item.issue}`,
      actionLabel: item.actionLabel,
      subject: item.subject,
      progress: item.progress,
      target,
    });
  };

  const sendPrincipalAction = (dialog: Extract<ConfirmDialog, { kind: 'principalAction' }>) => {
    setPrincipalLogs((current) => ({
      ...current,
      [dialog.itemKey]: `已于 刚刚 发送给 ${dialog.target}`,
    }));
    setConfirmDialog(null);
    showToast('已发送督办提醒，并完成留痕');
  };

  const arrangeRetest = (taskId: string) =>
    applyCounselorAction(taskId, '安排复测', '复测待安排', 'retestPending', '复测待安排', '查看复测计划', '结合反馈和既有记录，安排下一次复测计划。');

  const continueAttention = (taskId: string) =>
    applyCounselorAction(taskId, '持续关注', '持续关注', 'continuousAttention', '持续关注', '查看关注计划', '确认继续保持持续关注，并制定后续观察与沟通节奏。');

  const suggestReferral = (taskId: string) =>
    applyCounselorAction(taskId, '转介建议', '转介中', 'referral', '转介中', '查看转介进度', '建议启动专业资源转介流程，转介细节按权限展示。');

  const closeAttention = (taskId: string) =>
    applyCounselorAction(taskId, '解除关注', '已闭环', 'closed', '已闭环', '查看闭环详情', '确认本轮关注解除，流程进入闭环留痕。');

  const guardedRoute = role.id === 'principal' ? { name: 'schoolOverview' as const } : route;

  return (
    <MobileShell route={guardedRoute} role={role} toast={toast} navigate={navigate}>
      {guardedRoute.name === 'home' && (
        <Dashboard
          role={role}
          roleId={roleId}
          tasks={warningTasks}
          filter={filter}
          setFilter={setFilter}
          setRoleId={changeRole}
          demoMode={demoMode}
          navigate={navigate}
          showToast={showToast}
          onOpenDirectorReminder={openDirectorReminder}
        />
      )}
      {guardedRoute.name === 'task' && (
        <TaskDetail
          role={role}
          task={task}
          onConfirmFeedback={confirmFeedback}
          onReturnForSupplement={requestSupplement}
          onOpenDirectorReminder={openDirectorReminder}
          onArrangeRetest={arrangeRetest}
          onContinueAttention={continueAttention}
          onSuggestReferral={suggestReferral}
          onCloseAttention={closeAttention}
          showToast={showToast}
        />
      )}
      {guardedRoute.name === 'record' && <FollowUpRecord task={task} role={role} onSubmit={submitFollowUp} showToast={showToast} />}
      {guardedRoute.name === 'report' && <ClueReport role={role} tasks={visibleTasksForRole(warningTasks, role)} showToast={showToast} />}
      {guardedRoute.name === 'progress' && <ProgressDetail task={task} role={role} onConfirmFeedback={confirmFeedback} showToast={showToast} />}
      {guardedRoute.name === 'schoolOverview' && (
        <SchoolOverview
          role={role}
          roleId={roleId}
          setRoleId={changeRole}
          demoMode={demoMode}
          principalLogs={principalLogs}
          onOpenPrincipalAction={openPrincipalAction}
          showToast={showToast}
        />
      )}
      <ConfirmDialogLayer
        dialog={confirmDialog}
        tasks={warningTasks}
        onCancel={() => setConfirmDialog(null)}
        onSendSupplement={sendSupplementRequest}
        onSendDirectorReminder={sendDirectorReminder}
        onSendPrincipalAction={sendPrincipalAction}
      />
    </MobileShell>
  );
}

function getRoute(): Route {
  const hash = window.location.hash.replace(/^#/, '') || '/';
  const parts = hash.split('/').filter(Boolean);
  if (parts[0] === 'school-overview') return { name: 'schoolOverview' };
  if (parts[0] === 'task' && parts[2] === 'record') return { name: 'record', taskId: parts[1] };
  if (parts[0] === 'task' && parts[2] === 'progress') return { name: 'progress', taskId: parts[1] };
  if (parts[0] === 'task') return { name: 'task', taskId: parts[1] };
  if (parts[0] === 'report') return { name: 'report' };
  return { name: 'home' };
}

function isDemoMode() {
  const params = new URLSearchParams(window.location.search);
  return params.get('demo') === '1' || window.localStorage.getItem('demoMode') === '1';
}

function MobileShell({
  route,
  role,
  toast,
  navigate,
  children,
}: {
  route: Route;
  role: Role;
  toast: string;
  navigate: (hash: string) => void;
  children: ReactNode;
}) {
  const showBack = route.name !== 'home' && route.name !== 'schoolOverview';
  const canReport = rolePermissions[role.id].canSubmitClue;
  return (
    <main className="phone-shell">
      <header className="top-bar">
        <button className={`icon-button ${showBack ? '' : 'is-hidden'}`} onClick={() => navigate('#/')} aria-label="返回首页">
          <Icon name="arrowLeft" size={20} />
        </button>
        <div>
          <p className="eyebrow">{role.org}</p>
          <h1>{routeTitle(route.name, role)}</h1>
        </div>
        {canReport ? (
          <button className="icon-button" onClick={() => navigate('#/report')} aria-label={role.id === 'counselor' ? '新增专业记录' : '上报协作线索'}>
            <Icon name="plus" size={20} />
          </button>
        ) : (
          <span className="icon-button is-hidden" />
        )}
      </header>
      {children}
      {toast && <div className="toast">{toast}</div>}
    </main>
  );
}

function routeTitle(routeName: RouteName, role: Role) {
  if (routeName === 'home') {
    if (role.id === 'homeroomTeacher') return '我的观察任务';
    if (role.id === 'gradeDirector') return '年级督办';
    if (role.id === 'counselor') return '待确认反馈';
  }
  if (routeName === 'task') {
    if (role.id === 'counselor') return '反馈确认详情';
    if (role.id === 'homeroomTeacher') return '观察任务详情';
    if (role.id === 'gradeDirector') return '督办详情';
  }
  if (routeName === 'report') {
    if (role.id === 'counselor') return '新增专业记录';
    if (role.id === 'homeroomTeacher') return '上报协作线索';
  }
  if (routeName === 'progress') {
    if (role.id === 'counselor') return '完整处置时间线';
    if (role.id === 'homeroomTeacher') return '我的反馈状态';
    if (role.id === 'gradeDirector') return '本年级督办进度';
  }
  if (routeName === 'schoolOverview' && role.id === 'principal') return '预警督办 / 消息中心';
  const titles: Record<RouteName, string> = {
    home: '预警协同',
    task: '任务详情',
    record: '填写观察反馈',
    report: '协作线索',
    progress: '处置进度',
    schoolOverview: '校级全局视角',
  };
  return titles[routeName];
}

function Dashboard({
  role,
  roleId,
  tasks,
  filter,
  setFilter,
  setRoleId,
  demoMode,
  navigate,
  showToast,
  onOpenDirectorReminder,
}: {
  role: Role;
  roleId: RoleId;
  tasks: WarningTask[];
  filter: string;
  setFilter: (filter: string) => void;
  setRoleId: (roleId: RoleId) => void;
  demoMode: boolean;
  navigate: (hash: string) => void;
  showToast: (message: string) => void;
  onOpenDirectorReminder: (taskId: string) => void;
}) {
  const scopedTasks = visibleTasksForRole(tasks, role);
  const statusDefinitions = useMemo(() => homeStatusDefinitions(role), [role]);
  const activeFilter = statusDefinitions.some((item) => item.label === filter) ? filter : statusDefinitions[0]?.label;
  const activeDefinition = statusDefinitions.find((item) => item.label === activeFilter);
  const visibleTasks = activeDefinition ? scopedTasks.filter(activeDefinition.match) : scopedTasks;
  const stats = useMemo(() => statusDefinitions.map((item) => [item.label, scopedTasks.filter(item.match).length] as const), [scopedTasks, statusDefinitions]);
  const openTasks = stats.reduce((sum, [label, value]) => (label.includes('完成') || label.includes('闭环') ? sum : sum + value), 0);
  const counselorOverdueCount = role.id === 'counselor' ? scopedTasks.filter((task) => task.statusKey === 'overdue').length : 0;

  return (
    <section className="content">
      <section className="hero-panel">
        <div className="hero-main">
          <div>
            <p className="eyebrow">正式预警后的协作跟进</p>
            <h2>{dashboardTitle(role, openTasks)}</h2>
            <p>{role.scope}</p>
          </div>
          <RoleHeroIcon roleId={role.id} />
        </div>
        <DemoRoleEntry roleId={roleId} setRoleId={setRoleId} demoMode={demoMode} />
      </section>

      {role.id === 'counselor' && counselorOverdueCount > 0 && (
        <aside className="priority-reminder">
          <strong>{counselorOverdueCount} 项逾期未更新</strong>
          <span>请优先查看待确认反馈和超时协作任务。</span>
        </aside>
      )}

      <section className="stats-grid" aria-label="任务概览">
        {stats.map(([label, value]) => (
          <button className="stat-card" key={label} onClick={() => setFilter(String(label))}>
            <strong>{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <PermissionNotice role={role} />
      <SegmentedControl items={statusDefinitions.map((item) => item.label)} active={activeFilter} onChange={setFilter} />

      <section className="task-list">
        {visibleTasks.length ? (
          visibleTasks.map((task) => (
            <TaskCard key={task.id} task={task} role={role} navigate={navigate} showToast={showToast} onOpenDirectorReminder={onOpenDirectorReminder} />
          ))
        ) : (
          <EmptyState />
        )}
      </section>
    </section>
  );
}

function dashboardTitle(role: Role, openTasks: number) {
  if (role.id === 'homeroomTeacher') return <>有 <span className="hero-number">{openTasks}</span> 项观察任务待处理</>;
  if (role.id === 'gradeDirector') return <>本年级有 <span className="hero-number">{openTasks}</span> 项需督办</>;
  if (role.id === 'counselor') return <>有 <span className="hero-number">{openTasks}</span> 项反馈需要确认</>;
  return <>今日有 <span className="hero-number">{openTasks}</span> 项需要关注</>;
}

function SchoolOverview({
  role,
  roleId,
  setRoleId,
  demoMode,
  principalLogs,
  onOpenPrincipalAction,
  showToast,
}: {
  role: Role;
  roleId: RoleId;
  setRoleId: (roleId: RoleId) => void;
  demoMode: boolean;
  principalLogs: Record<string, string>;
  onOpenPrincipalAction: (item: (typeof schoolOverview.attentionItems)[number]) => void;
  showToast: (message: string) => void;
}) {
  const cards = [
    ['危险待推进', schoolOverview.highPriorityUnconfirmed],
    ['超时未处理', schoolOverview.staleOver48h],
    ['干预中', schoolOverview.activeCount],
    ['今日闭环', schoolOverview.todayClosed],
  ];

  return (
    <section className="content">
      <section className="hero-panel">
        <div className="hero-main">
          <div>
            <p className="eyebrow">预警督办 / 消息中心</p>
            <h2>先处理最需要推进的事项</h2>
            <p>只展示脱敏督办信息，用于判断是否需要协调年级负责人或心理负责人。</p>
          </div>
          <RoleHeroIcon roleId={role.id} />
        </div>
        <DemoRoleEntry roleId={roleId} setRoleId={setRoleId} demoMode={demoMode} />
      </section>

      <section className="overview-grid">
        {cards.map(([label, value]) => (
          <article className="overview-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

      <InfoSection title="需立即关注">
        <div className="principal-alert-list">
          {schoolOverview.attentionItems.map((item) => {
            const itemKey = `${item.subject}-${item.issue}`;
            return (
            <article className="principal-alert-item" key={itemKey}>
              <div>
                <strong>{item.subject}</strong>
                <span>{item.riskLevel}</span>
              </div>
              <p>{item.progress}</p>
              <dl>
                <div>
                  <dt><Icon name="clock" size={16} />时限</dt>
                  <dd className={item.timeStatus.includes('超时') ? 'danger-text' : ''}>{item.timeStatus}</dd>
                </div>
                <div>
                  <dt>已通知</dt>
                  <dd>{item.notified}</dd>
                </div>
              </dl>
              <button className="primary-btn" onClick={() => onOpenPrincipalAction(item)}>{item.actionLabel}</button>
              {principalLogs[itemKey] && <p className="trace-line">{principalLogs[itemKey]}</p>}
            </article>
          )})}
        </div>
      </InfoSection>

      <details className="secondary-analysis">
        <summary>查看统计分析</summary>
        <InfoSection title="年级分布">
          <div className="grade-list">
            {schoolOverview.gradeDistribution.map((item) => (
              <div className="grade-row" key={item.grade}>
                <div>
                  <strong>{item.grade}</strong>
                  <span>正式预警 {item.total} · 跟进中 {item.active}</span>
                </div>
                <div>
                  <b>{item.closureRate}</b>
                  <small>逾期 {item.overdue}</small>
                </div>
              </div>
            ))}
          </div>
        </InfoSection>

        <InfoSection title="处置压力提示">
          <div className="pressure-grid">
            <MetricLine label="心理老师待确认" value={`${schoolOverview.counselorPending} 项`} />
            <MetricLine label="班主任待观察反馈" value={`${schoolOverview.teacherPending} 项`} />
            <MetricLine label="超过 48 小时未更新" value={`${schoolOverview.staleOver48h} 项`} />
            <MetricLine label="资源压力" value={schoolOverview.resourcePressure} />
          </div>
        </InfoSection>

        <InfoSection title="异常提醒">
          <div className="pressure-grid">
            <MetricLine label="高优先级任务未确认" value={`${schoolOverview.highPriorityUnconfirmed} 项`} />
            <MetricLine label="多次复测仍需关注" value={`${schoolOverview.repeatedRetestAttention} 项`} />
            <MetricLine label="转介中任务" value={`${schoolOverview.referralCount} 项`} />
          </div>
        </InfoSection>
        <button className="text-link" onClick={() => showToast('资源压力说明：仅展示聚合排队和教师负荷，不展示个体学生信息。')}>
          查看资源压力说明
        </button>
      </details>

      <aside className="permission-notice">
        <Icon name="shieldCheck" size={20} />
        <div>
          <strong>隐私边界</strong>
          <p>校级视角仅展示聚合处置状态与脱敏事项，用于资源调配与流程督办；不展示学生姓名、班级、测评原文、咨询记录、敏感题项和 AI 原始判断。</p>
        </div>
      </aside>
    </section>
  );
}

function RoleSwitcher({ roleId, setRoleId }: { roleId: RoleId; setRoleId: (roleId: RoleId) => void }) {
  return (
    <div className="role-switcher" aria-label="角色切换">
      {roles.map((role) => (
        <button className={roleId === role.id ? 'is-active' : ''} key={role.id} onClick={() => setRoleId(role.id)}>
          {role.label}
        </button>
      ))}
    </div>
  );
}

function DemoRoleEntry({ roleId, setRoleId, demoMode }: { roleId: RoleId; setRoleId: (roleId: RoleId) => void; demoMode: boolean }) {
  if (!demoMode) return null;
  return (
    <details className="demo-role-entry">
      <summary>演示入口</summary>
      <RoleSwitcher roleId={roleId} setRoleId={setRoleId} />
    </details>
  );
}

function TaskCard({
  task,
  role,
  navigate,
  showToast,
  onOpenDirectorReminder,
}: {
  task: WarningTask;
  role: Role;
  navigate: (hash: string) => void;
  showToast: (message: string) => void;
  onOpenDirectorReminder: (taskId: string) => void;
}) {
  const action = taskPrimaryAction(task, role, onOpenDirectorReminder);
  const displayName = role.id === 'gradeDirector' ? `${task.className} · 脱敏事项` : role.id === 'counselor' ? `${task.student} · ${task.type}` : task.student;
  const summaryLabel = role.id === 'gradeDirector' ? '查看督办详情' : role.id === 'homeroomTeacher' ? '查看任务' : '查看复核详情';
  const feedbackSummary = role.id === 'counselor' ? task.nextAction : '';

  return (
    <article className="task-card">
      <div className="card-head">
        <div>
          <div className="title-row">
            <h3>{displayName}</h3>
            <AttentionLevelTag level={task.attention} roleId={role.id} />
          </div>
        </div>
        <HomeStatusBadge task={task} role={role} />
      </div>
      <dl className="task-meta-list">
        {role.id === 'counselor' && (
          <div className="task-meta-row">
            <dt>责任人</dt>
            <dd>{task.owner} / {task.counselor}</dd>
          </div>
        )}
        <div className="task-meta-row">
          <dt><Icon name="clock" size={16} />截止</dt>
          <dd className={task.statusKey === 'overdue' ? 'danger-text' : ''}>{task.deadline}</dd>
        </div>
        {role.id === 'counselor' && (
          <div className="task-meta-row">
            <dt>反馈</dt>
            <dd>{feedbackSummary}</dd>
          </div>
        )}
      </dl>
      {role.id === 'homeroomTeacher' && (
        <>
          <ChipList items={task.focus.slice(0, 2)} compact />
          {task.statusKey === 'pendingCounselorConfirm' && <p className="task-summary-line">已提交给心理老师，等待专业确认</p>}
        </>
      )}
      <div className="card-actions">
        <button className="secondary-btn" onClick={() => navigate(`#/task/${task.id}`)}>
          {summaryLabel}
        </button>
        {!action.hidden && (
          <button
            className="primary-btn"
            disabled={action.disabled}
            onClick={() => {
              if (action.disabled) return;
              if (action.hash) navigate(action.hash);
              if (action.toast) showToast(action.toast);
              if (action.onClick) action.onClick();
            }}
          >
            {action.label}
          </button>
        )}
      </div>
    </article>
  );
}

function TaskDetail({
  role,
  task,
  onConfirmFeedback,
  onReturnForSupplement,
  onOpenDirectorReminder,
  onArrangeRetest,
  onContinueAttention,
  onSuggestReferral,
  onCloseAttention,
  showToast,
}: {
  role: Role;
  task: WarningTask;
  onConfirmFeedback: (taskId: string) => void;
  onReturnForSupplement: (taskId: string) => void;
  onOpenDirectorReminder: (taskId: string) => void;
  onArrangeRetest: (taskId: string) => void;
  onContinueAttention: (taskId: string) => void;
  onSuggestReferral: (taskId: string) => void;
  onCloseAttention: (taskId: string) => void;
  showToast: (message: string) => void;
}) {
  const permissions = rolePermissions[role.id];

  if (!permissions.canEnterStudentDetail) {
    return <PrincipalDetailGuard />;
  }

  if (role.id === 'counselor') {
    return (
      <>
        <section className="content with-bottom-bar">
          <section className="detail-head">
            <div>
              <p className="eyebrow">反馈确认详情</p>
              <h2>
                {task.student} · {task.className}
              </h2>
              <p>
                状态：{task.status} · 当前结果：{task.result}
              </p>
            </div>
            <StatusBadge task={task} />
          </section>

          <InfoSection title="学生基础信息">
            <div className="info-list">
              <div>
                <span>关注等级</span>
                <strong>{task.attention}</strong>
              </div>
              <div>
                <span>责任班主任</span>
                <strong>{task.owner}</strong>
              </div>
              <div>
                <span>正式预警来源</span>
                <strong>{task.source}</strong>
              </div>
            </div>
          </InfoSection>

          <InfoSection title="班主任已提交反馈">
            {task.records.length ? task.records.map((record) => <SubmittedRecord key={`${record.by}-${record.time}-${record.tag}`} record={record} />) : <p className="muted-text">暂无班主任反馈，需等待观察任务提交。</p>}
          </InfoSection>

          <InfoSection title="异常观察要点">
            <ChipList items={task.focus} />
            <p>{task.suggestion}</p>
          </InfoSection>

          <InfoSection title="完整处置时间线">
            <DetailedTimeline task={task} role={role} />
          </InfoSection>

          <InfoSection title="专业判断边界" className="warning-box">
            <p>当前内容来自班主任观察反馈，仅作为协作线索。是否进入干预流程，需由心理老师结合访谈、测评和既有记录判断。</p>
          </InfoSection>

        </section>
        <BottomActionBar
          actions={counselorReviewActions(task, onConfirmFeedback, onReturnForSupplement, onArrangeRetest, onContinueAttention, onSuggestReferral, onCloseAttention)}
          showToast={showToast}
        />
      </>
    );
  }

  if (role.id === 'gradeDirector') {
    return (
      <>
        <section className="content with-bottom-bar">
          <section className="detail-head">
            <div>
              <p className="eyebrow">本年级协作进度</p>
              <h2>{task.className} · 脱敏督办事项</h2>
              <p>
                状态：{task.status} · 截止：{task.deadline}
              </p>
            </div>
            <StatusBadge task={task} />
          </section>

          <PermissionNotice role={role} />

          <InfoSection title="督办摘要">
            <div className="info-list">
              <div>
                <span>责任班主任</span>
                <strong>{task.owner}</strong>
              </div>
              <div>
                <span>所在班级</span>
                <strong>{task.className}</strong>
              </div>
              <div>
                <span>下一步</span>
                <strong>{task.statusKey === 'pendingCounselorConfirm' ? '等待心理老师专业确认' : task.nextAction}</strong>
              </div>
              <div>
                <span>逾期情况</span>
                <strong>{task.overdueHours ? `已超过 ${task.overdueHours} 小时` : '未逾期'}</strong>
              </div>
            </div>
          </InfoSection>

          <InfoSection title="脱敏流程状态">
            <p>{task.desensitizedFlow}</p>
            <p className="privacy-line">本页不展示学生姓名、AI 原始判断、敏感题项、咨询记录和完整干预细节。</p>
          </InfoSection>

          <InfoSection title="可督办事项">
            <div className="todo-list">
              <div>
                <span>待观察反馈 / 逾期未更新</span>
                <strong>提醒班主任反馈</strong>
              </div>
              <div>
                <span>信息不足</span>
                <strong>提醒补充信息</strong>
              </div>
              <div>
                <span>专业判断</span>
                <strong>仅查看状态，不直接督促心理老师</strong>
              </div>
            </div>
          </InfoSection>
        </section>
        <BottomActionBar actions={detailActions(task, role, onConfirmFeedback, showToast, onOpenDirectorReminder)} showToast={showToast} />
      </>
    );
  }

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="detail-head">
          <div>
            <p className="eyebrow">观察任务详情</p>
            <h2>
              {task.student} · {task.className}
            </h2>
            <p>
              状态：{task.status} · 截止：{task.deadline}
            </p>
          </div>
          <StatusBadge task={task} />
        </section>

        <PermissionNotice role={role} />

        <InfoSection title="协作任务边界">
          <p>{task.desensitizedFlow}</p>
          <p className="privacy-line">{task.restricted}</p>
        </InfoSection>

        <InfoSection title="观察重点">
          <ChipList items={task.focus} />
          <p>{task.suggestion}</p>
          <div className="warning-box">请记录可观察事实，避免填写风险等级、干预结论、心理状态判断、是否转介或是否解除关注。</div>
        </InfoSection>

        <InfoSection title="我的反馈状态">
          <div className="todo-list">
            <div>
              <span>提交状态</span>
              <strong>{teacherFeedbackStatus(task)}</strong>
            </div>
            <div>
              <span>专业确认</span>
              <strong>{teacherConfirmationStatus(task)}</strong>
            </div>
          </div>
        </InfoSection>

        <InfoSection title="已提交反馈">
          {task.records.length ? task.records.map((record) => <SubmittedRecord key={`${record.by}-${record.time}-${record.tag}`} record={record} />) : <p className="muted-text">暂无观察反馈，等待责任人提交首次反馈。</p>}
        </InfoSection>
      </section>
      <BottomActionBar actions={detailActions(task, role, onConfirmFeedback, showToast, onOpenDirectorReminder)} showToast={showToast} />
    </>
  );
}

function FollowUpRecord({
  task,
  role,
  onSubmit,
  showToast,
}: {
  task: WarningTask;
  role: Role;
  onSubmit: (taskId: string) => void;
  showToast: (message: string) => void;
}) {
  const canSubmit = rolePermissions[role.id].canSubmitFollowUp && ['waitingFeedback', 'overdue'].includes(task.statusKey);
  if (!canSubmit) {
    return (
      <section className="content">
        <PermissionBlock title="当前角色或状态不可填写观察反馈" text="已闭环、已反馈待确认或非班主任角色不能继续提交普通观察反馈。" />
      </section>
    );
  }

  return (
    <>
      <section className="content with-bottom-bar">
        <UiCard as="section" className="compact-summary" tone="glass">
          <div>
            <p className="eyebrow">观察任务</p>
            <h2>
              {task.student} · {task.className}
            </h2>
            <p>提交后由 {task.counselor} 确认，本页只记录事实观察，不填写专业判断或处置结论。</p>
          </div>
          <div className="record-summary-badges">
            <UiBadge variant="outline">事实观察</UiBadge>
            <UiStatusBadge statusKey={task.statusKey} status={task.status} />
          </div>
        </UiCard>

        <UiCard as="section" className="form-card" tone="glass">
          <UiFormField label="观察时间段">
            <input defaultValue="今天上午 08:00-12:00" />
          </UiFormField>
          <UiFormField label="观察场景">
            <SelectableChips
              items={['课堂', '课间', '午休', '放学后', '家校沟通', '其他']}
              defaults={['课堂', '课间']}
              className="feedback-option-chips"
            />
          </UiFormField>
          <UiFormField label="异常表现">
            <SelectableChips
              items={['课堂回应减少', '出勤变化', '同伴互动减少', '情绪波动', '独处增多', '暂未发现明显异常']}
              defaults={['课堂回应减少', '独处增多']}
              className="feedback-option-chips"
            />
          </UiFormField>
          <UiFormField label="发生频率">
            <select defaultValue="近两天偶发">
              <option>单次出现</option>
              <option>近两天偶发</option>
              <option>连续多日出现</option>
              <option>频率暂不明确</option>
            </select>
          </UiFormField>
          <UiFormField label="影响程度">
            <select defaultValue="轻度影响课堂参与">
              <option>暂未影响日常学习</option>
              <option>轻度影响课堂参与</option>
              <option>影响出勤或同伴互动</option>
              <option>需要心理老师尽快查看</option>
            </select>
          </UiFormField>
          <UiFormField label="已采取措施">
            <SelectableChips
              items={['日常关心', '简短沟通', '联系家长', '调整座位/任务', '暂未处理']}
              defaults={['日常关心']}
              className="feedback-option-chips"
            />
          </UiFormField>
          <UiFormField label="事实描述">
            <textarea defaultValue="今天上午课堂状态较安静，课间多独处；课后能回应简单关心，暂未发现明显冲突升级。" placeholder="请描述你观察到的具体事实，避免主观判断、标签化和诊断性表达。" />
          </UiFormField>
          <UiFormField label="是否需要心理老师尽快查看">
            <div className="option-list">
              {['是，建议尽快查看', '否，按常规节奏确认'].map((item, index) => (
                <label key={item}>
                  <input type="radio" name="urgentReview" defaultChecked={index === 0} />
                  {item}
                </label>
              ))}
            </div>
          </UiFormField>
        </UiCard>

        <PermissionNotice role={role} />
      </section>
      <div className="bottom-action-bar">
        <UiButton variant="secondary" fullWidth onClick={() => showToast('记录已暂存')}>
          保存草稿
        </UiButton>
        <UiButton variant="primary" fullWidth onClick={() => onSubmit(task.id)}>
          提交给心理老师
        </UiButton>
      </div>
    </>
  );
}

function ClueReport({ role, tasks, showToast }: { role: Role; tasks: WarningTask[]; showToast: (message: string) => void }) {
  if (!rolePermissions[role.id].canSubmitClue) {
    return (
      <section className="content">
        <PermissionBlock title="当前角色不可上报个体线索" text="校级管理者和年级主任只查看聚合或脱敏进度，不提交学生个体心理线索。" />
      </section>
    );
  }

  const counselorMode = role.id === 'counselor';

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="compact-summary">
          <div>
            <p className="eyebrow">{counselorMode ? '专业记录' : '线索回流'}</p>
            <h2>{counselorMode ? '新增专业记录' : '上报协作线索'}</h2>
            <p>{counselorMode ? '用于记录心理老师的专业处置动作，班主任和年级主任不可填写。' : '用于补充学生近期状态，提交后将由心理老师确认。'}</p>
          </div>
        </section>

        <section className="form-card">
          <FormField label={counselorMode ? '选择记录对象' : '选择学生'}>
            <select defaultValue={tasks[0] ? `${tasks[0].student} · ${tasks[0].className}` : ''}>
              {tasks.map((task) => (
                <option key={task.id}>
                  {task.student} · {task.className}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="发生时间 / 场景">
            <div className="two-col">
              <input defaultValue="今天 09:40" />
              <input defaultValue="课间 / 走廊" />
            </div>
          </FormField>
          <FormField label={counselorMode ? '记录类型' : '线索类型'}>
            <SelectableChips
              items={counselorMode ? ['反馈确认', '干预记录', '复测安排', '持续关注', '转介沟通', '解除关注'] : ['情绪异常', '行为变化', '人际冲突', '出勤异常', '家庭事件', '其他']}
              defaults={counselorMode ? ['干预记录'] : ['行为变化']}
            />
          </FormField>
          <FormField label={counselorMode ? '处置阶段' : '紧急程度'}>
            <SelectableChips items={counselorMode ? ['跟进中', '复测待安排', '持续关注', '转介中', '已闭环'] : ['一般', '需要关注', '尽快确认', '紧急']} defaults={counselorMode ? ['跟进中'] : ['需要关注']} className="urgency" />
          </FormField>
          <FormField label={counselorMode ? '专业记录摘要' : '观察描述'}>
            <textarea
              defaultValue={counselorMode ? '已结合班主任反馈完成一次简短访谈，后续进入持续关注并安排复测。' : '学生连续两天课间独处，今天主动回避同伴邀请，暂未发现冲突升级。'}
              placeholder={counselorMode ? '请记录专业处置摘要，完整档案仍以管理端为准。' : '请尽量记录可观察事实。'}
            />
          </FormField>
          <FormField label="是否已与学生沟通">
            <div className="option-list">
              <label>
                <input type="radio" name="talked" defaultChecked />
                已进行简短关心
              </label>
              <label>
                <input type="radio" name="talked" />
                尚未沟通
              </label>
            </div>
          </FormField>
        </section>

        <PermissionNotice role={role} />
      </section>
      <BottomActionBar
        actions={[
          { label: '保存草稿', tone: 'secondary', toast: counselorMode ? '专业记录草稿已保存' : '线索草稿已保存' },
          { label: counselorMode ? '保存专业记录' : '提交线索', tone: 'primary', toast: counselorMode ? '专业记录已保存' : '线索已提交给心理老师确认' },
        ]}
        showToast={showToast}
      />
    </>
  );
}

function ProgressDetail({
  task,
  role,
  onConfirmFeedback,
  showToast,
}: {
  task: WarningTask;
  role: Role;
  onConfirmFeedback: (taskId: string) => void;
  showToast: (message: string) => void;
}) {
  if (!rolePermissions[role.id].canEnterStudentDetail) {
    return <PrincipalDetailGuard />;
  }

  const displayName = role.id === 'gradeDirector' ? `${task.className} · 脱敏事项` : task.student;

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="detail-head">
          <div>
            <p className="eyebrow">
              {displayName} · {task.className}
            </p>
            <h2>{progressHeading(task, role)}</h2>
            <p>{progressDescription(role)}</p>
          </div>
        </section>

        <InfoSection title="闭环流程">
          <div className="stepper">
            {flowSteps.map((step, index) => (
              <div className={`step ${timelineHasAction(task, step, index, role) ? 'is-done' : ''}`} key={step}>
                <span>{index + 1}</span>
                <p>{step}</p>
              </div>
            ))}
          </div>
        </InfoSection>

        <InfoSection title={progressTimelineTitle(role)}>
          <DetailedTimeline task={task} role={role} />
        </InfoSection>

        <InfoSection title="已提交记录">
          {task.records.length ? task.records.map((record) => <SubmittedRecord key={`${record.by}-${record.time}-${record.tag}`} record={record} />) : <p className="muted-text">尚无记录提交，当前任务仍需责任人反馈。</p>}
        </InfoSection>

        {task.finalConclusion ? (
          <InfoSection title="心理老师最终处理结论" className="conclusion">
            <p>{role.id === 'gradeDirector' ? '本轮流程已闭环，个体敏感细节已隐藏。' : task.finalConclusion}</p>
          </InfoSection>
        ) : (
          <section className="section-block warning-box">该任务尚未闭环，不能仅以“已通知”作为完成依据。</section>
        )}

        <PermissionNotice role={role} />
      </section>
      <BottomActionBar actions={progressActions(task, role, onConfirmFeedback, showToast)} showToast={showToast} />
    </>
  );
}

function teacherFeedbackStatus(task: WarningTask) {
  if (task.status === '需补充') return '需补充观察反馈';
  if (task.records.length || task.statusKey !== 'waitingFeedback') return '已提交给心理老师';
  return '尚未提交';
}

function teacherConfirmationStatus(task: WarningTask) {
  if (task.statusKey === 'pendingCounselorConfirm') return '等待心理老师确认';
  if (task.statusKey === 'closed') return '已闭环';
  if (['active', 'continuousAttention', 'retestPending', 'referral'].includes(task.statusKey)) return '心理老师已确认';
  if (task.status === '需补充') return '等待补充后再次确认';
  return '待提交后确认';
}

function progressHeading(task: WarningTask, role: Role) {
  if (role.id === 'counselor') return `当前处置结果：${task.result}`;
  if (role.id === 'homeroomTeacher') return `我的反馈状态：${task.status}`;
  if (role.id === 'gradeDirector') return `本年级督办进度：${task.status}`;
  return '处置进度';
}

function progressDescription(role: Role) {
  if (role.id === 'counselor') return '从 AI 线索复核到协作反馈、干预确认、复测或转介的完整留痕。';
  if (role.id === 'homeroomTeacher') return '仅展示本人协作反馈、心理老师确认状态和必要结果摘要。';
  if (role.id === 'gradeDirector') return '仅展示本年级脱敏流程状态，用于判断是否需要督办。';
  return '校级角色不进入个体处置进度页。';
}

function progressTimelineTitle(role: Role) {
  if (role.id === 'counselor') return '完整处置时间线';
  if (role.id === 'homeroomTeacher') return '我的反馈时间线';
  if (role.id === 'gradeDirector') return '本年级脱敏时间线';
  return '处置时间线';
}

function SegmentedControl({ items, active, onChange }: { items: string[]; active: string; onChange: (item: string) => void }) {
  return (
    <div className="segmented">
      {items.map((item) => (
        <button className={item === active ? 'is-active' : ''} key={item} onClick={() => onChange(item)}>
          {item}
        </button>
      ))}
    </div>
  );
}

function PermissionNotice({ role }: { role: Role }) {
  const text: Record<RoleId, string> = {
    counselor: '心理老师可查看完整反馈、历史处置记录、专业判断提示和处置时间线，并负责确认反馈、复测、持续关注、转介或解除关注。',
    homeroomTeacher: '班主任仅查看自己被分配的观察任务，只提交事实观察；不展示 AI 原始判断、敏感题项、完整咨询记录，也不填写风险等级或干预结论。',
    gradeDirector: '年级主任仅查看本年级脱敏进度和督办状态，可提醒班主任反馈或补充信息，不填写心理记录，不直接督促专业判断。',
    principal: '校级管理者仅查看全校聚合数据和脱敏事项，可发起流程督办，不进入个体学生详情。',
  };
  return (
    <aside className="permission-notice">
      <Icon name="shieldCheck" size={20} />
      <div>
        <strong>隐私边界</strong>
        <p>{text[role.id]}</p>
      </div>
    </aside>
  );
}

function InfoSection({ title, className = '', children }: { title: string; className?: string; children: ReactNode }) {
  return (
    <section className={`section-block ${className}`}>
      <h3>{title}</h3>
      {children}
    </section>
  );
}

function Timeline({ task, role }: { task: WarningTask; role: Role }) {
  return (
    <ol className="timeline">
      {visibleTimeline(task, role).map((item) => (
        <li className="is-done" key={item.id}>
          <span></span>
          <div>
            <strong>{item.action}</strong>
            <p>
              {item.time} · {item.role} · {item.status}
            </p>
            <p>{item.note}</p>
          </div>
        </li>
      ))}
    </ol>
  );
}

function DetailedTimeline({ task, role }: { task: WarningTask; role: Role }) {
  return (
    <div className="detail-timeline">
      {visibleTimeline(task, role).map((item) => (
        <article key={item.id}>
          <div>
            <strong>{item.action}</strong>
            <span>{item.time}</span>
          </div>
          <dl>
            <div>
              <dt>责任角色</dt>
              <dd>{item.role}</dd>
            </div>
            <div>
              <dt>状态</dt>
              <dd>{item.status}</dd>
            </div>
          </dl>
          <p>{item.note}</p>
        </article>
      ))}
    </div>
  );
}

function SubmittedRecord({ record }: { record: WarningTask['records'][number] }) {
  return (
    <article className="record-item">
      <div>
        <strong>
          {record.by} · {record.role}
        </strong>
        <span>{record.time}</span>
      </div>
      <p>{record.text}</p>
      <small>{record.tag}</small>
    </article>
  );
}

function FormField({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="form-field">
      <span>{label}</span>
      {children}
    </label>
  );
}

function SelectableChips({ items, defaults, className = '' }: { items: string[]; defaults: string[]; className?: string }) {
  const [selected, setSelected] = useState(defaults);
  return (
    <div className={`chip-list selectable ${className}`}>
      {items.map((item) => (
        <button
          type="button"
          className={selected.includes(item) ? 'is-selected' : ''}
          aria-pressed={selected.includes(item)}
          key={item}
          onClick={(event) => {
            event.preventDefault();
            setSelected((current) => (current.includes(item) ? current.filter((value) => value !== item) : [...current, item]));
          }}
        >
          {item}
        </button>
      ))}
    </div>
  );
}

function ChipList({ items, compact = false }: { items: string[]; compact?: boolean }) {
  return (
    <div className={`chip-list ${compact ? 'is-compact' : ''}`}>
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function StatusBadge({ task }: { task: WarningTask }) {
  return <span className={`status-badge ${statusTone[task.statusKey]}`}>{task.status}</span>;
}

function HomeStatusBadge({ task, role }: { task: WarningTask; role: Role }) {
  if (task.statusKey === 'overdue') return <span className="status-badge overdue">逾期</span>;
  const label = homeStatusLabel(task, role);
  return <span className={`status-badge ${statusTone[task.statusKey]}`}>{label}</span>;
}

function AttentionLevelTag({ level, roleId }: { level: AttentionLevel; roleId?: RoleId }) {
  const key = level === '重点关注' ? 'high' : level === '持续关注' ? 'medium' : 'low';
  const teacherLabel: Record<AttentionLevel, string> = {
    重点关注: '协作优先级：高',
    持续关注: '协作优先级：中',
    一般关注: '协作优先级：常规',
  };
  return <span className={`attention-tag ${key}`}>{roleId === 'homeroomTeacher' ? teacherLabel[level] : level}</span>;
}

function BottomActionBar({ actions, showToast }: { actions: Action[]; showToast?: (message: string) => void }) {
  const navigate = (hash: string) => {
    window.location.hash = hash;
  };
  return (
    <nav className="bottom-action-bar">
      {actions.map((action) => (
        <button
          className={action.tone === 'primary' ? 'primary-btn' : 'secondary-btn'}
          disabled={action.disabled}
          key={action.label}
          onClick={() => {
            if (action.disabled) return;
            if (action.hash) navigate(action.hash);
            if (action.toast) showToast?.(action.toast);
            action.onClick?.();
          }}
        >
          {action.label}
        </button>
      ))}
    </nav>
  );
}

function ConfirmDialogLayer({
  dialog,
  tasks,
  onCancel,
  onSendSupplement,
  onSendDirectorReminder,
  onSendPrincipalAction,
}: {
  dialog: ConfirmDialog | null;
  tasks: WarningTask[];
  onCancel: () => void;
  onSendSupplement: (taskId: string) => void;
  onSendDirectorReminder: (taskId: string) => void;
  onSendPrincipalAction: (dialog: Extract<ConfirmDialog, { kind: 'principalAction' }>) => void;
}) {
  if (!dialog) return null;

  const task = 'taskId' in dialog ? tasks.find((item) => item.id === dialog.taskId) : undefined;
  const supplementReasons = ['观察时间不明确', '场景描述不足', '缺少近期行为变化', '需要补充家校沟通情况', '需要确认是否存在紧急变化'];
  const supplementText = '请补充近 3 天课堂、课间和家校沟通中的具体观察事实，避免主观判断。';
  const directorMessage = task
    ? `${task.owner}，您有一条学生观察反馈待办，请于今天 18:00 前进入心理健康小程序完成反馈。`
    : '您有一条学生观察反馈待办，请于今天 18:00 前进入心理健康小程序完成反馈。';
  const principalMessage = '陈老师，您有一条心理风险协作督办待处理，请进入心理健康小程序查看并推进相关事项。';

  return (
    <div className="modal-backdrop" role="presentation" onClick={onCancel}>
      <section className="confirm-sheet" role="dialog" aria-modal="true" onClick={(event) => event.stopPropagation()}>
        {dialog.kind === 'supplement' && task && (
          <>
            <div className="sheet-head">
              <span className="sheet-icon"><Icon name="send" size={20} /></span>
              <div>
                <p className="eyebrow">操作确认</p>
                <h2>请班主任补充反馈</h2>
              </div>
            </div>
            <FormField label="补充原因">
              <div className="confirm-list">
                {supplementReasons.map((reason, index) => (
                  <label key={reason}>
                    <input type="checkbox" defaultChecked={index < 3} />
                    {reason}
                  </label>
                ))}
              </div>
            </FormField>
            <FormField label="补充说明">
              <textarea defaultValue={supplementText} />
            </FormField>
            <div className="confirm-meta">
              <MetricLine label="补充时限" value="今天 18:00 前" />
              <MetricLine label="通知对象" value={`责任班主任：${task.owner}`} />
              <MetricLine label="通知方式" value="小程序待办 + 短信提醒" />
            </div>
            <div className="sheet-actions">
              <button className="secondary-btn" onClick={onCancel}>取消</button>
              <button className="primary-btn" onClick={() => onSendSupplement(dialog.taskId)}>发送补充请求</button>
            </div>
          </>
        )}

        {dialog.kind === 'directorReminder' && task && (
          <>
            <div className="sheet-head">
              <span className="sheet-icon"><Icon name="send" size={20} /></span>
              <div>
                <p className="eyebrow">督办确认</p>
                <h2>提醒班主任反馈</h2>
              </div>
            </div>
            <div className="confirm-meta">
              <MetricLine label="提醒对象" value={task.owner} />
              <MetricLine label="提醒事项" value={task.status === '需补充' ? '需补充观察反馈' : '观察反馈待提交'} />
              <MetricLine label="通知方式" value="小程序待办 + 短信提醒" />
            </div>
            <FormField label="消息内容预览">
              <textarea value={directorMessage} readOnly />
            </FormField>
            <p className="privacy-line">外部提醒只提示有待办，详情需进入小程序查看，不包含学生姓名、测评原文或具体心理风险原因。</p>
            <div className="sheet-actions">
              <button className="secondary-btn" onClick={onCancel}>取消</button>
              <button className="primary-btn" onClick={() => onSendDirectorReminder(dialog.taskId)}>发送提醒并留痕</button>
            </div>
          </>
        )}

        {dialog.kind === 'principalAction' && (
          <>
            <div className="sheet-head">
              <span className="sheet-icon"><Icon name="fileClock" size={20} /></span>
              <div>
                <p className="eyebrow">校级督办确认</p>
                <h2>{dialog.actionLabel}</h2>
              </div>
            </div>
            <div className="confirm-meta">
              <MetricLine label="处理对象" value={dialog.target} />
              <MetricLine label="事项摘要" value={`${dialog.subject}｜${dialog.progress}`} />
              <MetricLine label="通知方式" value="小程序待办 + 短信提醒" />
            </div>
            <FormField label="消息内容预览">
              <textarea value={principalMessage} readOnly />
            </FormField>
            <p className="privacy-line">校级督办只使用脱敏事项摘要，不展示学生姓名、咨询记录、敏感题项和 AI 原始判断。</p>
            <div className="sheet-actions">
              <button className="secondary-btn" onClick={onCancel}>取消</button>
              <button className="primary-btn" onClick={() => onSendPrincipalAction(dialog)}>确认发送</button>
            </div>
          </>
        )}
      </section>
    </div>
  );
}

function EmptyState() {
  return (
    <section className="empty-state">
      <h3>暂无待跟进任务</h3>
      <p>新的正式预警生成后，会在这里显示协作事项。</p>
    </section>
  );
}

function PermissionBlock({ title, text }: { title: string; text: string }) {
  return (
    <section className="empty-state">
      <h3>{title}</h3>
      <p>{text}</p>
    </section>
  );
}

function PrincipalDetailGuard() {
  return (
    <section className="content">
      <PermissionBlock title="校级视角不进入个体详情" text="请在校级全局视角查看聚合处置状态、闭环率、逾期风险和资源压力。" />
    </section>
  );
}

function MetricLine({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="metric-line">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function homeStatusDefinitions(role: Role): HomeStatusDefinition[] {
  if (role.id === 'homeroomTeacher') {
    return [
      { label: '待反馈', match: (task) => ['waitingFeedback', 'overdue'].includes(task.statusKey) },
      { label: '已提交', match: (task) => task.statusKey === 'pendingCounselorConfirm' },
      { label: '已完成', match: (task) => task.statusKey === 'closed' },
    ];
  }
  if (role.id === 'gradeDirector') {
    return [
      { label: '待反馈', match: (task) => task.statusKey === 'waitingFeedback' },
      { label: '已逾期', match: (task) => task.statusKey === 'overdue' },
      { label: '已跟进', match: (task) => ['pendingCounselorConfirm', 'active', 'continuousAttention', 'retestPending', 'referral', 'closed'].includes(task.statusKey) },
    ];
  }
  if (role.id === 'counselor') {
    return [
      { label: '待确认', match: (task) => task.statusKey === 'pendingCounselorConfirm' },
      { label: '处理中', match: (task) => !['pendingCounselorConfirm', 'closed'].includes(task.statusKey) },
      { label: '已闭环', match: (task) => task.statusKey === 'closed' },
    ];
  }
  return [];
}

function homeStatusLabel(task: WarningTask, role: Role) {
  if (role.id === 'homeroomTeacher' && task.status === '需补充') return '需补充';
  if (role.id === 'gradeDirector' && task.status === '需补充') return '需补充';
  if (role.id === 'gradeDirector' && task.statusKey === 'pendingCounselorConfirm') return '等待心理老师确认';
  return homeStatusDefinitions(role).find((item) => item.match(task))?.label ?? task.status;
}

function visibleTasksForRole(tasks: WarningTask[], role: Role) {
  if (role.id === 'counselor') return tasks;
  if (role.id === 'homeroomTeacher') return tasks.filter((task) => task.owner === role.teacherName);
  if (role.id === 'gradeDirector') return tasks.filter((task) => task.grade === role.grade);
  return [];
}

function visibleTimeline(task: WarningTask, role: Role) {
  if (role.id === 'counselor') return task.timeline;
  if (role.id === 'homeroomTeacher') return task.timeline.filter((item) => item.audience.includes('all') || item.audience.includes('teacher'));
  if (role.id === 'gradeDirector') return task.timeline.filter((item) => item.audience.includes('all') || item.audience.includes('director'));
  return [];
}

function taskPrimaryAction(task: WarningTask, role: Role, onOpenDirectorReminder?: (taskId: string) => void): Action {
  if (role.id === 'gradeDirector') {
    if (task.status === '需补充') return { label: '提醒补充信息', onClick: () => onOpenDirectorReminder?.(task.id), tone: 'primary' };
    if (['waitingFeedback', 'overdue'].includes(task.statusKey)) return { label: '提醒班主任反馈', onClick: () => onOpenDirectorReminder?.(task.id), tone: 'primary' };
    return { label: '等待心理老师确认', tone: 'primary', disabled: true, hidden: task.statusKey === 'closed' };
  }
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return { label: '确认反馈', hash: `#/task/${task.id}`, tone: 'primary' };
  }
  if (role.id === 'homeroomTeacher' && task.status === '需补充') return { label: '补充观察反馈', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (role.id === 'homeroomTeacher' && task.statusKey === 'waitingFeedback') return { label: '填写反馈', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (role.id === 'homeroomTeacher' && task.statusKey === 'overdue') return { label: '尽快反馈', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (role.id === 'homeroomTeacher') return { label: '查看任务', hash: `#/task/${task.id}`, tone: 'primary', hidden: true };
  return { label: '查看详情', hash: `#/task/${task.id}`, tone: 'primary' };
}

function counselorReviewActions(
  task: WarningTask,
  onConfirmFeedback: (taskId: string) => void,
  onReturnForSupplement: (taskId: string) => void,
  onArrangeRetest: (taskId: string) => void,
  onContinueAttention: (taskId: string) => void,
  onSuggestReferral: (taskId: string) => void,
  onCloseAttention: (taskId: string) => void,
): Action[] {
  if (task.statusKey === 'closed') {
    return [
      { label: '返回首页', hash: '#/', tone: 'secondary' },
      { label: '已闭环', tone: 'primary', toast: '本轮流程已闭环', disabled: true },
    ];
  }
  if (task.statusKey === 'pendingCounselorConfirm') {
    return [
      { label: '请班主任补充反馈', tone: 'secondary', onClick: () => onReturnForSupplement(task.id) },
      { label: '确认进入干预', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (task.statusKey === 'waitingFeedback' || task.statusKey === 'overdue') {
    return [
      { label: '返回首页', hash: '#/', tone: 'secondary' },
      { label: task.status === '需补充' || task.statusKey === 'overdue' ? '等待补充反馈' : '等待观察反馈', tone: 'primary', disabled: true },
    ];
  }
  return [
    { label: '安排复测', tone: 'secondary', onClick: () => onArrangeRetest(task.id) },
    { label: '持续关注', tone: 'secondary', onClick: () => onContinueAttention(task.id) },
    { label: '转介建议', tone: 'secondary', onClick: () => onSuggestReferral(task.id) },
    { label: '解除关注', tone: 'primary', onClick: () => onCloseAttention(task.id) },
  ];
}

function detailActions(
  task: WarningTask,
  role: Role,
  onConfirmFeedback: (taskId: string) => void,
  showToast: (message: string) => void,
  onOpenDirectorReminder?: (taskId: string) => void,
): Action[] {
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return [
      { label: '请班主任补充反馈', tone: 'secondary', toast: '请在反馈确认详情中发起补充' },
      { label: '确认进入干预', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (role.id === 'gradeDirector') {
    if (task.statusKey === 'pendingCounselorConfirm') {
      return [{ label: '等待心理老师确认', tone: 'primary', disabled: true }];
    }
    if (task.statusKey === 'closed') {
      return [{ label: '已完成', tone: 'primary', disabled: true }];
    }
    return [{ label: task.status === '需补充' ? '提醒补充信息' : '提醒班主任反馈', tone: 'primary', onClick: () => onOpenDirectorReminder?.(task.id) }];
  }
  if (role.id === 'homeroomTeacher' && ['waitingFeedback', 'overdue'].includes(task.statusKey)) {
    return [
      { label: '提交线索', hash: '#/report', tone: 'secondary' },
      { label: task.status === '需补充' ? '补充观察反馈' : task.statusKey === 'overdue' ? '尽快反馈' : '填写反馈', hash: `#/task/${task.id}/record`, tone: 'primary' },
    ];
  }
  return [
    { label: '返回首页', hash: '#/', tone: 'secondary' },
    { label: task.statusKey === 'closed' ? '已完成' : '查看任务', hash: `#/task/${task.id}`, tone: 'primary', disabled: task.statusKey === 'closed' },
  ];
}

function progressActions(task: WarningTask, role: Role, onConfirmFeedback: (taskId: string) => void, showToast: (message: string) => void): Action[] {
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return [
      { label: '返回详情', hash: `#/task/${task.id}`, tone: 'secondary' },
      { label: '确认进入干预', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (role.id === 'gradeDirector') {
    return [
      { label: '返回详情', hash: `#/task/${task.id}`, tone: 'secondary' },
      { label: '提醒班主任反馈', tone: 'primary', onClick: () => showToast('已模拟发送年级督办提醒') },
    ];
  }
  return [
    { label: '返回详情', hash: `#/task/${task.id}`, tone: 'secondary' },
    { label: task.result === '已闭环' ? '已闭环' : '查看下一步', tone: 'primary', toast: task.result === '已闭环' ? '本轮流程已闭环' : '已展示当前处置计划' },
  ];
}

function timelineHasAction(task: WarningTask, step: string, index: number, role: Role) {
  const visible = visibleTimeline(task, role);
  if (index === 0) return role.id === 'counselor' && visible.some((item) => item.action.includes('AI'));
  if (step.includes('班主任观察反馈')) return visible.some((item) => item.action.includes('班主任提交'));
  if (step.includes('心理老师确认反馈')) return visible.some((item) => item.action.includes('确认反馈'));
  if (step.includes('干预处理')) return ['continuousAttention', 'retestPending', 'referral', 'closed', 'active'].includes(task.statusKey);
  if (step.includes('复测')) return ['continuousAttention', 'retestPending', 'referral', 'closed'].includes(task.statusKey);
  return visible.length > index - (role.id === 'counselor' ? 0 : 1);
}
