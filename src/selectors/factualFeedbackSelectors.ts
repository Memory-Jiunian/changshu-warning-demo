import type { ObservationRecord } from '../domain/feedback';
import type {
  TeacherActionItem,
  TeacherActionTarget,
} from '../domain/teacherActions';
import type { CollaborationTask } from '../domain/tasks';
import { sortTasksForAction } from './taskSelectors';

type FeedbackTarget = Extract<TeacherActionTarget, { name: 'feedback' }>;
type RetestTarget = Extract<TeacherActionTarget, { name: 'retest' }>;
type InterventionTarget = Extract<TeacherActionTarget, { name: 'intervention' }>;

export type Slice2FeedbackAction = TeacherActionItem & {
  kind: 'feedback_request';
  target: FeedbackTarget;
};

export type Slice2RetestAction = TeacherActionItem & {
  kind: 'retest_reminder';
  target: RetestTarget;
};

export type TeacherInterventionAction = TeacherActionItem & {
  kind: 'intervention_reminder';
  target: InterventionTarget;
};

export type Slice2Action =
  | Slice2FeedbackAction
  | Slice2RetestAction
  | TeacherInterventionAction;

function isSlice2Action(action: TeacherActionItem): action is Slice2Action {
  return (
    (action.kind === 'feedback_request' && action.target.name === 'feedback') ||
    (action.kind === 'retest_reminder' && action.target.name === 'retest') ||
    (action.kind === 'intervention_reminder' &&
      action.target.name === 'intervention')
  );
}

export function getSlice2Actions(actions: TeacherActionItem[]) {
  return actions.filter(isSlice2Action).sort((left, right) => {
    const leftOverdueFeedback =
      left.kind === 'feedback_request' && left.status === 'overdue';
    const rightOverdueFeedback =
      right.kind === 'feedback_request' && right.status === 'overdue';
    if (leftOverdueFeedback !== rightOverdueFeedback) {
      return leftOverdueFeedback ? -1 : 1;
    }
    const actionAt =
      new Date(left.actionAt).getTime() - new Date(right.actionAt).getTime();
    if (actionAt) return actionAt;
    const createdAt =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    return createdAt || left.id.localeCompare(right.id);
  });
}

const factualObservationTypes = new Set<CollaborationTask['type']>([
  'default_observation',
  'additional_feedback',
  'feedback_revision',
]);

export function getPendingFactualFeedbackTasks(
  tasks: CollaborationTask[],
  now: Date,
) {
  return sortTasksForAction(
    tasks.filter(
      (task) =>
        factualObservationTypes.has(task.type) &&
        ['pending', 'returned'].includes(task.status),
    ),
    now,
  );
}

export function getLatestObservationRecord(
  records: ObservationRecord[],
  taskId: string,
) {
  return [...records]
    .filter((record) => record.taskId === taskId)
    .sort(
      (left, right) =>
        new Date(right.submittedAt).getTime() -
        new Date(left.submittedAt).getTime(),
    )[0];
}
