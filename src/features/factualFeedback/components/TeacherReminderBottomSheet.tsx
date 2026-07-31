import { useRef, useState } from 'react';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { RadioGroup } from '../../../components/ui/RadioGroup';
import type { Result } from '../../../domain/result';
import type {
  InterventionAppointment,
  InterventionReminderConfirmationInput,
  InterventionReminderRecord,
  ReminderMethod,
} from '../../../domain/teacherActions';
import type {
  CollaborationTask,
  RetestReminderConfirmationInput,
  RetestReminderMethod,
  RetestSchedule,
} from '../../../domain/tasks';
import type { DemoUser } from '../../../domain/users';
import type {
  Slice2RetestAction,
  TeacherInterventionAction,
} from '../../../selectors/factualFeedbackSelectors';
import { formatActionDateTime } from '../feedbackPresentation';
import { BottomSheet } from './BottomSheet';
import { Dialog } from './Dialog';
import { FormField } from './FormField';

type ReminderAction = Slice2RetestAction | TeacherInterventionAction;
type ReminderMethodValue = RetestReminderMethod | ReminderMethod;

const methodOptions: Array<{ value: ReminderMethodValue; label: string }> = [
  { value: 'in_person', label: '当面提醒' },
  { value: 'phone', label: '电话' },
  { value: 'class_message', label: '微信 / 消息' },
  { value: 'other', label: '其他' },
];

const methodLabels = Object.fromEntries(
  methodOptions.map((option) => [option.value, option.label]),
) as Record<ReminderMethodValue, string>;

export function TeacherReminderBottomSheet({
  action,
  task,
  schedule,
  appointment,
  currentUser,
  loading,
  onClose,
  onConfirmed,
  confirmRetestReminder,
  confirmInterventionReminder,
}: {
  action: ReminderAction;
  task?: CollaborationTask;
  schedule?: RetestSchedule;
  appointment?: InterventionAppointment;
  currentUser: DemoUser;
  loading: boolean;
  onClose: () => void;
  onConfirmed: () => void;
  confirmRetestReminder: (
    taskId: string,
    input: RetestReminderConfirmationInput,
  ) => Promise<Result<RetestSchedule>>;
  confirmInterventionReminder: (
    appointmentId: string,
    input: InterventionReminderConfirmationInput,
  ) => Promise<Result<InterventionReminderRecord>>;
}) {
  const [method, setMethod] = useState<ReminderMethodValue | ''>('');
  const [otherMethod, setOtherMethod] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string | null>(null);
  const isRetest = action.kind === 'retest_reminder';
  const source = isRetest ? schedule : appointment;

  if (!source || (isRetest && !task)) return null;

  const time = isRetest ? schedule!.scheduledAt : appointment!.plannedAt;
  const location = isRetest ? schedule!.location : appointment!.location;
  const requirement = isRetest
    ? schedule!.instructions
    : appointment!.note || '请在干预安排开始前提醒学生按时到达。';

  const updateMethod = (value: ReminderMethodValue) => {
    requestIdRef.current = null;
    setMethod(value);
    setFieldError('');
    setSubmitError('');
  };

  const requestConfirm = () => {
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
    setConfirmOpen(true);
  };

  const confirm = async () => {
    if (!method || submitting || loading) return;
    setSubmitting(true);
    const requestId =
      requestIdRef.current ??
      `${isRetest ? 'retest' : 'intervention'}-reminder-${currentUser.id}-${action.sourceId}-${Date.now()}`;
    requestIdRef.current = requestId;
    const result = isRetest
      ? await confirmRetestReminder(action.target.taskId, {
          requestId,
          method,
          otherMethod: method === 'other' ? otherMethod.trim() : undefined,
        })
      : await confirmInterventionReminder(
          action.target.sourceAppointmentId,
          {
            submissionRequestId: requestId,
            method,
            otherMethod: method === 'other' ? otherMethod.trim() : undefined,
          },
        );
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    setConfirmOpen(false);
    onConfirmed();
  };

  return (
    <>
      <BottomSheet
        open
        title={isRetest ? '复测提醒详情' : '待干预提醒详情'}
        onClose={onClose}
        footer={
          <>
            <Button variant="secondary" fullWidth disabled={submitting} onClick={onClose}>
              返回
            </Button>
            <Button fullWidth disabled={submitting || loading} onClick={requestConfirm}>
              确认已提醒
            </Button>
          </>
        }
      >
        <Card variant="figma-v01" className="ff-sheet-card ff-reminder-context-card">
          <div className="ff-reminder-student">
            <h3>{action.student.name}</h3>
            <span>{action.student.className}</span>
          </div>
          <dl className="ff-reminder-details">
            <div><dt>{isRetest ? '复测时间' : '干预时间'}</dt><dd>{formatActionDateTime(time)}</dd></div>
            <div><dt>地点</dt><dd>{location}</dd></div>
            {!isRetest ? (
              <div><dt>负责心理老师</dt><dd>{appointment!.responsiblePsychologist}</dd></div>
            ) : null}
          </dl>
        </Card>

        <Card variant="figma-v01" className="ff-sheet-card ff-requirement-card">
          <h3>心理老师提供的提醒要求</h3>
          <p>{requirement}</p>
        </Card>

        <Card variant="figma-v01" className="ff-sheet-card ff-reminder-form-card">
          <h3>选择提醒方式</h3>
          <FormField id={`${action.id}-method`} label="提醒方式" required error={fieldError}>
            <RadioGroup
              name={`${action.id}-method`}
              value={method}
              options={methodOptions}
              onChange={updateMethod}
            />
          </FormField>
          {method === 'other' ? (
            <FormField id={`${action.id}-other`} label="其他提醒方式" required>
              <Input
                id={`${action.id}-other`}
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
        </Card>
      </BottomSheet>

      <Dialog
        open={confirmOpen}
        title="确认已提醒学生"
        description={
          isRetest
            ? '本操作只记录提醒动作，不代表学生已经完成复测。'
            : '本操作只记录提醒动作，不代表该干预事项已经完成。'
        }
        cancelLabel="取消"
        confirmLabel="确认已提醒"
        submitting={submitting}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={() => void confirm()}
      >
        <dl className="ff-confirm-summary">
          <div><dt>学生</dt><dd>{action.student.name}</dd></div>
          <div><dt>安排时间</dt><dd>{formatActionDateTime(time)}</dd></div>
          <div><dt>提醒方式</dt><dd>{method === 'other' ? otherMethod : method ? methodLabels[method] : '未选择'}</dd></div>
        </dl>
        {submitError ? <p className="ff-dialog-error ff-text-danger">{submitError}</p> : null}
      </Dialog>
    </>
  );
}
