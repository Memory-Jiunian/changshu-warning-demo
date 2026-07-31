import type { ObservationRecord } from '../domain/feedback';
import type {
  FeedbackRequest,
  InterventionAppointment,
  InterventionReminderRecord,
  TeacherActionDataIssue,
  TeacherActionItem,
} from '../domain/teacherActions';
import type { CollaborationTask, RetestSchedule } from '../domain/tasks';
import type { DemoUser } from '../domain/users';
import { canUserViewStudent } from './permissionSelectors';

function isPast(value: string, now: Date) {
  return new Date(value).getTime() < now.getTime();
}

function compareFeedbackRequests(left: FeedbackRequest, right: FeedbackRequest) {
  return (
    left.requestedAt.localeCompare(right.requestedAt) ||
    left.id.localeCompare(right.id)
  );
}

function latestFeedbackRequests(requests: FeedbackRequest[]) {
  const latest = new Map<string, FeedbackRequest>();
  for (const request of requests) {
    const current = latest.get(request.warningId);
    if (!current || compareFeedbackRequests(request, current) > 0) {
      latest.set(request.warningId, request);
    }
  }
  return [...latest.values()];
}

export function getTeacherActionDataIssues(
  feedbackRequests: FeedbackRequest[],
): TeacherActionDataIssue[] {
  const requestsByWarning = new Map<string, FeedbackRequest[]>();
  for (const request of feedbackRequests) {
    const requests = requestsByWarning.get(request.warningId) ?? [];
    requests.push(request);
    requestsByWarning.set(request.warningId, requests);
  }

  return [...requestsByWarning.entries()].flatMap(
    ([warningId, requests]): TeacherActionDataIssue[] => {
      const pending = requests
        .filter((request) => request.status === 'pending')
        .sort(compareFeedbackRequests);
      if (pending.length < 2) return [];
      return [{
        code: 'MULTIPLE_PENDING_FEEDBACK_ROUNDS',
        warningId,
        requestIds: pending.map((request) => request.id),
        currentRequestId: pending[pending.length - 1].id,
      }];
    },
  );
}

function sortActionItems(items: TeacherActionItem[]) {
  return [...items].sort((left, right) => {
    if (left.status !== right.status) return left.status === 'overdue' ? -1 : 1;
    const actionCompare =
      new Date(left.actionAt).getTime() - new Date(right.actionAt).getTime();
    if (actionCompare) return actionCompare;
    const createdCompare =
      new Date(left.createdAt).getTime() - new Date(right.createdAt).getTime();
    return createdCompare || left.id.localeCompare(right.id);
  });
}

export function getTeacherActionItems({
  user,
  tasks,
  feedbackRequests,
  observations,
  retestSchedules,
  interventionAppointments,
  interventionReminderRecords,
  now,
}: {
  user: DemoUser;
  tasks: CollaborationTask[];
  feedbackRequests: FeedbackRequest[];
  observations: ObservationRecord[];
  retestSchedules: RetestSchedule[];
  interventionAppointments: InterventionAppointment[];
  interventionReminderRecords: InterventionReminderRecord[];
  now: Date;
}) {
  if (user.role !== 'head_teacher') return [];

  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const feedbackItems = latestFeedbackRequests(feedbackRequests).flatMap(
    (request): TeacherActionItem[] => {
      const task = taskById.get(request.taskId);
      const hasRecord = observations.some(
        (record) => record.requestId === request.id,
      );
      if (
        !task ||
        task.assigneeId !== user.id ||
        request.status === 'completed' ||
        hasRecord
      ) {
        return [];
      }
      const overdue = request.status === 'overdue' || isPast(request.deadline, now);
      return [{
        id: `teacher-action:feedback:${request.id}`,
        kind: 'feedback_request',
        assigneeId: user.id,
        student: task.student,
        createdAt: request.requestedAt,
        actionAt: request.deadline,
        deadline: request.deadline,
        status: overdue ? 'overdue' : 'pending',
        sourceId: request.id,
        requirement: request.requestNote,
        target: {
          name: 'feedback',
          taskId: request.taskId,
          sourceRequestId: request.id,
        },
      }];
    },
  );

  const retestItems = tasks.flatMap((task): TeacherActionItem[] => {
    if (
      task.assigneeId !== user.id ||
      task.type !== 'retest_reminder' ||
      task.status !== 'pending'
    ) {
      return [];
    }
    const schedule = retestSchedules.find((item) => item.taskId === task.id);
    if (!schedule || schedule.reminderConfirmedAt) return [];
    const deadline = task.dueAt ?? schedule.scheduledAt;
    return [{
      id: `teacher-action:retest:${task.id}`,
      kind: 'retest_reminder',
      assigneeId: user.id,
      student: task.student,
      createdAt: task.createdAt,
      actionAt: schedule.scheduledAt,
      deadline,
      status: isPast(deadline, now) ? 'overdue' : 'pending',
      sourceId: schedule.id,
      requirement: schedule.instructions,
      target: { name: 'retest', taskId: task.id },
    }];
  });

  const confirmedAppointmentIds = new Set(
    interventionReminderRecords.map((record) => record.sourceAppointmentId),
  );
  const interventionItems = interventionAppointments.flatMap(
    (appointment): TeacherActionItem[] => {
      if (
        appointment.status !== 'planned' ||
        confirmedAppointmentIds.has(appointment.id) ||
        new Date(appointment.plannedAt).getTime() <= now.getTime() ||
        !canUserViewStudent(user, appointment.student)
      ) {
        return [];
      }
      return [{
        id: `teacher-action:intervention:${appointment.id}`,
        kind: 'intervention_reminder',
        assigneeId: user.id,
        student: appointment.student,
        createdAt: appointment.createdAt,
        actionAt: appointment.plannedAt,
        deadline: appointment.plannedAt,
        status: 'pending',
        sourceId: appointment.id,
        requirement: appointment.note,
        target: {
          name: 'intervention',
          sourceAppointmentId: appointment.id,
        },
      }];
    },
  );

  return sortActionItems([
    ...feedbackItems,
    ...retestItems,
    ...interventionItems,
  ]);
}
