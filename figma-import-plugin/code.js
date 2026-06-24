// Local Figma importer for the campus mental-health miniapp demo.
// Creates editable mobile Frames in the current Figma page. No network or MCP required.

const W = 375;
const GAP_X = 72;
const GAP_Y = 120;
const COLS = 4;

const COLORS = {
  bgTop: '#F7F3FF',
  bgBottom: '#EEF7FF',
  surface: '#FFFFFF',
  surfaceSoft: '#F7F9FF',
  text: '#1F2A44',
  muted: '#66728A',
  faint: '#8A94AA',
  brand: '#6657F0',
  brand2: '#5E8BFF',
  line: '#DDE5F4',
  red: '#D94B4B',
  green: '#21895B',
  amber: '#A96A00',
};

const screens = [
  { name: '01 班主任 / 首页', role: '高二年级 · 班主任', title: '我的观察任务', height: 860, build: buildHomeroomHome },
  { name: '02 班主任 / 观察任务详情', role: '高二年级 · 班主任', title: '观察任务详情', height: 1120, build: buildHomeroomDetail },
  { name: '03 班主任 / 填写观察反馈', role: '高二年级 · 班主任', title: '填写观察反馈', height: 1320, build: buildHomeroomForm },
  { name: '04 班主任 / 上报协作线索', role: '高二年级 · 班主任', title: '上报协作线索', height: 1080, build: buildClueReport },
  { name: '05 心理老师 / 首页', role: '校心理中心 · 心理老师', title: '待确认反馈', height: 940, build: buildCounselorHome },
  { name: '06 心理老师 / 反馈确认详情', role: '校心理中心 · 心理老师', title: '反馈确认详情', height: 1680, build: buildCounselorDetail },
  { name: '07 心理老师 / 补充反馈确认抽屉', role: '校心理中心 · 心理老师', title: '反馈确认详情', height: 1680, build: buildCounselorDrawer },
  { name: '08 年级主任 / 首页', role: '高二年级组 · 年级主任', title: '年级督办', height: 860, build: buildGradeHome },
  { name: '09 年级主任 / 督办详情', role: '高二年级组 · 年级主任', title: '督办详情', height: 1100, build: buildGradeDetail },
  { name: '10 年级主任 / 提醒确认抽屉', role: '高二年级组 · 年级主任', title: '督办详情', height: 1100, build: buildGradeDrawer },
  { name: '11 校长 / 首页', role: '学校管理层 · 校级管理者', title: '预警督办 / 消息中心', height: 1280, build: buildPrincipalHome },
  { name: '12 校长 / 督办确认抽屉', role: '学校管理层 · 校级管理者', title: '预警督办 / 消息中心', height: 1280, build: buildPrincipalDrawer },
];

let fonts;

run().catch(async (error) => {
  const message = error && error.message ? error.message : String(error);
  try {
    const available = await figma.listAvailableFontsAsync();
    const safeFont = available && available.length ? available[0].fontName : { family: 'Inter', style: 'Regular' };
    await figma.loadFontAsync(safeFont);
    const frame = figma.createFrame();
    frame.name = '导入失败 - 错误信息';
    frame.resize(520, 180);
    frame.x = 0;
    frame.y = 0;
    frame.fills = [solid('#FFF1F1', 1)];
    frame.strokes = [solid('#F4B7B7', 1)];
    frame.strokeWeight = 1;
    const title = figma.createText();
    title.name = '错误标题';
    title.x = 24;
    title.y = 24;
    title.resize(460, 28);
    title.fontName = safeFont;
    title.characters = '插件运行失败';
    title.fontSize = 20;
    title.fills = [solid('#B42318', 1)];
    frame.appendChild(title);
    const detail = figma.createText();
    detail.name = '错误详情';
    detail.x = 24;
    detail.y = 66;
    detail.resize(460, 92);
    detail.fontName = safeFont;
    detail.characters = message;
    detail.fontSize = 13;
    detail.lineHeight = { unit: 'PIXELS', value: 18 };
    detail.fills = [solid('#7A271A', 1)];
    frame.appendChild(detail);
    figma.currentPage.appendChild(frame);
    figma.currentPage.selection = [frame];
    figma.viewport.scrollAndZoomIntoView([frame]);
  } catch (_) {
    // Ignore secondary reporting failures.
  }
  figma.closePlugin(`导入失败：${message}`);
});

async function run() {
  fonts = await resolveFonts();
  await loadUniqueFonts(Object.values(fonts));

  const start = findStartPosition();
  const created = [];

  for (let i = 0; i < screens.length; i += 1) {
    const spec = screens[i];
    const screen = createScreen(spec, start.x + (i % COLS) * (W + GAP_X), start.y + Math.floor(i / COLS) * 1900);
    figma.currentPage.appendChild(screen);
    spec.build(screen, spec);
    created.push(screen);
  }

  figma.currentPage.selection = created;
  figma.viewport.scrollAndZoomIntoView(created);
  figma.closePlugin(`已生成 ${created.length} 个可编辑页面 Frame`);
}

async function resolveFonts() {
  const available = await figma.listAvailableFontsAsync();
  const has = (family, style) => available.some((f) => f.fontName.family === family && f.fontName.style === style);
  const firstAvailable = available && available.length ? available[0].fontName : { family: 'Inter', style: 'Regular' };
  const families = ['Alibaba PuHuiTi 3.0', 'Alibaba PuHuiTi', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Source Han Sans CN', 'Inter'];
  const stylesByWeight = {
    regular: ['Regular', '55 Regular'],
    medium: ['Medium', '65 Medium', 'Regular'],
    semibold: ['Semibold', 'SemiBold', 'Semi Bold', '75 SemiBold', 'Medium', 'Bold'],
    bold: ['Bold', '85 Bold', 'Semibold', 'Semi Bold', 'Medium'],
  };
  const pick = (weight) => {
    for (const family of families) {
      for (const style of stylesByWeight[weight]) {
        if (has(family, style)) return { family, style };
      }
    }
    return firstAvailable;
  };
  return {
    regular: pick('regular'),
    medium: pick('medium'),
    semibold: pick('semibold'),
    bold: pick('bold'),
  };
}

async function loadUniqueFonts(fontList) {
  const seen = new Set();
  for (const font of fontList) {
    const key = `${font.family}/${font.style}`;
    if (seen.has(key)) continue;
    seen.add(key);
    await figma.loadFontAsync(font);
  }
}

function findStartPosition() {
  let maxX = 0;
  for (const child of figma.currentPage.children) {
    if ('x' in child && 'width' in child) maxX = Math.max(maxX, child.x + child.width);
  }
  return { x: maxX + 160, y: 0 };
}

function createScreen(spec, x, y) {
  const frame = figma.createFrame();
  frame.name = spec.name;
  frame.resize(W, spec.height);
  frame.x = x;
  frame.y = y;
  frame.clipsContent = false;
  frame.fills = [{
    type: 'GRADIENT_LINEAR',
    gradientTransform: [[0, 1, 0], [-1, 0, 1]],
    gradientStops: [
      { position: 0, color: hexToRgba(COLORS.bgTop, 1) },
      { position: 1, color: hexToRgba(COLORS.bgBottom, 1) },
    ],
  }];
  addHeader(frame, spec.title, spec.role, spec.name.includes('详情') || spec.name.includes('填写') || spec.name.includes('上报'));
  return frame;
}

function addHeader(parent, title, role, back) {
  const x = back ? 58 : 18;
  if (back) {
    round(parent, '返回按钮', 18, 24, 32, 32, '#FFFFFF', 16, '#E2E8F4', false);
    text(parent, '返回箭头', '‹', 27, 18, 16, 36, 30, 'regular', COLORS.muted, 'CENTER', 34);
  }
  text(parent, '顶部角色', role, x, 18, 260, 18, 13, 'semibold', COLORS.faint);
  text(parent, '顶部标题', title, x, 39, 295, 30, 22, 'bold', COLORS.text, 'LEFT', 28);
}

function addHero(parent, eyebrow, title, desc, icon) {
  cardBase(parent, 'Hero 背景', 18, 82, 339, 138, 22);
  text(parent, 'Hero eyebrow', eyebrow, 38, 104, 220, 20, 14, 'semibold', COLORS.brand);
  text(parent, 'Hero 标题', title, 38, 128, 236, 36, 26, 'bold', COLORS.text, 'LEFT', 32);
  text(parent, 'Hero 描述', desc, 38, 170, 248, 40, 14, 'regular', COLORS.muted, 'LEFT', 20);
  round(parent, '角色图标徽章', 292, 106, 46, 46, '#EEF2FF', 23, '#DDE5FF', false);
  text(parent, '角色图标', icon, 303, 115, 24, 24, 20, 'bold', COLORS.brand, 'CENTER', 24);
}

function addTabs(parent, labels, activeIndex = 0, y = 236) {
  labels.forEach((label, index) => {
    const tone = index === activeIndex ? 'blue' : 'gray';
    pill(parent, label, 18 + index * 102, y, 92, tone);
  });
}

function addTaskCard(parent, y, title, status, tone, rows, tags, actions) {
  const h = 156 + (tags.length ? 34 : 0);
  cardBase(parent, `任务卡 / ${title}`, 18, y, 339, h, 18);
  text(parent, '任务标题', title, 36, y + 18, 212, 24, 19, 'bold', COLORS.text, 'LEFT', 24);
  pill(parent, status, 258, y + 16, 80, tone);

  let cy = y + 54;
  rows.forEach(([k, v]) => {
    text(parent, '任务字段', k, 36, cy, 62, 20, 13, 'medium', COLORS.faint, 'LEFT', 20);
    text(parent, '任务值', v, 98, cy, 230, 20, 14, 'medium', '#303A55', 'LEFT', 20);
    cy += 26;
  });

  let tx = 36;
  tags.slice(0, 2).forEach((tag) => {
    const w = Math.max(72, tag.length * 12 + 24);
    pill(parent, tag, tx, cy + 2, w, 'gray');
    tx += w + 8;
  });

  const by = y + h - 54;
  const bw = actions.length > 1 ? 145 : 300;
  actions.slice(0, 2).forEach(([label, primary], index) => {
    button(parent, label, 36 + index * (bw + 12), by, bw, primary);
  });
  return y + h + 16;
}

function addSection(parent, y, title, rows, note) {
  const h = 54 + rows.length * 34 + (note ? 42 : 0);
  cardBase(parent, `模块 / ${title}`, 18, y, 339, h, 18);
  text(parent, '模块标题', title, 36, y + 16, 300, 24, 18, 'bold', COLORS.text, 'LEFT', 24);
  let cy = y + 52;
  rows.forEach(([k, v]) => {
    text(parent, '字段名', k, 36, cy, 86, 20, 13, 'medium', COLORS.faint, 'LEFT', 20);
    text(parent, '字段值', v, 124, cy, 214, 24, 14, 'medium', '#303A55', 'LEFT', 20);
    cy += 34;
  });
  if (note) text(parent, '说明', note, 36, cy, 298, 38, 13, 'regular', COLORS.muted, 'LEFT', 18);
  return y + h + 16;
}

function addBottomBar(parent, actions) {
  const y = parent.height - 76;
  round(parent, '底部操作栏', 0, y, W, 76, '#FFFFFF', 0, '#E5EAF5', true);
  const bw = actions.length > 1 ? 155 : 320;
  const sx = actions.length > 1 ? 24 : 28;
  actions.slice(0, 2).forEach(([label, primary], index) => {
    button(parent, label, sx + index * (bw + 16), y + 16, bw, primary);
  });
}

function addDrawer(parent, title, rows, actions) {
  round(parent, '弹层遮罩', 0, 0, W, parent.height, '#111827', 0, null, false, 0.35);
  const sy = Math.max(360, parent.height - 560);
  cardBase(parent, '底部抽屉', 0, sy, W, parent.height - sy, 24);
  text(parent, '抽屉标题', title, 24, sy + 32, 300, 30, 22, 'bold', COLORS.text, 'LEFT', 28);
  let y = addSection(parent, sy + 84, '操作确认', rows);
  text(parent, '隐私提示', '外部提醒不包含学生姓名、测评原文、咨询记录、敏感题项、AI 原始判断或具体心理风险原因。', 24, y, 327, 52, 13, 'regular', COLORS.muted, 'LEFT', 18);
  addBottomBar(parent, actions);
}

function buildHomeroomHome(parent) {
  addHero(parent, '班主任工作台', '有 1 项待反馈', '只展示分配给我的观察任务，反馈事实观察。', '◎');
  addTabs(parent, ['待反馈', '已提交', '已完成']);
  let y = 286;
  y = addTaskCard(parent, y, '陈同学', '待反馈', 'red', [['优先级', '高'], ['截止', '今天 18:00'], ['状态', '等待观察反馈']], ['情绪波动', '出勤变化'], [['查看任务', false], ['填写反馈', true]]);
  y = addTaskCard(parent, y, '许同学', '已完成', 'green', [['优先级', '常规'], ['截止', '06-08 17:00'], ['状态', '已闭环']], ['复测完成', '状态稳定'], [['查看任务', false]]);
  addSection(parent, y, '隐私边界', [['不可查看', '测评原文、敏感题项、AI 原始判断'], ['填写范围', '课堂、课间、家校沟通中的事实观察']]);
}

function buildHomeroomDetail(parent) {
  let y = 84;
  y = addSection(parent, y, '学生与任务', [['学生', '陈同学'], ['班级', '高二（3）班'], ['协作优先级', '高'], ['截止', '今天 18:00'], ['当前状态', '待反馈']]);
  y = addSection(parent, y, '必要观察重点', [['重点一', '近一周情绪波动'], ['重点二', '出勤与迟到变化'], ['重点三', '课堂参与度']], '仅记录可观察事实，不填写心理判断或风险结论。');
  addSection(parent, y, '我的反馈状态', [['状态', '尚未提交观察反馈'], ['下一步', '填写观察时间段、场景、异常表现和已采取措施']]);
  addBottomBar(parent, [['上报协作线索', false], ['填写反馈', true]]);
}

function buildHomeroomForm(parent) {
  let y = 84;
  y = addSection(parent, y, '事实观察字段', [['观察时间段', '今天上午'], ['观察场景', '课堂 / 课间'], ['异常表现', '课堂回应减少'], ['发生频率', '近两天偶发'], ['影响程度', '轻度影响课堂参与'], ['已采取措施', '一次低压力关心'], ['是否尽快查看', '是']]);
  cardBase(parent, '事实描述输入框', 18, y, 339, 154, 18);
  text(parent, '输入框标题', '事实描述', 36, y + 18, 300, 22, 15, 'bold', '#2B3550');
  text(parent, '输入框内容', '请补充课堂、课间和家校沟通中的具体观察事实，避免主观判断。', 36, y + 50, 296, 72, 14, 'regular', COLORS.muted, 'LEFT', 20);
  y += 174;
  addSection(parent, y, '提交说明', [['提交后状态', '已提交给心理老师，等待专业确认']]);
  addBottomBar(parent, [['保存草稿', false], ['提交反馈', true]]);
}

function buildClueReport(parent) {
  let y = 84;
  y = addSection(parent, y, '线索类型', [['类型', '家校沟通 / 出勤变化 / 同伴互动'], ['对象', '选择与我相关的观察任务']]);
  cardBase(parent, '线索描述输入框', 18, y, 339, 180, 18);
  text(parent, '输入框标题', '线索描述', 36, y + 18, 300, 22, 15, 'bold', '#2B3550');
  text(parent, '输入框内容', '描述看到或收到的具体事实，例如时间、地点、行为变化、已采取措施。', 36, y + 50, 296, 82, 14, 'regular', COLORS.muted, 'LEFT', 20);
  y += 200;
  addSection(parent, y, '隐私提示', [['边界', '上报内容作为协作线索，由心理老师复核后判断']]);
  addBottomBar(parent, [['取消', false], ['提交线索', true]]);
}

function buildCounselorHome(parent) {
  addHero(parent, '心理老师工作台', '有 5 项待确认', '优先处理班主任反馈与逾期未更新任务。', '♡');
  addTabs(parent, ['待确认', '处理中', '已闭环']);
  let y = 286;
  y = addTaskCard(parent, y, '林同学 · 观察任务', '待确认', 'blue', [['责任人', '王老师'], ['截止', '明天 12:00'], ['反馈', '查看已提交反馈']], [], [['查看复核详情', false], ['确认反馈', true]]);
  y = addTaskCard(parent, y, '吴同学 · 观察任务', '逾期', 'red', [['责任人', '孙老师'], ['截止', '昨天 17:00'], ['反馈', '等待观察反馈']], [], [['查看复核详情', false]]);
  addSection(parent, y, '提醒', [['逾期未更新', '3 项'], ['说明', '原始测评与 AI 判断仅心理老师可见']]);
}

function buildCounselorDetail(parent) {
  let y = 84;
  y = addSection(parent, y, '学生基础信息', [['学生', '林同学'], ['班级', '高二（1）班'], ['当前状态', '已反馈待确认'], ['责任班主任', '王老师']]);
  y = addSection(parent, y, '班主任已提交反馈', [['时间', '06-09 16:20'], ['反馈摘要', '课后沟通完成，课堂状态较上周稳定']]);
  y = addSection(parent, y, '异常观察要点', [['重点', '同伴关系变化'], ['补充', '家校沟通情况、午休状态']]);
  y = addSection(parent, y, '专业判断边界', [['说明', '当前内容来自班主任观察反馈，仅作为协作线索']], '是否进入干预流程，需由心理老师结合访谈、测评和既有记录判断。');
  addSection(parent, y, '完整处置时间线', [['06-09 09:00', 'AI 风险线索生成'], ['06-09 09:30', '心理老师复核'], ['06-09 10:00', '分发协作任务'], ['06-09 16:20', '班主任提交观察反馈']]);
  addBottomBar(parent, [['请班主任补充反馈', false], ['确认进入干预', true]]);
}

function buildCounselorDrawer(parent) {
  buildCounselorDetail(parent);
  addDrawer(parent, '请班主任补充反馈', [['补充原因', '观察时间不明确 / 场景描述不足 / 缺少近期行为变化'], ['补充说明', '请补充近 3 天课堂、课间和家校沟通中的具体观察事实'], ['通知方式', '小程序待办 + 短信提醒']], [['取消', false], ['发送补充请求', true]]);
}

function buildGradeHome(parent) {
  addHero(parent, '年级主任工作台', '本年级有 4 项需督办', '只查看本年级任务进度和脱敏摘要。', '♢');
  addTabs(parent, ['待反馈', '已逾期', '已跟进']);
  let y = 286;
  y = addTaskCard(parent, y, '高二（3）班 · C同学', '待反馈', 'red', [['责任人', '李老师'], ['截止', '今天 18:00'], ['状态', '班主任尚未提交']], ['脱敏摘要'], [['查看督办详情', false], ['提醒反馈', true]]);
  y = addTaskCard(parent, y, '高二（1）班 · L同学', '已跟进', 'green', [['责任人', '王老师'], ['截止', '明天 12:00'], ['状态', '等待心理老师确认']], [], [['查看督办详情', false]]);
  addSection(parent, y, '权限边界', [['不可查看', 'AI 原始判断、敏感题项、咨询记录、完整干预细节']]);
}

function buildGradeDetail(parent) {
  let y = 84;
  y = addSection(parent, y, '脱敏任务摘要', [['对象', '高二（3）班 · C同学'], ['责任班主任', '李老师'], ['当前状态', '待反馈'], ['截止', '今天 18:00']]);
  y = addSection(parent, y, '督办状态', [['班主任是否提交', '未提交'], ['是否逾期', '未逾期'], ['心理老师状态', '等待观察反馈']]);
  addSection(parent, y, '可执行操作', [['操作', '提醒班主任反馈'], ['限制', '不填写心理跟进记录，不督促专业判断']]);
  addBottomBar(parent, [['返回首页', false], ['提醒班主任反馈', true]]);
}

function buildGradeDrawer(parent) {
  buildGradeDetail(parent);
  addDrawer(parent, '提醒班主任反馈', [['提醒对象', '责任班主任'], ['提醒事项', '观察反馈待提交'], ['通知方式', '小程序待办 + 短信提醒'], ['消息预览', '李老师，您有一条学生观察反馈待办，请于今天 18:00 前完成反馈。']], [['取消', false], ['发送提醒并留痕', true]]);
}

function buildPrincipalHome(parent) {
  addHero(parent, '校级全局视角', '危险待推进 2', '只展示聚合处置压力和脱敏关注事项。', '△');
  const stats = [['危险待推进', '2'], ['超时未处理', '3'], ['干预中', '12'], ['今日闭环', '4']];
  stats.forEach(([label, value], index) => {
    const x = 18 + (index % 2) * 174;
    const y = 236 + Math.floor(index / 2) * 82;
    cardBase(parent, '指标卡', x, y, 165, 66, 16);
    text(parent, '指标数字', value, x + 16, y + 12, 58, 28, 26, 'bold', COLORS.brand);
    text(parent, '指标标签', label, x + 74, y + 20, 80, 20, 13, 'medium', COLORS.muted);
  });
  let y = 414;
  y = addSection(parent, y, '需立即关注', [['高二（3）班 · C同学', '高优先级 / 已超时 2 小时 / 已通知年级主任、班主任'], ['高三（2）班 · W同学', '转介资源排队 / 剩余 6 小时 / 已通知心理负责人'], ['高一年级 · 5项未回收', '中优先级 / 今日内处理 / 已通知年级负责人']]);
  addSection(parent, y, '隐私边界', [['原则', '校级视角不进入个体学生详情'], ['不展示', '姓名、班级细节、测评原文、咨询记录、敏感题项、AI 原始判断']]);
}

function buildPrincipalDrawer(parent) {
  buildPrincipalHome(parent);
  addDrawer(parent, '提醒年级负责人', [['处理对象', '年级负责人'], ['事项摘要', '高二年级连续 48 小时未更新'], ['通知方式', '小程序待办 + 短信提醒'], ['消息预览', '陈老师，您有一条心理风险协作督办待处理，请进入小程序查看并推进。']], [['取消', false], ['确认发送', true]]);
}

function cardBase(parent, name, x, y, w, h, radius) {
  const node = round(parent, name, x, y, w, h, COLORS.surface, radius, COLORS.line, true);
  node.effects = [{
    type: 'DROP_SHADOW',
    color: hexToRgba('#697399', 0.13),
    offset: { x: 0, y: 8 },
    radius: 22,
    spread: 0,
    visible: true,
    blendMode: 'NORMAL',
  }];
  return node;
}

function round(parent, name, x, y, w, h, bg, radius, stroke, shadowOn, opacity = 1) {
  const node = figma.createFrame();
  node.name = name;
  node.x = x;
  node.y = y;
  node.resize(w, h);
  node.cornerRadius = radius;
  node.clipsContent = false;
  node.fills = [solid(bg, opacity)];
  node.strokes = stroke ? [solid(stroke, 1)] : [];
  node.strokeWeight = stroke ? 1 : 0;
  if (shadowOn) {
    node.effects = [{
      type: 'DROP_SHADOW',
      color: hexToRgba('#697399', 0.13),
      offset: { x: 0, y: 8 },
      radius: 22,
      spread: 0,
      visible: true,
      blendMode: 'NORMAL',
    }];
  }
  parent.appendChild(node);
  return node;
}

function button(parent, label, x, y, w, primary) {
  if (primary) {
    const bg = round(parent, `主按钮 / ${label}`, x, y, w, 42, COLORS.brand, 14, null, false);
    bg.fills = [{
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[1, 0, 0], [0, 1, 0]],
      gradientStops: [
        { position: 0, color: hexToRgba(COLORS.brand, 1) },
        { position: 1, color: hexToRgba(COLORS.brand2, 1) },
      ],
    }];
    text(parent, '按钮文字', label, x, y + 11, w, 20, 15, 'bold', '#FFFFFF', 'CENTER', 20);
  } else {
    round(parent, `次按钮 / ${label}`, x, y, w, 42, '#FFFFFF', 14, '#D9DEF0', false);
    text(parent, '按钮文字', label, x, y + 11, w, 20, 15, 'bold', '#52607A', 'CENTER', 20);
  }
}

function pill(parent, label, x, y, w, tone) {
  const map = {
    blue: ['#EEF2FF', '#5662E8', '#D6DFFF'],
    red: ['#FFF0F0', '#D94B4B', '#FFD4D4'],
    green: ['#ECF8F0', '#21895B', '#CBEED9'],
    gray: ['#F4F6FA', '#68728B', '#E0E5F0'],
    amber: ['#FFF6DF', '#9B6700', '#FFE6A8'],
  };
  const [bg, fg, bd] = map[tone] || map.gray;
  round(parent, `标签 / ${label}`, x, y, w, 28, bg, 14, bd, false);
  text(parent, '标签文字', label, x + 8, y + 5, w - 16, 18, 12, 'bold', fg, 'CENTER', 18);
}

function text(parent, name, value, x, y, w, h, size, weight, colorValue, align = 'LEFT', lineHeight = size + 6) {
  const node = figma.createText();
  node.name = name;
  node.fontName = fonts[weight] || fonts.regular;
  node.characters = value;
  node.x = x;
  node.y = y;
  node.resize(w, h);
  node.fontSize = size;
  node.lineHeight = { unit: 'PIXELS', value: lineHeight };
  node.textAlignHorizontal = align;
  node.textAlignVertical = 'TOP';
  node.fills = [solid(colorValue, 1)];
  parent.appendChild(node);
  return node;
}

function solid(hex, opacity = 1) {
  return { type: 'SOLID', color: hexToRgb(hex), opacity };
}

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255,
  };
}

function hexToRgba(hex, a = 1) {
  const rgb = hexToRgb(hex);
  return { r: rgb.r, g: rgb.g, b: rgb.b, a };
}
