import {
  getCanonicalSupervisionItems,
  getDirectorClassProgress,
  getSupervisionItemCounts,
  getTeacherClassLabel,
} from '../selectors/homeSelectors';
import {
  formatTaskDeadline,
  getTaskDisplayState,
} from '../selectors/taskSelectors';
import {
  emptyAbnormalReportFormValues,
  loadAbnormalReportDraft,
  removeAbnormalReportDraft,
  saveAbnormalReportDraft,
} from './abnormalReportDraftStore';
import { createDemoRepository } from './demoRepository';
import { mockTasks } from './mockTasks';
import { mockUsers } from './mockUsers';
import {
  emptyObservationFormValues,
  loadObservationDraft,
  removeObservationDraft,
  saveObservationDraft,
} from './observationDraftStore';

export interface Phase46aVerificationResult {
  checks: string[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 4.6A verification failed: ${message}`);
}

function createMemoryStorage({ failWrites = false } = {}): Storage {
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
      if (failWrites) throw new Error('storage unavailable');
      values.set(key, value);
    },
  };
}

export async function verifyPhase46a(): Promise<Phase46aVerificationResult> {
  const checks: string[] = [];
  const now = new Date('2026-07-17T10:00:00+08:00');

  const observationStorage = createMemoryStorage();
  const observationValues = {
    ...emptyObservationFormValues,
    facts: '7 月 17 日课堂提问时连续三次没有回应，课后能够回应老师询问。',
  };
  const observationSaved = saveObservationDraft(
    observationStorage,
    'user-head-li',
    'task-001-pending',
    observationValues,
    '2026-07-17T10:01:00+08:00',
  );
  assert(
    observationSaved.ok &&
      loadObservationDraft(
        observationStorage,
        'user-head-li',
        'task-001-pending',
      )?.values.facts === observationValues.facts,
    'observation draft must save and restore actual input',
  );
  checks.push('observation draft persists and restores actual input');

  const reportStorage = createMemoryStorage();
  const reportValues = {
    ...emptyAbnormalReportFormValues,
    studentId: 'student-zhao',
    facts: '7 月 17 日课间独自在座位约二十分钟，能够回应老师的简短询问。',
  };
  const reportSaved = saveAbnormalReportDraft(
    reportStorage,
    'user-head-li',
    reportValues,
    '2026-07-17T10:02:00+08:00',
  );
  assert(
    reportSaved.ok &&
      loadAbnormalReportDraft(reportStorage, 'user-head-li')?.values.facts ===
        reportValues.facts,
    'abnormal report draft must save and restore actual input',
  );
  checks.push('abnormal report draft uses an independent restorable namespace');

  const failingStorage = createMemoryStorage({ failWrites: true });
  const failedObservationSave = saveObservationDraft(
    failingStorage,
    'user-head-li',
    'task-001-pending',
    observationValues,
    '2026-07-17T10:03:00+08:00',
  );
  const failedReportSave = saveAbnormalReportDraft(
    failingStorage,
    'user-head-li',
    reportValues,
    '2026-07-17T10:03:00+08:00',
  );
  assert(
    !failedObservationSave.ok && !failedReportSave.ok,
    'storage failure must return an explicit Result error',
  );
  checks.push('draft storage failures are explicit and do not claim success');

  removeObservationDraft(
    observationStorage,
    'user-head-li',
    'task-001-pending',
  );
  removeAbnormalReportDraft(reportStorage, 'user-head-li');
  assert(
    loadObservationDraft(
      observationStorage,
      'user-head-li',
      'task-001-pending',
    ) === null &&
      loadAbnormalReportDraft(reportStorage, 'user-head-li') === null,
    'successful submission cleanup must remove each draft',
  );
  checks.push('both draft namespaces can be cleared after formal submission');

  const cancelledTask = mockTasks.find(
    (task) => task.id === 'task-007-cancelled',
  );
  assert(cancelledTask, 'cancelled task fixture must exist');
  const cancelledDeadline = formatTaskDeadline(cancelledTask, now);
  const cancelledDisplay = getTaskDisplayState(cancelledTask, now);
  assert(
    cancelledDeadline.startsWith('原计划截止：') &&
      !cancelledDeadline.includes('前') &&
      !cancelledDeadline.includes('超时') &&
      cancelledDisplay.key === 'cancelled' &&
      !cancelledDisplay.isOverdue,
    'cancelled task deadline must be historical and neutral',
  );
  checks.push('cancelled tasks expose only historical deadline information');

  const supervisionTask = mockTasks.find(
    (task) => task.id === 'task-010-supervision',
  );
  const originalTask = mockTasks.find(
    (task) => task.id === supervisionTask?.originalTaskId,
  );
  assert(
    supervisionTask &&
      originalTask &&
      originalTask.type !== 'grade_supervision' &&
      supervisionTask.student.id === originalTask.student.id &&
      supervisionTask.student.gradeId === originalTask.student.gradeId &&
      supervisionTask.student.classId === originalTask.student.classId &&
      supervisionTask.assigneeId === originalTask.assigneeId,
    'explicit supervision task must match its original task and assignee',
  );
  checks.push('grade supervision fixture satisfies original-task invariants');

  const directorRepository = createDemoRepository({ delayMs: 0 });
  directorRepository.switchDemoRole('grade_director');
  const directorSnapshot = directorRepository.getViewSnapshot();
  assert(directorSnapshot.ok, 'director snapshot must load');
  const supervisionItems = getCanonicalSupervisionItems(
    directorSnapshot.data.tasks,
    directorSnapshot.data.supervisionRecords,
    new Date(directorSnapshot.data.now),
  );
  assert(
    supervisionItems.filter((item) => item.key === originalTask.id).length ===
      1 &&
      new Set(supervisionItems.map((item) => item.key)).size ===
        supervisionItems.length,
    'one original task must produce one canonical supervision item',
  );
  checks.push('canonical supervision collection de-duplicates by original task');

  const supervisionCounts = getSupervisionItemCounts(
    supervisionItems,
    new Date(directorSnapshot.data.now),
  );
  const classProgress = getDirectorClassProgress(supervisionItems);
  assert(
    supervisionCounts.pending === 2 &&
      supervisionCounts.overdue === 2 &&
      supervisionCounts.todayNew === 1 &&
      classProgress.reduce((total, item) => total + item.pendingCount, 0) === 2 &&
      classProgress.reduce((total, item) => total + item.overdueCount, 0) === 2,
    'director overview counts and class progress must share canonical items',
  );
  checks.push('director counts, class progress, and recent items share one truth');

  const teacher = mockUsers.find((user) => user.id === 'user-head-li');
  assert(
    teacher?.role === 'head_teacher' && teacher.classIds?.length === 1,
    'demo head teacher must be authorized for exactly one class',
  );
  checks.push('demo head teacher has a single authorized class');

  const teacherRepository = createDemoRepository({ delayMs: 0 });
  const teacherSnapshot = teacherRepository.getViewSnapshot();
  assert(teacherSnapshot.ok, 'teacher snapshot must load');
  const visibleStudents = teacherRepository.getVisibleStudents();
  const classId = teacher.classIds![0];
  assert(
    visibleStudents.length > 0 &&
      visibleStudents.every((student) => student.classId === classId) &&
      getTeacherClassLabel(
        teacher,
        teacherSnapshot.data.tasks,
      ) === visibleStudents[0].className &&
      teacherSnapshot.data.tasks.every(
        (task) => task.assigneeId === teacher.id,
      ),
    'home class label, student directory, and task permissions must stay aligned',
  );
  checks.push('home identity, student directory, and teacher task scope are aligned');

  return { checks };
}
