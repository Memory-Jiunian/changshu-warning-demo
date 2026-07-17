import type { ObservationRecord, SupervisionRecord } from '../domain/feedback';
import type { CollaborationTask, WarningStatus } from '../domain/tasks';
import type { UserRole } from '../domain/users';
import type {
  AttentionLevel,
  FollowUpRecord,
  HandlingResult,
  HandlingTimelineItem,
  LegacyStatusKey,
  WarningTask,
} from '../mockData';
import { getTaskDisplayState } from '../selectors/taskSelectors';
import type { DemoSnapshot } from './demoRepository';

// TODO Phase 2/3: remove legacy adapter after page migration.

function pad(value: number) {
  return String(value).padStart(2, '0');
}

function formatTime(value: string) {
  const date = new Date(value);
  return `${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

function attentionFromUrgency(urgency: CollaborationTask['urgency']): AttentionLevel {
  if (urgency === 'urgent') return '重点关注';
  if (urgency === 'important') return '持续关注';
  return '一般关注';
}

function resultFromWarningStatus(status?: WarningStatus): HandlingResult {
  if (status === 'closed') return '已闭环';
  if (status === 'pending_retest') return '复测待安排';
  if (status === 'referral') return '转介中';
  return '持续关注';
}

function typeLabel(task: CollaborationTask) {
  const labels: Record<CollaborationTask['type'], string> = {
    default_observation: '观察任务',
    additional_feedback: '补充反馈',
    feedback_revision: '补充反馈',
    retest_reminder: '复测提醒',
    grade_supervision: '督办事项',
  };
  return labels[task.type];
}

function statusView(task: CollaborationTask, now: Date): {
  status: string;
  statusKey: LegacyStatusKey;
  nextAction: string;
} {
  const display = getTaskDisplayState(task, now);
  if (task.status === 'cancelled') return { status: '已取消', statusKey: 'closed', nextAction: '查看取消原因' };
  if (task.status === 'completed') return { status: '已完成', statusKey: 'closed', nextAction: '查看历史记录' };
  if (task.status === 'submitted') {
    return { status: '已反馈待确认', statusKey: 'pendingCounselorConfirm', nextAction: '查看已提交反馈' };
  }
  if (task.status === 'returned') {
    return {
      status: display.isOverdue ? '需补充 · 逾期' : '需补充',
      statusKey: display.isOverdue ? 'overdue' : 'waitingFeedback',
      nextAction: '补充观察反馈',
    };
  }
  if (task.type === 'retest_reminder') {
    return { status: '复测提醒', statusKey: 'retestPending', nextAction: '确认已提醒学生' };
  }
  if (display.isOverdue) return { status: '逾期未更新', statusKey: 'overdue', nextAction: '尽快反馈' };
  return { status: '待观察反馈', statusKey: 'waitingFeedback', nextAction: '填写观察反馈' };
}

function recordText(record: ObservationRecord) {
  const segments = [
    `观察时间：${formatTime(record.observedAt)}`,
    `观察场景：${record.scene}`,
    `事实描述：${record.facts}`,
  ];
  if (record.frequency) segments.push(`发生频率：${record.frequency}`);
  if (record.duration) segments.push(`持续时间：${record.duration}`);
  if (record.impact) segments.push(`影响程度：${record.impact}`);
  if (record.supportActions?.length) segments.push(`已采取措施：${record.supportActions.join('、')}`);
  segments.push(`需要立即线下处理：${record.immediateSafetyConcern ? '是' : '否'}`);
  return segments.join('；');
}

function toFollowUpRecord(
  record: ObservationRecord,
  userName: string,
  task: CollaborationTask,
): FollowUpRecord {
  return {
    by: userName,
    role: '班主任',
    time: formatTime(record.submittedAt),
    text: recordText(record),
    tag: task.status === 'returned' ? '待补充' : task.status === 'submitted' ? '已反馈待确认' : '已完成',
  };
}

function toTimeline(
  task: CollaborationTask,
  observations: ObservationRecord[],
  supervisionRecords: SupervisionRecord[],
): HandlingTimelineItem[] {
  const items: HandlingTimelineItem[] = [
    {
      id: `created-${task.id}`,
      time: formatTime(task.createdAt),
      role: '系统',
      action: '小程序分发协作任务',
      status: '待处理',
      note: task.purpose,
      audience: ['all'],
    },
  ];

  observations.forEach((record) => {
    items.push({
      id: record.id,
      time: formatTime(record.submittedAt),
      role: '班主任',
      action: record.revisionOfRecordId ? '班主任提交补充反馈' : '班主任提交观察反馈',
      status: '已提交',
      note: '新增一条事实观察记录，历史记录保持只读。',
      audience: ['all'],
    });
  });

  supervisionRecords.forEach((record) => {
    items.push({
      id: record.id,
      time: formatTime(record.createdAt),
      role: '年级主任',
      action: '年级主任记录督办',
      status: '已留痕',
      note: record.summary,
      audience: ['director', 'counselor'],
    });
  });

  if (task.returnedAt && task.returnReason) {
    items.push({
      id: `returned-${task.id}`,
      time: formatTime(task.returnedAt),
      role: '管理终端',
      action: '反馈退回补充',
      status: '待补充',
      note: task.returnReason,
      audience: ['all'],
    });
  }
  if (task.cancelledAt) {
    items.push({
      id: `cancelled-${task.id}`,
      time: formatTime(task.cancelledAt),
      role: '管理终端',
      action: '任务取消',
      status: '已取消',
      note: task.cancelReason ?? '任务已取消',
      audience: ['all'],
    });
  }
  if (task.completedAt) {
    items.push({
      id: `completed-${task.id}`,
      time: formatTime(task.completedAt),
      role: '系统',
      action: '协作任务完成',
      status: '已完成',
      note: '协作任务已结束；专业主处置状态仍由管理终端维护。',
      audience: ['all'],
    });
  }

  return items.sort((left, right) => left.time.localeCompare(right.time));
}

function userName(snapshot: DemoSnapshot, userId: string) {
  return snapshot.users.find((user) => user.id === userId)?.name ?? '未分配';
}

function visibleStudentName(role: UserRole, task: CollaborationTask) {
  return role === 'grade_director' ? '脱敏对象' : task.student.name;
}

export function toLegacyWarningTasks(snapshot: DemoSnapshot): WarningTask[] {
  const now = new Date(snapshot.now);
  const psychologist = snapshot.users.find((user) => user.role === 'psychologist');

  return snapshot.tasks.map((task) => {
    const display = getTaskDisplayState(task, now);
    const legacyStatus = statusView(task, now);
    const observations = snapshot.observations.filter((record) => record.taskId === task.id);
    const supervisionRecords = snapshot.supervisionRecords.filter((record) => record.taskId === task.id);
    const owner = userName(snapshot, task.assigneeId);
    const result = resultFromWarningStatus(task.warningStatusSnapshot);

    return {
      id: task.id,
      student: visibleStudentName(snapshot.currentUser.role, task),
      maskedStudent: `${task.student.className} · 脱敏对象 ${task.id.slice(-2)}`,
      className: task.student.className,
      grade: task.student.gradeName,
      attention: attentionFromUrgency(task.urgency),
      status: legacyStatus.status,
      statusKey: legacyStatus.statusKey,
      result,
      type: typeLabel(task),
      owner,
      counselor: psychologist?.name ?? '心理老师',
      deadline: display.deadlineLabel,
      source: task.purpose,
      aiClueSummary:
        snapshot.currentUser.role === 'psychologist'
          ? '仅展示协作进度摘要；完整线索、测评和专业研判请前往管理终端查看。'
          : '',
      desensitizedFlow: '当前仅展示完成本角色任务所需的协作进度，不代表专业风险结论。',
      focus: task.observationFocus ?? [],
      suggestion: task.precautions?.join('；') ?? '只记录可观察事实。',
      restricted: '不展示完整测评、AI 对话、心理档案或专业研判正文。',
      nextAction: legacyStatus.nextAction,
      overdueHours: display.isOverdue ? Math.max(1, Math.ceil(display.overdueMs / (60 * 60 * 1000))) : undefined,
      referral: task.warningStatusSnapshot === 'referral',
      resourcePressure: task.type === 'grade_supervision' ? '需要年级主任协调责任班主任' : undefined,
      records: observations.map((record) => toFollowUpRecord(record, userName(snapshot, record.authorId), task)),
      timeline: toTimeline(task, observations, supervisionRecords),
      finalConclusion:
        task.status === 'cancelled'
          ? task.cancelReason
          : task.warningStatusSnapshot === 'closed'
            ? '管理终端已关闭事项，小程序只保留协作历史。'
            : undefined,
    };
  });
}
