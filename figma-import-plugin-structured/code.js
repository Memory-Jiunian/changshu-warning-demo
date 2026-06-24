// Structured Auto-layout Figma importer for campus mental-health miniapp.
// This version follows a component/container JSON mindset rather than DOM absolute capture.

var SCREEN_W = 375;
var COLS = 4;
var GAP_X = 76;
var GAP_Y = 120;
var ROW_H = 1420;
var fonts = null;
var loadedFonts = {};

var TOKENS = {
  bgTop: '#EEF4FF',
  bgBottom: '#FFF8EF',
  surface: '#FFFFFF',
  surfaceSoft: '#F8FAFF',
  ink: '#202943',
  body: '#44506A',
  muted: '#7A849A',
  faint: '#A0A8B8',
  brand: '#5C63F5',
  brand2: '#6D73FF',
  hairline: '#E2E8F4',
  hairlineSoft: '#EDF1F8',
  warning: '#F59E0B',
  warningSoft: '#FFF4DC',
  danger: '#EF5B5B',
  dangerSoft: '#FFECEC',
  success: '#2EB872',
  successSoft: '#EAF8F0',
  purpleSoft: '#F0EDFF',
  blueSoft: '#EEF4FF'
};

var screens = [
  { name: '01 班主任 / 首页', role: '高二年级', title: '我的观察任务', type: 'home-teacher' },
  { name: '02 班主任 / 观察任务详情', role: '高二年级', title: '观察任务详情', type: 'teacher-detail', back: true },
  { name: '03 班主任 / 填写观察反馈', role: '高二年级', title: '填写观察反馈', type: 'teacher-form', back: true },
  { name: '04 班主任 / 上报协作线索', role: '高二年级', title: '上报协作线索', type: 'clue-report', back: true },
  { name: '05 心理老师 / 首页', role: '校心理中心', title: '待确认反馈', type: 'home-counselor' },
  { name: '06 心理老师 / 反馈确认详情', role: '校心理中心', title: '反馈确认详情', type: 'counselor-detail', back: true },
  { name: '07 心理老师 / 补充反馈确认抽屉', role: '校心理中心', title: '反馈确认详情', type: 'counselor-drawer', back: true },
  { name: '08 年级主任 / 首页', role: '高二年级组', title: '年级督办', type: 'home-grade' },
  { name: '09 年级主任 / 督办详情', role: '高二年级组', title: '督办详情', type: 'grade-detail', back: true },
  { name: '10 年级主任 / 提醒确认抽屉', role: '高二年级组', title: '督办详情', type: 'grade-drawer', back: true },
  { name: '11 校长 / 首页', role: '学校管理层', title: '预警督办 / 消息中心', type: 'home-principal' },
  { name: '12 校长 / 督办确认抽屉', role: '学校管理层', title: '预警督办 / 消息中心', type: 'principal-drawer' }
];

main().catch(function(error) {
  figma.closePlugin('结构化版导入失败：' + (error && error.message ? error.message : String(error)));
});

async function main() {
  fonts = await resolveFonts();
  await loadFontOnce(fonts.regular);
  await loadFontOnce(fonts.medium);
  await loadFontOnce(fonts.semibold);
  await loadFontOnce(fonts.bold);

  var start = findStartPosition();
  var created = [];

  for (var i = 0; i < screens.length; i++) {
    var spec = screens[i];
    var frame = screenFrame(spec);
    frame.x = start.x + (i % COLS) * (SCREEN_W + GAP_X);
    frame.y = start.y + Math.floor(i / COLS) * ROW_H;
    figma.currentPage.appendChild(frame);
    buildScreen(frame, spec);
    created.push(frame);
  }

  figma.currentPage.selection = created;
  figma.viewport.scrollAndZoomIntoView(created);
  figma.closePlugin('结构化版导入完成：已生成 ' + created.length + ' 个可编辑 Frame');
}

function buildScreen(screen, spec) {
  addHeader(screen, spec);
  if (spec.type === 'home-teacher') buildTeacherHome(screen);
  if (spec.type === 'teacher-detail') buildTeacherDetail(screen);
  if (spec.type === 'teacher-form') buildTeacherForm(screen);
  if (spec.type === 'clue-report') buildClueReport(screen);
  if (spec.type === 'home-counselor') buildCounselorHome(screen);
  if (spec.type === 'counselor-detail') buildCounselorDetail(screen);
  if (spec.type === 'counselor-drawer') { buildCounselorDetail(screen); addDrawer(screen, '请班主任补充反馈', [
    ['补充原因', '观察时间不明确、场景描述不足、缺少近期行为变化'],
    ['补充说明', '请补充近 3 天课堂、课间和家校沟通中的具体观察事实，避免主观判断。'],
    ['补充时限', '今天 18:00 前'],
    ['通知方式', '小程序待办 + 短信提醒']
  ], [['取消', false], ['发送补充请求', true]]); }
  if (spec.type === 'home-grade') buildGradeHome(screen);
  if (spec.type === 'grade-detail') buildGradeDetail(screen);
  if (spec.type === 'grade-drawer') { buildGradeDetail(screen); addDrawer(screen, '提醒班主任反馈', [
    ['提醒对象', '责任班主任'],
    ['提醒事项', '观察反馈待提交'],
    ['通知方式', '小程序待办 + 短信提醒'],
    ['消息预览', '李老师，您有一条学生观察反馈待办，请于今天 18:00 前进入心理健康小程序完成反馈。']
  ], [['取消', false], ['发送提醒并留痕', true]]); }
  if (spec.type === 'home-principal') buildPrincipalHome(screen);
  if (spec.type === 'principal-drawer') { buildPrincipalHome(screen); addDrawer(screen, '提醒年级负责人', [
    ['处理对象', '年级负责人'],
    ['事项摘要', '高二年级连续 48 小时未更新，建议提醒年级主任。'],
    ['通知方式', '小程序待办 + 短信提醒'],
    ['消息预览', '陈老师，您有一条心理风险协作督办待处理，请进入心理健康小程序查看并推进相关事项。']
  ], [['取消', false], ['确认发送', true]]); }
}

function buildTeacherHome(screen) {
  addHero(screen, {
    eyebrow: '正式预警后的协作跟进',
    titleSegments: [['有 ', 'dark'], ['1', 'brand'], [' 项观察任务待处理', 'dark']],
    desc: '只查看分配给自己的观察任务，提交事实观察反馈，不做专业心理判断。',
    icon: 'clipboard'
  });
  addStatGrid(screen, [['1', '待反馈'], ['0', '已提交'], ['1', '已完成']]);
  addNotice(screen, '隐私边界', '班主任仅查看自己被分配的观察任务，只提交事实观察；不展示 AI 原始判断、敏感题项、完整咨询记录，也不填写风险等级或干预结论。', 'shield');
  addSegmented(screen, ['待反馈', '已提交', '已完成'], 0);
  addTaskCard(screen, {
    title: '陈同学',
    status: '待反馈',
    statusTone: 'warning',
    meta: [['协作优先级', '高'], ['截止', '今天 18:00']],
    tags: ['近一周情绪波动', '出勤与迟到变化'],
    actions: [['查看任务', false], ['填写反馈', true]]
  });
}

function buildTeacherDetail(screen) {
  addInfoHero(screen, '观察任务详情', '陈同学 · 高二（3）班', '状态：待观察反馈 · 截止：今天 18:00', '待观察反馈');
  addNotice(screen, '隐私边界', '责任班主任只查看自己被分配的观察任务，只提交事实观察；不展示测评原文、敏感题项、完整咨询记录，也不填写风险等级或干预结论。', 'shield');
  addSection(screen, '协作任务边界', [
    ['任务来源', '该任务来自已复核的正式预警，非诊断结论。'],
    ['协作角色', '协作角色只需按观察项反馈近期状态。'],
    ['信息边界', '不展示测评原始分数、敏感题项和 AI 原始判断。']
  ]);
  addSection(screen, '观察重点', [
    ['重点一', '近一周情绪波动'],
    ['重点二', '出勤与迟到变化'],
    ['重点三', '课堂参与度']
  ]);
  addSection(screen, '我的反馈状态', [
    ['提交状态', '尚未提交'],
    ['专业确认', '待提交后确认']
  ]);
  addSection(screen, '已提交反馈', [
    ['暂无观察反馈', '等待责任人提交首次反馈。']
  ]);
  addBottomBar(screen, [['上报协作线索', false], ['填写反馈', true]]);
}

function buildTeacherForm(screen) {
  addInfoHero(screen, '观察任务', '陈同学 · 高二（3）班', '提交后由周老师确认，本页只记录事实观察，不填写专业判断或处置结论。', '待观察反馈');
  addFormBlock(screen, '观察时间段', '今天上午 08:00-12:00');
  addChipGroup(screen, '观察场景', ['课堂', '课间', '午休', '放学后', '家校沟通', '其他'], [0, 1]);
  addChipGroup(screen, '异常表现', ['课堂回应减少', '出勤变化', '同伴互动减少', '情绪波动', '独处增多', '暂未发现明显异常'], [0, 4]);
  addFormBlock(screen, '发生频率', '近两天偶发');
  addTextArea(screen, '事实描述', '今天上午课堂状态较安静，课间多独处；课后能回应简单关心，暂未发现明显冲突升级。');
  addChipGroup(screen, '是否需要心理老师尽快查看', ['是，建议尽快查看', '否，按常规节奏确认'], [0]);
  addNotice(screen, '隐私边界', '请填写课堂、课间和家校沟通中的具体观察事实，避免主观判断。', 'shield');
  addBottomBar(screen, [['保存草稿', false], ['提交给心理老师', true]]);
}

function buildClueReport(screen) {
  addInfoHero(screen, '线索回流', '上报协作线索', '用于补充学生近期状态，提交后将由心理老师确认。', '');
  addFormBlock(screen, '选择学生', '陈同学 · 高二（3）班');
  addFormBlock(screen, '发生时间 / 场景', '今天 09:40      课间 / 走廊');
  addChipGroup(screen, '线索类型', ['情绪异常', '行为变化', '人际冲突', '出勤异常', '家庭事件', '其他'], [1]);
  addChipGroup(screen, '紧急程度', ['一般', '需要关注', '尽快确认', '紧急'], [1]);
  addTextArea(screen, '观察描述', '学生连续两天课间独处，今天主动回避同伴邀请，暂未发现冲突升级。');
  addChipGroup(screen, '是否已与学生沟通', ['已进行简短关心', '尚未沟通'], [0]);
  addNotice(screen, '隐私边界', '上报内容作为协作线索，由心理老师复核后判断。', 'shield');
  addBottomBar(screen, [['保存草稿', false], ['提交线索', true]]);
}

function buildCounselorHome(screen) {
  addHero(screen, {
    eyebrow: '反馈确认与线索复核',
    titleSegments: [['有 ', 'dark'], ['5', 'brand'], [' 项反馈需要确认', 'dark']],
    desc: '优先处理班主任反馈与逾期未更新任务，确认后推进干预、复测、持续关注或转介。',
    icon: 'heart'
  });
  addNotice(screen, '提醒', '当前有 3 项任务超过 48 小时未更新，需要优先处理。', 'alert');
  addSegmented(screen, ['待确认', '处理中', '已闭环'], 0);
  addTaskCard(screen, {
    title: '林同学 · 观察任务',
    status: '待确认',
    statusTone: 'info',
    meta: [['责任人', '王老师'], ['截止', '明天 12:00'], ['反馈', '查看已提交反馈']],
    tags: ['同伴关系变化', '家校沟通情况'],
    actions: [['查看复核详情', false], ['确认反馈', true]]
  });
  addTaskCard(screen, {
    title: '吴同学 · 观察任务',
    status: '逾期',
    statusTone: 'danger',
    meta: [['责任人', '孙老师'], ['截止', '昨天 17:00'], ['反馈', '等待观察反馈']],
    tags: ['出勤异常', '沟通意愿变化'],
    actions: [['查看复核详情', false]]
  });
}

function buildCounselorDetail(screen) {
  addInfoHero(screen, '反馈确认详情', '林同学 · 高二（1）班', '状态：已反馈待确认 · 责任班主任：王老师', '已反馈待确认');
  addSection(screen, '班主任已提交反馈', [
    ['时间', '06-09 16:20'],
    ['反馈摘要', '课后沟通完成，近期睡眠一般，课堂状态较上周稳定。']
  ]);
  addSection(screen, '异常观察要点', [
    ['重点一', '同伴关系变化'],
    ['重点二', '家校沟通情况'],
    ['重点三', '午休状态']
  ]);
  addNotice(screen, '专业判断边界', '当前内容来自班主任观察反馈，仅作为协作线索。是否进入干预流程，需由心理老师结合访谈、测评和既有记录判断。', 'shield');
  addSection(screen, '历史处置记录', [
    ['06-09 09:00', 'AI 风险线索生成，仅心理老师可见。'],
    ['06-09 09:30', '心理老师复核并生成正式预警。'],
    ['06-09 10:00', '小程序分发协作任务。'],
    ['06-09 16:20', '班主任提交观察反馈。']
  ]);
  addBottomBar(screen, [['请班主任补充反馈', false], ['确认进入干预', true]]);
}

function buildGradeHome(screen) {
  addHero(screen, {
    eyebrow: '年级协作进度',
    titleSegments: [['本年级有 ', 'dark'], ['4', 'brand'], [' 项需督办', 'dark']],
    desc: '只查看本年级任务进度和脱敏摘要，督促班主任提交或补充反馈。',
    icon: 'users'
  });
  addSegmented(screen, ['待反馈', '已逾期', '已跟进'], 0);
  addTaskCard(screen, {
    title: '高二（3）班 · C同学',
    status: '待反馈',
    statusTone: 'warning',
    meta: [['责任人', '李老师'], ['截止', '今天 18:00'], ['状态', '班主任尚未提交']],
    tags: ['脱敏摘要', '不含敏感信息'],
    actions: [['查看督办详情', false], ['提醒反馈', true]]
  });
  addTaskCard(screen, {
    title: '高二（1）班 · L同学',
    status: '已跟进',
    statusTone: 'success',
    meta: [['责任人', '王老师'], ['截止', '明天 12:00'], ['状态', '等待心理老师确认']],
    tags: ['已提交反馈'],
    actions: [['查看督办详情', false]]
  });
  addNotice(screen, '权限边界', '年级主任不可查看 AI 原始判断、敏感题项、完整咨询记录和完整干预细节。', 'shield');
}

function buildGradeDetail(screen) {
  addInfoHero(screen, '督办详情', '高二（3）班 · C同学', '责任班主任：李老师 · 当前状态：待反馈', '待反馈');
  addSection(screen, '脱敏任务摘要', [
    ['责任班主任', '李老师'],
    ['截止时间', '今天 18:00'],
    ['当前状态', '班主任尚未提交观察反馈']
  ]);
  addSection(screen, '督办状态', [
    ['班主任是否提交', '未提交'],
    ['是否逾期', '未逾期'],
    ['心理老师状态', '等待观察反馈']
  ]);
  addNotice(screen, '权限边界', '年级主任只进行流程督办，不填写心理跟进记录，不直接督促心理老师做专业判断。', 'shield');
  addBottomBar(screen, [['返回首页', false], ['提醒班主任反馈', true]]);
}

function buildPrincipalHome(screen) {
  addHero(screen, {
    eyebrow: '校级全局视角',
    titleSegments: [['危险待推进 ', 'dark'], ['2', 'brand']],
    desc: '校级视角只展示聚合处置压力和脱敏关注事项，不进入学生个体详情。',
    icon: 'shield'
  });
  addPrincipalStats(screen);
  addSection(screen, '需立即关注', [
    ['高二（3）班 · C同学', '高优先级 / 已超时 2 小时 / 已通知年级主任、班主任'],
    ['高三（2）班 · W同学', '转介资源排队 / 剩余 6 小时 / 已通知心理负责人'],
    ['高一年级 · 5项未回收', '中优先级 / 今日内处理 / 已通知年级负责人']
  ]);
  addNotice(screen, '隐私边界', '校级视角不展示学生姓名、测评原文、咨询记录、敏感题项和 AI 原始判断；只用于资源调配与流程督办。', 'shield');
}

function addHeader(screen, spec) {
  var header = auto('app-header', 'HORIZONTAL', 18, 0, 10);
  header.resize(339, 48);
  header.layoutSizingHorizontal = 'FIXED';
  header.primaryAxisAlignItems = 'SPACE_BETWEEN';
  header.counterAxisAlignItems = 'CENTER';
  header.fills = [];
  screen.appendChild(header);

  if (spec.back) header.appendChild(circleIcon('app-header__back', '‹'));

  var titleBox = auto('app-header__title-block', 'VERTICAL', 0, 0, 2);
  titleBox.fills = [];
  titleBox.layoutGrow = 1;
  header.appendChild(titleBox);
  titleBox.appendChild(t('app-header__role', spec.role, 13, 'semibold', TOKENS.faint));
  titleBox.appendChild(t('app-header__title', spec.title, 22, 'bold', TOKENS.ink));

  header.appendChild(circleIcon('app-header__action', '+'));
}

function addHero(screen, data) {
  var hero = panel('hero-card', 22, 16, 14);
  screen.appendChild(hero);
  var top = auto('hero-card__content-row', 'HORIZONTAL', 0, 0, 12);
  top.fills = [];
  top.layoutSizingHorizontal = 'FILL';
  hero.appendChild(top);
  var copy = auto('hero-card__copy', 'VERTICAL', 0, 0, 8);
  copy.fills = [];
  copy.layoutGrow = 1;
  top.appendChild(copy);
  copy.appendChild(t('hero-card__eyebrow', data.eyebrow, 14, 'semibold', TOKENS.brand));
  copy.appendChild(richTitle('hero-card__title', data.titleSegments));
  copy.appendChild(t('hero-card__desc', data.desc, 14, 'regular', TOKENS.body, 290, 42));
  top.appendChild(circleIcon('hero-card__icon', iconGlyph(data.icon), 46));
}

function addInfoHero(screen, eyebrow, title, desc, tagText) {
  var hero = panel('detail-hero', 22, 16, 12);
  screen.appendChild(hero);
  hero.appendChild(t('detail-hero__eyebrow', eyebrow, 13, 'semibold', TOKENS.faint));
  hero.appendChild(t('detail-hero__title', title, 24, 'bold', TOKENS.ink, 300, 32));
  hero.appendChild(t('detail-hero__desc', desc, 14, 'regular', TOKENS.body, 300, 42));
  if (tagText) hero.appendChild(tag('detail-hero__status-tag', tagText, 'warning'));
}

function addStatGrid(screen, stats) {
  var grid = auto('status-summary', 'HORIZONTAL', 0, 0, 10);
  grid.layoutSizingHorizontal = 'FILL';
  grid.fills = [];
  screen.appendChild(grid);
  for (var i = 0; i < stats.length; i++) {
    var item = panel('status-summary__item', 14, 12, 4);
    item.resize(103, 70);
    item.layoutSizingHorizontal = 'FIXED';
    grid.appendChild(item);
    item.appendChild(t('status-summary__number', stats[i][0], 24, 'bold', TOKENS.ink, 70, 28, 'CENTER'));
    item.appendChild(t('status-summary__label', stats[i][1], 12, 'medium', TOKENS.muted, 70, 18, 'CENTER'));
  }
}

function addPrincipalStats(screen) {
  var grid = auto('principal-kpi-grid', 'VERTICAL', 0, 0, 10);
  grid.layoutSizingHorizontal = 'FILL';
  grid.fills = [];
  screen.appendChild(grid);
  var rows = [[['2', '危险待推进'], ['3', '超时未处理']], [['12', '干预中'], ['4', '今日闭环']]];
  for (var r = 0; r < rows.length; r++) {
    var row = auto('principal-kpi-grid__row', 'HORIZONTAL', 0, 0, 10);
    row.layoutSizingHorizontal = 'FILL';
    row.fills = [];
    grid.appendChild(row);
    for (var i = 0; i < rows[r].length; i++) {
      var item = panel('principal-kpi-card', 14, 12, 2);
      item.resize(164, 72);
      item.layoutSizingHorizontal = 'FIXED';
      row.appendChild(item);
      item.appendChild(t('principal-kpi-card__number', rows[r][i][0], 26, 'bold', TOKENS.brand));
      item.appendChild(t('principal-kpi-card__label', rows[r][i][1], 13, 'medium', TOKENS.muted));
    }
  }
}

function addNotice(screen, title, body, icon) {
  var notice = auto('permission-notice', 'HORIZONTAL', 14, 12, 10);
  notice.layoutSizingHorizontal = 'FILL';
  notice.cornerRadius = 16;
  notice.fills = [solid(TOKENS.surfaceSoft)];
  notice.strokes = [solid(TOKENS.hairline)];
  notice.strokeWeight = 1;
  screen.appendChild(notice);
  notice.appendChild(circleIcon('permission-notice__icon', iconGlyph(icon), 26));
  var copy = auto('permission-notice__copy', 'VERTICAL', 0, 0, 4);
  copy.layoutGrow = 1;
  copy.fills = [];
  notice.appendChild(copy);
  copy.appendChild(t('permission-notice__title', title, 14, 'bold', TOKENS.ink));
  copy.appendChild(t('permission-notice__body', body, 12, 'regular', TOKENS.body, 260, 48));
}

function addSegmented(screen, labels, activeIndex) {
  var tabs = auto('segmented-filter', 'HORIZONTAL', 4, 4, 4);
  tabs.layoutSizingHorizontal = 'FILL';
  tabs.cornerRadius = 18;
  tabs.fills = [solid('#FFFFFF', 0.72)];
  tabs.strokes = [solid(TOKENS.hairline)];
  tabs.strokeWeight = 1;
  screen.appendChild(tabs);
  for (var i = 0; i < labels.length; i++) {
    var item = auto('segmented-filter__item' + (i === activeIndex ? '--active' : ''), 'HORIZONTAL', 10, 4, 0);
    item.resize(106, 30);
    item.layoutSizingHorizontal = 'FIXED';
    item.counterAxisAlignItems = 'CENTER';
    item.primaryAxisAlignItems = 'CENTER';
    item.cornerRadius = 15;
    item.fills = [solid(i === activeIndex ? TOKENS.brand : '#FFFFFF', i === activeIndex ? 1 : 0)];
    tabs.appendChild(item);
    item.appendChild(t('segmented-filter__label', labels[i], 12, 'semibold', i === activeIndex ? '#FFFFFF' : TOKENS.body, 80, 18, 'CENTER'));
  }
}

function addTaskCard(screen, data) {
  var card = panel('task-card', 16, 14, 12);
  screen.appendChild(card);
  var head = auto('task-card__header', 'HORIZONTAL', 0, 0, 8);
  head.layoutSizingHorizontal = 'FILL';
  head.primaryAxisAlignItems = 'SPACE_BETWEEN';
  head.counterAxisAlignItems = 'CENTER';
  head.fills = [];
  card.appendChild(head);
  head.appendChild(t('task-card__title', data.title, 18, 'bold', TOKENS.ink, 210, 24));
  head.appendChild(tag('task-card__status-tag', data.status, data.statusTone));
  for (var i = 0; i < data.meta.length; i++) card.appendChild(metaRow('task-card__meta-row', data.meta[i][0], data.meta[i][1]));
  if (data.tags && data.tags.length) {
    var chips = auto('task-card__focus-tags', 'HORIZONTAL', 0, 0, 8);
    chips.layoutSizingHorizontal = 'FILL';
    chips.fills = [];
    card.appendChild(chips);
    for (var j = 0; j < data.tags.length; j++) chips.appendChild(tag('task-card__focus-tag', data.tags[j], 'gray'));
  }
  var actions = auto('task-card__actions', 'HORIZONTAL', 0, 0, 10);
  actions.layoutSizingHorizontal = 'FILL';
  actions.fills = [];
  card.appendChild(actions);
  for (var k = 0; k < data.actions.length; k++) actions.appendChild(buttonNode('task-card__button', data.actions[k][0], data.actions[k][1]));
}

function addSection(screen, title, rows) {
  var sec = panel('section-block', 16, 14, 12);
  screen.appendChild(sec);
  sec.appendChild(t('section-block__title', title, 18, 'bold', TOKENS.ink));
  for (var i = 0; i < rows.length; i++) sec.appendChild(metaRow('section-block__row', rows[i][0], rows[i][1]));
}

function addFormBlock(screen, label, value) {
  var field = auto('form-field', 'VERTICAL', 0, 0, 8);
  field.layoutSizingHorizontal = 'FILL';
  field.fills = [];
  screen.appendChild(field);
  field.appendChild(t('form-field__label', label, 13, 'bold', TOKENS.ink));
  var input = auto('form-field__control', 'HORIZONTAL', 14, 12, 0);
  input.layoutSizingHorizontal = 'FILL';
  input.cornerRadius = 14;
  input.fills = [solid(TOKENS.surface)];
  input.strokes = [solid(TOKENS.hairline)];
  input.strokeWeight = 1;
  field.appendChild(input);
  input.appendChild(t('form-field__value', value, 14, 'medium', TOKENS.body));
}

function addTextArea(screen, label, value) {
  var field = auto('textarea-field', 'VERTICAL', 0, 0, 8);
  field.layoutSizingHorizontal = 'FILL';
  field.fills = [];
  screen.appendChild(field);
  field.appendChild(t('textarea-field__label', label, 13, 'bold', TOKENS.ink));
  var input = auto('textarea-field__control', 'VERTICAL', 14, 12, 0);
  input.resize(339, 120);
  input.layoutSizingHorizontal = 'FIXED';
  input.cornerRadius = 14;
  input.fills = [solid(TOKENS.surface)];
  input.strokes = [solid(TOKENS.hairline)];
  input.strokeWeight = 1;
  field.appendChild(input);
  input.appendChild(t('textarea-field__value', value, 14, 'regular', TOKENS.body, 300, 86));
}

function addChipGroup(screen, label, chips, active) {
  var group = auto('chip-group', 'VERTICAL', 0, 0, 8);
  group.layoutSizingHorizontal = 'FILL';
  group.fills = [];
  screen.appendChild(group);
  group.appendChild(t('chip-group__label', label, 13, 'bold', TOKENS.ink));
  var wrap = auto('chip-group__options', 'HORIZONTAL', 0, 0, 8);
  wrap.layoutWrap = 'WRAP';
  wrap.layoutSizingHorizontal = 'FILL';
  wrap.fills = [];
  group.appendChild(wrap);
  for (var i = 0; i < chips.length; i++) wrap.appendChild(tag('chip-group__option' + (active.indexOf(i) >= 0 ? '--active' : ''), chips[i], active.indexOf(i) >= 0 ? 'info' : 'gray'));
}

function addBottomBar(screen, actions) {
  var bar = auto('bottom-action-bar', 'HORIZONTAL', 16, 18, 12);
  bar.resize(375, 78);
  bar.layoutSizingHorizontal = 'FIXED';
  bar.primaryAxisAlignItems = 'CENTER';
  bar.counterAxisAlignItems = 'CENTER';
  bar.fills = [solid('#FFFFFF', 0.94)];
  bar.strokes = [solid(TOKENS.hairline)];
  bar.strokeWeight = 1;
  screen.appendChild(bar);
  for (var i = 0; i < actions.length; i++) bar.appendChild(buttonNode('bottom-action-bar__button', actions[i][0], actions[i][1]));
}

function addDrawer(screen, title, rows, actions) {
  var overlay = figma.createFrame();
  overlay.name = 'modal-overlay';
  overlay.resize(375, screen.height);
  overlay.fills = [solid('#111827', 0.32)];
  overlay.x = 0;
  overlay.y = 0;
  screen.appendChild(overlay);

  var sheet = auto('confirm-sheet', 'VERTICAL', 24, 18, 14);
  sheet.resize(375, 520);
  sheet.layoutSizingHorizontal = 'FIXED';
  sheet.cornerRadius = 24;
  sheet.fills = [solid('#FFFFFF')];
  sheet.effects = [dropShadow()];
  sheet.x = 0;
  sheet.y = screen.height - 520;
  screen.appendChild(sheet);
  sheet.appendChild(t('confirm-sheet__title', title, 22, 'bold', TOKENS.ink));
  for (var i = 0; i < rows.length; i++) sheet.appendChild(metaRow('confirm-sheet__row', rows[i][0], rows[i][1]));
  sheet.appendChild(t('confirm-sheet__privacy', '外部提醒不包含学生姓名、测评原文、咨询记录、敏感题项、AI 原始判断或具体心理风险原因。', 12, 'regular', TOKENS.muted, 310, 44));
  var actionRow = auto('confirm-sheet__actions', 'HORIZONTAL', 0, 0, 10);
  actionRow.layoutSizingHorizontal = 'FILL';
  actionRow.fills = [];
  sheet.appendChild(actionRow);
  for (var j = 0; j < actions.length; j++) actionRow.appendChild(buttonNode('confirm-sheet__button', actions[j][0], actions[j][1]));
}

function screenFrame(spec) {
  var f = auto(spec.name, 'VERTICAL', 18, 18, 14);
  f.resize(375, spec.type.indexOf('drawer') >= 0 ? 1260 : 1120);
  if (spec.type === 'home-teacher' || spec.type === 'home-grade') f.resize(375, 900);
  if (spec.type === 'home-counselor') f.resize(375, 960);
  if (spec.type === 'teacher-form') f.resize(375, 1380);
  if (spec.type === 'clue-report') f.resize(375, 1220);
  if (spec.type === 'counselor-detail') f.resize(375, 1320);
  if (spec.type === 'principal-drawer' || spec.type === 'home-principal') f.resize(375, 1180);
  f.layoutSizingHorizontal = 'FIXED';
  f.primaryAxisSizingMode = 'FIXED';
  f.counterAxisSizingMode = 'FIXED';
  f.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: [
      { position: 0, color: rgba(TOKENS.bgTop, 1) },
      { position: 1, color: rgba(TOKENS.bgBottom, 1) }
    ]
  }];
  return f;
}

function panel(name, radius, padding, gap) {
  var p = auto(name, 'VERTICAL', padding, padding, gap);
  p.layoutSizingHorizontal = 'FILL';
  p.cornerRadius = radius;
  p.fills = [solid(TOKENS.surface, 0.92)];
  p.strokes = [solid(TOKENS.hairline)];
  p.strokeWeight = 1;
  p.effects = [dropShadow()];
  return p;
}

function auto(name, direction, paddingX, paddingY, gap) {
  var f = figma.createFrame();
  f.name = name;
  f.layoutMode = direction;
  f.primaryAxisSizingMode = 'AUTO';
  f.counterAxisSizingMode = 'AUTO';
  f.itemSpacing = gap;
  f.paddingLeft = paddingX;
  f.paddingRight = paddingX;
  f.paddingTop = paddingY;
  f.paddingBottom = paddingY;
  f.counterAxisAlignItems = direction === 'VERTICAL' ? 'MIN' : 'CENTER';
  f.fills = [];
  return f;
}

function metaRow(name, label, value) {
  var row = auto(name, 'HORIZONTAL', 0, 0, 8);
  row.layoutSizingHorizontal = 'FILL';
  row.primaryAxisAlignItems = 'SPACE_BETWEEN';
  row.fills = [];
  row.appendChild(t(name + '__label', label, 13, 'medium', TOKENS.faint, 88, 20));
  row.appendChild(t(name + '__value', value, 13, 'medium', TOKENS.body, 210, 38));
  return row;
}

function buttonNode(name, label, primary) {
  var b = auto(name + (primary ? '--primary' : '--secondary'), 'HORIZONTAL', 16, 11, 0);
  b.resize(145, 44);
  b.layoutSizingHorizontal = 'FIXED';
  b.counterAxisAlignItems = 'CENTER';
  b.primaryAxisAlignItems = 'CENTER';
  b.cornerRadius = 16;
  if (primary) {
    b.fills = [{
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [
        { position: 0, color: rgba(TOKENS.brand, 1) },
        { position: 1, color: rgba(TOKENS.brand2, 1) }
      ]
    }];
    b.strokes = [];
    b.appendChild(t(name + '__label', label, 14, 'bold', '#FFFFFF', 112, 20, 'CENTER'));
  } else {
    b.fills = [solid('#FFFFFF', 0.82)];
    b.strokes = [solid(TOKENS.hairline)];
    b.strokeWeight = 1;
    b.appendChild(t(name + '__label', label, 14, 'bold', TOKENS.body, 112, 20, 'CENTER'));
  }
  return b;
}

function tag(name, label, tone) {
  var palette = {
    info: [TOKENS.blueSoft, TOKENS.brand],
    warning: [TOKENS.warningSoft, TOKENS.warning],
    danger: [TOKENS.dangerSoft, TOKENS.danger],
    success: [TOKENS.successSoft, TOKENS.success],
    gray: [TOKENS.surfaceSoft, TOKENS.body]
  };
  var p = palette[tone] || palette.gray;
  var node = auto(name, 'HORIZONTAL', 10, 5, 0);
  node.cornerRadius = 14;
  node.fills = [solid(p[0])];
  node.strokes = [solid(TOKENS.hairlineSoft)];
  node.strokeWeight = 1;
  node.appendChild(t(name + '__text', label, 12, 'semibold', p[1], Math.max(42, label.length * 13), 18, 'CENTER'));
  return node;
}

function circleIcon(name, glyph, size) {
  size = size || 32;
  var c = auto(name, 'HORIZONTAL', 0, 0, 0);
  c.resize(size, size);
  c.layoutSizingHorizontal = 'FIXED';
  c.layoutSizingVertical = 'FIXED';
  c.counterAxisAlignItems = 'CENTER';
  c.primaryAxisAlignItems = 'CENTER';
  c.cornerRadius = size / 2;
  c.fills = [solid('#FFFFFF', 0.92)];
  c.strokes = [solid(TOKENS.hairline)];
  c.strokeWeight = 1;
  c.appendChild(t(name + '__glyph', glyph, size >= 40 ? 19 : 16, 'bold', TOKENS.brand, size, size, 'CENTER'));
  return c;
}

function richTitle(name, segments) {
  var row = auto(name, 'HORIZONTAL', 0, 0, 0);
  row.layoutSizingHorizontal = 'FILL';
  row.fills = [];
  for (var i = 0; i < segments.length; i++) {
    row.appendChild(t(name + '__segment', segments[i][0], segments[i][1] === 'brand' ? 28 : 24, 'bold', segments[i][1] === 'brand' ? TOKENS.brand : TOKENS.ink, segments[i][0].length * 18 + 10, 34));
  }
  return row;
}

function t(name, content, size, weight, color, width, height, align) {
  var node = figma.createText();
  node.name = name;
  node.fontName = fonts[weight] || fonts.regular;
  node.characters = content;
  node.fontSize = size;
  node.lineHeight = { unit: 'PIXELS', value: Math.round(size * 1.38) };
  node.textAlignHorizontal = align || 'LEFT';
  node.fills = [solid(color)];
  node.resize(width || Math.max(12, content.length * size), height || Math.round(size * 1.5));
  return node;
}

function iconGlyph(name) {
  if (name === 'shield') return '◇';
  if (name === 'alert') return '!';
  if (name === 'heart') return '♡';
  if (name === 'users') return '♢';
  if (name === 'clipboard') return '▣';
  return '•';
}

function dropShadow() {
  return { type: 'DROP_SHADOW', color: { r: 0.25, g: 0.30, b: 0.45, a: 0.12 }, offset: { x: 0, y: 10 }, radius: 24, spread: 0, visible: true, blendMode: 'NORMAL' };
}

async function resolveFonts() {
  var available = await figma.listAvailableFontsAsync();
  var first = available && available.length ? available[0].fontName : { family: 'Inter', style: 'Regular' };
  function has(family, style) {
    return available.some(function(f) { return f.fontName.family === family && f.fontName.style === style; });
  }
  var families = ['Alibaba PuHuiTi 3.0', 'Alibaba PuHuiTi', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Source Han Sans CN', 'Inter'];
  var styles = {
    regular: ['Regular', '55 Regular'],
    medium: ['Medium', '65 Medium', 'Regular'],
    semibold: ['Semibold', 'SemiBold', 'Semi Bold', '75 SemiBold', 'Medium', 'Bold'],
    bold: ['Bold', '85 Bold', 'Semibold', 'Semi Bold', 'Medium']
  };
  function pick(weight) {
    for (var i = 0; i < families.length; i++) {
      for (var j = 0; j < styles[weight].length; j++) {
        if (has(families[i], styles[weight][j])) return { family: families[i], style: styles[weight][j] };
      }
    }
    return first;
  }
  return { regular: pick('regular'), medium: pick('medium'), semibold: pick('semibold'), bold: pick('bold') };
}

async function loadFontOnce(font) {
  var key = font.family + '/' + font.style;
  if (loadedFonts[key]) return;
  loadedFonts[key] = true;
  await figma.loadFontAsync(font);
}

function findStartPosition() {
  var maxX = 0;
  for (var i = 0; i < figma.currentPage.children.length; i++) {
    var c = figma.currentPage.children[i];
    if ('x' in c && 'width' in c) maxX = Math.max(maxX, c.x + c.width);
  }
  return { x: maxX + 160, y: 0 };
}

function solid(hex, opacity) {
  return { type: 'SOLID', color: rgb(hex), opacity: opacity == null ? 1 : opacity };
}

function rgb(hex) {
  var h = String(hex || '#000000').replace('#', '');
  return { r: parseInt(h.slice(0, 2), 16) / 255, g: parseInt(h.slice(2, 4), 16) / 255, b: parseInt(h.slice(4, 6), 16) / 255 };
}

function rgba(hex, a) {
  var c = rgb(hex);
  return { r: c.r, g: c.g, b: c.b, a: a };
}
