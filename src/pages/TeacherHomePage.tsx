import { HomeTaskCard } from '../components/business/HomeTaskCard';
import { RoleHeader } from '../components/layout/RoleHeader';
import { AppIcon } from '../components/ui/AppIcon';
import {
  getRecentTeacherTasks,
  getTeacherClassLabel,
  getTodayRetestItems,
} from '../selectors/homeSelectors';
import { getRetestReminderStatusLabel } from '../selectors/retestSelectors';
import { useDemo } from '../state/DemoProvider';

function formatRetestTime(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));
}

export function TeacherHomePage({
  onNavigate,
}: {
  onNavigate: (hash: string) => void;
}) {
  const {
    currentUser,
    tasks,
    retestSchedules,
    now,
    pendingCount,
    overdueCount,
    todayReminderCount,
  } = useDemo();
  const demoNow = new Date(now);
  const recentTasks = getRecentTeacherTasks(tasks, demoNow);
  const retestItems = getTodayRetestItems(tasks, retestSchedules, demoNow);

  const scrollToRetest = () => {
    document.getElementById('today-retest')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mvp-page mvp-v2-page mvp-v2-home-page">
      <RoleHeader
        user={currentUser}
        scopeLabel={getTeacherClassLabel(currentUser, tasks)}
        compact
      />

      {overdueCount > 0 ? (
        <div className="mvp-v21-action-notice" role="status">
          <AppIcon name="alert" size={17} />
          <p>{overdueCount} 项任务已超时，请优先处理</p>
        </div>
      ) : null}

      <section className="mvp-section" aria-labelledby="teacher-tasks-title">
        <div className="mvp-section-heading">
          <div>
            <span>按处理优先级</span>
            <h2 id="teacher-tasks-title">最近待办</h2>
          </div>
          <button
            className="mvp-v21-text-link"
            type="button"
            onClick={() => onNavigate('#/mvp/teacher/tasks')}
          >
            查看全部
          </button>
        </div>
        <div className="mvp-v2-home-task-stack">
          {recentTasks.length > 0 ? (
            <>
              <HomeTaskCard
                key={recentTasks[0].id}
                task={recentTasks[0]}
                now={demoNow}
                mode="teacher"
                density="featured"
                onOpen={() => onNavigate(`#/mvp/teacher/tasks/${recentTasks[0].id}`)}
              />
              {recentTasks.slice(1, 3).map((task) => (
                <HomeTaskCard
                  key={task.id}
                  task={task}
                  now={demoNow}
                  mode="teacher"
                  density="compact"
                  onOpen={() => onNavigate(`#/mvp/teacher/tasks/${task.id}`)}
                />
              ))}
            </>
          ) : (
            <div className="mvp-empty-inline">当前没有需要处理的观察任务。</div>
          )}
        </div>
      </section>

      <section className="mvp-v21-stat-strip" aria-label="任务概览">
        <div>
          <button type="button" onClick={() => onNavigate('#/mvp/teacher/tasks?filter=pending')}>
            <strong>{pendingCount}</strong>
            <span>待处理</span>
          </button>
          <button type="button" onClick={() => onNavigate('#/mvp/teacher/tasks?filter=overdue')}>
            <strong>{overdueCount}</strong>
            <span>已超时</span>
          </button>
          <button type="button" onClick={scrollToRetest}>
            <strong>{todayReminderCount}</strong>
            <span>今日提醒</span>
          </button>
        </div>
      </section>

      <section className="mvp-section mvp-v21-home-section" id="today-retest" aria-labelledby="teacher-retest-title">
        <div className="mvp-section-heading">
          <div>
            <h2 id="teacher-retest-title">今日复测</h2>
          </div>
          <span className="mvp-list-count">{retestItems.length} 项</span>
        </div>
        <div className="mvp-v21-compact-list">
          {retestItems.length > 0 ? (
            retestItems.map(({ task, schedule }) => (
              <button
                key={task.id}
                type="button"
                className="mvp-v21-retest-row"
                onClick={() => onNavigate(`#/mvp/teacher/retest/${task.id}`)}
              >
                <span>
                  <strong>{task.student.name}</strong>
                  <small>今天 {formatRetestTime(schedule.scheduledAt)} 复测</small>
                </span>
                <span className="mvp-v21-row-action">
                  {getRetestReminderStatusLabel(task, schedule)}
                  <AppIcon name="arrowRight" size={16} />
                </span>
              </button>
            ))
          ) : (
            <div className="mvp-v21-empty-row">今天没有需要提醒的复测安排</div>
          )}
        </div>
      </section>

      <button
        type="button"
        className="mvp-v21-report-row"
        onClick={() => onNavigate('#/mvp/teacher/report')}
      >
        <span className="mvp-v21-report-row__icon">
          <AppIcon name="report" size={19} />
        </span>
        <span>
          <strong>发现需要关注的异常表现？</strong>
        </span>
        <span className="mvp-v21-row-action">
          提交线索
          <AppIcon name="arrowRight" size={16} />
        </span>
      </button>
    </div>
  );
}
