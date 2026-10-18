# 在 GitHub 上发布 UDI

[English](../PUBLISHING.md) | **简体中文**

公开仓库为 [deepbule0/UDI](https://github.com/deepbule0/UDI)。项目是一份**实验性提案与参考原型**，提供英文与简体中文文档。公开发布不代表获得了研究验证或达到生产可用水平。

## 仓库元数据

- 仓库：[deepbule0/UDI](https://github.com/deepbule0/UDI)。
- 演示部署目标：`https://deepbule0.github.io/UDI/`。
- 英文描述：`A draft framework for user-shaped app experiences: AI and direct controls, personal data choices, and easy sharing. Bilingual desktop and phone research demos.`
- 中文说明：`支持智能体编辑与界面分享的应用模型提案。中英双语桌面和手机参考演示提供对话与设置式控件、个人数据管理及社区分享。`
- Topics：`ai-agents`、`chinese`、`declarative-ui`、`end-user-programming`、`generative-ui`、`human-computer-interaction`、`interface-sharing`、`personal-software`、`progressive-web-app`、`typescript`、`user-defined-interface`。
- 已提供许可证：原创代码与文档使用 MIT；请项目所有者在发布前审阅。
- 首个公开发布标签：`v0.1.0`。
- 当前版本：`v0.4.0`；界面包格式仍为 Core `0.1`。
- 手机演示：`https://deepbule0.github.io/UDI/mobile.html`，通过 `?lang=zh-CN` 或 `?lang=en` 选择语言。

添加作者元数据或引用文件时，请使用真实姓名和实际机构信息。项目没有虚构作者身份。发布者应为仓库配置私密安全报告渠道。

保留术语历史致谢：Wixon 等已在 CHI 1983 使用该表述和缩写。应将本项目介绍为在已有描述性术语下提出的架构与原型，不要声称发明了术语本身。

## 验证待发布版本

```sh
npm ci
npm run check
npx playwright install chromium
npm run test:e2e
npm run test:pwa
npm run evaluate
```

审阅截图、[立场论文](POSITION-PAPER.md)、[安全局限](SECURITY.md)、[相关工作](RELATED-WORK.md)和生成的评估报告。仓库中的浏览器截图使用虚构记录。本地模型冒烟测试结果（如有）仅是范围有限的观察，不是基准评测。

## 获取源码并继续发布

本地使用可克隆公开仓库。发布更新前，先检查已有历史和远程地址：

```sh
git clone https://github.com/deepbule0/UDI.git
cd UDI
git status
git remote -v
```

使用常规提交和推送更新仓库，并保持两个语言版本同步。在原始工作区中，GitHub 远程地址名为 `github`；新克隆的仓库使用 `origin`。应检查已有远程地址，而非覆盖它：

```sh
git push -u github HEAD:main
```

为经过验证的发布提交创建新的版本标签，并用两种语言发布说明。不要移动已有的发布标签，也不要通过强制推送覆盖无关工作。`.openai/hosting.json` 包含私密预览的 Site ID，而非凭据；它仅属于该预览，GitHub Pages 会忽略它。贡献者在创建自己的全新 Sites 项目时，应省略 `project_id`，让注册过程生成新 ID。绝不提交 `.openai/.local`、凭据、浏览器状态或真实记录。

## 通过 GitHub Pages 发布静态演示

当前 Pages 部署以 `gh-pages` 分支的根目录为来源。该分支包含已在本地验证的生产构建文件和 `.nojekyll` 标记，可编辑源码保留在 `main` 分支。更新部署文件前应先在本地构建并完成验证。构建使用相对资源基础路径，支持 `/UDI/` 项目子路径。

当 GitHub 托管的 Actions 运行器可用时，附带的 **Deploy demo to Pages** 工作流可作为另一种部署方式。使用时，在 Settings → Pages 中将来源改为 GitHub Actions，再手动触发工作流。只有确认该方式能够完成部署后，才应切换线上来源。分支发布不能替代源码校验工作流，也不能证明 CI 已运行。

公开的静态演示仅使用离线解析器。可选的本地模型桥接服务用于本地开发，不应作为生产 API 对外暴露。请在 [GitHub Actions 运行记录](https://github.com/deepbule0/UDI/actions)中查看实际 CI 和部署结果，并在确认部署成功后再报告演示已上线。

请发布完整的 `dist/` 产物，包括 `mobile.html`、`manifest.webmanifest`、`sw.js`、`icons/` 和带哈希的资源文件，不要只部署桌面 HTML。应在实际 `/UDI/` 子路径下验证两个手机语言链接，等待 Service Worker 就绪后再测试离线。更新期间保留旧的哈希资源，让已打开的页面能够完成加载。发布时同步更新中英文 README、手机指南、发布说明、截图和现有预览，并保留历史版本标签。

仓库标签 `udi-interface` 与 `.github/ISSUE_TEMPLATE/share-interface.md` 模板支持社区发布。请保留标记与单个 JSON 代码块，正确配置模板标签，并验证公开 Issues 动态。应用仅打开 GitHub 编辑器，由用户最终提交；不要植入虚假用户帖子或公开私人测试数据。

## 发布说明

以 [ANNOUNCEMENT.md](ANNOUNCEMENT.md) 为起点。先说明普通使用者的个性化、受支持的行为、数据选择与简单体验分享，再解释背后的界面包与实例分离。如实描述解析器、连接器、可移植性和安全性。在没有实际评估的情况下，避免“首创”“新标准”“生产级安全”或暗示优越性的比较。
