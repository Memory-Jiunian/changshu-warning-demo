import { access, readFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';

const root = new URL('../../', import.meta.url);
const pluginRoot = new URL('./', import.meta.url);
const tasklifyRoot = new URL(
  'design-packages/tasklify-dashboard-v2.1-slice01/',
  root,
);
const tokens = JSON.parse(await readFile(new URL('design-system/tokens.json', root), 'utf8'));
const components = JSON.parse(await readFile(new URL('design-system/components.json', root), 'utf8'));
const screen = JSON.parse(
  await readFile(new URL('design-system/screens/pending-tasks.json', root), 'utf8'),
);
const manifest = JSON.parse(await readFile(new URL('manifest.json', pluginRoot), 'utf8'));
const bundle = await readFile(new URL('dist/code.js', pluginRoot), 'utf8');
const pluginSource = await readFile(new URL('src/code.ts', pluginRoot), 'utf8');
const pluginDataSource = await readFile(
  new URL('src/plugin-data.ts', pluginRoot),
  'utf8',
);
const tasklifySource = await readFile(
  new URL('src/tasklify-slice01.ts', pluginRoot),
  'utf8',
);
const compilerReadme = await readFile(new URL('README.md', pluginRoot), 'utf8');
const ui = await readFile(new URL('src/ui.html', pluginRoot), 'utf8');
const tasklifyManifest = JSON.parse(
  await readFile(new URL('manifest.json', tasklifyRoot), 'utf8'),
);
const tasklifyFoundations = JSON.parse(
  await readFile(new URL('foundations.json', tasklifyRoot), 'utf8'),
);
const tasklifyComponents = JSON.parse(
  await readFile(new URL('components.json', tasklifyRoot), 'utf8'),
);
const tasklifyScreens = JSON.parse(
  await readFile(new URL('screens.json', tasklifyRoot), 'utf8'),
);
const tasklifyReferences = JSON.parse(
  await readFile(new URL('references/index.json', tasklifyRoot), 'utf8'),
);
const tasklifySchemaFiles = [
  'foundations.json',
  'data-contracts.json',
  'components.json',
  'patterns.json',
  'screens.json',
  'interactions.json',
  'decisions.json',
  'implementation-hints.json',
  'code-mapping.json',
  'audit-governance.json',
  'references/index.json',
];
const tasklifySchemaDocuments = await Promise.all(
  tasklifySchemaFiles.map(async (path) => [
    path,
    JSON.parse(await readFile(new URL(path, tasklifyRoot), 'utf8')),
  ]),
);
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

const namespaceDeclaration = pluginDataSource.match(
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
  [pluginSource, pluginDataSource, tasklifySource]
    .join('\n')
    .match(/figma_design_compiler/g)?.length === 1,
  'shared plugin data namespace must be defined only once',
);

for (const method of [
  'setSharedPluginData',
  'getSharedPluginData',
  'getSharedPluginDataKeys',
]) {
  const calls = [
    ...[pluginSource, tasklifySource].join('\n').matchAll(
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
  pluginDataSource.includes("const SCREEN_ID_KEY = 'screenId'") &&
    pluginDataSource.includes("const SCREEN_CHILD_ID_KEY = 'screenChildId'"),
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

const tasklifyRequiredFiles = [
  'manifest.json',
  'foundations.json',
  'data-contracts.json',
  'components.json',
  'patterns.json',
  'screens.json',
  'interactions.json',
  'decisions.json',
  'implementation-hints.json',
  'code-mapping.json',
  'audit-governance.json',
  'review-summary.md',
  'references/index.json',
  'references/images/dashboard-overview.png',
];
for (const relativePath of tasklifyRequiredFiles) {
  await access(new URL(relativePath, tasklifyRoot));
}

assert(
  tasklifyManifest.schemaVersion === '2.1.0',
  'Tasklify manifest schemaVersion must be 2.1.0',
);
assert(
  tasklifyManifest.packageVersion === '0.3.0',
  'Tasklify packageVersion must be 0.3.0',
);
assert(
  tasklifyManifest.designSystem?.id === 'design-system.tasklify.reference',
  'Tasklify Design System ID is incorrect',
);
for (const [path, document] of tasklifySchemaDocuments) {
  assert(
    document.schemaVersion === tasklifyManifest.schemaVersion,
    `${path} schemaVersion must match the Tasklify manifest`,
  );
}
assert(
  tasklifyFoundations.schemaVersion === tasklifyManifest.schemaVersion &&
    tasklifyComponents.schemaVersion === tasklifyManifest.schemaVersion &&
    tasklifyScreens.schemaVersion === tasklifyManifest.schemaVersion &&
    tasklifyReferences.schemaVersion === tasklifyManifest.schemaVersion,
  'Tasklify entrypoint schemaVersions must match the manifest',
);

for (const reference of tasklifyReferences.references.filter(
  (candidate) => candidate.path,
)) {
  const bytes = await readFile(new URL(reference.path, tasklifyRoot));
  const actualChecksum = `sha256:${createHash('sha256').update(bytes).digest('hex')}`;
  assert(
    actualChecksum === reference.checksum,
    `Tasklify reference checksum mismatch: ${reference.id}`,
  );
}

const tasklifyTokens = [
  ...tasklifyFoundations.primitives,
  ...tasklifyFoundations.semantics,
];
const tasklifyTokenById = new Map();
const tasklifyVariableNames = new Set();
for (const token of tasklifyTokens) {
  assert(!tasklifyTokenById.has(token.id), `duplicate Tasklify token ID: ${token.id}`);
  assert(
    !tasklifyVariableNames.has(token.figmaName),
    `duplicate Tasklify Variable name: ${token.figmaName}`,
  );
  assert(
    token.figmaRepresentation?.kind === 'variable',
    `unsupported Tasklify representation: ${token.id}`,
  );
  tasklifyTokenById.set(token.id, token);
  tasklifyVariableNames.add(token.figmaName);
}
for (const token of tasklifyFoundations.semantics) {
  const alias = tasklifyTokenById.get(token.alias);
  assert(alias, `unresolved Tasklify semantic alias: ${token.id} -> ${token.alias}`);
  assert(alias.type === token.type, `Tasklify alias type mismatch: ${token.id}`);
}

const expectedTasklifyComponents = new Set([
  'component.icon',
  'component.button',
  'component.badge',
  'component.stat-card',
  'component.task-card',
]);
const tasklifyComponentIds = new Set();
for (const component of tasklifyComponents.components) {
  assert(
    !tasklifyComponentIds.has(component.id),
    `duplicate Tasklify Component ID: ${component.id}`,
  );
  tasklifyComponentIds.add(component.id);
}
for (const componentId of expectedTasklifyComponents) {
  assert(tasklifyComponentIds.has(componentId), `missing Slice Component: ${componentId}`);
}
const tasklifyIcon = tasklifyComponents.components.find(
  (component) => component.id === 'component.icon',
);
const tasklifyIconNames =
  tasklifyIcon?.properties?.find(
    (property) => property.kind === 'variant' && property.name === 'Name',
  )?.values ?? [];
const tasklifyIconSizes =
  tasklifyIcon?.properties?.find(
    (property) => property.kind === 'variant' && property.name === 'Size',
  )?.values ?? [];
const tasklifyIconTones =
  tasklifyIcon?.properties?.find(
    (property) => property.kind === 'variant' && property.name === 'Tone',
  )?.values ?? [];
assert(
  tasklifyIcon?.figma?.nodeType === 'COMPONENT_SET',
  'Tasklify Icon must be a Component Set',
);
assert(
  tasklifyIconNames.length > 0 &&
    new Set(tasklifyIconNames).size === tasklifyIconNames.length,
  'Tasklify Icon subset names must be present and unique',
);
assert(
  JSON.stringify(tasklifyIconSizes) === JSON.stringify(['SM', 'MD', 'LG']),
  'Tasklify Icon Size contract must be exactly SM/MD/LG',
);
assert(
  JSON.stringify(tasklifyIconTones) === JSON.stringify(['Default', 'Inverse']),
  'Tasklify Icon Tone contract must be exactly Default/Inverse',
);
assert(
  tasklifyIcon.tokenBindings?.some(
    (binding) =>
      binding.target === 'icon-vector.stroke' &&
      binding.when?.Tone === 'Default' &&
      binding.tokenRef === 'semantic.text.primary',
  ) &&
    tasklifyIcon.tokenBindings?.some(
      (binding) =>
        binding.target === 'icon-vector.stroke' &&
        binding.when?.Tone === 'Inverse' &&
        binding.tokenRef === 'semantic.surface.card',
    ),
  'Tasklify Icon contract must bind Default and Inverse strokes to Semantic Tokens',
);
const tasklifyStatCard = tasklifyComponents.components.find(
  (component) => component.id === 'component.stat-card',
);
const tasklifyTaskCard = tasklifyComponents.components.find(
  (component) => component.id === 'component.task-card',
);
const tasklifyBadge = tasklifyComponents.components.find(
  (component) => component.id === 'component.badge',
);
const tasklifyBadgeSizes =
  tasklifyBadge?.properties?.find(
    (property) => property.kind === 'variant' && property.name === 'Size',
  )?.values ?? [];
assert(
  JSON.stringify(tasklifyBadgeSizes) === JSON.stringify(['SM', 'MD']),
  'Tasklify Badge Size contract must be exactly SM/MD',
);
assert(
  tasklifyStatCard?.anatomy?.children?.some((child) => child.role === 'top-row') &&
    tasklifyStatCard.anatomy.children.some((child) => child.role === 'value') &&
    tasklifyStatCard.anatomy.children.some((child) => child.role === 'label'),
  'Tasklify Stat Card contract must declare top/value/label anatomy',
);
assert(
  ['meta-row', 'content', 'due-metadata', 'footer'].every((role) =>
    tasklifyTaskCard?.anatomy?.children?.some((child) => child.role === role),
  ),
  'Tasklify Task Card contract must declare the refined anatomy',
);
const tasklifyTaskContent = tasklifyTaskCard?.anatomy?.children?.find(
  (child) => child.role === 'content',
);
const tasklifyTaskFooter = tasklifyTaskCard?.anatomy?.children?.find(
  (child) => child.role === 'footer',
);
const tasklifyTaskActivity = tasklifyTaskFooter?.children?.find(
  (child) => child.role === 'activity',
);
assert(
  ['title', 'project'].every((role) =>
    tasklifyTaskContent?.children?.some((child) => child.role === role),
  ) &&
    ['comment-metadata', 'divider', 'activity-date'].every((role) =>
      tasklifyTaskActivity?.children?.some((child) => child.role === role),
    ),
  'Tasklify Task Card contract must group Content and Activity with a Divider',
);

const tasklifyScreen = tasklifyScreens.screens.find(
  (candidate) => candidate.id === 'screen.tasklify.dashboard-overview',
);
assert(tasklifyScreen, 'Tasklify Dashboard Screen is missing');
assert(
  tasklifyScreen.layout.width.value === 975 &&
    tasklifyScreen.layout.height.value === 694,
  'Tasklify Desktop viewport must be 975 x 694',
);
const tabletBreakpoint = tasklifyScreen.responsive.breakpoints.find(
  (candidate) => candidate.id === 'breakpoint.tablet',
);
assert(tabletBreakpoint, 'Tasklify Tablet breakpoint is missing');
assert(
  tabletBreakpoint.testViewport.width === 834 &&
    tabletBreakpoint.testViewport.height === 1112,
  'Tasklify Tablet viewport must be 834 x 1112',
);

for (const sourceMarker of [
  "const DESIGN_SYSTEM_ID = 'design-system.tasklify.reference'",
  "const DESKTOP_RENDER_ID = `${SCREEN_ID}@desktop`",
  "const TABLET_RENDER_ID = `${SCREEN_ID}@tablet-834`",
  'DESIGN_SYSTEM_ID_KEY',
  'RENDER_ID_KEY',
  'hasDesignSystemIdentity(candidate)',
  'figma.variables.createVariableAlias(aliasTarget)',
  'instance.getMainComponentAsync()',
  'syncTasklifyRender(',
  'removeStaleManagedChildren(',
  'figma.createNodeFromSvg(',
  'assertComponentSetGeometry(',
  'assertCanonicalPaintBinding(',
]) {
  assert(
    tasklifySource.includes(sourceMarker),
    `Tasklify Slice source is missing: ${sourceMarker}`,
  );
}
const tasklifySyncStart = tasklifySource.indexOf(
  'export async function syncTasklifySlice01',
);
const tasklifyVariableSyncStart = tasklifySource.indexOf(
  'async function syncTasklifyVariables',
);
const tasklifySyncSource = tasklifySource.slice(
  tasklifySyncStart,
  tasklifyVariableSyncStart,
);
assert(
  tasklifySyncSource.indexOf('await preflightTasklifySlice()') >= 0 &&
    tasklifySyncSource.indexOf('await preflightTasklifySlice()') <
      tasklifySyncSource.indexOf('syncTasklifyVariables()'),
  'Tasklify read-only preflight must run before the first mutation path',
);
for (const preflightMarker of [
  'Duplicate Tasklify Collection ID',
  'Duplicate Tasklify Variable ID',
  'Duplicate Tasklify component ID',
  'Duplicate Tasklify render ID',
  'Tasklify render type mismatch:',
  'Duplicate Tasklify managed identity:',
  'Tasklify managed node type mismatch:',
  'Tasklify tagged Instance component identity mismatch:',
  'missing required Frame root',
]) {
  assert(
    tasklifySource.includes(preflightMarker),
    `Tasklify preflight is missing: ${preflightMarker}`,
  );
}
assert(
  tasklifySource.includes('A duplicated Compiler-managed node may have copied plugin data.') &&
    tasklifySource.includes('Create a fresh node for unmanaged content'),
  'Tasklify duplicate managed identity error must explain copied plugin data',
);
for (const geometryMarker of [
  'Variant width/height must be greater than zero',
  'Variant must be fully inside Component Set bounds',
  'variants overlap:',
  'set.resizeWithoutConstraints(',
]) {
  assert(
    tasklifySource.includes(geometryMarker),
    `Tasklify Component Set guard is missing: ${geometryMarker}`,
  );
}
for (const paintMarker of [
  'canonicalSolidPaint(tokenHex)',
  'visible: true',
  'opacity: 1',
  "blendMode: 'NORMAL'",
  'paints.length !== 1',
  'must contain exactly one SOLID Paint',
  'visibility metadata is not canonical',
  'paint.boundVariables?.color?.id === variable.id',
  'base paint does not match',
  'variable.resolveForConsumer(node)',
  'resolved value does not match',
]) {
  assert(
    tasklifySource.includes(paintMarker),
    `Tasklify canonical Paint guard is missing: ${paintMarker}`,
  );
}
assert(
  !tasklifySource.includes('figma.util.solidPaint(tokenHex, existing)'),
  'Tasklify canonical Paint sync must not inherit untrusted Paint metadata',
);
assert(
  !tasklifySource.includes("solidPaint('#000000')") &&
    !tasklifySource.includes("solidPaint('#FFFFFF')"),
  'Tasklify Paint sync must not use black/white fallback paint',
);
for (const unicodeFallback of [
  '⌕',
  '□',
  '▣',
  '◌',
  '≡',
  '⌘',
  '▽',
  '↕',
  '⚡',
  '•••',
  '⋮',
  '✦',
  '●',
  '⚙',
]) {
  assert(
    !tasklifySource.includes(unicodeFallback),
    `Tasklify renderer contains formal Unicode icon fallback: ${unicodeFallback}`,
  );
}
for (const anatomyMarker of [
  "'task-content'",
  "'task-due-chip'",
  "'task-due-icon'",
  "'task-comment'",
  "'task-comment-icon'",
  "'task-comment-count'",
  "'task-activity-divider'",
  "'task-footer-row'",
  "'stat-icon-surface'",
  "'stat-icon'",
  "'stat-action-row'",
]) {
  assert(
    tasklifySource.includes(anatomyMarker),
    `Tasklify anatomy refinement is missing: ${anatomyMarker}`,
  );
}
assert(
  !/\b(?:[A-Za-z]+Icon|icon)\.resize\(/.test(tasklifySource) &&
    !tasklifySource.includes('.resize(13, 13)'),
  'Tasklify Icon Instances must be sized only through Name/Size/Tone Variant properties',
);
assert(
  tasklifySource.includes("const ICON_SIZES: IconSize[] = ['SM', 'MD', 'LG']") &&
    tasklifySource.includes(
      "const ICON_TONES: IconTone[] = ['Default', 'Inverse']",
    ) &&
    tasklifySource.includes('iconInstanceProperties('),
  'Tasklify Icon runtime must implement the SM/MD/LG and Default/Inverse contract',
);
const reconcileVariantsStart = tasklifySource.indexOf(
  'function reconcileContractVariants(',
);
const arrangeVariantsStart = tasklifySource.indexOf('function arrangeVariants(');
assert(
  reconcileVariantsStart >= 0 && arrangeVariantsStart > reconcileVariantsStart,
  'Tasklify component recovery source boundaries not found',
);
const reconcileVariantsSource = tasklifySource.slice(
  reconcileVariantsStart,
  arrangeVariantsStart,
);
assert(
  tasklifySource.includes(
    "iconVariantName(legacy[1] as IconName, 'LG', 'Default')",
  ) &&
    tasklifySource.includes("badgeVariantName(legacy[1], 'MD')") &&
    reconcileVariantsSource.includes('set.appendChild(variant)') &&
    !reconcileVariantsSource.includes('.remove()'),
  'Tasklify component recovery must migrate legacy nodes in place and append only missing variants',
);
assert(
  compilerReadme.includes('Type=urgent, Size=SM') &&
    compilerReadme.includes('paddingTop') &&
    compilerReadme.includes('40') &&
    compilerReadme.includes('Variant node ID remains unchanged'),
  'Tasklify README must retain the manual urgent/SM property recovery test',
);
assert(
  tasklifySource.includes("const BADGE_SIZES: BadgeSize[] = ['SM', 'MD']") &&
    !tasklifySource.includes('component.paddingTop = 5') &&
    !tasklifySource.includes('component.paddingBottom = 5') &&
    tasklifySource.includes(
      "bindNumeric(component, 'paddingTop', variables, 'semantic.spacing.compact')",
    ),
  'Tasklify Badge runtime must use Size variants and Variable-bound vertical padding',
);
assert(
  tasklifySource.includes(
    "bindFill(iconSurface, variables, 'semantic.action.primary')",
  ) &&
    tasklifySource.includes(
      "iconInstanceProperties('Reporting', 'MD', 'Inverse')",
    ) &&
    tasklifySource.includes(
      "iconInstanceProperties('ChevronDown', 'SM')",
    ),
  'Tasklify Stat Card must use a dark icon surface with inverse MD icon and SM chevron',
);
const syncIconStart = tasklifySource.indexOf('function syncIcon(');
const syncButtonStart = tasklifySource.indexOf('function syncButton(');
const syncBadgeStart = tasklifySource.indexOf('function syncBadge(');
const syncStatCardStart = tasklifySource.indexOf('function syncStatCard(');
const syncTaskCardStart = tasklifySource.indexOf('function syncTaskCard(');
const syncRenderStart = tasklifySource.indexOf('async function syncTasklifyRender(');
const findRendersStart = tasklifySource.indexOf('async function findTasklifyRenders(');
assert(
  syncIconStart >= 0 &&
    syncButtonStart > syncIconStart &&
    syncBadgeStart > syncButtonStart &&
    syncStatCardStart > syncBadgeStart &&
    syncTaskCardStart > syncStatCardStart &&
    syncRenderStart > syncTaskCardStart &&
    findRendersStart > syncRenderStart,
  'Tasklify Component and render source boundaries not found',
);
const statCardSource = tasklifySource.slice(syncStatCardStart, syncTaskCardStart);
const taskCardSource = tasklifySource.slice(syncTaskCardStart, syncRenderStart);
assert(
  statCardSource.includes('configureFixedWidthHugHeight(component, 170)') &&
    taskCardSource.includes('configureFixedWidthHugHeight(component, 180)') &&
    !statCardSource.includes('component.resize(170, 112)') &&
    !taskCardSource.includes('component.resize(180, 184)') &&
    !statCardSource.includes("component.primaryAxisSizingMode = 'FIXED'") &&
    !taskCardSource.includes("component.primaryAxisSizingMode = 'FIXED'"),
  'Tasklify Stat/Task Card must retain fixed width without a fixed-height contract',
);
const hugSizingStart = tasklifySource.indexOf(
  'function configureFixedWidthHugHeight(',
);
const fixedFrameStart = tasklifySource.indexOf('function configureFixedFrame(');
assert(
  hugSizingStart >= 0 && fixedFrameStart > hugSizingStart,
  'Tasklify fixed-width/Hug-height helper source boundaries not found',
);
const hugSizingSource = tasklifySource.slice(hugSizingStart, fixedFrameStart);
assert(
  hugSizingSource.indexOf('node.resize(width, Math.max(1, node.height))') >= 0 &&
    hugSizingSource.indexOf("node.counterAxisSizingMode = 'FIXED'") >
      hugSizingSource.indexOf('node.resize(width, Math.max(1, node.height))') &&
    hugSizingSource.indexOf("node.primaryAxisSizingMode = 'AUTO'") >
      hugSizingSource.indexOf("node.counterAxisSizingMode = 'FIXED'"),
  'Tasklify Stat/Task Card final sizing must be W Fixed and H Hug after resize',
);
assert(
  compilerReadme.includes('Stat Card: `W Fixed`, `H Hug`') &&
    compilerReadme.includes('Task Card: `W Fixed`, `H Hug`') &&
    compilerReadme.includes('height adapts naturally') &&
    compilerReadme.includes('Screen Instances continue to inherit correctly'),
  'Tasklify README must include the Stat/Task W Fixed and H Hug Runtime checklist',
);

const galleryStart = tasklifySource.indexOf(
  'function layoutTasklifyComponentGallery(',
);
const tasklifyComponentLookupStart = tasklifySource.indexOf(
  'async function findTasklifyComponents(',
);
assert(
  galleryStart >= 0 && tasklifyComponentLookupStart > galleryStart,
  'Tasklify Component Gallery source boundaries not found',
);
const gallerySource = tasklifySource.slice(
  galleryStart,
  tasklifyComponentLookupStart,
);
for (const componentId of [
  'component.button',
  'component.badge',
  'component.stat-card',
  'component.task-card',
  'component.icon',
]) {
  assert(
    gallerySource.includes(`'${componentId}'`),
    `Tasklify Component Gallery is missing: ${componentId}`,
  );
}
assert(
  gallerySource.includes('node.width') &&
    gallerySource.includes('node.height') &&
    gallerySource.includes('GALLERY_GAP') &&
    gallerySource.includes('assertTopLevelNodesDoNotOverlap('),
  'Tasklify Component Gallery must place assets from actual bounds with deterministic gaps',
);
for (const [start, end, componentName] of [
  [syncIconStart, syncButtonStart, 'Icon'],
  [syncButtonStart, syncBadgeStart, 'Button'],
  [syncBadgeStart, syncStatCardStart, 'Badge'],
  [syncStatCardStart, syncTaskCardStart, 'Stat Card'],
  [syncTaskCardStart, syncRenderStart, 'Task Card'],
]) {
  const componentSource = tasklifySource.slice(start, end);
  assert(
    !/\b(?:component|componentSet)\.[xy]\s*=/.test(componentSource),
    `Tasklify ${componentName} sync must not own top-level x/y placement`,
  );
}
assert(
  tasklifySyncSource.includes(
    'const galleryBounds = layoutTasklifyComponentGallery(components)',
  ) &&
    tasklifySyncSource.includes('galleryBounds.maxX + SCREEN_GAP') &&
    tasklifySyncSource.includes('desktop.x + desktop.width + SCREEN_GAP') &&
    tasklifySyncSource.includes('assertTopLevelNodesDoNotOverlap(') &&
    tasklifySyncSource.includes('[...components.values(), desktop, tablet]') &&
    syncRenderStart >= 0,
  'Tasklify Desktop/Tablet placement must derive from Gallery and prior Screen bounds',
);
const syncRenderSource = tasklifySource.slice(syncRenderStart, findRendersStart);
assert(
  syncRenderSource.includes('screen.x = x') &&
    syncRenderSource.includes('screen.y = y') &&
    !syncRenderSource.includes("mode === 'desktop' ? 760 : 1780"),
  'Tasklify render placement must be deterministic on CREATE and UPDATE',
);
assert(
  compilerReadme.includes('non-overlapping top-level gallery') &&
    compilerReadme.includes('Desktop starts after the gallery') &&
    compilerReadme.includes('Tablet starts after Desktop'),
  'Tasklify README must include Component Gallery and Screen separation Runtime checks',
);
assert(
  tasklifySource.includes('if (!screen)') &&
    tasklifySource.includes('Tasklify render node identity changed during UPDATE'),
  'Tasklify render CREATE/UPDATE must preserve Frame identity',
);
assert(
  tasklifySource.includes('if (!variable)') &&
    tasklifySource.includes('Duplicate Tasklify Variable ID'),
  'Tasklify Variable CREATE must be scoped and duplicate-safe',
);
assert(
  tasklifySource.includes('if (!existing)') &&
    tasklifySource.includes('Duplicate Tasklify component ID'),
  'Tasklify Component CREATE must be scoped and duplicate-safe',
);

const tasklifyLookupStart = tasklifySource.indexOf(
  'async function findTasklifyComponents',
);
const tasklifyLookupEnd = tasklifySource.indexOf('function syncButton', tasklifyLookupStart);
const tasklifyLookupSource = tasklifySource.slice(tasklifyLookupStart, tasklifyLookupEnd);
assert(
  tasklifyLookupSource.includes('hasDesignSystemIdentity(candidate)') &&
    tasklifyLookupSource.includes('COMPONENT_ID_KEY'),
  'Tasklify Component lookup must use designSystemId + componentId',
);
assert(
  !tasklifyLookupSource.includes(
    "candidate.getSharedPluginData(PLUGIN_DATA_NAMESPACE, COMPONENT_ID_KEY) === componentId",
  ) || tasklifyLookupSource.includes('hasDesignSystemIdentity(candidate)'),
  'Tasklify lookup must not use global componentId-only identity',
);

for (const forbiddenRasterPath of [
  'figma.createImage(',
  'figma.createImageAsync(',
  'imageHash',
  "import dashboard",
]) {
  assert(
    !tasklifySource.includes(forbiddenRasterPath),
    `Tasklify Slice must not rasterize the Screen: ${forbiddenRasterPath}`,
  );
}
for (const forbiddenGenericEngine of [
  'renderRecursive',
  'syncTreeRecursive',
  'genericDiffEngine',
]) {
  assert(
    !tasklifySource.includes(forbiddenGenericEngine),
    `Tasklify Slice must not add a recursive diff engine: ${forbiddenGenericEngine}`,
  );
}
assert(
  !/(padding|itemSpacing|gap)[A-Za-z]*\s*=\s*(13|19|27)\b/.test(tasklifySource),
  'Tasklify layout must not introduce orphan 13/19/27px spacing',
);

assert(
  ui.includes('Sync Tasklify V2 Slice 01') &&
    ui.includes('data-action="sync-tasklify-slice01"'),
  'Plugin UI is missing the Tasklify Slice sync entry',
);
assert(
  ui.includes('message.tasklify.schemaVersion') &&
    ui.includes('message.tasklify.packageVersion') &&
    ui.includes('message.tasklify.designSystemId') &&
    ui.includes('message.tasklify.desktop') &&
    ui.includes('message.tasklify.tablet'),
  'Plugin UI must render bundled Tasklify Package summary fields',
);
assert(
  pluginSource.includes("message.type !== 'sync-tasklify-slice01'") &&
    pluginSource.includes('syncTasklifySlice01()'),
  'Main thread is missing the isolated Tasklify Slice action',
);
assert(
  pluginSource.includes('async function syncDesignSystem') &&
    pluginSource.includes('async function syncPilotScreen') &&
    ui.includes('Sync Design System') &&
    ui.includes('Sync Pilot Screen'),
  'Pilot sync paths must remain available',
);
for (const bundledMarker of [
  tasklifyManifest.packageId,
  tasklifyManifest.packageVersion,
  tasklifyManifest.designSystem.id,
  'primitive/color/status/green/600',
  'semantic/status/review/background',
  'tablet-834',
]) {
  assert(bundle.includes(bundledMarker), `built plugin is missing Tasklify marker: ${bundledMarker}`);
}
assert(
  bundle.includes('createVariableAlias') &&
    bundle.includes('setBoundVariableForPaint') &&
    bundle.includes('combineAsVariants') &&
    bundle.includes('createInstance'),
  'built plugin is missing native Tasklify Variable/Component/Instance APIs',
);

console.log(
  `Pilot 03B + Tasklify V2 Slice 01B.2 verification passed: fail-before-mutation preflight and 01B.1 contracts retained; Stat/Task fixed-width Hug-height sizing, bounds-driven Component Gallery, and deterministic Screen separation are statically verified. Runtime visual acceptance remains manual in Figma.`,
);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
