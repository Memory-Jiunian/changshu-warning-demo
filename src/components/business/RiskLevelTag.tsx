import type { RoleId } from '../../mockData';
import { Badge } from '../ui/Badge';
import './business.css';

export interface RiskLevelTagProps {
  level: string;
  roleId?: RoleId;
  label?: string;
}

function riskVariant(level: string) {
  if (level.includes('重点') || level.includes('高')) return 'error';
  if (level.includes('持续') || level.includes('中')) return 'warning';
  return 'success';
}

export function RiskLevelTag({ level, roleId, label }: RiskLevelTagProps) {
  const prefix = roleId === 'homeroomTeacher' ? '协作优先级' : '关注等级';

  return (
    <Badge className="business-risk-tag" variant={riskVariant(level)}>
      {label || `${prefix}：${level}`}
    </Badge>
  );
}
