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
const brandToken = tokens.tokens.find((token) => token.id === 'color.brand.primary');
const radiusToken = tokens.tokens.find((token) => token.id === 'radius.md');

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
assert(brandToken?.type === 'COLOR', 'color.brand.primary must be a COLOR token');
assert(radiusToken?.type === 'FLOAT', 'radius.md must be a FLOAT token');

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
const screenChildIds = new Set();

for (const child of screen.children) {
  assert(
    typeof child.id === 'string' && child.id.length > 0,
    'every Screen child must have a stable id',
  );
  assert(!screenChildIds.has(child.id), `duplicate Screen child id: ${child.id}`);
  screenChildIds.add(child.id);

  if (child.type === 'TEXT') {
    assert(
      ['TITLE', 'BODY'].includes(child.style) && typeof child.text === 'string',
      `invalid Screen TEXT child: ${child.id}`,
    );
    assert(
      Object.keys(child).every((key) =>
        ['id', 'type', 'style', 'text'].includes(key),
      ),
      `Screen TEXT child contains unsupported fields: ${child.id}`,
    );
    continue;
  }

  const definition = componentById.get(child.componentId);
  assert(definition, `screen references unknown component id: ${child.componentId}`);
  assert(
    Object.keys(child).every((key) =>
      ['id', 'type', 'componentId', 'variant'].includes(key),
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
  screenChildIds.size === screen.children.length,
  'Screen child stable IDs must be unique',
);

await access(new URL(manifest.main, pluginRoot));
await access(new URL(manifest.ui, pluginRoot));

for (const apiCall of [
  'getLocalVariableCollectionsAsync',
  'getLocalVariablesAsync',
  'createVariableCollection',
  'createVariable',
  'setValueForMode',
  'createComponent',
  'combineAsVariants',
  'createInstance',
  'getMainComponentAsync',
  'setProperties',
  'insertChild',
  'setSharedPluginData',
  'getSharedPluginData',
  'setBoundVariableForPaint',
]) {
  assert(bundle.includes(apiCall), `built plugin is missing ${apiCall}`);
}

assert(ui.includes('Sync Design System'), 'plugin UI is missing Sync Design System');
assert(ui.includes('Sync Pilot Screen'), 'plugin UI is missing Sync Pilot Screen');
assert(
  ui.includes('data-action="sync-pilot-screen"'),
  'Sync Pilot Screen must use the sync-pilot-screen action',
);
assert(ui.includes('schema-summary'), 'plugin UI is missing the bundled schema summary');
assert(
  ui.includes('message.summary.brand') && ui.includes('message.summary.radius'),
  'plugin UI must render Brand and Radius from the main-thread summary message',
);
assert(
  pluginSource.includes("requireColorToken('color.brand.primary').value") &&
    pluginSource.includes("requireFloatToken('radius.md').value"),
  'main-thread schema summary must read Brand and Radius from tokenSchema',
);
assert(
  bundle.includes(brandToken.value),
  `built plugin is missing current bundled Brand value: ${brandToken.value}`,
);
assert(
  bundle.includes(String(radiusToken.value)),
  `built plugin is missing current bundled Radius value: ${radiusToken.value}`,
);
assert(
  pluginSource.includes('Synced: brand=${summary.brand}, radius=${summary.radius}'),
  'Sync notification must report the values from the loaded schema summary',
);

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

const syncVariablesStart = pluginSource.indexOf('async function syncVariables');
const collectionResolverStart = pluginSource.indexOf('function resolveDesignSystemCollection');
const syncDesignSystemStart = pluginSource.indexOf('async function syncDesignSystem');
const syncComponentsStart = pluginSource.indexOf('function syncComponents');
const syncComponentsEnd = pluginSource.indexOf('function getComponentDefinition');
assert(
  syncVariablesStart >= 0 &&
    collectionResolverStart > syncVariablesStart &&
    syncDesignSystemStart > collectionResolverStart &&
    syncComponentsStart > syncDesignSystemStart &&
    syncComponentsEnd > syncComponentsStart,
  'Pilot 03A sync source boundaries not found',
);

const syncVariablesSource = pluginSource.slice(
  syncVariablesStart,
  collectionResolverStart,
);
const collectionResolverSource = pluginSource.slice(
  collectionResolverStart,
  syncDesignSystemStart,
);
const syncComponentsSource = pluginSource.slice(
  syncComponentsStart,
  syncComponentsEnd,
);

assert(
  /if \(!variable\)[\s\S]*figma\.variables\.createVariable\(/.test(syncVariablesSource),
  'Variable CREATE must be guarded by a missing-variable branch',
);
assert(
  syncVariablesSource.includes('variable.setValueForMode('),
  'Variable UPDATE must set the existing value for the collection mode',
);
assert(
  syncVariablesSource.includes('Duplicate variable ID'),
  'Variable identity conflicts must fail explicitly',
);
assert(
  /if \(!collection\)[\s\S]*figma\.variables\.createVariableCollection\(/.test(
    collectionResolverSource,
  ),
  'Variable Collection CREATE must be guarded by a missing-collection branch',
);
assert(
  pluginSource.match(/figma\.variables\.createVariableCollection\(/g)?.length === 1,
  'Variable Collection must not have an unconditional second creation path',
);

for (const component of [
  ['Button', 'existingButton', 'updateButtonSet', 'createButtonSet'],
  ['Badge', 'existingBadge', 'updateBadgeSet', 'createBadgeSet'],
  ['Card', 'existingCard', 'updateCard', 'createCard'],
]) {
  const [name, existing, update, create] = component;
  assert(
    syncComponentsSource.includes(`if (${existing})`) &&
      syncComponentsSource.includes(`${update}(`) &&
      syncComponentsSource.includes(`${create}(`),
    `${name} sync must contain explicit CREATE and UPDATE branches`,
  );
}
assert(
  !syncComponentsSource.includes('figma.createComponent('),
  'Component UPDATE path must not create replacement components',
);
assert(
  pluginSource.includes('Duplicate component ID'),
  'Duplicate component IDs must fail explicitly',
);
assert(
  !syncComponentsSource.includes('.remove()'),
  'Pilot 03A must not delete and rebuild existing components',
);
assert(
  !pluginSource.includes("solidPaint('#000000')"),
  'Variable paint binding must not use a fixed black fallback',
);
assert(
  !pluginSource.includes(
    "if (boundFillVariables.some((alias) => alias.id === variable.id))",
  ),
  'A matching node-level Variable binding must not skip canonical paint repair',
);
assert(
  pluginSource.includes('figma.util.solidPaint(tokenHex, existingPaint)'),
  'Variable paint repair must canonicalize color while preserving existing paint overrides',
);
assert(
  pluginSource.includes('figma.util.solidPaint(tokenHex)') &&
    pluginSource.includes('const token = requireColorToken(tokenId)'),
  'Variable paint CREATE fallback must come from the bundled token schema',
);
assert(
  pluginSource.includes('paint.boundVariables?.color?.id === variable.id'),
  'Runtime validation must check the specific SOLID paint color binding',
);
assert(
  pluginSource.includes('base paint does not match') &&
    pluginSource.includes('colorsMatch(boundSolidPaints[0].color, expected)'),
  'Runtime validation must compare the SOLID base color with the token schema',
);
assert(
  pluginSource.includes('variable.resolveForConsumer(node)'),
  'Visual idempotency must validate the resolved Variable value for each consumer',
);
for (const runtimeBindingCheck of [
  '`Button Type=${type}, Size=${size}`',
  '`Button Type=${type}, Size=${size} text`',
  "'Pending Badge'",
  "'Card'",
  "'Card title'",
  "'Card body'",
]) {
  assert(
    pluginSource.includes(runtimeBindingCheck),
    `Visual idempotency is missing runtime binding check: ${runtimeBindingCheck}`,
  );
}
assert(
  pluginSource.includes('validateStructuralIdempotency(') &&
    bundle.includes('Structural idempotency failed'),
  'Sync must verify structural idempotency after CREATE/UPDATE',
);
assert(
  pluginSource.includes('validateVisualBindingIdempotency(') &&
    bundle.includes('Visual idempotency failed'),
  'Sync must verify visual/binding idempotency after CREATE/UPDATE',
);

const screenSyncStart = pluginSource.indexOf('async function syncPilotScreen');
const screenLookupStart = pluginSource.indexOf('async function findScreenByStableId');
const screenChildrenSyncStart = pluginSource.indexOf('async function syncScreenChildren');
const managedChildrenCollectorStart = pluginSource.indexOf(
  'function collectManagedScreenChildren',
);
const managedChildCreateStart = pluginSource.indexOf(
  'function createManagedScreenChild',
);
const managedChildUpdateStart = pluginSource.indexOf(
  'async function updateManagedScreenChild',
);
const screenTextConfigureStart = pluginSource.indexOf('function configureScreenText');
const componentLookupStart = pluginSource.indexOf('async function findComponentsByStableId');
assert(
  screenSyncStart >= 0 &&
    screenLookupStart > screenSyncStart &&
    screenChildrenSyncStart > screenLookupStart &&
    managedChildrenCollectorStart > screenChildrenSyncStart &&
    managedChildCreateStart > managedChildrenCollectorStart &&
    managedChildUpdateStart > managedChildCreateStart &&
    screenTextConfigureStart > managedChildUpdateStart &&
    componentLookupStart > screenTextConfigureStart,
  'Pilot 03B Screen sync source boundaries not found',
);

const screenSyncSource = pluginSource.slice(screenSyncStart, screenLookupStart);
const screenChildrenSyncSource = pluginSource.slice(
  screenChildrenSyncStart,
  managedChildrenCollectorStart,
);
const managedChildrenCollectorSource = pluginSource.slice(
  managedChildrenCollectorStart,
  managedChildCreateStart,
);
const managedChildCreateSource = pluginSource.slice(
  managedChildCreateStart,
  managedChildUpdateStart,
);
const managedChildUpdateSource = pluginSource.slice(
  managedChildUpdateStart,
  screenTextConfigureStart,
);
const pilotScreenSource = pluginSource.slice(screenSyncStart, componentLookupStart);

assert(
  pluginSource.includes("const SCREEN_ID_KEY = 'screenId'") &&
    pluginSource.includes("const SCREEN_CHILD_ID_KEY = 'screenChildId'"),
  'Pilot 03B must define screenId and screenChildId plugin data keys',
);
assert(
  pluginSource.includes('Duplicate screen child schema ID') &&
    screen.children.every((child) => screenChildIds.has(child.id)),
  'Runtime and static schema validation must require unique Screen child IDs',
);
assert(
  pilotScreenSource.includes('SCREEN_ID_KEY') &&
    pilotScreenSource.includes('SCREEN_CHILD_ID_KEY') &&
    pilotScreenSource.includes('setSharedPluginData(') &&
    pilotScreenSource.includes('getSharedPluginData('),
  'Screen and managed children must read and write stable plugin data identities',
);
assert(
  /if \(!screen\)[\s\S]*figma\.createFrame\(\)/.test(screenSyncSource),
  'Screen CREATE must be guarded by a missing-Screen branch',
);
assert(
  /if \(node\)[\s\S]*updateManagedScreenChild\([\s\S]*else[\s\S]*createManagedScreenChild\(/.test(
    screenChildrenSyncSource,
  ),
  'Screen child CREATE must be guarded by a missing-child branch',
);
assert(
  managedChildUpdateSource.includes("node.type !== 'TEXT'") &&
    managedChildUpdateSource.includes('configureScreenText(node, child)') &&
    !managedChildUpdateSource.includes('figma.createText()'),
  'TEXT UPDATE must reuse the existing TextNode',
);
assert(
  managedChildUpdateSource.includes("node.type !== 'INSTANCE'") &&
    managedChildUpdateSource.includes('node.setProperties(child.variant ?? {})') &&
    !managedChildUpdateSource.includes('.createInstance()'),
  'INSTANCE UPDATE must reuse the existing InstanceNode and update Variants',
);
assert(
  managedChildCreateSource.includes('.createInstance()') ||
    pilotScreenSource.includes('createScreenInstance(component, child)'),
  'Screen child CREATE must create native Instances',
);
assert(
  screenChildrenSyncSource.includes('for (const [childId, node] of existingChildren)') &&
    screenChildrenSyncSource.includes('node.remove()') &&
    managedChildrenCollectorSource.includes('SCREEN_CHILD_ID_KEY') &&
    pluginSource.match(/\.remove\(\)/g)?.length === 1,
  'Screen REMOVE must only process managed direct children',
);
assert(
  pilotScreenSource.includes('Duplicate screen ID:') &&
    pilotScreenSource.includes('Duplicate screen child ID:'),
  'Screen and Screen child duplicate identities must fail explicitly',
);
assert(
  pilotScreenSource.includes('Screen child component identity mismatch') &&
    pilotScreenSource.includes('getMainComponentAsync()'),
  'Component identity mismatch must fail before Instance Variant update',
);
assert(
  screenChildrenSyncSource.includes('existingNodeIds') &&
    screenChildrenSyncSource.includes('Screen child node identity changed during UPDATE'),
  'Screen child UPDATE must protect existing node identity',
);
assert(
  screenSyncSource.includes('existingScreenNodeId') &&
    screenSyncSource.includes('Screen Frame node identity changed during UPDATE'),
  'Screen UPDATE must protect the existing Frame node identity',
);
assert(
  screenChildrenSyncSource.includes('screen.insertChild(index, node)'),
  'Managed Screen children must be reordered in Schema order without recreation',
);
assert(
  screenChildrenSyncSource.includes('unmanagedOrderBefore') &&
    screenChildrenSyncSource.includes('unmanagedOrderAfter'),
  'Unmanaged direct children must be retained in stable relative order',
);
assert(
  !pilotScreenSource.includes('figma.createComponent('),
  'Screen sync must not create fallback components',
);

for (const runtimeCheck of [
  'must contain exactly',
  'variants overlap',
]) {
  assert(bundle.includes(runtimeCheck), `built plugin is missing runtime check: ${runtimeCheck}`);
}

console.log(
  `Pilot 03B verification passed: stable Screen/direct-child sync, guarded CREATE/UPDATE/REMOVE, in-place Text/Instance updates, identity protection, and Pilot 03A checks retained.`,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
