const fs = require('fs');
const path = require('path');

const root = process.cwd();
const outDir = path.join(root, 'figma-import-plugin-dom');
const dataPath = path.join(outDir, 'screens-data.json');
const screens = JSON.parse(fs.readFileSync(dataPath, 'utf8'));

const manifest = {
  name: '校园心理小程序页面导入器 DOM版',
  api: '1.0.0',
  main: 'code.js',
  editorType: ['figma'],
};

fs.writeFileSync(path.join(outDir, 'manifest.json'), JSON.stringify(manifest, null, 2), 'utf8');

const code = `// Generated DOM-based editable importer. No MCP/network required.
var SCREENS = ${JSON.stringify(screens)};
var COLS = 4;
var GAP_X = 72;
var ROW_H = 2300;
var fonts = null;
var loadedFonts = {};

main().catch(function(error) {
  figma.closePlugin('DOM版导入失败：' + (error && error.message ? error.message : String(error)));
});

async function main() {
  fonts = await resolveFonts();
  await loadFontOnce(fonts.regular);
  await loadFontOnce(fonts.medium);
  await loadFontOnce(fonts.semibold);
  await loadFontOnce(fonts.bold);

  var start = findStartPosition();
  var created = [];
  for (var i = 0; i < SCREENS.length; i++) {
    var s = SCREENS[i];
    var frame = figma.createFrame();
    frame.name = s.name;
    frame.resize(375, Math.max(812, Math.ceil(s.height)));
    frame.x = start.x + (i % COLS) * (375 + GAP_X);
    frame.y = start.y + Math.floor(i / COLS) * ROW_H;
    frame.clipsContent = false;
    frame.fills = [{
      type: 'GRADIENT_LINEAR',
      gradientTransform: [[0, 1, 0], [-1, 0, 1]],
      gradientStops: [
        { position: 0, color: rgba('#F4F6FF', 1) },
        { position: 1, color: rgba('#FFF8EF', 1) }
      ]
    }];
    figma.currentPage.appendChild(frame);
    addShapes(frame, s.shapes || []);
    addTexts(frame, s.texts || []);
    created.push(frame);
  }
  figma.currentPage.selection = created;
  figma.viewport.scrollAndZoomIntoView(created);
  figma.closePlugin('DOM版导入完成：已生成 ' + created.length + ' 个可编辑 Frame');
}

async function resolveFonts() {
  var available = await figma.listAvailableFontsAsync();
  var first = available && available.length ? available[0].fontName : { family: 'Inter', style: 'Regular' };
  function has(family, style) {
    return available.some(function(f) {
      return f.fontName.family === family && f.fontName.style === style;
    });
  }
  var families = ['Alibaba PuHuiTi 3.0', 'Alibaba PuHuiTi', 'Microsoft YaHei', 'PingFang SC', 'Noto Sans CJK SC', 'Source Han Sans CN', 'Inter'];
  var styles = {
    regular: ['Regular', '55 Regular'],
    medium: ['Medium', '65 Medium', 'Regular'],
    semibold: ['Semibold', 'SemiBold', 'Semi Bold', '75 SemiBold', 'Medium', 'Bold'],
    bold: ['Bold', '85 Bold', 'Semibold', 'Semi Bold', 'Medium']
  };
  function pick(weight) {
    for (var i = 0; i < families.length; i++) {
      for (var j = 0; j < styles[weight].length; j++) {
        if (has(families[i], styles[weight][j])) return { family: families[i], style: styles[weight][j] };
      }
    }
    return first;
  }
  return { regular: pick('regular'), medium: pick('medium'), semibold: pick('semibold'), bold: pick('bold') };
}

async function loadFontOnce(font) {
  var key = font.family + '/' + font.style;
  if (loadedFonts[key]) return;
  loadedFonts[key] = true;
  await figma.loadFontAsync(font);
}

function findStartPosition() {
  var maxX = 0;
  for (var i = 0; i < figma.currentPage.children.length; i++) {
    var c = figma.currentPage.children[i];
    if ('x' in c && 'width' in c) maxX = Math.max(maxX, c.x + c.width);
  }
  return { x: maxX + 160, y: 0 };
}

function addShapes(parent, shapes) {
  shapes.sort(function(a, b) { return area(b) - area(a); });
  for (var i = 0; i < shapes.length; i++) {
    var s = shapes[i];
    if (s.w < 2 || s.h < 2) continue;
    var node = figma.createFrame();
    node.name = 'shape / ' + (s.name || 'layer');
    node.x = round(s.x);
    node.y = round(s.y);
    node.resize(Math.max(1, round(s.w)), Math.max(1, round(s.h)));
    node.cornerRadius = Math.max(0, round(s.radius || 0));
    node.clipsContent = false;
    if (s.gradient) {
      node.fills = [{
        type: 'GRADIENT_LINEAR',
        gradientTransform: [[0, 1, 0], [-1, 0, 1]],
        gradientStops: [
          { position: 0, color: rgba('#F2F4FF', 1) },
          { position: 1, color: rgba('#FFF8EF', 1) }
        ]
      }];
    } else if (s.bg && s.bg.hex) {
      node.fills = [solid(s.bg.hex, s.bg.opacity == null ? 1 : s.bg.opacity)];
    } else {
      node.fills = [];
    }
    if (s.border && s.border.hex && s.borderWidth > 0) {
      node.strokes = [solid(s.border.hex, s.border.opacity == null ? 1 : s.border.opacity)];
      node.strokeWeight = Math.max(1, round(s.borderWidth));
    } else {
      node.strokes = [];
    }
    if (s.shadow) {
      node.effects = [{
        type: 'DROP_SHADOW',
        color: { r: 0.24, g: 0.28, b: 0.45, a: 0.10 },
        offset: { x: 0, y: 8 },
        radius: 22,
        spread: 0,
        visible: true,
        blendMode: 'NORMAL'
      }];
    }
    parent.appendChild(node);
  }
}

function addTexts(parent, texts) {
  for (var i = 0; i < texts.length; i++) {
    var t = texts[i];
    if (!t.text || !String(t.text).trim()) continue;
    var node = figma.createText();
    node.name = 'text / ' + String(t.text).slice(0, 24);
    node.fontName = fontByWeight(t.fontWeight);
    node.characters = String(t.text);
    var fs = Math.max(8, Math.min(48, round(t.fontSize || 14)));
    node.fontSize = fs;
    node.lineHeight = { unit: 'PIXELS', value: Math.max(fs + 2, round(t.lineHeight || fs + 6)) };
    node.textAlignHorizontal = align(t.align);
    node.textAlignVertical = 'TOP';
    node.x = round(t.x);
    node.y = round(t.y);
    node.resize(Math.max(4, round(t.w) + 6), Math.max(4, round(t.h) + 4));
    if (t.color && t.color.hex) node.fills = [solid(t.color.hex, t.color.opacity == null ? 1 : t.color.opacity)];
    parent.appendChild(node);
  }
}

function fontByWeight(w) {
  var n = parseInt(w || '400', 10);
  if (n >= 700) return fonts.bold;
  if (n >= 600) return fonts.semibold;
  if (n >= 500) return fonts.medium;
  return fonts.regular;
}

function align(a) {
  if (a === 'center') return 'CENTER';
  if (a === 'right') return 'RIGHT';
  return 'LEFT';
}

function area(s) { return (s.w || 0) * (s.h || 0); }
function round(n) { return Math.round((Number(n) || 0) * 10) / 10; }
function solid(hex, opacity) { return { type: 'SOLID', color: rgb(hex), opacity: opacity == null ? 1 : opacity }; }
function rgb(hex) {
  var h = String(hex || '#000000').replace('#', '');
  return {
    r: parseInt(h.slice(0, 2), 16) / 255,
    g: parseInt(h.slice(2, 4), 16) / 255,
    b: parseInt(h.slice(4, 6), 16) / 255
  };
}
function rgba(hex, a) {
  var c = rgb(hex);
  return { r: c.r, g: c.g, b: c.b, a: a };
}
`;

fs.writeFileSync(path.join(outDir, 'code.js'), code, 'utf8');
fs.writeFileSync(path.join(outDir, 'README.md'), [
  '# 校园心理小程序页面导入器 DOM版',
  '',
  '这个版本从真实预览页面提取 DOM 位置、文字、颜色、圆角、边框和阴影数据后生成。',
  '',
  '## 使用',
  '',
  '在 Figma 桌面版中选择：',
  '',
  'Plugins -> Development -> Import plugin from manifest...',
  '',
  '选择：',
  '',
  path.join(outDir, 'manifest.json'),
  '',
  '然后运行：',
  '',
  'Plugins -> Development -> 校园心理小程序页面导入器 DOM版',
  '',
  '## 和旧版区别',
  '',
  '旧版是手工重建页面结构；DOM版以真实网页渲染结果为来源，因此更接近预览页面。',
  '',
  '## 限制',
  '',
  '- 仍不是浏览器渲染引擎，渐变、复杂阴影、图标和表单控件会有少量差异。',
  '- 图层会比较多，但文字、卡片、按钮、标签仍可编辑。',
  '',
].join('\n'), 'utf8');

console.log(path.join(outDir, 'manifest.json'));
console.log(path.join(outDir, 'code.js'));
