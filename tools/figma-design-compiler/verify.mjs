import { access, readFile } from 'node:fs/promises';

const root = new URL('../../', import.meta.url);
const pluginRoot = new URL('./', import.meta.url);
const tokens = JSON.parse(await readFile(new URL('design-system/tokens.json', root), 'utf8'));
const components = JSON.parse(await readFile(new URL('design-system/components.json', root), 'utf8'));
const screen = JSON.parse(
  await readFile(new URL('design-system/screens/pending-tasks.json', root), 'utf8'),
);
const manifest = JSON.parse(await readFile(new URL('manifest.json', pluginRoot), 'utf8'));
const bundle = await readFile(new URL('dist/code.js', pluginRoot), 'utf8');
const pluginSource = await readFile(new URL('src/code.ts', pluginRoot), 'utf8');
const ui = await readFile(new URL('src/ui.html', pluginRoot), 'utf8');
const expectedPluginDataNamespace = 'figma_design_compiler';

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

const expectedComponentIds = new Map([
  ['component.button', 'Button'],
  ['component.badge', 'Badge'],
  ['component.card', 'Card'],
]);
const actualComponentIds = new Set();
for (const component of components.components) {
  assert(
    expectedComponentIds.get(component.id) === component.name,
    `invalid component identity: ${component.id} / ${component.name}`,
  );
  assert(!actualComponentIds.has(component.id), `duplicate component id: ${component.id}`);
  actualComponentIds.add(component.id);
}
assert(
  actualComponentIds.size === expectedComponentIds.size,
  'components.json must contain exactly three stable component IDs',
);

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

assert(screen.id === 'screen.pending-tasks-pilot', 'invalid Pilot screen id');
assert(screen.name === 'Pending Tasks Pilot', 'invalid Pilot screen name');
assert(screen.width === 375, 'Pilot screen width must be 375');

const componentById = new Map(
  components.components.map((component) => [component.id, component]),
);
const instanceChildren = screen.children.filter((child) => child.type === 'INSTANCE');
assert(instanceChildren.length === 5, 'Pilot screen must contain exactly five instances');
assert(
  screen.children.filter((child) => child.type === 'TEXT').length === 2,
  'Pilot screen must contain exactly two text nodes',
);

for (const child of instanceChildren) {
  const definition = componentById.get(child.componentId);
  assert(definition, `screen references unknown component id: ${child.componentId}`);
  assert(
    Object.keys(child).every((key) =>
      ['type', 'componentId', 'variant'].includes(key),
    ),
    `screen instance duplicates component visuals: ${child.componentId}`,
  );

  const requestedVariants = child.variant ?? {};
  for (const [property, value] of Object.entries(requestedVariants)) {
    assert(
      definition.variantProperties?.[property]?.includes(value),
      `invalid ${child.componentId} variant request: ${property}=${value}`,
    );
  }
}

assert(
  instanceChildren.filter((child) => child.componentId === 'component.card').length === 2,
  'Pilot screen must contain two Card instances',
);
assert(
  instanceChildren.some(
    (child) =>
      child.componentId === 'component.button' &&
      child.variant?.Type === 'Primary' &&
      child.variant?.Size === 'MD',
  ),
  'Pilot screen must request Button Type=Primary, Size=MD',
);
assert(
  ['Pending', 'Done'].every((status) =>
    instanceChildren.some(
      (child) =>
        child.componentId === 'component.badge' &&
        child.variant?.Status === status,
    ),
  ),
  'Pilot screen must request Pending and Done Badge variants',
);

await access(new URL(manifest.main, pluginRoot));
await access(new URL(manifest.ui, pluginRoot));

for (const apiCall of [
  'createVariableCollection',
  'createVariable',
  'createComponent',
  'combineAsVariants',
  'createInstance',
  'setSharedPluginData',
  'getSharedPluginData',
  'setBoundVariableForPaint',
]) {
  assert(bundle.includes(apiCall), `built plugin is missing ${apiCall}`);
}

assert(ui.includes('Build Pilot Screen'), 'plugin UI is missing Build Pilot Screen');

const namespaceDeclaration = pluginSource.match(
  /const PLUGIN_DATA_NAMESPACE = '([^']+)'/,
);
assert(namespaceDeclaration, 'PLUGIN_DATA_NAMESPACE declaration not found');
assert(
  namespaceDeclaration[1] === expectedPluginDataNamespace,
  `invalid shared plugin data namespace: ${namespaceDeclaration[1]}`,
);
assert(
  !namespaceDeclaration[1].includes('-'),
  'shared plugin data namespace must not contain "-"',
);
assert(
  pluginSource.match(/figma_design_compiler/g)?.length === 1,
  'shared plugin data namespace must be defined only once',
);

for (const method of [
  'setSharedPluginData',
  'getSharedPluginData',
  'getSharedPluginDataKeys',
]) {
  const calls = [
    ...pluginSource.matchAll(
      new RegExp(`\\.${method}\\(\\s*([^,\\n\\)]+)`, 'g'),
    ),
  ];
  if (method !== 'getSharedPluginDataKeys') {
    assert(calls.length > 0, `${method} call not found`);
  }
  for (const call of calls) {
    assert(
      call[1].trim() === 'PLUGIN_DATA_NAMESPACE',
      `${method} must use PLUGIN_DATA_NAMESPACE`,
    );
  }
}

assert(
  bundle.includes(expectedPluginDataNamespace),
  'built plugin is missing the valid shared plugin data namespace',
);

const screenBuilderStart = pluginSource.indexOf('async function buildPilotScreen');
const screenBuilderEnd = pluginSource.indexOf('function requireVariants');
assert(screenBuilderStart >= 0 && screenBuilderEnd > screenBuilderStart, 'screen builder source not found');
const screenBuilderSource = pluginSource.slice(screenBuilderStart, screenBuilderEnd);
assert(screenBuilderSource.includes('.createInstance()'), 'screen builder must create native instances');
assert(
  !screenBuilderSource.includes('figma.createComponent('),
  'screen builder must not create fallback components',
);

for (const runtimeCheck of [
  'must contain exactly',
  'variants overlap',
]) {
  assert(bundle.includes(runtimeCheck), `built plugin is missing runtime check: ${runtimeCheck}`);
}

console.log(
  'Pilot 02 verification passed: stable component IDs, legal screen references and variants, native instance creation, and no component fallback.',
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
