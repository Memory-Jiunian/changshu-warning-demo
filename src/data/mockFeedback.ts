import type { ObservationRecord, SupervisionRecord } from '../domain/feedback';
import type { RetestSchedule } from '../domain/tasks';

export const mockObservationRecords: ObservationRecord[] = [
  {
    id: 'observation-004-1',
    taskId: 'task-004-submitted',
    authorId: 'user-head-li',
    authorRole: 'head_teacher',
    observedAt: '2026-07-16T08:30:00+08:00',
    scene: '课堂、课间',
    facts: '课堂能够回应点名，课间独处时间较上周增加，能回应老师的简短询问。',
    frequency: '偶尔',
    duration: '近 2 天',
    impact: '轻度影响课堂参与',
    supportActions: ['日常关心', '单独沟通'],
    immediateSafetyConcern: false,
    requestExpeditedReview: false,
    submittedAt: '2026-07-16T16:20:00+08:00',
  },
  {
    id: 'observation-005-1',
    taskId: 'task-005-returned',
    authorId: 'user-head-li',
    authorRole: 'head_teacher',
    observedAt: '2026-07-15T10:10:00+08:00',
    scene: '课堂',
    facts: '学生当天课堂参与较少，能够完成书面任务。',
    frequency: '首次',
    immediateSafetyConcern: false,
    submittedAt: '2026-07-15T16:00:00+08:00',
  },
  {
    id: 'observation-006-1',
    taskId: 'task-006-completed',
    authorId: 'user-head-li',
    authorRole: 'head_teacher',
    observedAt: '2026-07-12T09:00:00+08:00',
    scene: '课堂、沟通',
    facts: '连续三天正常到校，课堂参与和同伴互动恢复到日常水平。',
    frequency: '持续',
    duration: '3 天',
    immediateSafetyConcern: false,
    submittedAt: '2026-07-12T17:10:00+08:00',
  },
];

export const mockRetestSchedules: RetestSchedule[] = [
  {
    id: 'retest-008',
    taskId: 'task-008-retest-today',
    scheduledAt: '2026-07-17T14:30:00+08:00',
    location: '校心理中心 2 号室',
    instructions: '请在午休后提醒学生按时到达，不需要班主任录入复测结果。',
  },
  {
    id: 'retest-009',
    taskId: 'task-009-retest-confirmed',
    scheduledAt: '2026-07-16T15:00:00+08:00',
    location: '校心理中心 1 号室',
    instructions: '提醒学生携带校园卡。',
    reminderConfirmedAt: '2026-07-16T09:10:00+08:00',
    reminderMethod: 'in_person',
  },
];

export const mockSupervisionRecords: SupervisionRecord[] = [
  {
    id: 'supervision-010-1',
    taskId: 'task-010-supervision',
    supervisorId: 'user-director-g2',
    method: 'message',
    summary: '已提醒责任班主任在今天下班前确认任务要求。',
    createdAt: '2026-07-17T08:45:00+08:00',
  },
];
