import fs from 'node:fs';
import path from 'node:path';
import { createServer } from 'vite';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const checks = [];

function assert(condition, message) {
  if (!condition) {
    throw new Error(`Factual feedback verification failed: ${message}`);
  }
  checks.push(message);
}

const appSource = read('src/features/factualFeedback/FactualFeedbackApp.tsx');
const sheetSource = read(
  'src/features/factualFeedback/components/FeedbackBottomSheet.tsx',
);
const styleSource = read(
  'src/features/factualFeedback/factual-feedback.css',
);

assert(
  appSource.includes("from '../../state/DemoProvider'") &&
    !appSource.includes('mockTasks') &&
    !appSource.includes('mockFeedback'),
  'feature pages use the shared Demo Provider without page-owned mock data',
);
assert(
  styleSource.startsWith('@import "./tokens.css";') &&
    styleSource.includes('var(--page-background)') &&
    styleSource.includes('var(--color-button-primary)'),
  'feature styles consume the supplied design tokens',
);
assert(
  sheetSource.includes('validateFeedback') &&
    sheetSource.includes('scrollIntoView') &&
    sheetSource.includes('useAutoSavedDraft'),
  'field validation, first-error scrolling, and automatic draft saving are wired',
);
assert(
  sheetSource.includes('requestIdRef') &&
    sheetSource.includes('submitting'),
  'submission uses request de-duplication and repeated-click protection',
);

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const { createDemoRepository } = await server.ssrLoadModule(
    '/src/data/demoRepository.ts',
  );
  const repository = createDemoRepository({ delayMs: 0 });
  const before = repository.getViewSnapshot();
  assert(before.ok, 'teacher snapshot loads');
  const initialCount = before.ok ? before.data.observations.length : 0;

  repository.simulateNextWriteFailure();
  const failed = await repository.submitObservation('task-001-pending', {
    requestId: 'feedback-flow-failure',
    observedAt: '2026-07-17T09:00:00+08:00',
    scene: '协作任务指定观察场景',
    facts: '7月17日上午课堂提问时，该生连续两次没有回应，课后能够简短回应老师询问。',
    immediateSafetyConcern: false,
  });
  const afterFailure = repository.getViewSnapshot();
  assert(
    !failed.ok &&
      afterFailure.ok &&
      afterFailure.data.observations.length === initialCount,
    'failed submission keeps records unchanged',
  );

  const submitted = await repository.submitObservation('task-001-pending', {
    requestId: 'feedback-flow-success',
    observedAt: '2026-07-17T09:00:00+08:00',
    scene: '协作任务指定观察场景',
    facts: '7月17日上午课堂提问时，该生连续两次没有回应，课后能够简短回应老师询问。',
    immediateSafetyConcern: false,
  });
  const afterSubmit = repository.getViewSnapshot();
  assert(
    submitted.ok &&
      afterSubmit.ok &&
      afterSubmit.data.observations.length === initialCount + 1 &&
      afterSubmit.data.tasks.find((task) => task.id === 'task-001-pending')
        ?.status === 'submitted',
    'successful submission appends one record and updates the task',
  );

  const duplicate = await repository.submitObservation('task-001-pending', {
    requestId: 'feedback-flow-success',
    observedAt: '2026-07-17T09:00:00+08:00',
    scene: '协作任务指定观察场景',
    facts: '7月17日上午课堂提问时，该生连续两次没有回应，课后能够简短回应老师询问。',
    immediateSafetyConcern: false,
  });
  assert(!duplicate.ok, 'duplicate request does not create another record');

  repository.switchDemoRole('psychologist');
  const beforeViewed = repository.getTaskById('task-004-submitted');
  const viewed = await repository.markFeedbackViewed('task-004-submitted');
  const afterViewed = repository.getTaskById('task-004-submitted');
  assert(
    beforeViewed.ok &&
      viewed.ok &&
      Boolean(viewed.data.viewedAt) &&
      afterViewed.ok &&
      beforeViewed.data.status === afterViewed.data.status,
    'psychologist view confirmation adds a trace without changing task status',
  );
} finally {
  await server.close();
}

console.log(`Factual feedback verification passed (${checks.length} checks).`);
