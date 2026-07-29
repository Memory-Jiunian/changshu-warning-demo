import tokenSchemaJson from '../../../design-system/tokens.json';
import componentSchemaJson from '../../../design-system/components.json';

type ColorToken = {
  name: string;
  type: 'COLOR';
  value: string;
};

type FloatToken = {
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

type ComponentDefinition = {
  name: string;
  nodeType: 'COMPONENT' | 'COMPONENT_SET';
  variantProperties?: Record<string, string[]>;
  variants?: Array<Record<string, string>>;
};

type ComponentSchema = {
  components: ComponentDefinition[];
};

const tokenSchema = tokenSchemaJson as TokenSchema;
const componentSchema = componentSchemaJson as ComponentSchema;

const FONT_REGULAR: FontName = { family: 'Inter', style: 'Regular' };
const FONT_SEMIBOLD: FontName = { family: 'Inter', style: 'Semi Bold' };

figma.showUI(__html__, {
  width: 280,
  height: 112,
  themeColors: true,
  title: 'Figma Design Compiler',
});

figma.ui.onmessage = async (message: { type?: string }) => {
  if (message.type !== 'build-design-system') return;

  try {
    validateSchemas();
    await Promise.all([
      figma.loadFontAsync(FONT_REGULAR),
      figma.loadFontAsync(FONT_SEMIBOLD),
    ]);

    const variables = createVariables();
    const nodes = buildComponents(variables);

    figma.currentPage.selection = nodes;
    figma.viewport.scrollAndZoomIntoView(nodes);
    figma.notify('Pilot 01 design system created.');
    figma.ui.postMessage({ type: 'build-complete' });
  } catch (error) {
    const messageText = error instanceof Error ? error.message : String(error);
    console.error(error);
    figma.notify(`Build failed: ${messageText}`, { error: true });
    figma.ui.postMessage({ type: 'build-error' });
  }
};

function validateSchemas(): void {
  const requiredTokens = [
    'color.brand.primary',
    'color.text.primary',
    'color.bg.surface',
    'spacing.md',
    'radius.md',
  ];
  const tokenNames = new Set(tokenSchema.tokens.map((token) => token.name));

  for (const tokenName of requiredTokens) {
    if (!tokenNames.has(tokenName)) {
      throw new Error(`Missing token: ${tokenName}`);
    }
  }

  const componentNames = new Set(componentSchema.components.map((component) => component.name));
  for (const componentName of ['Button', 'Badge', 'Card']) {
    if (!componentNames.has(componentName)) {
      throw new Error(`Missing component: ${componentName}`);
    }
  }
}

function createVariables(): Map<string, Variable> {
  const collection = figma.variables.createVariableCollection(tokenSchema.collection.name);
  const variables = new Map<string, Variable>();

  for (const definition of tokenSchema.tokens) {
    const variable = figma.variables.createVariable(
      definition.name,
      collection,
      definition.type,
    );

    variable.setValueForMode(
      collection.defaultModeId,
      definition.type === 'COLOR' ? hexToRgb(definition.value) : definition.value,
    );
    variables.set(definition.name, variable);
  }

  return variables;
}

function buildComponents(variables: Map<string, Variable>): SceneNode[] {
  const buttonDefinition = getComponentDefinition('Button', 'COMPONENT_SET');
  const badgeDefinition = getComponentDefinition('Badge', 'COMPONENT_SET');
  getComponentDefinition('Card', 'COMPONENT');

  const center = figma.viewport.center;
  const buttonSet = buildButtonSet(buttonDefinition, variables);
  buttonSet.x = center.x - buttonSet.width / 2;
  buttonSet.y = center.y - buttonSet.height / 2;

  const badgeSet = buildBadgeSet(badgeDefinition, variables);
  badgeSet.x = buttonSet.x + buttonSet.width + 80;
  badgeSet.y = buttonSet.y;

  const card = buildCard(variables);
  card.x = buttonSet.x;
  card.y = buttonSet.y + buttonSet.height + 80;

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

function buildButtonSet(
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
    bindSolidFill(
      component,
      requireVariable(
        variables,
        isPrimary ? 'color.brand.primary' : 'color.bg.surface',
      ),
    );

    if (!isPrimary) {
      component.strokes = [solidPaint('#DADADA')];
      component.strokeWeight = 1;
    }

    const label = createText('Button', size === 'SM' ? 14 : 16, FONT_SEMIBOLD);
    if (isPrimary) {
      label.fills = [solidPaint('#FFFFFF')];
    } else {
      bindSolidFill(label, requireVariable(variables, 'color.text.primary'));
    }
    component.appendChild(label);

    return component;
  });

  const componentSet = figma.combineAsVariants(components, figma.currentPage);
  componentSet.name = definition.name;
  return componentSet;
}

function buildBadgeSet(
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
      bindSolidFill(component, requireVariable(variables, 'color.brand.primary'));
    } else {
      component.fills = [solidPaint('#20D920')];
    }

    const label = createText(status, 12, FONT_SEMIBOLD);
    label.fills = [solidPaint('#FFFFFF')];
    component.appendChild(label);
    return component;
  });

  const componentSet = figma.combineAsVariants(components, figma.currentPage);
  componentSet.name = definition.name;
  return componentSet;
}

function buildCard(variables: Map<string, Variable>): ComponentNode {
  const card = figma.createComponent();
  card.name = 'Card';
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
  bindSolidFill(card, requireVariable(variables, 'color.bg.surface'));
  card.strokes = [solidPaint('#EEEEEE')];
  card.strokeWeight = 1;

  const title = createText('Card title', 16, FONT_SEMIBOLD);
  const body = createText('Supporting content for the card component.', 14, FONT_REGULAR);
  title.layoutAlign = 'STRETCH';
  body.layoutAlign = 'STRETCH';
  title.textAutoResize = 'HEIGHT';
  body.textAutoResize = 'HEIGHT';
  bindSolidFill(title, requireVariable(variables, 'color.text.primary'));
  bindSolidFill(body, requireVariable(variables, 'color.text.primary'));
  card.appendChild(title);
  card.appendChild(body);

  return card;
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

function createText(value: string, fontSize: number, fontName: FontName): TextNode {
  const text = figma.createText();
  text.fontName = fontName;
  text.fontSize = fontSize;
  text.lineHeight = { unit: 'AUTO' };
  text.characters = value;
  text.textAutoResize = 'WIDTH_AND_HEIGHT';
  return text;
}

function bindSolidFill(
  node: GeometryMixin & MinimalFillsMixin,
  variable: Variable,
): void {
  node.fills = [
    figma.variables.setBoundVariableForPaint(
      solidPaint('#000000'),
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
