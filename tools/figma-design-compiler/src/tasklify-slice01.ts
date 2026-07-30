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
type StrokeNode = FrameNode | ComponentNode | VectorNode | LineNode | RectangleNode | EllipseNode;
type IconName =
  | 'Search'
  | 'Overview'
  | 'Tasks'
  | 'Calendar'
  | 'Chat'
  | 'Reporting'
  | 'Workflow'
  | 'Settings'
  | 'Help'
  | 'Filter'
  | 'Sort'
  | 'Automation'
  | 'More'
  | 'Plus'
  | 'Link'
  | 'Flag'
  | 'Comment'
  | 'Check'
  | 'ChevronDown';

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
  'component.icon',
  'component.button',
  'component.badge',
  'component.stat-card',
  'component.task-card',
] as const;
const ICON_NAMES: IconName[] = [
  'Search',
  'Overview',
  'Tasks',
  'Calendar',
  'Chat',
  'Reporting',
  'Workflow',
  'Settings',
  'Help',
  'Filter',
  'Sort',
  'Automation',
  'More',
  'Plus',
  'Link',
  'Flag',
  'Comment',
  'Check',
  'ChevronDown',
];

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
  const icon = requireComponentDefinition('component.icon');
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
  assertVariantValues(icon, 'Name', ICON_NAMES);

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
  await preflightTasklifySlice();
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

async function preflightTasklifySlice(): Promise<void> {
  await figma.loadAllPagesAsync();
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

  const variableIdentityCounts = new Map<string, Variable[]>();
  for (const variable of localVariables) {
    if (!hasDesignSystemIdentity(variable)) continue;
    const tokenId = variable.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      TOKEN_ID_KEY,
    );
    if (!tokenId) continue;
    const matches = variableIdentityCounts.get(tokenId) ?? [];
    matches.push(variable);
    variableIdentityCounts.set(tokenId, matches);
  }
  for (const [tokenId, matches] of variableIdentityCounts) {
    if (matches.length > 1) {
      throw new Error(`Duplicate Tasklify Variable ID: ${tokenId}`);
    }
    const token = tokenById.get(tokenId);
    if (token && matches[0].resolvedType !== token.type) {
      throw new Error(`Tasklify Variable type mismatch: ${tokenId}`);
    }
    if (
      token &&
      collectionMatches[0] &&
      matches[0].variableCollectionId !== collectionMatches[0].id
    ) {
      throw new Error(`Tasklify Variable is in another Collection: ${tokenId}`);
    }
  }

  const componentMatches = new Map<string, Array<ComponentNode | ComponentSetNode>>();
  const componentCandidates = figma.root.findAll(
    (node) => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET',
  );
  for (const candidate of componentCandidates) {
    if (candidate.type !== 'COMPONENT' && candidate.type !== 'COMPONENT_SET') continue;
    if (!hasDesignSystemIdentity(candidate)) continue;
    const componentId = candidate.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      COMPONENT_ID_KEY,
    );
    if (!TARGET_COMPONENT_IDS.includes(componentId as (typeof TARGET_COMPONENT_IDS)[number])) {
      continue;
    }
    const matches = componentMatches.get(componentId) ?? [];
    matches.push(candidate);
    componentMatches.set(componentId, matches);
  }
  for (const [componentId, matches] of componentMatches) {
    if (matches.length > 1) {
      throw new Error(`Duplicate Tasklify component ID: ${componentId}`);
    }
    const mustBeSet = ['component.icon', 'component.button', 'component.badge'].includes(
      componentId,
    );
    if (
      (mustBeSet && matches[0].type !== 'COMPONENT_SET') ||
      (!mustBeSet && matches[0].type !== 'COMPONENT')
    ) {
      throw new Error(`Tasklify Component type mismatch: ${componentId}`);
    }
  }

  for (const renderId of [DESKTOP_RENDER_ID, TABLET_RENDER_ID]) {
    const renderCandidates = figma.root.findAll(
      (node) =>
        hasDesignSystemIdentity(node) &&
        node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SCREEN_ID_KEY) === SCREEN_ID &&
        node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY) === renderId,
    );
    if (renderCandidates.length > 1) {
      throw new Error(`Duplicate Tasklify render ID: ${renderId}`);
    }
    if (renderCandidates[0] && renderCandidates[0].type !== 'FRAME') {
      throw new Error(`Tasklify render type mismatch: ${renderId}`);
    }
    const render = renderCandidates[0] as FrameNode | undefined;
    if (!render) continue;

    const managedById = new Map<string, SceneNode[]>();
    const managedNodes = render.findAll(
      (node) =>
        hasDesignSystemIdentity(node) &&
        node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY) === renderId &&
        Boolean(
          node.getSharedPluginData(
            PLUGIN_DATA_NAMESPACE,
            SLICE_NODE_ID_KEY,
          ),
        ),
    );
    for (const node of managedNodes) {
      const nodeId = node.getSharedPluginData(
        PLUGIN_DATA_NAMESPACE,
        SLICE_NODE_ID_KEY,
      );
      const matches = managedById.get(nodeId) ?? [];
      matches.push(node);
      managedById.set(nodeId, matches);
      const expectedType = expectedManagedNodeType(nodeId);
      if (expectedType && node.type !== expectedType) {
        throw new Error(
          `Tasklify managed node type mismatch: ${nodeId}; expected ${expectedType}, got ${node.type}`,
        );
      }
    }
    for (const [nodeId, matches] of managedById) {
      if (matches.length > 1) {
        throw duplicateManagedIdentityError(nodeId);
      }
    }

    for (const requiredRoot of ['sidebar', 'workspace']) {
      const rootMatches = render.children.filter(
        (child) =>
          hasDesignSystemIdentity(child) &&
          child.getSharedPluginData(PLUGIN_DATA_NAMESPACE, RENDER_ID_KEY) === renderId &&
          child.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SLICE_NODE_ID_KEY) ===
            requiredRoot,
      );
      if (rootMatches.length !== 1 || rootMatches[0].type !== 'FRAME') {
        throw new Error(
          `Tasklify existing render is missing required Frame root: ${renderId}/${requiredRoot}`,
        );
      }
    }

    const taggedInstances = render.findAll(
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
    for (const instance of taggedInstances) {
      const expectedComponentId = instance.getSharedPluginData(
        PLUGIN_DATA_NAMESPACE,
        COMPONENT_ID_KEY,
      );
      const mainComponent = await instance.getMainComponentAsync();
      const owner =
        mainComponent?.parent?.type === 'COMPONENT_SET'
          ? mainComponent.parent
          : mainComponent;
      if (
        !owner ||
        !hasDesignSystemIdentity(owner) ||
        owner.getSharedPluginData(
          PLUGIN_DATA_NAMESPACE,
          COMPONENT_ID_KEY,
        ) !== expectedComponentId
      ) {
        throw new Error(
          `Tasklify tagged Instance component identity mismatch: ${instance.name}`,
        );
      }
    }
  }
}

function expectedManagedNodeType(
  nodeId: string,
): 'FRAME' | 'TEXT' | 'INSTANCE' | undefined {
  if (
    nodeId === 'topbar.create-task' ||
    /^summary\.stat\.\d+$/.test(nodeId) ||
    /^board\.column\.[^.]+\.badge$/.test(nodeId) ||
    /^board\.column\.[^.]+\.task\.\d+$/.test(nodeId) ||
    /\.icon(?:\.|$)/.test(nodeId)
  ) {
    return 'INSTANCE';
  }
  if (
    nodeId === 'sidebar.brand' ||
    nodeId === 'sidebar.account' ||
    nodeId === 'sidebar.footer' ||
    nodeId === 'topbar.breadcrumb' ||
    nodeId === 'topbar.avatars' ||
    nodeId === 'topbar.utilities' ||
    nodeId === 'summary.heading' ||
    nodeId === 'summary.subheading' ||
    nodeId === 'toolbar.controls' ||
    /\.(?:label|copy|action|menu|count)$/.test(nodeId)
  ) {
    return 'TEXT';
  }
  return 'FRAME';
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
  const icon = syncIcon(existing.get('component.icon'), variables);
  const button = syncButton(existing.get('component.button'), variables);
  const badge = syncBadge(existing.get('component.badge'), variables);
  const statCard = syncStatCard(
    existing.get('component.stat-card'),
    icon,
    variables,
  );
  const taskCard = syncTaskCard(
    existing.get('component.task-card'),
    badge,
    icon,
    variables,
  );
  return new Map<string, ComponentNode | ComponentSetNode>([
    ['component.icon', icon],
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

function syncIcon(
  existing: ComponentNode | ComponentSetNode | undefined,
  variables: Map<string, Variable>,
): ComponentSetNode {
  const definition = requireComponentDefinition('component.icon');
  const names = requireVariantValues(definition, 'Name') as IconName[];
  let componentSet: ComponentSetNode;
  if (!existing) {
    const variants = names.map((name) => {
      const component = figma.createComponent();
      component.name = `Name=${name}`;
      configureIconVariant(component, name, variables);
      return component;
    });
    componentSet = figma.combineAsVariants(variants, figma.currentPage);
    componentSet.x = 440;
    componentSet.y = 320;
  } else {
    if (existing.type !== 'COMPONENT_SET') {
      throw new Error('Tasklify Icon identity points to a non-Component Set');
    }
    componentSet = existing;
    const variants = requireExactVariants(
      componentSet,
      names.map((name) => `Name=${name}`),
    );
    for (const name of names) {
      configureIconVariant(variants.get(`Name=${name}`)!, name, variables);
    }
  }
  componentSet.name = definition.figma.name;
  componentSet.description = buildComponentDescription(definition);
  tagComponent(componentSet, definition.id);
  arrangeVariants(componentSet, 5);
  assertComponentSetGeometry(componentSet, names.length);
  return componentSet;
}

function configureIconVariant(
  component: ComponentNode,
  name: IconName,
  variables: Map<string, Variable>,
): void {
  component.name = `Name=${name}`;
  component.layoutMode = 'NONE';
  component.resizeWithoutConstraints(24, 24);
  component.fills = [];
  const matches = component.children.filter(
    (child): child is FrameNode => child.type === 'FRAME' && child.name === 'icon-vector',
  );
  if (matches.length > 1) {
    throw new Error(`Duplicate Tasklify Icon vector root: ${name}`);
  }
  let vectorRoot = matches[0];
  if (!vectorRoot) {
    vectorRoot = figma.createNodeFromSvg(
      iconSvg(name, requireResolvedColor('semantic.text.primary')),
    );
    vectorRoot.name = 'icon-vector';
    component.appendChild(vectorRoot);
  }
  vectorRoot.x = 2;
  vectorRoot.y = 2;
  vectorRoot.resizeWithoutConstraints(20, 20);
  vectorRoot.findAll().forEach((node) => {
    if (isStrokeNode(node)) {
      bindStroke(node, variables, 'semantic.text.primary');
    }
  });
}

function isStrokeNode(node: SceneNode): node is StrokeNode {
  return (
    node.type === 'VECTOR' ||
    node.type === 'LINE' ||
    node.type === 'RECTANGLE' ||
    node.type === 'ELLIPSE'
  );
}

function iconSvg(name: IconName, color: string): string {
  const paths: Record<IconName, string> = {
    Search:
      '<circle cx="11" cy="11" r="6"/><path d="m16 16 4 4"/>',
    Overview:
      '<rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/>',
    Tasks:
      '<rect x="4" y="3" width="16" height="18" rx="2"/><path d="m8 9 1.5 1.5L12 7.5M8 15h8"/>',
    Calendar:
      '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    Chat:
      '<path d="M4 5h16v11H9l-5 4V5Z"/><path d="M8 9h8M8 12h5"/>',
    Reporting:
      '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    Workflow:
      '<circle cx="6" cy="6" r="3"/><circle cx="18" cy="18" r="3"/><path d="M9 6h5a4 4 0 0 1 4 4v5M15 18h-5a4 4 0 0 1-4-4V9"/>',
    Settings:
      '<circle cx="12" cy="12" r="3"/><path d="M19 12a7 7 0 0 0-.1-1l2-1.5-2-3.4-2.4 1A7 7 0 0 0 15 6l-.3-2.6h-4L10.4 6A7 7 0 0 0 9 7.1l-2.4-1-2 3.4L6.6 11a7 7 0 0 0 0 2l-2 1.5 2 3.4 2.4-1A7 7 0 0 0 10.4 18l.3 2.6h4L15 18a7 7 0 0 0 1.5-1.1l2.4 1 2-3.4-2-1.5a7 7 0 0 0 .1-1Z"/>',
    Help:
      '<circle cx="12" cy="12" r="9"/><path d="M9.8 9a2.4 2.4 0 1 1 3.1 2.3c-.9.3-.9 1-.9 1.7M12 17h.01"/>',
    Filter:
      '<path d="M3 5h18l-7 8v6l-4 2v-8L3 5Z"/>',
    Sort:
      '<path d="M8 4v16M5 7l3-3 3 3M16 20V4M13 17l3 3 3-3"/>',
    Automation:
      '<path d="m13 2-8 12h6l-1 8 9-13h-6V2Z"/>',
    More:
      '<circle cx="5" cy="12" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/>',
    Plus:
      '<path d="M12 5v14M5 12h14"/>',
    Link:
      '<path d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7.1-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2A5 5 0 0 0 12 20l1.1-1.1"/>',
    Flag:
      '<path d="M5 21V4M5 5h11l-2 4 2 4H5"/>',
    Comment:
      '<path d="M4 5h16v11H9l-5 4V5Z"/>',
    Check:
      '<path d="m5 12 4 4L19 6"/>',
    ChevronDown:
      '<path d="m6 9 6 6 6-6"/>',
  };
  return `<svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" stroke="${color}" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">${paths[name]}</svg>`;
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
  arrangeVariants(componentSet, 2);
  assertComponentSetGeometry(componentSet, 2);
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
  arrangeVariants(componentSet, 4);
  assertComponentSetGeometry(componentSet, 7);
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
  icon: ComponentSetNode,
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
  configureAutoLayout(component, 'VERTICAL', 12, 8);
  bindNumeric(component, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  component.resize(170, 112);
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

  const top = ensureFrame(component, 'stat-top');
  configureAutoLayout(top, 'HORIZONTAL', 0, 8);
  top.layoutSizingHorizontal = 'FILL';
  top.primaryAxisAlignItems = 'SPACE_BETWEEN';
  top.counterAxisAlignItems = 'CENTER';
  top.fills = [];
  const iconSurface = ensureFrame(top, 'stat-icon-surface');
  configureFixedFrame(iconSurface, 'HORIZONTAL', 28, 28, 4, 0);
  iconSurface.primaryAxisAlignItems = 'CENTER';
  iconSurface.counterAxisAlignItems = 'CENTER';
  bindNumeric(iconSurface, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(iconSurface, variables, 'semantic.surface.sidebar');
  const statIcon = ensureComponentInstance(iconSurface, 'stat-icon', icon, {
    Name: 'Reporting',
  });
  statIcon.resize(16, 16);

  const actionRow = ensureFrame(top, 'stat-action-row');
  configureAutoLayout(actionRow, 'HORIZONTAL', 0, 4);
  actionRow.counterAxisAlignItems = 'CENTER';
  actionRow.fills = [];
  const action = reparentText(component, actionRow, 'stat-action');
  configureText(action, 'View Details', 9, false, variables, 'semantic.text.secondary');
  const actionIcon = ensureComponentInstance(
    actionRow,
    'stat-action-icon',
    icon,
    { Name: 'ChevronDown' },
  );
  actionIcon.rotation = -90;
  actionIcon.resize(12, 12);
  reorderChildren(actionRow, [action, actionIcon]);
  reorderChildren(top, [iconSurface, actionRow]);

  const value = ensureText(component, 'stat-value');
  configureText(value, '216', 16, true, variables, 'semantic.text.primary');
  const label = ensureText(component, 'stat-label');
  configureText(label, 'Active Employees', 10, false, variables, 'semantic.text.secondary');
  reorderChildren(component, [top, value, label]);
  return component;
}

function syncTaskCard(
  existing: ComponentNode | ComponentSetNode | undefined,
  badge: ComponentSetNode,
  icon: ComponentSetNode,
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
  configureAutoLayout(component, 'VERTICAL', 12, 8);
  bindNumeric(component, 'itemSpacing', variables, 'semantic.spacing.inline-tight');
  component.resize(180, 184);
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
  meta.counterAxisAlignItems = 'CENTER';
  const identity = ensureFrame(meta, 'task-identity');
  configureAutoLayout(identity, 'HORIZONTAL', 0, 4);
  identity.counterAxisAlignItems = 'CENTER';
  identity.fills = [];
  const linkIcon = ensureComponentInstance(identity, 'task-link-icon', icon, {
    Name: 'Link',
  });
  linkIcon.resize(12, 12);
  const existingId = meta.children.find(
    (child): child is TextNode => child.type === 'TEXT' && child.name === 'task-id',
  );
  if (existingId) identity.appendChild(existingId);
  const id = ensureText(identity, 'task-id');
  configureText(id, 'WEB - 21', 9, false, variables, 'semantic.text.secondary');
  reorderChildren(identity, [linkIcon, id]);
  const priority = ensureComponentInstance(meta, 'task-priority', badge, { Type: 'urgent' });
  priority.layoutAlign = 'INHERIT';
  reorderChildren(meta, [identity, priority]);

  const title = ensureText(component, 'task-title');
  configureText(title, 'Partone Consultancy Website', 11, true, variables, 'semantic.text.primary');
  title.layoutSizingHorizontal = 'FILL';
  const project = ensureText(component, 'task-project');
  configureText(project, 'New Homepage', 9, false, variables, 'semantic.text.secondary');

  const dueChip = ensureFrame(component, 'task-due-chip');
  configureAutoLayout(dueChip, 'HORIZONTAL', 8, 5);
  dueChip.layoutSizingHorizontal = 'FILL';
  dueChip.counterAxisAlignItems = 'CENTER';
  bindNumeric(dueChip, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(dueChip, variables, 'semantic.surface.sidebar');
  const calendarIcon = ensureComponentInstance(
    dueChip,
    'task-due-icon',
    icon,
    { Name: 'Calendar' },
  );
  calendarIcon.resize(13, 13);
  const existingDue = component.children.find(
    (child): child is TextNode => child.type === 'TEXT' && child.name === 'task-due',
  );
  if (existingDue) dueChip.appendChild(existingDue);
  const due = ensureText(dueChip, 'task-due');
  configureText(due, 'Due to: March 21, 25', 9, false, variables, 'semantic.text.secondary');
  reorderChildren(dueChip, [calendarIcon, due]);

  const footer = ensureFrame(component, 'task-footer-row');
  configureAutoLayout(footer, 'HORIZONTAL', 0, 6);
  footer.layoutSizingHorizontal = 'FILL';
  footer.primaryAxisAlignItems = 'SPACE_BETWEEN';
  footer.counterAxisAlignItems = 'CENTER';
  footer.fills = [];
  const avatars = ensureFrame(footer, 'task-avatars');
  configureAutoLayout(avatars, 'HORIZONTAL', 0, -4);
  avatars.fills = [];
  for (let index = 1; index <= 3; index += 1) {
    const avatar = ensureEllipse(avatars, `task-avatar-${index}`);
    avatar.resize(14, 14);
    bindFill(
      avatar,
      variables,
      index === 1 ? 'semantic.text.primary' : 'semantic.text.secondary',
    );
    avatar.strokes = [];
  }
  const activity = ensureFrame(footer, 'task-activity');
  configureAutoLayout(activity, 'HORIZONTAL', 0, 4);
  activity.counterAxisAlignItems = 'CENTER';
  activity.fills = [];
  const commentIcon = ensureComponentInstance(
    activity,
    'task-comment-icon',
    icon,
    { Name: 'Comment' },
  );
  commentIcon.resize(12, 12);
  const commentCount = ensureText(activity, 'task-comment-count');
  configureText(commentCount, '13', 8, false, variables, 'semantic.text.secondary');
  const existingFooter = component.children.find(
    (child): child is TextNode => child.type === 'TEXT' && child.name === 'task-footer',
  );
  if (existingFooter) activity.appendChild(existingFooter);
  const activityDate = ensureText(activity, 'task-footer');
  configureText(activityDate, 'Mar 16, 2025', 8, false, variables, 'semantic.text.secondary');
  reorderChildren(activity, [commentIcon, commentCount, activityDate]);
  reorderChildren(footer, [avatars, activity]);
  reorderChildren(component, [meta, title, project, dueChip, footer]);
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
  configureSidebar(
    sidebar,
    renderId,
    mode,
    sidebarWidth,
    height,
    components,
    variables,
  );
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
  components: Map<string, ComponentNode | ComponentSetNode>,
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
    mode === 'desktop' ? 'Tasklify  PRO' : 'T',
    mode === 'desktop' ? 12 : 18,
    true,
    variables,
    'semantic.text.primary',
  );
  const account = ensureManagedText(sidebar, renderId, 'sidebar.account');
  configureText(
    account,
    mode === 'desktop' ? 'landerestudio@gmail.com' : '',
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
  const searchIcon = ensureManagedInstance(
    search,
    renderId,
    'sidebar.search.icon',
    requireComponent(components, 'component.icon'),
    { Name: 'Search' },
  );
  searchIcon.resize(14, 14);
  const searchText = ensureManagedText(search, renderId, 'sidebar.search.label');
  configureText(
    searchText,
    mode === 'desktop' ? 'Search' : '',
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
    const icon = ensureManagedInstance(
      item,
      renderId,
      `sidebar.nav.${label.toLowerCase()}.icon`,
      requireComponent(components, 'component.icon'),
      { Name: label as IconName },
    );
    icon.resize(mode === 'desktop' ? 14 : 16, mode === 'desktop' ? 14 : 16);
    const text = ensureManagedText(item, renderId, `sidebar.nav.${label.toLowerCase()}.label`);
    configureText(
      text,
      mode === 'desktop' ? label : '',
      mode === 'desktop' ? 9 : 13,
      index === 0,
      variables,
      'semantic.text.primary',
    );
    orderManagedChildren(item, [icon, text]);
    navNodes.push(item);
    removeStaleManagedChildren(
      item,
      renderId,
      new Set([
        `sidebar.nav.${label.toLowerCase()}.icon`,
        `sidebar.nav.${label.toLowerCase()}.label`,
      ]),
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
  const footerActions = ensureManagedFrame(sidebar, renderId, 'sidebar.footer-actions');
  configureAutoLayout(footerActions, 'VERTICAL', 0, 6);
  footerActions.layoutSizingHorizontal = 'FILL';
  footerActions.fills = [];
  const footerActionNodes: SceneNode[] = [];
  for (const action of [
    { id: 'help', label: 'Help Center', icon: 'Help' as IconName },
    { id: 'settings', label: 'Settings', icon: 'Settings' as IconName },
  ]) {
    const row = ensureManagedFrame(
      footerActions,
      renderId,
      `sidebar.footer-actions.${action.id}`,
    );
    configureAutoLayout(row, 'HORIZONTAL', 0, 6);
    row.counterAxisAlignItems = 'CENTER';
    row.fills = [];
    const icon = ensureManagedInstance(
      row,
      renderId,
      `sidebar.footer-actions.${action.id}.icon`,
      requireComponent(components, 'component.icon'),
      { Name: action.icon },
    );
    icon.resize(14, 14);
    const label = ensureManagedText(
      row,
      renderId,
      `sidebar.footer-actions.${action.id}.label`,
    );
    configureText(
      label,
      mode === 'desktop' ? action.label : '',
      9,
      false,
      variables,
      'semantic.text.primary',
    );
    orderManagedChildren(row, [icon, label]);
    removeStaleManagedChildren(
      row,
      renderId,
      new Set([
        `sidebar.footer-actions.${action.id}.icon`,
        `sidebar.footer-actions.${action.id}.label`,
      ]),
    );
    footerActionNodes.push(row);
  }
  orderManagedChildren(footerActions, footerActionNodes);
  removeStaleManagedChildren(
    footerActions,
    renderId,
    new Set([
      'sidebar.footer-actions.help',
      'sidebar.footer-actions.settings',
    ]),
  );
  const footer = ensureManagedText(sidebar, renderId, 'sidebar.footer');
  configureText(
    footer,
    mode === 'desktop' ? 'David Johnson' : 'D',
    mode === 'desktop' ? 9 : 12,
    false,
    variables,
    'semantic.text.primary',
  );

  orderManagedChildren(sidebar, [
    brand,
    account,
    search,
    nav,
    spacer,
    footerActions,
    footer,
  ]);
  removeStaleManagedChildren(
    sidebar,
    renderId,
    new Set([
      'sidebar.brand',
      'sidebar.account',
      'sidebar.search',
      'sidebar.nav',
      'sidebar.spacer',
      'sidebar.footer-actions',
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
  configureText(avatars, 'Team +4', 10, false, variables, 'semantic.text.secondary');
  const utilities = ensureManagedText(actions, renderId, 'topbar.utilities');
  configureText(utilities, 'Tools', 9, false, variables, 'semantic.text.secondary');
  const utilityIcons = ensureManagedFrame(actions, renderId, 'topbar.utility-icons');
  configureAutoLayout(utilityIcons, 'HORIZONTAL', 0, 6);
  utilityIcons.counterAxisAlignItems = 'CENTER';
  utilityIcons.fills = [];
  const settingsIcon = ensureManagedInstance(
    utilityIcons,
    renderId,
    'topbar.utility-icons.settings.icon',
    requireComponent(components, 'component.icon'),
    { Name: 'Settings' },
  );
  const moreIcon = ensureManagedInstance(
    utilityIcons,
    renderId,
    'topbar.utility-icons.more.icon',
    requireComponent(components, 'component.icon'),
    { Name: 'More' },
  );
  settingsIcon.resize(15, 15);
  moreIcon.resize(15, 15);
  orderManagedChildren(utilityIcons, [settingsIcon, moreIcon]);
  removeStaleManagedChildren(
    utilityIcons,
    renderId,
    new Set([
      'topbar.utility-icons.settings.icon',
      'topbar.utility-icons.more.icon',
    ]),
  );
  const button = ensureManagedInstance(
    actions,
    renderId,
    'topbar.create-task',
    requireComponent(components, 'component.button'),
    { Type: 'primary' },
  );
  orderManagedChildren(actions, [avatars, utilities, utilityIcons, button]);
  removeStaleManagedChildren(
    actions,
    renderId,
    new Set([
      'topbar.avatars',
      'topbar.utilities',
      'topbar.utility-icons',
      'topbar.create-task',
    ]),
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
  configureToolbar(toolbar, renderId, width - 24, components, variables);
  const boardViewport = ensureManagedFrame(content, renderId, 'content.board-viewport');
  configureBoardViewport(
    boardViewport,
    renderId,
    mode,
    width - 24,
    Math.max(300, height - (mode === 'desktop' ? 304 : 432)),
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
  summary.resize(width, mode === 'desktop' ? 216 : 344);
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
  const bannerIcon = ensureManagedInstance(
    banner,
    renderId,
    'summary.banner.icon',
    requireComponent(components, 'component.icon'),
    { Name: 'Automation' },
  );
  bannerIcon.resize(14, 14);
  const bannerCopy = ensureManagedText(banner, renderId, 'summary.banner.copy');
  configureText(
    bannerCopy,
    'Tasklify AI is now available. Access your activity and timeline right away.',
    9,
    false,
    variables,
    'semantic.text.primary',
  );
  bannerCopy.layoutGrow = 1;
  const bannerAction = ensureManagedText(banner, renderId, 'summary.banner.action');
  configureText(
    bannerAction,
    'View Details',
    9,
    true,
    variables,
    'semantic.text.primary',
  );
  orderManagedChildren(banner, [bannerIcon, bannerCopy, bannerAction]);
  removeStaleManagedChildren(
    banner,
    renderId,
    new Set([
      'summary.banner.icon',
      'summary.banner.copy',
      'summary.banner.action',
    ]),
  );

  const stats = ensureManagedFrame(summary, renderId, 'summary.stats');
  configureAutoLayout(stats, mode === 'desktop' ? 'HORIZONTAL' : 'VERTICAL', 0, 10);
  bindNumeric(stats, 'itemSpacing', variables, 'semantic.spacing.component');
  stats.layoutSizingHorizontal = 'FILL';
  const statData = [
    ['216', 'Active Employees', 'Overview'],
    ['312', 'Active Projects', 'Workflow'],
    ['184', 'Number of Task', 'Tasks'],
    ['84.12%', 'Target Percentage Completed', 'Reporting'],
  ];
  const statNodes: SceneNode[] = [];
  if (mode === 'desktop') {
    statData.forEach(([value, label, iconName], index) => {
      const instance = ensureManagedInstance(
        stats,
        renderId,
        `summary.stat.${index + 1}`,
        requireComponent(components, 'component.stat-card'),
      );
      instance.layoutSizingHorizontal = 'FILL';
      overrideInstanceText(instance, 'stat-value', value);
      overrideInstanceText(instance, 'stat-label', label);
      overrideNestedIcon(instance, 'stat-icon', iconName as IconName);
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
        const [value, label, iconName] = statData[dataIndex];
        const instance = ensureManagedInstance(
          row,
          renderId,
          `summary.stat.${dataIndex + 1}`,
          requireComponent(components, 'component.stat-card'),
        );
        instance.layoutSizingHorizontal = 'FILL';
        overrideInstanceText(instance, 'stat-value', value);
        overrideInstanceText(instance, 'stat-label', label);
        overrideNestedIcon(instance, 'stat-icon', iconName as IconName);
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
  components: Map<string, ComponentNode | ComponentSetNode>,
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
  const viewIcons = ensureManagedFrame(views, renderId, 'toolbar.views.icons');
  configureAutoLayout(viewIcons, 'HORIZONTAL', 0, 6);
  viewIcons.counterAxisAlignItems = 'CENTER';
  viewIcons.fills = [];
  const viewIconNodes: SceneNode[] = [];
  for (const item of [
    { id: 'kanban', icon: 'Overview' as IconName },
    { id: 'timeline', icon: 'Workflow' as IconName },
    { id: 'spreadsheet', icon: 'Reporting' as IconName },
    { id: 'calendar', icon: 'Calendar' as IconName },
  ]) {
    const icon = ensureManagedInstance(
      viewIcons,
      renderId,
      `toolbar.views.icons.${item.id}.icon`,
      requireComponent(components, 'component.icon'),
      { Name: item.icon },
    );
    icon.resize(13, 13);
    viewIconNodes.push(icon);
  }
  orderManagedChildren(viewIcons, viewIconNodes);
  removeStaleManagedChildren(
    viewIcons,
    renderId,
    new Set([
      'toolbar.views.icons.kanban.icon',
      'toolbar.views.icons.timeline.icon',
      'toolbar.views.icons.spreadsheet.icon',
      'toolbar.views.icons.calendar.icon',
    ]),
  );
  const viewsText = ensureManagedText(views, renderId, 'toolbar.views.label');
  configureText(
    viewsText,
    'Kanban   Timeline   Spreadsheet   Calendar',
    9,
    false,
    variables,
    'semantic.text.primary',
  );
  orderManagedChildren(views, [viewIcons, viewsText]);
  removeStaleManagedChildren(
    views,
    renderId,
    new Set(['toolbar.views.icons', 'toolbar.views.label']),
  );
  const controlIcons = ensureManagedFrame(toolbar, renderId, 'toolbar.control-icons');
  configureAutoLayout(controlIcons, 'HORIZONTAL', 6, 6);
  controlIcons.counterAxisAlignItems = 'CENTER';
  bindNumeric(controlIcons, 'cornerRadius', variables, 'semantic.radius.control');
  bindFill(controlIcons, variables, 'semantic.surface.card');
  bindStroke(controlIcons, variables, 'semantic.border.subtle');
  controlIcons.strokeWeight = 1;
  const controlIconNodes: SceneNode[] = [];
  for (const item of [
    { id: 'filter', icon: 'Filter' as IconName },
    { id: 'sort', icon: 'Sort' as IconName },
    { id: 'automation', icon: 'Automation' as IconName },
    { id: 'search', icon: 'Search' as IconName },
    { id: 'more', icon: 'More' as IconName },
    { id: 'plus', icon: 'Plus' as IconName },
    { id: 'chevron', icon: 'ChevronDown' as IconName },
  ]) {
    const icon = ensureManagedInstance(
      controlIcons,
      renderId,
      `toolbar.control-icons.${item.id}.icon`,
      requireComponent(components, 'component.icon'),
      { Name: item.icon },
    );
    icon.resize(13, 13);
    controlIconNodes.push(icon);
  }
  orderManagedChildren(controlIcons, controlIconNodes);
  removeStaleManagedChildren(
    controlIcons,
    renderId,
    new Set([
      'toolbar.control-icons.filter.icon',
      'toolbar.control-icons.sort.icon',
      'toolbar.control-icons.automation.icon',
      'toolbar.control-icons.search.icon',
      'toolbar.control-icons.more.icon',
      'toolbar.control-icons.plus.icon',
      'toolbar.control-icons.chevron.icon',
    ]),
  );
  const controls = ensureManagedText(toolbar, renderId, 'toolbar.controls');
  configureText(
    controls,
    'New',
    10,
    true,
    variables,
    'semantic.text.primary',
  );
  orderManagedChildren(toolbar, [views, controlIcons, controls]);
  removeStaleManagedChildren(
    toolbar,
    renderId,
    new Set(['toolbar.views', 'toolbar.control-icons', 'toolbar.controls']),
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
    configureText(menu, '24', 9, false, variables, 'semantic.text.secondary');
    const menuIcon = ensureManagedInstance(
      header,
      renderId,
      `board.column.${column.id}.menu.icon`,
      requireComponent(components, 'component.icon'),
      { Name: 'More' },
    );
    menuIcon.resize(13, 13);
    orderManagedChildren(header, [badge, menu, menuIcon]);
    removeStaleManagedChildren(
      header,
      renderId,
      new Set([
        `board.column.${column.id}.badge`,
        `board.column.${column.id}.menu`,
        `board.column.${column.id}.menu.icon`,
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
    const addIcon = ensureManagedInstance(
      add,
      renderId,
      `board.column.${column.id}.add.icon`,
      requireComponent(components, 'component.icon'),
      { Name: 'Plus' },
    );
    addIcon.resize(13, 13);
    const addText = ensureManagedText(
      add,
      renderId,
      `board.column.${column.id}.add.label`,
    );
    configureText(addText, 'New Page', 9, false, variables, 'semantic.text.primary');
    orderManagedChildren(add, [addIcon, addText]);
    removeStaleManagedChildren(
      add,
      renderId,
      new Set([
        `board.column.${column.id}.add.icon`,
        `board.column.${column.id}.add.label`,
      ]),
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
    throw new Error(
      `Tasklify idempotency failed: expected ${TARGET_COMPONENT_IDS.length} scoped Components`,
    );
  }
  assertComponentSetGeometry(
    requireComponent(components, 'component.icon') as ComponentSetNode,
    ICON_NAMES.length,
  );
  assertComponentSetGeometry(
    requireComponent(components, 'component.button') as ComponentSetNode,
    2,
  );
  assertComponentSetGeometry(
    requireComponent(components, 'component.badge') as ComponentSetNode,
    7,
  );
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
  if (matches.length > 1) throw duplicateManagedIdentityError(nodeId);
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
  if (matches.length > 1) throw duplicateManagedIdentityError(nodeId);
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
  if (matches.length > 1) throw duplicateManagedIdentityError(nodeId);
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

function duplicateManagedIdentityError(nodeId: string): Error {
  return new Error(
    [
      `Duplicate Tasklify managed identity: ${nodeId}`,
      'A duplicated Compiler-managed node may have copied plugin data.',
      'Create a fresh node for unmanaged content or remove/detach the duplicate.',
    ].join('\n'),
  );
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

function ensureEllipse(parent: ContainerNode, name: string): EllipseNode {
  const matches = parent.children.filter(
    (child): child is EllipseNode => child.type === 'ELLIPSE' && child.name === name,
  );
  if (matches.length > 1) throw new Error(`Duplicate managed Component ellipse: ${name}`);
  const node = matches[0] ?? figma.createEllipse();
  if (!matches[0]) parent.appendChild(node);
  node.name = name;
  return node;
}

function reparentText(
  source: ContainerNode,
  destination: ContainerNode,
  name: string,
): TextNode {
  const existingDestination = destination.children.find(
    (child): child is TextNode => child.type === 'TEXT' && child.name === name,
  );
  if (existingDestination) return existingDestination;
  const existingSource = source.children.find(
    (child): child is TextNode => child.type === 'TEXT' && child.name === name,
  );
  if (existingSource) {
    destination.appendChild(existingSource);
    return existingSource;
  }
  return ensureText(destination, name);
}

function reorderChildren(parent: ContainerNode, children: SceneNode[]): void {
  children.forEach((child, index) => parent.insertChild(index, child));
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

function overrideNestedIcon(
  instance: InstanceNode,
  name: string,
  iconName: IconName,
): void {
  const node = instance.findOne(
    (candidate) => candidate.type === 'INSTANCE' && candidate.name === name,
  ) as InstanceNode | null;
  if (!node) throw new Error(`Tasklify nested Icon Instance is missing: ${name}`);
  node.setProperties({ Name: iconName });
}

function applyTaskOverrides(
  instance: InstanceNode,
  data: {
    id: string;
    title: string;
    project: string;
    due: string;
    comments: string;
    activity: string;
    priority: string;
  },
): void {
  overrideInstanceText(instance, 'task-id', data.id);
  overrideInstanceText(instance, 'task-title', data.title);
  overrideInstanceText(instance, 'task-project', data.project);
  overrideInstanceText(instance, 'task-due', data.due);
  overrideInstanceText(instance, 'task-comment-count', data.comments);
  overrideInstanceText(instance, 'task-footer', data.activity);
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
  const boundIndex = fills.findIndex(
    (paint) =>
      paint.type === 'SOLID' &&
      paint.boundVariables?.color?.id === variable.id,
  );
  const existingIndex =
    boundIndex >= 0
      ? boundIndex
      : fills.findIndex((paint) => paint.type === 'SOLID');
  const existing = existingIndex >= 0 ? (fills[existingIndex] as SolidPaint) : undefined;
  const paint = existing
    ? figma.util.solidPaint(tokenHex, existing)
    : figma.util.solidPaint(tokenHex);
  const bound = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
  if (existingIndex >= 0) fills[existingIndex] = bound;
  else fills.push(bound);
  node.fills = fills;
  assertCanonicalPaintBinding(
    node,
    fills,
    variable,
    tokenId,
    'Fill',
  );
}

function bindStroke(
  node: StrokeNode,
  variables: Map<string, Variable>,
  tokenId: string,
): void {
  const variable = requireVariable(variables, tokenId);
  const tokenHex = requireResolvedColor(tokenId);
  const strokes = [...node.strokes];
  const boundIndex = strokes.findIndex(
    (paint) =>
      paint.type === 'SOLID' &&
      paint.boundVariables?.color?.id === variable.id,
  );
  const existingIndex =
    boundIndex >= 0
      ? boundIndex
      : strokes.findIndex((paint) => paint.type === 'SOLID');
  const existing = existingIndex >= 0 ? (strokes[existingIndex] as SolidPaint) : undefined;
  const paint = existing
    ? figma.util.solidPaint(tokenHex, existing)
    : figma.util.solidPaint(tokenHex);
  const bound = figma.variables.setBoundVariableForPaint(paint, 'color', variable);
  if (existingIndex >= 0) strokes[existingIndex] = bound;
  else strokes.push(bound);
  node.strokes = strokes;
  assertCanonicalPaintBinding(node, node.strokes, variable, tokenId, 'Stroke');
}

function assertCanonicalPaintBinding(
  node: SceneNode,
  paints: readonly Paint[],
  variable: Variable,
  tokenId: string,
  role: 'Fill' | 'Stroke',
): void {
  const solidPaints = paints.filter(
    (paint): paint is SolidPaint => paint.type === 'SOLID',
  );
  if (solidPaints.length === 0) {
    throw new Error(
      `Tasklify Paint guard failed: ${node.name} has no SOLID ${role}`,
    );
  }
  const boundPaints = solidPaints.filter(
    (paint) => paint.boundVariables?.color?.id === variable.id,
  );
  if (boundPaints.length !== 1) {
    throw new Error(
      `Tasklify Paint guard failed: ${node.name} ${role} must bind ${tokenId}`,
    );
  }
  const expected = hexToRgb(requireResolvedColor(tokenId));
  if (!colorsMatch(boundPaints[0].color, expected)) {
    throw new Error(
      `Tasklify Paint guard failed: ${node.name} ${role} base paint does not match ${tokenId}`,
    );
  }
  const resolved = variable.resolveForConsumer(node);
  if (
    resolved.resolvedType !== 'COLOR' ||
    !colorsMatch(resolved.value as RGB | RGBA, expected)
  ) {
    throw new Error(
      `Tasklify Paint guard failed: ${node.name} ${role} resolved value does not match ${tokenId}`,
    );
  }
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
): void {
  const variants = set.children.filter(
    (child): child is ComponentNode => child.type === 'COMPONENT',
  );
  const padding = 24;
  const gap = 24;
  const rowCount = Math.ceil(variants.length / columns);
  const columnWidths = Array.from({ length: columns }, () => 0);
  const rowHeights = Array.from({ length: rowCount }, () => 0);
  variants.forEach((variant, index) => {
    const column = index % columns;
    const row = Math.floor(index / columns);
    columnWidths[column] = Math.max(columnWidths[column], variant.width);
    rowHeights[row] = Math.max(rowHeights[row], variant.height);
  });
  const columnOffsets = columnWidths.map((_, index) =>
    padding +
    columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0) +
    gap * index,
  );
  const rowOffsets = rowHeights.map((_, index) =>
    padding +
    rowHeights.slice(0, index).reduce((sum, height) => sum + height, 0) +
    gap * index,
  );
  variants.forEach((variant, index) => {
    variant.x = columnOffsets[index % columns];
    variant.y = rowOffsets[Math.floor(index / columns)];
  });
  const width =
    padding * 2 +
    columnWidths.reduce((sum, value) => sum + value, 0) +
    gap * Math.max(0, columns - 1);
  const height =
    padding * 2 +
    rowHeights.reduce((sum, value) => sum + value, 0) +
    gap * Math.max(0, rowCount - 1);
  set.layoutMode = 'NONE';
  set.resizeWithoutConstraints(Math.max(1, width), Math.max(1, height));
}

function assertComponentSetGeometry(
  set: ComponentSetNode,
  expectedVariantCount: number,
): void {
  const variants = set.children.filter(
    (child): child is ComponentNode => child.type === 'COMPONENT',
  );
  if (variants.length !== expectedVariantCount) {
    throw new Error(
      `${set.name} must contain exactly ${expectedVariantCount} variants`,
    );
  }
  for (const variant of variants) {
    if (variant.width <= 0 || variant.height <= 0) {
      throw new Error(`${set.name} Variant width/height must be greater than zero`);
    }
    if (
      variant.x < 0 ||
      variant.y < 0 ||
      variant.x + variant.width > set.width + 0.01 ||
      variant.y + variant.height > set.height + 0.01
    ) {
      throw new Error(`${set.name} Variant must be fully inside Component Set bounds`);
    }
  }
  for (let firstIndex = 0; firstIndex < variants.length; firstIndex += 1) {
    for (
      let secondIndex = firstIndex + 1;
      secondIndex < variants.length;
      secondIndex += 1
    ) {
      const first = variants[firstIndex];
      const second = variants[secondIndex];
      const overlaps =
        first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y;
      if (overlaps) {
        throw new Error(
          `${set.name} variants overlap: ${first.name} / ${second.name}`,
        );
      }
    }
  }
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

function taskExample(
  columnIndex: number,
  taskIndex: number,
): {
  id: string;
  title: string;
  project: string;
  due: string;
  comments: string;
  activity: string;
  priority: string;
} {
  const examples = [
    [
      ['WEB - 21', 'Partone Consultancy Website', 'New Homepage', 'Due to: March 21, 25', '13', 'Mar 16, 2025', 'urgent'],
      ['WEB - 68', 'Design Wireframes - Homepage', 'New Homepage', 'Due to: Jan 12, 25', '08', 'Jan 02, 2025', 'medium'],
    ],
    [
      ['WEB - 28', 'Modify Content for Homepage', 'New Homepage', 'Due to: May 23, 25', '16', 'May 18, 2025', 'urgent'],
      ['WEB - 44', 'Review Navigation Content', 'Website Update', 'Due to: May 28, 25', '06', 'May 20, 2025', 'medium'],
    ],
    [
      ['WEB - 12', 'MTC Design Approval', 'New Homepage', 'Due to: March 10, 25', '10', 'Mar 04, 2025', 'low'],
      ['WEB - 97', 'Nexa Components Revision', 'UI - Design System', 'Due to: March 29, 25', '28', 'Mar 12, 2025', 'medium'],
    ],
    [
      ['WEB - 88', 'Vo1 Components Design System', 'Components & Elements', 'Due to: March 20, 25', '14', 'Mar 06, 2025', 'urgent'],
      ['WEB - 93', 'Document Component States', 'UI - Design System', 'Due to: April 02, 25', '11', 'Mar 22, 2025', 'medium'],
    ],
  ] as const;
  const [id, title, project, due, comments, activity, priority] =
    examples[columnIndex][taskIndex];
  return { id, title, project, due, comments, activity, priority };
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

function colorsMatch(actual: RGB | RGBA, expected: RGB): boolean {
  const tolerance = 1 / 255 / 2;
  return (
    Math.abs(actual.r - expected.r) <= tolerance &&
    Math.abs(actual.g - expected.g) <= tolerance &&
    Math.abs(actual.b - expected.b) <= tolerance
  );
}
