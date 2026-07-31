import type { StudentRef } from './tasks';

export interface ObservationRecord {
  id: string;
  taskId: string;
  requestId?: string;
  authorId: string;
  authorRole: 'head_teacher';
  observedAt: string;
  scene: string;
  facts: string;
  frequency?: string;
  duration?: string;
  impact?: string;
  supportActions?: string[];
  immediateSafetyConcern: boolean;
  requestExpeditedReview?: boolean;
  additionalNotes?: string;
  submittedAt: string;
  revisionOfRecordId?: string;
  viewedAt?: string;
  viewedById?: string;
}

export interface ObservationInput {
  requestId: string;
  observedAt: string;
  scene: string;
  facts: string;
  frequency?: string;
  duration?: string;
  impact?: string;
  supportActions?: string[];
  immediateSafetyConcern: boolean;
  requestExpeditedReview?: boolean;
  additionalNotes?: string;
}

export interface FeedbackRecordInput {
  submissionRequestId: string;
  observedAt: string;
  facts: string;
}

export type ObservationScene =
  | 'classroom'
  | 'break'
  | 'dormitory'
  | 'activity'
  | 'communication'
  | 'other';

export type ObservationFrequency = '' | '首次' | '偶尔' | '多次' | '持续';

export interface ObservationFormValues {
  observedAt: string;
  scene: ObservationScene | '';
  otherScene: string;
  facts: string;
  frequency: ObservationFrequency;
  duration: string;
  immediateSafetyConcern: boolean | null;
  additionalNotes: string;
}

export interface ObservationDraft {
  version: 1;
  userId: string;
  taskId: string;
  values: ObservationFormValues;
  updatedAt: string;
}

export interface AbnormalReport {
  id: string;
  reporterId: string;
  student: StudentRef;
  observedAt: string;
  scene: string;
  facts: string;
  supportActions?: string;
  immediateSafetyConcern: boolean;
  status: 'submitted';
  submittedAt: string;
}

export interface AbnormalReportInput {
  requestId: string;
  studentId: string;
  observedAt: string;
  scene: string;
  facts: string;
  supportActions?: string;
  immediateSafetyConcern: boolean;
}

export interface AbnormalReportFormValues {
  studentId: string;
  observedAt: string;
  scene: ObservationScene | '';
  otherScene: string;
  facts: string;
  supportActions: string;
  immediateSafetyConcern: boolean | null;
  offlinePriorityAcknowledged: boolean;
}

export interface AbnormalReportDraft {
  version: 1;
  userId: string;
  values: AbnormalReportFormValues;
  updatedAt: string;
}

export type SupervisionMethod = 'message' | 'phone' | 'in_person' | 'resource_coordination';

export type CurrentSupervisionMethod = 'in_person' | 'phone' | 'message' | 'other';

export interface SupervisionRecord {
  id: string;
  taskId: string;
  supervisorId: string;
  method: SupervisionMethod;
  summary: string;
  createdAt: string;
  sourceActionId?: string;
  sourceKind?: 'feedback_request' | 'retest_reminder' | 'intervention_reminder';
  studentId?: string;
  responsibleTeacherId?: string;
  supervisedByNameSnapshot?: string;
  otherMethod?: string;
  submissionRequestId?: string;
}

export interface SupervisionInput {
  requestId: string;
  method: SupervisionMethod;
  summary: string;
}

export interface CurrentSupervisionInput {
  submissionRequestId: string;
  method: CurrentSupervisionMethod;
  otherMethod?: string;
}

export interface Draft<T = unknown> {
  key: string;
  userId: string;
  content: T;
  updatedAt: string;
  version: 1;
}
