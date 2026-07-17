import type {
  AbnormalReportDraft,
  AbnormalReportFormValues,
} from '../domain/feedback';

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
  const draft: AbnormalReportDraft = {
    version: DRAFT_VERSION,
    userId,
    values,
    updatedAt,
  };
  storage.setItem(draftKey(userId), JSON.stringify(draft));
  return draft;
}

export function removeAbnormalReportDraft(storage: Storage, userId: string) {
  storage.removeItem(draftKey(userId));
}
