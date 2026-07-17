export type WarningStatus =
  | 'pending_review'
  | 'observing'
  | 'formal_warning'
  | 'in_intervention'
  | 'pending_retest'
  | 'referral'
  | 'closed';

export type CollaborationTaskType =
  | 'default_observation'
  | 'additional_feedback'
  | 'feedback_revision'
  | 'retest_reminder'
  | 'grade_supervision';

export type TaskStatus = 'pending' | 'submitted' | 'returned' | 'completed' | 'cancelled';

export type TaskUrgency = 'normal' | 'important' | 'urgent';

export interface StudentRef {
  id: string;
  name: string;
  gradeId: string;
  gradeName: string;
  classId: string;
  className: string;
}

export interface CollaborationTask {
  id: string;
  warningId: string;
  student: StudentRef;
  type: CollaborationTaskType;
  status: TaskStatus;
  assigneeId: string;
  supervisorId?: string;
  originalTaskId?: string;
  needSupervision?: boolean;
  title: string;
  purpose: string;
  observationFocus?: string[];
  precautions?: string[];
  createdAt: string;
  dueAt?: string;
  readAt?: string;
  returnedAt?: string;
  returnReason?: string;
  completedAt?: string;
  cancelledAt?: string;
  cancelReason?: string;
  urgency: TaskUrgency;
  warningStatusSnapshot?: WarningStatus;
}

export type RetestReminderMethod = 'in_person' | 'class_message' | 'phone';

export interface RetestSchedule {
  id: string;
  taskId: string;
  scheduledAt: string;
  location: string;
  instructions: string;
  reminderConfirmedAt?: string;
  reminderMethod?: RetestReminderMethod;
  studentCompletedAt?: string;
}

export type TaskDisplayKey =
  | 'pending'
  | 'due_today'
  | 'overdue'
  | 'submitted'
  | 'returned'
  | 'completed'
  | 'cancelled';

export interface TaskDisplayState {
  key: TaskDisplayKey;
  label: string;
  isOverdue: boolean;
  overdueMs: number;
  deadlineLabel: string;
  canSubmitObservation: boolean;
}
