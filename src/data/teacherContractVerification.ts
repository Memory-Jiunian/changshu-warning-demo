import { createDemoRepository } from './demoRepository';
import {
  getTeacherActionDataIssues,
  getTeacherActionItems,
} from '../selectors/teacherActionSelectors';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}

function requireSnapshot(repository: ReturnType<typeof createDemoRepository>) {
  const result = repository.getViewSnapshot();
  assert(result.ok, 'snapshot must load');
  return result.data;
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => {
      values.delete(key);
    },
    setItem: (key, value) => {
      values.set(key, value);
    },
  };
}

export async function verifyTeacherContracts() {
  const checks: string[] = [];
  const repository = createDemoRepository({ delayMs: 0 });

  const initial = requireSnapshot(repository);
  const pendingFeedback = initial.teacherActionItems.filter(
    (item) =>
      item.kind === 'feedback_request' &&
      item.sourceId === 'feedback-request-001',
  );
  assert(pendingFeedback.length === 1, 'pending request must project one action');
  checks.push('pending feedback request projects one action item');

  const overdueFeedback = initial.teacherActionItems.find(
    (item) => item.sourceId === 'feedback-request-015-overdue',
  );
  assert(overdueFeedback?.status === 'overdue', 'overdue request must be overdue');
  checks.push('overdue feedback request projects overdue state');

  const roundActions = initial.teacherActionItems.filter(
    (item) =>
      item.sourceId === 'feedback-request-002-round-1' ||
      item.sourceId === 'feedback-request-002-round-2',
  );
  assert(
    roundActions.length === 1 &&
      roundActions[0].sourceId === 'feedback-request-002-round-2',
    'only the latest feedback request round may be actionable',
  );
  checks.push('new request round supersedes old overdue round for action projection');

  const projectionInput = {
    user: initial.currentUser,
    tasks: initial.tasks,
    observations: initial.observations,
    retestSchedules: initial.retestSchedules,
    interventionAppointments: [],
    interventionReminderRecords: [],
    now: new Date(initial.now),
  };
  const duplicatePendingRequests = [
    {
      ...initial.feedbackRequests.find(
        (item) => item.id === 'feedback-request-001',
      )!,
      id: 'feedback-request-anomaly-round-1',
      warningId: 'warning-anomaly',
      requestedAt: '2026-07-16T08:00:00+08:00',
      status: 'pending' as const,
    },
    {
      ...initial.feedbackRequests.find(
        (item) => item.id === 'feedback-request-001',
      )!,
      id: 'feedback-request-anomaly-round-2',
      warningId: 'warning-anomaly',
      requestedAt: '2026-07-17T08:00:00+08:00',
      status: 'pending' as const,
    },
  ];
  const anomalyActions = getTeacherActionItems({
    ...projectionInput,
    feedbackRequests: duplicatePendingRequests,
  }).filter((item) => item.kind === 'feedback_request');
  const anomalyIssues = getTeacherActionDataIssues(duplicatePendingRequests);
  assert(
    anomalyActions.length === 1 &&
      anomalyActions[0].sourceId === 'feedback-request-anomaly-round-2',
    'multiple pending rounds must only project the newest action',
  );
  assert(
    anomalyIssues.length === 1 &&
      anomalyIssues[0].code === 'MULTIPLE_PENDING_FEEDBACK_ROUNDS' &&
      anomalyIssues[0].currentRequestId === 'feedback-request-anomaly-round-2',
    'multiple pending rounds must emit a data issue',
  );
  checks.push('multiple pending rounds project only newest and emit a data issue');

  const newestCompletedRequests = duplicatePendingRequests.map((request, index) =>
    index === 1 ? { ...request, status: 'completed' as const } : request,
  );
  const completedNewestActions = getTeacherActionItems({
    ...projectionInput,
    feedbackRequests: newestCompletedRequests,
  }).filter((item) => item.kind === 'feedback_request');
  assert(
    completedNewestActions.length === 0,
    'completed newest round must not reactivate an older pending round',
  );
  checks.push('completed newest round does not reactivate an older pending round');

  const completedBefore = initial.teacherActionItems.some(
    (item) => item.sourceId === 'feedback-request-004-completed',
  );
  assert(!completedBefore, 'completed request must not project an action');
  checks.push('completed feedback request is not actionable');

  const feedbackResult = await repository.submitFeedbackRequestRecord(
    'feedback-request-001',
    {
      submissionRequestId: 'verify-feedback-submit-001',
      observedAt: '2026-07-17T09:00:00+08:00',
      facts: '学生能够正常进入课堂，并在点名后完成回应；课间接受老师简短询问，未观察到即时安全风险。',
    },
  );
  assert(feedbackResult.ok, 'feedback submission must succeed');
  assert(
    feedbackResult.data.requestId === 'feedback-request-001',
    'record must retain source feedback request id',
  );
  const afterFeedback = requireSnapshot(repository);
  const completedRequest = afterFeedback.feedbackRequests.find(
    (item) => item.id === 'feedback-request-001',
  );
  assert(completedRequest?.status === 'completed', 'request must become completed');
  assert(
    !afterFeedback.teacherActionItems.some(
      (item) => item.sourceId === 'feedback-request-001',
    ),
    'completed feedback action must disappear',
  );
  checks.push('explicit request submission links record, completes request, and removes action');

  const duplicateFeedback = await repository.submitFeedbackRequestRecord(
    'feedback-request-001',
    {
      submissionRequestId: 'verify-feedback-submit-001',
      observedAt: '2026-07-17T09:00:00+08:00',
      facts: '学生能够正常进入课堂，并在点名后完成回应；课间接受老师简短询问，未观察到即时安全风险。',
    },
  );
  assert(!duplicateFeedback.ok, 'completed request must reject duplicate write');
  const feedbackRecordCount = requireSnapshot(repository).observations.filter(
    (record) => record.requestId === 'feedback-request-001',
  ).length;
  assert(feedbackRecordCount === 1, 'submission request id must not create duplicates');
  checks.push('completed request and repeated submission request id cannot duplicate records');

  const oldRoundResult = await repository.submitFeedbackRequestRecord(
    'feedback-request-002-round-1',
    {
      submissionRequestId: 'verify-feedback-old-round',
      observedAt: '2026-07-17T09:00:00+08:00',
      facts: '这是旧轮次反馈请求的验证内容，系统应拒绝把它误认为当前最新的待处理反馈请求。',
    },
  );
  assert(
    !oldRoundResult.ok && oldRoundResult.code === 'FEEDBACK_REQUEST_SUPERSEDED',
    'superseded request round must be rejected',
  );
  checks.push('repository requires explicit current source request and rejects superseded round');

  const appointmentActions = initial.teacherActionItems.filter(
    (item) => item.kind === 'intervention_reminder',
  );
  assert(
    appointmentActions.some(
      (item) => item.sourceId === 'intervention-appointment-001-planned',
    ),
    'planned appointment must be actionable',
  );
  assert(
    !appointmentActions.some(
      (item) => item.sourceId === 'intervention-appointment-002-cancelled',
    ),
    'cancelled appointment must not be actionable',
  );
  assert(
    !appointmentActions.some(
      (item) => item.sourceId === 'intervention-appointment-003-rescheduled',
    ),
    'rescheduled source appointment must not be actionable',
  );
  assert(
    appointmentActions.some(
      (item) => item.sourceId === 'intervention-appointment-004-replacement',
    ),
    'replacement appointment must be actionable',
  );
  assert(
    !appointmentActions.some(
      (item) => item.sourceId === 'intervention-appointment-005-expired',
    ),
    'past planned appointment must not remain actionable',
  );
  checks.push('planned appointment projects an intervention reminder action');
  checks.push('past planned appointment is expired and non-actionable');
  checks.push('cancelled appointment does not project an action');
  checks.push('rescheduled source appointment does not project an action');
  checks.push('replacement appointment projects its own action');

  const reminderResult = await repository.confirmInterventionReminder(
    'intervention-appointment-001-planned',
    {
      submissionRequestId: 'verify-intervention-reminder-001',
      method: 'in_person',
    },
  );
  assert(reminderResult.ok, 'reminder confirmation must succeed');
  const afterReminder = requireSnapshot(repository);
  assert(
    afterReminder.interventionReminderRecords.some(
      (record) =>
        record.sourceAppointmentId === 'intervention-appointment-001-planned',
    ),
    'confirmation must write an independent reminder record',
  );
  assert(
    afterReminder.interventionAppointments.find(
      (item) => item.id === 'intervention-appointment-001-planned',
    )?.status === 'planned',
    'reminder confirmation must not complete appointment',
  );
  checks.push('reminder confirmation writes a record without changing appointment status');

  const duplicateReminder = await repository.confirmInterventionReminder(
    'intervention-appointment-001-planned',
    {
      submissionRequestId: 'verify-intervention-reminder-001',
      method: 'in_person',
    },
  );
  assert(!duplicateReminder.ok, 'duplicate appointment confirmation must be blocked');
  assert(
    requireSnapshot(repository).interventionReminderRecords.filter(
      (record) =>
        record.sourceAppointmentId === 'intervention-appointment-001-planned',
    ).length === 1,
    'duplicate confirmation must not write a second record',
  );
  checks.push('duplicate intervention reminder confirmation is blocked');

  const expiredReminder = await repository.confirmInterventionReminder(
    'intervention-appointment-005-expired',
    {
      submissionRequestId: 'verify-intervention-reminder-expired',
      method: 'phone',
    },
  );
  assert(
    !expiredReminder.ok &&
      expiredReminder.code === 'INTERVENTION_REMINDER_EXPIRED',
    'past appointment reminder confirmation must be rejected',
  );
  checks.push('past plannedAt cannot be confirmed after the fact');

  const storage = createMemoryStorage();
  const migratedReadAt = '2026-07-16T07:45:00+08:00';
  const v3Tasks = initial.tasks.map((task) =>
    task.id === 'task-001-pending'
      ? { ...task, readAt: migratedReadAt }
      : task,
  );
  storage.setItem(
    'changshu-demo:repository:v3',
    JSON.stringify({
      version: 3,
      tasks: v3Tasks,
      observations: initial.observations,
      abnormalReports: initial.abnormalReports,
      retestSchedules: initial.retestSchedules,
      supervisionRecords: initial.supervisionRecords,
      requestIds: ['persisted-v3-request'],
    }),
  );
  const migratedRepository = createDemoRepository({ delayMs: 0, storage });
  const migratedSnapshot = requireSnapshot(migratedRepository);
  assert(
    migratedSnapshot.tasks.find((task) => task.id === 'task-001-pending')
      ?.readAt === migratedReadAt,
    'v3 task state must survive migration',
  );
  assert(
    migratedSnapshot.observations.length === initial.observations.length &&
      migratedSnapshot.retestSchedules.length === initial.retestSchedules.length,
    'v3 feedback and retest state must survive migration',
  );
  assert(
    migratedSnapshot.feedbackRequests.length > 0 &&
      migratedSnapshot.interventionAppointments.length > 0 &&
      migratedSnapshot.interventionReminderRecords.length === 0,
    'v4 collections must use legal defaults when absent from v3',
  );
  const migratedWrite = await migratedRepository.submitFeedbackRequestRecord(
    'feedback-request-001',
    {
      submissionRequestId: 'verify-v3-to-v4-write',
      observedAt: '2026-07-17T09:00:00+08:00',
      facts: '旧版持久化状态加载后仍可提交当前反馈请求，并能够把完整的新合同正常写回为版本四状态。',
    },
  );
  assert(migratedWrite.ok, 'repository must remain writable after v3 migration');
  const persistedV4 = JSON.parse(
    storage.getItem('changshu-demo:repository:v3') ?? '{}',
  ) as {
    version?: number;
    feedbackRequests?: unknown[];
    interventionAppointments?: unknown[];
    interventionReminderRecords?: unknown[];
  };
  assert(
    persistedV4.version === 4 &&
      Array.isArray(persistedV4.feedbackRequests) &&
      Array.isArray(persistedV4.interventionAppointments) &&
      Array.isArray(persistedV4.interventionReminderRecords),
    'first post-migration write must persist a complete v4 state',
  );
  checks.push('v3 persisted state loads intact and upgrades on the next v4 write');

  const retestRepository = createDemoRepository({ delayMs: 0 });
  const retestBefore = requireSnapshot(retestRepository);
  assert(
    retestBefore.teacherActionItems.some(
      (item) =>
        item.kind === 'retest_reminder' &&
        item.target.name === 'retest' &&
        item.target.taskId === 'task-008-retest-today',
    ),
    'existing retest source must project a retest reminder action',
  );
  const retestResult = await retestRepository.confirmRetestReminder(
    'task-008-retest-today',
    {
      requestId: 'verify-retest-reminder-001',
      method: 'in_person',
    },
  );
  assert(retestResult.ok, 'existing retest confirmation must succeed');
  assert(
    !requireSnapshot(retestRepository).teacherActionItems.some(
      (item) =>
        item.kind === 'retest_reminder' &&
        item.target.name === 'retest' &&
        item.target.taskId === 'task-008-retest-today',
    ),
    'confirmed retest reminder action must disappear',
  );
  checks.push('existing retest source mapping and confirmation contract regress successfully');

  return { checks };
}
