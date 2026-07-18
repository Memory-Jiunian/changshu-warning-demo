import type { ObservationDraft, ObservationFormValues } from '../domain/feedback';
import { err, ok } from '../domain/result';

const DRAFT_VERSION = 1;
const DRAFT_NAMESPACE = 'changshu-demo:observation-draft:v1';

export const emptyObservationFormValues: ObservationFormValues = {
  observedAt: '',
  scene: '',
  otherScene: '',
  facts: '',
  frequency: '',
  duration: '',
  immediateSafetyConcern: null,
  additionalNotes: '',
};

function draftKey(userId: string, taskId: string) {
  return `${DRAFT_NAMESPACE}:${encodeURIComponent(userId)}:${encodeURIComponent(taskId)}`;
}

function isDraft(value: unknown, userId: string, taskId: string): value is ObservationDraft {
  if (!value || typeof value !== 'object') return false;
  const draft = value as Partial<ObservationDraft>;
  return (
    draft.version === DRAFT_VERSION &&
    draft.userId === userId &&
    draft.taskId === taskId &&
    Boolean(draft.values && typeof draft.values === 'object') &&
    typeof draft.updatedAt === 'string'
  );
}

export function loadObservationDraft(
  storage: Storage,
  userId: string,
  taskId: string,
): ObservationDraft | null {
  const key = draftKey(userId, taskId);
  const raw = storage.getItem(key);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isDraft(parsed, userId, taskId)) {
      storage.removeItem(key);
      return null;
    }
    return parsed;
  } catch {
    storage.removeItem(key);
    return null;
  }
}

export function saveObservationDraft(
  storage: Storage,
  userId: string,
  taskId: string,
  values: ObservationFormValues,
  updatedAt: string,
) {
  try {
    const draft: ObservationDraft = {
      version: DRAFT_VERSION,
      userId,
      taskId,
      values,
      updatedAt,
    };
    storage.setItem(draftKey(userId, taskId), JSON.stringify(draft));
    return ok(draft);
  } catch {
    return err('DRAFT_SAVE_FAILED', '草稿保存失败');
  }
}

export function removeObservationDraft(storage: Storage, userId: string, taskId: string) {
  try {
    storage.removeItem(draftKey(userId, taskId));
    return ok(true);
  } catch {
    return err('DRAFT_REMOVE_FAILED', '草稿清理失败');
  }
}
