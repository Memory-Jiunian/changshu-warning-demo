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
import { getTaskDisplayState } from '../../../selectors/taskSelectors';
import { useAutoSavedDraft } from '../../../state/useAutoSavedDraft';
import { Button } from '../../../components/ui/Button';
import { Card } from '../../../components/ui/Card';
import { Input } from '../../../components/ui/Input';
import { Textarea } from '../../../components/ui/Textarea';
import { formatFeedbackRemaining } from '../feedbackPresentation';
import {
  isFeedbackDirty,
  toLocalDateTimeValue,
  validateFeedback,
  type FeedbackFieldErrors,
} from '../feedbackValidation';
import { BottomSheet } from './BottomSheet';
import { Dialog } from './Dialog';
import { FormField } from './FormField';
import { HistoryAccordion } from './HistoryAccordion';

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
        title="填写观察反馈"
        onClose={close}
        footer={
          <>
            <Button
              variant="secondary"
              size="md"
              fullWidth
              disabled={submitting}
              onClick={close}
            >
              返回
            </Button>
            <Button
              variant="primary"
              size="md"
              fullWidth
              disabled={submitting}
              onClick={requestSubmit}
            >
              {submitting ? '提交中' : '提交反馈'}
            </Button>
          </>
        }
      >
        <Card variant="figma-v01" className="ff-sheet-card ff-task-context-card">
          <div className="ff-task-summary__title">
            <h3>{task.student.name}</h3>
            <p>{task.student.className}</p>
          </div>
          <div className="ff-task-context-card__meta">
            <p className="ff-task-context-card__status">
              当前状态：{task.status === 'returned' ? '待补充' : '待反馈'}
            </p>
            <p
              className={
                display.isOverdue
                  ? 'ff-task-context-card__remaining ff-text-danger'
                  : 'ff-task-context-card__remaining'
              }
            >
              {formatFeedbackRemaining(task, new Date(now))}
            </p>
            {task.dueAt ? (
              <p className="ff-task-context-card__deadline">
                反馈截止时间：
                {new Date(task.dueAt).toLocaleString('zh-CN', { hour12: false })}
              </p>
            ) : null}
          </div>
        </Card>

        <Card variant="figma-v01" className="ff-sheet-card ff-requirement-card">
          <h3>反馈要求</h3>
          <p>{task.purpose}</p>
        </Card>

        <HistoryAccordion records={records} />

        <section className="ff-feedback-form" aria-label="事实观察反馈表单">
          <FormField
            id="feedback-observed-at"
            label="请选择观察时间"
            required
            error={errors.observedAt}
          >
            <Input
              id="feedback-observed-at"
              designSystem="figma-v01"
              type="datetime-local"
              value={values.observedAt}
              max={toLocalDateTimeValue(now)}
              error={Boolean(errors.observedAt)}
              aria-describedby={errors.observedAt ? 'feedback-observed-at-error' : undefined}
              onChange={(event) => update('observedAt', event.target.value)}
            />
          </FormField>
          <FormField
            id="feedback-facts"
            label="请填写观察内容"
            required
            error={errors.facts}
            counter={`${values.facts.length} / 500`}
          >
            <Textarea
              id="feedback-facts"
              designSystem="figma-v01"
              minLength={20}
              maxLength={500}
              value={values.facts}
              placeholder="请描述实际看到或听到的行为、发生时间和场景"
              error={Boolean(errors.facts)}
              aria-describedby={errors.facts ? 'feedback-facts-error' : undefined}
              onChange={(event) => update('facts', event.target.value)}
            />
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
      />

      <Dialog
        open={failureOpen}
        title="提交失败，请重试"
        description="已经帮你自动保存草稿了"
        cancelLabel={null}
        confirmLabel="好的"
        submitting={submitting}
        onConfirm={() => setFailureOpen(false)}
      />
    </>
  );
}
