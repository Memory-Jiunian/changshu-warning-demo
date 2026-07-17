import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import type { AbnormalReport } from '../domain/feedback';
import { formatCompactDateTime } from '../selectors/homeSelectors';
import { abnormalReportStatusLabel } from '../selectors/reportSelectors';

export function TeacherReportDetailPage({
  report,
  justSubmitted,
  onBack,
  onHome,
}: {
  report: AbnormalReport;
  justSubmitted: boolean;
  onBack: () => void;
  onHome: () => void;
}) {
  return (
    <div className="mvp-page mvp-report-detail-page">
      <header className="mvp-page-header">
        <Button variant="secondary" size="icon" aria-label="返回我的上报" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <span>本人提交记录 · 只读</span>
          <h1>上报记录详情</h1>
        </div>
      </header>

      {justSubmitted ? (
        <div className="mvp-success-panel" role="status">
          <AppIcon name="check" size={24} />
          <div>
            <strong>提交成功</strong>
            <p>{abnormalReportStatusLabel}</p>
          </div>
        </div>
      ) : null}

      <Card>
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
            <div><dt>记录编号</dt><dd>{report.id}</dd></div>
            <div><dt>提交时间</dt><dd>{formatCompactDateTime(report.submittedAt)}</dd></div>
            <div><dt>观察时间</dt><dd>{formatCompactDateTime(report.observedAt)}</dd></div>
            <div><dt>观察场景</dt><dd>{report.scene}</dd></div>
            <div><dt>状态</dt><dd>{abnormalReportStatusLabel}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>本人提交的事实记录</CardTitle></CardHeader>
        <CardContent className="mvp-copy-stack">
          <div className="mvp-copy-block">
            <span>事实描述</span>
            <p>{report.facts}</p>
          </div>
          <div className="mvp-copy-block">
            <span>已采取的线下沟通或支持</span>
            <p>{report.supportActions || '未填写'}</p>
          </div>
          <div className="mvp-copy-block">
            <span>即时安全风险选择</span>
            <p>{report.immediateSafetyConcern ? '是，提交前已提示线下处置优先' : '否'}</p>
          </div>
        </CardContent>
      </Card>

      <Card tone="soft">
        <CardHeader><CardTitle>信息边界</CardTitle></CardHeader>
        <CardContent>
          <p className="mvp-muted-copy">
            这里只保留本人提交的原始事实。心理老师专业复核、风险等级和后续处置结论不在班主任端展示。
          </p>
        </CardContent>
      </Card>

      <div className="mvp-inline-actions">
        <Button variant="secondary" fullWidth onClick={onBack}>查看我的上报</Button>
        <Button fullWidth onClick={onHome}>返回首页</Button>
      </div>
    </div>
  );
}
