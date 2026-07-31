import type { FeedbackRequest, InterventionAppointment } from '../domain/teacherActions';
import type { CollaborationTask, RetestSchedule, WarningStatus } from '../domain/tasks';

export const LONG_RUNNING_INTERVENTION_MS = 24 * 60 * 60 * 1000;

export interface PrincipalOverview {
  overall: {
    activeWarningCount: number;
    interventionCount: number;
    pendingRetestCount: number;
    closedThisMonthCount: number;
  };
  collaboration: {
    completedCount: number;
    pendingFeedbackCount: number;
    overdueCount: number;
    totalCount: number;
    completionRate: number;
    overdueByGrade: Array<{ gradeLabel: string; count: number }>;
  };
  managementAttention: {
    overdueFeedbackCount: number;
    longRunningInterventionCount: number;
    activeReferralCount: number;
  };
}

function latestFeedbackRounds(requests: FeedbackRequest[]) {
  const latest = new Map<string, FeedbackRequest>();
  for (const request of requests) {
    const current = latest.get(request.warningId);
    if (!current || request.requestedAt.localeCompare(current.requestedAt) > 0 ||
      (request.requestedAt === current.requestedAt && request.id.localeCompare(current.id) > 0)) {
      latest.set(request.warningId, request);
    }
  }
  return [...latest.values()];
}

function warningSnapshots(tasks: CollaborationTask[]) {
  const snapshots = new Map<string, { status: WarningStatus; anchor: string; closedAt?: string }>();
  for (const task of tasks) {
    if (!task.warningStatusSnapshot) continue;
    const current = snapshots.get(task.warningId);
    if (!current || task.createdAt.localeCompare(current.anchor) > 0) {
      snapshots.set(task.warningId, {
        status: task.warningStatusSnapshot,
        anchor: task.createdAt,
        closedAt: task.completedAt,
      });
    }
  }
  return snapshots;
}

export function getPrincipalOverview({ tasks, feedbackRequests, retestSchedules, interventionAppointments, now }: {
  tasks: CollaborationTask[];
  feedbackRequests: FeedbackRequest[];
  retestSchedules: RetestSchedule[];
  interventionAppointments: InterventionAppointment[];
  now: Date;
}): PrincipalOverview {
  const snapshots = warningSnapshots(tasks);
  const taskById = new Map(tasks.map((task) => [task.id, task]));
  const latestRequests = latestFeedbackRounds(feedbackRequests);
  let completedCount = 0;
  let pendingFeedbackCount = 0;
  let overdueCount = 0;
  const overdueGrades = new Map<string, number>();

  for (const request of latestRequests) {
    if (request.status === 'completed') { completedCount += 1; continue; }
    const overdue = request.status === 'overdue' || new Date(request.deadline).getTime() < now.getTime();
    if (overdue) {
      overdueCount += 1;
      const grade = taskById.get(request.taskId)?.student.gradeName;
      if (grade) overdueGrades.set(grade, (overdueGrades.get(grade) ?? 0) + 1);
    } else {
      pendingFeedbackCount += 1;
    }
  }

  const totalCount = completedCount + pendingFeedbackCount + overdueCount;
  const activeWarnings = [...snapshots.values()].filter((item) => item.status !== 'closed');
  const month = now.getMonth();
  const year = now.getFullYear();
  const closedThisMonthCount = [...snapshots.values()].filter((item) => {
    if (item.status !== 'closed' || !item.closedAt) return false;
    const closedAt = new Date(item.closedAt);
    return closedAt.getFullYear() === year && closedAt.getMonth() === month;
  }).length;
  const validRetestTaskIds = new Set(
    retestSchedules.filter((schedule) => !schedule.studentCompletedAt)
      .map((schedule) => schedule.taskId),
  );
  const pendingRetestWarningIds = new Set(
    tasks.filter((task) => task.warningStatusSnapshot === 'pending_retest' &&
      task.status !== 'cancelled' && validRetestTaskIds.has(task.id))
      .map((task) => task.warningId),
  );
  const interventionAnchors = new Map<string, string>();
  for (const appointment of interventionAppointments) {
    const current = interventionAnchors.get(appointment.warningId);
    if (!current || appointment.createdAt.localeCompare(current) < 0) {
      interventionAnchors.set(appointment.warningId, appointment.createdAt);
    }
  }
  const longRunningInterventionCount = [...snapshots.entries()].filter(
    ([warningId, item]) => {
      if (item.status !== 'in_intervention') return false;
      const anchor = interventionAnchors.get(warningId) ?? item.anchor;
      return now.getTime() - new Date(anchor).getTime() >= LONG_RUNNING_INTERVENTION_MS;
    },
  ).length;

  return {
    overall: {
      activeWarningCount: activeWarnings.length,
      interventionCount: activeWarnings.filter((item) => item.status === 'in_intervention').length,
      pendingRetestCount: pendingRetestWarningIds.size,
      closedThisMonthCount,
    },
    collaboration: {
      completedCount,
      pendingFeedbackCount,
      overdueCount,
      totalCount,
      completionRate: totalCount === 0 ? 0 : Math.round((completedCount / totalCount) * 100),
      overdueByGrade: [...overdueGrades.entries()]
        .map(([gradeLabel, count]) => ({ gradeLabel, count }))
        .sort((left, right) => right.count - left.count || left.gradeLabel.localeCompare(right.gradeLabel)),
    },
    managementAttention: {
      overdueFeedbackCount: overdueCount,
      longRunningInterventionCount,
      activeReferralCount: activeWarnings.filter((item) => item.status === 'referral').length,
    },
  };
}
