import type { ObservationRecord } from '../../domain/feedback';
import { formatCompactDateTime } from '../../selectors/homeSelectors';
import { Badge } from '../ui/Badge';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/Card';

export function ObservationRecordCard({
  record,
  linkedRecord,
  highlighted = false,
}: {
  record: ObservationRecord;
  linkedRecord?: ObservationRecord;
  highlighted?: boolean;
}) {
  return (
    <Card
      as="article"
      className={highlighted ? 'mvp-observation-record is-highlighted' : 'mvp-observation-record'}
    >
      <CardHeader>
        <div className="mvp-card-heading">
          <div>
            <span className="mvp-card-kicker">
              {formatCompactDateTime(record.submittedAt)} 提交
            </span>
            <CardTitle>{record.revisionOfRecordId ? '补充反馈' : '观察反馈'}</CardTitle>
          </div>
          <Badge variant={record.revisionOfRecordId ? 'warning' : 'info'}>
            {record.revisionOfRecordId ? '补充记录' : '原反馈'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <dl className="mvp-record-details">
          <div><dt>观察时间</dt><dd>{formatCompactDateTime(record.observedAt)}</dd></div>
          <div><dt>观察场景</dt><dd>{record.scene}</dd></div>
          <div><dt>出现频率</dt><dd>{record.frequency || '未填写'}</dd></div>
          <div><dt>持续时间</dt><dd>{record.duration || '未填写'}</dd></div>
        </dl>
        <div className="mvp-record-facts">
          <span>事实观察</span>
          <p>{record.facts}</p>
        </div>
        {record.additionalNotes ? (
          <div className="mvp-record-facts">
            <span>补充说明</span>
            <p>{record.additionalNotes}</p>
          </div>
        ) : null}
        {record.revisionOfRecordId ? (
          <p className="mvp-record-link">
            关联原反馈：{linkedRecord ? formatCompactDateTime(linkedRecord.submittedAt) : record.revisionOfRecordId}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
