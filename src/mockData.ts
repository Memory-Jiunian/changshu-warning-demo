export type RoleId = 'counselor' | 'homeroomTeacher' | 'gradeDirector' | 'principal';
export type StatusKey =
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
  statusKey: StatusKey;
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
    scope: '复核协作线索，确认反馈并推进干预、复测、持续关注、转介或解除关注。',
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
    scope: '查看本年级协作进度和脱敏摘要，督促班主任及时反馈或补充信息。',
  },
  {
    id: 'principal',
    label: '校级管理者',
    org: '学校管理层',
    scope: '只查看全校聚合数据、闭环率、逾期风险、资源压力和脱敏督办事项。',
  },
];

export const rolePermissions: Record<RoleId, RolePermission> = {
  counselor: {
    canViewWarningSummary: true,
    canViewAiClueSummary: true,
    canViewInterventionDetail: true,
    canSubmitFollowUp: false,
    canSubmitClue: true,
    canConfirmFeedback: true,
    canSupervise: false,
    canViewSchoolAggregate: false,
    canEnterStudentDetail: true,
    visibleScope: '正式预警摘要、班主任完整反馈、历史处置记录、专业判断提示、处置时间线',
    allowedActions: ['确认进入干预', '退回补充信息', '制定干预', '安排复测', '持续关注', '转介建议', '解除关注'],
    restrictedInfo: [],
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
    visibleScope: '自己班级或自己被分配的观察任务、观察重点、注意事项、事实反馈表单',
    allowedActions: ['填写观察反馈', '提交协作线索', '查看已提交反馈'],
    restrictedInfo: ['AI 原始判断', '敏感题项', '完整咨询记录', '风险等级填写', '干预结论', '是否转介', '是否解除关注'],
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
    visibleScope: '本年级任务数量、待反馈班级、逾期任务、需补充信息、脱敏流程状态',
    allowedActions: ['提醒班主任反馈', '提醒补充信息', '查看本年级进度'],
    restrictedInfo: ['AI 原始判断', '敏感题项', '完整咨询记录', '完整心理干预细节', '心理跟进记录填写'],
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
    visibleScope: '全校聚合数据、年级分布、闭环率、逾期未更新、资源压力、异常提醒',
    allowedActions: ['发起流程督办', '提醒年级负责人', '查看资源压力说明'],
    restrictedInfo: ['学生姓名', '班级', '测评原文', '咨询记录', '敏感题项', 'AI 原始判断', '个体学生详情'],
  },
};

export const initialTasks: WarningTask[] = [
  {
    id: 'warn-001',
    student: '陈同学',
    maskedStudent: '高二（3）班 · C同学',
    className: '高二（3）班',
    grade: '高二',
    attention: '重点关注',
    status: '待观察反馈',
    statusKey: 'waitingFeedback',
    result: '持续关注',
    type: '观察任务',
    owner: '李老师',
    counselor: '周老师',
    deadline: '今天 18:00',
    source: '系统识别到近期存在需关注信号，已由心理老师复核后生成正式预警。',
    aiClueSummary: 'AI 线索提示近期多源信号波动，心理老师已复核为需要协作观察；不展示原始判断和敏感题项。',
    desensitizedFlow: '该任务来自已复核的正式预警，非诊断结论；协作角色只需按观察项反馈近期状态。',
    focus: ['近一周情绪波动', '出勤与迟到变化', '课堂参与度', '同伴互动'],
    suggestion: '以日常关心方式进行简短沟通，记录具体事实，避免贴标签。',
    restricted: '不展示测评原始分数、敏感题项和 AI 原始判断。',
    nextAction: '填写观察反馈',
    records: [],
    timeline: [
      createTimeline('t1', '06-10 08:40', '系统', 'AI 风险线索生成', '待复核', '系统形成风险线索，原始判断仅供心理老师复核使用。', ['counselor']),
      createTimeline('t2', '06-10 09:10', '心理老师', '心理老师复核', '已复核', '心理老师完成专业复核，确认生成正式预警。', ['all']),
      createTimeline('t3', '06-10 09:25', '心理老师', '生成正式预警', '已生成', '正式预警创建后，按角色分发最小必要信息。', ['all']),
      createTimeline('t4', '06-10 09:30', '小程序', '分发协作任务', '待观察反馈', '任务已分发给班主任，请按观察重点提交反馈。', ['all']),
    ],
  },
  {
    id: 'warn-002',
    student: '林同学',
    maskedStudent: '高二（6）班 · L同学',
    className: '高二（6）班',
    grade: '高二',
    attention: '持续关注',
    status: '已反馈待确认',
    statusKey: 'pendingCounselorConfirm',
    result: '持续关注',
    type: '观察任务',
    owner: '王老师',
    counselor: '周老师',
    deadline: '明天 12:00',
    source: '心理老师复核多源线索后，建议班主任持续观察并补充反馈。',
    aiClueSummary: 'AI 线索提示近期互动与睡眠相关表达波动，心理老师已复核为持续关注。',
    desensitizedFlow: '该任务已收到班主任反馈，等待心理老师确认下一步处置。',
    focus: ['同伴关系变化', '家校沟通情况', '午休状态'],
    suggestion: '继续保持低压力观察，必要时由心理老师安排复测。',
    restricted: '非专业角色仅查看协作任务所需摘要。',
    nextAction: '查看已提交反馈',
    records: [
      {
        by: '王老师',
        role: '班主任',
        time: '06-09 16:20',
        text: '完成一次课后简短沟通，学生表达近期睡眠一般，课堂状态较上周稳定。',
        tag: '已反馈待确认',
      },
    ],
    timeline: [
      createTimeline('t1', '06-09 09:00', '系统', 'AI 风险线索生成', '待复核', '原始线索仅供心理老师复核，不向协作角色展示。', ['counselor']),
      createTimeline('t2', '06-09 09:30', '心理老师', '心理老师复核', '已复核', '复核后生成正式预警并分发协作任务。', ['all']),
      createTimeline('t3', '06-09 10:00', '小程序', '分发协作任务', '待观察反馈', '班主任收到观察反馈任务。', ['all']),
      createTimeline('t4', '06-09 16:20', '班主任', '班主任提交观察反馈', '已反馈待确认', '已提交结构化反馈，等待心理老师确认。', ['all']),
    ],
  },
  {
    id: 'warn-003',
    student: '许同学',
    maskedStudent: '高一（2）班 · X同学',
    className: '高一（2）班',
    grade: '高一',
    attention: '一般关注',
    status: '已闭环',
    statusKey: 'closed',
    result: '已闭环',
    type: '复测提醒',
    owner: '李老师',
    counselor: '周老师',
    deadline: '06-08 17:00',
    source: '正式预警后完成协作反馈，心理老师确认已解除本轮关注。',
    aiClueSummary: 'AI 线索已完成专业复核和后续复测确认，本轮处置已闭环。',
    desensitizedFlow: '本轮流程已闭环，仅保留必要协作记录。',
    focus: ['复测完成情况', '后续适应状态'],
    suggestion: '保持常规关注，无需额外扩散信息。',
    restricted: '闭环详情仅保留必要协作记录。',
    nextAction: '查看闭环详情',
    finalConclusion: '复测结果与日常反馈均趋稳，解除本轮关注，转入常规关怀。',
    records: [
      {
        by: '李老师',
        role: '班主任',
        time: '06-06 11:30',
        text: '完成复测提醒，学生已按预约到心理中心复测。',
        tag: '已确认',
      },
    ],
    timeline: [
      createTimeline('t1', '06-04 08:50', '系统', 'AI 风险线索生成', '待复核', '系统形成风险线索，原始内容不向协作角色展示。', ['counselor']),
      createTimeline('t2', '06-04 09:20', '心理老师', '心理老师复核', '已复核', '确认进入正式预警流程。', ['all']),
      createTimeline('t3', '06-04 09:30', '心理老师', '生成正式预警', '已生成', '任务下发给班主任协作观察。', ['all']),
      createTimeline('t4', '06-06 11:30', '班主任', '班主任提交观察反馈', '已反馈待确认', '提交复测提醒和观察反馈。', ['all']),
      createTimeline('t5', '06-06 14:00', '心理老师', '心理老师确认反馈', '复测完成', '确认复测完成并补充干预记录。', ['all']),
      createTimeline('t6', '06-08 17:00', '心理老师', '解除关注 / 闭环', '已闭环', '解除本轮关注，转入常规关怀。', ['all']),
    ],
  },
  {
    id: 'warn-004',
    student: '吴同学',
    maskedStudent: '高三（1）班 · W同学',
    className: '高三（1）班',
    grade: '高三',
    attention: '重点关注',
    status: '逾期未更新',
    statusKey: 'overdue',
    result: '持续关注',
    type: '观察任务',
    owner: '孙老师',
    counselor: '周老师',
    deadline: '昨天 17:00',
    source: '心理老师复核后下发补充线索任务，当前反馈逾期。',
    aiClueSummary: 'AI 线索提示近期出勤和沟通意愿存在波动，心理老师已复核并下发补充线索任务。',
    desensitizedFlow: '该任务已逾期，年级层面仅需督促责任人尽快反馈。',
    focus: ['出勤异常', '家庭事件影响', '近期沟通意愿'],
    suggestion: '请尽快提交事实性观察，如存在紧急情况直接联系心理老师。',
    restricted: '高风险信息仅显示处置动作，不展示敏感细节。',
    nextAction: '尽快反馈',
    overdueHours: 50,
    resourcePressure: '需要年级协助联系责任人',
    records: [],
    timeline: [
      createTimeline('t1', '06-08 08:30', '系统', 'AI 风险线索生成', '待复核', '原始线索仅供心理老师复核。', ['counselor']),
      createTimeline('t2', '06-08 09:00', '心理老师', '心理老师复核', '已复核', '复核后生成正式预警。', ['all']),
      createTimeline('t3', '06-08 09:15', '小程序', '分发协作任务', '待观察反馈', '任务已分发给班主任。', ['all']),
      createTimeline('t4', '06-09 17:00', '系统', '超过 48 小时未更新', '逾期未更新', '任务未按时提交，需要督办。', ['all']),
    ],
  },
  {
    id: 'warn-005',
    student: '周同学',
    maskedStudent: '高二（1）班 · Z同学',
    className: '高二（1）班',
    grade: '高二',
    attention: '重点关注',
    status: '转介中',
    statusKey: 'referral',
    result: '转介中',
    type: '转介跟进',
    owner: '李老师',
    counselor: '周老师',
    deadline: '06-12 12:00',
    source: '心理老师确认协作反馈后，启动校外专业资源转介流程。',
    aiClueSummary: 'AI 线索仅作为前置提示，转介判断由心理老师复核和干预记录共同形成。',
    desensitizedFlow: '当前处于转介进度跟踪阶段，协作角色仅查看流程状态。',
    focus: ['家校沟通进展', '转介预约状态'],
    suggestion: '保持低压力支持，避免在公开场合讨论转介信息。',
    restricted: '转介细节按权限展示，非专业角色仅看流程状态。',
    nextAction: '查看转介进度',
    referral: true,
    resourcePressure: '需校级协调外部资源预约',
    records: [
      {
        by: '李老师',
        role: '班主任',
        time: '06-10 10:20',
        text: '已完成家校沟通，家长同意由心理老师继续对接转介资源。',
        tag: '心理老师已确认',
      },
    ],
    timeline: [
      createTimeline('t1', '06-07 10:00', '系统', 'AI 风险线索生成', '待复核', '前置线索进入心理老师复核队列。', ['counselor']),
      createTimeline('t2', '06-07 11:00', '心理老师', '心理老师复核', '已复核', '确认生成正式预警并安排协作反馈。', ['all']),
      createTimeline('t3', '06-08 09:00', '小程序', '分发协作任务', '待观察反馈', '班主任接收家校沟通协作任务。', ['all']),
      createTimeline('t4', '06-10 10:20', '班主任', '班主任提交观察反馈', '已反馈待确认', '反馈显示需进一步专业资源支持。', ['all']),
      createTimeline('t5', '06-10 13:40', '心理老师', '心理老师确认反馈', '转介中', '启动校外专业资源转介流程。', ['all']),
    ],
  },
  {
    id: 'warn-006',
    student: '郑同学',
    maskedStudent: '高二（8）班 · ZH同学',
    className: '高二（8）班',
    grade: '高二',
    attention: '持续关注',
    status: '复测待安排',
    statusKey: 'retestPending',
    result: '复测待安排',
    type: '复测计划',
    owner: '王老师',
    counselor: '周老师',
    deadline: '06-13 17:00',
    source: '心理老师确认反馈后，安排下一次复测计划。',
    aiClueSummary: '前置线索经复核后进入持续观察，当前需安排复测。',
    desensitizedFlow: '当前处于复测待安排阶段，协作角色只需关注计划执行。',
    focus: ['复测预约', '近期课堂状态'],
    suggestion: '按心理老师安排提醒学生完成复测。',
    restricted: '复测结果不在小程序面向非专业角色展示。',
    nextAction: '查看复测计划',
    records: [
      {
        by: '王老师',
        role: '班主任',
        time: '06-10 15:10',
        text: '学生本周出勤稳定，已知悉后续复测安排。',
        tag: '心理老师已确认',
      },
    ],
    timeline: [
      createTimeline('t1', '06-09 08:30', '系统', 'AI 风险线索生成', '待复核', '前置线索进入复核队列。', ['counselor']),
      createTimeline('t2', '06-09 09:30', '心理老师', '心理老师复核', '已复核', '确认正式预警并下发观察任务。', ['all']),
      createTimeline('t3', '06-10 15:10', '班主任', '班主任提交观察反馈', '已反馈待确认', '提交近期状态反馈。', ['all']),
      createTimeline('t4', '06-10 16:00', '心理老师', '心理老师确认反馈', '复测待安排', '安排下一次复测计划。', ['all']),
    ],
  },
];

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
      subject: '高二（3）班 · C同学',
      riskLevel: '高优先级',
      issue: '连续 48 小时未更新',
      progress: '观察反馈未提交，心理老师等待班主任补充事实信息。',
      timeStatus: '已超时 2 小时',
      notified: '年级主任、班主任',
      suggestion: '督办入口：提醒年级主任跟进',
    },
    {
      subject: '高三（1）班 · W同学',
      riskLevel: '高优先级',
      issue: '转介资源排队',
      progress: '转介资源预约排队，需协调心理负责人确认资源安排。',
      timeStatus: '剩余 6 小时',
      notified: '心理负责人',
      suggestion: '督办入口：协调心理负责人',
    },
    {
      subject: '高一年级 · 多班级',
      riskLevel: '中优先级',
      issue: '多名班主任未反馈',
      progress: '多个观察任务仍未回收，建议由年级负责人统一提醒。',
      timeStatus: '今日内处理',
      notified: '年级负责人',
      suggestion: '督办入口：发起流程督办',
    },
  ],
};

function createTimeline(
  id: string,
  time: string,
  role: string,
  action: string,
  status: string,
  note: string,
  audience: TimelineAudience[],
): HandlingTimelineItem {
  return { id, time, role, action, status, note, audience };
}
