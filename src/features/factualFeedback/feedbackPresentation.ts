import type { CollaborationTask } from '../../domain/tasks';

export function formatFeedbackRemaining(task: CollaborationTask, now: Date) {
  if (!task.dueAt) return '';
  const remainingMs = new Date(task.dueAt).getTime() - now.getTime();
  if (remainingMs <= 0) return '反馈已超时，请尽快提交事实反馈';
  const remainingHours = Math.max(1, Math.ceil(remainingMs / 3_600_000));
  return `反馈剩余时间：${remainingHours}小时`;
}
