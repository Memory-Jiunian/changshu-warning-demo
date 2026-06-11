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

const filters = ['全部', '待反馈', '逾期', '待心理老师确认', '跟进中', '已闭环'];

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
          text: '已提交本次观察反馈：学生今日课堂回应稳定，建议心理老师确认下一步处置。',
          tag: '待心理老师确认',
        };
        const timeline: HandlingTimelineItem = {
          id: `feedback-${Date.now()}`,
          time: now,
          role: '班主任',
          action: '班主任提交观察反馈',
          status: '待心理老师确认',
          note: '协作反馈已提交，任务状态同步更新为待心理老师确认。',
          audience: ['all'],
        };
        return {
          ...item,
          status: '待心理老师确认',
          statusKey: 'pendingCounselorConfirm',
          nextAction: '等待心理老师确认',
          records: [...item.records, record],
          timeline: [...item.timeline, timeline],
        };
      }),
    );
    showToast('跟进记录已提交，等待心理老师确认');
    navigate(`#/task/${taskId}`);
  };

  const confirmFeedback = (taskId: string) => {
    setWarningTasks((current) =>
      current.map((item) => {
        if (item.id !== taskId) return item;
        const nextStatus = item.attention === '重点关注' ? '持续关注' : '跟进中';
        const nextStatusKey: StatusKey = item.attention === '重点关注' ? 'continuousAttention' : 'active';
        const timeline: HandlingTimelineItem = {
          id: `confirm-${Date.now()}`,
          time: '刚刚',
          role: '心理老师',
          action: '心理老师确认反馈',
          status: nextStatus,
          note: item.attention === '重点关注' ? '确认反馈后进入持续关注，并准备后续干预计划。' : '确认反馈后继续跟进观察。',
          audience: ['all'],
        };
        return {
          ...item,
          status: nextStatus,
          statusKey: nextStatusKey,
          result: item.attention === '重点关注' ? '持续关注' : '持续关注',
          nextAction: item.attention === '重点关注' ? '查看关注计划' : '查看进度',
          timeline: [...item.timeline, timeline],
          records: item.records.map((record) => (record.tag === '待心理老师确认' ? { ...record, tag: '心理老师已确认' } : record)),
        };
      }),
    );
    showToast('心理老师已确认反馈，任务进入后续处置');
  };

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
      {guardedRoute.name === 'task' && <TaskDetail role={role} task={task} onConfirmFeedback={confirmFeedback} showToast={showToast} />}
      {guardedRoute.name === 'record' && <FollowUpRecord task={task} role={role} onSubmit={submitFollowUp} showToast={showToast} />}
      {guardedRoute.name === 'report' && <ClueReport role={role} tasks={visibleTasksForRole(warningTasks, role)} showToast={showToast} />}
      {guardedRoute.name === 'progress' && <ProgressDetail task={task} role={role} onConfirmFeedback={confirmFeedback} showToast={showToast} />}
      {guardedRoute.name === 'schoolOverview' && <SchoolOverview role={role} roleId={roleId} setRoleId={changeRole} />}
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
          <h1>{routeTitle(route.name)}</h1>
        </div>
        {canReport ? (
          <button className="icon-button" onClick={() => navigate('#/report')} aria-label="上报线索">
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

function routeTitle(routeName: RouteName) {
  const titles: Record<RouteName, string> = {
    home: '预警协同',
    task: '预警任务',
    record: '跟进记录',
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
      ['待反馈', scopedTasks.filter((task) => task.statusKey === 'waitingFeedback').length],
      ['逾期', scopedTasks.filter((task) => task.statusKey === 'overdue').length],
      ['待确认', scopedTasks.filter((task) => task.statusKey === 'pendingCounselorConfirm').length],
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
          <h2>今日有 {openTasks} 项需要关注</h2>
          <p>{role.scope}</p>
        </div>
        <RoleSwitcher roleId={roleId} setRoleId={setRoleId} />
        <button className="text-link" onClick={() => navigate('#/school-overview')}>
          查看校级全局视角
        </button>
      </section>

      <section className="stats-grid" aria-label="任务概览">
        {stats.map(([label, value]) => (
          <button className="stat-card" key={label} onClick={() => setFilter(label === '待确认' ? '待心理老师确认' : String(label))}>
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

function SchoolOverview({ role, roleId, setRoleId }: { role: Role; roleId: RoleId; setRoleId: (roleId: RoleId) => void }) {
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

      <aside className="permission-notice">
        <strong>隐私边界</strong>
        <p>校级视角仅展示聚合处置状态，用于资源调配与流程督办；不展示学生测评原文、咨询记录、敏感题项和 AI 原始判断。</p>
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
  const displayName = role.id === 'gradeDirector' ? task.maskedStudent : task.student;

  return (
    <article className="task-card">
      <div className="card-head">
        <div>
          <div className="title-row">
            <h3>{displayName}</h3>
            <AttentionLevelTag level={task.attention} />
          </div>
          <p>
            {task.className} · {task.type}
          </p>
        </div>
        <StatusBadge task={task} />
      </div>
      <dl className="meta-grid">
        <div>
          <dt>责任人</dt>
          <dd>{task.owner}</dd>
        </div>
        <div>
          <dt>截止</dt>
          <dd className={task.statusKey === 'overdue' ? 'danger-text' : ''}>{task.deadline}</dd>
        </div>
      </dl>
      <p className="next-action">{task.nextAction}</p>
      <div className="card-actions">
        <button className="secondary-btn" onClick={() => navigate(`#/task/${task.id}`)}>
          查看摘要
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
  showToast,
}: {
  role: Role;
  task: WarningTask;
  onConfirmFeedback: (taskId: string) => void;
  showToast: (message: string) => void;
}) {
  const permissions = rolePermissions[role.id];
  const directorView = role.id === 'gradeDirector';
  const displayName = directorView ? task.maskedStudent : task.student;

  if (!permissions.canEnterStudentDetail) {
    return <PrincipalDetailGuard />;
  }

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="detail-head">
          <div>
            <AttentionLevelTag level={task.attention} />
            <h2>
              {displayName} · {task.className}
            </h2>
            <p>
              状态：{task.status} · 当前结果：{task.result}
            </p>
          </div>
          <StatusBadge task={task} />
        </section>

        <PermissionNotice role={role} />

        <InfoSection title="正式预警边界">
          <p>{permissions.canViewAiClueSummary ? task.aiClueSummary : task.desensitizedFlow}</p>
          <p className="privacy-line">{task.restricted}</p>
        </InfoSection>

        <InfoSection title={directorView ? '本年级脱敏进度' : '协作要求'}>
          {directorView ? (
            <div className="info-list">
              <div>
                <span>责任班主任</span>
                <strong>{task.owner}</strong>
              </div>
              <div>
                <span>心理老师</span>
                <strong>{task.counselor}</strong>
              </div>
              <div>
                <span>下一步</span>
                <strong>{task.nextAction}</strong>
              </div>
            </div>
          ) : (
            <>
              <ChipList items={task.focus} />
              <p>{task.suggestion}</p>
              <div className="warning-box">请勿在班级群、公开场合讨论学生心理状态。当前信息不是诊断结论。</div>
            </>
          )}
        </InfoSection>

        {permissions.canViewInterventionDetail && (
          <InfoSection title="心理老师处置视角">
            <p>可查看正式预警摘要、协作反馈、干预进度，并确认反馈后推进复测、持续关注、解除关注或转介。</p>
          </InfoSection>
        )}

        <InfoSection title="处置时间线">
          <Timeline task={task} role={role} />
        </InfoSection>

        <InfoSection title="已提交反馈">
          {task.records.length ? task.records.map((record) => <SubmittedRecord key={`${record.by}-${record.time}-${record.tag}`} record={record} />) : <p className="muted-text">暂无跟进记录，等待责任人提交首次反馈。</p>}
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
        <PermissionBlock title="当前角色或状态不可填写跟进记录" text="已闭环、待心理老师确认或非班主任角色不能继续提交普通跟进记录。" />
      </section>
    );
  }

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="compact-summary">
          <div>
            <p className="eyebrow">{task.type}</p>
            <h2>
              {task.student} · {task.className}
            </h2>
            <p>提交后由 {task.counselor} 确认，本页不填写测评分数或敏感题项。</p>
          </div>
          <StatusBadge task={task} />
        </section>

        <section className="form-card">
          <FormField label="跟进方式">
            <SelectableChips items={['日常观察', '简短沟通', '家校沟通', '面谈', '其他']} defaults={['日常观察']} />
          </FormField>
          <FormField label="观察标签">
            <SelectableChips items={['情绪状态', '出勤变化', '同伴关系', '课堂表现', '家庭沟通', '其他']} defaults={['情绪状态', '出勤变化']} />
          </FormField>
          <FormField label="记录正文">
            <textarea defaultValue="今天上午课堂状态较安静，课后能回应简单关心，未发现明显冲突。" placeholder="请描述你观察到的具体变化，避免主观判断和标签化表达。" />
          </FormField>
          <FormField label="是否发现新风险">
            <div className="option-list">
              {['无', '有轻微变化', '需要心理老师介入', '紧急'].map((item, index) => (
                <label key={item}>
                  <input type="radio" name="risk" defaultChecked={index === 1} />
                  {item}
                </label>
              ))}
            </div>
          </FormField>
          <FormField label="下一步建议">
            <SelectableChips items={['继续观察', '转心理老师确认', '安排复测', '暂无']} defaults={['转心理老师确认']} />
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

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="compact-summary">
          <div>
            <p className="eyebrow">线索回流</p>
            <h2>上报协作线索</h2>
            <p>用于补充学生近期状态，提交后将由心理老师确认。</p>
          </div>
        </section>

        <section className="form-card">
          <FormField label="选择学生">
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
          <FormField label="线索类型">
            <SelectableChips items={['情绪异常', '行为变化', '人际冲突', '出勤异常', '家庭事件', '其他']} defaults={['行为变化']} />
          </FormField>
          <FormField label="紧急程度">
            <SelectableChips items={['一般', '需要关注', '尽快确认', '紧急']} defaults={['需要关注']} className="urgency" />
          </FormField>
          <FormField label="观察描述">
            <textarea defaultValue="学生连续两天课间独处，今天主动回避同伴邀请，暂未发现冲突升级。" placeholder="请尽量记录可观察事实。" />
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
          { label: '保存草稿', tone: 'secondary', toast: '线索草稿已保存' },
          { label: '提交线索', tone: 'primary', toast: '线索已提交给心理老师确认' },
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

  const displayName = role.id === 'gradeDirector' ? task.maskedStudent : task.student;

  return (
    <>
      <section className="content with-bottom-bar">
        <section className="detail-head">
          <div>
            <p className="eyebrow">
              {displayName} · {task.className}
            </p>
            <h2>当前处置结果：{task.result}</h2>
            <p>从 AI 线索复核到协作反馈、干预确认、复测或转介的完整留痕。</p>
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

        <InfoSection title="完整处置时间线">
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
    counselor: '心理老师可查看正式预警摘要、协作记录、干预进度与闭环详情；专业档案仍以管理端沉淀为准。',
    homeroomTeacher: '班主任仅查看分配给自己的协作任务，不展示原始测评结果、敏感题项和 AI 原始判断。',
    gradeDirector: '年级主任仅查看本年级脱敏进度、逾期和待确认状态，不填写心理跟进记录。',
    principal: '校级管理者仅查看全校聚合数据、闭环率、逾期风险和资源压力，不进入个体学生详情。',
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

function AttentionLevelTag({ level }: { level: AttentionLevel }) {
  const key = level === '重点关注' ? 'high' : level === '持续关注' ? 'medium' : 'low';
  return <span className={`attention-tag ${key}`}>{level}</span>;
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
    if (task.statusKey === 'overdue') return { label: '督促处理', toast: '已模拟发送督办提醒', tone: 'primary' };
    return { label: '查看进度', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  }
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return { label: '待确认反馈', hash: `#/task/${task.id}`, tone: 'primary' };
  }
  if (role.id === 'homeroomTeacher' && task.statusKey === 'waitingFeedback') return { label: '记录跟进', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (role.id === 'homeroomTeacher' && task.statusKey === 'overdue') return { label: '尽快反馈', hash: `#/task/${task.id}/record`, tone: 'primary' };
  if (task.statusKey === 'pendingCounselorConfirm') return { label: '查看已提交反馈', hash: `#/task/${task.id}`, tone: 'primary' };
  if (task.statusKey === 'continuousAttention') return { label: '查看关注计划', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  if (task.statusKey === 'retestPending') return { label: '查看复测计划', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  if (task.statusKey === 'referral') return { label: '查看转介进度', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  if (task.statusKey === 'closed') return { label: '查看闭环详情', hash: `#/task/${task.id}/progress`, tone: 'primary' };
  return { label: '查看进度', hash: `#/task/${task.id}/progress`, tone: 'primary' };
}

function detailActions(task: WarningTask, role: Role, onConfirmFeedback: (taskId: string) => void, showToast: (message: string) => void): Action[] {
  if (role.id === 'counselor' && task.statusKey === 'pendingCounselorConfirm') {
    return [
      { label: '查看进度', hash: `#/task/${task.id}/progress`, tone: 'secondary' },
      { label: '确认反馈', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (role.id === 'gradeDirector') {
    return [
      { label: '查看进度', hash: `#/task/${task.id}/progress`, tone: 'secondary' },
      { label: '督促责任人', tone: 'primary', onClick: () => showToast('已模拟发送督办提醒') },
    ];
  }
  if (role.id === 'homeroomTeacher' && ['waitingFeedback', 'overdue'].includes(task.statusKey)) {
    return [
      { label: '提交线索', hash: '#/report', tone: 'secondary' },
      { label: task.statusKey === 'overdue' ? '尽快反馈' : '记录跟进', hash: `#/task/${task.id}/record`, tone: 'primary' },
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
      { label: '确认反馈', tone: 'primary', onClick: () => onConfirmFeedback(task.id) },
    ];
  }
  if (role.id === 'gradeDirector') {
    return [
      { label: '返回详情', hash: `#/task/${task.id}`, tone: 'secondary' },
      { label: '督促责任人', tone: 'primary', onClick: () => showToast('已模拟发送督办提醒') },
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
