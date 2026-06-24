run().catch(async (error) => {
  const message = error && error.message ? error.message : String(error);
  figma.closePlugin('测试插件失败：' + message);
});

async function run() {
  const fonts = await figma.listAvailableFontsAsync();
  const font = fonts && fonts.length ? fonts[0].fontName : { family: 'Inter', style: 'Regular' };
  await figma.loadFontAsync(font);

  const frame = figma.createFrame();
  frame.name = '测试 Frame - 如果看到这个说明插件环境正常';
  frame.resize(375, 240);
  frame.x = 0;
  frame.y = 0;
  frame.fills = [{ type: 'SOLID', color: { r: 0.95, g: 0.97, b: 1 } }];
  frame.cornerRadius = 24;

  const title = figma.createText();
  title.name = '测试文字';
  title.fontName = font;
  title.characters = 'Hello，Figma 插件运行正常';
  title.fontSize = 24;
  title.x = 24;
  title.y = 32;
  title.resize(320, 40);
  title.fills = [{ type: 'SOLID', color: { r: 0.12, g: 0.16, b: 0.26 } }];
  frame.appendChild(title);

  const body = figma.createText();
  body.name = '说明文字';
  body.fontName = font;
  body.characters = '下一步可以运行完整页面导入器。';
  body.fontSize = 15;
  body.x = 24;
  body.y = 84;
  body.resize(320, 28);
  body.fills = [{ type: 'SOLID', color: { r: 0.36, g: 0.42, b: 0.54 } }];
  frame.appendChild(body);

  figma.currentPage.selection = [frame];
  figma.viewport.scrollAndZoomIntoView([frame]);
  figma.closePlugin('测试完成：已创建一个 Frame');
}
