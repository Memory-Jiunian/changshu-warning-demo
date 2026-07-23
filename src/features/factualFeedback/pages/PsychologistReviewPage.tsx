import type { ObservationRecord } from '../../../domain/feedback';
import type { Result } from '../../../domain/result';
import type { CollaborationTask } from '../../../domain/tasks';
import { formatCompactDateTime } from '../../../selectors/homeSelectors';
import { AppIcon } from '../../../components/ui/AppIcon';
import { Button } from '../components/Button';
import { FeedbackRecord } from '../components/FeedbackRecord';
import { StatusBadge } from '../components/StatusBadge';

export function PsychologistReviewPage({
  task,
  record,
  loading,
  onBack,
  onViewed,
}: {
  task: CollaborationTask;
  record?: ObservationRecord;
  loading: boolean;
  onBack: () => void;
  onViewed: (taskId: string) => Promise<Result<ObservationRecord>>;
}) {
  return (
    <main className="ff-app ff-review-page">
      <header className="ff-page-header ff-page-header--back">
        <Button variant="icon" aria-label="返回班主任待办" onClick={onBack}>
          <AppIcon name="arrowLeft" size={21} />
        </Button>
        <div>
          <span>心理老师</span>
          <h1>反馈详情</h1>
        </div>
        <span aria-hidden="true" />
      </header>

      <section className="ff-review-card">
        <div className="ff-review-card__head">
          <div>
            <h2>{task.student.name}</h2>
            <p>{task.student.gradeName} · {task.student.className}</p>
          </div>
          <StatusBadge
            label={record?.viewedAt ? '已查看' : '待我查看'}
            tone={record?.viewedAt ? 'success' : 'brand'}
          />
        </div>
        <dl className="ff-summary-grid">
          <div>
            <dt>反馈任务</dt>
            <dd>{task.title}</dd>
          </div>
          <div>
            <dt>提交时间</dt>
            <dd>{record ? formatCompactDateTime(record.submittedAt) : '暂无记录'}</dd>
          </div>
        </dl>
      </section>

      <section className="ff-review-card">
        <h2>请求内容</h2>
        <p>{task.purpose}</p>
      </section>

      <section className="ff-review-card">
        <h2>班主任反馈</h2>
        {record ? (
          <FeedbackRecord record={record} psychologistView />
        ) : (
          <p className="ff-review-empty">当前任务还没有可查看的反馈记录。</p>
        )}
      </section>

      {record && !record.viewedAt ? (
        <footer className="ff-review-action">
          <Button
            fullWidth
            disabled={loading}
            onClick={() => void onViewed(task.id)}
          >
            {loading ? '确认中' : '确认已查看'}
          </Button>
        </footer>
      ) : null}
    </main>
  );
}
