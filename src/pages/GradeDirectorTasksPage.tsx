import { useRef, useState } from 'react';
import { MainContentPlate } from '../components/layout/PageFrame';
import { Badge } from '../components/ui/Badge';
import { Button as TaskButton } from '../components/ui/Button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { RadioGroup } from '../components/ui/RadioGroup';
import type { CurrentSupervisionInput, SupervisionRecord } from '../domain/feedback';
import type { Result } from '../domain/result';
import type { DemoUser } from '../domain/users';
import { BottomSheet } from '../features/factualFeedback/components/BottomSheet';
import { Button } from '../features/factualFeedback/components/Button';
import { Dialog } from '../features/factualFeedback/components/Dialog';
import { FormField } from '../features/factualFeedback/components/FormField';
import { Toast } from '../features/factualFeedback/components/Toast';
import { formatActionDateTime } from '../features/factualFeedback/feedbackPresentation';
import type { GradeDirectorSupervisionItem } from '../selectors/gradeDirectorSelectors';

const typeLabels = {
  feedback_request: '事实观察反馈',
  retest_reminder: '复测提醒',
  intervention_reminder: '待干预提醒',
} as const;

const methodOptions: Array<{ value: CurrentSupervisionInput['method']; label: string }> = [
  { value: 'in_person', label: '当面提醒' },
  { value: 'phone', label: '电话' },
  { value: 'message', label: '微信 / 消息' },
  { value: 'other', label: '其他' },
];

const methodLabels = Object.fromEntries(
  methodOptions.map((option) => [option.value, option.label]),
) as Record<CurrentSupervisionInput['method'], string>;

export function GradeDirectorTasksPage({ currentUser, items, loading, onSubmit }: {
  currentUser: DemoUser;
  items: GradeDirectorSupervisionItem[];
  loading: boolean;
  onSubmit: (sourceActionId: string, input: CurrentSupervisionInput) => Promise<Result<SupervisionRecord>>;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [toast, setToast] = useState('');
  const selected = items.find((item) => item.id === selectedId);
  const gradeName = items[0]?.student.gradeName ?? '高二';
  const directorName = `${currentUser.name.replace(/老师$/, '')}主任`;

  return <>
    <main className="ff-app ff-pending-page">
      <header className="ff-page-header"><h1>我的督办</h1></header>
      <section className="ff-greeting">
        <span className="ff-greeting__class-meta">{gradeName}</span>
        <div className="ff-greeting__content">
          <p className="ff-greeting__hero-title">{directorName}，您好</p>
          <strong>您有 {items.length} 个协作事项需要关注</strong>
        </div>
      </section>
      <MainContentPlate className="ff-pending-page__plate">
        <section className="ff-task-list" aria-label="督办事项">
          {loading && items.length === 0 ? <div className="ff-state-card" role="status">正在加载督办事项…</div> : null}
          {!loading && items.length === 0 ? <div className="ff-state-card"><h2>当前没有待督办事项</h2></div> : null}
          {items.map((item) => <SupervisionTaskCard key={item.id} item={item} onOpen={() => setSelectedId(item.id)} />)}
        </section>
      </MainContentPlate>
    </main>
    {selected ? (
      <SupervisionBottomSheet
        key={selected.id}
        item={selected}
        loading={loading}
        onClose={() => setSelectedId(null)}
        onCompleted={() => { setSelectedId(null); setToast('已完成督办'); }}
        onFailed={setToast}
        onSubmit={onSubmit}
      />
    ) : null}
    <Toast message={toast} onDismiss={() => setToast('')} />
  </>;
}

function SupervisionTaskCard({ item, onOpen }: { item: GradeDirectorSupervisionItem; onOpen: () => void }) {
  const overdue = item.kind === 'feedback_request' && item.status === 'overdue';
  return (
    <Card as="article" variant="figma-v01" className={`ff-task-card${overdue ? ' ff-task-card--overdue' : ''}`}>
      <CardHeader className="ff-task-card__top">
        <div className="ff-task-card__identity">
          <div className="ff-task-card__identity-row">
            <CardTitle>{item.student.name}</CardTitle>
            <span className="ff-task-card__type">{item.student.className}</span>
          </div>
        </div>
        <Badge designSystem="figma-v01" variant={overdue ? 'error' : 'neutral'}>
          {overdue ? '已超时' : item.latestRecord ? '已督办' : '待处理'}
        </Badge>
      </CardHeader>
      <CardContent>
        <p className="ff-task-card__purpose"><span>任务类型：</span>{typeLabels[item.kind]}</p>
        <p className="ff-task-card__purpose"><span>任务要求：</span>{item.requirement || '请及时查看并处理当前协作事项。'}</p>
        <p className="ff-task-card__purpose"><span>责任班主任：</span>{item.responsibleTeacher.name}</p>
      </CardContent>
      <CardFooter className="ff-task-card__footer">
        <p className={`ff-task-card__deadline${overdue ? ' ff-text-danger' : ''}`}>
          {item.kind === 'feedback_request' ? '截止时间' : '安排时间'}：{formatActionDateTime(item.actionAt)}
        </p>
        <TaskButton variant="inverse" size="xs" onClick={onOpen}>查看详情</TaskButton>
      </CardFooter>
    </Card>
  );
}

function SupervisionBottomSheet({ item, loading, onClose, onCompleted, onFailed, onSubmit }: {
  item: GradeDirectorSupervisionItem;
  loading: boolean;
  onClose: () => void;
  onCompleted: () => void;
  onFailed: (message: string) => void;
  onSubmit: (sourceActionId: string, input: CurrentSupervisionInput) => Promise<Result<SupervisionRecord>>;
}) {
  const [method, setMethod] = useState<CurrentSupervisionInput['method'] | ''>('');
  const [otherMethod, setOtherMethod] = useState('');
  const [fieldError, setFieldError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const requestIdRef = useRef<string | null>(null);

  const requestConfirm = () => {
    if (!method) { setFieldError('请选择督办方式。'); return; }
    if (method === 'other' && !otherMethod.trim()) { setFieldError('请填写其他督办方式。'); return; }
    setFieldError(''); setSubmitError(''); setConfirmOpen(true);
  };

  const confirm = async () => {
    if (!method || submitting || loading) return;
    setSubmitting(true);
    requestIdRef.current ??= `supervision-${item.id}-${Date.now()}`;
    const result = await onSubmit(item.id, {
      submissionRequestId: requestIdRef.current,
      method,
      otherMethod: method === 'other' ? otherMethod.trim() : undefined,
    });
    setSubmitting(false);
    if (!result.ok) { setSubmitError(result.message); onFailed(result.message); return; }
    setConfirmOpen(false);
    onCompleted();
  };

  return <>
    <BottomSheet open title="督办详情" onClose={onClose} footer={<>
      <Button variant="secondary" fullWidth disabled={submitting} onClick={onClose}>返回</Button>
      <Button fullWidth disabled={submitting || loading} onClick={requestConfirm}>确认已督办</Button>
    </>}>
      <Card variant="figma-v01" className="ff-sheet-card ff-reminder-context-card">
        <div className="ff-reminder-student"><h3>{item.student.name}</h3><span>{item.student.className}</span></div>
        <dl className="ff-reminder-details">
          <div><dt>责任人</dt><dd>{item.responsibleTeacher.name}</dd></div>
          <div><dt>协作对象</dt><dd>{item.student.name} · {item.student.className}</dd></div>
          <div><dt>当前状态</dt><dd>{item.status === 'overdue' ? '已超时' : '待处理'}</dd></div>
          <div><dt>任务类型</dt><dd>{typeLabels[item.kind]}</dd></div>
        </dl>
      </Card>
      <Card variant="figma-v01" className="ff-sheet-card ff-requirement-card"><h3>任务要求</h3><p>{item.requirement || '请提醒责任班主任及时查看并处理当前协作事项。'}</p></Card>
      <Card variant="figma-v01" className="ff-sheet-card"><h3>时间信息</h3><dl className="ff-reminder-details"><div><dt>创建时间</dt><dd>{formatActionDateTime(item.createdAt)}</dd></div><div><dt>{item.kind === 'feedback_request' ? '截止时间' : '安排时间'}</dt><dd>{formatActionDateTime(item.actionAt)}</dd></div></dl></Card>
      {item.latestRecord ? <Card variant="figma-v01" className="ff-sheet-card"><h3>督办记录</h3><dl className="ff-reminder-details"><div><dt>督办人</dt><dd>{item.latestRecord.supervisedByNameSnapshot}</dd></div><div><dt>对象</dt><dd>{item.responsibleTeacher.name}</dd></div><div><dt>事项</dt><dd>{typeLabels[item.kind]}</dd></div><div><dt>提醒方式</dt><dd>{item.latestRecord.otherMethod || methodLabels[item.latestRecord.method as CurrentSupervisionInput['method']] || item.latestRecord.method}</dd></div><div><dt>时间</dt><dd>{formatActionDateTime(item.latestRecord.createdAt)}</dd></div></dl></Card> : null}
      <Card variant="figma-v01" className="ff-sheet-card ff-reminder-form-card"><h3>督办方式</h3>
        <FormField id={`${item.id}-method`} label="督办方式" required error={fieldError}>
          <RadioGroup name={`${item.id}-method`} value={method} options={methodOptions} onChange={(value) => { requestIdRef.current = null; setMethod(value); setFieldError(''); setSubmitError(''); }} />
        </FormField>
        {method === 'other' ? <FormField id={`${item.id}-other`} label="其他督办方式" required><Input id={`${item.id}-other`} value={otherMethod} maxLength={40} placeholder="请简短说明督办方式" onChange={(event) => { requestIdRef.current = null; setOtherMethod(event.target.value); setFieldError(''); }} /></FormField> : null}
      </Card>
    </BottomSheet>
    <Dialog open={confirmOpen} title="确认已督办" description="本操作仅记录督办动作，不会代替班主任完成当前协作事项。" confirmLabel="确认已督办" submitting={submitting} onCancel={() => !submitting && setConfirmOpen(false)} onConfirm={() => void confirm()}>
      <dl className="ff-confirm-summary"><div><dt>学生</dt><dd>{item.student.name}</dd></div><div><dt>责任班主任</dt><dd>{item.responsibleTeacher.name}</dd></div><div><dt>任务类型</dt><dd>{typeLabels[item.kind]}</dd></div><div><dt>督办方式</dt><dd>{method === 'other' ? otherMethod : method ? methodLabels[method] : '未选择'}</dd></div></dl>
      {submitError ? <p className="ff-dialog-error ff-text-danger">{submitError}</p> : null}
    </Dialog>
  </>;
}
