// Legacy page view models. Domain truth lives under src/domain and src/data.
// TODO Phase 2/3: remove legacy view models after page migration.
export type RoleId = 'counselor' | 'homeroomTeacher' | 'gradeDirector' | 'principal';
export type LegacyStatusKey =
  | 'waitingFeedback'
  | 'overdue'
  | 'pendingCounselorConfirm'
  | 'active'
  | 'continuousAttention'
  | 'retestPending'
  | 'referral'
  | 'closed';
export type AttentionLevel = '重点关注' | '持续关注' | '一般关注';
export type HandlingResult = '持续关注' | '复测待安排' | '解除关注' | '转介中' | '已闭环';
export type TimelineAudience = 'all' | 'counselor' | 'teacher' | 'director';

export interface Role {
  id: RoleId;
  label: string;
  org: string;
  scope: string;
  grade?: string;
  teacherName?: string;
}

export interface RolePermission {
  canViewWarningSummary: boolean;
  canViewAiClueSummary: boolean;
  canViewInterventionDetail: boolean;
  canSubmitFollowUp: boolean;
  canSubmitClue: boolean;
  canConfirmFeedback: boolean;
  canSupervise: boolean;
  canViewSchoolAggregate: boolean;
  canEnterStudentDetail: boolean;
  visibleScope: string;
  allowedActions: string[];
  restrictedInfo: string[];
}

export interface FollowUpRecord {
  by: string;
  role: string;
  time: string;
  text: string;
  tag: string;
}

export interface HandlingTimelineItem {
  id: string;
  time: string;
  role: string;
  action: string;
  status: string;
  note: string;
  audience: TimelineAudience[];
}

export interface WarningTask {
  id: string;
  student: string;
  maskedStudent: string;
  className: string;
  grade: string;
  attention: AttentionLevel;
  status: string;
  statusKey: LegacyStatusKey;
  result: HandlingResult;
  type: string;
  owner: string;
  counselor: string;
  deadline: string;
  source: string;
  aiClueSummary: string;
  desensitizedFlow: string;
  focus: string[];
  suggestion: string;
  restricted: string;
  nextAction: string;
  overdueHours?: number;
  referral?: boolean;
  resourcePressure?: string;
  records: FollowUpRecord[];
  timeline: HandlingTimelineItem[];
  finalConclusion?: string;
}

export const roles: Role[] = [
  {
    id: 'counselor',
    label: '心理老师',
    org: '校心理中心',
    scope: '在小程序查看协作进度摘要；专业复核、干预、转介和闭环请前往管理终端处理。',
  },
  {
    id: 'homeroomTeacher',
    label: '班主任',
    org: '高二年级',
    grade: '高二',
    teacherName: '李老师',
    scope: '只查看分配给自己的观察任务，提交事实观察反馈，不做专业心理判断。',
  },
  {
    id: 'gradeDirector',
    label: '年级主任',
    org: '高二年级组',
    grade: '高二',
    scope: '只查看已超时或明确指派的督办事项，留下协调和督办记录。',
  },
  {
    id: 'principal',
    label: '校级管理者',
    org: '学校管理层',
    scope: 'Legacy 演示页：不属于新小程序 MVP，不进入个案任务。',
  },
];

export const rolePermissions: Record<RoleId, RolePermission> = {
  counselor: {
    canViewWarningSummary: true,
    canViewAiClueSummary: false,
    canViewInterventionDetail: false,
    canSubmitFollowUp: false,
    canSubmitClue: false,
    canConfirmFeedback: false,
    canSupervise: false,
    canViewSchoolAggregate: false,
    canEnterStudentDetail: true,
    visibleScope: '协作任务进度摘要、反馈是否到达',
    allowedActions: ['查看协作进度摘要'],
    restrictedInfo: ['小程序内专业复核', '干预', '转介', '闭环'],
  },
  homeroomTeacher: {
    canViewWarningSummary: false,
    canViewAiClueSummary: false,
    canViewInterventionDetail: false,
    canSubmitFollowUp: true,
    canSubmitClue: true,
    canConfirmFeedback: false,
    canSupervise: false,
    canViewSchoolAggregate: false,
    canEnterStudentDetail: true,
    visibleScope: '本人被分配的协作任务、观察重点、注意事项和本人历史反馈',
    allowedActions: ['填写观察反馈', '补充观察反馈', '主动上报异常', '确认已提醒学生复测'],
    restrictedInfo: ['AI 原始判断', '敏感题项', '完整咨询记录', '风险等级', '干预结论'],
  },
  gradeDirector: {
    canViewWarningSummary: false,
    canViewAiClueSummary: false,
    canViewInterventionDetail: false,
    canSubmitFollowUp: false,
    canSubmitClue: false,
    canConfirmFeedback: false,
    canSupervise: true,
    canViewSchoolAggregate: false,
    canEnterStudentDetail: true,
    visibleScope: '已超时或明确指派事项的脱敏进度、责任班主任和督办历史',
    allowedActions: ['记录督办', '提醒班主任'],
    restrictedInfo: ['反馈正文', 'AI 原始判断', '敏感题项', '完整心理干预细节'],
  },
  principal: {
    canViewWarningSummary: false,
    canViewAiClueSummary: false,
    canViewInterventionDetail: false,
    canSubmitFollowUp: false,
    canSubmitClue: false,
    canConfirmFeedback: false,
    canSupervise: false,
    canViewSchoolAggregate: true,
    canEnterStudentDetail: false,
    visibleScope: 'Legacy 校级聚合演示页',
    allowedActions: [],
    restrictedInfo: ['学生姓名', '班级', '测评原文', '咨询记录', '敏感题项', 'AI 原始判断', '个体学生详情'],
  },
};

export const flowSteps = [
  'AI 风险线索生成',
  '心理老师复核',
  '生成正式预警',
  '小程序分发协作任务',
  '班主任观察反馈',
  '心理老师确认反馈',
  '干预处理',
  '复测 / 持续关注 / 解除关注 / 转介',
];

// Legacy portfolio page only. It is intentionally outside the Phase 1 Provider.
export const schoolOverview = {
  weekNewWarnings: 18,
  activeCount: 12,
  overdueCount: 3,
  closedCount: 21,
  todayClosed: 4,
  closureRate: '64%',
  counselorPending: 5,
  teacherPending: 7,
  staleOver48h: 3,
  resourcePressure: '外部转介预约资源紧张，需校级协调 2 项',
  highPriorityUnconfirmed: 2,
  repeatedRetestAttention: 4,
  referralCount: 2,
  gradeDistribution: [
    { grade: '高一', total: 7, active: 3, overdue: 0, closureRate: '72%' },
    { grade: '高二', total: 11, active: 6, overdue: 1, closureRate: '61%' },
    { grade: '高三', total: 8, active: 3, overdue: 2, closureRate: '58%' },
  ],
  attentionItems: [
    {
      subject: '高二年级 · 脱敏事项 A',
      riskLevel: '高优先级',
      issue: '连续 48 小时未更新',
      progress: '观察反馈未提交，当前等待责任班主任补充事实信息。',
      timeStatus: '已超时 2 小时',
      notified: '年级主任、班主任',
      actionLabel: '提醒年级负责人',
    },
    {
      subject: '高三年级 · 脱敏事项 B',
      riskLevel: '高优先级',
      issue: '转介资源排队',
      progress: '转介资源预约排队，需协调心理负责人确认资源安排。',
      timeStatus: '剩余 6 小时',
      notified: '心理负责人',
      actionLabel: '协调心理负责人',
    },
    {
      subject: '高一年级 · 5项未回收',
      riskLevel: '中优先级',
      issue: '多名班主任未反馈',
      progress: '多个观察任务仍未回收，建议由年级负责人统一提醒。',
      timeStatus: '今日内处理',
      notified: '年级负责人',
      actionLabel: '发起流程督办',
    },
  ],
};
