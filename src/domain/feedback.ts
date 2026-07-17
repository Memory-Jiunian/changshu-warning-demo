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
