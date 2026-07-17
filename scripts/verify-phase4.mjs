import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const phase1Module = await server.ssrLoadModule('/src/data/phase1Verification.ts');
  const phase1Result = await phase1Module.verifyPhase1();
  process.stdout.write(`Phase 1 regression verification passed (${phase1Result.checks.length} checks).\n`);

  const phase3Module = await server.ssrLoadModule('/src/data/phase3Verification.ts');
  const phase3Result = await phase3Module.verifyPhase3();
  process.stdout.write(`Phase 3 regression verification passed (${phase3Result.checks.length} checks).\n`);

  const phase4Module = await server.ssrLoadModule('/src/data/phase4Verification.ts');
  const result = await phase4Module.verifyPhase4();
  result.checks.forEach((check, index) => {
    process.stdout.write(`${index + 1}. ${check}\n`);
  });
  process.stdout.write(`Phase 4 verification passed (${result.checks.length} checks).\n`);
} finally {
  await server.close();
}
