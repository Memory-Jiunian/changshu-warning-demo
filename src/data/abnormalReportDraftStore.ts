import type {
  AbnormalReportDraft,
  AbnormalReportFormValues,
} from '../domain/feedback';
import { err, ok } from '../domain/result';

const DRAFT_VERSION = 1;
const DRAFT_NAMESPACE = 'changshu:abnormal-report-draft:v1';

export const emptyAbnormalReportFormValues: AbnormalReportFormValues = {
  studentId: '',
  observedAt: '',
  scene: '',
  otherScene: '',
  facts: '',
  supportActions: '',
  immediateSafetyConcern: null,
  offlinePriorityAcknowledged: false,
};

function draftKey(userId: string) {
  return `${DRAFT_NAMESPACE}:${encodeURIComponent(userId)}`;
}

function isDraft(value: unknown, userId: string): value is AbnormalReportDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<AbnormalReportDraft>;
  return (
    draft.version === DRAFT_VERSION &&
    draft.userId === userId &&
    Boolean(draft.values && typeof draft.values === 'object') &&
    typeof draft.updatedAt === 'string'
  );
}

export function loadAbnormalReportDraft(storage: Storage, userId: string) {
  const key = draftKey(userId);
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isDraft(parsed, userId)) {
      storage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function saveAbnormalReportDraft(
  storage: Storage,
  userId: string,
  values: AbnormalReportFormValues,
  updatedAt: string,
) {
  try {
    const draft: AbnormalReportDraft = {
      version: DRAFT_VERSION,
      userId,
      values,
      updatedAt,
    };
    storage.setItem(draftKey(userId), JSON.stringify(draft));
    return ok(draft);
  } catch {
    return err('DRAFT_SAVE_FAILED', '草稿保存失败');
  }
}

export function removeAbnormalReportDraft(storage: Storage, userId: string) {
  try {
    storage.removeItem(draftKey(userId));
    return ok(true);
  } catch {
    return err('DRAFT_REMOVE_FAILED', '草稿清理失败');
  }
}
