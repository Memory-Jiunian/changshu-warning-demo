import type {
  FeedbackRecordInput,
  ObservationRecord,
} from '../../../domain/feedback';
import type { Result } from '../../../domain/result';
import type { CollaborationTask } from '../../../domain/tasks';
import type { DemoUser } from '../../../domain/users';
import type {
  Slice2Action,
  Slice2FeedbackAction,
} from '../../../selectors/factualFeedbackSelectors';
import { getTaskObservationRecords } from '../../../selectors/taskSelectors';
import { MainContentPlate } from '../../../components/layout/PageFrame';
import { Button } from '../../../components/ui/Button';
import { FeedbackBottomSheet } from '../components/FeedbackBottomSheet';
import { TaskCard } from '../components/TaskCard';

export function PendingTasksPage({
  currentUser,
  actions,
  observations,
  selectedAction,
  selectedTask,
  now,
  loading,
  onOpenAction,
  onOpenReport,
  onCloseTask,
  onDraftSaved,
  onSubmitted,
  markTaskRead,
  submitFeedbackRequestRecord,
}: {
  currentUser: DemoUser;
  actions: Slice2Action[];
  observations: ObservationRecord[];
  selectedAction?: Slice2FeedbackAction;
  selectedTask?: CollaborationTask;
  now: string;
  loading: boolean;
  onOpenAction: (action: Slice2Action) => void;
  onOpenReport: () => void;
  onCloseTask: () => void;
  onDraftSaved: () => void;
  onSubmitted: (record: ObservationRecord) => void;
  markTaskRead: (taskId: string) => Promise<Result<CollaborationTask>>;
  submitFeedbackRequestRecord: (
    sourceRequestId: string,
    input: FeedbackRecordInput,
  ) => Promise<Result<ObservationRecord>>;
}) {
  const records = selectedAction
    ? getTaskObservationRecords(observations, selectedAction.target.taskId)
    : [];

  return (
    <main className="ff-app ff-pending-page">
      <header className="ff-page-header">
        <h1>我的待办</h1>
      </header>

      <section className="ff-greeting">
        <span className="ff-greeting__class-meta">
          {actions[0]?.student.className ?? '班主任工作台'}
        </span>
        <div className="ff-greeting__content">
          <p className="ff-greeting__hero-title">{currentUser.name}，您好</p>
          <strong>您有 {actions.length} 件待办需要处理</strong>
        </div>
      </section>

      <MainContentPlate className="ff-pending-page__plate">
        <section className="ff-task-list" aria-label="待反馈任务">
          {loading && actions.length === 0 ? (
            <div className="ff-state-card" role="status">正在加载待办…</div>
          ) : actions.length === 0 ? (
            <div className="ff-state-card">
              <h2>当前没有待处理事项</h2>
            </div>
          ) : (
            actions.map((action) => (
              <TaskCard
                key={action.id}
                action={action}
                onOpen={() => {
                  if (action.target.name !== 'intervention') {
                    void markTaskRead(action.target.taskId);
                  }
                  onOpenAction(action);
                }}
              />
            ))
          )}
        </section>
        <aside className="ff-report-entry" aria-label="异常情况上报入口">
          <div>
            <strong>发现需要关注的异常情况？</strong>
            <p>补充上报当前待办之外的可观察事实。</p>
          </div>
          <Button variant="secondary" size="sm" onClick={onOpenReport}>
            异常上报
          </Button>
        </aside>
      </MainContentPlate>

      {selectedAction && selectedTask ? (
        <FeedbackBottomSheet
          key={selectedAction.id}
          action={selectedAction}
          records={records}
          currentUserId={currentUser.id}
          now={now}
          onClose={onCloseTask}
          onDraftSaved={onDraftSaved}
          onSubmitted={onSubmitted}
          submitFeedbackRequestRecord={submitFeedbackRequestRecord}
        />
      ) : null}
    </main>
  );
}
