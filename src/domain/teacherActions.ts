import type { StudentRef } from './tasks';

export type FeedbackRequestStatus = 'pending' | 'overdue' | 'completed';

export interface FeedbackRequest {
  id: string;
  warningId: string;
  taskId: string;
  requestedAt: string;
  requestedByNameSnapshot: string;
  requestedById?: string;
  requestNote: string;
  deadline: string;
  status: FeedbackRequestStatus;
}

export type InterventionAppointmentStatus =
  | 'planned'
  | 'completed'
  | 'no_show'
  | 'cancelled'
  | 'rescheduled';

export interface InterventionAppointment {
  id: string;
  warningId: string;
  student: StudentRef;
  plannedAt: string;
  location: string;
  responsiblePsychologist: string;
  escortTeacher?: string;
  note?: string;
  status: InterventionAppointmentStatus;
  createdAt: string;
  createdBy: string;
  rescheduledFromId?: string;
  cancelledAt?: string;
  cancellationReason?: string;
}

export type ReminderMethod = 'in_person' | 'class_message' | 'phone' | 'other';

export interface InterventionReminderConfirmationInput {
  submissionRequestId: string;
  method: ReminderMethod;
  otherMethod?: string;
}

export interface InterventionReminderRecord {
  id: string;
  sourceAppointmentId: string;
  actionId: string;
  confirmedAt: string;
  confirmedById: string;
  method: ReminderMethod;
  otherMethod?: string;
  submissionRequestId: string;
}

export type TeacherActionKind =
  | 'feedback_request'
  | 'retest_reminder'
  | 'intervention_reminder';

export type TeacherActionStatus = 'pending' | 'overdue';

export type TeacherActionTarget =
  | { name: 'feedback'; taskId: string; sourceRequestId: string }
  | { name: 'retest'; taskId: string }
  | { name: 'intervention'; sourceAppointmentId: string };

export interface TeacherActionItem {
  id: string;
  kind: TeacherActionKind;
  assigneeId: string;
  student: StudentRef;
  createdAt: string;
  actionAt: string;
  deadline?: string;
  status: TeacherActionStatus;
  sourceId: string;
  requirement?: string;
  target: TeacherActionTarget;
}

export interface TeacherActionDataIssue {
  code: 'MULTIPLE_PENDING_FEEDBACK_ROUNDS';
  warningId: string;
  requestIds: string[];
  currentRequestId: string;
}
