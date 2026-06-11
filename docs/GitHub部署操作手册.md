# 校园心理健康小程序 Demo：GitHub Pages 部署操作手册

这份手册用于把当前本地 Demo 发布到网上，让别人可以用公开链接访问。项目是静态前端 Demo，不接真实后端，适合用 GitHub Pages 部署。

## 1. 本地项目位置

当前项目目录：

```cmd
C:\Users\18668\Documents\畅树UI重绘
```

以后所有命令都建议先进入这个目录：

```cmd
cd /d C:\Users\18668\Documents\畅树UI重绘
```

## 2. 本地预览

在项目目录运行：

```cmd
npm run preview -- --host 127.0.0.1 --port 4173
```

然后打开：

```text
http://127.0.0.1:4173/
```

如果端口被占用，可以换成：

```cmd
npm run preview -- --host 127.0.0.1 --port 4174
```

对应打开：

```text
http://127.0.0.1:4174/
```

## 3. 发布前检查

每次准备发布前，先运行：

```cmd
npm run build
```

看到 `built` 或 `✓ built` 类似提示，说明构建成功。

## 4. 第一次上传到 GitHub

### 4.1 在 GitHub 新建仓库

1. 打开 GitHub。
2. 点击右上角 `+`。
3. 选择 `New repository`。
4. 仓库名可以写：`changshu-warning-demo`。
5. 选择 `Public` 或 `Private`。
6. 不要勾选自动创建 README、.gitignore 或 License。
7. 点击 `Create repository`。

### 4.2 在本地初始化 Git

进入项目目录：

```cmd
cd /d C:\Users\18668\Documents\畅树UI重绘
```

初始化仓库：

```cmd
git init
git add .
git commit -m "初始化校园心理健康小程序 Demo"
```

绑定远程仓库。把下面地址换成你自己的 GitHub 仓库地址：

```cmd
git remote add origin https://github.com/你的用户名/changshu-warning-demo.git
git branch -M main
git push -u origin main
```

## 5. 开启 GitHub Pages

第一次推送后，进入 GitHub 仓库页面：

1. 点击 `Settings`。
2. 左侧点击 `Pages`。
3. 在 `Build and deployment` 中选择 `GitHub Actions`。
4. 回到仓库顶部，点击 `Actions`。
5. 等待 `Deploy GitHub Pages` 运行完成。

完成后，GitHub Pages 会生成一个公开链接，通常类似：

```text
https://你的用户名.github.io/changshu-warning-demo/
```

## 6. 后续修改页面后如何更新线上版本

以后每次改完页面，只需要：

```cmd
cd /d C:\Users\18668\Documents\畅树UI重绘
npm run build
git add .
git commit -m "更新页面"
git push
```

推送后 GitHub Actions 会自动重新部署。通常等待几十秒到几分钟，公开链接就会自动变成最新版本。

## 7. 如果别人打不开

优先检查：

1. GitHub Actions 是否运行成功。
2. GitHub Pages 是否选择了 `GitHub Actions`。
3. 公开链接是否复制完整。
4. 如果仓库是 Private，GitHub Pages 访问权限可能受账号计划或仓库设置影响。

## 8. 隐私提醒

当前 Demo 使用 mock data，可以用于作品集展示。后续如果继续扩展，不要上传真实学生姓名、测评结果、咨询记录、敏感题项或 AI 原始判断。

校级管理者视角只适合展示聚合数据和流程压力，不应展示个体学生隐私。

## 9. 当前项目已内置的自动部署配置

项目中已经新增：

```text
.github/workflows/deploy-github-pages.yml
```

这个文件会在你推送到 `main` 或 `master` 分支时自动：

1. 安装依赖。
2. 运行 `npm run build`。
3. 把 `dist` 部署到 GitHub Pages。

