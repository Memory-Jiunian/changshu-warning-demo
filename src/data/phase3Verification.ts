import type { ObservationFormValues, ObservationInput } from '../domain/feedback';
import { emptyObservationFormValues, loadObservationDraft, saveObservationDraft } from './observationDraftStore';
import { createDemoRepository } from './demoRepository';
import {
  filterTeacherTasks,
  getTaskDisplayState,
  getTaskObservationRecords,
} from '../selectors/taskSelectors';

export interface Phase3VerificationResult {
  checks: string[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 3 verification failed: ${message}`);
}

function input(requestId: string, facts: string): ObservationInput {
  return {
    requestId,
    observedAt: '2026-07-17T09:00:00+08:00',
    scene: '课堂',
    facts,
    frequency: '多次',
    duration: '约 40 分钟',
    immediateSafetyConcern: false,
    additionalNotes: '仅补充与本次观察有关的事实。',
  };
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

export async function verifyPhase3(): Promise<Phase3VerificationResult> {
  const checks: string[] = [];
  const now = new Date('2026-07-17T10:00:00+08:00');

  const listRepository = createDemoRepository({ delayMs: 0 });
  const visibleTasks = listRepository.getVisibleTasks();
  assert(
    visibleTasks.every((task) => task.assigneeId === 'user-head-li'),
    'teacher list must only contain assigned tasks',
  );
  assert(
    filterTeacherTasks(visibleTasks, 'overdue', now).every(
      (task) => getTaskDisplayState(task, now).isOverdue && task.status !== ('overdue' as never),
    ),
    'overdue filter must be derived without persisted overdue status',
  );
  assert(
    filterTeacherTasks(visibleTasks, 'returned', now).every((task) => task.status === 'returned'),
    'returned filter must use centralized task status mapping',
  );
  checks.push('teacher task visibility, filters, and overdue derivation are centralized');

  const forbidden = listRepository.getTaskById('task-011-unauthorized');
  assert(!forbidden.ok && forbidden.code === 'TASK_FORBIDDEN', 'direct unauthorized access must fail');
  const completedSubmit = await listRepository.submitObservation(
    'task-006-completed',
    input('phase3-completed', '今天课堂能够正常回应点名，并完成全部书面任务，课间与同学有简短交流。'),
  );
  const cancelledSubmit = await listRepository.submitObservation(
    'task-007-cancelled',
    input('phase3-cancelled', '今天课堂能够正常回应点名，并完成全部书面任务，课间与同学有简短交流。'),
  );
  assert(
    !completedSubmit.ok && !cancelledSubmit.ok,
    'completed and cancelled tasks must reject direct form submissions',
  );
  checks.push('direct URL permissions and read-only task submission guards are enforced by Repository');

  const submitRepository = createDemoRepository({ delayMs: 0 });
  const beforeRead = submitRepository.getTaskById('task-001-pending');
  assert(beforeRead.ok, 'pending task must be readable');
  const read = await submitRepository.markTaskRead('task-001-pending');
  assert(
    read.ok && read.data.status === beforeRead.data.status && Boolean(read.data.readAt),
    'marking read must not change business status',
  );

  const actualFacts = '7 月 17 日第一节课，学生回应点名后完成课堂练习，课间独处约十分钟，随后主动回到教室。';
  const submitted = await submitRepository.submitObservation(
    'task-001-pending',
    input('phase3-submit', actualFacts),
  );
  assert(submitted.ok && submitted.data.facts === actualFacts, 'actual form facts must be preserved');
  const afterSubmit = submitRepository.getViewSnapshot();
  assert(afterSubmit.ok, 'snapshot after submission must load');
  const submittedHistory = getTaskObservationRecords(
    afterSubmit.data.observations,
    'task-001-pending',
  );
  assert(
    submittedHistory.length === 1 &&
      submittedHistory[0].additionalNotes === '仅补充与本次观察有关的事实。',
    'successful submission must append one complete record',
  );
  const duplicate = await submitRepository.submitObservation(
    'task-001-pending',
    input('phase3-submit', actualFacts),
  );
  assert(!duplicate.ok && duplicate.code === 'DUPLICATE_REQUEST', 'duplicate request must be rejected');
  checks.push('read tracking, actual input persistence, and duplicate protection work together');

  const retryRepository = createDemoRepository({ delayMs: 0 });
  const retryInput = input(
    'phase3-retry',
    '今天第二节课能够完成课堂练习，课间独处约十五分钟，之后与同桌进行了简短交流。',
  );
  retryRepository.simulateNextWriteFailure();
  const failed = await retryRepository.submitObservation('task-002-due-today', retryInput);
  const failedSnapshot = retryRepository.getViewSnapshot();
  assert(
    !failed.ok &&
      failedSnapshot.ok &&
      !failedSnapshot.data.observations.some((record) => record.taskId === 'task-002-due-today'),
    'failed write must not create a record',
  );
  const retried = await retryRepository.submitObservation('task-002-due-today', retryInput);
  const retrySnapshot = retryRepository.getViewSnapshot();
  assert(retried.ok && retrySnapshot.ok, 'retry with the same request id must succeed after failure');
  assert(
    retrySnapshot.data.observations.filter((record) => record.taskId === 'task-002-due-today').length === 1,
    'retry must create exactly one record',
  );
  checks.push('simulated failure preserves truth and retry creates exactly one record');

  const revisionRepository = createDemoRepository({ delayMs: 0 });
  const revisionBefore = revisionRepository.getViewSnapshot();
  assert(revisionBefore.ok, 'revision snapshot must load');
  const original = getTaskObservationRecords(
    revisionBefore.data.observations,
    'task-005-returned',
  )[0];
  const revision = await revisionRepository.submitObservationRevision(
    'task-005-returned',
    input(
      'phase3-revision',
      '补充说明：今天午休独自在座位约二十分钟，随后接受同学邀请一起前往操场，家校沟通已完成。',
    ),
  );
  assert(revision.ok && revision.data.revisionOfRecordId === original.id, 'revision must link original record');
  const revisionAfter = revisionRepository.getViewSnapshot();
  assert(revisionAfter.ok, 'revision snapshot after submit must load');
  const revisionHistory = getTaskObservationRecords(
    revisionAfter.data.observations,
    'task-005-returned',
  );
  assert(
    revisionHistory.length === 2 &&
      revisionHistory[0].id === original.id &&
      revisionHistory[0].facts === original.facts,
    'revision must append without overwriting original record',
  );
  checks.push('returned-task revision appends and links the original feedback');

  const draftStorage = createMemoryStorage();
  const draftValues: ObservationFormValues = {
    ...emptyObservationFormValues,
    facts: '一段尚未提交但需要在刷新后恢复的事实观察草稿内容。',
  };
  saveObservationDraft(
    draftStorage,
    'user-head-li',
    'task-001-pending',
    draftValues,
    '2026-07-17T10:00:00+08:00',
  );
  assert(
    loadObservationDraft(draftStorage, 'user-head-li', 'task-001-pending')?.values.facts === draftValues.facts,
    'same user and task must restore draft',
  );
  assert(
    loadObservationDraft(draftStorage, 'user-head-wang', 'task-001-pending') === null,
    'another user must not read the draft',
  );
  checks.push('versioned draft storage is scoped by user and task');

  const repositoryStorage = createMemoryStorage();
  const persistentRepository = createDemoRepository({ delayMs: 0, storage: repositoryStorage });
  const persistentSubmit = await persistentRepository.submitObservation(
    'task-001-pending',
    input(
      'phase3-persist',
      '今天上午第一节课完成课堂练习，课间在走廊独处约十分钟，随后回到教室与同桌交流。',
    ),
  );
  assert(persistentSubmit.ok, 'persistent repository submission must succeed');
  const restoredRepository = createDemoRepository({ delayMs: 0, storage: repositoryStorage });
  const restoredTask = restoredRepository.getTaskById('task-001-pending');
  const restoredSnapshot = restoredRepository.getViewSnapshot();
  assert(
    restoredTask.ok &&
      restoredTask.data.status === 'submitted' &&
      restoredSnapshot.ok &&
      restoredSnapshot.data.observations.some((record) => record.id === persistentSubmit.data.id),
    'repository state must restore after refresh',
  );
  checks.push('Repository session persistence restores task status and observation history');

  return { checks };
}
