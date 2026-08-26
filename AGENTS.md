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
- `projects/pingpong_topdown/`：PingPong Topdown 项目根目录。
- `projects/pingpong_topdown/index.html`：PingPong 项目的版本入口。

## 修改原则

- 不要把某个项目版本页重新放回仓库根目录。
- 根首页只做项目入口；项目卡片链接到当前主版本，不链接到版本列表页。
- 项目内部页面才做版本入口；新增项目时保留 `projects/<project>/index.html` 用于列出迭代版本。
- 新增或调整项目版本后，如果当前主版本变化，要同步更新根首页项目卡片链接、README / README_EN 的当前主版本说明，以及必要的项目 README。
- 节拍器控制功能应尽量使用统一模型：Tempo / Meter / Rhythm / Count In / Click Volume / Start / Reset，以及未播放常驻、播放后自动隐藏、靠近底部或点击显示的面板交互。不要为每个项目随意重写一套不兼容的节拍器控件；确有差异时先复用同一状态语义和控件命名。
- 当前主版本的节拍面板必须通过 `shared/metronome/metronome-panel.js` 的 `data-metronome-panel` 占位元素生成，并引用 `shared/metronome/metronome-panel.css`；不要在项目页面复制面板 HTML。页面只通过 `data-*` 配置初始值和可选控件，并用 CSS 变量定义主题。节拍时序统一复用 `shared/metronome/metronome.js`；不使用共享时序引擎的旧项目也必须复用共享面板 UI。离线分发版本可内置这三份共享文件的副本，但应保持同源并在共享模块更新后同步。
- 页面 CSS 不得定义 `.rhythm-panel`、`.rhythm-primary`、`.control-group`、`.control-grid`、`.beat-*`、`.rhythm-readout`、`.transport-*`、`.volume-*` 或 `.offbeat-control`；面板容器、内部结构与移动端断点全部由共享 `metronome-panel.css` 控制。页面差异只能通过 `--metronome-*` 变量表达。
- 除小红书小工具等明确要求离线分发的版本外，仓库中的项目都按正常互联网 Web 项目处理：需要第三方库、字体、图标或其他公开资源时应正常声明并引用，不要为了离线兼容而复制、内联或自行重写。离线分发版本不得依赖网络资源，所需依赖必须随包内置或内联，并与在线版本保持同源。界面图标统一从 [Lucide](https://lucide.dev/icons/) 选用；节拍运输控件使用 `play`、`pause` 和 `rotate-ccw`。
- 新建或修改小红书小工具时必须遵守根目录 [`MINITOOL.md`](./MINITOOL.md)；小工具的离线结构、端能力、前后摄像头切换、操作优先级、上下容器避让、JSBridge 与打包规则只在该文档集中维护，其他文档只链接，不复制通用规则。
- 修改中文 README 时，同步检查 `README_EN.md` 是否也需要对应更新。
- 修改英文 README 时，同步检查 `README.md` 是否也需要对应更新。
- 如果用户明确说“先不提交”，不要 commit 或 push。
- 不要自动触发 Pages 部署，除非用户明确要求提交或部署。

## 文档职责

- 根目录 `README.md` / `README_EN.md` 记录仓库定位、公开项目、当前主版本、仓库导航以及开发和部署入口；不承载 AI 临时工作状态。
- 根目录 `AGENTS.md` 记录全仓库长期有效的 AI 执行规则、共享约束和文档维护方式。进入具体项目开发前，先阅读该项目的 `README.md`；存在 `AI_CONTEXT.md` 时还必须一并阅读。
- 项目 `README.md` 记录项目定位、当前主版本、版本列表、长期设计方向、实际使用的项目级第三方依赖与创作参考。
- 项目 `AI_CONTEXT.md` 只记录当前目标、关键实现约束、近期仍影响开发的决定、已知问题、待验证项和下一步；不复制完整版本历史、通用仓库规则或稳定依赖清单。
- 共享模块使用的第三方库、固定版本、加载顺序、选用原因、离线处理和源码位置记录在该共享模块自己的 README。全仓库统一选型和使用规则才写入本文件。
- 创作参考记录在对应项目 README，并说明参考了什么、没有复制什么，以及它对当前方案的影响。短期选型比较或替换计划才放入项目 `AI_CONTEXT.md`。

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
