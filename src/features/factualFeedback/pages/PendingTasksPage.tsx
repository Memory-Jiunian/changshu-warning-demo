import type {
  ObservationInput,
  ObservationRecord,
} from '../../../domain/feedback';
import type { Result } from '../../../domain/result';
import type { CollaborationTask } from '../../../domain/tasks';
import type { DemoUser } from '../../../domain/users';
import { getTaskObservationRecords } from '../../../selectors/taskSelectors';
import { AppIcon } from '../../../components/ui/AppIcon';
import { FeedbackBottomSheet } from '../components/FeedbackBottomSheet';
import { TaskCard } from '../components/TaskCard';

export function PendingTasksPage({
  currentUser,
  tasks,
  observations,
  selectedTask,
  now,
  loading,
  onOpenTask,
  onCloseTask,
  onDraftSaved,
  onSubmitted,
  markTaskRead,
  submitObservation,
  submitObservationRevision,
}: {
  currentUser: DemoUser;
  tasks: CollaborationTask[];
  observations: ObservationRecord[];
  selectedTask?: CollaborationTask;
  now: string;
  loading: boolean;
  onOpenTask: (taskId: string) => void;
  onCloseTask: () => void;
  onDraftSaved: () => void;
  onSubmitted: (record: ObservationRecord) => void;
  markTaskRead: (taskId: string) => Promise<Result<CollaborationTask>>;
  submitObservation: (
    taskId: string,
    input: ObservationInput,
  ) => Promise<Result<ObservationRecord>>;
  submitObservationRevision: (
    taskId: string,
    input: ObservationInput,
  ) => Promise<Result<ObservationRecord>>;
}) {
  const records = selectedTask
    ? getTaskObservationRecords(observations, selectedTask.id)
    : [];

  return (
    <main className="ff-app">
      <header className="ff-page-header">
        <div>
          <span>{tasks[0]?.student.className ?? '班主任工作台'}</span>
          <h1>我的待办</h1>
        </div>
      </header>

      <section className="ff-greeting">
        <div>
          <p>{currentUser.name}，您好</p>
          <strong>您有 {tasks.length} 件待办需要处理</strong>
        </div>
        <span className="ff-greeting__icon">
          <AppIcon name="clipboard" size={24} />
        </span>
      </section>

      <section className="ff-task-list" aria-label="待反馈任务">
        {loading && tasks.length === 0 ? (
          <div className="ff-state-card" role="status">正在加载待办…</div>
        ) : tasks.length === 0 ? (
          <div className="ff-state-card">
            <AppIcon name="check" size={28} />
            <h2>当前没有待反馈任务</h2>
            <p>新的协作任务会显示在这里。</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              now={new Date(now)}
              onOpen={() => {
                void markTaskRead(task.id);
                onOpenTask(task.id);
              }}
            />
          ))
        )}
      </section>

      {selectedTask ? (
        <FeedbackBottomSheet
          key={selectedTask.id}
          task={selectedTask}
          records={records}
          currentUserId={currentUser.id}
          now={now}
          onClose={onCloseTask}
          onDraftSaved={onDraftSaved}
          onSubmitted={onSubmitted}
          submitObservation={submitObservation}
          submitObservationRevision={submitObservationRevision}
        />
      ) : null}
    </main>
  );
}
