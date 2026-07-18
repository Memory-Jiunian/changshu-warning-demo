import { HomeTaskCard } from '../components/business/HomeTaskCard';
import { RoleHeader } from '../components/layout/RoleHeader';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import {
  formatCompactDateTime,
  getCanonicalSupervisionItems,
  getDirectorClassProgress,
  getDirectorGradeLabel,
  getRecentSupervisionItems,
  getSupervisionItemCounts,
  getTaskAssigneeName,
} from '../selectors/homeSelectors';
import { useDemo } from '../state/DemoProvider';

export function DirectorHomePage({
  onNavigate,
}: {
  onNavigate: (hash: string) => void;
}) {
  const {
    currentUser,
    users,
    tasks,
    supervisionRecords,
    now,
  } = useDemo();
  const demoNow = new Date(now);
  const supervisionItems = getCanonicalSupervisionItems(
    tasks,
    supervisionRecords,
    demoNow,
  );
  const classProgress = getDirectorClassProgress(supervisionItems);
  const supervisionCounts = getSupervisionItemCounts(supervisionItems, demoNow);
  const recentSupervisionItems = getRecentSupervisionItems(supervisionItems);

  return (
    <div className="mvp-page">
      <RoleHeader
        user={currentUser}
        scopeLabel={getDirectorGradeLabel(currentUser, tasks)}
      />

      <section className="mvp-section" aria-labelledby="director-overview-title">
        <div className="mvp-section-heading">
          <div>
            <span>协作范围内</span>
            <h2 id="director-overview-title">需要协调的事项</h2>
          </div>
        </div>
        <div className="mvp-stat-grid">
          <button type="button" onClick={() => onNavigate('#/mvp/supervision?filter=pending')}>
            <strong>{supervisionCounts.pending}</strong>
            <span>待督办</span>
          </button>
          <button type="button" onClick={() => onNavigate('#/mvp/supervision?filter=overdue')}>
            <strong>{supervisionCounts.overdue}</strong>
            <span>已超时</span>
          </button>
          <button type="button" onClick={() => onNavigate('#/mvp/supervision?filter=today')}>
            <strong>{supervisionCounts.todayNew}</strong>
            <span>今日新增</span>
          </button>
        </div>
      </section>

      <section className="mvp-section" aria-labelledby="director-class-title">
        <div className="mvp-section-heading">
          <div>
            <span>仅聚合可见督办事项</span>
            <h2 id="director-class-title">班级协作进度</h2>
          </div>
        </div>
        {classProgress.length > 0 ? (
          <Card className="mvp-class-progress">
            <CardContent>
              {classProgress.map((item) => (
                <div className="mvp-class-progress__row" key={item.className}>
                  <strong>{item.className}</strong>
                  <div>
                    <Badge variant="neutral">待督办 {item.pendingCount}</Badge>
                    <Badge variant={item.overdueCount > 0 ? 'error' : 'outline'}>
                      超时 {item.overdueCount}
                    </Badge>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : (
          <EmptyState
            title="当前没有待协调事项"
            description="仅当任务超时或明确指派给你时，才会出现在这里。"
            icon="supervision"
          />
        )}
      </section>

      <section className="mvp-section" aria-labelledby="director-tasks-title">
        <div className="mvp-section-heading">
          <div>
            <span>最多展示 3 项</span>
            <h2 id="director-tasks-title">最近督办事项</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onNavigate('#/mvp/supervision')}>
            查看全部
          </Button>
        </div>
        <div className="mvp-card-list">
          {recentSupervisionItems.map((item) => {
            const task = item.originalTask;
            return (
              <HomeTaskCard
                key={item.key}
                task={task}
                now={demoNow}
                mode="director"
                assigneeName={getTaskAssigneeName(task, users)}
                latestSupervision={
                  item.latestSupervisionRecord
                    ? formatCompactDateTime(item.latestSupervisionRecord.createdAt)
                    : undefined
                }
                onOpen={() =>
                  onNavigate(
                    `#/mvp/supervision?task=${item.supervisionTask?.id ?? task.id}`,
                  )
                }
              />
            );
          })}
        </div>
      </section>

      <div className="mvp-alert" role="note">
        <p>年级主任仅查看超时或明确指派事项，不查看观察反馈正文和心理老师专业记录。</p>
      </div>
    </div>
  );
}
