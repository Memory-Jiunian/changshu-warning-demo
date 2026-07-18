import type { ObservationRecord, SupervisionRecord } from '../domain/feedback';
import type { CollaborationTask, CollaborationTaskType, RetestSchedule, TaskUrgency } from '../domain/tasks';
import type { DemoUser } from '../domain/users';
import {
  formatTaskDeadline,
  isSameLocalDate,
  isTaskOverdue,
  sortTasksForAction,
} from './taskSelectors';

export const taskTypeLabels: Record<CollaborationTaskType, string> = {
  default_observation: '日常观察',
  additional_feedback: '补充反馈',
  feedback_revision: '反馈补充',
  retest_reminder: '复测提醒',
  grade_supervision: '年级督办',
};

export const urgencyLabels: Record<TaskUrgency, string> = {
  normal: '常规',
  important: '优先',
  urgent: '紧急',
};

export function formatDemoDate(now: string) {
  const date = new Date(now);
  return `${date.getFullYear()}年${date.getMonth() + 1}月${date.getDate()}日`;
}

export function formatCompactDateTime(value?: string) {
  if (!value) return '暂无记录';
  const date = new Date(value);
  return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function getTeacherClassLabel(user: DemoUser, tasks: CollaborationTask[]) {
  const primaryClassId = user.classIds?.[0];
  const primaryClass = tasks.find((task) => task.student.classId === primaryClassId)?.student.className;
  return primaryClass ?? '当前演示班级';
}

export function getDirectorGradeLabel(user: DemoUser, tasks: CollaborationTask[]) {
  const gradeNames = Array.from(
    new Set(
      tasks
        .filter((task) => user.managedGradeIds?.includes(task.student.gradeId))
        .map((task) => `${task.student.gradeName}年级`),
    ),
  );
  return gradeNames.join('、') || '当前演示年级';
}

export function getRecentTeacherTasks(tasks: CollaborationTask[], now: Date) {
  return sortTasksForAction(
    tasks.filter(
      (task) =>
        task.type !== 'retest_reminder' &&
        ['pending', 'returned'].includes(task.status),
    ),
    now,
  ).slice(0, 3);
}

export function getTodayRetestItems(
  tasks: CollaborationTask[],
  schedules: RetestSchedule[],
  now: Date,
) {
  return schedules
    .filter((schedule) => isSameLocalDate(new Date(schedule.scheduledAt), now))
    .map((schedule) => {
      const task = tasks.find((item) => item.id === schedule.taskId);
      return task ? { task, schedule } : null;
    })
    .filter((item): item is { task: CollaborationTask; schedule: RetestSchedule } => Boolean(item));
}

export function getRecentSubmissions(
  tasks: CollaborationTask[],
  observations: ObservationRecord[],
) {
  return [...observations]
    .sort((left, right) => new Date(right.submittedAt).getTime() - new Date(left.submittedAt).getTime())
    .map((record) => {
      const task = tasks.find((item) => item.id === record.taskId);
      return task ? { record, task } : null;
    })
    .filter((item): item is { record: ObservationRecord; task: CollaborationTask } => Boolean(item))
    .slice(0, 2);
}

export interface DirectorClassProgress {
  className: string;
  pendingCount: number;
  overdueCount: number;
}

export interface SupervisionItemViewModel {
  key: string;
  originalTask: CollaborationTask;
  supervisionTask?: CollaborationTask;
  latestSupervisionRecord?: SupervisionRecord;
  isOverdue: boolean;
  source: 'explicit' | 'derived';
}

function latestSupervisionRecordForTaskIds(
  taskIds: string[],
  records: SupervisionRecord[],
) {
  return records
    .filter((record) => taskIds.includes(record.taskId))
    .sort(
      (left, right) =>
        new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime(),
    )[0];
}

export function getCanonicalSupervisionItems(
  tasks: CollaborationTask[],
  records: SupervisionRecord[],
  now: Date,
) {
  const tasksById = new Map(tasks.map((task) => [task.id, task]));
  const explicitByOriginalId = new Map<string, CollaborationTask>();

  tasks
    .filter((task) => task.type === 'grade_supervision' && task.originalTaskId)
    .forEach((task) => {
      if (!explicitByOriginalId.has(task.originalTaskId!)) {
        explicitByOriginalId.set(task.originalTaskId!, task);
      }
    });

  const items: SupervisionItemViewModel[] = [];

  explicitByOriginalId.forEach((supervisionTask, originalTaskId) => {
    const originalTask = tasksById.get(originalTaskId);
    if (!originalTask) return;
    items.push({
      key: originalTask.id,
      originalTask,
      supervisionTask,
      latestSupervisionRecord: latestSupervisionRecordForTaskIds(
        [supervisionTask.id, originalTask.id],
        records,
      ),
      isOverdue: isTaskOverdue(originalTask, now),
      source: 'explicit',
    });
  });

  tasks
    .filter(
      (task) =>
        task.type !== 'grade_supervision' &&
        isTaskOverdue(task, now) &&
        !explicitByOriginalId.has(task.id),
    )
    .forEach((originalTask) => {
      items.push({
        key: originalTask.id,
        originalTask,
        latestSupervisionRecord: latestSupervisionRecordForTaskIds(
          [originalTask.id],
          records,
        ),
        isOverdue: true,
        source: 'derived',
      });
    });

  return items.sort((left, right) => {
    if (left.isOverdue !== right.isOverdue) return left.isOverdue ? -1 : 1;
    const leftDue = left.originalTask.dueAt
      ? new Date(left.originalTask.dueAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    const rightDue = right.originalTask.dueAt
      ? new Date(right.originalTask.dueAt).getTime()
      : Number.MAX_SAFE_INTEGER;
    if (leftDue !== rightDue) return leftDue - rightDue;
    return (
      new Date(left.originalTask.createdAt).getTime() -
      new Date(right.originalTask.createdAt).getTime()
    );
  });
}

export function getSupervisionItemCounts(
  items: SupervisionItemViewModel[],
  now: Date,
) {
  return items.reduce(
    (counts, item) => {
      if (['pending', 'returned'].includes(item.originalTask.status)) {
        counts.pending += 1;
      }
      if (item.isOverdue) counts.overdue += 1;
      const createdAt =
        item.supervisionTask?.createdAt ?? item.originalTask.createdAt;
      if (isSameLocalDate(new Date(createdAt), now)) counts.todayNew += 1;
      return counts;
    },
    { pending: 0, overdue: 0, todayNew: 0 },
  );
}

export function getDirectorClassProgress(items: SupervisionItemViewModel[]) {
  const groups = new Map<string, DirectorClassProgress>();
  items.forEach((item) => {
    const task = item.originalTask;
    const current = groups.get(task.student.classId) ?? {
      className: task.student.className,
      pendingCount: 0,
      overdueCount: 0,
    };
    if (['pending', 'returned'].includes(task.status)) current.pendingCount += 1;
    if (item.isOverdue) current.overdueCount += 1;
    groups.set(task.student.classId, current);
  });
  return [...groups.values()].sort((left, right) => right.overdueCount - left.overdueCount);
}

export function getRecentSupervisionItems(items: SupervisionItemViewModel[]) {
  return items.slice(0, 3);
}

export function getTaskAssigneeName(task: CollaborationTask, users: DemoUser[]) {
  return users.find((user) => user.id === task.assigneeId)?.name ?? '责任班主任';
}

export function getTaskDeadlineLabel(task: CollaborationTask, now: Date) {
  return formatTaskDeadline(task, now);
}
