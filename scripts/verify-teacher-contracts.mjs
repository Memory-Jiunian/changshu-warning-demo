import { createServer } from 'vite';

const server = await createServer({
  configFile: false,
  appType: 'custom',
  logLevel: 'silent',
  optimizeDeps: { noDiscovery: true },
  server: { middlewareMode: true },
});

try {
  const module = await server.ssrLoadModule(
    '/src/data/teacherContractVerification.ts',
  );
  const result = await module.verifyTeacherContracts();
  result.checks.forEach((check, index) => {
    process.stdout.write(`${index + 1}. ${check}\n`);
  });
  process.stdout.write(
    `Teacher contract verification passed (${result.checks.length} checks).\n`,
  );
} finally {
  await server.close();
}
