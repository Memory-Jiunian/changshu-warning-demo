import type { ObservationRecord } from '../../../domain/feedback';
import type { Result } from '../../../domain/result';
import type { CollaborationTask } from '../../../domain/tasks';
import { formatCompactDateTime } from '../../../selectors/homeSelectors';
import { Button } from '../components/Button';

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
      <header className="ff-page-header">
        <h1>待我查看</h1>
      </header>

      <section className="ff-review-sheet">
        <header className="ff-review-sheet__header">
          <h2>详情抽屉</h2>
          <Button variant="icon" aria-label="关闭详情" onClick={onBack}>×</Button>
        </header>
        <div className="ff-review-sheet__content">
          <section className="ff-sheet-section ff-task-summary">
            <div className="ff-task-summary__title">
              <h3>{task.student.name}</h3>
              <p>{task.student.gradeName} · {task.student.className}</p>
            </div>
            <p>当前状态：{record?.viewedAt ? '已查看' : '已反馈'}</p>
          </section>

          <section className="ff-sheet-section ff-review-feedback">
            <h3>请求内容</h3>
            <p>反馈需求：{task.purpose}</p>
            {record ? (
              <>
                <h3>反馈内容</h3>
                <p>观察时间：{formatCompactDateTime(record.observedAt)}</p>
                <p>{record.facts}</p>
                <div className="ff-review-feedback__meta">
                  <span>提交时间：{formatCompactDateTime(record.submittedAt)}</span>
                </div>
              </>
            ) : null}
          </section>
        </div>
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
