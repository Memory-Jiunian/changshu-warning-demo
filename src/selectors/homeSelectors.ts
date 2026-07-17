import type { ObservationRecord, SupervisionRecord } from '../domain/feedback';
import type { CollaborationTask, CollaborationTaskType, RetestSchedule, TaskUrgency } from '../domain/tasks';
import type { DemoUser } from '../domain/users';
import {
  formatTaskDeadline,
  getTaskDisplayState,
  isSameLocalDate,
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
        !['completed', 'cancelled'].includes(task.status),
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

export function getDirectorClassProgress(tasks: CollaborationTask[], now: Date) {
  const groups = new Map<string, DirectorClassProgress>();
  tasks.forEach((task) => {
    const current = groups.get(task.student.classId) ?? {
      className: task.student.className,
      pendingCount: 0,
      overdueCount: 0,
    };
    if (['pending', 'returned'].includes(task.status)) current.pendingCount += 1;
    if (getTaskDisplayState(task, now).isOverdue) current.overdueCount += 1;
    groups.set(task.student.classId, current);
  });
  return [...groups.values()].sort((left, right) => right.overdueCount - left.overdueCount);
}

export function getRecentSupervisionTasks(tasks: CollaborationTask[], now: Date) {
  return sortTasksForAction(tasks, now).slice(0, 3);
}

export function getLatestSupervisionRecord(
  taskId: string,
  records: SupervisionRecord[],
) {
  return records
    .filter((record) => record.taskId === taskId)
    .sort((left, right) => new Date(right.createdAt).getTime() - new Date(left.createdAt).getTime())[0];
}

export function getTaskAssigneeName(task: CollaborationTask, users: DemoUser[]) {
  return users.find((user) => user.id === task.assigneeId)?.name ?? '责任班主任';
}

export function getTaskDeadlineLabel(task: CollaborationTask, now: Date) {
  return formatTaskDeadline(task, now);
}
