# 校园心理小程序页面导入器 结构化版

这个版本按照附件规范重新生成：

- 使用 Figma Auto-layout 思维组织页面。
- 不按 DOM 坐标堆叠图层。
- 页面由 Header、Hero、Stat、Card、Tag、Button、Form、Notice、BottomBar 等组件构成。
- 图层采用语义化命名，避免 `Frame 123` 这类无意义命名。
- 视觉参考当前小程序预览页，重点提升 Figma 内的可编辑性和结构可维护性。

## 使用方式

1. 打开 Figma 桌面版。
2. 打开目标文件。
3. 选择 `Plugins -> Development -> Import plugin from manifest...`
4. 选择：

`C:\Users\18668\Documents\畅树UI重绘\figma-import-plugin-structured\manifest.json`

5. 运行：

`Plugins -> Development -> 校园心理小程序页面导入器 结构化版`

## 与前两个版本的区别

- 手工版：结构可编辑，但视觉与页面差异大。
- DOM版：更接近网页截图，但图层是坐标堆叠，不符合设计稿维护习惯。
- 结构化版：按组件和 Auto-layout 生成，更适合作为作品集 Figma 源文件继续调整。
