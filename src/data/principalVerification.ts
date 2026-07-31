import { createDemoRepository } from './demoRepository';
import {
  getCurrentRouteRole,
  getEffectiveDemoRole,
} from '../app/currentRouteAuthority';
import { getPrincipalOverview, LONG_RUNNING_INTERVENTION_MS } from '../selectors/principalOverviewSelectors';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Principal verification failed: ${message}`);
}

function snapshot(repository: ReturnType<typeof createDemoRepository>) {
  const result = repository.getViewSnapshot();
  assert(result.ok, 'snapshot must load');
  return result.data;
}

export function verifyPrincipal() {
  const checks: string[] = [];
  assert(getCurrentRouteRole('#/feedback/tasks') === 'head_teacher', 'Teacher first load must resolve Teacher context');
  checks.push('direct first-load Teacher route resolves Teacher context');

  assert(getCurrentRouteRole('#/mvp/grade-director/tasks') === 'grade_director', 'Grade Director first load must resolve Grade Director context');
  checks.push('direct first-load Grade Director route resolves Grade Director context');

  assert(getCurrentRouteRole('#/mvp/principal/overview') === 'principal', 'Principal first load must resolve Principal context');
  checks.push('direct first-load Principal route resolves Principal context');

  for (const [hash, role] of [
    ['#/feedback/tasks', 'head_teacher'],
    ['#/mvp/grade-director/tasks', 'grade_director'],
    ['#/mvp/principal/overview', 'principal'],
  ] as const) {
    const freshRepository = createDemoRepository({ delayMs: 0, initialRole: getEffectiveDemoRole(hash) });
    assert(freshRepository.getCurrentUser().role === role, `${role} hard refresh must create the correct user context`);
  }
  checks.push('hard refresh creates route-authoritative Demo user context');

  assert(getEffectiveDemoRole('#/mvp/principal/overview', 'head_teacher') === 'principal', 'stale Teacher session must not override Principal route');
  assert(getEffectiveDemoRole('#/mvp/grade-director/tasks', 'principal') === 'grade_director', 'stale Principal session must not override Grade Director route');
  assert(getEffectiveDemoRole('#/feedback/tasks', 'grade_director') === 'head_teacher', 'stale Grade Director session must not override Teacher route');
  checks.push('stale session role cannot override a CURRENT route role');

  const routeSequence = [
    '#/feedback/tasks',
    '#/mvp/principal/overview',
    '#/mvp/grade-director/tasks',
    '#/feedback/tasks',
    '#/mvp/principal/overview',
    '#/feedback/tasks',
    '#/mvp/principal/overview',
    '#/mvp/grade-director/tasks',
  ];
  assert(routeSequence.every((hash) => getCurrentRouteRole(hash)), 'every cross-role destination must remain authoritative');
  checks.push('cross-role CURRENT navigation resolves every destination synchronously');

  const repository = createDemoRepository({ delayMs: 0, initialRole: 'principal' });
  const principalSnapshot = snapshot(repository);
  const overview = principalSnapshot.principalOverview;
  assert(overview.overall.activeWarningCount === 14, 'active warning count must be deterministic');
  assert(overview.overall.interventionCount === 3, 'intervention count must be deterministic');
  assert(overview.overall.pendingRetestCount === 3, 'pending retest count must be deterministic');
  assert(overview.overall.closedThisMonthCount === 1, 'closed-this-month count must be deterministic');
  checks.push('overall warning, intervention, retest, and closure metrics are deterministic');

  assert(overview.collaboration.completedCount === 1, 'completed collaboration count must match latest rounds');
  assert(overview.collaboration.pendingFeedbackCount === 2, 'pending collaboration count must match latest rounds');
  assert(overview.collaboration.overdueCount === 1, 'overdue collaboration count must match latest rounds');
  assert(overview.collaboration.totalCount === 4, 'overdue must not be double counted as pending');
  assert(overview.collaboration.completionRate === 25, 'completion rate must use normalized total');
  assert(overview.collaboration.overdueByGrade.length === 1 && overview.collaboration.overdueByGrade[0].count === 1, 'overdue grade aggregation must be deterministic');
  checks.push('collaboration categories, rate, and overdue-by-grade are normalized');

  assert(overview.managementAttention.overdueFeedbackCount === overview.collaboration.overdueCount, 'attention overdue count must reuse collaboration semantics');
  assert(overview.managementAttention.longRunningInterventionCount === 3, 'long-running intervention rule must be deterministic');
  assert(overview.managementAttention.activeReferralCount === 0, 'missing active referral fixture must safely aggregate to zero');
  assert(LONG_RUNNING_INTERVENTION_MS === 86_400_000, 'Demo long-running threshold must remain 24 hours');
  checks.push('management attention uses overdue, 24-hour intervention, and safe referral semantics');

  const empty = getPrincipalOverview({ tasks: [], feedbackRequests: [], retestSchedules: [], interventionAppointments: [], now: new Date('2026-07-17T10:00:00+08:00') });
  assert(empty.collaboration.totalCount === 0 && empty.collaboration.completionRate === 0, 'zero collaboration must return zero rate');
  assert(Object.values(empty.overall).every((value) => value === 0), 'empty overall state must remain zero-safe');
  checks.push('all zero and empty states are safe');

  const serialized = JSON.stringify(overview).toLowerCase();
  const forbidden = ['studentid', 'studentname', 'facts', 'observationfacts', 'assessmentanswer', 'assessmentcontent', 'aiconversation', 'interventionnote', 'interventioncontent', 'referralprivatecontent'];
  assert(forbidden.every((key) => !serialized.includes(key)), 'projection must not expose forbidden identity or content keys');
  assert(principalSnapshot.students.length === 0 && principalSnapshot.tasks.length === 0 && principalSnapshot.observations.length === 0 && principalSnapshot.feedbackRequests.length === 0, 'Principal snapshot must not expose student-level collections');
  checks.push('projection and Principal snapshot exclude identity and sensitive content');

  const before = JSON.stringify(snapshot(repository).principalOverview);
  const after = JSON.stringify(snapshot(repository).principalOverview);
  assert(before === after, 'repeated Principal reads must be stable and mutation-free');
  assert(!Object.keys(repository).some((key) => key.toLowerCase().startsWith('principal')), 'Principal must not introduce an instance write surface');
  checks.push('Principal overview is stable and introduces no write path');

  const routeSwitchRepository = createDemoRepository({ delayMs: 0, initialRole: 'principal' });
  const businessBefore = JSON.stringify({
    overview: routeSwitchRepository.getPrincipalOverview(),
    teacherActions: routeSwitchRepository.switchDemoRole('head_teacher').ok
      ? snapshot(routeSwitchRepository).teacherActionItems.map((item) => item.id)
      : [],
  });
  for (const role of ['principal', 'grade_director', 'head_teacher', 'principal', 'grade_director', 'head_teacher'] as const) {
    assert(routeSwitchRepository.switchDemoRole(role).ok, `${role} Demo context must be available`);
  }
  const businessAfter = JSON.stringify({
    overview: routeSwitchRepository.getPrincipalOverview(),
    teacherActions: snapshot(routeSwitchRepository).teacherActionItems.map((item) => item.id),
  });
  assert(businessAfter === businessBefore, 'CURRENT role switching must not mutate business state');
  checks.push('role switching does not mutate business state');

  const guardedRepository = createDemoRepository({ delayMs: 0, initialRole: 'head_teacher' });
  const guardedTaskId = snapshot(guardedRepository).tasks[0]?.id;
  assert(Boolean(guardedTaskId), 'Teacher guard fixture must include an execution task');
  assert(guardedRepository.switchDemoRole('principal').ok, 'Principal guard context must be available');
  const forbiddenTask = guardedRepository.getTaskById(guardedTaskId!);
  assert(!forbiddenTask.ok && forbiddenTask.code === 'TASK_FORBIDDEN', 'Principal must remain unable to read an execution task');
  assert(getCurrentRouteRole('#/mvp/teacher/tasks') === undefined, 'non-CURRENT legacy route must not assume a new route-authoritative role');
  checks.push('role guard remains enforced outside CURRENT route workspace switching');
  return { checks };
}
