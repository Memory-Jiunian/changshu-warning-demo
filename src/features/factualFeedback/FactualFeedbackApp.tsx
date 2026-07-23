import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ObservationRecord } from '../../domain/feedback';
import { useDemo } from '../../state/DemoProvider';
import {
  getTaskObservationRecords,
} from '../../selectors/taskSelectors';
import {
  getLatestObservationRecord,
  getPendingFactualFeedbackTasks,
} from '../../selectors/factualFeedbackSelectors';
import { Toast } from './components/Toast';
import { Button } from './components/Button';
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
    tasks,
    observations,
    now,
    loading,
    error,
    switchDemoRole,
    getTaskById,
    markTaskRead,
    submitObservation,
    submitObservationRevision,
    markFeedbackViewed,
    simulateNextWriteFailure,
  } = useDemo();
  const route = parseFactualFeedbackRoute(hash);
  const [toast, setToast] = useState('');
  const failureModeHandled = useRef(false);
  const requiredRole =
    route.name === 'psychologistReview' ? 'psychologist' : 'head_teacher';

  useEffect(() => {
    if (currentRole !== requiredRole) switchDemoRole(requiredRole);
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

  const teacherTasks = useMemo(
    () => getPendingFactualFeedbackTasks(tasks, new Date(now)),
    [now, tasks],
  );

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
  if (route.taskId) {
    const taskAccess = getTaskById(route.taskId);
    if (!taskAccess.ok) {
      return (
        <main className="ff-app ff-loading-state">
          <strong>无法查看该待办</strong>
          <p>{taskAccess.message}</p>
          <Button onClick={() => navigate('#/feedback/tasks', true)}>返回我的待办</Button>
        </main>
      );
    }
    if (
      !getPendingFactualFeedbackTasks([taskAccess.data], new Date(now)).length
    ) {
      return (
        <main className="ff-app ff-loading-state">
          <strong>该任务当前不可填写</strong>
          <p>已提交、已完成或已取消的任务只能在原任务记录中查看。</p>
          <Button onClick={() => navigate('#/feedback/tasks', true)}>
            返回我的待办
          </Button>
        </main>
      );
    }
    selectedTask = taskAccess.data;
  }

  return (
    <>
      <PendingTasksPage
        currentUser={currentUser}
        tasks={teacherTasks}
        observations={observations}
        selectedTask={selectedTask}
        now={now}
        loading={loading}
        onOpenTask={(taskId) => navigate(`#/feedback/tasks/${taskId}`)}
        onCloseTask={() => navigate('#/feedback/tasks', true)}
        onDraftSaved={() => setToast('已自动保存草稿')}
        onSubmitted={(_record: ObservationRecord) => {
          navigate('#/feedback/tasks', true);
          setToast('反馈已提交');
        }}
        markTaskRead={markTaskRead}
        submitObservation={submitObservation}
        submitObservationRevision={submitObservationRevision}
      />
      <Toast message={toast} onDismiss={() => setToast('')} />
    </>
  );
}
