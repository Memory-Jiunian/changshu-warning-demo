# 校园心理小程序页面导入器

这个文件夹是一个本地 Figma 插件，用来把当前 Demo 的页面生成成可编辑 Frame。

## 使用方式

1. 打开 Figma 桌面版。
2. 打开你要写入页面的 Figma 文件。
3. 菜单选择 `Plugins -> Development -> Import plugin from manifest...`。
4. 选择本文件夹下的 `manifest.json`。
5. 再次打开 `Plugins -> Development -> 校园心理小程序页面导入器`。
6. 插件会在当前 Page 中生成 12 个移动端 Frame。

## 生成内容

- 班主任：首页、观察任务详情、填写观察反馈、上报协作线索
- 心理老师：首页、反馈确认详情、补充反馈确认抽屉
- 年级主任：首页、督办详情、提醒确认抽屉
- 校长：首页、督办确认抽屉

## 说明

- 生成结果是 Figma 原生可编辑图层，不是截图。
- 文本、按钮、标签、卡片、抽屉都是独立图层。
- 插件优先使用本机可用中文字体：阿里巴巴普惠体、Microsoft YaHei、PingFang SC、Noto Sans CJK SC 等。
- 如果字体不存在，Figma 会使用可加载的备用字体。
