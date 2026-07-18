import type {
  CollaborationTask,
  RetestReminderMethod,
  RetestSchedule,
} from '../domain/tasks';

export const retestReminderMethodLabels: Record<RetestReminderMethod, string> = {
  in_person: '当面提醒',
  class_message: '班级消息',
  phone: '电话',
  other: '其他',
};

export type RetestReminderDisplayState =
  | 'pending'
  | 'reminded'
  | 'student_completed'
  | 'cancelled';

export function getRetestReminderDisplayState(
  task: CollaborationTask,
  schedule: RetestSchedule,
): RetestReminderDisplayState {
  if (task.status === 'cancelled') return 'cancelled';
  if (task.status === 'completed' && schedule.studentCompletedAt) return 'student_completed';
  if (task.status === 'submitted' && schedule.reminderConfirmedAt) return 'reminded';
  return 'pending';
}

export function getRetestReminderStatusLabel(
  task: CollaborationTask,
  schedule: RetestSchedule,
) {
  const state = getRetestReminderDisplayState(task, schedule);
  if (state === 'cancelled') return '已取消';
  if (state === 'student_completed') return '学生已完成复测';
  if (state === 'reminded') return '已提醒，等待学生完成复测';
  return '待提醒';
}

export function getRetestScheduleTimeLabel(task: CollaborationTask) {
  return task.status === 'cancelled' ? '原计划复测时间' : '复测时间';
}
