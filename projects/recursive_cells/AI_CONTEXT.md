# Recursive Cells AI Context

这份文档给后续 AI / 编码助手快速接手 `recursive_cells` 项目使用。

## 项目定位

`Recursive Cells` 是 `ambient-beat` 仓库里的一个新视觉实验项目，当前主版本是 `v0.3`。

目标是把 Houdini 中 `set_recursive_cells` 的递归矩形切割逻辑迁移到 Web 页面里，先做一个动态黑白版本。它不是完整复制 Houdini 网络，而是复刻核心机制：

- 一组静态 `rest` 点决定递归切割结构。
- 当前运动点推动最终显示边界。
- cell 的父子结构保持稳定，不随动画每帧重建成不同拓扑。
- 显示切线有安全限制，避免重叠、反向、压扁。
- 当前版本已接入 `shared/metronome/metronome.js`，播放时递归动态跟随 Tempo / Meter / Rhythm，并在 beat 上产生切线脉冲。
- 显示切割比例会按绝对 beat / bar 推进到新的持久目标，避免画面长期停留在同一套面积分布，或每拍后回到初始分割。

视觉方向：v0.1 是黑底、白线、黑白块面、监视器式 UI；v0.2 转为 FFmpeg `testsrc` 风格测试色块；v0.3 继续加强 signal monitor / 工程测试图卡感，不做彩色 Mondrian。

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
├── recursive_cells_0.1/
│   ├── index.html
│   ├── sketch.js
│   └── style.css
├── recursive_cells_0.2/
│   ├── index.html
│   ├── sketch.js
│   └── style.css
├── recursive_cells_0.3/
    ├── index.html
    ├── sketch.js
    └── style.css
└── recursive_cells_xhs_0.1/
    ├── index.html
    ├── metronome.js
    ├── metronome-panel.css
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

## 当前主版本 v0.3

入口：

```text
projects/recursive_cells/recursive_cells_0.3/index.html
```

v0.3 已从 v0.2 之后的当前实验状态复制为新主版本，并加强 FFmpeg `testsrc` / signal monitor 工程感。浅层 cell 更接近白、黄、青、绿、品红、红、蓝、黑的标准彩条顺序；部分中层 cell 使用灰阶 ramp。色块之间不额外绘制白色或黑色边线，应像测试图卡一样用硬边色面直接相接。

v0.3 较大的递归块会稀疏显示单行节拍 / 工程 / 结构信息，例如 `BPM 92`、`BEAT 1/4`、`BAR 001`、`PH 0.314`、`TC 00:01:08`、`FPS 60`、`SIG LOCK`。文本尺寸必须根据 cell 宽高连续动态 fit，接近最小可读尺寸时用 `cellTextAlpha()` 先降低透明度再消失；每类信息每帧最多出现 3 次，不要让每个 cell 都有内容。

v0.3 少量大 cell 可以显示短准星或角 tick 作为工程校准标记，但不要形成连续边框，也不要让标记密度高到破坏 testsrc 硬边色块。

v0.3 左上参数面板按 `Structure / Preview / Camera` 分组排列。`Structure` 包含 `Points / Min Size / Irregularity / Reset Seed`；`Preview` 包含 `Motion / Speed`，主要用于未启动节拍时的自由预览，不要再当作无效控件删除，默认值为 Motion `0.45`、Speed `0.20`；`Camera` 包含摄像头开启 / 关闭、摄像机源选择和状态文本。

移动端（`max-width: 680px`）不使用展开 / 收起状态，上下控制区全部常驻。HUD 使用两栏布局：Structure 位于左栏，Preview 与 Camera 堆叠在右栏，摄像头按钮和来源选择并排。节拍面板保持 BPM / Meter / Motion / Count In、Beat 进度 / 状态和运输栏全部可见；`rhythm-primary` 使用双列紧凑布局并省略重复的组标题。`ResizeObserver` 会把节拍面板实际高度写入 `--mobile-rhythm-panel-height`，HUD 用该值计算 `max-height`；内容较少时背景自然收缩，空间不足时才内部滚动，同时避免两个面板覆盖。

Camera 开启后使用 `getUserMedia()` 采集视频，并以 cover 模式绘制到一个承载 cell 中。承载 cell 通过 `videoCellKey` 保持粘性：只要当前 cell 还存在且没有小到阈值以下，就继续跟随这个 cell 的动态尺寸；只有当前 cell 消失或过小时才重新选择当前最大的 cell，避免视频在画面中每帧跳动闪烁。

Start / Pause 不应刷新递归分布，也不能打乱 metronome 节拍。v0.3 不给 beat clock 叠全局 offset；只用 `beginPointTransition()` 和 `beginSplitTransition()` 在切换瞬间做短暂视觉过渡。

`F` 快捷键切换 fullscreen。实现应避开 `input / select / textarea / button / contenteditable` 聚焦状态，避免用户调控件时误触发。

## 小红书小工具分发版

`projects/recursive_cells/recursive_cells_xhs_0.1/` 基于 v0.3 创建，是独立的离线分发变体，不是 GitHub Pages 当前主版本。根首页项目卡片仍应直接链接 `recursive_cells_0.3/index.html`。

小红书版对外标题使用 `氛围节拍-递归细胞`，用于页面标题、HUD 显示名、可访问性标签和发布笔记标题。不要恢复成 `Recursive Cells v0.3` 这类仓库内部版本名，也不要只写 `递归细胞` 而丢掉 `氛围节拍` 系列名。

`artifacts/recursive_cells_xhs_0.1.zip` 是当前源码更新前的历史上传包；下次用户明确要求打包时需要重新生成，不能把它视为与源码同步的最新产物。

小红书版面向用户的控制文案使用中文，UI 字体使用中文无衬线系统字体栈，速度参数与读数分别显示“速度”和“拍/分”；`FPS`、`1/8`、`1/8T`、`1/16` 等标记保持原样。不要为了中文化修改 DOM ID、select value、节拍状态字段或 Canvas 内的工程监视器标签，因此 Canvas cell 中的 `BPM` 工程字段仍保留，Canvas 内工程字段也继续使用等宽字体以保持 signal monitor 风格。

所有小工具通用规则统一见仓库根目录 [`MINITOOL.md`](../../MINITOOL.md)，本文件不重复维护端能力、摄像头切换、操作优先级、安全区、容器避让、JSBridge 或打包规则。

## v0.1 记录

入口：

```text
projects/recursive_cells/recursive_cells_0.1/index.html
```

实现方式：

- 原生 `Canvas2D`
- 无构建步骤
- 依赖仓库内 `shared/metronome/metronome.js`
- 直接用 VS Code Live Server 或浏览器打开静态页面即可

当前控件：

- `Points`：控制生成 rest 点数量。
- `Min Size`：控制递归切割的最小 cell 尺寸。
- `Irregularity`：控制切割位置偏离中心的随机程度。
- `Motion`：控制运动点对显示切线的推动强度，主要影响未播放时的自由预览。
- `Speed`：控制点运动速度，主要影响未播放时的自由预览；播放时仍会按 Rhythm 倍率影响每拍目标姿态的推进速度。
- `Reset Seed`：换一组随机点和切割种子。
- `Tempo / Meter / Rhythm / Count In / Click Volume / Start / Reset`：共享节拍器控制。未播放时底部面板常驻，播放后自动隐藏，靠近底部或点击画面显示。

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

`updatePoints(time, now)` 每帧更新 `curX / curZ`，但不改变 `restX / restZ`。暂停时使用自由时间预览；播放时使用 shared metronome 的 beat clock，通过 `beatPose()` 为每个 beat 生成不同的确定性目标姿态，并在当前 beat 和下一 beat 的姿态之间插值。每个 beat 会写入 `beatEnergy`，短时间明显增强运动幅度和 `safeSplit()` 里的切线偏移；第 1 拍会比普通拍更强。

`splitMorphClock(now)` 使用绝对 beat 编号作为推进时间。`splitMorphOffset()` 给每个 cell key 和切割轴生成当前 beat 与下一 beat 的确定性目标偏移，并混入 bar 级目标，让变化有局部拍点推进，也有较长周期的分布漂移。这个偏移加在显示空间的 `baseDsplit` 上，再交给 `safeSplit()` clamp；因此面积分布会持续变化，但 rest 拓扑仍然稳定。

Start / Pause 不能通过修改 `beatClock()`、`musicalBeat()` 或全局 clock offset 来解决刷新感，否则视觉节拍会和 metronome 错开。当前做法是：`beginPointTransition(now)` 捕捉切换瞬间的点位，并在约 260ms 内过渡到新目标；`beginSplitTransition(now)` 捕捉切换瞬间的 split morph clock，并在约 260ms 内把切割分布 blend 到新状态。blend 结束后视觉完全回到干净的 metronome / free-preview 时钟。

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
- 叠加 `splitMorphOffset()` 的 beat / bar 级持久比例推进。
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
- v0.1 部分 cell 以 seeded random 填白块，所有 cell 画白色 stroke。
- v0.2 使用 `testsrcPalette` 为每个 cell 分配测试图卡色块。
- v0.3 浅层 cell 使用 `testsrcBars` 的标准彩条顺序，部分中层 cell 使用 `grayRamp`。
- v0.2 起不绘制内部白色 / 黑色 stroke；相邻 cell 依靠硬边色面区分。
- v0.3 在足够大的 cell 中绘制单行文本，使用 `fitTextSize()` 根据 cell 尺寸连续计算小数字号，避免整数 px 级跳变。
- 文本由 `shouldDrawCellText()` 和 label 计数控制密度，每类信息每帧最多出现 3 次；由 `cellTextAlpha()` 根据 cell 尺寸渐隐，避免突然消失。
- `drawCalibrationMark()` 只为少量大 cell 绘制短准星 / 角 tick，不画连续边框。

当前版本不绘制背景网格和控制点，只绘制递归切割本体。

## 已完成

- 新增 `recursive_cells` 项目目录。
- 新增 `recursive_cells_0.1` 版本。
- 新增项目版本入口页。
- 新增项目 README。
- 接入共享节拍器，底部 rhythm panel 提供 Tempo / Meter / Rhythm / Count In / Click Volume / Start / Reset。
- 增加 beat / bar 级显示切割比例推进，改善“只在同一分布上 0-1-0 往复抖动”的问题。
- 将节拍内插值改为急入缓出，避免缓入缓出的节拍响应。
- v0.2 恢复独立参数面板中的 Motion / Speed 控件，用于未播放时的自由预览；排列在结构参数之后、Reset Seed 之前。
- Start / Pause 保持 metronome 节拍时钟干净，只对点位和切割分布做短视觉过渡，避免开启 / 暂停节拍时递归像被刷新。
- 增加 `F` fullscreen 快捷键，表单控件聚焦时不触发。
- 去掉 v0.2 的内部黑 / 白描边，改为 testsrc 式硬边色块相接。
- 增加稀疏单行 cell 内节拍 / 结构信息，字号跟随 cell 尺寸动态 fit，每类信息最多出现 3 次。
- 新增 `recursive_cells_0.3` 作为当前主版本，加强 testsrc 工程感：浅层规则彩条、少量灰阶 ramp、稀疏工程字段、少量校准准星 / 角 tick。
- 左上参数面板与底部节拍面板同步显示 / 隐藏。
- 去掉背景网格和点场，只保留递归切割本体。
- 递归切割铺满整个屏幕，绘制时只画内部 cell 边线，不画外边框。
- 新增 `recursive_cells_0.2` 作为当前主版本，内容从 v0.1 当前状态复制，并加入 FFmpeg testsrc 风格色块。
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
projects/recursive_cells/recursive_cells_0.3/index.html
```

检查重点：

- 首屏是否有黑白递归 cell。
- 动画是否持续。
- 控件是否不遮挡主要画面。
- 移动端顶部 HUD 是否合理。
- `Points` 调整后 cell 数量是否变化。
- 未播放时 `Motion` 调整后切线运动幅度是否变化。
- 未播放时 `Speed` 调整后自由预览速度是否变化。
- Start / Pause 时节拍声、beat readout 和视觉拍点是否保持一致；递归分布是否短过渡而不是瞬间刷新。
- `F` 是否能切换 fullscreen，且表单控件聚焦时不会触发。
- 左上参数面板是否和底部节拍面板同步显示 / 隐藏。
- `Reset Seed` 是否换图案。

## 后续方向

优先级建议：

1. 浏览器视觉 QA，修正布局、比例、性能问题。
2. 增加一个隐藏点显示的开关，让画面可以更接近纯切割图形。
3. 增加导出 PNG 或录制提示。
4. 继续调拍点脉冲的视觉力度，或把不同 cell 深度映射到不同 Rhythm 分层。
5. 后续继续 v0.3 时围绕 testsrc / signal monitor 风格深化，先等用户给明确方向，不要猜测新功能。

## 风格注意

- v0.1 保持黑白，不要默认加彩色渐变；v0.2 / v0.3 使用 testsrc 测试色块，不要改成普通渐变或彩色 Mondrian。
- 不要把根首页变成版本页。
- 不要删除或回滚用户已有改动。
- 如果修改 README 中文内容，同步检查 `README_EN.md`。
- 如果新增主版本，根首页卡片应直接链接新主版本，而不是项目版本列表。
