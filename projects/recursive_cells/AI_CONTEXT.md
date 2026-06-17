# Recursive Cells AI Context

这份文档给后续 AI / 编码助手快速接手 `recursive_cells` 项目使用。

## 项目定位

`Recursive Cells` 是 `ambient-beat` 仓库里的一个新视觉实验项目，当前主版本是 `v0.1`。

目标是把 Houdini 中 `set_recursive_cells` 的递归矩形切割逻辑迁移到 Web 页面里，先做一个动态黑白版本。它不是完整复制 Houdini 网络，而是复刻核心机制：

- 一组静态 `rest` 点决定递归切割结构。
- 当前运动点推动最终显示边界。
- cell 的父子结构保持稳定，不随动画每帧重建成不同拓扑。
- 显示切线有安全限制，避免重叠、反向、压扁。

视觉方向：黑底、白线、黑白块面、监视器式 UI，不做彩色 Mondrian。

## 仓库约定

请先阅读根目录 `AGENTS.md`。关键约定：

- 根目录 `index.html` 是项目入口页，项目卡片直接链接当前主版本。
- 项目内部 `projects/<project>/index.html` 是版本列表入口。
- 新增或调整主版本时，同步更新：
  - 根目录 `index.html`
  - `README.md`
  - `README_EN.md`
  - 项目自己的 `README.md`
- 不要自动 commit / push，除非用户明确要求。

## 当前文件

```text
projects/recursive_cells/
├── AI_CONTEXT.md
├── README.md
├── index.html
└── recursive_cells_0.1/
    ├── index.html
    ├── sketch.js
    └── style.css
```

相关根目录文件：

```text
index.html
README.md
README_EN.md
AGENTS.md
```

注意：当前工作区里 `AGENTS.md` 可能已有用户自己的修改。不要回滚不属于你的改动。

## v0.1 页面

入口：

```text
projects/recursive_cells/recursive_cells_0.1/index.html
```

实现方式：

- 原生 `Canvas2D`
- 无构建步骤
- 无外部依赖
- 直接用 VS Code Live Server 或浏览器打开静态页面即可

当前控件：

- `Points`：控制生成 rest 点数量。
- `Min Size`：控制递归切割的最小 cell 尺寸。
- `Motion`：控制运动点对显示切线的推动强度。
- `Irregularity`：控制切割位置偏离中心的随机程度。
- `Speed`：控制点运动速度。
- `Reset Seed`：换一组随机点和切割种子。

HUD 中还显示：

- cell 数量
- 估算 FPS

## 算法概要

核心文件：

```text
projects/recursive_cells/recursive_cells_0.1/sketch.js
```

### 1. 点集

`resetPoints()` 生成一组点。每个点有：

- `restX / restZ`：静态参考位置，决定递归结构。
- `curX / curZ`：当前运动位置，决定显示边界偏移。
- `phaseX / phaseZ`
- `freqX / freqZ`
- `amp`

`updatePoints(time)` 每帧更新 `curX / curZ`，但不改变 `restX / restZ`。

### 2. 递归切割

`buildCells()` 每帧重算显示 cell。它使用 stack 模拟递归二分。

每个 stack item 保存两套 bounds：

- `rminx / rmaxx / rminz / rmaxz`：rest bounds，用于判断点属于哪个 cell，并决定稳定拓扑。
- `dminx / dmaxx / dminz / dmaxz`：display bounds，用于最终绘制，会被运动点推动。

切割停止条件：

- 达到 `maxDepth`
- 当前 rest cell 内没有点
- rest 尺寸小于 `minSize * 2`
- display bounds 已经退化
- 深度概率 `splitChance - depth * depthFalloff` 判定不继续切

切割方向：

- 如果 X 明显更长，沿 X 切。
- 如果 Z 明显更长，沿 Z 切。
- 如果长宽接近，用 seeded random 决定方向。

切割位置：

- 基于 rest bounds 中点。
- 用 `irregularity` 加入 seeded jitter。
- 再 clamp 到 `minSize` 范围内。

显示切线：

- 先把 rest split 映射到当前 display bounds。
- 找 rest 空间中离切线最近的点。
- 用该点的 `cur - rest` 作为局部 offset。
- 通过 `safeSplit()` 限制偏移。

### 3. 安全切割

`safeSplit(baseSplit, localOffset, dmin, dmax, minSize, motionBlend)` 对显示切线做保护：

- 限制最大 offset 为当前 display 尺寸的 35%。
- 根据 `motionBlend` 混合运动影响。
- 留出 margin，避免切线靠边造成退化。
- 如果当前 display 区域太小，直接返回中心。

这是从 Houdini VEX 版本保留下来的关键逻辑。

### 4. 绘制

`drawBackground(time)`：

- 黑底
- 低透明度白色网格

`drawCells(time)`：

- 遍历叶子 cells。
- 部分 cell 以 seeded random 填白块。
- 所有 cell 画白色 stroke。
- 保持黑白视觉，不引入彩色。

`drawRestPoints()`：

- 以低透明度绘制当前运动点，便于观察控制场。
- 如果后续想做更纯视觉版，可以隐藏或加开关。

## 已完成

- 新增 `recursive_cells` 项目目录。
- 新增 `recursive_cells_0.1` 版本。
- 新增项目版本入口页。
- 新增项目 README。
- 根首页已增加 Recursive Cells 卡片。
- 中文 README / 英文 README 已加入项目说明和目录树。
- `node --check projects\recursive_cells\recursive_cells_0.1\sketch.js` 已通过。

## 未完成 / 待验证

- 尚未完成浏览器视觉截图验证。之前尝试连接 in-app Browser 时返回：

```text
Browser is not available: iab
```

- 用户可能会用自己的浏览器或 Live Server 预览页面。
- 如果接手后可以使用浏览器工具，应打开以下页面检查：

```text
projects/recursive_cells/recursive_cells_0.1/index.html
```

检查重点：

- 首屏是否有黑白递归 cell。
- 动画是否持续。
- 控件是否不遮挡主要画面。
- 移动端顶部 HUD 是否合理。
- `Points` 调整后 cell 数量是否变化。
- `Motion` 调整后切线运动幅度是否变化。
- `Reset Seed` 是否换图案。

## 后续方向

优先级建议：

1. 浏览器视觉 QA，修正布局、比例、性能问题。
2. 增加一个隐藏点显示的开关，让画面可以更接近纯切割图形。
3. 增加导出 PNG 或录制提示。
4. 将运动接入 `shared/metronome/metronome.js` 或统一节拍器模型，让切割线在拍点上脉冲。
5. 做 `v0.2` 时再考虑彩色、音频、节拍联动，不要把 0.1 变复杂。

## 风格注意

- 保持黑白，不要默认加彩色渐变。
- 不要把根首页变成版本页。
- 不要删除或回滚用户已有改动。
- 如果修改 README 中文内容，同步检查 `README_EN.md`。
- 如果新增主版本，根首页卡片应直接链接新主版本，而不是项目版本列表。
