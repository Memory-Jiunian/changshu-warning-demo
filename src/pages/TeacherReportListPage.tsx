import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { EmptyState } from '../components/ui/EmptyState';
import type { AbnormalReport } from '../domain/feedback';
import { getVisibleReportsForUser } from '../selectors/reportSelectors';
import type { DemoUser } from '../domain/users';
import { formatCompactDateTime } from '../selectors/homeSelectors';

export function TeacherReportListPage({
  currentUser,
  reports,
  onBack,
  onCreate,
  onOpen,
}: {
  currentUser: DemoUser;
  reports: AbnormalReport[];
  onBack: () => void;
  onCreate: () => void;
  onOpen: (reportId: string) => void;
}) {
  const visibleReports = getVisibleReportsForUser(currentUser, reports);

  return (
    <div className="mvp-page mvp-report-list-page">
      <header className="mvp-page-header">
        <Button variant="secondary" size="icon" aria-label="返回我的" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <span>本人提交记录</span>
          <h1>我的上报</h1>
        </div>
        <Button size="sm" onClick={onCreate}>新建</Button>
      </header>

      {visibleReports.length > 0 ? (
        <div className="mvp-card-list">
          {visibleReports.map((report) => (
            <Card
              as="article"
              key={report.id}
              className="mvp-clickable-card"
              role="link"
              tabIndex={0}
              aria-label={`查看${report.student.name}的上报记录`}
              onClick={() => onOpen(report.id)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  onOpen(report.id);
                }
              }}
            >
              <CardHeader>
                <div className="mvp-card-heading">
                  <div>
                    <span className="mvp-card-kicker">{report.student.className}</span>
                    <CardTitle>{report.student.name}</CardTitle>
                  </div>
                  <Badge variant="info">已提交待复核</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <dl className="mvp-detail-metrics">
                  <div><dt>观察时间</dt><dd>{formatCompactDateTime(report.observedAt)}</dd></div>
                  <div><dt>提交时间</dt><dd>{formatCompactDateTime(report.submittedAt)}</dd></div>
                  <div><dt>观察场景</dt><dd>{report.scene}</dd></div>
                </dl>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <EmptyState
          title="你还没有提交过异常情况记录"
          description="发现需要专业复核的事实线索时，可以从这里提交。"
          icon="report"
          action={<Button onClick={onCreate}>提交观察线索</Button>}
        />
      )}
    </div>
  );
}
