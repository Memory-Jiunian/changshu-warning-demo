import type { ObservationRecord } from '../domain/feedback';
import type { CollaborationTask } from '../domain/tasks';
import { sortTasksForAction } from './taskSelectors';

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
