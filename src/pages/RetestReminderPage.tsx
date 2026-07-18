import { useEffect, useRef, useState } from 'react';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/RadioGroup';
import type { Result } from '../domain/result';
import type {
  CollaborationTask,
  RetestReminderConfirmationInput,
  RetestReminderMethod,
  RetestSchedule,
} from '../domain/tasks';
import type { DemoUser } from '../domain/users';
import { formatCompactDateTime } from '../selectors/homeSelectors';
import {
  getRetestReminderDisplayState,
  getRetestScheduleTimeLabel,
  getRetestReminderStatusLabel,
  retestReminderMethodLabels,
} from '../selectors/retestSelectors';

const reminderMethodOptions: Array<{
  value: RetestReminderMethod;
  label: string;
}> = [
  { value: 'in_person', label: '当面提醒' },
  { value: 'class_message', label: '班级消息' },
  { value: 'phone', label: '电话' },
  { value: 'other', label: '其他' },
];

export function RetestReminderPage({
  task,
  schedule,
  currentUser,
  now,
  loading,
  onBack,
  markTaskRead,
  confirmRetestReminder,
}: {
  task: CollaborationTask;
  schedule: RetestSchedule;
  currentUser: DemoUser;
  now: string;
  loading: boolean;
  onBack: () => void;
  markTaskRead: (taskId: string) => Promise<Result<CollaborationTask>>;
  confirmRetestReminder: (
    taskId: string,
    input: RetestReminderConfirmationInput,
  ) => Promise<Result<RetestSchedule>>;
}) {
  const [method, setMethod] = useState<RetestReminderMethod | ''>('');
  const [otherMethod, setOtherMethod] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const requestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const displayState = getRetestReminderDisplayState(task, schedule);
  const statusLabel = getRetestReminderStatusLabel(task, schedule);

  useEffect(() => {
    if (!task.readAt) void markTaskRead(task.id);
  }, [markTaskRead, task.id, task.readAt]);

  const updateMethod = (value: RetestReminderMethod) => {
    requestIdRef.current = null;
    setFieldError('');
    setSubmitError('');
    setMethod(value);
  };

  const openConfirm = () => {
    if (!method) {
      setFieldError('请选择提醒方式。');
      return;
    }
    if (method === 'other' && !otherMethod.trim()) {
      setFieldError('请填写其他提醒方式。');
      return;
    }
    setFieldError('');
    setSubmitError('');
    setDialogOpen(true);
  };

  const confirm = async () => {
    if (!method || loading || submittingRef.current) return;
    submittingRef.current = true;
    const requestId =
      requestIdRef.current ??
      `retest-reminder-${currentUser.id}-${task.id}-${Date.now()}`;
    requestIdRef.current = requestId;
    const result = await confirmRetestReminder(task.id, {
      requestId,
      method,
      otherMethod: method === 'other' ? otherMethod.trim() : undefined,
    });
    submittingRef.current = false;
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setDialogOpen(false);
  };

  const confirmedMethod = schedule.reminderMethod
    ? schedule.reminderMethod === 'other'
      ? schedule.reminderOtherMethod || '其他'
      : retestReminderMethodLabels[schedule.reminderMethod]
    : '尚未确认';

  return (
    <div className="mvp-page mvp-retest-detail-page">
      <header className="mvp-page-header">
        <Button variant="secondary" size="icon" aria-label="返回" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <span>班主任移动提醒</span>
          <h1>复测提醒详情</h1>
        </div>
        <Badge
          variant={
            displayState === 'pending'
              ? 'warning'
              : displayState === 'cancelled'
                ? 'neutral'
                : 'success'
          }
        >
          {statusLabel}
        </Badge>
      </header>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">{task.student.className}</span>
          <CardTitle>{task.student.name}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="mvp-detail-metrics">
            <div><dt>年级 / 班级</dt><dd>{task.student.gradeName} · {task.student.className}</dd></div>
            <div><dt>{getRetestScheduleTimeLabel(task)}</dt><dd>{formatCompactDateTime(schedule.scheduledAt)}</dd></div>
            <div><dt>方式或地点</dt><dd>{schedule.location}</dd></div>
            <div><dt>当前状态</dt><dd>{statusLabel}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>心理老师提供的提醒要求</CardTitle></CardHeader>
        <CardContent>
          <p className="mvp-task-purpose">{schedule.instructions}</p>
          <div className="mvp-alert">
            <AppIcon name="shield" size={18} />
            <p>班主任只确认是否已经提醒学生，不录入复测题目、评分或结果。</p>
          </div>
        </CardContent>
      </Card>

      {displayState === 'pending' ? (
        <Card>
          <CardHeader>
            <span className="mvp-card-kicker">确认自己的提醒动作</span>
            <CardTitle>选择提醒方式</CardTitle>
          </CardHeader>
          <CardContent className="mvp-form-stack">
            <FormField label="提醒方式" required error={fieldError}>
              <RadioGroup
                name="retestReminderMethod"
                value={method}
                options={reminderMethodOptions}
                onChange={updateMethod}
              />
            </FormField>
            {method === 'other' ? (
              <FormField label="其他提醒方式" htmlFor="otherReminderMethod" required>
                <Input
                  id="otherReminderMethod"
                  value={otherMethod}
                  maxLength={40}
                  placeholder="请简短说明提醒方式"
                  onChange={(event) => {
                    requestIdRef.current = null;
                    setOtherMethod(event.target.value);
                    setFieldError('');
                  }}
                />
              </FormField>
            ) : null}
          </CardContent>
        </Card>
      ) : null}

      {displayState === 'reminded' || displayState === 'student_completed' ? (
        <Card tone="soft">
          <CardHeader>
            <span className="mvp-card-kicker">班主任操作记录</span>
            <CardTitle>已完成提醒</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="mvp-detail-metrics">
              <div><dt>提醒时间</dt><dd>{formatCompactDateTime(schedule.reminderConfirmedAt)}</dd></div>
              <div><dt>提醒方式</dt><dd>{confirmedMethod}</dd></div>
              <div><dt>操作人</dt><dd>{currentUser.name} · 班主任</dd></div>
              {schedule.studentCompletedAt ? (
                <div><dt>学生完成时间</dt><dd>{formatCompactDateTime(schedule.studentCompletedAt)}</dd></div>
              ) : null}
            </dl>
          </CardContent>
        </Card>
      ) : null}

      {displayState === 'cancelled' ? (
        <Card>
          <CardHeader><CardTitle>复测提醒已取消</CardTitle></CardHeader>
          <CardContent>
            <p className="mvp-task-purpose">{task.cancelReason}</p>
            <p className="mvp-muted-copy">取消时间：{formatCompactDateTime(task.cancelledAt)}</p>
          </CardContent>
        </Card>
      ) : null}

      {displayState === 'reminded' ? (
        <div className="mvp-alert" role="status">
          <AppIcon name="clock" size={19} />
          <p>已提醒，等待学生完成复测。学生完成状态由系统同步，班主任无需操作。</p>
        </div>
      ) : null}

      <BottomActionBar>
        {displayState === 'pending' ? (
          <Button fullWidth disabled={loading} onClick={openConfirm}>
            确认已提醒学生
          </Button>
        ) : displayState === 'reminded' ? (
          <Button fullWidth disabled>已提醒，等待学生完成复测</Button>
        ) : displayState === 'student_completed' ? (
          <Button fullWidth disabled>学生已完成复测</Button>
        ) : (
          <Button fullWidth disabled>提醒已取消</Button>
        )}
      </BottomActionBar>

      <ConfirmDialog
        open={dialogOpen}
        title="确认已提醒学生"
        description="本操作只记录提醒动作，不代表学生已经完成复测。"
        confirmLabel={submitError ? '重试确认' : '确认已提醒'}
        submitting={loading}
        onCancel={() => !loading && setDialogOpen(false)}
        onConfirm={() => void confirm()}
      >
        <dl className="mvp-confirm-summary">
          <div><dt>学生</dt><dd>{task.student.name}</dd></div>
          <div><dt>复测时间</dt><dd>{formatCompactDateTime(schedule.scheduledAt)}</dd></div>
          <div><dt>提醒方式</dt><dd>{method === 'other' ? otherMethod : method ? retestReminderMethodLabels[method] : '未选择'}</dd></div>
          <div><dt>确认动作</dt><dd>仅确认已提醒学生</dd></div>
        </dl>
        {submitError ? (
          <div className="mvp-alert mvp-alert--danger" role="alert">
            <AppIcon name="alert" size={18} />
            <p>{submitError}。当前状态未改变，可直接重试。</p>
          </div>
        ) : null}
      </ConfirmDialog>
    </div>
  );
}
