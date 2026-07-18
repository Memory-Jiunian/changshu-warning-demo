import { readFile } from 'node:fs/promises';

function assert(condition, message) {
  if (!condition) throw new Error(`Phase 4.7A verification failed: ${message}`);
}

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [
  appSource,
  shellSource,
  homeSource,
  listSource,
  taskCardSource,
  detailSource,
  feedbackSource,
  selectorSource,
  appCss,
] = await Promise.all([
  read('src/app/MvpApp.tsx'),
  read('src/components/layout/AppShell.tsx'),
  read('src/pages/TeacherHomePage.tsx'),
  read('src/pages/TeacherTaskListPage.tsx'),
  read('src/components/business/TeacherTaskCard.tsx'),
  read('src/pages/TeacherTaskDetailPage.tsx'),
  read('src/pages/ObservationFeedbackPage.tsx'),
  read('src/selectors/taskSelectors.ts'),
  read('src/app/mvp.css'),
]);

const checks = [];

assert(
  shellSource.includes('showBottomNavigation = true') &&
    shellSource.includes('{showBottomNavigation ? (') &&
    appSource.includes("route.name !== 'teacherTaskDetail'") &&
    appSource.includes("route.name !== 'teacherFeedback'"),
  'route shell must explicitly hide global navigation on detail and feedback pages',
);
checks.push('route shell controls bottom navigation for primary and deeper pages');

assert(
  homeSource.includes('density="featured"') &&
    homeSource.includes('density="compact"') &&
    homeSource.includes('recentTasks.slice(1, 3)') &&
    !homeSource.includes('最近提交'),
  'teacher home must feature one priority task and at most two compact tasks',
);
checks.push('teacher home uses one featured task and two compact follow-ups');

assert(
  listSource.includes("normalizeTeacherTaskView(rawView)") &&
    listSource.includes("'action', 'history'") &&
    listSource.includes('待处理') &&
    listSource.includes('历史记录') &&
    selectorSource.includes('filterTeacherTasksForView'),
  'task list must default to centralized action/history views',
);
checks.push('task list separates action items from history through selectors');

assert(
  selectorSource.includes("['pending', 'returned'].includes(task.status)") &&
    selectorSource.includes("['submitted', 'completed', 'cancelled'].includes(task.status)") &&
    !selectorSource.includes("status: 'overdue'"),
  'task views must preserve domain statuses and derive overdue',
);
checks.push('task views preserve canonical statuses and derived overdue state');

assert(
  (taskCardSource.match(/<TaskStatusBadge\b/g) ?? []).length === 1 &&
    !taskCardSource.includes('<Badge') &&
    !taskCardSource.includes('<DeadlineBadge'),
  'task card must expose one colored status badge and plain metadata',
);
checks.push('task cards render one colored status badge');

const pendingDetailStart = detailSource.indexOf("if (task.status === 'pending')");
const legacyDetailStart = detailSource.indexOf(
  '  return (\n    <div className={`mvp-page mvp-task-detail-page',
  pendingDetailStart,
);
const pendingDetailSource = detailSource.slice(pendingDetailStart, legacyDetailStart);
assert(
  pendingDetailStart >= 0 &&
    pendingDetailSource.includes('mvp-v2-task-detail-page') &&
    pendingDetailSource.includes('records.length > 0 ?') &&
    !pendingDetailSource.includes('尚未提交观察反馈'),
  'pending detail must use V2 hierarchy and omit empty feedback history',
);
checks.push('pending detail hides empty history and uses the V2 hierarchy');

assert(
  feedbackSource.includes('mvp-v2-form-surface') &&
    feedbackSource.includes('mvp-v2-form-group--primary') &&
    feedbackSource.includes('<details className="mvp-disclosure mvp-disclosure--compact">') &&
    (feedbackSource.match(/<BottomActionBar>/g) ?? []).length === 1,
  'feedback page must use flat field groups and one fixed action region',
);
checks.push('observation feedback uses flat groups and one action region');

assert(
  appCss.includes('--mvp-v2-page-bg: #f4f5f7') &&
    appCss.includes('.mvp-v2-page {') &&
    appCss.includes('background: var(--mvp-v2-page-bg)') &&
    appCss.includes('.mvp-v2-filter-chips {\n  display: flex;\n  flex-wrap: wrap;'),
  'V2 pages must use a neutral background and fully visible wrapping filters',
);
checks.push('V2 uses neutral surfaces and wrapping filters');

assert(
  appCss.includes('.mvp-app-shell.has-no-bottom-navigation .mvp-bottom-action-bar') &&
    appCss.includes('.mvp-v2-task-detail-page.has-bottom-action') &&
    appCss.includes('.mvp-v2-feedback-page'),
  'V2 detail and form action bars must account for hidden global navigation',
);
checks.push('fixed action bars occupy the navigation-free bottom edge');

assert(
  !homeSource.includes('../data/') &&
    !listSource.includes('../data/') &&
    !detailSource.includes('../data/mock') &&
    !feedbackSource.includes('../data/mock'),
  'V2 pages must continue using Provider and Repository truth',
);
checks.push('V2 pages do not introduce page-specific mock truth');

checks.forEach((check, index) => {
  console.log(`${index + 1}. ${check}`);
});
console.log(`Phase 4.7A verification passed (${checks.length} checks).`);
