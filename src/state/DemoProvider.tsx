import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import type {
  AbnormalReport,
  AbnormalReportInput,
  ObservationInput,
  ObservationRecord,
  SupervisionInput,
  SupervisionRecord,
} from '../domain/feedback';
import type { Result } from '../domain/result';
import type { CollaborationTask, RetestReminderMethod, RetestSchedule } from '../domain/tasks';
import type { DemoUser, UserRole } from '../domain/users';
import { createDemoRepository, type DemoSnapshot } from '../data/demoRepository';
import { toLegacyWarningTasks } from '../data/legacyAdapter';
import type { WarningTask } from '../mockData';
import { getTaskCounts, getTeacherPendingTaskCount } from '../selectors/taskSelectors';

interface DemoContextValue {
  currentRole: UserRole;
  currentUser: DemoUser;
  users: DemoUser[];
  tasks: CollaborationTask[];
  observations: ObservationRecord[];
  retestSchedules: RetestSchedule[];
  supervisionRecords: SupervisionRecord[];
  legacyTasks: WarningTask[];
  now: string;
  pendingCount: number;
  overdueCount: number;
  todayReminderCount: number;
  todayNewCount: number;
  loading: boolean;
  error: string | null;
  switchDemoRole: (role: UserRole) => Result<DemoUser>;
  getTaskById: (taskId: string) => Result<CollaborationTask>;
  markTaskRead: (taskId: string) => Promise<Result<CollaborationTask>>;
  submitObservation: (taskId: string, input: ObservationInput) => Promise<Result<ObservationRecord>>;
  submitObservationRevision: (taskId: string, input: ObservationInput) => Promise<Result<ObservationRecord>>;
  submitAbnormalReport: (input: AbnormalReportInput) => Promise<Result<AbnormalReport>>;
  confirmRetestReminder: (taskId: string, method: RetestReminderMethod) => Promise<Result<RetestSchedule>>;
  addSupervisionRecord: (taskId: string, input: SupervisionInput) => Promise<Result<SupervisionRecord>>;
  simulateNextWriteFailure: () => void;
  reload: () => void;
}

const DemoContext = createContext<DemoContextValue | null>(null);

function requireSnapshot(result: Result<DemoSnapshot>) {
  if (!result.ok) throw new Error(result.message);
  return result.data;
}

export function DemoProvider({ children }: { children: ReactNode }) {
  const [repository] = useState(() =>
    createDemoRepository({
      storage: typeof window === 'undefined' ? undefined : window.sessionStorage,
    }),
  );
  const [snapshot, setSnapshot] = useState(() => requireSnapshot(repository.getViewSnapshot()));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(() => {
    const result = repository.getViewSnapshot();
    if (!result.ok) {
      setError(result.message);
      return;
    }
    setSnapshot(result.data);
    setError(null);
  }, [repository]);

  const runWrite = useCallback(
    async <T,>(operation: () => Promise<Result<T>>) => {
      setLoading(true);
      setError(null);
      try {
        const result = await operation();
        if (result.ok) refresh();
        return result;
      } finally {
        setLoading(false);
      }
    },
    [refresh],
  );

  const switchDemoRole = useCallback(
    (role: UserRole) => {
      const result = repository.switchDemoRole(role);
      if (result.ok) refresh();
      else setError(result.message);
      return result;
    },
    [refresh, repository],
  );

  const counts = useMemo(
    () => getTaskCounts(snapshot.tasks, new Date(snapshot.now)),
    [snapshot.now, snapshot.tasks],
  );
  const legacyTasks = useMemo(() => toLegacyWarningTasks(snapshot), [snapshot]);
  const pendingCount =
    snapshot.currentUser.role === 'head_teacher'
      ? getTeacherPendingTaskCount(snapshot.tasks)
      : counts.pending;

  const value = useMemo<DemoContextValue>(
    () => ({
      currentRole: snapshot.currentUser.role,
      currentUser: snapshot.currentUser,
      users: snapshot.users,
      tasks: snapshot.tasks,
      observations: snapshot.observations,
      retestSchedules: snapshot.retestSchedules,
      supervisionRecords: snapshot.supervisionRecords,
      legacyTasks,
      now: snapshot.now,
      pendingCount,
      overdueCount: counts.overdue,
      todayReminderCount: counts.todayReminders,
      todayNewCount: counts.todayNew,
      loading,
      error,
      switchDemoRole,
      getTaskById: (taskId) => repository.getTaskById(taskId, snapshot.currentUser),
      markTaskRead: (taskId) => runWrite(() => repository.markTaskRead(taskId)),
      submitObservation: (taskId, input) => runWrite(() => repository.submitObservation(taskId, input)),
      submitObservationRevision: (taskId, input) =>
        runWrite(() => repository.submitObservationRevision(taskId, input)),
      submitAbnormalReport: (input) => runWrite(() => repository.submitAbnormalReport(input)),
      confirmRetestReminder: (taskId, method) =>
        runWrite(() => repository.confirmRetestReminder(taskId, method)),
      addSupervisionRecord: (taskId, input) =>
        runWrite(() => repository.addSupervisionRecord(taskId, input)),
      simulateNextWriteFailure: () => repository.simulateNextWriteFailure(),
      reload: refresh,
    }),
    [
      counts.overdue,
      counts.todayReminders,
      counts.todayNew,
      error,
      legacyTasks,
      loading,
      pendingCount,
      refresh,
      repository,
      runWrite,
      snapshot.currentUser,
      snapshot.now,
      snapshot.observations,
      snapshot.retestSchedules,
      snapshot.supervisionRecords,
      snapshot.tasks,
      snapshot.users,
      switchDemoRole,
    ],
  );

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo() {
  const context = useContext(DemoContext);
  if (!context) throw new Error('useDemo must be used inside DemoProvider');
  return context;
}
