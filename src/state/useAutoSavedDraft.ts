import { useCallback, useEffect, useState } from 'react';
import type { Result } from '../domain/result';
import type { DraftSaveStatus } from './navigationGuard';

interface AutoSavedDraftState {
  status: DraftSaveStatus;
  savedAt?: string;
}

export function useAutoSavedDraft({
  dirty,
  initialSavedAt,
  save,
  clear,
}: {
  dirty: boolean;
  initialSavedAt?: string;
  save: (updatedAt: string) => Result<unknown>;
  clear: () => void;
}) {
  const [state, setState] = useState<AutoSavedDraftState>(() =>
    initialSavedAt
      ? { status: 'saved', savedAt: initialSavedAt }
      : { status: 'idle' },
  );

  const saveNow = useCallback(() => {
    const updatedAt = new Date().toISOString();
    setState((current) => ({ ...current, status: 'saving' }));
    const result = save(updatedAt);
    if (!result.ok) {
      setState((current) => ({ ...current, status: 'error' }));
      return false;
    }
    setState({ status: 'saved', savedAt: updatedAt });
    return true;
  }, [save]);

  useEffect(() => {
    if (!dirty) {
      clear();
      setState({ status: 'idle' });
      return;
    }

    setState((current) => ({ ...current, status: 'saving' }));
    const timer = window.setTimeout(saveNow, 220);
    return () => window.clearTimeout(timer);
  }, [clear, dirty, saveNow]);

  const discard = useCallback(() => {
    clear();
    setState({ status: 'idle' });
  }, [clear]);

  return {
    ...state,
    retrySave: saveNow,
    discard,
    clearSavedDraft: discard,
  };
}
