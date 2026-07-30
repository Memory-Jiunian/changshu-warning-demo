import manifestJson from '../../../design-packages/tasklify-dashboard-v2.1-slice01/manifest.json';
import foundationsJson from '../../../design-packages/tasklify-dashboard-v2.1-slice01/foundations.json';
import componentsJson from '../../../design-packages/tasklify-dashboard-v2.1-slice01/components.json';
import screensJson from '../../../design-packages/tasklify-dashboard-v2.1-slice01/screens.json';
import decisionsJson from '../../../design-packages/tasklify-dashboard-v2.1-slice01/decisions.json';
import {
  COLLECTION_ID_KEY,
  COMPONENT_ID_KEY,
  DESIGN_SYSTEM_ID_KEY,
  PLUGIN_DATA_NAMESPACE,
  RENDER_ID_KEY,
  SCREEN_ID_KEY,
  SLICE_NODE_ID_KEY,
  TOKEN_ID_KEY,
} from './plugin-data';

type TokenType = 'COLOR' | 'FLOAT';

type VariableRepresentation = {
  kind: string;
  collectionRef: string;
};

type FoundationToken = {
  id: string;
  figmaName: string;
  name: string;
  description: string;
  category: 'color' | 'spacing' | 'radius';
  type: TokenType;
  value?: string | number;
  alias?: string;
  figmaRepresentation: VariableRepresentation;
};

type FoundationsSchema = {
  schemaVersion: string;
  designSystemId: string;
  primitives: FoundationToken[];
  semantics: FoundationToken[];
};

type Documentation = {
  usage?: string[];
  dont?: string[];
  notes?: string[];
};

type ComponentDefinition = {
  id: string;
  name: string;
  description: string;
  purpose: string;
  documentation?: Documentation;
  accessibility?: Record<string, unknown>;
  figma: {
    nodeType: 'COMPONENT' | 'COMPONENT_SET';
    name: string;
  };
  properties: Array<{
    name: string;
    kind: string;
    default?: string;
    values?: string[];
  }>;
};

type ComponentsSchema = {
  schemaVersion: string;
  components: ComponentDefinition[];
};

type ScreenDefinition = {
  id: string;
  name: string;
  layout: {
    width: { value: number };
    height: { value: number };
  };
  responsive: {
    breakpoints: Array<{
      id: string;
      range: { min: number; max: number };
      testViewport: { width: number; height: number };
      behavior: {
        sidebar: { widthCandidate: number };
        summaryMetrics: { layout: string };
        kanbanBoard: {
          layout: string;
          doNotCompressToFourNarrowColumns: boolean;
        };
        topbar: { prioritizePrimaryAction: boolean };
      };
    }>;
  };
};

type ScreensSchema = {
  schemaVersion: string;
  screens: ScreenDefinition[];
};

type DecisionsSchema = {
  decisions: Array<{ id: string; decision: string }>;
};

type TasklifySummary = {
  name: string;
  schemaVersion: string;
  packageVersion: string;
  designSystemId: string;
  desktop: string;
  tablet: string;
};

type SyncResult = {
  selection: SceneNode[];
  variableCount: number;
};

type ContainerNode = PageNode | FrameNode | ComponentNode | ComponentSetNode;
type AutoLayoutNode = FrameNode | ComponentNode;
type PaintNode = FrameNode | ComponentNode | TextNode | RectangleNode | EllipseNode;

const manifest = manifestJson;
const foundations = foundationsJson as FoundationsSchema;
const componentSchema = componentsJson as ComponentsSchema;
const screenSchema = screensJson as ScreensSchema;
const decisions = decisionsJson as DecisionsSchema;

const DESIGN_SYSTEM_ID = 'design-system.tasklify.reference';
const FOUNDATION_COLLECTION_ID = 'collection.foundation.reference';
const FOUNDATION_COLLECTION_NAME = 'Tasklify Reference / Foundations';
const SCREEN_ID = 'screen.tasklify.dashboard-overview';
const DESKTOP_RENDER_ID = `${SCREEN_ID}@desktop`;
const TABLET_RENDER_ID = `${SCREEN_ID}@tablet-834`;
const TARGET_COMPONENT_IDS = [
  'component.button',
  'component.badge',
  'component.stat-card',
  'component.task-card',
] as const;

const FONT_REGULAR: FontName = { family: 'Inter', style: 'Regular' };
const FONT_SEMIBOLD: FontName = { family: 'Inter', style: 'Semi Bold' };

const allTokens = [...foundations.primitives, ...foundations.semantics];
const tokenById = new Map(allTokens.map((token) => [token.id, token]));
const componentById = new Map(
  componentSchema.components.map((component) => [component.id, component]),
);

export function getTasklifySliceSummary(): TasklifySummary {
  const screen = requireTasklifyScreen();
  const tablet = requireTabletBreakpoint(screen);
  return {
    name: manifest.name,
    schemaVersion: manifest.schemaVersion,
    packageVersion: manifest.packageVersion,
    designSystemId: manifest.designSystem.id,
    desktop: `${screen.layout.width.value} × ${screen.layout.height.value}`,
    tablet: `${tablet.testViewport.width} × ${tablet.testViewport.height}`,
  };
}

export function validateTasklifySlicePackage(): void {
  if (manifest.schemaVersion !== '2.1.0') {
    throw new Error(`Tasklify Slice requires Schema 2.1.0, got ${manifest.schemaVersion}`);
  }
  if (manifest.packageVersion !== '0.3.0') {
    throw new Error(`Tasklify Slice requires Package 0.3.0, got ${manifest.packageVersion}`);
  }
  if (
    manifest.designSystem.id !== DESIGN_SYSTEM_ID ||
    foundations.designSystemId !== DESIGN_SYSTEM_ID
  ) {
    throw new Error('Tasklify Design System identity mismatch');
  }
  if (
    foundations.schemaVersion !== manifest.schemaVersion ||
    componentSchema.schemaVersion !== manifest.schemaVersion ||
    screenSchema.schemaVersion !== manifest.schemaVersion
  ) {
    throw new Error('Tasklify Slice entrypoint schemaVersion mismatch');
  }

  const tokenIds = new Set<string>();
  const variableNames = new Set<string>();
  for (const token of allTokens) {
    if (tokenIds.has(token.id)) throw new Error(`Duplicate Tasklify token ID: ${token.id}`);
    if (variableNames.has(token.figmaName)) {
      throw new Error(`Duplicate Tasklify Variable name: ${token.figmaName}`);
    }
    if (token.figmaRepresentation.kind !== 'variable') {
      throw new Error(
        `Unsupported figmaRepresentation for ${token.id}: ${token.figmaRepresentation.kind}`,
      );
    }
    if (token.figmaRepresentation.collectionRef !== FOUNDATION_COLLECTION_ID) {
      throw new Error(`Unsupported Tasklify collectionRef: ${token.id}`);
    }
    if (token.figmaName.includes('.')) {
      throw new Error(`Tasklify Variable name cannot contain ".": ${token.figmaName}`);
    }
    if ((token.value === undefined) === (token.alias === undefined)) {
      throw new Error(`Tasklify token must define exactly one value or alias: ${token.id}`);
    }
    tokenIds.add(token.id);
    variableNames.add(token.figmaName);
  }

  for (const token of foundations.semantics) {
    if (!token.alias) throw new Error(`Semantic token must use alias: ${token.id}`);
    const target = tokenById.get(token.alias);
    if (!target) throw new Error(`Unresolved Tasklify alias: ${token.id} -> ${token.alias}`);
    if (target.type !== token.type) {
      throw new Error(`Tasklify alias type mismatch: ${token.id} -> ${token.alias}`);
    }
    resolveTokenLiteral(token.id);
  }

  const componentIds = new Set<string>();
  for (const component of componentSchema.components) {
    if (componentIds.has(component.id)) {
      throw new Error(`Duplicate Tasklify Component ID: ${component.id}`);
    }
    componentIds.add(component.id);
  }
  for (const id of TARGET_COMPONENT_IDS) {
    if (!componentIds.has(id)) throw new Error(`Missing Slice Component: ${id}`);
  }

  const button = requireComponentDefinition('component.button');
  const badge = requireComponentDefinition('component.badge');
  assertVariantValues(button, 'Type', ['primary', 'secondary']);
  assertVariantValues(badge, 'Type', [
    'neutral',
    'urgent',
    'low',
    'medium',
    'pending',
    'completed',
    'review',
  ]);

  const screen = requireTasklifyScreen();
  if (screen.layout.width.value !== 975 || screen.layout.height.value !== 694) {
    throw new Error('Tasklify Desktop render must be 975 × 694');
  }
  const tablet = requireTabletBreakpoint(screen);
  if (
    tablet.testViewport.width !== 834 ||
    tablet.testViewport.height !== 1112 ||
    tablet.range.min !== 768 ||
    tablet.range.max !== 1023
  ) {
    throw new Error('Tasklify Tablet breakpoint contract mismatch');
  }
  if (
    tablet.behavior.summaryMetrics.layout !== '2x2-grid' ||
    tablet.behavior.kanbanBoard.layout !== 'horizontal-scroll' ||
    !tablet.behavior.kanbanBoard.doNotCompressToFourNarrowColumns ||
    !tablet.behavior.topbar.prioritizePrimaryAction
  ) {
    throw new Error('Tasklify Tablet behavior contract is incomplete');
  }
  if (!decisions.decisions.some((decision) => decision.id === 'decision.reference.tablet-adaptation')) {
    throw new Error('Missing approved Tablet adaptation Decision');
  }

  for (const requiredToken of [
    'semantic.surface.canvas',
    'semantic.surface.sidebar',
    'semantic.surface.card',
    'semantic.text.primary',
    'semantic.text.secondary',
    'semantic.border.subtle',
    'semantic.action.primary',
    'semantic.spacing.inline-tight',
    'semantic.spacing.component',
    'semantic.spacing.section',
    'semantic.spacing.page',
    'semantic.radius.control',
    'semantic.radius.card',
    'semantic.radius.container',
    'semantic.status.pending.foreground',
    'semantic.status.pending.background',
    'semantic.status.completed.foreground',
    'semantic.status.completed.background',
    'semantic.status.review.foreground',
    'semantic.status.review.background',
  ]) {
    if (!tokenById.has(requiredToken)) {
      throw new Error(`Tasklify Slice is missing required token: ${requiredToken}`);
    }
  }
}

export async function syncTasklifySlice01(): Promise<SyncResult> {
  validateTasklifySlicePackage();
  const { collection, variables } = await syncTasklifyVariables();
  const components = await syncTasklifyComponents(variables);
  const desktop = await syncTasklifyRender(
    'desktop',
    DESKTOP_RENDER_ID,
    975,
    694,
    187,
    components,
    variables,
  );
  const tablet = await syncTasklifyRender(
    'tablet',
    TABLET_RENDER_ID,
    834,
    1112,
    requireTabletBreakpoint(requireTasklifyScreen()).behavior.sidebar.widthCandidate,
    components,
    variables,
  );
  await validateTasklifyStructure(collection, variables, components, desktop, tablet);
  return { selection: [desktop, tablet], variableCount: variables.size };
}

async function syncTasklifyVariables(): Promise<{
  collection: VariableCollection;
  variables: Map<string, Variable>;
}> {
  const [collections, localVariables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
  ]);
  const collectionMatches = collections.filter(
    (candidate) =>
      hasDesignSystemIdentity(candidate) &&
      candidate.getSharedPluginData(PLUGIN_DATA_NAMESPACE, COLLECTION_ID_KEY) ===
        FOUNDATION_COLLECTION_ID,
  );
  if (collectionMatches.length > 1) {
    throw new Error(`Duplicate Tasklify Collection ID: ${FOUNDATION_COLLECTION_ID}`);
  }

  let collection = collectionMatches[0];
  if (!collection) {
    collection = figma.variables.createVariableCollection(FOUNDATION_COLLECTION_NAME);
  }
  collection.name = FOUNDATION_COLLECTION_NAME;
  setDesignSystemIdentity(collection);
  collection.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COLLECTION_ID_KEY,
    FOUNDATION_COLLECTION_ID,
  );

  const variables = new Map<string, Variable>();
  for (const token of allTokens) {
    const matches = localVariables.filter(
      (variable) =>
        hasDesignSystemIdentity(variable) &&
        variable.getSharedPluginData(PLUGIN_DATA_NAMESPACE, TOKEN_ID_KEY) === token.id,
    );
    if (matches.length > 1) throw new Error(`Duplicate Tasklify Variable ID: ${token.id}`);
    let variable = matches[0];
    if (variable && variable.variableCollectionId !== collection.id) {
      throw new Error(`Tasklify Variable is in another Collection: ${token.id}`);
    }
    if (!variable) {
      variable = figma.variables.createVariable(token.figmaName, collection, token.type);
    }
    if (variable.resolvedType !== token.type) {
      throw new Error(`Tasklify Variable type mismatch: ${token.id}`);
    }
    variable.name = token.figmaName;
    variable.description = token.description;
    setDesignSystemIdentity(variable);
    variable.setSharedPluginData(PLUGIN_DATA_NAMESPACE, TOKEN_ID_KEY, token.id);
    variables.set(token.id, variable);
  }

  for (const token of foundations.primitives) {
    const variable = requireVariable(variables, token.id);
    variable.setValueForMode(
      collection.defaultModeId,
      token.type === 'COLOR'
        ? hexToRgb(requireStringValue(token))
        : requireNumberValue(token),
    );
  }
  for (const token of foundations.semantics) {
    const variable = requireVariable(variables, token.id);
    const aliasTarget = requireVariable(variables, requireAlias(token));
    variable.setValueForMode(
      collection.defaultModeId,
      figma.variables.createVariableAlias(aliasTarget),
    );
  }
  const activeTokenIds = new Set(allTokens.map((token) => token.id));
  for (const variable of localVariables) {
    if (variable.variableCollectionId !== collection.id) continue;
    if (!hasDesignSystemIdentity(variable)) continue;
    const tokenId = variable.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      TOKEN_ID_KEY,
    );
    if (tokenId && !activeTokenIds.has(tokenId)) variable.remove();
  }

  return { collection, variables };
}

async function syncTasklifyComponents(
  variables: Map<string, Variable>,
): Promise<Map<string, ComponentNode | ComponentSetNode>> {
  const existing = await findTasklifyComponents();
  const button = syncButton(existing.get('component.button'), variables);
  const badge = syncBadge(existing.get('component.badge'), variables);
  const statCard = syncStatCard(existing.get('component.stat-card'), variables);
  const taskCard = syncTaskCard(existing.get('component.task-card'), badge, variables);
  return new Map<string, ComponentNode | ComponentSetNode>([
    ['component.button', button],
    ['component.badge', badge],
    ['component.stat-card', statCard],
    ['component.task-card', taskCard],
  ]);
}

async function findTasklifyComponents(): Promise<
  Map<string, ComponentNode | ComponentSetNode>
> {
  await figma.loadAllPagesAsync();
  const result = new Map<string, ComponentNode | ComponentSetNode>();
  const targetIds = new Set<string>(TARGET_COMPONENT_IDS);
  const candidates = figma.root.findAll(
    (node) => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET',
  );
  for (const candidate of candidates) {
    if (candidate.type !== 'COMPONENT' && candidate.type !== 'COMPONENT_SET') continue;
    if (!hasDesignSystemIdentity(candidate)) continue;
    const componentId = candidate.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      COMPONENT_ID_KEY,
    );
    if (!targetIds.has(componentId)) continue;
    if (result.has(componentId)) {
      throw new Error(`Duplicate Tasklify component ID: ${componentId}`);
    }
    result.set(componentId, candidate);
  }
  return result;
}

function syncButton(
  existing: ComponentNode | ComponentSetNode | undefined,
  variables: Map<string, Variable>,
): ComponentSetNode {
  const definition = requireComponentDefinition('component.button');
  const types = requireVariantValues(definition, 'Type');
  let componentSet: ComponentSetNode;
  if (!existing) {
    const variants = types.map((type, index) => {
      const component = figma.createComponent();
      component.name = `Type=${type}`;
      component.x = index * 180;
      component.y = 0;
      configureButtonVariant(component, type, variables);
      return component;
    });
    componentSet = figma.combineAsVariants(variants, figma.currentPage);
    componentSet.x = 0;
    componentSet.y = 0;
  } else {
    if (existing.type !== 'COMPONENT_SET') {
      throw new Error('Tasklify Button identity points to a non-Component Set');
    }
    componentSet = existing;
    const variants = requireExactVariants(componentSet, types.map((type) => `Type=${type}`));
    for (const type of types) {
      configureButtonVariant(variants.get(`Type=${type}`)!, type, variables);
    }
  }
  componentSet.name = definition.figma.name;
  componentSet.description = buildComponentDescription(definition);
  tagComponent(componentSet, definition.id);
  arrangeVariants(componentSet, 2, 180, 64);
  return componentSet;
}

function configureButtonVariant(
  component: ComponentNode,
  type: string,
  variables: Map<string, Variable>,
): void {
  component.name = `Type=${type}`;
  configureAutoLayout(component, 'HORIZONTAL', 12, 8);
  bindNumeric(component, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  component.primaryAxisAlignItems = 'CENTER';
  component.counterAxisAlignItems = 'CENTER';
  component.minHeight = 36;
  bindNumeric(component, 'paddingLeft', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingRight', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingTop', variables, 'semantic.spacing.inline-tight');
  bindNumeric(component, 'paddingBottom', variables, 'semantic.spacing.inline-tight');
  bindNumeric(component, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(
    component,
    variables,
    type === 'primary' ? 'semantic.action.primary' : 'semantic.surface.card',
  );
  if (type === 'secondary') {
    bindStroke(component, variables, 'semantic.border.subtle');
    component.strokeWeight = 1;
  } else {
    component.strokes = [];
  }
  const label = ensureText(component, 'button-label');
  configureText(
    label,
    type === 'primary' ? 'Create Task' : 'View Details',
    12,
    true,
    variables,
    type === 'primary' ? 'semantic.surface.card' : 'semantic.text.primary',
  );
}

function syncBadge(
  existing: ComponentNode | ComponentSetNode | undefined,
  variables: Map<string, Variable>,
): ComponentSetNode {
  const definition = requireComponentDefinition('component.badge');
  const types = requireVariantValues(definition, 'Type');
  let componentSet: ComponentSetNode;
  if (!existing) {
    const variants = types.map((type, index) => {
      const component = figma.createComponent();
      component.name = `Type=${type}`;
      component.x = (index % 4) * 150;
      component.y = Math.floor(index / 4) * 52;
      configureBadgeVariant(component, type, variables);
      return component;
    });
    componentSet = figma.combineAsVariants(variants, figma.currentPage);
    componentSet.x = 0;
    componentSet.y = 140;
  } else {
    if (existing.type !== 'COMPONENT_SET') {
      throw new Error('Tasklify Badge identity points to a non-Component Set');
    }
    componentSet = existing;
    const variants = requireExactVariants(componentSet, types.map((type) => `Type=${type}`));
    for (const type of types) {
      configureBadgeVariant(variants.get(`Type=${type}`)!, type, variables);
    }
  }
  componentSet.name = definition.figma.name;
  componentSet.description = buildComponentDescription(definition);
  tagComponent(componentSet, definition.id);
  arrangeVariants(componentSet, 4, 150, 52);
  return componentSet;
}

function configureBadgeVariant(
  component: ComponentNode,
  type: string,
  variables: Map<string, Variable>,
): void {
  component.name = `Type=${type}`;
  configureAutoLayout(component, 'HORIZONTAL', 8, 4);
  bindNumeric(component, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  component.primaryAxisAlignItems = 'CENTER';
  component.counterAxisAlignItems = 'CENTER';
  bindNumeric(component, 'paddingLeft', variables, 'semantic.spacing.inline-tight');
  bindNumeric(component, 'paddingRight', variables, 'semantic.spacing.inline-tight');
  component.paddingTop = 5;
  component.paddingBottom = 5;
  bindNumeric(component, 'cornerRadius', variables, 'semantic.radius.container');
  const palette = badgePalette(type);
  bindFill(component, variables, palette.background);
  const label = ensureText(component, 'badge-label');
  configureText(label, badgeLabel(type), 10, false, variables, palette.foreground);
}

function syncStatCard(
  existing: ComponentNode | ComponentSetNode | undefined,
  variables: Map<string, Variable>,
): ComponentNode {
  const definition = requireComponentDefinition('component.stat-card');
  let component: ComponentNode;
  if (!existing) {
    component = figma.createComponent();
    component.x = 0;
    component.y = 320;
  } else {
    if (existing.type !== 'COMPONENT') {
      throw new Error('Tasklify Stat Card identity points to a non-Component');
    }
    component = existing;
  }
  component.name = definition.figma.name;
  component.description = buildComponentDescription(definition);
  tagComponent(component, definition.id);
  configureAutoLayout(component, 'VERTICAL', 12, 6);
  bindNumeric(component, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  component.resize(170, 92);
  component.primaryAxisSizingMode = 'FIXED';
  component.counterAxisSizingMode = 'FIXED';
  bindNumeric(component, 'paddingLeft', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingRight', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingTop', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingBottom', variables, 'semantic.spacing.component');
  bindNumeric(component, 'cornerRadius', variables, 'semantic.radius.card');
  bindFill(component, variables, 'semantic.surface.card');
  bindStroke(component, variables, 'semantic.border.subtle');
  component.strokeWeight = 1;
  const value = ensureText(component, 'stat-value');
  configureText(value, '216', 16, true, variables, 'semantic.text.primary');
  const label = ensureText(component, 'stat-label');
  configureText(label, 'Active Employees', 10, false, variables, 'semantic.text.secondary');
  const action = ensureText(component, 'stat-action');
  configureText(action, 'View Details →', 9, false, variables, 'semantic.text.secondary');
  return component;
}

function syncTaskCard(
  existing: ComponentNode | ComponentSetNode | undefined,
  badge: ComponentSetNode,
  variables: Map<string, Variable>,
): ComponentNode {
  const definition = requireComponentDefinition('component.task-card');
  let component: ComponentNode;
  if (!existing) {
    component = figma.createComponent();
    component.x = 220;
    component.y = 320;
  } else {
    if (existing.type !== 'COMPONENT') {
      throw new Error('Tasklify Task Card identity points to a non-Component');
    }
    component = existing;
  }
  component.name = definition.figma.name;
  component.description = buildComponentDescription(definition);
  tagComponent(component, definition.id);
  configureAutoLayout(component, 'VERTICAL', 12, 7);
  bindNumeric(component, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  component.resize(180, 138);
  component.primaryAxisSizingMode = 'FIXED';
  component.counterAxisSizingMode = 'FIXED';
  bindNumeric(component, 'paddingLeft', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingRight', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingTop', variables, 'semantic.spacing.component');
  bindNumeric(component, 'paddingBottom', variables, 'semantic.spacing.component');
  bindNumeric(component, 'cornerRadius', variables, 'semantic.radius.card');
  bindFill(component, variables, 'semantic.surface.card');
  bindStroke(component, variables, 'semantic.border.subtle');
  component.strokeWeight = 1;

  const meta = ensureFrame(component, 'task-meta');
  configureAutoLayout(meta, 'HORIZONTAL', 0, 8);
  meta.layoutSizingHorizontal = 'FILL';
  const id = ensureText(meta, 'task-id');
  configureText(id, 'WEB - 21', 9, false, variables, 'semantic.text.secondary');
  const priority = ensureComponentInstance(meta, 'task-priority', badge, { Type: 'urgent' });
  priority.layoutAlign = 'INHERIT';

  const title = ensureText(component, 'task-title');
  configureText(title, 'Partone Consultancy Website', 11, true, variables, 'semantic.text.primary');
  title.layoutSizingHorizontal = 'FILL';
  const project = ensureText(component, 'task-project');
  configureText(project, 'New Homepage', 9, false, variables, 'semantic.text.secondary');
  const due = ensureText(component, 'task-due');
  configureText(due, 'Due to: March 21, 25', 9, false, variables, 'semantic.text.secondary');
  const footer = ensureText(component, 'task-footer');
  configureText(footer, '● ● ●    ◌ 13    Mar 16, 2025', 8, false, variables, 'semantic.text.secondary');
  return component;
}

async function syncTasklifyRender(
  mode: 'desktop' | 'tablet',
  renderId: string,
  width: number,
  height: number,
  sidebarWidth: number,
  components: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): Promise<FrameNode> {
  const existingMatches = await findTasklifyRenders(renderId);
  if (existingMatches.length > 1) throw new Error(`Duplicate Tasklify render ID: ${renderId}`);
  let screen = existingMatches[0];
  const existingNodeId = screen?.id;
  if (!screen) {
    screen = figma.createFrame();
    screen.x = mode === 'desktop' ? 760 : 1780;
    screen.y = 0;
  }
  screen.name = `Tasklify / Dashboard Overview / ${mode === 'desktop' ? 'Desktop' : 'Tablet 834'}`;
  screen.resize(width, height);
  screen.layoutMode = 'HORIZONTAL';
  screen.primaryAxisSizingMode = 'FIXED';
  screen.counterAxisSizingMode = 'FIXED';
  screen.itemSpacing = 0;
  screen.clipsContent = true;
  bindFill(screen, variables, 'semantic.surface.canvas');
  setDesignSystemIdentity(screen);
  screen.setSharedPluginData(PLUGIN_DATA_NAMESPACE, SCREEN_ID_KEY, SCREEN_ID);
  screen.setSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY, renderId);

  const sidebar = ensureManagedFrame(screen, renderId, 'sidebar');
  configureSidebar(sidebar, renderId, mode, sidebarWidth, height, variables);
  const workspace = ensureManagedFrame(screen, renderId, 'workspace');
  configureWorkspace(
    workspace,
    renderId,
    mode,
    width - sidebarWidth,
    height,
    components,
    variables,
  );
  orderManagedChildren(screen, [sidebar, workspace]);
  removeStaleManagedChildren(screen, renderId, new Set(['sidebar', 'workspace']));

  if (existingNodeId && screen.id !== existingNodeId) {
    throw new Error(`Tasklify render node identity changed during UPDATE: ${renderId}`);
  }
  return screen;
}

async function findTasklifyRenders(renderId: string): Promise<FrameNode[]> {
  await figma.loadAllPagesAsync();
  return figma.root.findAll(
    (node) =>
      node.type === 'FRAME' &&
      hasDesignSystemIdentity(node) &&
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SCREEN_ID_KEY) === SCREEN_ID &&
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY) === renderId,
  ) as FrameNode[];
}

function configureSidebar(
  sidebar: FrameNode,
  renderId: string,
  mode: 'desktop' | 'tablet',
  width: number,
  height: number,
  variables: Map<string, Variable>,
): void {
  configureFixedFrame(sidebar, 'VERTICAL', width, height, 12, 10);
  bindNumeric(sidebar, 'itemSpacing', variables, 'semantic.spacing.component');
  bindFill(sidebar, variables, 'semantic.surface.sidebar');
  bindNumeric(sidebar, 'paddingLeft', variables, 'semantic.spacing.component');
  bindNumeric(sidebar, 'paddingRight', variables, 'semantic.spacing.component');
  bindNumeric(sidebar, 'paddingTop', variables, 'semantic.spacing.component');
  bindNumeric(sidebar, 'paddingBottom', variables, 'semantic.spacing.component');

  const brand = ensureManagedText(sidebar, renderId, 'sidebar.brand');
  configureText(
    brand,
    mode === 'desktop' ? '✦  Tasklify  PRO' : '✦',
    mode === 'desktop' ? 12 : 18,
    true,
    variables,
    'semantic.text.primary',
  );
  const account = ensureManagedText(sidebar, renderId, 'sidebar.account');
  configureText(
    account,
    mode === 'desktop' ? 'landerestudio@gmail.com' : '•••',
    8,
    false,
    variables,
    'semantic.text.secondary',
  );
  const search = ensureManagedFrame(sidebar, renderId, 'sidebar.search');
  configureAutoLayout(search, 'HORIZONTAL', 8, 6);
  search.layoutSizingHorizontal = 'FILL';
  bindNumeric(search, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(search, variables, 'semantic.surface.card');
  const searchText = ensureManagedText(search, renderId, 'sidebar.search.label');
  configureText(
    searchText,
    mode === 'desktop' ? '⌕  Search' : '⌕',
    9,
    false,
    variables,
    'semantic.text.secondary',
  );

  const nav = ensureManagedFrame(sidebar, renderId, 'sidebar.nav');
  configureAutoLayout(nav, 'VERTICAL', 0, 6);
  bindNumeric(nav, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  nav.layoutSizingHorizontal = 'FILL';
  const navItems = ['Overview', 'Tasks', 'Calendar', 'Chat', 'Reporting', 'Workflow'];
  const navNodes: SceneNode[] = [];
  navItems.forEach((label, index) => {
    const item = ensureManagedFrame(nav, renderId, `sidebar.nav.${label.toLowerCase()}`);
    configureAutoLayout(item, 'HORIZONTAL', 8, 6);
    item.layoutSizingHorizontal = 'FILL';
    bindNumeric(item, 'cornerRadius', variables, 'semantic.radius.control');
    bindFill(
      item,
      variables,
      index === 0 ? 'semantic.surface.card' : 'semantic.surface.sidebar',
    );
    const text = ensureManagedText(item, renderId, `sidebar.nav.${label.toLowerCase()}.label`);
    configureText(
      text,
      mode === 'desktop' ? `${navGlyph(index)}  ${label}` : navGlyph(index),
      mode === 'desktop' ? 9 : 13,
      index === 0,
      variables,
      'semantic.text.primary',
    );
    navNodes.push(item);
    removeStaleManagedChildren(
      item,
      renderId,
      new Set([`sidebar.nav.${label.toLowerCase()}.label`]),
    );
  });
  orderManagedChildren(nav, navNodes);
  removeStaleManagedChildren(
    nav,
    renderId,
    new Set(navItems.map((label) => `sidebar.nav.${label.toLowerCase()}`)),
  );

  const spacer = ensureManagedFrame(sidebar, renderId, 'sidebar.spacer');
  spacer.resize(Math.max(1, width - 24), 1);
  spacer.layoutGrow = 1;
  spacer.fills = [];
  const footer = ensureManagedText(sidebar, renderId, 'sidebar.footer');
  configureText(
    footer,
    mode === 'desktop' ? '?  Help Center\n⚙  Settings\n\nDavid Johnson' : '?\n⚙\n\n●',
    mode === 'desktop' ? 9 : 12,
    false,
    variables,
    'semantic.text.primary',
  );

  orderManagedChildren(sidebar, [brand, account, search, nav, spacer, footer]);
  removeStaleManagedChildren(
    sidebar,
    renderId,
    new Set([
      'sidebar.brand',
      'sidebar.account',
      'sidebar.search',
      'sidebar.nav',
      'sidebar.spacer',
      'sidebar.footer',
    ]),
  );
}

function configureWorkspace(
  workspace: FrameNode,
  renderId: string,
  mode: 'desktop' | 'tablet',
  width: number,
  height: number,
  components: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): void {
  configureFixedFrame(workspace, 'VERTICAL', width, height, 0, 0);
  bindFill(workspace, variables, 'semantic.surface.canvas');
  const topbar = ensureManagedFrame(workspace, renderId, 'workspace.topbar');
  configureTopbar(topbar, renderId, width, components, variables);
  const content = ensureManagedFrame(workspace, renderId, 'workspace.content');
  configureContent(content, renderId, mode, width, height - 56, components, variables);
  orderManagedChildren(workspace, [topbar, content]);
  removeStaleManagedChildren(
    workspace,
    renderId,
    new Set(['workspace.topbar', 'workspace.content']),
  );
}

function configureTopbar(
  topbar: FrameNode,
  renderId: string,
  width: number,
  components: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): void {
  configureFixedFrame(topbar, 'HORIZONTAL', width, 56, 12, 10);
  bindNumeric(topbar, 'itemSpacing', variables, 'semantic.spacing.component');
  topbar.primaryAxisAlignItems = 'SPACE_BETWEEN';
  topbar.counterAxisAlignItems = 'CENTER';
  bindFill(topbar, variables, 'semantic.surface.card');
  const breadcrumb = ensureManagedText(topbar, renderId, 'topbar.breadcrumb');
  configureText(
    breadcrumb,
    'Dashboard  /  Overview',
    9,
    false,
    variables,
    'semantic.text.secondary',
  );
  const actions = ensureManagedFrame(topbar, renderId, 'topbar.actions');
  configureAutoLayout(actions, 'HORIZONTAL', 0, 8);
  actions.counterAxisAlignItems = 'CENTER';
  const avatars = ensureManagedText(actions, renderId, 'topbar.avatars');
  configureText(avatars, '● ● ● +4', 10, false, variables, 'semantic.text.secondary');
  const utilities = ensureManagedText(actions, renderId, 'topbar.utilities');
  configureText(utilities, '⚙   ◇', 11, false, variables, 'semantic.text.primary');
  const button = ensureManagedInstance(
    actions,
    renderId,
    'topbar.create-task',
    requireComponent(components, 'component.button'),
    { Type: 'primary' },
  );
  orderManagedChildren(actions, [avatars, utilities, button]);
  removeStaleManagedChildren(
    actions,
    renderId,
    new Set(['topbar.avatars', 'topbar.utilities', 'topbar.create-task']),
  );
  orderManagedChildren(topbar, [breadcrumb, actions]);
  removeStaleManagedChildren(
    topbar,
    renderId,
    new Set(['topbar.breadcrumb', 'topbar.actions']),
  );
}

function configureContent(
  content: FrameNode,
  renderId: string,
  mode: 'desktop' | 'tablet',
  width: number,
  height: number,
  components: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): void {
  configureFixedFrame(content, 'VERTICAL', width, height, 12, 12);
  bindNumeric(content, 'itemSpacing', variables, 'semantic.spacing.component');
  bindNumeric(content, 'paddingLeft', variables, 'semantic.spacing.component');
  bindNumeric(content, 'paddingRight', variables, 'semantic.spacing.component');
  bindNumeric(content, 'paddingTop', variables, 'semantic.spacing.component');
  bindNumeric(content, 'paddingBottom', variables, 'semantic.spacing.component');
  bindFill(content, variables, 'semantic.surface.canvas');
  const summary = ensureManagedFrame(content, renderId, 'content.summary');
  configureSummary(summary, renderId, mode, width - 24, components, variables);
  const toolbar = ensureManagedFrame(content, renderId, 'content.toolbar');
  configureToolbar(toolbar, renderId, width - 24, variables);
  const boardViewport = ensureManagedFrame(content, renderId, 'content.board-viewport');
  configureBoardViewport(
    boardViewport,
    renderId,
    mode,
    width - 24,
    Math.max(330, height - (mode === 'desktop' ? 284 : 392)),
    components,
    variables,
  );
  orderManagedChildren(content, [summary, toolbar, boardViewport]);
  removeStaleManagedChildren(
    content,
    renderId,
    new Set(['content.summary', 'content.toolbar', 'content.board-viewport']),
  );
}

function configureSummary(
  summary: FrameNode,
  renderId: string,
  mode: 'desktop' | 'tablet',
  width: number,
  components: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): void {
  configureAutoLayout(summary, 'VERTICAL', 0, 8);
  bindNumeric(summary, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  summary.resize(width, mode === 'desktop' ? 196 : 304);
  summary.primaryAxisSizingMode = 'FIXED';
  summary.counterAxisSizingMode = 'FIXED';
  summary.fills = [];
  const heading = ensureManagedText(summary, renderId, 'summary.heading');
  configureText(
    heading,
    'Welcome Back David..!',
    mode === 'desktop' ? 16 : 18,
    true,
    variables,
    'semantic.text.primary',
  );
  const subheading = ensureManagedText(summary, renderId, 'summary.subheading');
  configureText(
    subheading,
    'Stay on top of your tasks, monitor progress, and track status.',
    10,
    false,
    variables,
    'semantic.text.secondary',
  );
  const banner = ensureManagedFrame(summary, renderId, 'summary.banner');
  configureAutoLayout(banner, 'HORIZONTAL', 8, 8);
  banner.layoutSizingHorizontal = 'FILL';
  banner.primaryAxisAlignItems = 'SPACE_BETWEEN';
  banner.counterAxisAlignItems = 'CENTER';
  bindNumeric(banner, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(banner, variables, 'semantic.surface.sidebar');
  const bannerCopy = ensureManagedText(banner, renderId, 'summary.banner.copy');
  configureText(
    bannerCopy,
    '✦  Tasklify AI is now available. Access your activity and timeline right away.',
    9,
    false,
    variables,
    'semantic.text.primary',
  );
  const bannerAction = ensureManagedText(banner, renderId, 'summary.banner.action');
  configureText(
    bannerAction,
    'View Details',
    9,
    true,
    variables,
    'semantic.text.primary',
  );
  orderManagedChildren(banner, [bannerCopy, bannerAction]);
  removeStaleManagedChildren(
    banner,
    renderId,
    new Set(['summary.banner.copy', 'summary.banner.action']),
  );

  const stats = ensureManagedFrame(summary, renderId, 'summary.stats');
  configureAutoLayout(stats, mode === 'desktop' ? 'HORIZONTAL' : 'VERTICAL', 0, 10);
  bindNumeric(stats, 'itemSpacing', variables, 'semantic.spacing.component');
  stats.layoutSizingHorizontal = 'FILL';
  const statData = [
    ['216', 'Active Employees'],
    ['312', 'Active Projects'],
    ['184', 'Number of Task'],
    ['84.12%', 'Target Percentage Completed'],
  ];
  const statNodes: SceneNode[] = [];
  if (mode === 'desktop') {
    statData.forEach(([value, label], index) => {
      const instance = ensureManagedInstance(
        stats,
        renderId,
        `summary.stat.${index + 1}`,
        requireComponent(components, 'component.stat-card'),
      );
      instance.layoutSizingHorizontal = 'FILL';
      overrideInstanceText(instance, 'stat-value', value);
      overrideInstanceText(instance, 'stat-label', label);
      statNodes.push(instance);
    });
  } else {
    for (let rowIndex = 0; rowIndex < 2; rowIndex += 1) {
      const row = ensureManagedFrame(stats, renderId, `summary.stats.row.${rowIndex + 1}`);
      configureAutoLayout(row, 'HORIZONTAL', 0, 10);
      bindNumeric(row, 'itemSpacing', variables, 'semantic.spacing.component');
      row.layoutSizingHorizontal = 'FILL';
      const rowNodes: SceneNode[] = [];
      for (let columnIndex = 0; columnIndex < 2; columnIndex += 1) {
        const dataIndex = rowIndex * 2 + columnIndex;
        const [value, label] = statData[dataIndex];
        const instance = ensureManagedInstance(
          row,
          renderId,
          `summary.stat.${dataIndex + 1}`,
          requireComponent(components, 'component.stat-card'),
        );
        instance.layoutSizingHorizontal = 'FILL';
        overrideInstanceText(instance, 'stat-value', value);
        overrideInstanceText(instance, 'stat-label', label);
        rowNodes.push(instance);
      }
      orderManagedChildren(row, rowNodes);
      removeStaleManagedChildren(
        row,
        renderId,
        new Set([
          `summary.stat.${rowIndex * 2 + 1}`,
          `summary.stat.${rowIndex * 2 + 2}`,
        ]),
      );
      statNodes.push(row);
    }
  }
  orderManagedChildren(stats, statNodes);
  removeStaleManagedChildren(
    stats,
    renderId,
    new Set(
      mode === 'desktop'
        ? statData.map((_, index) => `summary.stat.${index + 1}`)
        : ['summary.stats.row.1', 'summary.stats.row.2'],
    ),
  );
  orderManagedChildren(summary, [heading, subheading, banner, stats]);
  removeStaleManagedChildren(
    summary,
    renderId,
    new Set(['summary.heading', 'summary.subheading', 'summary.banner', 'summary.stats']),
  );
}

function configureToolbar(
  toolbar: FrameNode,
  renderId: string,
  width: number,
  variables: Map<string, Variable>,
): void {
  configureFixedFrame(toolbar, 'HORIZONTAL', width, 40, 0, 8);
  bindNumeric(toolbar, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  toolbar.primaryAxisAlignItems = 'SPACE_BETWEEN';
  toolbar.counterAxisAlignItems = 'CENTER';
  toolbar.fills = [];
  const views = ensureManagedFrame(toolbar, renderId, 'toolbar.views');
  configureAutoLayout(views, 'HORIZONTAL', 4, 6);
  bindNumeric(views, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(views, variables, 'semantic.surface.sidebar');
  const viewsText = ensureManagedText(views, renderId, 'toolbar.views.label');
  configureText(
    viewsText,
    '▣ Kanban    ≡ Timeline    ▦ Spreadsheet    □ Calendar',
    9,
    false,
    variables,
    'semantic.text.primary',
  );
  const controls = ensureManagedText(toolbar, renderId, 'toolbar.controls');
  configureText(
    controls,
    '▽   ↕   ⚡   ⌕   •••     New ▾',
    10,
    true,
    variables,
    'semantic.text.primary',
  );
  orderManagedChildren(toolbar, [views, controls]);
  removeStaleManagedChildren(
    toolbar,
    renderId,
    new Set(['toolbar.views', 'toolbar.controls']),
  );
}

function configureBoardViewport(
  viewport: FrameNode,
  renderId: string,
  mode: 'desktop' | 'tablet',
  width: number,
  height: number,
  components: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): void {
  viewport.resize(width, height);
  viewport.layoutMode = 'NONE';
  viewport.clipsContent = true;
  viewport.fills = [];
  const board = ensureManagedFrame(viewport, renderId, 'board.columns');
  const boardWidth = mode === 'desktop' ? width : 900;
  configureFixedFrame(board, 'HORIZONTAL', boardWidth, height, 0, 10);
  bindNumeric(board, 'itemSpacing', variables, 'semantic.spacing.component');
  board.x = 0;
  board.y = 0;
  board.fills = [];
  const columnWidth = mode === 'desktop' ? (boardWidth - 30) / 4 : 217.5;
  const columns = [
    { id: 'not-started', label: 'Not Started', type: 'neutral' },
    { id: 'pending', label: 'Pending', type: 'pending' },
    { id: 'completed', label: 'Completed', type: 'completed' },
    { id: 'under-review', label: 'Under Review', type: 'review' },
  ];
  const columnNodes: SceneNode[] = [];
  columns.forEach((column, index) => {
    const frame = ensureManagedFrame(board, renderId, `board.column.${column.id}`);
    configureFixedFrame(frame, 'VERTICAL', columnWidth, height, 0, 8);
    bindNumeric(frame, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
    frame.fills = [];
    const header = ensureManagedFrame(
      frame,
      renderId,
      `board.column.${column.id}.header`,
    );
    configureAutoLayout(header, 'HORIZONTAL', 0, 6);
    header.layoutSizingHorizontal = 'FILL';
    header.primaryAxisAlignItems = 'SPACE_BETWEEN';
    const badge = ensureManagedInstance(
      header,
      renderId,
      `board.column.${column.id}.badge`,
      requireComponent(components, 'component.badge'),
      { Type: column.type },
    );
    overrideInstanceText(badge, 'badge-label', column.label);
    const menu = ensureManagedText(
      header,
      renderId,
      `board.column.${column.id}.menu`,
    );
    configureText(menu, '24     ⋮', 9, false, variables, 'semantic.text.secondary');
    orderManagedChildren(header, [badge, menu]);
    removeStaleManagedChildren(
      header,
      renderId,
      new Set([
        `board.column.${column.id}.badge`,
        `board.column.${column.id}.menu`,
      ]),
    );

    const firstTask = ensureManagedInstance(
      frame,
      renderId,
      `board.column.${column.id}.task.1`,
      requireComponent(components, 'component.task-card'),
    );
    firstTask.layoutSizingHorizontal = 'FILL';
    applyTaskOverrides(firstTask, taskExample(index, 0));
    const secondTask = ensureManagedInstance(
      frame,
      renderId,
      `board.column.${column.id}.task.2`,
      requireComponent(components, 'component.task-card'),
    );
    secondTask.layoutSizingHorizontal = 'FILL';
    applyTaskOverrides(secondTask, taskExample(index, 1));
    const add = ensureManagedFrame(frame, renderId, `board.column.${column.id}.add`);
    configureAutoLayout(add, 'HORIZONTAL', 8, 4);
    add.layoutSizingHorizontal = 'FILL';
    add.primaryAxisAlignItems = 'CENTER';
    bindNumeric(add, 'cornerRadius', variables, 'semantic.radius.control');
    bindFill(add, variables, 'semantic.surface.card');
    bindStroke(add, variables, 'semantic.border.subtle');
    add.strokeWeight = 1;
    const addText = ensureManagedText(
      add,
      renderId,
      `board.column.${column.id}.add.label`,
    );
    configureText(addText, '+  New Page', 9, false, variables, 'semantic.text.primary');
    orderManagedChildren(add, [addText]);
    removeStaleManagedChildren(
      add,
      renderId,
      new Set([`board.column.${column.id}.add.label`]),
    );
    orderManagedChildren(frame, [header, firstTask, secondTask, add]);
    removeStaleManagedChildren(
      frame,
      renderId,
      new Set([
        `board.column.${column.id}.header`,
        `board.column.${column.id}.task.1`,
        `board.column.${column.id}.task.2`,
        `board.column.${column.id}.add`,
      ]),
    );
    columnNodes.push(frame);
  });
  orderManagedChildren(board, columnNodes);
  removeStaleManagedChildren(
    board,
    renderId,
    new Set(columns.map((column) => `board.column.${column.id}`)),
  );
  orderManagedChildren(viewport, [board]);
  removeStaleManagedChildren(viewport, renderId, new Set(['board.columns']));
}

async function validateTasklifyStructure(
  collection: VariableCollection,
  variables: Map<string, Variable>,
  components: Map<string, ComponentNode | ComponentSetNode>,
  desktop: FrameNode,
  tablet: FrameNode,
): Promise<void> {
  const [collections, localVariables, foundComponents, desktopRenders, tabletRenders] =
    await Promise.all([
      figma.variables.getLocalVariableCollectionsAsync(),
      figma.variables.getLocalVariablesAsync(),
      findTasklifyComponents(),
      findTasklifyRenders(DESKTOP_RENDER_ID),
      findTasklifyRenders(TABLET_RENDER_ID),
    ]);
  const scopedCollections = collections.filter(
    (candidate) =>
      hasDesignSystemIdentity(candidate) &&
      candidate.getSharedPluginData(PLUGIN_DATA_NAMESPACE, COLLECTION_ID_KEY) ===
        FOUNDATION_COLLECTION_ID,
  );
  if (scopedCollections.length !== 1 || scopedCollections[0].id !== collection.id) {
    throw new Error('Tasklify idempotency failed: expected one scoped Collection');
  }
  const scopedVariables = localVariables.filter(
    (variable) =>
      variable.variableCollectionId === collection.id &&
      hasDesignSystemIdentity(variable),
  );
  if (scopedVariables.length !== allTokens.length || variables.size !== allTokens.length) {
    throw new Error(
      `Tasklify idempotency failed: expected ${allTokens.length} scoped Variables`,
    );
  }
  for (const token of allTokens) {
    const variable = requireVariable(variables, token.id);
    if (token.alias) {
      const value = variable.valuesByMode[collection.defaultModeId];
      if (
        typeof value !== 'object' ||
        value === null ||
        !('type' in value) ||
        value.type !== 'VARIABLE_ALIAS' ||
        !('id' in value) ||
        value.id !== requireVariable(variables, token.alias).id
      ) {
        throw new Error(`Tasklify alias drift: ${token.id}`);
      }
    }
  }
  if (
    foundComponents.size !== TARGET_COMPONENT_IDS.length ||
    components.size !== TARGET_COMPONENT_IDS.length
  ) {
    throw new Error('Tasklify idempotency failed: expected four scoped Components');
  }
  if (
    desktopRenders.length !== 1 ||
    tabletRenders.length !== 1 ||
    desktopRenders[0].id !== desktop.id ||
    tabletRenders[0].id !== tablet.id
  ) {
    throw new Error('Tasklify idempotency failed: render identity drift');
  }
  const scopedInstances = figma.root.findAll(
    (node) =>
      node.type === 'INSTANCE' &&
      hasDesignSystemIdentity(node) &&
      Boolean(
        node.getSharedPluginData(
          PLUGIN_DATA_NAMESPACE,
          COMPONENT_ID_KEY,
        ),
      ),
  ) as InstanceNode[];
  for (const instance of scopedInstances) {
    const expectedComponentId = instance.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      COMPONENT_ID_KEY,
    );
    const mainComponent = await instance.getMainComponentAsync();
    if (!mainComponent) {
      throw new Error(`Tasklify Instance has no main Component: ${instance.name}`);
    }
    const owner =
      mainComponent.parent?.type === 'COMPONENT_SET'
        ? mainComponent.parent
        : mainComponent;
    if (
      !hasDesignSystemIdentity(owner) ||
      owner.getSharedPluginData(
        PLUGIN_DATA_NAMESPACE,
        COMPONENT_ID_KEY,
      ) !== expectedComponentId
    ) {
      throw new Error(`Tasklify Instance mainComponent drift: ${instance.name}`);
    }
  }
}

function ensureManagedFrame(
  parent: ContainerNode,
  renderId: string,
  nodeId: string,
): FrameNode {
  const matches = findManagedDirectChildren(parent, renderId, nodeId);
  if (matches.length > 1) throw new Error(`Duplicate Tasklify managed node: ${nodeId}`);
  let node = matches[0];
  if (node && node.type !== 'FRAME') {
    throw new Error(`Tasklify managed node type mismatch: ${nodeId}`);
  }
  if (!node) {
    node = figma.createFrame();
    parent.appendChild(node);
  }
  node.name = nodeId;
  tagManagedNode(node, renderId, nodeId);
  return node;
}

function ensureManagedText(
  parent: ContainerNode,
  renderId: string,
  nodeId: string,
): TextNode {
  const matches = findManagedDirectChildren(parent, renderId, nodeId);
  if (matches.length > 1) throw new Error(`Duplicate Tasklify managed node: ${nodeId}`);
  let node = matches[0];
  if (node && node.type !== 'TEXT') {
    throw new Error(`Tasklify managed node type mismatch: ${nodeId}`);
  }
  if (!node) {
    node = figma.createText();
    parent.appendChild(node);
  }
  node.name = nodeId;
  tagManagedNode(node, renderId, nodeId);
  return node;
}

function ensureManagedInstance(
  parent: ContainerNode,
  renderId: string,
  nodeId: string,
  component: ComponentNode | ComponentSetNode,
  properties: Record<string, string> = {},
): InstanceNode {
  const matches = findManagedDirectChildren(parent, renderId, nodeId);
  if (matches.length > 1) throw new Error(`Duplicate Tasklify managed node: ${nodeId}`);
  let node = matches[0];
  if (node && node.type !== 'INSTANCE') {
    throw new Error(`Tasklify managed node type mismatch: ${nodeId}`);
  }
  if (!node) {
    node =
      component.type === 'COMPONENT'
        ? component.createInstance()
        : component.defaultVariant.createInstance();
    parent.appendChild(node);
  } else {
    assertTaggedInstanceComponentIdentity(node, component);
  }
  if (Object.keys(properties).length) node.setProperties(properties);
  node.name = nodeId;
  tagManagedNode(node, renderId, nodeId);
  tagInstanceComponent(node, component);
  return node;
}

function findManagedDirectChildren(
  parent: ContainerNode,
  renderId: string,
  nodeId: string,
): SceneNode[] {
  return parent.children.filter(
    (child) =>
      hasDesignSystemIdentity(child) &&
      child.getSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY) === renderId &&
      child.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SLICE_NODE_ID_KEY) === nodeId,
  );
}

function removeStaleManagedChildren(
  parent: ContainerNode,
  renderId: string,
  desiredIds: Set<string>,
): void {
  for (const child of [...parent.children]) {
    if (!hasDesignSystemIdentity(child)) continue;
    if (child.getSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY) !== renderId) {
      continue;
    }
    const nodeId = child.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      SLICE_NODE_ID_KEY,
    );
    if (nodeId && !desiredIds.has(nodeId)) child.remove();
  }
}

function orderManagedChildren(parent: ContainerNode, children: SceneNode[]): void {
  children.forEach((child, index) => parent.insertChild(index, child));
}

function tagManagedNode(node: SceneNode, renderId: string, nodeId: string): void {
  setDesignSystemIdentity(node);
  node.setSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY, renderId);
  node.setSharedPluginData(PLUGIN_DATA_NAMESPACE, SLICE_NODE_ID_KEY, nodeId);
}

function setDesignSystemIdentity(node: PluginDataMixin): void {
  node.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    DESIGN_SYSTEM_ID_KEY,
    DESIGN_SYSTEM_ID,
  );
}

function hasDesignSystemIdentity(node: PluginDataMixin): boolean {
  return (
    node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, DESIGN_SYSTEM_ID_KEY) ===
    DESIGN_SYSTEM_ID
  );
}

function tagComponent(
  node: ComponentNode | ComponentSetNode,
  componentId: string,
): void {
  setDesignSystemIdentity(node);
  node.setSharedPluginData(PLUGIN_DATA_NAMESPACE, COMPONENT_ID_KEY, componentId);
}

function configureAutoLayout(
  node: AutoLayoutNode,
  mode: 'HORIZONTAL' | 'VERTICAL',
  padding: number,
  gap: number,
): void {
  node.layoutMode = mode;
  node.primaryAxisSizingMode = 'AUTO';
  node.counterAxisSizingMode = 'AUTO';
  node.paddingLeft = padding;
  node.paddingRight = padding;
  node.paddingTop = padding;
  node.paddingBottom = padding;
  node.itemSpacing = gap;
}

function configureFixedFrame(
  node: FrameNode,
  mode: 'HORIZONTAL' | 'VERTICAL',
  width: number,
  height: number,
  padding: number,
  gap: number,
): void {
  node.layoutMode = mode;
  node.resize(width, height);
  node.primaryAxisSizingMode = 'FIXED';
  node.counterAxisSizingMode = 'FIXED';
  node.paddingLeft = padding;
  node.paddingRight = padding;
  node.paddingTop = padding;
  node.paddingBottom = padding;
  node.itemSpacing = gap;
}

function ensureFrame(parent: ContainerNode, name: string): FrameNode {
  const matches = parent.children.filter(
    (child): child is FrameNode => child.type === 'FRAME' && child.name === name,
  );
  if (matches.length > 1) throw new Error(`Duplicate managed Component frame: ${name}`);
  const node = matches[0] ?? figma.createFrame();
  if (!matches[0]) parent.appendChild(node);
  node.name = name;
  return node;
}

function ensureText(parent: ContainerNode, name: string): TextNode {
  const matches = parent.children.filter(
    (child): child is TextNode => child.type === 'TEXT' && child.name === name,
  );
  if (matches.length > 1) throw new Error(`Duplicate managed Component text: ${name}`);
  const node = matches[0] ?? figma.createText();
  if (!matches[0]) parent.appendChild(node);
  node.name = name;
  return node;
}

function ensureComponentInstance(
  parent: ContainerNode,
  name: string,
  component: ComponentNode | ComponentSetNode,
  properties: Record<string, string>,
): InstanceNode {
  const matches = parent.children.filter(
    (child): child is InstanceNode => child.type === 'INSTANCE' && child.name === name,
  );
  if (matches.length > 1) throw new Error(`Duplicate managed Component instance: ${name}`);
  const node =
    matches[0] ??
    (component.type === 'COMPONENT'
      ? component.createInstance()
      : component.defaultVariant.createInstance());
  if (!matches[0]) parent.appendChild(node);
  else assertTaggedInstanceComponentIdentity(node, component);
  if (Object.keys(properties).length) node.setProperties(properties);
  node.name = name;
  tagInstanceComponent(node, component);
  return node;
}

function assertTaggedInstanceComponentIdentity(
  instance: InstanceNode,
  expected: ComponentNode | ComponentSetNode,
): void {
  const expectedComponentId = expected.getSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
  );
  const taggedComponentId = instance.getSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
  );
  if (taggedComponentId && taggedComponentId !== expectedComponentId) {
    throw new Error(`Tasklify Instance component identity mismatch: ${instance.name}`);
  }
}

function tagInstanceComponent(
  instance: InstanceNode,
  component: ComponentNode | ComponentSetNode,
): void {
  const componentId = component.getSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
  );
  if (!componentId) throw new Error(`Tasklify Component has no stable ID: ${component.name}`);
  setDesignSystemIdentity(instance);
  instance.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
    componentId,
  );
}

function configureText(
  text: TextNode,
  characters: string,
  size: number,
  semibold: boolean,
  variables: Map<string, Variable>,
  colorTokenId: string,
): void {
  text.fontName = semibold ? FONT_SEMIBOLD : FONT_REGULAR;
  text.fontSize = size;
  text.lineHeight = { unit: 'AUTO' };
  text.textAutoResize = 'WIDTH_AND_HEIGHT';
  text.characters = characters;
  bindFill(text, variables, colorTokenId);
}

function overrideInstanceText(instance: InstanceNode, name: string, value: string): void {
  const node = instance.findOne(
    (candidate) => candidate.type === 'TEXT' && candidate.name === name,
  ) as TextNode | null;
  if (!node) throw new Error(`Tasklify Instance text override target missing: ${name}`);
  node.characters = value;
}

function applyTaskOverrides(
  instance: InstanceNode,
  data: {
    id: string;
    title: string;
    project: string;
    due: string;
    footer: string;
    priority: string;
  },
): void {
  overrideInstanceText(instance, 'task-id', data.id);
  overrideInstanceText(instance, 'task-title', data.title);
  overrideInstanceText(instance, 'task-project', data.project);
  overrideInstanceText(instance, 'task-due', data.due);
  overrideInstanceText(instance, 'task-footer', data.footer);
  const priority = instance.findOne(
    (candidate) =>
      candidate.type === 'INSTANCE' && candidate.name === 'task-priority',
  ) as InstanceNode | null;
  if (!priority) throw new Error('Tasklify Task Card priority Instance is missing');
  priority.setProperties({ Type: data.priority });
}

function bindFill(
  node: PaintNode,
  variables: Map<string, Variable>,
  tokenId: string,
): void {
  const variable = requireVariable(variables, tokenId);
  const tokenHex = requireResolvedColor(tokenId);
  const fills = node.fills === figma.mixed ? [] : [...node.fills];
  const existingIndex = fills.findIndex((paint) => paint.type === 'SOLID');
  const existing = existingIndex >= 0 ? (fills[existingIndex] as SolidPaint) : undefined;
  const paint = existing
    ? figma.util.solidPaint(tokenHex, existing)
    : figma.util.solidPaint(tokenHex);
  const bound = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
  if (existingIndex >= 0) fills[existingIndex] = bound;
  else fills.push(bound);
  node.fills = fills;
}

function bindStroke(
  node: FrameNode | ComponentNode,
  variables: Map<string, Variable>,
  tokenId: string,
): void {
  const variable = requireVariable(variables, tokenId);
  const tokenHex = requireResolvedColor(tokenId);
  const strokes = [...node.strokes];
  const existingIndex = strokes.findIndex((paint) => paint.type === 'SOLID');
  const existing = existingIndex >= 0 ? (strokes[existingIndex] as SolidPaint) : undefined;
  const paint = existing
    ? figma.util.solidPaint(tokenHex, existing)
    : figma.util.solidPaint(tokenHex);
  const bound = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
  if (existingIndex >= 0) strokes[existingIndex] = bound;
  else strokes.push(bound);
  node.strokes = strokes;
}

function bindNumeric(
  node: AutoLayoutNode,
  field:
    | 'itemSpacing'
    | 'paddingLeft'
    | 'paddingRight'
    | 'paddingTop'
    | 'paddingBottom'
    | 'cornerRadius',
  variables: Map<string, Variable>,
  tokenId: string,
): void {
  const value = requireResolvedFloat(tokenId);
  if (field === 'cornerRadius') node.cornerRadius = value;
  else node[field] = value;
  node.setBoundVariable(field, requireVariable(variables, tokenId));
}

function requireVariable(variables: Map<string, Variable>, id: string): Variable {
  const variable = variables.get(id);
  if (!variable) throw new Error(`Tasklify Variable missing: ${id}`);
  return variable;
}

function resolveTokenLiteral(id: string, seen = new Set<string>()): string | number {
  if (seen.has(id)) throw new Error(`Tasklify token alias cycle: ${id}`);
  seen.add(id);
  const token = tokenById.get(id);
  if (!token) throw new Error(`Tasklify token missing: ${id}`);
  if (token.value !== undefined) return token.value;
  if (!token.alias) throw new Error(`Tasklify token has no value or alias: ${id}`);
  return resolveTokenLiteral(token.alias, seen);
}

function requireResolvedColor(id: string): string {
  const token = tokenById.get(id);
  const value = resolveTokenLiteral(id);
  if (!token || token.type !== 'COLOR' || typeof value !== 'string') {
    throw new Error(`Tasklify COLOR token required: ${id}`);
  }
  return value;
}

function requireResolvedFloat(id: string): number {
  const token = tokenById.get(id);
  const value = resolveTokenLiteral(id);
  if (!token || token.type !== 'FLOAT' || typeof value !== 'number') {
    throw new Error(`Tasklify FLOAT token required: ${id}`);
  }
  return value;
}

function requireStringValue(token: FoundationToken): string {
  if (typeof token.value !== 'string') throw new Error(`Expected COLOR value: ${token.id}`);
  return token.value;
}

function requireNumberValue(token: FoundationToken): number {
  if (typeof token.value !== 'number') throw new Error(`Expected FLOAT value: ${token.id}`);
  return token.value;
}

function requireAlias(token: FoundationToken): string {
  if (!token.alias) throw new Error(`Expected alias: ${token.id}`);
  return token.alias;
}

function requireTasklifyScreen(): ScreenDefinition {
  const screen = screenSchema.screens.find((candidate) => candidate.id === SCREEN_ID);
  if (!screen) throw new Error(`Missing Tasklify Screen: ${SCREEN_ID}`);
  return screen;
}

function requireTabletBreakpoint(screen: ScreenDefinition) {
  const breakpoint = screen.responsive.breakpoints.find(
    (candidate) => candidate.id === 'breakpoint.tablet',
  );
  if (!breakpoint) throw new Error('Missing Tasklify Tablet breakpoint');
  return breakpoint;
}

function requireComponentDefinition(id: string): ComponentDefinition {
  const component = componentById.get(id);
  if (!component) throw new Error(`Missing Tasklify Component definition: ${id}`);
  return component;
}

function requireComponent(
  components: Map<string, ComponentNode | ComponentSetNode>,
  id: string,
): ComponentNode | ComponentSetNode {
  const component = components.get(id);
  if (!component) throw new Error(`Tasklify Component was not synced: ${id}`);
  return component;
}

function requireVariantValues(
  definition: ComponentDefinition,
  propertyName: string,
): string[] {
  const property = definition.properties.find(
    (candidate) => candidate.kind === 'variant' && candidate.name === propertyName,
  );
  if (!property?.values?.length) {
    throw new Error(`${definition.id} is missing Variant Property ${propertyName}`);
  }
  return property.values;
}

function assertVariantValues(
  definition: ComponentDefinition,
  propertyName: string,
  expected: string[],
): void {
  const actual = requireVariantValues(definition, propertyName);
  if (
    actual.length !== expected.length ||
    expected.some((value) => !actual.includes(value))
  ) {
    throw new Error(`${definition.id} has unsupported ${propertyName} values`);
  }
}

function requireExactVariants(
  set: ComponentSetNode,
  names: string[],
): Map<string, ComponentNode> {
  const variants = set.children.filter(
    (child): child is ComponentNode => child.type === 'COMPONENT',
  );
  if (variants.length !== names.length) {
    throw new Error(`${set.name} must contain exactly ${names.length} variants`);
  }
  const result = new Map<string, ComponentNode>();
  for (const variant of variants) {
    if (!names.includes(variant.name) || result.has(variant.name)) {
      throw new Error(`${set.name} has unexpected or duplicate Variant: ${variant.name}`);
    }
    result.set(variant.name, variant);
  }
  return result;
}

function arrangeVariants(
  set: ComponentSetNode,
  columns: number,
  columnWidth: number,
  rowHeight: number,
): void {
  const variants = set.children.filter(
    (child): child is ComponentNode => child.type === 'COMPONENT',
  );
  variants.forEach((variant, index) => {
    variant.x = 24 + (index % columns) * columnWidth;
    variant.y = 24 + Math.floor(index / columns) * rowHeight;
  });
}

function buildComponentDescription(definition: ComponentDefinition): string {
  const lines = [definition.description, '', `Purpose: ${definition.purpose}`];
  if (definition.documentation?.usage?.length) {
    lines.push('', 'Usage:', ...definition.documentation.usage.map((item) => `• ${item}`));
  }
  if (definition.documentation?.dont?.length) {
    lines.push('', "Don't:", ...definition.documentation.dont.map((item) => `• ${item}`));
  }
  lines.push(
    '',
    Object.keys(definition.accessibility ?? {}).length
      ? `Accessibility: ${JSON.stringify(definition.accessibility)}`
      : 'Accessibility: No additional fields declared in the Slice 01 contract.',
  );
  return lines.join('\n');
}

function badgePalette(type: string): { foreground: string; background: string } {
  if (type === 'pending' || type === 'urgent') {
    return {
      foreground: 'semantic.status.pending.foreground',
      background: 'semantic.status.pending.background',
    };
  }
  if (type === 'completed' || type === 'low') {
    return {
      foreground: 'semantic.status.completed.foreground',
      background: 'semantic.status.completed.background',
    };
  }
  if (type === 'review' || type === 'medium') {
    return {
      foreground: 'semantic.status.review.foreground',
      background: 'semantic.status.review.background',
    };
  }
  return {
    foreground: 'semantic.text.primary',
    background: 'semantic.surface.sidebar',
  };
}

function badgeLabel(type: string): string {
  const labels: Record<string, string> = {
    neutral: 'Not Started',
    urgent: 'Urgent',
    low: 'Low',
    medium: 'Medium',
    pending: 'Pending',
    completed: 'Completed',
    review: 'Under Review',
  };
  return labels[type] ?? type;
}

function navGlyph(index: number): string {
  return ['⌁', '□', '▣', '◌', '≡', '⌘'][index] ?? '•';
}

function taskExample(
  columnIndex: number,
  taskIndex: number,
): {
  id: string;
  title: string;
  project: string;
  due: string;
  footer: string;
  priority: string;
} {
  const examples = [
    [
      ['WEB - 21', 'Partone Consultancy Website', 'New Homepage', 'Due to: March 21, 25', '● ● ●    ◌ 13    Mar 16, 2025', 'urgent'],
      ['WEB - 68', 'Design Wireframes - Homepage', 'New Homepage', 'Due to: Jan 12, 25', '●          ◌ 08    Jan 02, 2025', 'medium'],
    ],
    [
      ['WEB - 28', 'Modify Content for Homepage', 'New Homepage', 'Due to: May 23, 25', '● ●       ◌ 16    May 18, 2025', 'urgent'],
      ['WEB - 44', 'Review Navigation Content', 'Website Update', 'Due to: May 28, 25', '●          ◌ 06    May 20, 2025', 'medium'],
    ],
    [
      ['WEB - 12', 'MTC Design Approval', 'New Homepage', 'Due to: March 10, 25', '● ● ●    ◌ 10    Mar 04, 2025', 'low'],
      ['WEB - 97', 'Nexa Components Revision', 'UI - Design System', 'Due to: March 29, 25', '● ●       ◌ 28    Mar 12, 2025', 'medium'],
    ],
    [
      ['WEB - 88', 'Vo1 Components Design System', 'Components & Elements', 'Due to: March 20, 25', '●          ◌ 14    Mar 06, 2025', 'urgent'],
      ['WEB - 93', 'Document Component States', 'UI - Design System', 'Due to: April 02, 25', '● ●       ◌ 11    Mar 22, 2025', 'medium'],
    ],
  ] as const;
  const [id, title, project, due, footer, priority] = examples[columnIndex][taskIndex];
  return { id, title, project, due, footer, priority };
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Unsupported Tasklify color: ${hex}`);
  }
  return {
    r: Number.parseInt(normalized.slice(0, 2), 16) / 255,
    g: Number.parseInt(normalized.slice(2, 4), 16) / 255,
    b: Number.parseInt(normalized.slice(4, 6), 16) / 255,
  };
}
