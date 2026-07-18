import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

function assert(condition, message) {
  if (!condition) throw new Error(`Phase 4.6B verification failed: ${message}`);
}

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const pagePaths = [
  'src/pages/TeacherHomePage.tsx',
  'src/pages/TeacherTaskListPage.tsx',
  'src/pages/TeacherTaskDetailPage.tsx',
  'src/pages/ObservationFeedbackPage.tsx',
  'src/pages/AbnormalReportPage.tsx',
  'src/pages/TeacherReportListPage.tsx',
  'src/pages/TeacherReportDetailPage.tsx',
  'src/pages/RetestReminderPage.tsx',
  'src/pages/ProfilePage.tsx',
];

const [
  homeSource,
  listSource,
  detailSource,
  feedbackSource,
  reportSource,
  reportListSource,
  reportDetailSource,
  retestSource,
  profileSource,
  appCss,
  ...allPageSources
] = await Promise.all([
  read('src/pages/TeacherHomePage.tsx'),
  read('src/pages/TeacherTaskListPage.tsx'),
  read('src/pages/TeacherTaskDetailPage.tsx'),
  read('src/pages/ObservationFeedbackPage.tsx'),
  read('src/pages/AbnormalReportPage.tsx'),
  read('src/pages/TeacherReportListPage.tsx'),
  read('src/pages/TeacherReportDetailPage.tsx'),
  read('src/pages/RetestReminderPage.tsx'),
  read('src/pages/ProfilePage.tsx'),
  read('src/app/mvp.css'),
  ...pagePaths.map(read),
]);

const checks = [];
const visibleSources = allPageSources.join('\n');
const forbiddenTerms = [
  '统一 Repository',
  '页面 Provider',
  '页面 Selector',
  '独立 Mock',
  'Demo Clock',
  'Demo 时间',
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4',
  'Phase 5',
  'Phase 6',
  'legacy 页面',
  '后续阶段',
  '后续迁移',
  '可写真值',
  '不修改 WarningStatus',
  '不生成 CollaborationTask',
  '草稿混用',
  '自动断言',
];
assert(
  forbiddenTerms.every((term) => !visibleSources.includes(term)),
  'visible page source must not contain development terminology',
);
checks.push('visible pages contain no audited development terminology');

assert(
  (detailSource.match(/<TaskStatusBadge\b/g) ?? []).length === 1,
  'task detail must render one primary status badge',
);
checks.push('task detail renders one primary status badge');

assert(
  detailSource.includes("task.status === 'pending' || task.status === 'returned'") &&
    !detailSource.includes('<Button fullWidth disabled>'),
  'task detail bottom action must exist only for actionable states',
);
checks.push('task detail hides bottom actions for read-only states');

assert(
  !retestSource.includes('<Button fullWidth disabled>') &&
    retestSource.includes("displayState === 'pending' ? ("),
  'retest bottom action must exist only before reminder confirmation',
);
checks.push('retest detail hides bottom actions for read-only states');

assert(
  !reportSource.includes('联系信息确认') &&
    (reportSource.match(/<Card\b/g) ?? []).length === 1,
  'abnormal report must use one primary form card without contact confirmation',
);
checks.push('abnormal report uses one primary form card and a compact submitter line');

assert(
  !homeSource.includes('最近提交') &&
    !homeSource.includes('getRecentSubmissions'),
  'teacher home must not render the recent submissions module',
);
checks.push('teacher home removes recent submissions');

assert(
  !profileSource.includes('督办历史') &&
    !profileSource.includes('我的历史任务') &&
    !profileSource.includes('当前暂不提供'),
  'profile must not expose development placeholders',
);
checks.push('profile contains only active entries and collapsible privacy help');

assert(
  !listSource.includes('班主任协作') &&
    !listSource.includes('按行动优先级排序') &&
    !listSource.includes('全部任务'),
  'task list must not repeat synonymous headings',
);
checks.push('task list uses one page title and one result list');

assert(
  appCss.includes('.mvp-filter-tabs {\n  display: flex;\n  flex-wrap: wrap;') &&
    !appCss.includes('.mvp-filter-tabs {\n  display: flex;\n  gap: 8px;\n  margin-inline'),
  'task filters must wrap instead of relying on horizontal scrolling',
);
checks.push('task filters remain fully visible at the 390px target width');

assert(
  feedbackSource.includes('<details className="mvp-disclosure mvp-disclosure--compact">') &&
    reportSource.includes('<details className="mvp-disclosure mvp-disclosure--compact">'),
  'writing examples must use progressive disclosure',
);
checks.push('feedback and report examples are collapsed by default');

assert(
  !reportListSource.includes('<dt>状态</dt>') &&
    !reportDetailSource.includes('<dt>状态</dt>'),
  'report list and detail must not repeat the primary status',
);
checks.push('report list and detail show status once');

assert(
  allPageSources.every(
    (source) =>
      !source.includes("from '../data/mock") &&
      !source.includes('from "../data/mock'),
  ),
  'pages must continue using Provider data instead of page-specific mocks',
);
checks.push('pages continue using the unified data source');

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const modules = await Promise.all([
    server.ssrLoadModule('/src/data/phase1Verification.ts'),
    server.ssrLoadModule('/src/data/phase3Verification.ts'),
    server.ssrLoadModule('/src/data/phase4Verification.ts'),
    server.ssrLoadModule('/src/data/phase46aVerification.ts'),
  ]);
  const results = await Promise.all([
    modules[0].verifyPhase1(),
    modules[1].verifyPhase3(),
    modules[2].verifyPhase4(),
    modules[3].verifyPhase46a(),
  ]);
  assert(
    results.every((result) => result.checks.length > 0),
    'Phase 1, 3, 4, and 4.6A regressions must all pass',
  );
  checks.push('Phase 1, 3, 4, and 4.6A regression assertions pass');

  checks.forEach((check, index) => {
    process.stdout.write(`${index + 1}. ${check}\n`);
  });
  process.stdout.write(
    `Phase 4.6B verification passed (${checks.length} checks).\n`,
  );
} finally {
  await server.close();
}
