import { createServer } from 'vite';

const server = await createServer({ configFile: false, appType: 'custom', logLevel: 'silent', optimizeDeps: { noDiscovery: true }, server: { middlewareMode: true } });
try {
  const module = await server.ssrLoadModule('/src/data/principalVerification.ts');
  const result = module.verifyPrincipal();
  result.checks.forEach((check, index) => process.stdout.write(`${index + 1}. ${check}\n`));
  process.stdout.write(`Principal verification passed (${result.checks.length} checks).\n`);
} finally {
  await server.close();
}
