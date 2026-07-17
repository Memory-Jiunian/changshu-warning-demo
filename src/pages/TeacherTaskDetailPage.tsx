import { useEffect, useRef } from 'react';
import { ObservationRecordCard } from '../components/business/ObservationRecordCard';
import { PrivacyNotice } from '../components/business/PrivacyNotice';
import { StudentCompactInfo } from '../components/business/StudentCompactInfo';
import { TaskStatusBadge } from '../components/business/TaskStatusBadge';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import type { ObservationRecord } from '../domain/feedback';
import type { Result } from '../domain/result';
import type { CollaborationTask } from '../domain/tasks';
import { formatCompactDateTime, taskTypeLabels } from '../selectors/homeSelectors';
import { getTaskDisplayState, getTaskObservationRecords } from '../selectors/taskSelectors';

export function TeacherTaskDetailPage({
  task,
  observations,
  now,
  highlightRecordId,
  onBack,
  onFeedback,
  markTaskRead,
}: {
  task: CollaborationTask;
  observations: ObservationRecord[];
  now: string;
  highlightRecordId?: string;
  onBack: () => void;
  onFeedback: () => void;
  markTaskRead: (taskId: string) => Promise<Result<CollaborationTask>>;
}) {
  const requestedRead = useRef(false);
  const records = getTaskObservationRecords(observations, task.id);
  const display = getTaskDisplayState(task, new Date(now));

  useEffect(() => {
    if (task.readAt || requestedRead.current) return;
    requestedRead.current = true;
    void markTaskRead(task.id);
  }, [markTaskRead, task.id, task.readAt]);

  useEffect(() => {
    if (!highlightRecordId) return;
    const frame = window.requestAnimationFrame(() => {
      document.getElementById(`observation-${highlightRecordId}`)?.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    });
    return () => window.cancelAnimationFrame(frame);
  }, [highlightRecordId, records.length]);

  return (
    <div className="mvp-page mvp-task-detail-page">
      <header className="mvp-page-header">
        <Button variant="secondary" size="icon" aria-label="返回任务列表" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <span>协作任务详情</span>
          <h1>{task.student.name}</h1>
        </div>
        <TaskStatusBadge task={task} now={new Date(now)} />
      </header>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">任务状态</span>
          <CardTitle>{taskTypeLabels[task.type]}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="mvp-detail-metrics">
            <div><dt>当前行动</dt><dd>{display.label}</dd></div>
            <div><dt>创建时间</dt><dd>{formatCompactDateTime(task.createdAt)}</dd></div>
            <div><dt>截止时间</dt><dd>{display.deadlineLabel}</dd></div>
            <div><dt>阅读状态</dt><dd>{task.readAt ? `已读 · ${formatCompactDateTime(task.readAt)}` : '正在记录已读'}</dd></div>
          </dl>
          {display.isOverdue ? (
            <div className="mvp-alert mvp-alert--warning">
              <AppIcon name="alert" size={18} />
              <p>该任务已经超过截止时间，请优先完成事实反馈。</p>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>学生有限信息</CardTitle></CardHeader>
        <CardContent><StudentCompactInfo student={task.student} /></CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>任务说明</CardTitle></CardHeader>
        <CardContent>
          <div className="mvp-copy-block">
            <span>任务目的</span>
            <p>{task.purpose}</p>
          </div>
          <div className="mvp-copy-block">
            <span>本次观察重点</span>
            <div className="mvp-focus-tags">
              {(task.observationFocus?.length ? task.observationFocus : ['按任务说明观察']).map((item) => (
                <Badge key={item} variant="outline">{item}</Badge>
              ))}
            </div>
          </div>
          <div className="mvp-copy-block">
            <span>非诊断性注意事项</span>
            {(task.precautions?.length ? task.precautions : ['只记录可观察事实。']).map((item) => (
              <p key={item}>{item}</p>
            ))}
          </div>
          <dl className="mvp-detail-metrics">
            <div><dt>发起时间</dt><dd>{formatCompactDateTime(task.createdAt)}</dd></div>
            <div><dt>发起角色</dt><dd>心理老师</dd></div>
          </dl>
          <PrivacyNotice>请记录实际看到或听到的事实，不需要进行心理判断。</PrivacyNotice>
        </CardContent>
      </Card>

      {task.status === 'returned' ? (
        <Card tone="warning">
          <CardHeader>
            <span className="mvp-card-kicker">需要补充</span>
            <CardTitle>退回原因</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mvp-task-purpose">{task.returnReason}</p>
            <dl className="mvp-detail-metrics">
              <div><dt>退回时间</dt><dd>{formatCompactDateTime(task.returnedAt)}</dd></div>
              <div><dt>处理方式</dt><dd>新增补充记录，原反馈保持只读</dd></div>
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {task.status === 'cancelled' ? (
        <Card tone="warning">
          <CardHeader><CardTitle>任务已取消</CardTitle></CardHeader>
          <CardContent>
            <p className="mvp-task-purpose">{task.cancelReason}</p>
            <p className="mvp-muted-copy">取消时间：{formatCompactDateTime(task.cancelledAt)}</p>
          </CardContent>
        </Card>
      ) : null}

      <section className="mvp-section" aria-labelledby="observation-history-title">
        <div className="mvp-section-heading">
          <div>
            <span>历史记录只读</span>
            <h2 id="observation-history-title">我的反馈记录</h2>
          </div>
          <span className="mvp-list-count">{records.length} 条</span>
        </div>
        {records.length > 0 ? (
          <div className="mvp-card-list">
            {records.map((record) => (
              <div id={`observation-${record.id}`} key={record.id}>
                <ObservationRecordCard
                  record={record}
                  linkedRecord={records.find((item) => item.id === record.revisionOfRecordId)}
                  highlighted={record.id === highlightRecordId}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="mvp-empty-inline">尚未提交观察反馈。</div>
        )}
      </section>

      <BottomActionBar>
        {task.status === 'pending' ? (
          <Button fullWidth onClick={onFeedback}>填写观察反馈</Button>
        ) : task.status === 'returned' ? (
          <Button fullWidth onClick={onFeedback}>补充反馈</Button>
        ) : task.status === 'submitted' ? (
          <Button fullWidth disabled>已提交，等待心理老师查看</Button>
        ) : task.status === 'completed' ? (
          <Button fullWidth disabled>任务已完成</Button>
        ) : (
          <Button fullWidth disabled>任务已取消</Button>
        )}
      </BottomActionBar>
    </div>
  );
}
