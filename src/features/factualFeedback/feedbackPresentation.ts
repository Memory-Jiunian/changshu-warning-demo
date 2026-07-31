import type { CollaborationTask } from '../../domain/tasks';
import type { Slice2Action } from '../../selectors/factualFeedbackSelectors';

export function formatFeedbackRemaining(task: CollaborationTask, now: Date) {
  if (!task.dueAt) return '';
  const remainingMs = new Date(task.dueAt).getTime() - now.getTime();
  if (remainingMs <= 0) return '反馈已超时，请尽快提交事实反馈';
  const remainingHours = Math.max(1, Math.ceil(remainingMs / 3_600_000));
  return `反馈剩余时间：${remainingHours}小时`;
}

export function formatActionDateTime(value: string) {
  return new Date(value).toLocaleString('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
}

export function getActionCardContent(action: Slice2Action) {
  if (action.kind === 'feedback_request') {
    return {
      taskType: '事实观察反馈',
      requirementLabel: '反馈要求',
      timeLabel: '截止时间',
      statusLabel: action.status === 'overdue' ? '已超时' : '待反馈',
      statusVariant: action.status === 'overdue' ? 'error' : 'default',
      cta: '填写反馈',
    } as const;
  }
  if (action.kind === 'retest_reminder') {
    return {
      taskType: '复测提醒',
      requirementLabel: '提醒要求',
      timeLabel: '复测时间',
      statusLabel: '待提醒',
      statusVariant: 'warning',
      cta: '查看安排',
    } as const;
  }
  return {
    taskType: '待干预提醒',
    requirementLabel: '提醒要求',
    timeLabel: '干预时间',
    statusLabel: '待提醒',
    statusVariant: 'warning',
    cta: '查看安排',
  } as const;
}
