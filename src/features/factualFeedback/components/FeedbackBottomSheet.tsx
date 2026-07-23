import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  emptyObservationFormValues,
  loadObservationDraft,
  removeObservationDraft,
  saveObservationDraft,
} from '../../../data/observationDraftStore';
import type {
  ObservationFormValues,
  ObservationInput,
  ObservationRecord,
} from '../../../domain/feedback';
import type { Result } from '../../../domain/result';
import type { CollaborationTask } from '../../../domain/tasks';
import { formatCompactDateTime } from '../../../selectors/homeSelectors';
import {
  formatTaskDeadline,
  getTaskDisplayState,
} from '../../../selectors/taskSelectors';
import { useAutoSavedDraft } from '../../../state/useAutoSavedDraft';
import {
  isFeedbackDirty,
  toLocalDateTimeValue,
  validateFeedback,
  type FeedbackFieldErrors,
} from '../feedbackValidation';
import { BottomSheet } from './BottomSheet';
import { Button } from './Button';
import { Dialog } from './Dialog';
import { FormField } from './FormField';
import { HistoryAccordion } from './HistoryAccordion';
import { StatusBadge } from './StatusBadge';

function draftMeta(status: 'idle' | 'saving' | 'saved' | 'error', savedAt?: string) {
  if (status === 'saving') return '正在自动保存';
  if (status === 'saved' && savedAt) {
    return `草稿已保存 ${new Date(savedAt).toLocaleTimeString('zh-CN', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    })}`;
  }
  if (status === 'error') return '草稿保存失败';
  return '填写后自动保存';
}

export function FeedbackBottomSheet({
  task,
  records,
  currentUserId,
  now,
  onClose,
  onDraftSaved,
  onSubmitted,
  submitObservation,
  submitObservationRevision,
}: {
  task: CollaborationTask;
  records: ObservationRecord[];
  currentUserId: string;
  now: string;
  onClose: () => void;
  onDraftSaved: () => void;
  onSubmitted: (record: ObservationRecord) => void;
  submitObservation: (
    taskId: string,
    input: ObservationInput,
  ) => Promise<Result<ObservationRecord>>;
  submitObservationRevision: (
    taskId: string,
    input: ObservationInput,
  ) => Promise<Result<ObservationRecord>>;
}) {
  const storedDraft = useMemo(
    () => loadObservationDraft(window.localStorage, currentUserId, task.id),
    [currentUserId, task.id],
  );
  const [values, setValues] = useState<ObservationFormValues>(
    () => storedDraft?.values ?? { ...emptyObservationFormValues },
  );
  const [errors, setErrors] = useState<FeedbackFieldErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [failureOpen, setFailureOpen] = useState(false);
  const [failureMessage, setFailureMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string | null>(null);
  const dirty = isFeedbackDirty(values);
  const display = getTaskDisplayState(task, new Date(now));

  const saveDraft = useCallback(
    (updatedAt: string) =>
      saveObservationDraft(
        window.localStorage,
        currentUserId,
        task.id,
        values,
        updatedAt,
      ),
    [currentUserId, task.id, values],
  );
  const clearDraft = useCallback(() => {
    removeObservationDraft(window.localStorage, currentUserId, task.id);
  }, [currentUserId, task.id]);
  const autoDraft = useAutoSavedDraft({
    dirty,
    initialSavedAt: storedDraft?.updatedAt,
    save: saveDraft,
    clear: clearDraft,
  });

  const update = <K extends keyof ObservationFormValues>(
    key: K,
    value: ObservationFormValues[K],
  ) => {
    requestIdRef.current = null;
    setErrors((current) => ({ ...current, [key]: undefined }));
    setValues((current) => ({ ...current, [key]: value }));
  };

  const scrollToFirstError = () => {
    window.requestAnimationFrame(() => {
      const firstError = document.querySelector<HTMLElement>(
        '.ff-sheet__content [data-error="true"]',
      );
      firstError?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  };

  const requestSubmit = () => {
    const nextErrors = validateFeedback(values, now);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      scrollToFirstError();
      return;
    }
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (submitting) return;
    setSubmitting(true);
    setFailureOpen(false);
    const requestId =
      requestIdRef.current ??
      `factual-feedback-${currentUserId}-${task.id}-${Date.now()}`;
    requestIdRef.current = requestId;
    const input: ObservationInput = {
      requestId,
      observedAt: new Date(values.observedAt).toISOString(),
      scene: '协作任务指定观察场景',
      facts: values.facts.trim(),
      immediateSafetyConcern: false,
    };
    const result =
      task.status === 'returned'
        ? await submitObservationRevision(task.id, input)
        : await submitObservation(task.id, input);
    setSubmitting(false);
    if (!result.ok) {
      setConfirmOpen(false);
      setFailureMessage(result.message);
      setFailureOpen(true);
      return;
    }
    clearDraft();
    autoDraft.clearSavedDraft();
    setConfirmOpen(false);
    onSubmitted(result.data);
  };

  const close = () => {
    if (dirty) {
      const saved = saveDraft(new Date().toISOString());
      if (saved.ok) onDraftSaved();
    }
    onClose();
  };

  useEffect(() => {
    if (!task.id) return;
    setErrors({});
  }, [task.id]);

  return (
    <>
      <BottomSheet
        open
        title="反馈详情"
        meta={<span className="ff-draft-meta">{draftMeta(autoDraft.status, autoDraft.savedAt)}</span>}
        onClose={close}
        footer={
          <>
            <Button variant="secondary" fullWidth disabled={submitting} onClick={close}>
              返回
            </Button>
            <Button fullWidth disabled={submitting} onClick={requestSubmit}>
              {submitting ? '提交中' : '提交反馈'}
            </Button>
          </>
        }
      >
        <section className="ff-sheet-section ff-task-summary">
          <div className="ff-task-summary__title">
            <div>
              <h3>{task.student.name}</h3>
              <p>{task.student.gradeName} · {task.student.className}</p>
            </div>
            <StatusBadge display={display} />
          </div>
          <dl className="ff-summary-grid">
            <div>
              <dt>当前状态</dt>
              <dd>{display.label}</dd>
            </div>
            <div>
              <dt>{display.isOverdue ? '超时情况' : '反馈截止'}</dt>
              <dd className={display.isOverdue ? 'ff-text-danger' : ''}>
                {formatTaskDeadline(task, new Date(now))}
              </dd>
            </div>
          </dl>
          {display.isOverdue ? (
            <p className="ff-overdue-notice">任务已超时，仍可继续提交事实反馈。</p>
          ) : null}
        </section>

        <section className="ff-sheet-section">
          <h3>请求内容</h3>
          <p>{task.purpose}</p>
          {task.observationFocus?.length ? (
            <ul className="ff-focus-list">
              {task.observationFocus.map((item) => <li key={item}>{item}</li>)}
            </ul>
          ) : null}
        </section>

        <HistoryAccordion records={records} />

        <section className="ff-sheet-section ff-feedback-form" aria-label="事实观察反馈表单">
          <h3>{task.status === 'returned' ? '补充事实观察' : '填写事实观察'}</h3>
          {task.status === 'returned' && task.returnReason ? (
            <div className="ff-return-notice">
              <strong>需要补充</strong>
              <p>{task.returnReason}</p>
            </div>
          ) : null}
          <FormField
            id="feedback-observed-at"
            label="请选择观察时间"
            required
            error={errors.observedAt}
          >
            <input
              id="feedback-observed-at"
              className="ff-input"
              type="datetime-local"
              value={values.observedAt}
              max={toLocalDateTimeValue(now)}
              aria-describedby={errors.observedAt ? 'feedback-observed-at-error' : undefined}
              onChange={(event) => update('observedAt', event.target.value)}
            />
          </FormField>
          <FormField
            id="feedback-facts"
            label="请填写观察内容"
            required
            error={errors.facts}
            hint="请记录实际看到或听到的事实，不需要进行心理判断。"
          >
            <textarea
              id="feedback-facts"
              className="ff-textarea"
              rows={6}
              maxLength={500}
              value={values.facts}
              aria-describedby={errors.facts ? 'feedback-facts-error' : undefined}
              placeholder="例如：午休时独自在座位约 30 分钟，两次拒绝同学邀请，能简短回应老师询问。"
              onChange={(event) => update('facts', event.target.value)}
            />
            <span className="ff-character-count">{values.facts.trim().length}/500</span>
          </FormField>
        </section>
      </BottomSheet>

      <Dialog
        open={confirmOpen}
        title="确认提交反馈？"
        description="提交后记录将交由心理老师查看，请确认内容为实际观察事实。"
        confirmLabel="确认提交"
        submitting={submitting}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={() => void submit()}
      >
        <dl className="ff-confirm-summary">
          <div>
            <dt>学生</dt>
            <dd>{task.student.name} · {task.student.className}</dd>
          </div>
          <div>
            <dt>观察时间</dt>
            <dd>
              {values.observedAt
                ? formatCompactDateTime(new Date(values.observedAt).toISOString())
                : '未填写'}
            </dd>
          </div>
          <div>
            <dt>事实摘要</dt>
            <dd>{values.facts.trim().slice(0, 72)}{values.facts.trim().length > 72 ? '…' : ''}</dd>
          </div>
        </dl>
      </Dialog>

      <Dialog
        open={failureOpen}
        title="提交失败"
        description="内容和草稿均已保留，请检查后重试。"
        cancelLabel="稍后再试"
        confirmLabel="重新提交"
        submitting={submitting}
        onCancel={() => setFailureOpen(false)}
        onConfirm={() => void submit()}
      >
        <p className="ff-dialog-error" role="alert">{failureMessage}</p>
      </Dialog>
    </>
  );
}
