import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/RadioGroup';
import { SelectMenu } from '../components/ui/SelectMenu';
import { Textarea } from '../components/ui/Textarea';
import {
  emptyAbnormalReportFormValues,
  loadAbnormalReportDraft,
  removeAbnormalReportDraft,
  saveAbnormalReportDraft,
} from '../data/abnormalReportDraftStore';
import type {
  AbnormalReport,
  AbnormalReportFormValues,
  AbnormalReportInput,
  ObservationScene,
} from '../domain/feedback';
import type { Result } from '../domain/result';
import type { StudentProfile } from '../domain/students';
import type { DemoUser } from '../domain/users';
import { formatCompactDateTime } from '../selectors/homeSelectors';
import type { NavigationGuardChange } from '../state/navigationGuard';
import { useAutoSavedDraft } from '../state/useAutoSavedDraft';
import { BottomSheet } from '../features/factualFeedback/components/BottomSheet';
import { Dialog } from '../features/factualFeedback/components/Dialog';
import { FormField } from '../features/factualFeedback/components/FormField';

type FieldErrors = Partial<
  Record<'studentId' | 'observedAt' | 'scene' | 'otherScene' | 'facts', string>
>;

const sceneOptions: Array<{ value: ObservationScene; label: string }> = [
  { value: 'classroom', label: '课堂' },
  { value: 'break', label: '课间' },
  { value: 'dormitory', label: '宿舍' },
  { value: 'activity', label: '活动' },
  { value: 'communication', label: '沟通' },
  { value: 'other', label: '其他' },
];

const sceneLabels = Object.fromEntries(
  sceneOptions.map((item) => [item.value, item.label]),
) as Record<ObservationScene, string>;

function toLocalInputValue(value: string) {
  const date = new Date(value);
  const shifted = new Date(date.getTime() - date.getTimezoneOffset() * 60_000);
  return shifted.toISOString().slice(0, 16);
}

function isDirty(values: AbnormalReportFormValues) {
  return (
    values.studentId !== '' ||
    values.observedAt !== '' ||
    values.scene !== '' ||
    values.otherScene !== '' ||
    values.facts !== ''
  );
}

function validate(
  values: AbnormalReportFormValues,
  students: StudentProfile[],
  now: string,
): FieldErrors {
  const errors: FieldErrors = {};
  if (!values.studentId || !students.some((student) => student.id === values.studentId)) {
    errors.studentId = '请选择本人负责班级中的学生。';
  }
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
    errors.facts = '事实描述需为 20–500 字。';
  }
  return errors;
}

const noopNavigationGuard: NavigationGuardChange = () => undefined;

export function AbnormalReportPage({
  currentUser,
  students,
  now,
  loading,
  onBack,
  onNavigationGuardChange = noopNavigationGuard,
  submitAbnormalReport,
}: {
  currentUser: DemoUser;
  students: StudentProfile[];
  now: string;
  loading: boolean;
  onBack: () => void;
  onNavigationGuardChange?: NavigationGuardChange;
  submitAbnormalReport: (
    input: AbnormalReportInput,
  ) => Promise<Result<AbnormalReport>>;
}) {
  const storedDraft = useMemo(
    () => loadAbnormalReportDraft(window.localStorage, currentUser.id),
    [currentUser.id],
  );
  const [values, setValues] = useState<AbnormalReportFormValues>(() => {
    const restored = storedDraft?.values ?? emptyAbnormalReportFormValues;
    return {
      ...emptyAbnormalReportFormValues,
      studentId: students.some((student) => student.id === restored.studentId)
        ? restored.studentId
        : '',
      observedAt: restored.observedAt,
      scene: restored.scene,
      otherScene: restored.otherScene,
      facts: restored.facts,
    };
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedReport, setSubmittedReport] = useState<AbnormalReport | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string | null>(null);
  const dirty = !submittedReport && isDirty(values);

  const saveDraft = useCallback(
    (updatedAt: string) =>
      saveAbnormalReportDraft(window.localStorage, currentUser.id, values, updatedAt),
    [currentUser.id, values],
  );
  const clearDraft = useCallback(() => {
    removeAbnormalReportDraft(window.localStorage, currentUser.id);
  }, [currentUser.id]);
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
      key: `abnormal-report:${currentUser.id}`,
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
    currentUser.id,
    dirty,
    onNavigationGuardChange,
  ]);

  useEffect(() => () => onNavigationGuardChange(null), [onNavigationGuardChange]);

  const update = <K extends keyof AbnormalReportFormValues>(
    key: K,
    value: AbnormalReportFormValues[K],
  ) => {
    requestIdRef.current = null;
    setSubmitError('');
    setErrors((current) => ({ ...current, [key]: undefined }));
    setValues((current) => ({ ...current, [key]: value }));
  };

  const close = () => {
    if (dirty) saveDraft(new Date().toISOString());
    onBack();
  };

  const requestSubmit = () => {
    const nextErrors = validate(values, students, now);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitError('');
    setConfirmOpen(true);
  };

  const submit = async () => {
    if (submitting || loading) return;
    setSubmitting(true);
    const requestId =
      requestIdRef.current ?? `abnormal-report-${currentUser.id}-${Date.now()}`;
    requestIdRef.current = requestId;
    const scene = values.scene === 'other'
      ? values.otherScene.trim()
      : sceneLabels[values.scene as ObservationScene];
    const result = await submitAbnormalReport({
      requestId,
      studentId: values.studentId,
      observedAt: new Date(values.observedAt).toISOString(),
      scene,
      facts: values.facts.trim(),
      immediateSafetyConcern: false,
    });
    setSubmitting(false);
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    clearDraft();
    autoDraft.clearSavedDraft();
    onNavigationGuardChange(null);
    setConfirmOpen(false);
    setSubmittedReport(result.data);
  };

  const selectedStudent = students.find((student) => student.id === values.studentId);
  const studentOptions = students.map((student) => ({
    value: student.id,
    label: `${student.name} · ${student.className}`,
  }));

  return (
    <>
      <BottomSheet
        open
        title="异常情况上报"
        onClose={close}
        footer={
          <>
            <Button variant="secondary" fullWidth disabled={submitting} onClick={close}>
              返回
            </Button>
            <Button fullWidth disabled={submitting || loading} onClick={requestSubmit}>
              提交观察线索
            </Button>
          </>
        }
      >
        <Card variant="figma-v01" className="ff-sheet-card ff-report-sheet-form">
          <FormField id="reportStudent" label="选择学生" required error={errors.studentId}>
            <SelectMenu
              id="reportStudent"
              value={values.studentId}
              options={studentOptions}
              placeholder="请选择学生"
              required
              error={Boolean(errors.studentId)}
              aria-describedby={errors.studentId ? 'reportStudent-error' : undefined}
              showDisabledSection={false}
              onValueChange={(value) => update('studentId', value)}
            />
          </FormField>
          <FormField id="reportObservedAt" label="观察时间" required error={errors.observedAt}>
            <Input
              id="reportObservedAt"
              designSystem="figma-v01"
              type="datetime-local"
              value={values.observedAt}
              max={toLocalInputValue(now)}
              error={Boolean(errors.observedAt)}
              onChange={(event) => update('observedAt', event.target.value)}
            />
          </FormField>
          <FormField id="reportScene" label="观察场景" required error={errors.scene}>
            <RadioGroup
              name="reportScene"
              value={values.scene}
              options={sceneOptions}
              onChange={(value) => update('scene', value)}
            />
          </FormField>
          {values.scene === 'other' ? (
            <FormField id="reportOtherScene" label="其他场景" required error={errors.otherScene}>
              <Input
                id="reportOtherScene"
                designSystem="figma-v01"
                value={values.otherScene}
                maxLength={40}
                placeholder="请说明具体场景"
                error={Boolean(errors.otherScene)}
                onChange={(event) => update('otherScene', event.target.value)}
              />
            </FormField>
          ) : null}
          <FormField
            id="reportFacts"
            label="事实描述"
            required
            error={errors.facts}
            counter={`${values.facts.length} / 500`}
          >
            <Textarea
              id="reportFacts"
              designSystem="figma-v01"
              value={values.facts}
              minLength={20}
              maxLength={500}
              placeholder="请描述实际看到或听到的行为、发生时间和场景"
              error={Boolean(errors.facts)}
              onChange={(event) => update('facts', event.target.value)}
            />
          </FormField>
        </Card>
      </BottomSheet>

      <Dialog
        open={confirmOpen}
        title="确认提交异常情况"
        description="提交后将由心理老师进行后续专业复核。"
        cancelLabel="取消"
        confirmLabel="确认提交"
        submitting={submitting}
        onCancel={() => !submitting && setConfirmOpen(false)}
        onConfirm={() => void submit()}
      >
        <dl className="ff-confirm-summary">
          <div><dt>学生</dt><dd>{selectedStudent?.name ?? '未选择'}</dd></div>
          <div><dt>观察时间</dt><dd>{values.observedAt ? formatCompactDateTime(new Date(values.observedAt).toISOString()) : '未填写'}</dd></div>
          <div><dt>场景</dt><dd>{values.scene === 'other' ? values.otherScene : sceneLabels[values.scene as ObservationScene]}</dd></div>
        </dl>
        {submitError ? <p className="ff-dialog-error ff-text-danger">{submitError}</p> : null}
      </Dialog>

      <Dialog
        open={Boolean(submittedReport)}
        title="异常情况已提交"
        description="心理老师将根据本次上报信息进行后续专业复核。"
        cancelLabel={null}
        confirmLabel="返回我的待办"
        onConfirm={onBack}
      >
        {submittedReport ? (
          <dl className="ff-confirm-summary ff-report-success-summary">
            <div><dt>提交时间</dt><dd>{formatCompactDateTime(submittedReport.submittedAt)}</dd></div>
            <div><dt>记录编号</dt><dd>{submittedReport.id}</dd></div>
          </dl>
        ) : null}
      </Dialog>
    </>
  );
}
