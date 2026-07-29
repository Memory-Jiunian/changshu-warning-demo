import tokenSchemaJson from '../../../design-system/tokens.json';
import componentSchemaJson from '../../../design-system/components.json';
import screenSchemaJson from '../../../design-system/screens/pending-tasks.json';

type ColorToken = {
  id: string;
  name: string;
  type: 'COLOR';
  value: string;
};

type FloatToken = {
  id: string;
  name: string;
  type: 'FLOAT';
  value: number;
};

type TokenDefinition = ColorToken | FloatToken;

type TokenSchema = {
  collection: {
    name: string;
  };
  tokens: TokenDefinition[];
};

type LoadedSchemaSummary = {
  brand: string;
  radius: number;
};

type ComponentDefinition = {
  id: string;
  name: string;
  nodeType: 'COMPONENT' | 'COMPONENT_SET';
  variantProperties?: Record<string, string[]>;
  variants?: Array<Record<string, string>>;
};

type ComponentSchema = {
  components: ComponentDefinition[];
};

type ScreenTextChild = {
  id: string;
  type: 'TEXT';
  style: 'TITLE' | 'BODY';
  text: string;
};

type ScreenInstanceChild = {
  id: string;
  type: 'INSTANCE';
  componentId: string;
  variant?: Record<string, string>;
};

type ScreenChild = ScreenTextChild | ScreenInstanceChild;

type ScreenSchema = {
  id: string;
  name: string;
  width: number;
  children: ScreenChild[];
};

const tokenSchema = tokenSchemaJson as TokenSchema;
const componentSchema = componentSchemaJson as ComponentSchema;
const screenSchema = screenSchemaJson as ScreenSchema;

const FONT_REGULAR: FontName = { family: 'Inter', style: 'Regular' };
const FONT_SEMIBOLD: FontName = { family: 'Inter', style: 'Semi Bold' };
const PLUGIN_DATA_NAMESPACE = 'figma_design_compiler';
const COMPONENT_ID_KEY = 'componentId';
const TOKEN_ID_KEY = 'tokenId';
const COLLECTION_ID_KEY = 'collectionId';
const SCREEN_ID_KEY = 'screenId';
const SCREEN_CHILD_ID_KEY = 'screenChildId';
const DESIGN_SYSTEM_COLLECTION_ID = 'collection.pilot-design-system';

figma.showUI(__html__, {
  width: 280,
  height: 184,
  themeColors: true,
  title: 'Figma Design Compiler',
});

figma.ui.onmessage = async (message: { type?: string }) => {
  if (message.type === 'ui-ready') {
    figma.ui.postMessage({
      type: 'schema-summary',
      summary: getLoadedSchemaSummary(),
    });
    return;
  }

  if (
    message.type !== 'sync-design-system' &&
    message.type !== 'sync-pilot-screen'
  ) {
    return;
  }

  try {
    validateSchemas();
    await Promise.all([
      figma.loadFontAsync(FONT_REGULAR),
      figma.loadFontAsync(FONT_SEMIBOLD),
    ]);

    if (message.type === 'sync-design-system') {
      const nodes = await syncDesignSystem();
      const summary = getLoadedSchemaSummary();

      figma.currentPage.selection = nodes;
      figma.viewport.scrollAndZoomIntoView(nodes);
      figma.notify(
        `Synced: brand=${summary.brand}, radius=${summary.radius}`,
      );
    } else {
      const screen = await syncPilotScreen();
      figma.currentPage.selection = [screen];
      figma.viewport.scrollAndZoomIntoView([screen]);
      figma.notify(`Synced screen: ${screenSchema.name}`);
    }

    figma.ui.postMessage({ type: 'build-complete', action: message.type });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error(error);
    figma.notify(`Build failed: ${messageText}`, { error: true });
    figma.ui.postMessage({ type: 'build-error', action: message.type });
  }
};

function validateSchemas(): void {
  const requiredTokens = new Map([
    ['color.brand.primary', 'color/brand/primary'],
    ['color.text.primary', 'color/text/primary'],
    ['color.bg.surface', 'color/bg/surface'],
    ['spacing.md', 'spacing/md'],
    ['radius.md', 'radius/md'],
  ]);
  const tokenIds = new Set<string>();
  const variableNames = new Set<string>();

  for (const token of tokenSchema.tokens) {
    if (tokenIds.has(token.id)) {
      throw new Error(`Duplicate token id: ${token.id}`);
    }
    if (variableNames.has(token.name)) {
      throw new Error(`Duplicate variable name: ${token.name}`);
    }
    if (token.name.includes('.')) {
      throw new Error(`Figma variable name cannot contain ".": ${token.name}`);
    }

    const expectedName = requiredTokens.get(token.id);
    if (!expectedName) {
      throw new Error(`Unexpected token id: ${token.id}`);
    }
    if (token.name !== expectedName) {
      throw new Error(`Token ${token.id} must use Figma name ${expectedName}`);
    }

    tokenIds.add(token.id);
    variableNames.add(token.name);
  }

  for (const tokenId of requiredTokens.keys()) {
    if (!tokenIds.has(tokenId)) throw new Error(`Missing token: ${tokenId}`);
  }

  const requiredComponents = new Map([
    ['component.button', 'Button'],
    ['component.badge', 'Badge'],
    ['component.card', 'Card'],
  ]);
  const componentIds = new Set<string>();
  const componentNames = new Set<string>();

  for (const component of componentSchema.components) {
    if (componentIds.has(component.id)) {
      throw new Error(`Duplicate component id: ${component.id}`);
    }
    if (componentNames.has(component.name)) {
      throw new Error(`Duplicate component name: ${component.name}`);
    }
    if (requiredComponents.get(component.id) !== component.name) {
      throw new Error(`Invalid component identity: ${component.id} / ${component.name}`);
    }
    componentIds.add(component.id);
    componentNames.add(component.name);
  }

  for (const componentId of requiredComponents.keys()) {
    if (!componentIds.has(componentId)) throw new Error(`Missing component: ${componentId}`);
  }

  validateScreenSchema(componentIds);
}

async function syncVariables(): Promise<{
  collection: VariableCollection;
  variables: Map<string, Variable>;
}> {
  const [collections, localVariables] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
  ]);
  const collection = resolveDesignSystemCollection(collections);
  const variables = new Map<string, Variable>();

  for (const definition of tokenSchema.tokens) {
    const taggedMatches = localVariables.filter(
      (variable) =>
        variable.getSharedPluginData(PLUGIN_DATA_NAMESPACE, TOKEN_ID_KEY) ===
        definition.id,
    );
    if (taggedMatches.length > 1) {
      throw new Error(`Duplicate variable ID: ${definition.id}`);
    }

    let variable = taggedMatches[0];
    if (variable && variable.variableCollectionId !== collection.id) {
      throw new Error(`Variable identity is in another collection: ${definition.id}`);
    }

    const nameMatches = localVariables.filter(
      (candidate) =>
        candidate.variableCollectionId === collection.id &&
        candidate.name === definition.name,
    );
    if (nameMatches.length > 1) {
      throw new Error(`Duplicate variable identity: ${definition.id}`);
    }
    if (variable && nameMatches.some((candidate) => candidate.id !== variable.id)) {
      throw new Error(`Duplicate variable identity: ${definition.id}`);
    }

    if (!variable) {
      const candidate = nameMatches[0];
      if (candidate) {
        const claimedId = candidate.getSharedPluginData(
          PLUGIN_DATA_NAMESPACE,
          TOKEN_ID_KEY,
        );
        if (claimedId && claimedId !== definition.id) {
          throw new Error(`Variable name is claimed by another ID: ${definition.name}`);
        }
        variable = candidate;
      } else {
        variable = figma.variables.createVariable(
          definition.name,
          collection,
          definition.type,
        );
      }
    }

    if (variable.name !== definition.name) {
      throw new Error(`Variable name mismatch for ${definition.id}: ${variable.name}`);
    }
    if (variable.resolvedType !== definition.type) {
      throw new Error(`Variable type mismatch for ${definition.id}`);
    }

    variable.setValueForMode(
      collection.defaultModeId,
      definition.type === 'COLOR' ? hexToRgb(definition.value) : definition.value,
    );
    variable.setSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      TOKEN_ID_KEY,
      definition.id,
    );
    variables.set(definition.id, variable);
  }

  return { collection, variables };
}

function resolveDesignSystemCollection(
  collections: VariableCollection[],
): VariableCollection {
  const taggedMatches = collections.filter(
    (collection) =>
      collection.getSharedPluginData(
        PLUGIN_DATA_NAMESPACE,
        COLLECTION_ID_KEY,
      ) === DESIGN_SYSTEM_COLLECTION_ID,
  );
  if (taggedMatches.length > 1) {
    throw new Error(`Duplicate variable collection ID: ${DESIGN_SYSTEM_COLLECTION_ID}`);
  }

  const nameMatches = collections.filter(
    (collection) => collection.name === tokenSchema.collection.name,
  );
  if (nameMatches.length > 1) {
    throw new Error(`Duplicate variable collection identity: ${tokenSchema.collection.name}`);
  }

  let collection = taggedMatches[0];
  if (collection && nameMatches.some((candidate) => candidate.id !== collection.id)) {
    throw new Error(`Duplicate variable collection identity: ${tokenSchema.collection.name}`);
  }

  if (!collection) {
    collection =
      nameMatches[0] ??
      figma.variables.createVariableCollection(tokenSchema.collection.name);
  }

  if (collection.name !== tokenSchema.collection.name) {
    throw new Error(`Variable collection name mismatch: ${collection.name}`);
  }
  collection.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COLLECTION_ID_KEY,
    DESIGN_SYSTEM_COLLECTION_ID,
  );
  return collection;
}

async function syncDesignSystem(): Promise<SceneNode[]> {
  const requiredComponentIds = new Set(
    componentSchema.components.map((component) => component.id),
  );
  const existingComponents = await findComponentsByStableId(requiredComponentIds);
  const { collection, variables } = await syncVariables();
  const nodes = syncComponents(existingComponents, variables);
  await validateStructuralIdempotency(collection, variables, requiredComponentIds);
  validateVisualBindingIdempotency(nodes, variables);
  return nodes;
}

async function validateStructuralIdempotency(
  collection: VariableCollection,
  variables: Map<string, Variable>,
  requiredComponentIds: Set<string>,
): Promise<void> {
  const [collections, localVariables, components] = await Promise.all([
    figma.variables.getLocalVariableCollectionsAsync(),
    figma.variables.getLocalVariablesAsync(),
    findComponentsByStableId(requiredComponentIds),
  ]);
  const matchingCollections = collections.filter(
    (candidate) =>
      candidate.getSharedPluginData(
        PLUGIN_DATA_NAMESPACE,
        COLLECTION_ID_KEY,
      ) === DESIGN_SYSTEM_COLLECTION_ID,
  );
  if (matchingCollections.length !== 1 || matchingCollections[0].id !== collection.id) {
    throw new Error('Structural idempotency failed: expected exactly one Pilot collection');
  }

  const collectionVariables = localVariables.filter(
    (variable) => variable.variableCollectionId === collection.id,
  );
  if (
    collectionVariables.length !== tokenSchema.tokens.length ||
    variables.size !== tokenSchema.tokens.length
  ) {
    throw new Error(
      `Structural idempotency failed: expected exactly ${tokenSchema.tokens.length} Pilot variables`,
    );
  }
  for (const definition of tokenSchema.tokens) {
    const matches = collectionVariables.filter(
      (variable) =>
        variable.getSharedPluginData(PLUGIN_DATA_NAMESPACE, TOKEN_ID_KEY) ===
        definition.id,
    );
    if (matches.length !== 1 || variables.get(definition.id)?.id !== matches[0].id) {
      throw new Error(
        `Structural idempotency failed: expected one Variable for ${definition.id}`,
      );
    }
  }

  if (components.size !== requiredComponentIds.size) {
    throw new Error('Structural idempotency failed: expected one Button, Badge, and Card');
  }
}

function validateVisualBindingIdempotency(
  nodes: SceneNode[],
  variables: Map<string, Variable>,
): void {
  const buttonSet = nodes.find(
    (node): node is ComponentSetNode =>
      node.type === 'COMPONENT_SET' &&
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, COMPONENT_ID_KEY) ===
        'component.button',
  );
  const badgeSet = nodes.find(
    (node): node is ComponentSetNode =>
      node.type === 'COMPONENT_SET' &&
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, COMPONENT_ID_KEY) ===
        'component.badge',
  );
  const card = nodes.find(
    (node): node is ComponentNode =>
      node.type === 'COMPONENT' &&
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, COMPONENT_ID_KEY) ===
        'component.card',
  );
  if (!buttonSet || !badgeSet || !card) {
    throw new Error('Visual idempotency failed: synced component identity is incomplete');
  }

  const buttonDefinition = getComponentDefinition('Button', 'COMPONENT_SET');
  for (const variant of requireVariants(buttonDefinition)) {
    const type = requireVariantValue(variant, 'Type');
    const size = requireVariantValue(variant, 'Size');
    const button = requireVariantComponent(buttonSet, variant);
    const fillTokenId =
      type === 'Primary' ? 'color.brand.primary' : 'color.bg.surface';
    assertResolvedColorBinding(
      button,
      variables,
      fillTokenId,
      `Button Type=${type}, Size=${size}`,
    );
    if (type === 'Secondary') {
      assertResolvedColorBinding(
        requireDirectTextChildren(button, 1)[0],
        variables,
        'color.text.primary',
        `Button Type=${type}, Size=${size} text`,
      );
    }
  }

  const pendingBadge = requireVariantComponent(badgeSet, { Status: 'Pending' });
  assertResolvedColorBinding(
    pendingBadge,
    variables,
    'color.brand.primary',
    'Pending Badge',
  );
  assertResolvedColorBinding(card, variables, 'color.bg.surface', 'Card');
  const cardTexts = requireDirectTextChildren(card, 2);
  cardTexts.forEach((text, index) => {
    assertResolvedColorBinding(
      text,
      variables,
      'color.text.primary',
      index === 0 ? 'Card title' : 'Card body',
    );
  });
}

function assertResolvedColorBinding(
  node: ComponentNode | TextNode,
  variables: Map<string, Variable>,
  tokenId: string,
  label: string,
): void {
  const variable = requireVariable(variables, tokenId);
  const boundFillVariables = node.boundVariables?.fills ?? [];
  if (!boundFillVariables.some((alias) => alias.id === variable.id)) {
    throw new Error(`Visual idempotency failed: ${label} is not bound to ${tokenId}`);
  }

  if (node.fills === figma.mixed) {
    throw new Error(`Visual idempotency failed: ${label} has mixed fills`);
  }
  const solidPaints = node.fills.filter(
    (paint): paint is SolidPaint => paint.type === 'SOLID',
  );
  if (solidPaints.length === 0) {
    throw new Error(`Visual idempotency failed: ${label} has no SOLID paint`);
  }
  const boundSolidPaints = solidPaints.filter(
    (paint) => paint.boundVariables?.color?.id === variable.id,
  );
  if (boundSolidPaints.length !== 1) {
    throw new Error(
      `Visual idempotency failed: ${label} must have exactly one SOLID paint bound to ${tokenId}`,
    );
  }

  const expected = hexToRgb(requireColorToken(tokenId).value);
  if (!colorsMatch(boundSolidPaints[0].color, expected)) {
    throw new Error(
      `Visual idempotency failed: ${label} base paint does not match ${tokenId}`,
    );
  }

  const resolved = variable.resolveForConsumer(node);
  if (resolved.resolvedType !== 'COLOR') {
    throw new Error(`Visual idempotency failed: ${label} did not resolve a COLOR`);
  }
  const actual = resolved.value as RGB | RGBA;
  if (!colorsMatch(actual, expected)) {
    throw new Error(
      `Visual idempotency failed: ${label} resolved value does not match ${tokenId}`,
    );
  }
}

function syncComponents(
  existingComponents: Map<string, ComponentNode | ComponentSetNode>,
  variables: Map<string, Variable>,
): SceneNode[] {
  const buttonDefinition = getComponentDefinition('Button', 'COMPONENT_SET');
  const badgeDefinition = getComponentDefinition('Badge', 'COMPONENT_SET');
  const cardDefinition = getComponentDefinition('Card', 'COMPONENT');

  const center = figma.viewport.center;
  const existingButton = existingComponents.get(buttonDefinition.id);
  let buttonSet: ComponentSetNode;
  if (existingButton) {
    if (existingButton.type !== 'COMPONENT_SET') {
      throw new Error(`Component type mismatch: ${buttonDefinition.id}`);
    }
    updateButtonSet(existingButton, buttonDefinition, variables);
    buttonSet = existingButton;
  } else {
    buttonSet = createButtonSet(buttonDefinition, variables);
    buttonSet.x = center.x - buttonSet.width / 2;
    buttonSet.y = center.y - buttonSet.height / 2;
  }

  const existingBadge = existingComponents.get(badgeDefinition.id);
  let badgeSet: ComponentSetNode;
  if (existingBadge) {
    if (existingBadge.type !== 'COMPONENT_SET') {
      throw new Error(`Component type mismatch: ${badgeDefinition.id}`);
    }
    updateBadgeSet(existingBadge, badgeDefinition, variables);
    badgeSet = existingBadge;
  } else {
    badgeSet = createBadgeSet(badgeDefinition, variables);
    badgeSet.x = buttonSet.x + buttonSet.width + 80;
    badgeSet.y = buttonSet.y;
  }

  const existingCard = existingComponents.get(cardDefinition.id);
  let card: ComponentNode;
  if (existingCard) {
    if (existingCard.type !== 'COMPONENT') {
      throw new Error(`Component type mismatch: ${cardDefinition.id}`);
    }
    updateCard(existingCard, variables);
    card = existingCard;
  } else {
    card = createCard(cardDefinition, variables);
    card.x = buttonSet.x;
    card.y = buttonSet.y + buttonSet.height + 80;
  }

  return [buttonSet, badgeSet, card];
}

function getComponentDefinition(
  name: string,
  expectedType: ComponentDefinition['nodeType'],
): ComponentDefinition {
  const definition = componentSchema.components.find((component) => component.name === name);
  if (!definition || definition.nodeType !== expectedType) {
    throw new Error(`${name} must be declared as ${expectedType}`);
  }
  return definition;
}

function createButtonSet(
  definition: ComponentDefinition,
  variables: Map<string, Variable>,
): ComponentSetNode {
  const variants = requireVariants(definition);
  const components = variants.map((variant) => {
    const type = requireVariantValue(variant, 'Type');
    const size = requireVariantValue(variant, 'Size');
    const component = figma.createComponent();
    component.name = `Type=${type}, Size=${size}`;
    component.layoutMode = 'HORIZONTAL';
    component.primaryAxisSizingMode = 'AUTO';
    component.counterAxisSizingMode = 'AUTO';
    component.primaryAxisAlignItems = 'CENTER';
    component.counterAxisAlignItems = 'CENTER';
    component.itemSpacing = 8;
    component.setBoundVariable('itemSpacing', requireVariable(variables, 'spacing.md'));
    component.setBoundVariable('cornerRadius', requireVariable(variables, 'radius.md'));

    if (size === 'SM') {
      component.paddingTop = 8;
      component.paddingBottom = 8;
      component.paddingLeft = 12;
      component.paddingRight = 12;
      component.setBoundVariable('paddingLeft', requireVariable(variables, 'spacing.md'));
      component.setBoundVariable('paddingRight', requireVariable(variables, 'spacing.md'));
    } else {
      component.paddingTop = 12;
      component.paddingBottom = 12;
      component.paddingLeft = 16;
      component.paddingRight = 16;
      component.setBoundVariable('paddingTop', requireVariable(variables, 'spacing.md'));
      component.setBoundVariable('paddingBottom', requireVariable(variables, 'spacing.md'));
    }

    const isPrimary = type === 'Primary';
    bindTokenFill(
      component,
      variables,
      isPrimary ? 'color.brand.primary' : 'color.bg.surface',
    );

    if (!isPrimary) {
      component.strokes = [solidPaint('#DADADA')];
      component.strokeWeight = 1;
    }

    const label = createText('Button', size === 'SM' ? 14 : 16, FONT_SEMIBOLD);
    if (isPrimary) {
      label.fills = [solidPaint('#FFFFFF')];
    } else {
      bindTokenFill(label, variables, 'color.text.primary');
    }
    component.appendChild(label);
    component.x = size === 'SM' ? 0 : 160;
    component.y = type === 'Primary' ? 0 : 80;

    return component;
  });

  const componentSet = figma.combineAsVariants(components, figma.currentPage);
  componentSet.name = definition.name;
  componentSet.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
    definition.id,
  );
  assertVariantLayout(componentSet, 4);
  return componentSet;
}

function createBadgeSet(
  definition: ComponentDefinition,
  variables: Map<string, Variable>,
): ComponentSetNode {
  const variants = requireVariants(definition);
  const components = variants.map((variant) => {
    const status = requireVariantValue(variant, 'Status');
    const component = figma.createComponent();
    component.name = `Status=${status}`;
    component.layoutMode = 'HORIZONTAL';
    component.primaryAxisSizingMode = 'AUTO';
    component.counterAxisSizingMode = 'AUTO';
    component.primaryAxisAlignItems = 'CENTER';
    component.counterAxisAlignItems = 'CENTER';
    component.paddingTop = 4;
    component.paddingBottom = 4;
    component.paddingLeft = 8;
    component.paddingRight = 8;
    component.setBoundVariable('cornerRadius', requireVariable(variables, 'radius.md'));

    if (status === 'Pending') {
      bindTokenFill(component, variables, 'color.brand.primary');
    } else {
      component.fills = [solidPaint('#20D920')];
    }

    const label = createText(status, 12, FONT_SEMIBOLD);
    label.fills = [solidPaint('#FFFFFF')];
    component.appendChild(label);
    component.x = status === 'Pending' ? 0 : 120;
    component.y = 0;
    return component;
  });

  const componentSet = figma.combineAsVariants(components, figma.currentPage);
  componentSet.name = definition.name;
  componentSet.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
    definition.id,
  );
  assertVariantLayout(componentSet, 2);
  return componentSet;
}

function createCard(
  definition: ComponentDefinition,
  variables: Map<string, Variable>,
): ComponentNode {
  const card = figma.createComponent();
  card.name = definition.name;
  card.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
    definition.id,
  );
  card.layoutMode = 'VERTICAL';
  card.primaryAxisSizingMode = 'AUTO';
  card.counterAxisSizingMode = 'FIXED';
  card.resize(280, 100);
  card.itemSpacing = 8;
  card.setBoundVariable('itemSpacing', requireVariable(variables, 'spacing.md'));
  card.paddingTop = 12;
  card.paddingRight = 12;
  card.paddingBottom = 12;
  card.paddingLeft = 12;
  card.setBoundVariable('paddingTop', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingRight', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingBottom', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingLeft', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('cornerRadius', requireVariable(variables, 'radius.md'));
  bindTokenFill(card, variables, 'color.bg.surface');
  card.strokes = [solidPaint('#EEEEEE')];
  card.strokeWeight = 1;

  const title = createText('Card title', 16, FONT_SEMIBOLD);
  const body = createText('Supporting content for the card component.', 14, FONT_REGULAR);
  title.layoutAlign = 'STRETCH';
  body.layoutAlign = 'STRETCH';
  title.textAutoResize = 'HEIGHT';
  body.textAutoResize = 'HEIGHT';
  bindTokenFill(title, variables, 'color.text.primary');
  bindTokenFill(body, variables, 'color.text.primary');
  card.appendChild(title);
  card.appendChild(body);

  return card;
}

function updateButtonSet(
  componentSet: ComponentSetNode,
  definition: ComponentDefinition,
  variables: Map<string, Variable>,
): void {
  const variants = requireVariants(definition);
  assertVariantLayout(componentSet, variants.length);

  for (const variant of variants) {
    const type = requireVariantValue(variant, 'Type');
    const size = requireVariantValue(variant, 'Size');
    const component = requireVariantComponent(componentSet, variant);
    component.setBoundVariable('itemSpacing', requireVariable(variables, 'spacing.md'));
    component.setBoundVariable('cornerRadius', requireVariable(variables, 'radius.md'));

    if (size === 'SM') {
      component.setBoundVariable('paddingLeft', requireVariable(variables, 'spacing.md'));
      component.setBoundVariable('paddingRight', requireVariable(variables, 'spacing.md'));
    } else {
      component.setBoundVariable('paddingTop', requireVariable(variables, 'spacing.md'));
      component.setBoundVariable('paddingBottom', requireVariable(variables, 'spacing.md'));
    }

    const isPrimary = type === 'Primary';
    bindTokenFill(
      component,
      variables,
      isPrimary ? 'color.brand.primary' : 'color.bg.surface',
    );

    const label = requireDirectTextChildren(component, 1)[0];
    if (isPrimary) {
      label.fills = [solidPaint('#FFFFFF')];
    } else {
      bindTokenFill(label, variables, 'color.text.primary');
    }
  }

  componentSet.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
    definition.id,
  );
}

function updateBadgeSet(
  componentSet: ComponentSetNode,
  definition: ComponentDefinition,
  variables: Map<string, Variable>,
): void {
  const variants = requireVariants(definition);
  assertVariantLayout(componentSet, variants.length);

  for (const variant of variants) {
    const status = requireVariantValue(variant, 'Status');
    const component = requireVariantComponent(componentSet, variant);
    component.setBoundVariable('cornerRadius', requireVariable(variables, 'radius.md'));

    if (status === 'Pending') {
      bindTokenFill(component, variables, 'color.brand.primary');
    } else {
      component.fills = [solidPaint('#20D920')];
    }
    requireDirectTextChildren(component, 1)[0].fills = [solidPaint('#FFFFFF')];
  }

  componentSet.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
    definition.id,
  );
}

function updateCard(
  card: ComponentNode,
  variables: Map<string, Variable>,
): void {
  card.setBoundVariable('itemSpacing', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingTop', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingRight', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingBottom', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('paddingLeft', requireVariable(variables, 'spacing.md'));
  card.setBoundVariable('cornerRadius', requireVariable(variables, 'radius.md'));
  bindTokenFill(card, variables, 'color.bg.surface');

  const textChildren = requireDirectTextChildren(card, 2);
  for (const text of textChildren) {
    bindTokenFill(text, variables, 'color.text.primary');
  }
}

function requireVariantComponent(
  componentSet: ComponentSetNode,
  requestedVariant: Record<string, string>,
): ComponentNode {
  const matches = componentSet.children.filter(
    (node): node is ComponentNode =>
      node.type === 'COMPONENT' &&
      Object.entries(requestedVariant).every(
        ([property, value]) => node.variantProperties?.[property] === value,
      ),
  );
  if (matches.length !== 1) {
    const identity = Object.entries(requestedVariant)
      .map(([property, value]) => `${property}=${value}`)
      .join(', ');
    throw new Error(`Variant identity conflict in ${componentSet.name}: ${identity}`);
  }
  return matches[0];
}

function requireDirectTextChildren(
  node: ComponentNode,
  expectedCount: number,
): TextNode[] {
  const textChildren = node.children.filter(
    (child): child is TextNode => child.type === 'TEXT',
  );
  if (textChildren.length !== expectedCount) {
    throw new Error(
      `${node.name} must contain exactly ${expectedCount} direct TEXT children`,
    );
  }
  return textChildren;
}

function validateScreenSchema(componentIds: Set<string>): void {
  if (!screenSchema.id || !screenSchema.name || screenSchema.width <= 0) {
    throw new Error('Pilot screen id, name, and width are required');
  }
  if (!screenSchema.children.length) {
    throw new Error('Pilot screen must contain children');
  }

  const childIds = new Set<string>();
  for (const child of screenSchema.children) {
    if (!child.id) {
      throw new Error('Every screen child must have a stable id');
    }
    if (childIds.has(child.id)) {
      throw new Error(`Duplicate screen child schema ID: ${child.id}`);
    }
    childIds.add(child.id);

    if (child.type === 'TEXT') {
      if (!child.text || !['TITLE', 'BODY'].includes(child.style)) {
        throw new Error('Invalid screen text child');
      }
      continue;
    }

    if (!componentIds.has(child.componentId)) {
      throw new Error(`Screen references unknown component id: ${child.componentId}`);
    }

    const definition = componentSchema.components.find(
      (component) => component.id === child.componentId,
    );
    if (!definition) throw new Error(`Missing component schema: ${child.componentId}`);

    const requestedVariants = child.variant ?? {};
    for (const [property, value] of Object.entries(requestedVariants)) {
      if (!definition.variantProperties?.[property]?.includes(value)) {
        throw new Error(
          `Invalid ${child.componentId} variant request: ${property}=${value}`,
        );
      }
    }

    if (definition.nodeType === 'COMPONENT_SET' && !child.variant) {
      throw new Error(`Screen must request variants for ${child.componentId}`);
    }
    if (definition.nodeType === 'COMPONENT' && child.variant) {
      throw new Error(`Screen cannot request variants for ${child.componentId}`);
    }
  }
}

async function syncPilotScreen(): Promise<FrameNode> {
  const requiredComponentIds = new Set(
    screenSchema.children
      .filter((child): child is ScreenInstanceChild => child.type === 'INSTANCE')
      .map((child) => child.componentId),
  );
  const components = await findComponentsByStableId(requiredComponentIds);
  for (const componentId of requiredComponentIds) {
    if (!components.has(componentId)) {
      throw new Error(
        `Missing design system component: ${componentId}. Run Sync Design System first.`,
      );
    }
  }

  let screen = await findScreenByStableId(screenSchema.id);
  const isNewScreen = !screen;
  const existingScreenNodeId = screen?.id;
  if (!screen) {
    screen = figma.createFrame();
  } else {
    if (screen.parent?.type !== 'PAGE') {
      throw new Error('Pilot Screen must remain a top-level Frame');
    }
    await figma.setCurrentPageAsync(screen.parent);
  }

  configureScreenFrame(screen);
  await syncScreenChildren(screen, components);
  if (existingScreenNodeId && screen.id !== existingScreenNodeId) {
    throw new Error('Screen Frame node identity changed during UPDATE');
  }

  if (isNewScreen) {
    screen.x = figma.viewport.center.x - screen.width / 2;
    screen.y = figma.viewport.center.y - screen.height / 2;
  }
  return screen;
}

async function findScreenByStableId(screenId: string): Promise<FrameNode | undefined> {
  await figma.loadAllPagesAsync();
  const matches = figma.root.findAll(
    (node) =>
      node.type === 'FRAME' &&
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SCREEN_ID_KEY) === screenId,
  ).filter((node): node is FrameNode => node.type === 'FRAME');
  if (matches.length > 1) {
    throw new Error(`Duplicate screen ID: ${screenId}`);
  }
  return matches[0];
}

function configureScreenFrame(screen: FrameNode): void {
  screen.name = screenSchema.name;
  screen.setSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    SCREEN_ID_KEY,
    screenSchema.id,
  );
  screen.layoutMode = 'VERTICAL';
  screen.primaryAxisSizingMode = 'AUTO';
  screen.counterAxisSizingMode = 'FIXED';
  screen.resize(screenSchema.width, Math.max(screen.height, 100));
  screen.itemSpacing = 16;
  screen.paddingTop = 24;
  screen.paddingRight = 24;
  screen.paddingBottom = 24;
  screen.paddingLeft = 24;
  screen.fills = [solidPaint('#F5F5F5')];
  screen.clipsContent = false;
}

async function syncScreenChildren(
  screen: FrameNode,
  components: Map<string, ComponentNode | ComponentSetNode>,
): Promise<void> {
  const existingChildren = collectManagedScreenChildren(screen);
  const existingNodeIds = new Map(
    [...existingChildren.entries()].map(([childId, node]) => [childId, node.id]),
  );
  const unmanagedOrderBefore = screen.children
    .filter(
      (node) =>
        !node.getSharedPluginData(
          PLUGIN_DATA_NAMESPACE,
          SCREEN_CHILD_ID_KEY,
        ),
    )
    .map((node) => node.id);
  const schemaChildIds = new Set(screenSchema.children.map((child) => child.id));
  const syncedChildren: SceneNode[] = [];

  for (const child of screenSchema.children) {
    let node = existingChildren.get(child.id);
    if (node) {
      await updateManagedScreenChild(node, child);
    } else {
      node = createManagedScreenChild(child, components);
      screen.appendChild(node);
    }
    node.setSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      SCREEN_CHILD_ID_KEY,
      child.id,
    );
    syncedChildren.push(node);
  }

  for (const [childId, node] of existingChildren) {
    if (!schemaChildIds.has(childId)) {
      node.remove();
    }
  }

  syncedChildren.forEach((node, index) => {
    screen.insertChild(index, node);
  });

  const syncedById = collectManagedScreenChildren(screen);
  for (const [childId, previousNodeId] of existingNodeIds) {
    if (!schemaChildIds.has(childId)) continue;
    if (syncedById.get(childId)?.id !== previousNodeId) {
      throw new Error(`Screen child node identity changed during UPDATE: ${childId}`);
    }
  }

  const managedOrder = screen.children
    .map((node) =>
      node.getSharedPluginData(PLUGIN_DATA_NAMESPACE, SCREEN_CHILD_ID_KEY),
    )
    .filter(Boolean);
  if (
    managedOrder.length !== screenSchema.children.length ||
    managedOrder.some((childId, index) => childId !== screenSchema.children[index].id)
  ) {
    throw new Error('Screen managed child order does not match Schema');
  }

  const unmanagedOrderAfter = screen.children
    .filter(
      (node) =>
        !node.getSharedPluginData(
          PLUGIN_DATA_NAMESPACE,
          SCREEN_CHILD_ID_KEY,
        ),
    )
    .map((node) => node.id);
  if (
    unmanagedOrderAfter.length !== unmanagedOrderBefore.length ||
    unmanagedOrderAfter.some((nodeId, index) => nodeId !== unmanagedOrderBefore[index])
  ) {
    throw new Error('Unmanaged screen child order changed during Sync');
  }
}

function collectManagedScreenChildren(
  screen: FrameNode,
): Map<string, SceneNode> {
  const children = new Map<string, SceneNode>();
  for (const node of screen.children) {
    const childId = node.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      SCREEN_CHILD_ID_KEY,
    );
    if (!childId) continue;
    if (children.has(childId)) {
      throw new Error(`Duplicate screen child ID: ${childId}`);
    }
    children.set(childId, node);
  }
  return children;
}

function createManagedScreenChild(
  child: ScreenChild,
  components: Map<string, ComponentNode | ComponentSetNode>,
): TextNode | InstanceNode {
  if (child.type === 'TEXT') {
    const text = figma.createText();
    configureScreenText(text, child);
    return text;
  }

  const component = components.get(child.componentId);
  if (!component) {
    throw new Error(`Missing design system component: ${child.componentId}`);
  }
  const instance = createScreenInstance(component, child);
  configureScreenInstance(instance, child);
  assertScreenInstanceVariants(instance, child);
  return instance;
}

async function updateManagedScreenChild(
  node: SceneNode,
  child: ScreenChild,
): Promise<void> {
  if (child.type === 'TEXT') {
    if (node.type !== 'TEXT') {
      throw new Error(`Screen child type mismatch: ${child.id} must remain TEXT`);
    }
    configureScreenText(node, child);
    return;
  }

  if (node.type !== 'INSTANCE') {
    throw new Error(`Screen child type mismatch: ${child.id} must remain INSTANCE`);
  }
  await assertScreenInstanceComponentIdentity(node, child);
  node.setProperties(child.variant ?? {});
  configureScreenInstance(node, child);
  await assertScreenInstanceComponentIdentity(node, child);
  assertScreenInstanceVariants(node, child);
}

function configureScreenText(text: TextNode, child: ScreenTextChild): void {
  const isTitle = child.style === 'TITLE';
  text.name = child.id;
  text.fontName = isTitle ? FONT_SEMIBOLD : FONT_REGULAR;
  text.fontSize = isTitle ? 24 : 14;
  text.lineHeight = { unit: 'AUTO' };
  text.characters = child.text;
  text.fills = [solidPaint(isTitle ? '#333333' : '#666666')];
  text.layoutAlign = 'STRETCH';
  text.textAutoResize = 'HEIGHT';
}

function configureScreenInstance(
  instance: InstanceNode,
  child: ScreenInstanceChild,
): void {
  instance.name = child.id;
  instance.layoutAlign =
    child.componentId === 'component.card' ? 'STRETCH' : 'INHERIT';
}

async function assertScreenInstanceComponentIdentity(
  instance: InstanceNode,
  child: ScreenInstanceChild,
): Promise<void> {
  const mainComponent = await instance.getMainComponentAsync();
  if (!mainComponent) {
    throw new Error(`Screen child component identity mismatch: ${child.id}`);
  }
  const identityNode =
    mainComponent.parent?.type === 'COMPONENT_SET'
      ? mainComponent.parent
      : mainComponent;
  const actualComponentId = identityNode.getSharedPluginData(
    PLUGIN_DATA_NAMESPACE,
    COMPONENT_ID_KEY,
  );
  if (actualComponentId !== child.componentId) {
    throw new Error(`Screen child component identity mismatch: ${child.id}`);
  }
}

function assertScreenInstanceVariants(
  instance: InstanceNode,
  child: ScreenInstanceChild,
): void {
  for (const [property, value] of Object.entries(child.variant ?? {})) {
    if (instance.componentProperties[property]?.value !== value) {
      throw new Error(
        `Screen child Variant update failed: ${child.id} ${property}=${value}`,
      );
    }
  }
}

async function findComponentsByStableId(
  targetIds: Set<string>,
): Promise<Map<string, ComponentNode | ComponentSetNode>> {
  await figma.loadAllPagesAsync();
  const components = new Map<string, ComponentNode | ComponentSetNode>();
  const candidates = figma.root.findAll(
    (node) => node.type === 'COMPONENT' || node.type === 'COMPONENT_SET',
  );

  for (const candidate of candidates) {
    if (candidate.type !== 'COMPONENT' && candidate.type !== 'COMPONENT_SET') continue;
    const componentId = candidate.getSharedPluginData(
      PLUGIN_DATA_NAMESPACE,
      COMPONENT_ID_KEY,
    );
    if (!targetIds.has(componentId)) continue;
    if (components.has(componentId)) {
      throw new Error(`Duplicate component ID: ${componentId}`);
    }
    components.set(componentId, candidate);
  }

  return components;
}

function createScreenInstance(
  component: ComponentNode | ComponentSetNode,
  child: ScreenInstanceChild,
): InstanceNode {
  if (component.type === 'COMPONENT') {
    return component.createInstance();
  }

  const instance = component.defaultVariant.createInstance();
  instance.setProperties(child.variant ?? {});
  return instance;
}

function requireVariants(definition: ComponentDefinition): Array<Record<string, string>> {
  if (!definition.variants?.length) {
    throw new Error(`${definition.name} has no variants`);
  }
  return definition.variants;
}

function requireVariantValue(variant: Record<string, string>, property: string): string {
  const value = variant[property];
  if (!value) throw new Error(`Variant is missing ${property}`);
  return value;
}

function requireVariable(variables: Map<string, Variable>, name: string): Variable {
  const variable = variables.get(name);
  if (!variable) throw new Error(`Variable was not created: ${name}`);
  return variable;
}

function requireColorToken(id: string): ColorToken {
  const token = tokenSchema.tokens.find((candidate) => candidate.id === id);
  if (!token || token.type !== 'COLOR') {
    throw new Error(`Missing COLOR token in loaded schema: ${id}`);
  }
  return token;
}

function requireFloatToken(id: string): FloatToken {
  const token = tokenSchema.tokens.find((candidate) => candidate.id === id);
  if (!token || token.type !== 'FLOAT') {
    throw new Error(`Missing FLOAT token in loaded schema: ${id}`);
  }
  return token;
}

function getLoadedSchemaSummary(): LoadedSchemaSummary {
  return {
    brand: requireColorToken('color.brand.primary').value,
    radius: requireFloatToken('radius.md').value,
  };
}

function assertVariantLayout(componentSet: ComponentSetNode, expectedCount: number): void {
  const variants = componentSet.children.filter(
    (node): node is ComponentNode => node.type === 'COMPONENT',
  );

  if (variants.length !== expectedCount) {
    throw new Error(
      `${componentSet.name} must contain exactly ${expectedCount} COMPONENT variants`,
    );
  }

  for (let index = 0; index < variants.length; index += 1) {
    for (let comparisonIndex = index + 1; comparisonIndex < variants.length; comparisonIndex += 1) {
      const first = variants[index];
      const second = variants[comparisonIndex];
      const overlaps =
        first.x < second.x + second.width &&
        first.x + first.width > second.x &&
        first.y < second.y + second.height &&
        first.y + first.height > second.y;

      if (overlaps) {
        throw new Error(
          `${componentSet.name} variants overlap: ${first.name} and ${second.name}`,
        );
      }
    }
  }
}

function createText(value: string, fontSize: number, fontName: FontName): TextNode {
  const text = figma.createText();
  text.fontName = fontName;
  text.fontSize = fontSize;
  text.lineHeight = { unit: 'AUTO' };
  text.characters = value;
  text.textAutoResize = 'WIDTH_AND_HEIGHT';
  return text;
}

function bindTokenFill(
  node: ComponentNode | TextNode,
  variables: Map<string, Variable>,
  tokenId: string,
): void {
  const token = requireColorToken(tokenId);
  const variable = requireVariable(variables, tokenId);
  bindSolidFill(node, variable, token.value);
}

function bindSolidFill(
  node: ComponentNode | TextNode,
  variable: Variable,
  tokenHex: string,
): void {
  const currentFills = node.fills === figma.mixed ? [] : [...node.fills];
  const boundSolidPaintIndex = currentFills.findIndex(
    (paint) =>
      paint.type === 'SOLID' &&
      paint.boundVariables?.color?.id === variable.id,
  );
  const solidPaintIndex =
    boundSolidPaintIndex >= 0
      ? boundSolidPaintIndex
      : currentFills.findIndex((paint) => paint.type === 'SOLID');

  if (solidPaintIndex >= 0) {
    const existingPaint = currentFills[solidPaintIndex] as SolidPaint;
    const canonicalPaint = figma.util.solidPaint(tokenHex, existingPaint);
    currentFills[solidPaintIndex] = figma.variables.setBoundVariableForPaint(
      canonicalPaint,
      'color',
      variable,
    );
    node.fills = currentFills;
    return;
  }

  node.fills = [
    figma.variables.setBoundVariableForPaint(
      figma.util.solidPaint(tokenHex),
      'color',
      variable,
    ),
  ];
}

function solidPaint(hex: string): SolidPaint {
  return {
    type: 'SOLID',
    color: hexToRgb(hex),
  };
}

function hexToRgb(hex: string): RGB {
  const normalized = hex.replace('#', '');
  if (!/^[0-9a-fA-F]{6}$/.test(normalized)) {
    throw new Error(`Unsupported color value: ${hex}`);
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
