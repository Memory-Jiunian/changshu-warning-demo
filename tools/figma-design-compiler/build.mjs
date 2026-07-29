import { copyFile, mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const pluginRoot = dirname(fileURLToPath(import.meta.url));
const distDir = join(pluginRoot, 'dist');

await mkdir(distDir, { recursive: true });

await build({
  absWorkingDir: pluginRoot,
  entryPoints: [join(pluginRoot, 'src', 'code.ts')],
  bundle: true,
  outfile: join(distDir, 'code.js'),
  format: 'iife',
  platform: 'browser',
  target: 'es2020',
  logLevel: 'info',
});

await copyFile(join(pluginRoot, 'src', 'ui.html'), join(distDir, 'ui.html'));
