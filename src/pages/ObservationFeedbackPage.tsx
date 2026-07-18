import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DraftSaveStatus } from '../components/business/DraftSaveStatus';
import { ObservationRecordCard } from '../components/business/ObservationRecordCard';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { AppIcon } from '../components/ui/AppIcon';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/RadioGroup';
import { Textarea } from '../components/ui/Textarea';
import {
  emptyObservationFormValues,
  loadObservationDraft,
  removeObservationDraft,
  saveObservationDraft,
} from '../data/observationDraftStore';
import type {
  ObservationFormValues,
  ObservationInput,
  ObservationRecord,
  ObservationScene,
} from '../domain/feedback';
import type { Result } from '../domain/result';
import type { CollaborationTask } from '../domain/tasks';
import { formatCompactDateTime, taskTypeLabels } from '../selectors/homeSelectors';
import { getTaskObservationRecords } from '../selectors/taskSelectors';
import type { NavigationGuardChange } from '../state/navigationGuard';
import { useAutoSavedDraft } from '../state/useAutoSavedDraft';

type FieldErrors = Partial<Record<keyof ObservationFormValues, string>>;

const sceneOptions: Array<{ value: ObservationScene; label: string }> = [
  { value: 'classroom', label: '课堂' },
  { value: 'break', label: '课间' },
  { value: 'dormitory', label: '宿舍' },
  { value: 'activity', label: '活动' },
  { value: 'communication', label: '沟通' },
  { value: 'other', label: '其他' },
];

const sceneLabels = Object.fromEntries(sceneOptions.map((item) => [item.value, item.label])) as Record<ObservationScene, string>;

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function isDirty(values: ObservationFormValues) {
  return JSON.stringify(values) !== JSON.stringify(emptyObservationFormValues);
}

function validate(values: ObservationFormValues, now: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.observedAt) {
    errors.observedAt = '请选择观察时间。';
  } else if (new Date(values.observedAt).getTime() > new Date(now).getTime()) {
    errors.observedAt = '观察时间不能晚于现在。';
  }
  if (!values.scene) errors.scene = '请选择观察场景。';
  if (values.scene === 'other' && !values.otherScene.trim()) {
    errors.otherScene = '请补充具体观察场景。';
  }
  const factsLength = values.facts.trim().length;
  if (factsLength < 20 || factsLength > 500) {
    errors.facts = '事实观察需为 20–500 字。';
  }
  if (values.duration.trim().length > 50) {
    errors.duration = '持续时间请控制在 50 字以内。';
  }
  if (values.immediateSafetyConcern === null) {
    errors.immediateSafetyConcern = '请选择是否存在需要立即线下处理的安全风险。';
  }
  if (values.additionalNotes.length > 300) {
    errors.additionalNotes = '补充说明不能超过 300 字。';
  }
  return errors;
}

export function ObservationFeedbackPage({
  task,
  currentUserId,
  observations,
  now,
  loading,
  onBack,
  onSubmitted,
  onNavigationGuardChange,
  submitObservation,
  submitObservationRevision,
}: {
  task: CollaborationTask;
  currentUserId: string;
  observations: ObservationRecord[];
  now: string;
  loading: boolean;
  onBack: () => void;
  onSubmitted: (recordId: string) => void;
  onNavigationGuardChange: NavigationGuardChange;
  submitObservation: (taskId: string, input: ObservationInput) => Promise<Result<ObservationRecord>>;
  submitObservationRevision: (taskId: string, input: ObservationInput) => Promise<Result<ObservationRecord>>;
}) {
  const storedDraft = useMemo(
    () => loadObservationDraft(window.localStorage, currentUserId, task.id),
    [currentUserId, task.id],
  );
  const [values, setValues] = useState<ObservationFormValues>(
    () => storedDraft?.values ?? { ...emptyObservationFormValues },
  );
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const requestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const records = getTaskObservationRecords(observations, task.id);
  const revision = task.status === 'returned';
  const originalRecord = records[records.length - 1];
  const dirty = isDirty(values);

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

  useEffect(() => {
    if (!dirty) {
      onNavigationGuardChange(null);
      return;
    }
    onNavigationGuardChange({
      key: `observation:${currentUserId}:${task.id}`,
      dirty: true,
      saveStatus: autoDraft.status,
      savedAt: autoDraft.savedAt,
      retrySave: autoDraft.retrySave,
      discardDraft: autoDraft.discard,
    });
  }, [
    autoDraft.discard,
    autoDraft.retrySave,
    autoDraft.savedAt,
    autoDraft.status,
    currentUserId,
    dirty,
    onNavigationGuardChange,
    task.id,
  ]);

  useEffect(
    () => () => {
      onNavigationGuardChange(null);
    },
    [onNavigationGuardChange],
  );

  const update = <K extends keyof ObservationFormValues>(
    key: K,
    value: ObservationFormValues[K],
  ) => {
    requestIdRef.current = null;
    setSubmitError('');
    setErrors((current) => ({ ...current, [key]: undefined }));
    setValues((current) => ({ ...current, [key]: value }));
  };

  const openSubmit = () => {
    const nextErrors = validate(values, now);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitError('');
    setSubmitDialogOpen(true);
  };

  const submit = async () => {
    if (submittingRef.current || loading || values.immediateSafetyConcern === null) return;
    submittingRef.current = true;
    setSubmitError('');
    const requestId =
      requestIdRef.current ??
      `observation-${currentUserId}-${task.id}-${Date.now()}`;
    requestIdRef.current = requestId;
    const scene =
      values.scene === 'other'
        ? values.otherScene.trim()
        : sceneLabels[values.scene as ObservationScene];
    const input: ObservationInput = {
      requestId,
      observedAt: new Date(values.observedAt).toISOString(),
      scene,
      facts: values.facts,
      frequency: values.frequency || undefined,
      duration: values.duration.trim() || undefined,
      immediateSafetyConcern: values.immediateSafetyConcern,
      additionalNotes: values.additionalNotes.trim() || undefined,
    };
    const result = revision
      ? await submitObservationRevision(task.id, input)
      : await submitObservation(task.id, input);
    submittingRef.current = false;
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    removeObservationDraft(window.localStorage, currentUserId, task.id);
    autoDraft.clearSavedDraft();
    onNavigationGuardChange(null);
    setSubmitDialogOpen(false);
    onSubmitted(result.data.id);
  };

  return (
    <div className="mvp-page mvp-v2-page mvp-v2-feedback-page mvp-feedback-page">
      <header className="mvp-page-header mvp-v2-feedback-header">
        <Button variant="secondary" size="icon" aria-label="返回任务详情" onClick={onBack}>
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <span>{revision ? '退回任务' : '事实观察'}</span>
          <h1>{revision ? '补充反馈' : '填写观察反馈'}</h1>
        </div>
        <DraftSaveStatus status={autoDraft.status} savedAt={autoDraft.savedAt} />
      </header>

      <p className="mvp-form-context">
        {task.student.name} · {task.student.className} · {taskTypeLabels[task.type]}
      </p>

      {revision ? (
        <>
          <Card tone="warning">
            <CardHeader>
              <span className="mvp-card-kicker">本次需要补充</span>
              <CardTitle>心理老师退回说明</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mvp-task-purpose">{task.returnReason}</p>
              <p className="mvp-muted-copy">退回时间：{formatCompactDateTime(task.returnedAt)}</p>
            </CardContent>
          </Card>
          {originalRecord ? (
            <details className="mvp-disclosure">
              <summary>
                <span>
                  <strong>原反馈摘要</strong>
                  <small>{originalRecord.facts.slice(0, 64)}{originalRecord.facts.length > 64 ? '…' : ''}</small>
                </span>
                <span>查看原反馈</span>
              </summary>
              <div className="mvp-disclosure__content">
                <ObservationRecordCard record={originalRecord} />
              </div>
            </details>
          ) : null}
        </>
      ) : null}

      <section className="mvp-v2-form-surface" aria-label="观察内容">
        <div className="mvp-v2-form-group">
          <h2>时间与场景</h2>
          <FormField
            label="观察时间"
            htmlFor="observedAt"
            required
            error={errors.observedAt}
            hint="观察时间不能晚于现在"
          >
            <Input
              id="observedAt"
              type="datetime-local"
              value={values.observedAt}
              max={toLocalInputValue(now)}
              onChange={(event) => update('observedAt', event.target.value)}
            />
          </FormField>

          <FormField label="观察场景" required error={errors.scene}>
            <RadioGroup
              name="scene"
              value={values.scene}
              options={sceneOptions}
              onChange={(value) => update('scene', value)}
            />
          </FormField>
          {values.scene === 'other' ? (
            <FormField label="其他场景" htmlFor="otherScene" required error={errors.otherScene}>
              <Input
                id="otherScene"
                value={values.otherScene}
                maxLength={40}
                placeholder="例如：家访、校门口沟通"
                onChange={(event) => update('otherScene', event.target.value)}
              />
            </FormField>
          ) : null}
        </div>

        <div className="mvp-v2-form-group mvp-v2-form-group--primary">
          <h2>事实观察</h2>
          <FormField
            label="事实观察"
            htmlFor="facts"
            required
            error={errors.facts}
            hint={`${values.facts.trim().length}/500 字`}
          >
            <Textarea
              id="facts"
              value={values.facts}
              maxLength={500}
              rows={7}
              placeholder="请写明发生时间、场景和实际看到或听到的行为。"
              onChange={(event) => update('facts', event.target.value)}
            />
          </FormField>

          <p className="mvp-field-note">
            请描述实际看到或听到的行为、发生时间和场景，避免填写心理诊断或人格评价。
          </p>

          <details className="mvp-disclosure mvp-disclosure--compact">
            <summary>查看填写示例</summary>
            <div className="mvp-writing-guide">
              <ul>
                <li>写发生时间和具体场景</li>
                <li>写实际行为或原话</li>
                <li>写出现频率，避免诊断和人格评价</li>
              </ul>
              <p>7 月 15 日午休时独自趴在座位约 40 分钟，两次拒绝同学邀请，回应声音较小。</p>
            </div>
          </details>
        </div>

        <div className="mvp-v2-form-group">
          <h2>补充信息</h2>
          <FormField label="出现频率" error={errors.frequency}>
            <RadioGroup
              name="frequency"
              value={values.frequency}
              options={[
                { value: '首次', label: '首次' },
                { value: '偶尔', label: '偶尔' },
                { value: '多次', label: '多次' },
                { value: '持续', label: '持续' },
              ]}
              onChange={(value) => update('frequency', value)}
            />
          </FormField>

          <FormField label="持续时间" htmlFor="duration" error={errors.duration} hint="可选，50 字以内">
            <Input
              id="duration"
              value={values.duration}
              maxLength={50}
              placeholder="例如：约 40 分钟、近 3 天"
              onChange={(event) => update('duration', event.target.value)}
            />
          </FormField>

          <FormField
            label="补充说明"
            htmlFor="additionalNotes"
            error={errors.additionalNotes}
            hint={`${values.additionalNotes.length}/300 字，可选`}
          >
            <Textarea
              id="additionalNotes"
              value={values.additionalNotes}
              maxLength={300}
              rows={4}
              placeholder="补充与本次事实观察相关的信息"
              onChange={(event) => update('additionalNotes', event.target.value)}
            />
          </FormField>
        </div>

        <div className="mvp-v2-form-group">
          <h2>即时安全风险</h2>
          <FormField
            label="是否存在需要立即线下处理的安全风险"
            required
            error={errors.immediateSafetyConcern}
          >
            <RadioGroup
              name="safety"
              value={
                values.immediateSafetyConcern === null
                  ? ''
                  : values.immediateSafetyConcern
                    ? 'yes'
                    : 'no'
              }
              options={[
                { value: 'yes', label: '是' },
                { value: 'no', label: '否' },
              ]}
              onChange={(value) => update('immediateSafetyConcern', value === 'yes')}
            />
          </FormField>

          {values.immediateSafetyConcern ? (
            <div className="mvp-alert mvp-alert--danger" role="alert">
              <AppIcon name="alert" size={20} />
              <p>请优先按照学校现有线下应急流程进行当面报告或联系。提交本记录不能替代线下应急处置。</p>
            </div>
          ) : null}
        </div>
      </section>

      <BottomActionBar>
        <Button variant="secondary" fullWidth onClick={onBack}>返回</Button>
        <Button fullWidth disabled={loading} onClick={openSubmit}>
          {revision ? '提交补充反馈' : '提交观察反馈'}
        </Button>
      </BottomActionBar>

      <ConfirmDialog
        open={submitDialogOpen}
        title={revision ? '确认提交补充反馈' : '确认提交观察反馈'}
        description="提交后本条记录将保持只读，请核对关键内容。"
        confirmLabel={submitError ? '重试提交' : revision ? '确认补充' : '确认提交'}
        submitting={loading}
        onCancel={() => !loading && setSubmitDialogOpen(false)}
        onConfirm={() => void submit()}
      >
        <dl className="mvp-confirm-summary">
          <div><dt>学生</dt><dd>{task.student.name}</dd></div>
          <div>
            <dt>观察时间</dt>
            <dd>
              {values.observedAt
                ? formatCompactDateTime(new Date(values.observedAt).toISOString())
                : '未填写'}
            </dd>
          </div>
          <div><dt>场景</dt><dd>{values.scene === 'other' ? values.otherScene : sceneLabels[values.scene as ObservationScene]}</dd></div>
          <div><dt>事实摘要</dt><dd>{values.facts.trim().slice(0, 90)}{values.facts.trim().length > 90 ? '…' : ''}</dd></div>
          <div><dt>安全风险</dt><dd>{values.immediateSafetyConcern ? '是，需要先线下处置' : '否'}</dd></div>
        </dl>
        {submitError ? (
          <div className="mvp-alert mvp-alert--danger" role="alert">
            <AppIcon name="alert" size={18} />
            <p>{submitError}。表单和草稿均已保留，可直接重试。</p>
          </div>
        ) : null}
      </ConfirmDialog>

    </div>
  );
}
