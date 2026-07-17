import type { ObservationInput } from '../domain/feedback';
import { getTaskDisplayState } from '../selectors/taskSelectors';
import { createDemoRepository } from './demoRepository';
import { mockObservationRecords, mockRetestSchedules } from './mockFeedback';
import { mockScenarioCatalog, mockTasks } from './mockTasks';

export interface Phase1VerificationResult {
  checks: string[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 1 verification failed: ${message}`);
}

function observationInput(requestId: string, facts: string): ObservationInput {
  return {
    requestId,
    observedAt: '2026-07-17T09:00:00+08:00',
    scene: '课堂、课间',
    facts,
    frequency: '近两天偶发',
    duration: '上午两节课及课间',
    impact: '轻度影响课堂参与',
    supportActions: ['日常关心'],
    immediateSafetyConcern: false,
    requestExpeditedReview: true,
  };
}

export async function verifyPhase1(): Promise<Phase1VerificationResult> {
  const checks: string[] = [];
  const repository = createDemoRepository({ delayMs: 0 });

  assert(mockScenarioCatalog.length === 12, 'mock scenario catalog must contain 12 scenarios');
  assert(
    new Set(mockScenarioCatalog.map((scenario) => scenario.id)).size === 12,
    'mock scenario identifiers must be unique',
  );
  assert(
    mockScenarioCatalog.every(
      (scenario) =>
        ('taskId' in scenario && mockTasks.some((task) => task.id === scenario.taskId)) ||
        ('repositoryMode' in scenario && scenario.repositoryMode === 'fail-reads'),
    ),
    'every scenario must resolve to a task or a repository mode',
  );

  const scenarioTask = (id: (typeof mockScenarioCatalog)[number]['id']) => {
    const scenario = mockScenarioCatalog.find((item) => item.id === id);
    assert(scenario && 'taskId' in scenario, `scenario ${id} must reference a task`);
    const task = mockTasks.find((item) => item.id === scenario.taskId);
    assert(task, `scenario ${id} task must exist`);
    return task;
  };
  const pendingTask = scenarioTask('pending');
  const dueTodayTask = scenarioTask('due-today');
  const submittedTask = scenarioTask('submitted');
  const returnedTask = scenarioTask('returned');
  const completedTask = scenarioTask('completed');
  const cancelledTask = scenarioTask('cancelled');
  const retestTodayTask = scenarioTask('retest-today');
  const retestConfirmedTask = scenarioTask('retest-confirmed');
  const supervisionTask = scenarioTask('grade-supervision');

  assert(
    pendingTask.status === 'pending' &&
      getTaskDisplayState(pendingTask, repository.getNow()).key === 'pending',
    'pending scenario must derive pending display state',
  );
  assert(
    dueTodayTask.status === 'pending' &&
      getTaskDisplayState(dueTodayTask, repository.getNow()).key === 'due_today',
    'today-due scenario must derive due_today display state',
  );
  assert(
    submittedTask.status === 'submitted' &&
      mockObservationRecords.some((record) => record.taskId === submittedTask.id),
    'submitted scenario must include an observation record',
  );
  assert(
    returnedTask.status === 'returned' &&
      Boolean(returnedTask.returnReason && returnedTask.returnedAt) &&
      mockObservationRecords.some((record) => record.taskId === returnedTask.id),
    'returned scenario must include an original record and return reason',
  );
  assert(
    completedTask.status === 'completed' &&
      Boolean(completedTask.completedAt) &&
      mockObservationRecords.some((record) => record.taskId === completedTask.id),
    'completed scenario must include completion time and feedback history',
  );
  assert(
    cancelledTask.status === 'cancelled' &&
      Boolean(cancelledTask.cancelledAt && cancelledTask.cancelReason),
    'cancelled scenario must include cancellation time and reason',
  );
  assert(
    retestTodayTask.type === 'retest_reminder' &&
      mockRetestSchedules.some(
        (schedule) => schedule.taskId === retestTodayTask.id && !schedule.reminderConfirmedAt,
      ),
    'today retest reminder must include an unconfirmed schedule',
  );
  assert(
    retestConfirmedTask.type === 'retest_reminder' &&
      retestConfirmedTask.status === 'completed' &&
      mockRetestSchedules.some(
        (schedule) => schedule.taskId === retestConfirmedTask.id && schedule.reminderConfirmedAt,
      ),
    'confirmed retest reminder must include confirmation data',
  );
  assert(
    supervisionTask.type === 'grade_supervision' &&
      Boolean(
        supervisionTask.originalTaskId &&
          mockTasks.some((task) => task.id === supervisionTask.originalTaskId),
      ),
    'grade supervision scenario must reference its original collaboration task',
  );
  checks.push('all 12 mock scenarios resolve and satisfy their internal data contracts');

  const writableStatuses = new Set(['pending', 'submitted', 'returned', 'completed', 'cancelled']);
  assert(
    mockTasks.every((task) => writableStatuses.has(task.status)),
    'task status must not persist overdue',
  );
  const overdueTask = mockTasks.find((task) => task.id === 'task-003-overdue');
  assert(overdueTask?.status === 'pending', 'overdue scenario must persist pending status');
  assert(
    overdueTask && getTaskDisplayState(overdueTask, repository.getNow()).key === 'overdue',
    'overdue must be derived from status and dueAt',
  );
  checks.push('overdue is derived and never persisted as TaskStatus');

  const teacherVisible = repository.getVisibleTasks();
  assert(
    teacherVisible.every((task) => task.assigneeId === 'user-head-li'),
    'head teacher must only see assigned tasks',
  );
  const forbidden = repository.getTaskById('task-011-unauthorized');
  assert('code' in forbidden && forbidden.code === 'TASK_FORBIDDEN', 'direct task access must be denied');
  checks.push('head-teacher list and direct URL access share the same permission rule');

  const initial = repository.getViewSnapshot();
  assert(initial.ok, 'initial teacher snapshot must load');
  const warningBefore = repository.getTaskById('task-001-pending');
  assert(warningBefore.ok, 'pending task must be accessible');
  const initialRecordCount = initial.data.observations.length;
  const actualFacts = '今天第一节课能回应点名，课间独处约十分钟，之后主动回到教室并完成课堂任务。';
  const submit = await repository.submitObservation(
    'task-001-pending',
    observationInput('verify-submit-001', actualFacts),
  );
  assert(submit.ok && submit.data.facts === actualFacts, 'submission must preserve actual input');
  const afterSubmit = repository.getViewSnapshot();
  assert(afterSubmit.ok, 'snapshot after submission must load');
  assert(
    afterSubmit.data.observations.length === initialRecordCount + 1,
    'submission must append one observation record',
  );
  const warningAfter = repository.getTaskById('task-001-pending');
  assert(
    warningAfter.ok &&
      warningBefore.data.warningStatusSnapshot === warningAfter.data.warningStatusSnapshot,
    'small-app writes must not change WarningStatus',
  );
  checks.push('actual observation input is appended without changing WarningStatus');

  const duplicate = await repository.submitObservation(
    'task-001-pending',
    observationInput('verify-submit-001', actualFacts),
  );
  const afterDuplicate = repository.getViewSnapshot();
  assert(
    'code' in duplicate &&
      duplicate.code === 'DUPLICATE_REQUEST' &&
      afterDuplicate.ok &&
      afterDuplicate.data.observations.length === initialRecordCount + 1,
    'duplicate submission must not create a record',
  );
  checks.push('duplicate request protection does not create a second record');

  const beforeFailure = repository.getViewSnapshot();
  assert(beforeFailure.ok, 'snapshot before simulated failure must load');
  repository.simulateNextWriteFailure();
  const failed = await repository.submitObservation(
    'task-002-due-today',
    observationInput(
      'verify-failed-002',
      '今天上午第二节课正常到校，能够完成课堂任务，课间与同桌有简短交流，未见明显冲突。',
    ),
  );
  const afterFailure = repository.getViewSnapshot();
  assert(
    !failed.ok &&
      afterFailure.ok &&
      afterFailure.data.observations.length === beforeFailure.data.observations.length,
    'failed submission must not create a record',
  );
  checks.push('simulated write failure leaves task and records unchanged');

  const returnedBefore = repository.getViewSnapshot();
  assert(returnedBefore.ok, 'returned-task snapshot must load');
  const returnedHistory = returnedBefore.data.observations.filter(
    (record) => record.taskId === 'task-005-returned',
  );
  const revisionFacts = '补充说明：今天上午课堂保持安静，课间与一名同学交流约五分钟，午间完成了家校沟通。';
  const revision = await repository.submitObservationRevision(
    'task-005-returned',
    observationInput('verify-revision-005', revisionFacts),
  );
  const returnedAfter = repository.getViewSnapshot();
  assert(revision.ok && returnedAfter.ok, 'returned task revision must succeed');
  const revisedHistory = returnedAfter.data.observations.filter(
    (record) => record.taskId === 'task-005-returned',
  );
  assert(
    revisedHistory.length === returnedHistory.length + 1 &&
      returnedHistory.every((oldRecord) =>
        revisedHistory.some((record) => record.id === oldRecord.id && record.facts === oldRecord.facts),
      ),
    'revision must append and retain historical feedback',
  );
  checks.push('returned feedback revision appends instead of overwriting history');

  const roleSwitch = repository.switchDemoRole('grade_director');
  assert(roleSwitch.ok, 'grade director demo role must be available');
  const directorTasks = repository.getVisibleTasks();
  assert(
    directorTasks.length > 0 &&
      directorTasks.every(
        (task) =>
          task.supervisorId === roleSwitch.data.id ||
          getTaskDisplayState(task, repository.getNow()).isOverdue,
      ),
    'grade director must only see overdue or explicitly supervised tasks',
  );
  assert(
    !directorTasks.some((task) => task.id === 'task-011-unauthorized'),
    'grade director must not see an unrelated normal task',
  );
  checks.push('grade-director visibility is limited to overdue or explicitly assigned supervision');

  const failedRepository = createDemoRepository({ delayMs: 0, failReads: true });
  const failedLoad = failedRepository.getViewSnapshot();
  assert('code' in failedLoad && failedLoad.code === 'DEMO_LOAD_FAILED', 'load failure scenario must be identifiable');
  checks.push('data-loading failure returns a Result error');

  return { checks };
}
