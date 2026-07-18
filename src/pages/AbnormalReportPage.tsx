import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { DraftSaveStatus } from '../components/business/DraftSaveStatus';
import { BottomActionBar } from '../components/layout/BottomActionBar';
import { AppIcon } from '../components/ui/AppIcon';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { ConfirmDialog } from '../components/ui/ConfirmDialog';
import { FormField } from '../components/ui/FormField';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/RadioGroup';
import { Select } from '../components/ui/Select';
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

type FieldErrors = Partial<Record<keyof AbnormalReportFormValues, string>>;

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
  return JSON.stringify(values) !== JSON.stringify(emptyAbnormalReportFormValues);
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
  if (values.supportActions.length > 300) {
    errors.supportActions = '已采取的支持不能超过 300 字。';
  }
  if (values.immediateSafetyConcern === null) {
    errors.immediateSafetyConcern = '请选择是否存在需要立即线下处理的安全风险。';
  }
  if (values.immediateSafetyConcern && !values.offlinePriorityAcknowledged) {
    errors.offlinePriorityAcknowledged = '请确认已知晓线下应急处置优先。';
  }
  return errors;
}

export function AbnormalReportPage({
  currentUser,
  students,
  now,
  loading,
  onBack,
  onSubmitted,
  onNavigationGuardChange,
  submitAbnormalReport,
}: {
  currentUser: DemoUser;
  students: StudentProfile[];
  now: string;
  loading: boolean;
  onBack: () => void;
  onSubmitted: (reportId: string) => void;
  onNavigationGuardChange: NavigationGuardChange;
  submitAbnormalReport: (
    input: AbnormalReportInput,
  ) => Promise<Result<AbnormalReport>>;
}) {
  const storedDraft = useMemo(
    () => loadAbnormalReportDraft(window.localStorage, currentUser.id),
    [currentUser.id],
  );
  const [values, setValues] = useState<AbnormalReportFormValues>(() => {
    if (!storedDraft) return { ...emptyAbnormalReportFormValues };
    const studentStillVisible = students.some(
      (student) => student.id === storedDraft.values.studentId,
    );
    return {
      ...storedDraft.values,
      studentId: studentStillVisible ? storedDraft.values.studentId : '',
    };
  });
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const requestIdRef = useRef<string | null>(null);
  const submittingRef = useRef(false);
  const dirty = isDirty(values);

  const saveDraft = useCallback(
    (updatedAt: string) =>
      saveAbnormalReportDraft(
        window.localStorage,
        currentUser.id,
        values,
        updatedAt,
      ),
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

  useEffect(
    () => () => {
      onNavigationGuardChange(null);
    },
    [onNavigationGuardChange],
  );

  const update = <K extends keyof AbnormalReportFormValues>(
    key: K,
    value: AbnormalReportFormValues[K],
  ) => {
    requestIdRef.current = null;
    setSubmitError('');
    setErrors((current) => ({ ...current, [key]: undefined }));
    setValues((current) => ({ ...current, [key]: value }));
  };

  const openSubmit = () => {
    const nextErrors = validate(values, students, now);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;
    setSubmitError('');
    setSubmitDialogOpen(true);
  };

  const submit = async () => {
    if (
      submittingRef.current ||
      loading ||
      values.immediateSafetyConcern === null
    ) {
      return;
    }
    submittingRef.current = true;
    setSubmitError('');
    const requestId =
      requestIdRef.current ??
      `abnormal-report-${currentUser.id}-${Date.now()}`;
    requestIdRef.current = requestId;
    const scene =
      values.scene === 'other'
        ? values.otherScene.trim()
        : sceneLabels[values.scene as ObservationScene];
    const result = await submitAbnormalReport({
      requestId,
      studentId: values.studentId,
      observedAt: new Date(values.observedAt).toISOString(),
      scene,
      facts: values.facts,
      supportActions: values.supportActions.trim() || undefined,
      immediateSafetyConcern: values.immediateSafetyConcern,
    });
    submittingRef.current = false;
    if (!result.ok) {
      setSubmitError(result.message);
      return;
    }
    removeAbnormalReportDraft(window.localStorage, currentUser.id);
    autoDraft.clearSavedDraft();
    onNavigationGuardChange(null);
    setSubmitDialogOpen(false);
    onSubmitted(result.data.id);
  };

  const selectedStudent = students.find(
    (student) => student.id === values.studentId,
  );
  const classLabels = Array.from(
    new Set(students.map((student) => student.className)),
  ).join('、');

  return (
    <div className="mvp-page mvp-report-page">
      <header className="mvp-page-header">
        <Button
          variant="secondary"
          size="icon"
          aria-label="返回首页"
          onClick={onBack}
        >
          <AppIcon name="arrowLeft" size={20} />
        </Button>
        <div>
          <span>提交观察线索</span>
          <h1>异常情况上报</h1>
        </div>
        <DraftSaveStatus status={autoDraft.status} savedAt={autoDraft.savedAt} />
      </header>

      <Card tone="soft">
        <CardHeader>
          <CardTitle>只记录事实，不进行风险判断</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="mvp-muted-copy">
            这条记录会提交给心理老师专业复核，不会自动形成正式预警或协作任务。
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">观察对象</span>
          <CardTitle>选择本人负责班级的学生</CardTitle>
        </CardHeader>
        <CardContent className="mvp-form-stack">
          <FormField
            label="选择学生"
            htmlFor="reportStudent"
            required
            error={errors.studentId}
          >
            <Select
              id="reportStudent"
              value={values.studentId}
              onChange={(event) => update('studentId', event.target.value)}
            >
              <option value="">请选择学生</option>
              {students.map((student) => (
                <option key={student.id} value={student.id}>
                  {student.name} · {student.gradeName} · {student.className}
                </option>
              ))}
            </Select>
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">什么时候、在哪里</span>
          <CardTitle>观察场景</CardTitle>
        </CardHeader>
        <CardContent className="mvp-form-stack">
          <FormField
            label="观察时间"
            htmlFor="reportObservedAt"
            required
            error={errors.observedAt}
            hint="观察时间不能晚于现在"
          >
            <Input
              id="reportObservedAt"
              type="datetime-local"
              value={values.observedAt}
              max={toLocalInputValue(now)}
              onChange={(event) => update('observedAt', event.target.value)}
            />
          </FormField>
          <FormField label="观察场景" required error={errors.scene}>
            <RadioGroup
              name="reportScene"
              value={values.scene}
              options={sceneOptions}
              onChange={(value) => update('scene', value)}
            />
          </FormField>
          {values.scene === 'other' ? (
            <FormField
              label="其他场景"
              htmlFor="reportOtherScene"
              required
              error={errors.otherScene}
            >
              <Input
                id="reportOtherScene"
                value={values.otherScene}
                maxLength={40}
                placeholder="例如：家访、校门口沟通"
                onChange={(event) => update('otherScene', event.target.value)}
              />
            </FormField>
          ) : null}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">你实际看到或听到了什么</span>
          <CardTitle>事实描述</CardTitle>
        </CardHeader>
        <CardContent className="mvp-form-stack">
          <FormField
            label="事实描述"
            htmlFor="reportFacts"
            required
            error={errors.facts}
            hint={`${values.facts.trim().length}/500 字`}
          >
            <Textarea
              id="reportFacts"
              value={values.facts}
              maxLength={500}
              rows={7}
              placeholder="请描述实际看到或听到的行为、发生时间和场景。"
              onChange={(event) => update('facts', event.target.value)}
            />
          </FormField>
          <div className="mvp-writing-guide">
            <strong>事实表达示例</strong>
            <p>
              7 月 16 日下午课堂提问时，该生连续三次没有回应；课后沟通时表示最近睡眠较少，讲话声音较轻。
            </p>
            <p>避免填写心理诊断、风险等级或人格评价。</p>
          </div>
          <FormField
            label="已采取的线下沟通或支持"
            htmlFor="reportSupport"
            error={errors.supportActions}
            hint={`${values.supportActions.length}/300 字，可选`}
          >
            <Textarea
              id="reportSupport"
              value={values.supportActions}
              maxLength={300}
              rows={4}
              placeholder="只记录已经发生的关心、沟通或支持"
              onChange={(event) => update('supportActions', event.target.value)}
            />
          </FormField>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <span className="mvp-card-kicker">是否需要立即线下处理</span>
          <CardTitle>安全风险确认</CardTitle>
        </CardHeader>
        <CardContent className="mvp-form-stack">
          <FormField
            label="是否存在需要立即线下处理的安全风险"
            required
            error={errors.immediateSafetyConcern}
          >
            <RadioGroup
              name="reportSafety"
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
              onChange={(value) =>
                update('immediateSafetyConcern', value === 'yes')
              }
            />
          </FormField>
          {values.immediateSafetyConcern ? (
            <div className="mvp-alert mvp-alert--danger" role="alert">
              <AppIcon name="alert" size={20} />
              <div>
                <p>
                  请优先按照学校现有线下应急流程进行当面报告或联系。提交本记录不能替代线下应急处置。
                </p>
                <label className="mvp-confirm-checkbox">
                  <input
                    type="checkbox"
                    checked={values.offlinePriorityAcknowledged}
                    onChange={(event) =>
                      update(
                        'offlinePriorityAcknowledged',
                        event.target.checked,
                      )
                    }
                  />
                  <span>我已知晓线下应急处置优先</span>
                </label>
                {errors.offlinePriorityAcknowledged ? (
                  <span className="ui-form-field__error">
                    {errors.offlinePriorityAcknowledged}
                  </span>
                ) : null}
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card tone="soft">
        <CardHeader>
          <span className="mvp-card-kicker">提交人确认</span>
          <CardTitle>提交人信息</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="mvp-detail-metrics">
            <div><dt>提交人</dt><dd>{currentUser.name} · 班主任</dd></div>
            <div><dt>负责范围</dt><dd>{classLabels || '当前负责班级'}</dd></div>
            <div><dt>当前选择</dt><dd>{selectedStudent ? `${selectedStudent.name} · ${selectedStudent.className}` : '尚未选择学生'}</dd></div>
          </dl>
        </CardContent>
      </Card>

      <BottomActionBar>
        <Button variant="secondary" fullWidth onClick={onBack}>返回</Button>
        <Button fullWidth disabled={loading} onClick={openSubmit}>
          提交观察线索
        </Button>
      </BottomActionBar>

      <ConfirmDialog
        open={submitDialogOpen}
        title="确认提交异常情况记录"
        description="提交后记录保持只读，并由心理老师进行专业复核。"
        confirmLabel={submitError ? '重试提交' : '确认提交'}
        submitting={loading}
        onCancel={() => !loading && setSubmitDialogOpen(false)}
        onConfirm={() => void submit()}
      >
        <dl className="mvp-confirm-summary">
          <div><dt>学生</dt><dd>{selectedStudent?.name ?? '未选择'}</dd></div>
          <div><dt>观察时间</dt><dd>{values.observedAt ? formatCompactDateTime(new Date(values.observedAt).toISOString()) : '未填写'}</dd></div>
          <div><dt>场景</dt><dd>{values.scene === 'other' ? values.otherScene : sceneLabels[values.scene as ObservationScene]}</dd></div>
          <div><dt>事实摘要</dt><dd>{values.facts.trim().slice(0, 90)}{values.facts.trim().length > 90 ? '…' : ''}</dd></div>
          <div><dt>即时安全风险</dt><dd>{values.immediateSafetyConcern ? '是，线下处置优先' : '否'}</dd></div>
        </dl>
        {values.immediateSafetyConcern ? (
          <div className="mvp-alert mvp-alert--danger" role="alert">
            <AppIcon name="alert" size={18} />
            <p>请先执行学校现有线下应急流程；提交事实记录不会自动报警、通知家长或形成风险等级。</p>
          </div>
        ) : null}
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
