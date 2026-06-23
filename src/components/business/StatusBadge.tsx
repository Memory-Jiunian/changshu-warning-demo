import type { StatusKey } from '../../mockData';
import { Badge } from '../ui/Badge';
import './business.css';

export interface StatusBadgeProps {
  statusKey?: StatusKey;
  status?: string;
}

const statusLabels: Partial<Record<StatusKey, string>> = {
  waitingFeedback: '待反馈',
  overdue: '逾期',
  pendingCounselorConfirm: '已提交',
  active: '处理中',
  continuousAttention: '持续关注',
  retestPending: '复测待安排',
  referral: '转介中',
  closed: '已完成',
};

const statusVariants: Partial<Record<StatusKey, 'neutral' | 'brand' | 'success' | 'warning' | 'error' | 'info'>> = {
  waitingFeedback: 'warning',
  overdue: 'error',
  pendingCounselorConfirm: 'brand',
  active: 'info',
  continuousAttention: 'warning',
  retestPending: 'brand',
  referral: 'error',
  closed: 'success',
};

export function StatusBadge({ statusKey, status }: StatusBadgeProps) {
  const label = statusKey ? statusLabels[statusKey] : status;
  const variant = statusKey ? statusVariants[statusKey] : 'neutral';

  return (
    <Badge className="business-status-badge" variant={variant || 'neutral'}>
      {label || '未设置'}
    </Badge>
  );
}

