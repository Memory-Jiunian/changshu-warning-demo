import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const module = await server.ssrLoadModule('/src/data/gradeDirectorVerification.ts');
  const result = await module.verifyGradeDirector();
  result.checks.forEach((check, index) => process.stdout.write(`${index + 1}. ${check}\n`));
  process.stdout.write(`Grade Director verification passed (${result.checks.length} checks).\n`);
} finally {
  await server.close();
}
