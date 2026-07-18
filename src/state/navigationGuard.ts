export type DraftSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

export interface NavigationGuardRegistration {
  key: string;
  dirty: boolean;
  saveStatus: DraftSaveStatus;
  savedAt?: string;
  retrySave: () => boolean;
  discardDraft: () => void;
}

export type NavigationGuardChange = (
  registration: NavigationGuardRegistration | null,
) => void;

export function formatDraftSavedTime(value?: string) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return `${String(date.getHours()).padStart(2, '0')}:${String(
    date.getMinutes(),
  ).padStart(2, '0')}`;
}
