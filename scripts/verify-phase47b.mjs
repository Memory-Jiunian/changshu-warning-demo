import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Phase 4.7B verification failed: ${message}`);
  }
  checks.push(message);
}

const homeSource = read('src/pages/TeacherHomePage.tsx');
const listSource = read('src/pages/TeacherTaskListPage.tsx');
const homeTaskSource = read('src/components/business/HomeTaskCard.tsx');
const taskCardSource = read('src/components/business/TeacherTaskCard.tsx');
const detailSource = read('src/pages/TeacherTaskDetailPage.tsx');
const feedbackSource = read('src/pages/ObservationFeedbackPage.tsx');
const radioSource = read('src/components/ui/RadioGroup.tsx');
const textareaSource = read('src/components/ui/Textarea.tsx');
const cssSource = read('src/app/mvp.css');
const uiCssSource = read('src/components/ui/ui.css');

assert(
  homeSource.includes('mvp-v21-action-notice') &&
    homeSource.includes('mvp-v21-stat-strip') &&
    homeTaskSource.includes("density === 'compact'"),
  'teacher home uses a compact notice, continuous task rows, and one stat strip',
);

assert(
  !homeSource.includes('RetestReminderCard') &&
    homeSource.includes('mvp-v21-retest-row') &&
    homeSource.includes('mvp-v21-report-row'),
  'retest and report entry points use compact rows',
);

assert(
  listSource.includes('mvp-v21-task-list-surface') &&
    !taskCardSource.includes('<Card') &&
    taskCardSource.includes('mvp-teacher-task-row'),
  'teacher task results use one continuous list surface instead of card stacking',
);

assert(
  (taskCardSource.match(/<TaskStatusBadge/g) ?? []).length === 1,
  'each teacher task row has one primary status badge',
);

assert(
  detailSource.includes('mvp-v21-detail-surface') &&
    detailSource.includes("task.status === 'pending'") &&
    detailSource.includes(".join(' · ')") &&
    detailSource.includes('mvp-v21-focus-text'),
  'pending detail uses one continuous information surface and compact observation focus',
);

assert(
  feedbackSource.includes('variant="chips"') &&
    feedbackSource.includes('mvp-v21-optional-toggle') &&
    feedbackSource.includes('hasOptionalObservationValues(storedDraft?.values)'),
  'feedback form uses compact choices and restores optional disclosure from draft values',
);

assert(
  feedbackSource.includes('autoGrow') &&
    textareaSource.includes('maxAutoGrowHeight') &&
    feedbackSource.includes('rows={4}'),
  'fact textarea keeps its field while using bounded automatic growth',
);

assert(
  feedbackSource.includes('variant="inline"') &&
    feedbackSource.includes('请优先按照学校现有线下应急流程') &&
    feedbackSource.includes('{values.immediateSafetyConcern ? ('),
  'immediate safety choice and conditional strong warning are preserved',
);

const actionBarMatch = feedbackSource.match(/<BottomActionBar>([\s\S]*?)<\/BottomActionBar>/);
assert(
  Boolean(actionBarMatch) &&
    (actionBarMatch[1].match(/<Button/g) ?? []).length === 1 &&
    actionBarMatch[1].includes('提交观察反馈'),
  'feedback fixed action bar contains one primary submit action',
);

assert(
  radioSource.includes("variant?: 'cards' | 'chips' | 'inline'") &&
    uiCssSource.includes('.ui-radio-group--chips .ui-radio-option') &&
    uiCssSource.includes('min-height: 44px'),
  'compact choice chips retain at least 44px touch targets',
);

assert(
  cssSource.includes('.mvp-v2-task-list-page .mvp-v2-filter-chips button span') &&
    cssSource.includes('min-height: 34px') &&
    cssSource.includes('.mvp-home-task-row'),
  'work-density styles separate visible chip height from touch height',
);

for (const source of [homeSource, listSource, detailSource, feedbackSource]) {
  assert(
    !source.includes('../data/demoRepository') && !source.includes('../mockData'),
    'migrated work pages do not introduce page-owned data sources',
  );
}

console.log(`Phase 4.7B verification passed (${checks.length} checks).`);
