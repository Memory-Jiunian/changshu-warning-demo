import {
  formatDraftSavedTime,
  type DraftSaveStatus as DraftSaveStatusValue,
} from '../../state/navigationGuard';
import { Badge } from '../ui/Badge';

export function DraftSaveStatus({
  status,
  savedAt,
}: {
  status: DraftSaveStatusValue;
  savedAt?: string;
}) {
  if (status === 'idle') return null;

  if (status === 'saving') {
    return <Badge variant="outline">正在保存</Badge>;
  }

  if (status === 'error') {
    return <Badge variant="error">草稿保存失败</Badge>;
  }

  const time = formatDraftSavedTime(savedAt);
  return (
    <Badge variant="info">
      {time ? `草稿已自动保存于 ${time}` : '草稿已自动保存'}
    </Badge>
  );
}
