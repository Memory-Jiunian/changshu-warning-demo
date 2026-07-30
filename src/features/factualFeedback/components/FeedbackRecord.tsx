import type { ObservationRecord } from '../../../domain/feedback';
import { formatCompactDateTime } from '../../../selectors/homeSelectors';

export function FeedbackRecord({
  record,
  psychologistView = false,
}: {
  record: ObservationRecord;
  psychologistView?: boolean;
}) {
  return (
    <article className="ff-feedback-record">
      <p className="ff-feedback-record__meta">
        <span>观察时间：</span>
        <time>{formatCompactDateTime(record.observedAt)}</time>
      </p>
      <p className="ff-feedback-record__facts">{record.facts}</p>
      <p className="ff-feedback-record__meta">
        <span>提交时间：</span>
        <time>{formatCompactDateTime(record.submittedAt)}</time>
      </p>
      {psychologistView ? (
        <p className="ff-feedback-record__view-state">
          {record.viewedAt
            ? `已于 ${formatCompactDateTime(record.viewedAt)} 确认查看`
            : '等待心理老师查看'}
        </p>
      ) : null}
    </article>
  );
}
