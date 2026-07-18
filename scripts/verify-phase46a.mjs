import { readFile } from 'node:fs/promises';
import { createServer } from 'vite';

function assert(condition, message) {
  if (!condition) throw new Error(`Phase 4.6A verification failed: ${message}`);
}

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), 'utf8');

const [
  appSource,
  observationSource,
  reportSource,
  taskDetailSource,
  taskStatusBadgeSource,
  deadlineBadgeSource,
  roleHeaderSource,
  profileSource,
  placeholderSource,
] = await Promise.all([
  read('src/app/MvpApp.tsx'),
  read('src/pages/ObservationFeedbackPage.tsx'),
  read('src/pages/AbnormalReportPage.tsx'),
  read('src/pages/TeacherTaskDetailPage.tsx'),
  read('src/components/business/TaskStatusBadge.tsx'),
  read('src/components/business/DeadlineBadge.tsx'),
  read('src/components/layout/RoleHeader.tsx'),
  read('src/pages/ProfilePage.tsx'),
  read('src/pages/PlaceholderPage.tsx'),
]);

const checks = [];

assert(
  observationSource.includes('useAutoSavedDraft') &&
    observationSource.includes('<DraftSaveStatus'),
  'observation form must use automatic draft saving and expose save status',
);
checks.push('observation form uses automatic draft saving');

assert(
  reportSource.includes('useAutoSavedDraft') &&
    reportSource.includes('<DraftSaveStatus'),
  'abnormal report form must use automatic draft saving and expose save status',
);
checks.push('abnormal report form uses automatic draft saving');

assert(
  !observationSource.includes('保存草稿') &&
    !reportSource.includes('保存草稿'),
  'manual save draft controls must be removed from both forms',
);
checks.push('manual save draft buttons and prompts are absent');

assert(
  appSource.includes('requestNavigation') &&
    appSource.includes('onNavigationGuardChange={updateNavigationGuard}') &&
    observationSource.includes('onClick={onBack}') &&
    reportSource.includes('onClick={onBack}'),
  'page header back actions must register with the central navigation guard',
);
checks.push('page header back actions share the central navigation guard');

assert(
  appSource.includes(
    '<AppShell role={selectedRole} activeNavigation={activeNavigation} onNavigate={navigate}>',
  ) &&
    appSource.includes(
      'const navigate = useCallback(',
    ),
  'bottom navigation must use the same guarded navigate function',
);
checks.push('bottom navigation uses the same guarded navigate function');

assert(
  appSource.includes("window.addEventListener('hashchange', handleHashChange)") &&
    appSource.includes('navigationGuardRef.current?.dirty') &&
    appSource.includes('replaceHash(acceptedHashRef.current)'),
  'browser back and direct hash changes must be intercepted by the central guard',
);
checks.push('browser back and direct hash changes use the central guard');

assert(
  appSource.includes('saveStatus ===') &&
    appSource.includes('草稿尚未保存') &&
    appSource.includes('重试保存') &&
    appSource.includes('舍弃并离开'),
  'failed draft save must block silent leave and expose retry or explicit discard',
);
checks.push('draft failure blocks silent leave and offers retry or explicit discard');

assert(
  observationSource.includes('removeObservationDraft') &&
    reportSource.includes('removeAbnormalReportDraft'),
  'formal submission must clear the corresponding draft namespace',
);
checks.push('formal submission clears the corresponding draft');

assert(
  taskStatusBadgeSource.includes("task.status === 'cancelled'") &&
    taskStatusBadgeSource.includes("? 'neutral'") &&
    deadlineBadgeSource.includes("task.status === 'cancelled'") &&
    deadlineBadgeSource.includes("? 'neutral'"),
  'cancelled status and deadline badges must use neutral variants',
);
checks.push('cancelled task badges use neutral presentation');

const visibleProductSources = [
  appSource,
  observationSource,
  reportSource,
  taskDetailSource,
  roleHeaderSource,
  profileSource,
  placeholderSource,
].join('\n');
const forbiddenVisiblePhrases = [
  '统一 Repository',
  'Demo Clock',
  'Demo 时间',
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4',
  'Phase 5',
  'Phase 6',
  'Phase 7',
  '后续阶段',
  '筛选意图',
  '草稿混用',
  '可写真值',
  '自动断言',
  '我的演示信息',
  'legacy 演示',
];
assert(
  forbiddenVisiblePhrases.every(
    (phrase) => !visibleProductSources.includes(phrase),
  ),
  'product UI source must not contain visible development terminology',
);
checks.push('product UI source is free of audited development terminology');

assert(
  !taskDetailSource.includes('正在记录已读') &&
    !taskDetailSource.includes('已同步已读') &&
    !taskDetailSource.includes('<dt>阅读状态</dt>'),
  'normal task detail must not expose technical read tracking',
);
checks.push('normal task detail hides technical read tracking state');

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const phase46aModule = await server.ssrLoadModule(
    '/src/data/phase46aVerification.ts',
  );
  const phase46aResult = await phase46aModule.verifyPhase46a();
  checks.push(...phase46aResult.checks);

  const phase1Module = await server.ssrLoadModule(
    '/src/data/phase1Verification.ts',
  );
  const phase3Module = await server.ssrLoadModule(
    '/src/data/phase3Verification.ts',
  );
  const phase4Module = await server.ssrLoadModule(
    '/src/data/phase4Verification.ts',
  );
  const [phase1Result, phase3Result, phase4Result] = await Promise.all([
    phase1Module.verifyPhase1(),
    phase3Module.verifyPhase3(),
    phase4Module.verifyPhase4(),
  ]);
  assert(
    phase1Result.checks.length > 0 &&
      phase3Result.checks.length > 0 &&
      phase4Result.checks.length > 0,
    'Phase 1, 3, and 4 regressions must all pass',
  );
  checks.push('Phase 1, Phase 3, and Phase 4 regression assertions pass');

  checks.forEach((check, index) => {
    process.stdout.write(`${index + 1}. ${check}\n`);
  });
  process.stdout.write(
    `Phase 4.6A verification passed (${checks.length} checks).\n`,
  );
} finally {
  await server.close();
}
