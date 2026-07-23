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
      <dl>
        <div>
          <dt>观察时间</dt>
          <dd>{formatCompactDateTime(record.observedAt)}</dd>
        </div>
        <div>
          <dt>观察内容</dt>
          <dd>{record.facts}</dd>
        </div>
        <div>
          <dt>提交时间</dt>
          <dd>{formatCompactDateTime(record.submittedAt)}</dd>
        </div>
      </dl>
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
