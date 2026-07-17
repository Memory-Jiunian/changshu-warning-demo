import type { AbnormalReport, ObservationRecord, SupervisionRecord } from '../domain/feedback';
import type { RetestSchedule } from '../domain/tasks';
import { getMockStudentRef } from './mockStudents';

export const mockAbnormalReports: AbnormalReport[] = [
  {
    id: 'report-001-history',
    reporterId: 'user-head-li',
    student: getMockStudentRef('student-zhao'),
    observedAt: '2026-07-16T13:40:00+08:00',
    scene: '课堂、沟通',
    facts: '7 月 16 日下午课堂提问时连续三次没有回应；课后沟通时表示最近睡眠较少，讲话声音较轻。',
    supportActions: '课后进行了简短关心，并安排当天放学前再次确认到校状态。',
    immediateSafetyConcern: false,
    status: 'submitted',
    submittedAt: '2026-07-16T16:10:00+08:00',
  },
  {
    id: 'report-002-other-teacher',
    reporterId: 'user-head-wang',
    student: getMockStudentRef('student-wang'),
    observedAt: '2026-07-16T09:20:00+08:00',
    scene: '课间',
    facts: '课间在走廊独处约二十分钟，能够回应老师询问，之后按时回到教室。',
    immediateSafetyConcern: false,
    status: 'submitted',
    submittedAt: '2026-07-16T11:30:00+08:00',
  },
];

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
    reminderConfirmedById: 'user-head-li',
  },
  {
    id: 'retest-012',
    taskId: 'task-012-retest-completed',
    scheduledAt: '2026-07-15T14:30:00+08:00',
    location: '校心理中心 2 号室',
    instructions: '提醒学生携带校园卡，结果由管理终端同步。',
    reminderConfirmedAt: '2026-07-15T09:00:00+08:00',
    reminderMethod: 'class_message',
    reminderConfirmedById: 'user-head-li',
    studentCompletedAt: '2026-07-15T15:20:00+08:00',
  },
  {
    id: 'retest-013',
    taskId: 'task-013-retest-cancelled',
    scheduledAt: '2026-07-18T15:30:00+08:00',
    location: '校心理中心 1 号室',
    instructions: '原安排已取消，无需继续提醒。',
  },
  {
    id: 'retest-014',
    taskId: 'task-014-retest-unauthorized',
    scheduledAt: '2026-07-18T10:30:00+08:00',
    location: '校心理中心 2 号室',
    instructions: '仅责任班主任可确认提醒。',
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
