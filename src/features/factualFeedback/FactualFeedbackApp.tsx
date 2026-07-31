import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ObservationRecord } from '../../domain/feedback';
import { useDemo } from '../../state/DemoProvider';
import {
  getTaskObservationRecords,
} from '../../selectors/taskSelectors';
import {
  getLatestObservationRecord,
  getSlice2Actions,
  type Slice2FeedbackAction,
  type Slice2RetestAction,
  type TeacherInterventionAction,
} from '../../selectors/factualFeedbackSelectors';
import { AbnormalReportPage } from '../../pages/AbnormalReportPage';
import { Toast } from './components/Toast';
import { Button } from './components/Button';
import { TeacherReminderBottomSheet } from './components/TeacherReminderBottomSheet';
import { PendingTasksPage } from './pages/PendingTasksPage';
import { PsychologistReviewPage } from './pages/PsychologistReviewPage';
import {
  parseFactualFeedbackRoute,
  type FactualFeedbackRoute,
} from './routes';
import './factual-feedback.css';

function replaceHash(hash: string) {
  window.history.replaceState(
    null,
    '',
    `${window.location.pathname}${window.location.search}${hash}`,
  );
}

export function FactualFeedbackApp({ hash }: { hash: string }) {
  const {
    currentRole,
    currentUser,
    students,
    tasks,
    teacherActionItems,
    retestSchedules,
    interventionAppointments,
    observations,
    now,
    loading,
    error,
    switchDemoRole,
    getTaskById,
    markTaskRead,
    submitFeedbackRequestRecord,
    submitAbnormalReport,
    confirmRetestReminder,
    confirmInterventionReminder,
    markFeedbackViewed,
    simulateNextWriteFailure,
  } = useDemo();
  const route = parseFactualFeedbackRoute(hash);
  const [toast, setToast] = useState('');
  const [openedFeedbackAction, setOpenedFeedbackAction] =
    useState<Slice2FeedbackAction | null>(null);
  const [selectedReminderAction, setSelectedReminderAction] = useState<
    Slice2RetestAction | TeacherInterventionAction | null
  >(null);
  const [reportOpen, setReportOpen] = useState(false);
  const failureModeHandled = useRef(false);
  const requiredRole =
    route.name === 'psychologistReview' ? 'psychologist' : 'head_teacher';

  useEffect(() => {
    if (requiredRole === 'psychologist' && currentRole !== requiredRole) {
      switchDemoRole(requiredRole);
    }
  }, [currentRole, requiredRole, switchDemoRole]);

  useEffect(() => {
    if (failureModeHandled.current) return;
    const params = new URLSearchParams(window.location.search);
    if (params.get('failNextWrite') !== '1') return;
    failureModeHandled.current = true;
    simulateNextWriteFailure();
    params.delete('failNextWrite');
    const nextSearch = params.toString();
    window.history.replaceState(
      null,
      '',
      `${window.location.pathname}${nextSearch ? `?${nextSearch}` : ''}${window.location.hash}`,
    );
  }, [simulateNextWriteFailure]);

  const navigate = useCallback((nextHash: string, replace = false) => {
    if (replace) {
      replaceHash(nextHash);
      window.dispatchEvent(new HashChangeEvent('hashchange'));
      return;
    }
    window.location.hash = nextHash;
  }, []);

  const slice2Actions = useMemo(
    () => getSlice2Actions(teacherActionItems),
    [teacherActionItems],
  );
  const teacherTaskId = route.name === 'teacherTasks' ? route.taskId : undefined;
  const currentFeedbackAction =
    teacherTaskId
      ? slice2Actions.find(
          (action): action is Slice2FeedbackAction =>
            action.kind === 'feedback_request' &&
            action.target.taskId === teacherTaskId,
        )
      : undefined;
  const selectedFeedbackAction =
    currentFeedbackAction ??
    (route.name === 'teacherTasks' &&
    teacherTaskId &&
    openedFeedbackAction?.target.taskId === teacherTaskId
      ? openedFeedbackAction
      : undefined);

  useEffect(() => {
    if (currentFeedbackAction) {
      setOpenedFeedbackAction(currentFeedbackAction);
      return;
    }
    if (route.name === 'teacherTasks' && !teacherTaskId) {
      setOpenedFeedbackAction(null);
    }
  }, [currentFeedbackAction, route.name, teacherTaskId]);

  useEffect(() => {
    if (
      currentRole === 'head_teacher' &&
      route.name === 'teacherTasks' &&
      teacherTaskId &&
      !selectedFeedbackAction
    ) {
      navigate('#/feedback/tasks', true);
    }
  }, [currentRole, navigate, route.name, selectedFeedbackAction, teacherTaskId]);

  if (currentRole !== requiredRole) {
    return <main className="ff-app ff-loading-state">正在切换角色…</main>;
  }

  if (error) {
    return (
      <main className="ff-app ff-loading-state">
        <strong>数据暂时不可用</strong>
        <p>{error}</p>
      </main>
    );
  }

  if (route.name === 'notFound') {
    return (
      <main className="ff-app ff-loading-state">
        <strong>页面不存在</strong>
        <Button onClick={() => navigate('#/feedback/tasks')}>返回我的待办</Button>
      </main>
    );
  }

  if (route.name === 'psychologistReview') {
    const taskAccess = getTaskById(route.taskId);
    if (!taskAccess.ok) {
      return (
        <main className="ff-app ff-loading-state">
          <strong>无法查看该反馈</strong>
          <p>{taskAccess.message}</p>
        </main>
      );
    }
    const latestRecord = getLatestObservationRecord(
      observations,
      taskAccess.data.id,
    );
    return (
      <>
        <PsychologistReviewPage
          task={taskAccess.data}
          record={latestRecord}
          loading={loading}
          onBack={() => navigate('#/feedback/tasks')}
          onViewed={async (taskId) => {
            const result = await markFeedbackViewed(taskId);
            setToast(result.ok ? '已确认查看' : result.message);
            return result;
          }}
        />
        <Toast message={toast} onDismiss={() => setToast('')} />
      </>
    );
  }

  let selectedTask;
  if (selectedFeedbackAction) {
    const taskAccess = getTaskById(selectedFeedbackAction.target.taskId);
    if (!taskAccess.ok) {
      return (
        <main className="ff-app ff-loading-state">
          <strong>无法查看该待办</strong>
          <p>{taskAccess.message}</p>
          <Button onClick={() => navigate('#/feedback/tasks', true)}>返回我的待办</Button>
        </main>
      );
    }
    selectedTask = taskAccess.data;
  }

  const selectedRetestTask =
    selectedReminderAction?.kind === 'retest_reminder'
      ? getTaskById(selectedReminderAction.target.taskId)
      : null;
  const selectedRetestSchedule =
    selectedRetestTask?.ok
      ? retestSchedules.find((schedule) => schedule.taskId === selectedRetestTask.data.id)
      : undefined;
  const selectedInterventionAppointment =
    selectedReminderAction?.kind === 'intervention_reminder'
      ? interventionAppointments.find(
          (appointment) =>
            appointment.id === selectedReminderAction.target.sourceAppointmentId,
        )
      : undefined;

  return (
    <>
      <PendingTasksPage
        currentUser={currentUser}
        actions={slice2Actions}
        observations={observations}
        selectedAction={selectedFeedbackAction}
        selectedTask={selectedTask}
        now={now}
        loading={loading}
        onOpenAction={(action) => {
          if (action.kind === 'feedback_request') {
            navigate(`#/feedback/tasks/${action.target.taskId}`);
            return;
          }
          setSelectedReminderAction(action);
        }}
        onOpenReport={() => setReportOpen(true)}
        onCloseTask={() => navigate('#/feedback/tasks', true)}
        onDraftSaved={() => setToast('已自动保存草稿')}
        onSubmitted={(_record: ObservationRecord) => {
          navigate('#/feedback/tasks', true);
          setToast('反馈已提交');
        }}
        markTaskRead={markTaskRead}
        submitFeedbackRequestRecord={submitFeedbackRequestRecord}
      />
      {selectedReminderAction ? (
        <TeacherReminderBottomSheet
          action={selectedReminderAction}
          task={selectedRetestTask?.ok ? selectedRetestTask.data : undefined}
          schedule={selectedRetestSchedule}
          appointment={selectedInterventionAppointment}
          currentUser={currentUser}
          loading={loading}
          onClose={() => setSelectedReminderAction(null)}
          onConfirmed={() => {
            setSelectedReminderAction(null);
            navigate('#/feedback/tasks', true);
            setToast('已确认提醒');
          }}
          confirmRetestReminder={confirmRetestReminder}
          confirmInterventionReminder={confirmInterventionReminder}
        />
      ) : null}
      {reportOpen ? (
        <AbnormalReportPage
          currentUser={currentUser}
          students={students}
          now={now}
          loading={loading}
          onBack={() => setReportOpen(false)}
          submitAbnormalReport={submitAbnormalReport}
        />
      ) : null}
      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  );
}
