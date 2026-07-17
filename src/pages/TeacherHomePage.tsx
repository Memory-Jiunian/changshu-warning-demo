import { HomeTaskCard } from '../components/business/HomeTaskCard';
import { RetestReminderCard } from '../components/business/RetestReminderCard';
import { RoleHeader } from '../components/layout/RoleHeader';
import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import {
  formatCompactDateTime,
  formatDemoDate,
  getRecentSubmissions,
  getRecentTeacherTasks,
  getTeacherClassLabel,
  getTodayRetestItems,
  taskTypeLabels,
} from '../selectors/homeSelectors';
import { useDemo } from '../state/DemoProvider';

export function TeacherHomePage({
  onNavigate,
}: {
  onNavigate: (hash: string) => void;
}) {
  const {
    currentUser,
    tasks,
    observations,
    retestSchedules,
    now,
    pendingCount,
    overdueCount,
    todayReminderCount,
  } = useDemo();
  const demoNow = new Date(now);
  const recentTasks = getRecentTeacherTasks(tasks, demoNow);
  const retestItems = getTodayRetestItems(tasks, retestSchedules, demoNow);
  const recentSubmissions = getRecentSubmissions(tasks, observations);

  const scrollToRetest = () => {
    document.getElementById('today-retest')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  return (
    <div className="mvp-page">
      <RoleHeader
        user={currentUser}
        scopeLabel={getTeacherClassLabel(currentUser, tasks)}
        demoDate={formatDemoDate(now)}
      />

      <section className="mvp-section" aria-labelledby="teacher-overview-title">
        <div className="mvp-section-heading">
          <div>
            <span>今日协作</span>
            <h2 id="teacher-overview-title">我需要处理的事项</h2>
          </div>
        </div>
        <div className="mvp-stat-grid">
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

      {overdueCount > 0 ? (
        <div className="mvp-alert mvp-alert--warning" role="status">
          <AppIcon name="alert" size={19} />
          <p>你有 {overdueCount} 项协作任务已超过截止时间，请优先处理。</p>
        </div>
      ) : null}

      <section className="mvp-section" id="today-retest" aria-labelledby="teacher-retest-title">
        <div className="mvp-section-heading">
          <div>
            <span>日程提醒</span>
            <h2 id="teacher-retest-title">今日复测提醒</h2>
          </div>
          <Badge variant="outline">{retestItems.length} 项</Badge>
        </div>
        <div className="mvp-card-list">
          {retestItems.length > 0 ? (
            retestItems.map(({ task, schedule }) => (
              <RetestReminderCard
                key={task.id}
                task={task}
                schedule={schedule}
                onOpen={() => onNavigate(`#/mvp/teacher/retest/${task.id}`)}
              />
            ))
          ) : (
            <EmptyState
              title="今天没有需要提醒的复测安排"
              description="新的提醒会在心理老师完成安排后同步到这里。"
              icon="calendar"
            />
          )}
        </div>
      </section>

      <section className="mvp-section" aria-labelledby="teacher-tasks-title">
        <div className="mvp-section-heading">
          <div>
            <span>按处理优先级排序</span>
            <h2 id="teacher-tasks-title">最近待办</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('#/mvp/teacher/tasks')}>
            查看全部
          </Button>
        </div>
        <div className="mvp-card-list">
          {recentTasks.map((task) => (
            <HomeTaskCard
              key={task.id}
              task={task}
              now={demoNow}
              mode="teacher"
              onOpen={() => onNavigate(`#/mvp/teacher/tasks/${task.id}`)}
            />
          ))}
        </div>
      </section>

      <Card className="mvp-report-shortcut" tone="soft">
        <CardHeader>
          <span className="mvp-report-shortcut__icon">
            <AppIcon name="report" size={22} />
          </span>
          <CardTitle>发现学生出现持续异常表现？</CardTitle>
        </CardHeader>
        <CardContent>
          <p>提交事实观察，由心理老师进行专业复核。</p>
          <Button fullWidth onClick={() => onNavigate('#/mvp/teacher/report')}>
            提交观察线索
          </Button>
        </CardContent>
      </Card>

      <section className="mvp-section" aria-labelledby="teacher-submissions-title">
        <div className="mvp-section-heading">
          <div>
            <span>仅展示摘要</span>
            <h2 id="teacher-submissions-title">最近提交</h2>
          </div>
        </div>
        {recentSubmissions.length > 0 ? (
          <Card className="mvp-summary-list">
            <CardContent>
              {recentSubmissions.map(({ record, task }) => (
                <div className="mvp-summary-row" key={record.id}>
                  <div>
                    <strong>{task.student.name} · {taskTypeLabels[task.type]}</strong>
                    <span>{formatCompactDateTime(record.submittedAt)}</span>
                  </div>
                  <Badge variant={task.status === 'completed' ? 'success' : 'info'}>
                    {task.status === 'completed' ? '已完成' : '已提交'}
                  </Badge>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="暂无最近提交"
            description="提交观察反馈后，这里只展示任务摘要，不展示反馈正文。"
            icon="history"
          />
        )}
      </section>
    </div>
  );
}
