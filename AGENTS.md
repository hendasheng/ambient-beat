# AI 协作提示

这份文件给 AI / 编码助手使用。请优先遵守用户最新指令，并保持改动小而清晰。

## 仓库定位

Ambient Beat 是一个基于 Web Audio 与实时视觉的开源节拍器实验集合。

根目录首页是项目入口，不是某个单项目的版本入口。首页项目卡片面向 GitHub Pages 访客，点击应直接进入该项目当前主版本；项目内部的 `projects/<project>/index.html` 才是版本列表入口。

## 目录约定

- `index.html`：仓库首页，列出项目入口。
- `README.md`：默认中文 README。
- `README_EN.md`：英文 README。
- `CONTRIBUTING.md`：给人类合作者看的贡献说明。
- `AGENTS.md`：给 AI / 编码助手看的协作提示。
- `projects/`：所有具体项目的父目录。
- `shared/`：跨项目复用的静态资源和功能模块，例如统一节拍器核心。
- `projects/pingpong_topdown/`：PingPong Topdown 项目根目录。
- `projects/pingpong_topdown/index.html`：PingPong 项目的版本入口。

## 修改原则

- 不要把某个项目版本页重新放回仓库根目录。
- 根首页只做项目入口；项目卡片链接到当前主版本，不链接到版本列表页。
- 项目内部页面才做版本入口；新增项目时保留 `projects/<project>/index.html` 用于列出迭代版本。
- 新增或调整项目版本后，如果当前主版本变化，要同步更新根首页项目卡片链接、README / README_EN 的当前主版本说明，以及必要的项目 README。
- 节拍器控制功能应尽量使用统一模型：Tempo / Meter / Rhythm / Count In / Click Volume / Start / Reset，以及未播放常驻、播放后自动隐藏、靠近底部或点击显示的面板交互。不要为每个项目随意重写一套不兼容的节拍器控件；确有差异时先复用同一状态语义和控件命名。
- 修改中文 README 时，同步检查 `README_EN.md` 是否也需要对应更新。
- 修改英文 README 时，同步检查 `README.md` 是否也需要对应更新。
- 如果用户明确说“先不提交”，不要 commit 或 push。
- 不要自动触发 Pages 部署，除非用户明确要求提交或部署。

## Pages 部署

GitHub Pages 由 `.github/workflows/pages.yml` 部署。

workflow 会复制以下内容到部署 artifact：

- `index.html`
- `.nojekyll`
- `projects/`
- `shared/`

如果新增的公开静态资源不在这些路径里，需要同步更新 workflow。

## 检查建议

- 静态页面改动后，检查链接路径是否仍然相对正确。
- JS 改动后，至少对对应文件运行 `node --check`。
- Pages 部署失败时，先查看 Actions 失败步骤，不要盲目改站点结构。
