import type { ReactNode } from 'react';
import type { RoleId, StatusKey } from '../../mockData';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';
import { RiskLevelTag } from './RiskLevelTag';
import { StatusBadge } from './StatusBadge';
import './business.css';

export interface TaskCardAction {
  label: string;
  onClick?: () => void;
  disabled?: boolean;
}

export interface TaskCardMeta {
  label: string;
  value: ReactNode;
}

export interface TaskCardProps {
  title: string;
  subtitle?: string;
  roleId?: RoleId;
  statusKey?: StatusKey;
  status?: string;
  riskLevel?: string;
  deadline?: string;
  tags?: string[];
  summary?: string;
  meta?: TaskCardMeta[];
  primaryAction?: TaskCardAction;
  secondaryAction?: TaskCardAction;
}

export function TaskCard({
  title,
  subtitle,
  roleId,
  statusKey,
  status,
  riskLevel,
  deadline,
  tags = [],
  summary,
  meta = [],
  primaryAction,
  secondaryAction,
}: TaskCardProps) {
  return (
    <Card as="article" className="business-task-card" tone="glass">
      <header className="business-task-card__header">
        <div>
          <h3>{title}</h3>
          {subtitle ? <p>{subtitle}</p> : null}
        </div>
        <StatusBadge statusKey={statusKey} status={status} />
      </header>

      <div className="business-task-card__meta">
        {riskLevel ? <RiskLevelTag level={riskLevel} roleId={roleId} /> : null}
        {deadline ? (
          <div className="business-task-card__line">
            <span>截止</span>
            <strong>{deadline}</strong>
          </div>
        ) : null}
        {meta.map((item) => (
          <div className="business-task-card__line" key={item.label}>
            <span>{item.label}</span>
            <strong>{item.value}</strong>
          </div>
        ))}
      </div>

      {tags.length ? (
        <div className="business-task-card__tags">
          {tags.slice(0, 2).map((tag) => (
            <span key={tag}>{tag}</span>
          ))}
        </div>
      ) : null}

      {summary ? <p className="business-task-card__summary">{summary}</p> : null}

      {(primaryAction || secondaryAction) ? (
        <footer className="business-task-card__actions">
          {secondaryAction ? (
            <Button variant="secondary" fullWidth onClick={secondaryAction.onClick} disabled={secondaryAction.disabled}>
              {secondaryAction.label}
            </Button>
          ) : null}
          {primaryAction ? (
            <Button variant="primary" fullWidth onClick={primaryAction.onClick} disabled={primaryAction.disabled}>
              {primaryAction.label}
            </Button>
          ) : null}
        </footer>
      ) : null}
    </Card>
  );
}

