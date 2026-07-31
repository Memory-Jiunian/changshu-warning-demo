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
  FeedbackRecordInput,
  ObservationInput,
  ObservationRecord,
  SupervisionInput,
  SupervisionRecord,
  CurrentSupervisionInput,
} from '../domain/feedback';
import type { Result } from '../domain/result';
import type { StudentProfile } from '../domain/students';
import type {
  FeedbackRequest,
  InterventionAppointment,
  InterventionReminderConfirmationInput,
  InterventionReminderRecord,
  TeacherActionDataIssue,
  TeacherActionItem,
} from '../domain/teacherActions';
import type {
  CollaborationTask,
  RetestReminderConfirmationInput,
  RetestSchedule,
} from '../domain/tasks';
import type { DemoUser, UserRole } from '../domain/users';
import { createDemoRepository, type DemoSnapshot } from '../data/demoRepository';
import { toLegacyWarningTasks } from '../data/legacyAdapter';
import type { WarningTask } from '../mockData';
import { getTaskCounts, getTeacherPendingTaskCount } from '../selectors/taskSelectors';
import type { GradeDirectorSupervisionItem } from '../selectors/gradeDirectorSelectors';

interface DemoContextValue {
  currentRole: UserRole;
  currentUser: DemoUser;
  users: DemoUser[];
  students: StudentProfile[];
  tasks: CollaborationTask[];
  observations: ObservationRecord[];
  abnormalReports: AbnormalReport[];
  retestSchedules: RetestSchedule[];
  supervisionRecords: SupervisionRecord[];
  feedbackRequests: FeedbackRequest[];
  interventionAppointments: InterventionAppointment[];
  interventionReminderRecords: InterventionReminderRecord[];
  teacherActionItems: TeacherActionItem[];
  teacherActionDataIssues: TeacherActionDataIssue[];
  gradeDirectorSupervisionItems: GradeDirectorSupervisionItem[];
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
  getAbnormalReportById: (reportId: string) => Result<AbnormalReport>;
  markTaskRead: (taskId: string) => Promise<Result<CollaborationTask>>;
  markFeedbackViewed: (taskId: string) => Promise<Result<ObservationRecord>>;
  submitObservation: (taskId: string, input: ObservationInput) => Promise<Result<ObservationRecord>>;
  submitObservationRevision: (taskId: string, input: ObservationInput) => Promise<Result<ObservationRecord>>;
  submitFeedbackRequestRecord: (
    sourceRequestId: string,
    input: FeedbackRecordInput,
  ) => Promise<Result<ObservationRecord>>;
  submitAbnormalReport: (input: AbnormalReportInput) => Promise<Result<AbnormalReport>>;
  confirmRetestReminder: (
    taskId: string,
    input: RetestReminderConfirmationInput,
  ) => Promise<Result<RetestSchedule>>;
  confirmInterventionReminder: (
    appointmentId: string,
    input: InterventionReminderConfirmationInput,
  ) => Promise<Result<InterventionReminderRecord>>;
  addSupervisionRecord: (taskId: string, input: SupervisionInput) => Promise<Result<SupervisionRecord>>;
  addCurrentSupervisionRecord: (sourceActionId: string, input: CurrentSupervisionInput) => Promise<Result<SupervisionRecord>>;
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
    () => getTaskCounts(snapshot.tasks, new Date(snapshot.now), snapshot.retestSchedules),
    [snapshot.now, snapshot.retestSchedules, snapshot.tasks],
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
      students: snapshot.students,
      tasks: snapshot.tasks,
      observations: snapshot.observations,
      abnormalReports: snapshot.abnormalReports,
      retestSchedules: snapshot.retestSchedules,
      supervisionRecords: snapshot.supervisionRecords,
      feedbackRequests: snapshot.feedbackRequests,
      interventionAppointments: snapshot.interventionAppointments,
      interventionReminderRecords: snapshot.interventionReminderRecords,
      teacherActionItems: snapshot.teacherActionItems,
      teacherActionDataIssues: snapshot.teacherActionDataIssues,
      gradeDirectorSupervisionItems: snapshot.gradeDirectorSupervisionItems,
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
      getAbnormalReportById: (reportId) =>
        repository.getAbnormalReportById(reportId, snapshot.currentUser),
      markTaskRead: (taskId) => runWrite(() => repository.markTaskRead(taskId)),
      markFeedbackViewed: (taskId) =>
        runWrite(() => repository.markFeedbackViewed(taskId)),
      submitObservation: (taskId, input) => runWrite(() => repository.submitObservation(taskId, input)),
      submitObservationRevision: (taskId, input) =>
        runWrite(() => repository.submitObservationRevision(taskId, input)),
      submitFeedbackRequestRecord: (sourceRequestId, input) =>
        runWrite(() =>
          repository.submitFeedbackRequestRecord(sourceRequestId, input),
        ),
      submitAbnormalReport: (input) => runWrite(() => repository.submitAbnormalReport(input)),
      confirmRetestReminder: (taskId, input) =>
        runWrite(() => repository.confirmRetestReminder(taskId, input)),
      confirmInterventionReminder: (appointmentId, input) =>
        runWrite(() =>
          repository.confirmInterventionReminder(appointmentId, input),
        ),
      addSupervisionRecord: (taskId, input) =>
        runWrite(() => repository.addSupervisionRecord(taskId, input)),
      addCurrentSupervisionRecord: (sourceActionId, input) =>
        runWrite(() => repository.addCurrentSupervisionRecord(sourceActionId, input)),
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
      snapshot.abnormalReports,
      snapshot.feedbackRequests,
      snapshot.interventionAppointments,
      snapshot.interventionReminderRecords,
      snapshot.now,
      snapshot.observations,
      snapshot.retestSchedules,
      snapshot.students,
      snapshot.supervisionRecords,
      snapshot.tasks,
      snapshot.teacherActionItems,
      snapshot.teacherActionDataIssues,
      snapshot.gradeDirectorSupervisionItems,
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
