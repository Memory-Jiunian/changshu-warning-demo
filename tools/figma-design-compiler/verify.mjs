import { access, readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const pluginRoot = new URL('./', import.meta.url);
const tokens = JSON.parse(await readFile(new URL('design-system/tokens.json', root), 'utf8'));
const components = JSON.parse(await readFile(new URL('design-system/components.json', root), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('manifest.json', pluginRoot), 'utf8'));
const bundle = await readFile(new URL('dist/code.js', pluginRoot), 'utf8');

const expectedTokens = new Set([
  'color.brand.primary',
  'color.text.primary',
  'color.bg.surface',
  'spacing.md',
  'radius.md',
]);

assert(tokens.tokens.length === 5, 'tokens.json must contain exactly five tokens');
assert(
  tokens.tokens.every((token) => expectedTokens.delete(token.name)) && expectedTokens.size === 0,
  'tokens.json does not contain the exact Pilot 01 token set',
);

const button = components.components.find((component) => component.name === 'Button');
const badge = components.components.find((component) => component.name === 'Badge');
const card = components.components.find((component) => component.name === 'Card');

assert(button?.nodeType === 'COMPONENT_SET', 'Button must be a component set');
assert(button?.variants?.length === 4, 'Button must contain four variants');
assert(badge?.nodeType === 'COMPONENT_SET', 'Badge must be a component set');
assert(badge?.variants?.length === 2, 'Badge must contain two variants');
assert(card?.nodeType === 'COMPONENT', 'Card must be a component');

await access(new URL(manifest.main, pluginRoot));
await access(new URL(manifest.ui, pluginRoot));

for (const apiCall of [
  'createVariableCollection',
  'createVariable',
  'createComponent',
  'combineAsVariants',
  'setBoundVariableForPaint',
]) {
  assert(bundle.includes(apiCall), `built plugin is missing ${apiCall}`);
}

console.log('Pilot 01 verification passed: schemas, manifest artifacts, and native API calls.');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
