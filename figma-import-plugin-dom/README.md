# 校园心理小程序页面导入器 DOM版

这个版本从真实预览页面提取 DOM 位置、文字、颜色、圆角、边框和阴影数据后生成。

## 使用

在 Figma 桌面版中选择：

Plugins -> Development -> Import plugin from manifest...

选择：

C:\Users\18668\Documents\畅树UI重绘\figma-import-plugin-dom\manifest.json

然后运行：

Plugins -> Development -> 校园心理小程序页面导入器 DOM版

## 和旧版区别

旧版是手工重建页面结构；DOM版以真实网页渲染结果为来源，因此更接近预览页面。

## 限制

- 仍不是浏览器渲染引擎，渐变、复杂阴影、图标和表单控件会有少量差异。
- 图层会比较多，但文字、卡片、按钮、标签仍可编辑。
