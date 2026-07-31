import { MOBILE_DEMO_ROLES, getMobileDemoRoute } from '../app/mobileDemo';
import { getCurrentRouteRole } from '../app/currentRouteAuthority';
import { createDemoRepository, REPOSITORY_STORAGE_KEY } from './demoRepository';
import { clearDemoDraftsAndNavigation } from './demoReset';

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Mobile Demo verification failed: ${message}`);
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
    removeItem: (key) => values.delete(key),
    setItem: (key, value) => values.set(key, value),
  };
}

function snapshot(repository: ReturnType<typeof createDemoRepository>) {
  const result = repository.getViewSnapshot();
  assert(result.ok, 'repository snapshot must load');
  return result.data;
}

export async function verifyMobileDemo() {
  const checks: string[] = [];

  assert(MOBILE_DEMO_ROLES.length === 3, 'Role Select must contain exactly three roles');
  assert(
    MOBILE_DEMO_ROLES.map((option) => option.role).join(',') ===
      'head_teacher,grade_director,principal',
    'Role Select must expose only the three approved mobile roles',
  );
  checks.push('Role Select exposes exactly Teacher, Grade Director, and Principal');

  for (const option of MOBILE_DEMO_ROLES) {
    assert(getMobileDemoRoute(option.role) === option.route, `${option.title} route mapping must be stable`);
    assert(getCurrentRouteRole(option.route) === option.role, `${option.title} route must remain role-authoritative`);
  }
  checks.push('all three Role Select actions map to CURRENT role-authoritative routes');

  const sessionStorage = createMemoryStorage();
  const localStorage = createMemoryStorage();
  const repository = createDemoRepository({
    delayMs: 0,
    initialRole: 'head_teacher',
    storage: sessionStorage,
  });
  const initialTeacherActions = snapshot(repository).teacherActionItems.map((item) => item.id);
  const persistedBeforeRoleSwitch = sessionStorage.getItem(REPOSITORY_STORAGE_KEY);
  for (const role of ['grade_director', 'principal', 'head_teacher'] as const) {
    assert(repository.switchDemoRole(role).ok, `${role} Demo user must exist`);
  }
  assert(
    sessionStorage.getItem(REPOSITORY_STORAGE_KEY) === persistedBeforeRoleSwitch,
    'role switching must not mutate business persistence',
  );
  assert(
    JSON.stringify(snapshot(repository).teacherActionItems.map((item) => item.id)) ===
      JSON.stringify(initialTeacherActions),
    'Teacher Actions must survive cross-role navigation',
  );
  checks.push('cross-role switching preserves persisted business state and Teacher Actions');

  const retestResult = await repository.confirmRetestReminder('task-008-retest-today', {
    requestId: 'mobile-demo-reset-retest',
    method: 'in_person',
  });
  assert(retestResult.ok, 'reset fixture must support a Teacher mutation');
  assert(
    !snapshot(repository).teacherActionItems.some((item) => item.id.includes('task-008-retest-today')),
    'Teacher mutation must change the pre-reset action state',
  );
  localStorage.setItem('changshu-demo:feedback-request-draft:v1:user:request', '{}');
  localStorage.setItem('changshu:abnormal-report-draft:v1:user', '{}');
  sessionStorage.setItem('changshu-demo:teacher-task-last-filter', 'history');
  assert(sessionStorage.getItem(REPOSITORY_STORAGE_KEY) !== null, 'mutation must create repository persistence');

  const resetResult = repository.resetDemoState();
  assert(resetResult.ok, 'repository reset must succeed');
  clearDemoDraftsAndNavigation(localStorage, sessionStorage);
  assert(sessionStorage.getItem(REPOSITORY_STORAGE_KEY) === null, 'reset must remove business persistence');
  assert(localStorage.length === 0, 'reset must clear Demo drafts');
  assert(sessionStorage.getItem('changshu-demo:teacher-task-last-filter') === null, 'reset must clear Demo navigation cache');
  checks.push('reset removes business persistence, drafts, and Demo navigation cache');

  assert(repository.switchDemoRole('head_teacher').ok, 'Teacher context must restore after reset');
  const teacher = snapshot(repository);
  const actionKinds = new Set(teacher.teacherActionItems.map((item) => item.kind));
  assert(teacher.teacherActionItems[0]?.status === 'overdue', 'overdue Feedback must be first after reset');
  assert(actionKinds.has('feedback_request'), 'default state must include Feedback');
  assert(actionKinds.has('retest_reminder'), 'default state must include Retest');
  assert(actionKinds.has('intervention_reminder'), 'default state must include Intervention');
  assert(teacher.teacherActionItems.filter((item) => item.kind === 'feedback_request').length >= 2, 'default state must include overdue and pending Feedback');

  assert(repository.switchDemoRole('grade_director').ok, 'Grade Director context must restore after reset');
  const director = snapshot(repository);
  assert(director.gradeDirectorSupervisionItems.length > 0, 'default Director list must be actionable');
  assert(director.gradeDirectorSupervisionItems[0]?.status === 'overdue', 'Director overdue item must remain first');

  assert(repository.switchDemoRole('principal').ok, 'Principal context must restore after reset');
  const principal = snapshot(repository).principalOverview;
  assert(principal.overall.activeWarningCount > 0, 'default Principal overview must be populated');
  assert(principal.collaboration.totalCount > 0, 'default Principal collaboration must be populated');
  assert(principal.managementAttention.overdueFeedbackCount > 0, 'default Principal management attention must be populated');
  checks.push('reset restores coherent Teacher, Grade Director, and Principal default fixtures');

  return { checks };
}
