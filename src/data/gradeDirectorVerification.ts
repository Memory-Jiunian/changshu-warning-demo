import { createDemoRepository } from './demoRepository';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Grade Director verification failed: ${message}`);
}

function createMemoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() { return values.size; },
    clear: () => values.clear(),
    getItem: (key) => values.get(key) ?? null,
    key: (index) => [...values.keys()][index] ?? null,
    removeItem: (key) => { values.delete(key); },
    setItem: (key, value) => { values.set(key, value); },
  };
}

function snapshot(repository: ReturnType<typeof createDemoRepository>) {
  const result = repository.getViewSnapshot();
  assert(result.ok, 'snapshot must load');
  return result.data;
}

export async function verifyGradeDirector() {
  const checks: string[] = [];
  const storage = createMemoryStorage();
  const repository = createDemoRepository({ delayMs: 0, initialRole: 'grade_director', storage });
  const before = snapshot(repository);
  const items = before.gradeDirectorSupervisionItems;

  assert(new Set(items.map((item) => item.kind)).size === 3, 'all three supported kinds must be present');
  assert(items[0]?.kind === 'feedback_request' && items[0].status === 'overdue', 'overdue feedback must sort first');
  assert(items.length === before.gradeDirectorSupervisionItems.length, 'list and count must share one collection');
  assert(items.every((item) => item.responsibleTeacher.role === 'head_teacher'), 'every item must resolve its responsible teacher');
  checks.push('supported items, responsible teachers, list/count, and overdue priority');

  const target = items[0];
  const teacherRepository = createDemoRepository({ delayMs: 0, storage });
  const teacherBefore = snapshot(teacherRepository).teacherActionItems.map((item) => item.id);
  const result = await repository.addCurrentSupervisionRecord(target.id, {
    submissionRequestId: 'grade-director-verification-submit',
    method: 'phone',
  });
  assert(result.ok, 'supervision record write must succeed');
  assert(result.data.sourceActionId === target.id && result.data.sourceKind === target.kind, 'record must retain source action contract');
  const after = snapshot(repository);
  assert(after.gradeDirectorSupervisionItems.find((item) => item.id === target.id)?.latestRecord?.id === result.data.id, 'projection must expose latest record');
  checks.push('supervision write refreshes latest-record projection');

  const duplicate = await repository.addCurrentSupervisionRecord(target.id, {
    submissionRequestId: 'grade-director-verification-submit',
    method: 'phone',
  });
  assert(!duplicate.ok && duplicate.code === 'DUPLICATE_REQUEST', 'duplicate submission must be rejected');
  checks.push('duplicate submit protection is idempotent');

  const teacherAfter = snapshot(createDemoRepository({ delayMs: 0, storage })).teacherActionItems.map((item) => item.id);
  assert(JSON.stringify(teacherAfter) === JSON.stringify(teacherBefore), 'supervision must not complete any Teacher Action');
  checks.push('feedback supervision does not mutate Teacher Action state');

  for (const kind of ['retest_reminder', 'intervention_reminder'] as const) {
    const action = snapshot(repository).gradeDirectorSupervisionItems.find(
      (item) => item.kind === kind,
    );
    assert(action, `${kind} fixture must exist`);
    const actionIdsBefore = snapshot(
      createDemoRepository({ delayMs: 0, storage }),
    ).teacherActionItems.map((item) => item.id);
    const supervision = await repository.addCurrentSupervisionRecord(action.id, {
      submissionRequestId: `grade-director-${kind}-submit`,
      method: 'message',
    });
    assert(supervision.ok, `${kind} supervision must succeed`);
    const actionIdsAfter = snapshot(
      createDemoRepository({ delayMs: 0, storage }),
    ).teacherActionItems.map((item) => item.id);
    assert(
      JSON.stringify(actionIdsAfter) === JSON.stringify(actionIdsBefore),
      `${kind} supervision must not remove its Teacher Action`,
    );
  }
  checks.push('retest and intervention supervision keep both reminders actionable');

  const reloaded = createDemoRepository({ delayMs: 0, initialRole: 'grade_director', storage });
  assert(snapshot(reloaded).gradeDirectorSupervisionItems.find((item) => item.id === target.id)?.latestRecord?.id === result.data.id, 'persisted record must survive reload');
  checks.push('persisted supervision survives repository reload');

  assert((await repository.addCurrentSupervisionRecord(items[1].id, { submissionRequestId: 'grade-director-other-invalid', method: 'other' })).ok === false, 'other method requires detail');
  checks.push('other method validation is enforced');
  return { checks };
}
