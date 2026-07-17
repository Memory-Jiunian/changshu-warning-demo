export interface ObservationRecord {
  id: string;
  taskId: string;
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
  studentId: string;
  reporterId: string;
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

export type SupervisionMethod = 'message' | 'phone' | 'in_person' | 'resource_coordination';

export interface SupervisionRecord {
  id: string;
  taskId: string;
  supervisorId: string;
  method: SupervisionMethod;
  summary: string;
  createdAt: string;
}

export interface SupervisionInput {
  requestId: string;
  method: SupervisionMethod;
  summary: string;
}

export interface Draft<T = unknown> {
  key: string;
  userId: string;
  content: T;
  updatedAt: string;
  version: 1;
}
