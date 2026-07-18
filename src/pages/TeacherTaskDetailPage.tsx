import { useEffect, useRef } from 'react';
import { ObservationRecordCard } from '../components/business/ObservationRecordCard';
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
  const statusBadge = <TaskStatusBadge task={task} now={new Date(now)} />;
  const hasAction = task.status === 'pending' || task.status === 'returned';

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

  if (task.status === 'pending') {
    return (
      <div className="mvp-page mvp-v2-page mvp-v2-task-detail-page mvp-task-detail-page has-bottom-action">
        <header className="mvp-page-header mvp-v2-detail-header">
          <Button variant="ghost" size="icon" aria-label="返回任务列表" onClick={onBack}>
            <AppIcon name="arrowLeft" size={20} />
          </Button>
          <div>
            <span>协作任务</span>
            <h1>任务详情</h1>
          </div>
        </header>

        <section className="mvp-v21-detail-surface" aria-label="任务内容">
          <div className="mvp-v21-detail-status">
            <div>
              <strong>{taskTypeLabels[task.type]}</strong>
              <span>截止：{display.deadlineLabel}</span>
              <small>创建于 {formatCompactDateTime(task.createdAt)}</small>
            </div>
            {statusBadge}
          </div>
          {display.isOverdue ? (
            <p className="mvp-v21-detail-warning">
              <AppIcon name="alert" size={17} />
              已超过截止时间，请优先完成事实反馈。
            </p>
          ) : null}

          <div className="mvp-v21-detail-block">
            <span>{task.student.gradeName} · {task.student.className}</span>
            <strong className="mvp-v21-student-name">{task.student.name}</strong>
            <h2 id="task-purpose-title">任务目的</h2>
            <p>{task.purpose}</p>
          </div>

          <div className="mvp-v21-detail-block">
            <h2>本次观察重点</h2>
            <p className="mvp-v21-focus-text">
              {(task.observationFocus?.length ? task.observationFocus : ['按任务说明观察']).join(' · ')}
            </p>
            <p className="mvp-v21-fact-note">
              请记录实际看到或听到的事实，不需要进行心理判断。
            </p>
          </div>
        </section>

        {records.length > 0 ? (
          <section className="mvp-section" aria-labelledby="v2-observation-history-title">
            <div className="mvp-section-heading">
              <div>
                <span>历史记录只读</span>
                <h2 id="v2-observation-history-title">我的反馈记录</h2>
              </div>
              <span className="mvp-list-count">{records.length} 条</span>
            </div>
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
          </section>
        ) : null}

        <BottomActionBar>
          <Button fullWidth onClick={onFeedback}>填写观察反馈</Button>
        </BottomActionBar>
      </div>
    );
  }

  return (
    <div className={`mvp-page mvp-task-detail-page ${hasAction ? 'has-bottom-action' : ''}`}>
      <header className="mvp-page-header">
        <Button variant="secondary" size="icon" aria-label="返回任务列表" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <h1>任务详情</h1>
        </div>
      </header>

      <Card className="mvp-state-summary">
        <CardHeader>
          <div className="mvp-card-heading">
            <div>
              <span className="mvp-card-kicker">当前状态</span>
              <CardTitle>{taskTypeLabels[task.type]}</CardTitle>
            </div>
            {statusBadge}
          </div>
        </CardHeader>
        <CardContent>
          <dl className="mvp-detail-metrics">
            <div><dt>创建时间</dt><dd>{formatCompactDateTime(task.createdAt)}</dd></div>
            <div><dt>截止时间</dt><dd>{display.deadlineLabel}</dd></div>
          </dl>
          {display.isOverdue ? (
            <div className="mvp-alert mvp-alert--warning">
              <AppIcon name="alert" size={18} />
              <p>该任务已经超过截止时间，请优先完成事实反馈。</p>
            </div>
          ) : null}
          {task.status === 'cancelled' ? (
            <div className="mvp-exception-summary">
              <strong>取消原因</strong>
              <p>{task.cancelReason}</p>
              <span>取消时间：{formatCompactDateTime(task.cancelledAt)}</span>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">{task.student.gradeName} · {task.student.className}</span>
          <CardTitle>{task.student.name}</CardTitle>
        </CardHeader>
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
          <p className="mvp-field-note">请记录实际看到或听到的事实，不需要进行心理判断。</p>
        </CardContent>
      </Card>

      {hasAction ? (
        <Card tone="warning">
          <CardHeader>
            <CardTitle>退回原因</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mvp-task-purpose">{task.returnReason}</p>
            <p className="mvp-muted-copy">退回时间：{formatCompactDateTime(task.returnedAt)}</p>
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

      {task.status === 'returned' ? (
        <BottomActionBar>
          <Button fullWidth onClick={onFeedback}>补充反馈</Button>
        </BottomActionBar>
      ) : null}
    </div>
  );
}
