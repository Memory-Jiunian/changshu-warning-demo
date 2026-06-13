import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
type Action = { label: string; hash?: string; tone: 'primary' | 'secondary'; toast?: string; onClick?: () => void; disabled?: boolean };

const filters = ['全部', '待观察反馈', '已反馈待确认', '跟进中', '持续关注', '复测待安排', '转介中', '已闭环', '逾期未更新'];

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

export function App() {
  const [roleId, setRoleId] = useState<RoleId>('homeroomTeacher');
  const [warningTasks, setWarningTasks] = useState<WarningTask[]>(initialTasks);
  const [filter, setFilter] = useState('全部');
  const [route, setRoute] = useState<Route>(getRoute());
  const [toast, setToast] = useState('');

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
    setFilter('全部');
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
    applyCounselorAction(taskId, '确认进入干预', '跟进中', 'active', '持续关注', '查看处置进度', '确认班主任反馈后进入干预跟进，由心理老师继续判断后续处置。');

  const returnForSupplement = (taskId: string) =>
    applyCounselorAction(taskId, '退回补充信息', '待观察反馈', 'waitingFeedback', '持续关注', '补充观察反馈', '反馈信息不足，退回班主任补充事实观察，不形成专业结论。');

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
          navigate={navigate}
          showToast={showToast}
        />
      )}
      {guardedRoute.name === 'task' && (
        <TaskDetail
          role={role}
          task={task}
          onConfirmFeedback={confirmFeedback}
          onReturnForSupplement={returnForSupplement}
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
      {guardedRoute.name === 'schoolOverview' && <SchoolOverview role={role} roleId={roleId} setRoleId={changeRole} showToast={showToast} />}
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
          ‹
        </button>
        <div>
          <p className="eyebrow">{role.org}</p>
          <h1>{routeTitle(route.name, role)}</h1>
        </div>
        {canReport ? (
          <button className="icon-button" onClick={() => navigate('#/report')} aria-label={role.id === 'counselor' ? '新增专业记录' : '上报协作线索'}>
            +
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
    if (role.id === 'counselor') return '线索复核';
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
  navigate,
  showToast,
}: {
  role: Role;
  roleId: RoleId;
  tasks: WarningTask[];
  filter: string;
  setFilter: (filter: string) => void;
  setRoleId: (roleId: RoleId) => void;
  navigate: (hash: string) => void;
  showToast: (message: string) => void;
}) {
  const scopedTasks = visibleTasksForRole(tasks, role);
  const visibleTasks = filter === '全部' ? scopedTasks : scopedTasks.filter((task) => task.status === filter);
  const stats = useMemo(
    () => [
      ['待观察反馈', scopedTasks.filter((task) => task.statusKey === 'waitingFeedback').length],
      ['逾期未更新', scopedTasks.filter((task) => task.statusKey === 'overdue').length],
      ['已反馈待确认', scopedTasks.filter((task) => task.statusKey === 'pendingCounselorConfirm').length],
      ['已闭环', scopedTasks.filter((task) => task.statusKey === 'closed').length],
    ],
    [scopedTasks],
  );
  const openTasks = stats[0][1] + stats[1][1] + stats[2][1];

  return (
    <section className="content">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">正式预警后的协作跟进</p>
          <h2>{dashboardTitle(role, openTasks)}</h2>
          <p>{role.scope}</p>
        </div>
        <RoleSwitcher roleId={roleId} setRoleId={setRoleId} />
        <button className="text-link" onClick={() => navigate('#/school-overview')}>
          查看校级全局视角
        </button>
      </section>

      <section className="stats-grid" aria-label="任务概览">
        {stats.map(([label, value]) => (
          <button className="stat-card" key={label} onClick={() => setFilter(String(label))}>
            <strong>{value}</strong>
            <span>{label}</span>
          </button>
        ))}
      </section>

      <PermissionNotice role={role} />
      <SegmentedControl items={filters} active={filter} onChange={setFilter} />

      <section className="task-list">
        {visibleTasks.length ? (
          visibleTasks.map((task) => <TaskCard key={task.id} task={task} role={role} navigate={navigate} showToast={showToast} />)
        ) : (
          <EmptyState />
        )}
      </section>
    </section>
  );
}

function dashboardTitle(role: Role, openTasks: number) {
  if (role.id === 'homeroomTeacher') return `有 ${openTasks} 项观察任务待处理`;
  if (role.id === 'gradeDirector') return `本年级有 ${openTasks} 项需督办`;
  if (role.id === 'counselor') return `有 ${openTasks} 项反馈或线索需复核`;
  return `今日有 ${openTasks} 项需要关注`;
}

function SchoolOverview({
  role,
  roleId,
  setRoleId,
  showToast,
}: {
  role: Role;
  roleId: RoleId;
  setRoleId: (roleId: RoleId) => void;
  showToast: (message: string) => void;
}) {
  const cards = [
    ['本周新增正式预警', schoolOverview.weekNewWarnings],
    ['当前跟进中', schoolOverview.activeCount],
    ['逾期未更新', schoolOverview.overdueCount],
    ['已闭环', schoolOverview.closedCount],
    ['闭环率', schoolOverview.closureRate],
  ];

  return (
    <section className="content">
      <section className="hero-panel">
        <div>
          <p className="eyebrow">全校预警处置概览</p>
          <h2>看流程压力，不看学生隐私</h2>
          <p>{role.scope}</p>
        </div>
        <RoleSwitcher roleId={roleId} setRoleId={setRoleId} />
      </section>

      <section className="overview-grid">
        {cards.map(([label, value]) => (
          <article className="overview-card" key={label}>
            <strong>{value}</strong>
            <span>{label}</span>
          </article>
        ))}
      </section>

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
          <MetricLine label="班主任待反馈" value={`${schoolOverview.teacherPending} 项`} />
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

      <InfoSection title="需校级关注事项">
        <div className="attention-list">
          {schoolOverview.attentionItems.map((item) => (
            <button className="attention-item" key={`${item.grade}-${item.issue}`} onClick={() => showToast('已打开脱敏事项说明')}>
              <strong>{item.grade}</strong>
              <span>{item.issue}</span>
              <small>{item.suggestion}</small>
            </button>
          ))}
        </div>
        <div className="card-actions">
          <button className="primary-btn" onClick={() => showToast('已模拟发起流程督办')}>
            发起流程督办
          </button>
          <button className="secondary-btn" onClick={() => showToast('已模拟提醒年级负责人')}>
            提醒年级负责人
          </button>
        </div>
        <button className="text-link" onClick={() => showToast('资源压力说明：仅展示聚合排队和教师负荷，不展示个体学生信息。')}>
          查看资源压力说明
        </button>
      </InfoSection>

      <aside className="permission-notice">
        <strong>隐私边界</strong>
        <p>校级视角仅展示聚合处置状态与脱敏事项，用于资源调配与流程督办；不展示学生姓名、班级、测评原文、咨询记录、敏感题项和 AI 原始判断。</p>
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

function TaskCard({
  task,
  role,
  navigate,
  showToast,
}: {
  task: WarningTask;
  role: Role;
  navigate: (hash: string) => void;
  showToast: (message: string) => void;
}) {
  const action = taskPrimaryAction(task, role);
  const displayName = role.id === 'gradeDirector' ? `${task.className} · 脱敏事项` : task.student;
  const summaryLabel = role.id === 'gradeDirector' ? '查看督办详情' : role.id === 'homeroomTeacher' ? '查看观察任务' : '查看复核详情';

  return (
    <article className="task-card">
      <div className="card-head">
        <div>
          <div className="title-row">
            <h3>{displayName}</h3>
            <AttentionLevelTag level={task.attention} roleId={role.id} />
          </div>
          <p>
            {role.id === 'homeroomTeacher' ? '观察任务' : role.id === 'gradeDirector' ? '本年级协作进度' : task.type}
          </p>
        </div>
        <StatusBadge task={task} />
      </div>
      <dl className="meta-grid">
        <div>
          <dt>责任人</dt>
          <dd>{role.id === 'counselor' ? `${task.owner} / ${task.counselor}` : task.owner}</dd>
        </div>
        <div>
          <dt>截止</dt>
          <dd className={task.statusKey === 'overdue' ? 'danger-text' : ''}>{task.deadline}</dd>
        </div>
      </dl>
      <p className="next-action">{task.nextAction}</p>
      <div className="card-actions">
        <button className="secondary-btn" onClick={() => navigate(`#/task/${task.id}`)}>
          {summaryLabel}
        </button>
        <button
          className="primary-btn"
          onClick={() => {
            if (action.hash) navigate(action.hash);
            if (action.toast) showToast(action.toast);
          }}
        >
          {action.label}
        </button>
      </div>
    </article>
  );
}

function TaskDetail({
  role,
  task,
  onConfirmFeedback,
  onReturnForSupplement,
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

          <InfoSection title="历史处置记录">
            <Timeline task={task} role={role} />
          </InfoSection>

          <InfoSection title="专业判断边界" className="warning-box">
            <p>当前内容来自班主任观察反馈，仅作为协作线索。是否进入干预流程，需由心理老师结合访谈、测评和既有记录判断。</p>
          </InfoSection>

          <InfoSection title="处置进度">
            <p>处置进度作为次级入口，用于查看完整闭环时间线，不替代本页的反馈确认操作。</p>
            <button className="text-link" onClick={() => (window.location.hash = `#/task/${task.id}/progress`)}>
              查看处置进度
            </button>
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
        <BottomActionBar actions={detailActions(task, role, onConfirmFeedback, showToast)} showToast={showToast} />
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

        <InfoSection title="协作流程">
          <Timeline task={task} role={role} />
        </InfoSection>

        <InfoSection title="已提交反馈">
          {task.records.length ? task.records.map((record) => <SubmittedRecord key={`${record.by}-${record.time}-${record.tag}`} record={record} />) : <p className="muted-text">暂无观察反馈，等待责任人提交首次反馈。</p>}
        </InfoSection>
      </section>
      <BottomActionBar actions={detailActions(task, role, onConfirmFeedback, showToast)} showToast={showToast} />
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
        <section className="compact-summary">
          <div>
            <p className="eyebrow">观察任务</p>
            <h2>
              {task.student} · {task.className}
            </h2>
            <p>提交后由 {task.counselor} 确认，本页只记录事实观察，不填写专业判断或处置结论。</p>
          </div>
          <StatusBadge task={task} />
        </section>

        <section className="form-card">
          <FormField label="观察时间段">
            <input defaultValue="今天上午 08:00-12:00" />
          </FormField>
          <FormField label="观察场景">
            <SelectableChips items={['课堂', '课间', '午休', '放学后', '家校沟通', '其他']} defaults={['课堂', '课间']} />
          </FormField>
          <FormField label="异常表现">
            <SelectableChips items={['课堂回应减少', '出勤变化', '同伴互动减少', '情绪波动', '独处增多', '暂未发现明显异常']} defaults={['课堂回应减少', '独处增多']} />
          </FormField>
          <FormField label="发生频率">
            <select defaultValue="近两天偶发">
              <option>单次出现</option>
              <option>近两天偶发</option>
              <option>连续多日出现</option>
              <option>频率暂不明确</option>
            </select>
          </FormField>
          <FormField label="影响程度">
            <select defaultValue="轻度影响课堂参与">
              <option>暂未影响日常学习</option>
              <option>轻度影响课堂参与</option>
              <option>影响出勤或同伴互动</option>
              <option>需要心理老师尽快查看</option>
            </select>
          </FormField>
          <FormField label="已采取措施">
            <SelectableChips items={['日常关心', '简短沟通', '联系家长', '调整座位/任务', '暂未处理']} defaults={['日常关心']} />
          </FormField>
          <FormField label="事实描述">
            <textarea defaultValue="今天上午课堂状态较安静，课间多独处；课后能回应简单关心，暂未发现明显冲突升级。" placeholder="请描述你观察到的具体事实，避免主观判断、标签化和诊断性表达。" />
          </FormField>
          <FormField label="是否需要心理老师尽快查看">
            <div className="option-list">
              {['是，建议尽快查看', '否，按常规节奏确认'].map((item, index) => (
                <label key={item}>
                  <input type="radio" name="urgentReview" defaultChecked={index === 0} />
                  {item}
                </label>
              ))}
            </div>
          </FormField>
        </section>

        <PermissionNotice role={role} />
      </section>
      <BottomActionBar
        actions={[
          { label: '保存草稿', tone: 'secondary', toast: '记录已暂存' },
          { label: '提交给心理老师', tone: 'primary', onClick: () => onSubmit(task.id) },
        ]}
        showToast={showToast}
      />
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
      <strong>隐私边界</strong>
      <p>{text[role.id]}</p>
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
          className={selected.includes(item) ? 'is-selected' : ''}
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

function ChipList({ items }: { items: string[] }) {
  return (
    <div className="chip-list">
      {items.map((item) => (
        <span key={item}>{item}</span>
      ))}
    </div>
  );
}

function StatusBadge({ task }: { task: WarningTask }) {
  return <span className={`status-badge ${statusTone[task.statusKey]}`}>{task.status}</span>;
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

function taskPrimaryAction(task: WarningTask, role: Role): Action {
  if (role.id === 'gradeDirector') {
    if (task.statusKey === 'overdue') return { label: '提醒班主任反馈', toast: '已模拟提醒班主任反馈', tone: 'primary' };
    if (task.statusKey === 'pendingCounselorConfirm') return { label: '查看本年级进度', hash: `#/task/${task.id}`, tone: 'primary' };
    return { label: '查看本年级进度', hash: `#/task/${task.id}`, tone: 'primary' };
  }
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return { label: '确认反馈', hash: `#/task/${task.id}`, tone: 'primary' };
  }
  if (role.id === 'homeroomTeacher' && task.statusKey === 'waitingFeedback') return { label: '填写观察反馈', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (role.id === 'homeroomTeacher' && task.statusKey === 'overdue') return { label: '尽快反馈', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (task.statusKey === 'pendingCounselorConfirm') return { label: '查看已提交反馈', hash: `#/task/${task.id}`, tone: 'primary' };
  if (task.statusKey === 'continuousAttention') return { label: '查看关注计划', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  if (task.statusKey === 'retestPending') return { label: '查看复测计划', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  if (task.statusKey === 'referral') return { label: '查看转介进度', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  if (task.statusKey === 'closed') return { label: '查看闭环详情', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  return { label: task.statusKey === 'active' ? '查看处置进度' : '查看进度', hash: `#/task/${task.id}/progress`, tone: 'primary' };
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
      { label: '查看处置进度', hash: `#/task/${task.id}/progress`, tone: 'secondary' },
      { label: '已闭环', tone: 'primary', toast: '本轮流程已闭环', disabled: true },
    ];
  }
  if (task.statusKey === 'pendingCounselorConfirm') {
    return [
      { label: '退回补充信息', tone: 'secondary', onClick: () => onReturnForSupplement(task.id) },
      { label: '确认进入干预', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (task.statusKey === 'waitingFeedback' || task.statusKey === 'overdue') {
    return [
      { label: '查看处置进度', hash: `#/task/${task.id}/progress`, tone: 'secondary' },
      { label: task.statusKey === 'overdue' ? '等待补充反馈' : '等待观察反馈', tone: 'primary', disabled: true },
    ];
  }
  return [
    { label: '安排复测', tone: 'secondary', onClick: () => onArrangeRetest(task.id) },
    { label: '持续关注', tone: 'secondary', onClick: () => onContinueAttention(task.id) },
    { label: '转介建议', tone: 'secondary', onClick: () => onSuggestReferral(task.id) },
    { label: '解除关注', tone: 'primary', onClick: () => onCloseAttention(task.id) },
  ];
}

function detailActions(task: WarningTask, role: Role, onConfirmFeedback: (taskId: string) => void, showToast: (message: string) => void): Action[] {
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return [
      { label: '查看进度', hash: `#/task/${task.id}/progress`, tone: 'secondary' },
      { label: '确认进入干预', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (role.id === 'gradeDirector') {
    return [
      { label: task.statusKey === 'pendingCounselorConfirm' ? '提醒补充信息' : '查看本年级进度', hash: `#/task/${task.id}/progress`, tone: 'secondary' },
      { label: task.statusKey === 'overdue' ? '提醒班主任反馈' : '提醒补充信息', tone: 'primary', onClick: () => showToast('已模拟发送年级督办提醒') },
    ];
  }
  if (role.id === 'homeroomTeacher' && ['waitingFeedback', 'overdue'].includes(task.statusKey)) {
    return [
      { label: '提交线索', hash: '#/report', tone: 'secondary' },
      { label: task.statusKey === 'overdue' ? '尽快反馈' : '填写观察反馈', hash: `#/task/${task.id}/record`, tone: 'primary' },
    ];
  }
  return [
    { label: '返回首页', hash: '#/', tone: 'secondary' },
    { label: taskPrimaryAction(task, role).label, hash: `#/task/${task.id}/progress`, tone: 'primary' },
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
