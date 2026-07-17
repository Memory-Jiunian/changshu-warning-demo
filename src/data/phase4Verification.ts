import type { AbnormalReportInput } from '../domain/feedback';
import type { RetestReminderConfirmationInput } from '../domain/tasks';
import { getTodayRetestItems } from '../selectors/homeSelectors';
import { getVisibleReportsForUser } from '../selectors/reportSelectors';
import {
  getRetestReminderDisplayState,
  getRetestReminderStatusLabel,
} from '../selectors/retestSelectors';
import { getTaskCounts } from '../selectors/taskSelectors';
import {
  emptyAbnormalReportFormValues,
  loadAbnormalReportDraft,
  removeAbnormalReportDraft,
  saveAbnormalReportDraft,
} from './abnormalReportDraftStore';
import { createDemoRepository } from './demoRepository';

export interface Phase4VerificationResult {
  checks: string[];
}

function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(`Phase 4 verification failed: ${message}`);
}

function reportInput(
  requestId: string,
  studentId = 'student-zhao',
): AbnormalReportInput {
  return {
    requestId,
    studentId,
    observedAt: '2026-07-17T09:00:00+08:00',
    scene: '课堂、沟通',
    facts: '7 月 17 日第一节课连续三次没有回应提问，课后能够回应老师询问，讲话声音较轻。',
    supportActions: '课后进行了简短关心，并约定午休后再次确认到校情况。',
    immediateSafetyConcern: false,
  };
}

function reminderInput(requestId: string): RetestReminderConfirmationInput {
  return {
    requestId,
    method: 'in_person',
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

export async function verifyPhase4(): Promise<Phase4VerificationResult> {
  const checks: string[] = [];

  const directoryRepository = createDemoRepository({ delayMs: 0 });
  const students = directoryRepository.getVisibleStudents();
  const visibleTasks = directoryRepository.getVisibleTasks();
  assert(students.length > 0, 'head teacher must receive an independent student directory');
  assert(
    students.every((student) =>
      directoryRepository.getCurrentUser().classIds?.includes(student.classId),
    ),
    'student directory must only contain current teacher classes',
  );
  assert(
    students.some(
      (student) =>
        student.id === 'student-zhao' &&
        !visibleTasks.some((task) => task.student.id === student.id),
    ),
    'student directory must not be inferred from collaboration tasks',
  );
  const forged = await directoryRepository.submitAbnormalReport(
    reportInput('phase4-forged-student', 'student-wang'),
  );
  assert(
    !forged.ok && forged.code === 'STUDENT_FORBIDDEN',
    'forged student outside teacher classes must be rejected by Repository',
  );
  checks.push('independent student directory and Repository-level class permission are enforced');

  const reportRepository = createDemoRepository({ delayMs: 0 });
  const beforeReport = reportRepository.getViewSnapshot();
  assert(beforeReport.ok, 'snapshot before report must load');
  const taskTruthBefore = beforeReport.data.tasks.map((task) => ({
    id: task.id,
    status: task.status,
    warningStatusSnapshot: task.warningStatusSnapshot,
  }));
  const pendingBefore = getTaskCounts(
    beforeReport.data.tasks,
    new Date(beforeReport.data.now),
    beforeReport.data.retestSchedules,
  ).pending;
  const actualFacts =
    '7 月 17 日第一节课连续三次没有回应提问，课后能够回应老师询问，讲话声音较轻。';
  const submitted = await reportRepository.submitAbnormalReport({
    ...reportInput('phase4-report-submit'),
    facts: actualFacts,
    immediateSafetyConcern: true,
  });
  assert(
    submitted.ok &&
      submitted.data.facts === actualFacts &&
      submitted.data.immediateSafetyConcern,
    'actual report input and safety choice must be preserved',
  );
  assert(
    !('riskLevel' in submitted.data) &&
      !('diagnosis' in submitted.data) &&
      !('warningConfirmed' in submitted.data),
    'report must not contain professional risk or warning conclusions',
  );
  const afterReport = reportRepository.getViewSnapshot();
  assert(afterReport.ok, 'snapshot after report must load');
  const taskTruthAfter = afterReport.data.tasks.map((task) => ({
    id: task.id,
    status: task.status,
    warningStatusSnapshot: task.warningStatusSnapshot,
  }));
  const pendingAfter = getTaskCounts(
    afterReport.data.tasks,
    new Date(afterReport.data.now),
    afterReport.data.retestSchedules,
  ).pending;
  assert(
    JSON.stringify(taskTruthBefore) === JSON.stringify(taskTruthAfter) &&
      pendingBefore === pendingAfter,
    'report submission must not create or mutate collaboration tasks or warning state',
  );
  const duplicate = await reportRepository.submitAbnormalReport({
    ...reportInput('phase4-report-submit'),
    facts: actualFacts,
  });
  assert(
    !duplicate.ok &&
      duplicate.code === 'DUPLICATE_REQUEST' &&
      reportRepository.getVisibleAbnormalReports().filter(
        (report) => report.id === submitted.data.id,
      ).length === 1,
    'same report request must not create a duplicate record',
  );
  checks.push('report saves actual facts once without changing task or WarningStatus truth');

  const failureRepository = createDemoRepository({ delayMs: 0 });
  const failureCountBefore =
    failureRepository.getVisibleAbnormalReports().length;
  failureRepository.simulateNextWriteFailure();
  const failed = await failureRepository.submitAbnormalReport(
    reportInput('phase4-report-retry'),
  );
  assert(
    !failed.ok &&
      failureRepository.getVisibleAbnormalReports().length === failureCountBefore,
    'failed report must not create a record',
  );
  const retried = await failureRepository.submitAbnormalReport(
    reportInput('phase4-report-retry'),
  );
  assert(
    retried.ok &&
      failureRepository.getVisibleAbnormalReports().length === failureCountBefore + 1,
    'retry after simulated failure must create exactly one report',
  );
  checks.push('report failure preserves truth and retry remains predictable');

  const reportSnapshot = reportRepository.getViewSnapshot();
  assert(reportSnapshot.ok, 'report history snapshot must load');
  assert(
    getVisibleReportsForUser(
      reportSnapshot.data.currentUser,
      reportSnapshot.data.abnormalReports,
    ).every((report) => report.reporterId === reportSnapshot.data.currentUser.id),
    'report history must only return current user records',
  );
  const forbiddenReport = reportRepository.getAbnormalReportById(
    'report-002-other-teacher',
  );
  assert(
    !forbiddenReport.ok && forbiddenReport.code === 'REPORT_FORBIDDEN',
    'direct URL access to another teacher report must fail',
  );
  checks.push('report list and direct detail access share current-reporter permission');

  const draftStorage = createMemoryStorage();
  const draftValues = {
    ...emptyAbnormalReportFormValues,
    studentId: 'student-zhao',
    facts: '这是一段刷新后需要恢复、但不会写入 Repository 真值的异常上报草稿内容。',
  };
  saveAbnormalReportDraft(
    draftStorage,
    'user-head-li',
    draftValues,
    '2026-07-17T10:00:00+08:00',
  );
  assert(
    loadAbnormalReportDraft(draftStorage, 'user-head-li')?.values.facts ===
      draftValues.facts,
    'current user report draft must restore',
  );
  assert(
    loadAbnormalReportDraft(draftStorage, 'user-head-wang') === null,
    'another user must not read report draft',
  );
  removeAbnormalReportDraft(draftStorage, 'user-head-li');
  assert(
    loadAbnormalReportDraft(draftStorage, 'user-head-li') === null,
    'successful submission cleanup must remove report draft',
  );
  checks.push('versioned report draft is user-scoped and removable after success');

  const retestRepository = createDemoRepository({ delayMs: 0 });
  const normalTask = await retestRepository.confirmRetestReminder(
    'task-001-pending',
    reminderInput('phase4-not-retest'),
  );
  const unauthorized = await retestRepository.confirmRetestReminder(
    'task-014-retest-unauthorized',
    reminderInput('phase4-retest-forbidden'),
  );
  assert(
    !normalTask.ok &&
      normalTask.code === 'RETEST_CONFIRM_FORBIDDEN' &&
      !unauthorized.ok &&
      unauthorized.code === 'TASK_FORBIDDEN',
    'only assigned retest reminder may be confirmed',
  );

  const beforeRetest = retestRepository.getTaskById('task-008-retest-today');
  assert(beforeRetest.ok, 'pending retest task must be readable');
  const retest = await retestRepository.confirmRetestReminder(
    'task-008-retest-today',
    reminderInput('phase4-retest-confirm'),
  );
  const afterRetest = retestRepository.getTaskById('task-008-retest-today');
  assert(
    retest.ok &&
      afterRetest.ok &&
      afterRetest.data.status === 'submitted' &&
      !afterRetest.data.completedAt &&
      retest.data.reminderConfirmedById === 'user-head-li' &&
      !retest.data.studentCompletedAt,
    'confirming reminder must record action and enter submitted without completing retest',
  );
  assert(
    beforeRetest.data.warningStatusSnapshot ===
      afterRetest.data.warningStatusSnapshot &&
      !('result' in retest.data),
    'reminder confirmation must not modify WarningStatus or write retest result',
  );
  const duplicateRetest = await retestRepository.confirmRetestReminder(
    'task-008-retest-today',
    reminderInput('phase4-retest-confirm'),
  );
  assert(
    !duplicateRetest.ok && duplicateRetest.code === 'DUPLICATE_REQUEST',
    'duplicate reminder request must not create a second action',
  );
  checks.push('retest reminder confirmation is deduplicated and submitted means reminded only');

  const readonlyRepository = createDemoRepository({ delayMs: 0 });
  const completed = await readonlyRepository.confirmRetestReminder(
    'task-012-retest-completed',
    reminderInput('phase4-retest-completed'),
  );
  const cancelled = await readonlyRepository.confirmRetestReminder(
    'task-013-retest-cancelled',
    reminderInput('phase4-retest-cancelled'),
  );
  const completedSnapshot = readonlyRepository.getViewSnapshot();
  assert(completedSnapshot.ok, 'readonly retest snapshot must load');
  const completedTask = completedSnapshot.data.tasks.find(
    (task) => task.id === 'task-012-retest-completed',
  );
  const completedSchedule = completedSnapshot.data.retestSchedules.find(
    (schedule) => schedule.taskId === 'task-012-retest-completed',
  );
  assert(
    !completed.ok &&
      !cancelled.ok &&
      completedTask?.status === 'completed' &&
      Boolean(completedSchedule?.studentCompletedAt),
    'completed and cancelled reminders must remain readonly; student completion comes from mock/system',
  );
  assert(
    completedTask &&
      completedSchedule &&
      getRetestReminderDisplayState(completedTask, completedSchedule) ===
        'student_completed' &&
      getRetestReminderStatusLabel(completedTask, completedSchedule) ===
        '学生已完成复测',
    'completed reminder display must be derived from system completion data',
  );
  checks.push('completed and cancelled retest reminders are readonly system states');

  const homeRepository = createDemoRepository({ delayMs: 0 });
  const homeBefore = homeRepository.getViewSnapshot();
  assert(homeBefore.ok, 'home snapshot before reminder must load');
  const todayBefore = getTodayRetestItems(
    homeBefore.data.tasks,
    homeBefore.data.retestSchedules,
    new Date(homeBefore.data.now),
  );
  await homeRepository.confirmRetestReminder(
    'task-008-retest-today',
    reminderInput('phase4-home-sync'),
  );
  const homeAfter = homeRepository.getViewSnapshot();
  assert(homeAfter.ok, 'home snapshot after reminder must load');
  const todayAfter = getTodayRetestItems(
    homeAfter.data.tasks,
    homeAfter.data.retestSchedules,
    new Date(homeAfter.data.now),
  );
  assert(
    todayBefore.some((item) => item.task.id === 'task-008-retest-today') &&
      todayAfter.some(
        (item) =>
          item.task.id === 'task-008-retest-today' &&
          item.task.status === 'submitted',
      ),
    'confirmed reminder must remain visible with updated status',
  );
  checks.push('home and task selectors retain confirmed reminders with synchronized status');

  return { checks };
}
