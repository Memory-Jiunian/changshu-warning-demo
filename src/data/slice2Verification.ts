import {
  emptyObservationFormValues,
  loadFeedbackRequestDraft,
  loadObservationDraft,
  saveFeedbackRequestDraft,
  saveObservationDraft,
} from './observationDraftStore';
import { createDemoRepository } from './demoRepository';
import { getSlice2Actions } from '../selectors/factualFeedbackSelectors';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Slice 2 verification failed: ${message}`);
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

export async function verifySlice2() {
  const checks: string[] = [];
  const repository = createDemoRepository({ delayMs: 0 });
  const initial = requireSnapshot(repository);
  const actions = getSlice2Actions(initial.teacherActionItems);

  assert(
    actions.length ===
      initial.teacherActionItems.filter(
        (action) =>
          action.kind === 'feedback_request' ||
          action.kind === 'retest_reminder' ||
          action.kind === 'intervention_reminder',
      ).length,
    'count and list must share the supported action set',
  );
  const interventionIds = new Set(
    initial.teacherActionItems
      .filter((action) => action.kind === 'intervention_reminder')
      .map((action) => action.id),
  );
  assert(interventionIds.size > 0, 'fixture must include intervention actions');
  assert(
    actions.some((action) => interventionIds.has(action.id)),
    'actionable intervention reminders must be included',
  );
  checks.push('count, list, and empty state share all three Teacher v1 action kinds');
  checks.push('actionable intervention reminders are included');

  assert(
    actions[0]?.kind === 'feedback_request' &&
      actions[0].status === 'overdue',
    'actionable overdue feedback must sort first',
  );
  assert(
    actions.slice(1).every(
      (action, index, rest) =>
        index === 0 ||
        new Date(rest[index - 1].actionAt).getTime() <=
          new Date(action.actionAt).getTime(),
    ),
    'remaining actions must sort by actionAt',
  );
  checks.push('overdue feedback sorts first, then actionAt ordering is stable');

  const feedback = actions.find(
    (action) =>
      action.kind === 'feedback_request' &&
      action.target.taskId === 'task-001-pending',
  );
  assert(feedback?.target.name === 'feedback', 'feedback action must exist');
  assert(
    feedback.target.taskId === 'task-001-pending' &&
      feedback.target.sourceRequestId === 'feedback-request-001',
    'feedback action must retain task id and explicit source request id',
  );
  const retest = actions.find((action) => action.kind === 'retest_reminder');
  assert(retest?.target.name === 'retest', 'retest action must exist');
  assert(
    retest.target.taskId !== retest.sourceId,
    'retest action must retain target task id rather than schedule source id',
  );
  checks.push('feedback action carries task identity and explicit request round');
  checks.push('retest action carries target task id instead of source schedule id');

  const intervention = actions.find(
    (action) => action.kind === 'intervention_reminder',
  );
  assert(
    intervention?.target.name === 'intervention',
    'intervention action must exist',
  );
  assert(
    intervention.target.sourceAppointmentId === intervention.sourceId,
    'intervention action must carry the source appointment id',
  );
  checks.push('intervention action carries the explicit appointment identity');

  assert(getSlice2Actions([]).length === 0, 'empty input must produce empty state');
  assert(
    !actions.some((action) => action.sourceId === 'feedback-request-004-completed'),
    'completed feedback must not appear',
  );
  checks.push('empty and completed states do not produce cards');

  const storage = createMemoryStorage();
  const legacyValues = {
    ...emptyObservationFormValues,
    facts: '旧 task 草稿不能进入新的 Feedback Request Round。',
  };
  const roundOneValues = {
    ...emptyObservationFormValues,
    facts: '第一轮 Request 的草稿内容必须只属于第一轮。',
  };
  saveObservationDraft(
    storage,
    'user-head-li',
    'task-001-pending',
    legacyValues,
    initial.now,
  );
  saveFeedbackRequestDraft(
    storage,
    'user-head-li',
    'feedback-request-round-1',
    roundOneValues,
    initial.now,
  );
  assert(
    loadObservationDraft(storage, 'user-head-li', 'task-001-pending')
      ?.values.facts === legacyValues.facts,
    'legacy task draft must remain compatible',
  );
  assert(
    loadFeedbackRequestDraft(
      storage,
      'user-head-li',
      'feedback-request-round-2',
    ) === null,
    'new round must not restore legacy or previous-round draft',
  );
  checks.push('feedback drafts are isolated by sourceRequestId without deleting legacy drafts');

  const beforeFeedbackCount = actions.length;
  const submit = await repository.submitFeedbackRequestRecord(
    'feedback-request-001',
    {
      submissionRequestId: 'slice2-feedback-submit',
      observedAt: '2026-07-17T09:00:00+08:00',
      facts: '学生按时进入课堂并完成点名回应，课间能够接受老师询问，未观察到即时安全风险。',
    },
  );
  assert(submit.ok, 'feedback request submission must succeed');
  assert(
    submit.data.requestId === 'feedback-request-001',
    'feedback record must bind the selected request round',
  );
  assert(
    submit.data.viewedAt === undefined && submit.data.viewedById === undefined,
    'new feedback record must remain unread for psychologist handoff',
  );
  const afterFeedback = getSlice2Actions(
    requireSnapshot(repository).teacherActionItems,
  );
  assert(
    afterFeedback.length === beforeFeedbackCount - 1 &&
      !afterFeedback.some(
        (action) => action.sourceId === 'feedback-request-001',
      ),
    'successful feedback must remove its card and update count',
  );
  checks.push('feedback submission binds requestId, remains unread, and refreshes card/count');

  const retestRepository = createDemoRepository({ delayMs: 0 });
  const confirm = await retestRepository.confirmRetestReminder(
    'task-008-retest-today',
    {
      requestId: 'slice2-retest-confirm',
      method: 'in_person',
    },
  );
  assert(confirm.ok, 'retest reminder confirmation must succeed');
  assert(
    !getSlice2Actions(
      requireSnapshot(retestRepository).teacherActionItems,
    ).some(
      (action) =>
        action.kind === 'retest_reminder' &&
        action.target.taskId === 'task-008-retest-today',
    ),
    'confirmed retest reminder must leave Action Center',
  );
  checks.push('retest confirmation removes its Action Center card without completing retest');

  const expiredRetestRepository = createDemoRepository({
    delayMs: 0,
    now: '2026-07-17T14:30:00+08:00',
  });
  assert(
    !getSlice2Actions(
      requireSnapshot(expiredRetestRepository).teacherActionItems,
    ).some(
      (action) =>
        action.kind === 'retest_reminder' &&
        action.target.taskId === 'task-008-retest-today',
    ),
    'past retest schedule must not project an action',
  );
  const expiredRetestConfirm =
    await expiredRetestRepository.confirmRetestReminder(
      'task-008-retest-today',
      {
        requestId: 'teacher-v1-expired-retest-confirm',
        method: 'phone',
      },
    );
  assert(
    !expiredRetestConfirm.ok &&
      expiredRetestConfirm.code === 'RETEST_REMINDER_EXPIRED',
    'past retest schedule must reject after-the-fact confirmation',
  );
  checks.push('expired retest is non-actionable and rejects confirmation');

  const interventionRepository = createDemoRepository({ delayMs: 0 });
  const beforeIntervention = requireSnapshot(interventionRepository);
  const appointmentBefore = beforeIntervention.interventionAppointments.find(
    (appointment) => appointment.id === 'intervention-appointment-001-planned',
  );
  const interventionConfirm =
    await interventionRepository.confirmInterventionReminder(
      'intervention-appointment-001-planned',
      {
        submissionRequestId: 'teacher-v1-intervention-confirm',
        method: 'class_message',
      },
    );
  assert(interventionConfirm.ok, 'intervention reminder confirmation must succeed');
  const afterInterventionSnapshot = requireSnapshot(interventionRepository);
  assert(
    afterInterventionSnapshot.interventionAppointments.find(
      (appointment) => appointment.id === appointmentBefore?.id,
    )?.status === appointmentBefore?.status,
    'reminder confirmation must not change appointment status',
  );
  assert(
    !getSlice2Actions(afterInterventionSnapshot.teacherActionItems).some(
      (action) =>
        action.kind === 'intervention_reminder' &&
        action.sourceId === 'intervention-appointment-001-planned',
    ),
    'confirmed intervention reminder must leave Action Center',
  );
  checks.push('intervention confirmation removes its card without changing appointment status');

  return { checks };
}
