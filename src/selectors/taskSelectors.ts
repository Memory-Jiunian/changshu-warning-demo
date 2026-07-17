import type { CollaborationTask, TaskDisplayState, TaskUrgency } from '../domain/tasks';

const DAY_MS = 24 * 60 * 60 * 1000;

export function isSameLocalDate(left: Date, right: Date) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function isTaskOverdue(task: CollaborationTask, now: Date) {
  if (!task.dueAt || !['pending', 'returned'].includes(task.status)) return false;
  return new Date(task.dueAt).getTime() < now.getTime();
}

export function isTaskDueToday(task: CollaborationTask, now: Date) {
  return Boolean(task.dueAt && isSameLocalDate(new Date(task.dueAt), now));
}

export function canTaskAcceptObservation(task: CollaborationTask) {
  return (
    ['pending', 'returned'].includes(task.status) &&
    ['default_observation', 'additional_feedback', 'feedback_revision'].includes(task.type)
  );
}

function timeLabel(date: Date) {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

export function formatTaskDeadline(task: CollaborationTask, now: Date) {
  if (!task.dueAt) return '未设置截止时间';
  const due = new Date(task.dueAt);
  const difference = due.getTime() - now.getTime();

  if (isTaskOverdue(task, now)) {
    const overdue = Math.abs(difference);
    if (overdue >= DAY_MS) return `已超时 ${Math.ceil(overdue / DAY_MS)} 天`;
    return `已超时 ${Math.max(1, Math.ceil(overdue / (60 * 60 * 1000)))} 小时`;
  }

  if (isSameLocalDate(due, now)) return `今天 ${timeLabel(due)} 前`;
  const tomorrow = new Date(now);
  tomorrow.setDate(now.getDate() + 1);
  if (isSameLocalDate(due, tomorrow)) return `明天 ${timeLabel(due)} 前`;
  return `${due.getMonth() + 1} 月 ${due.getDate()} 日 ${timeLabel(due)} 前`;
}

export function getTaskDisplayState(task: CollaborationTask, now: Date): TaskDisplayState {
  const overdueMs = task.dueAt ? Math.max(0, now.getTime() - new Date(task.dueAt).getTime()) : 0;
  const deadlineLabel = formatTaskDeadline(task, now);

  if (task.status === 'cancelled') {
    return { key: 'cancelled', label: '已取消', isOverdue: false, overdueMs: 0, deadlineLabel, canSubmitObservation: false };
  }
  if (task.status === 'completed') {
    return { key: 'completed', label: '已完成', isOverdue: false, overdueMs: 0, deadlineLabel, canSubmitObservation: false };
  }
  if (task.status === 'submitted') {
    return { key: 'submitted', label: '已提交', isOverdue: false, overdueMs: 0, deadlineLabel, canSubmitObservation: false };
  }
  if (task.status === 'returned') {
    const overdue = isTaskOverdue(task, now);
    return {
      key: overdue ? 'overdue' : 'returned',
      label: overdue ? '待补充 · 已超时' : '待补充',
      isOverdue: overdue,
      overdueMs,
      deadlineLabel,
      canSubmitObservation: canTaskAcceptObservation(task),
    };
  }

  const overdue = isTaskOverdue(task, now);
  if (overdue) {
    return { key: 'overdue', label: '已超时', isOverdue: true, overdueMs, deadlineLabel, canSubmitObservation: canTaskAcceptObservation(task) };
  }
  if (isTaskDueToday(task, now)) {
    return { key: 'due_today', label: '今日到期', isOverdue: false, overdueMs: 0, deadlineLabel, canSubmitObservation: canTaskAcceptObservation(task) };
  }
  return { key: 'pending', label: '待反馈', isOverdue: false, overdueMs: 0, deadlineLabel, canSubmitObservation: canTaskAcceptObservation(task) };
}

const urgencyRank: Record<TaskUrgency, number> = {
  urgent: 0,
  important: 1,
  normal: 2,
};

export function sortTasksForAction(tasks: CollaborationTask[], now: Date) {
  return [...tasks].sort((left, right) => {
    const leftState = getTaskDisplayState(left, now);
    const rightState = getTaskDisplayState(right, now);
    if (leftState.isOverdue !== rightState.isOverdue) return leftState.isOverdue ? -1 : 1;
    const leftToday = isTaskDueToday(left, now);
    const rightToday = isTaskDueToday(right, now);
    if (leftToday !== rightToday) return leftToday ? -1 : 1;
    if (urgencyRank[left.urgency] !== urgencyRank[right.urgency]) return urgencyRank[left.urgency] - urgencyRank[right.urgency];
    const leftDue = left.dueAt ? new Date(left.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    const rightDue = right.dueAt ? new Date(right.dueAt).getTime() : Number.MAX_SAFE_INTEGER;
    if (leftDue !== rightDue) return leftDue - rightDue;
    return new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
  });
}

export interface TaskCounts {
  pending: number;
  overdue: number;
  todayReminders: number;
  todayNew: number;
}

export function getTaskCounts(tasks: CollaborationTask[], now: Date): TaskCounts {
  return tasks.reduce<TaskCounts>(
    (counts, task) => {
      const display = getTaskDisplayState(task, now);
      if (['pending', 'returned'].includes(task.status)) counts.pending += 1;
      if (display.isOverdue) counts.overdue += 1;
      if (task.type === 'retest_reminder' && task.status === 'pending' && isTaskDueToday(task, now)) counts.todayReminders += 1;
      if (isSameLocalDate(new Date(task.createdAt), now)) counts.todayNew += 1;
      return counts;
    },
    { pending: 0, overdue: 0, todayReminders: 0, todayNew: 0 },
  );
}
