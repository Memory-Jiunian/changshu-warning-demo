import { access, readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const pluginRoot = new URL('./', import.meta.url);
const tokens = JSON.parse(await readFile(new URL('design-system/tokens.json', root), 'utf8'));
const components = JSON.parse(await readFile(new URL('design-system/components.json', root), 'utf8'));
const manifest = JSON.parse(await readFile(new URL('manifest.json', pluginRoot), 'utf8'));
const bundle = await readFile(new URL('dist/code.js', pluginRoot), 'utf8');

const expectedTokens = new Map([
  ['color.brand.primary', 'color/brand/primary'],
  ['color.text.primary', 'color/text/primary'],
  ['color.bg.surface', 'color/bg/surface'],
  ['spacing.md', 'spacing/md'],
  ['radius.md', 'radius/md'],
]);

assert(tokens.tokens.length === 5, 'tokens.json must contain exactly five tokens');

const actualIds = new Set();
const actualNames = new Set();
for (const token of tokens.tokens) {
  assert(expectedTokens.has(token.id), `unexpected token id: ${token.id}`);
  assert(
    token.name === expectedTokens.get(token.id),
    `incorrect Figma variable name for ${token.id}: ${token.name}`,
  );
  assert(!token.name.includes('.'), `Figma variable name contains ".": ${token.name}`);
  assert(!actualIds.has(token.id), `duplicate token id: ${token.id}`);
  assert(!actualNames.has(token.name), `duplicate Figma variable name: ${token.name}`);
  actualIds.add(token.id);
  actualNames.add(token.name);
}
assert(actualIds.size === expectedTokens.size, 'tokens.json is missing a Pilot 01 token id');
assert(actualNames.size === expectedTokens.size, 'tokens.json is missing a Figma variable name');

const button = components.components.find((component) => component.name === 'Button');
const badge = components.components.find((component) => component.name === 'Badge');
const card = components.components.find((component) => component.name === 'Card');

assert(button?.nodeType === 'COMPONENT_SET', 'Button must be a component set');
assert(button?.variants?.length === 4, 'Button must contain four variants');
assert(badge?.nodeType === 'COMPONENT_SET', 'Badge must be a component set');
assert(badge?.variants?.length === 2, 'Badge must contain two variants');
assert(card?.nodeType === 'COMPONENT', 'Card must be a component');

const expectedButtonVariants = new Set([
  'Primary/SM',
  'Primary/MD',
  'Secondary/SM',
  'Secondary/MD',
]);
const actualButtonVariants = new Set(
  button.variants.map((variant) => `${variant.Type}/${variant.Size}`),
);
assert(
  actualButtonVariants.size === expectedButtonVariants.size &&
    [...expectedButtonVariants].every((variant) => actualButtonVariants.has(variant)),
  'Button variants must be the exact 2 x 2 Type/Size matrix',
);

const expectedBadgeVariants = new Set(['Pending', 'Done']);
const actualBadgeVariants = new Set(badge.variants.map((variant) => variant.Status));
assert(
  actualBadgeVariants.size === expectedBadgeVariants.size &&
    [...expectedBadgeVariants].every((variant) => actualBadgeVariants.has(variant)),
  'Badge variants must be exactly Pending and Done',
);

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

for (const runtimeCheck of [
  'must contain exactly',
  'variants overlap',
]) {
  assert(bundle.includes(runtimeCheck), `built plugin is missing runtime check: ${runtimeCheck}`);
}

console.log(
  'Pilot 01 verification passed: exact variant schemas, manifest artifacts, native API calls, and runtime layout guards.',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
