# Recursive Cells

Recursive Cells 是 Ambient Beat 中的动态递归切割视觉实验。

## 发布信息

- 名称：氛围节拍 - 递归细胞
- 一句话介绍：用递归呈现节奏变化的节拍器。

它来自 Houdini `set_recursive_cells` 的思路：用一组静态 `rest` 点决定递归矩形分割结构，再用随时间运动的点去推动最终显示边界。这样画面会持续运动，但 cell 的父子关系和切割拓扑保持稳定，不会每帧随机跳变。

v0.1 使用原生 Canvas2D 实现黑白版本。画面从整个 viewport 开始递归二分，切割方向优先选择更长边，切割位置带有可控 irregularity；每条显示切线会读取附近运动点的偏移，并通过安全限制避免重叠、反向和过度压扁。当前版本已接入共享节拍器：播放时每个 beat 都会生成不同的运动目标姿态，切割线在节拍之间以急入缓出的曲线过渡；同时显示切割比例会按绝对 beat / bar 推进到新的持久目标，让 cell 面积分布持续演化，而不是在每拍后回到同一套分割。v0.1 的视觉记录为：黑底白线、递归铺满屏幕、只绘制内部 cell 边线、无外边框、左上参数面板与底部节拍面板同步显示和隐藏。

v0.2 在 v0.1 的全屏递归切割基础上引入 FFmpeg `testsrc` 风格配色。色块之间不额外绘制白色或黑色边线，而是像测试图卡一样用硬边色面直接相接。v0.2 还加入稀疏单行 cell 内节拍信息、动态 fit 文本、自由预览用 Motion / Speed、Start / Pause 短视觉过渡，以及 `F` fullscreen。

v0.3 以 v0.2 之后的当前实验状态作为新主版本，进一步加强 signal monitor / testsrc 工程感：浅层 cell 更接近白、黄、青、绿、品红、红、蓝、黑的标准彩条顺序，部分中层 cell 使用灰阶 ramp；较大的递归块会稀疏显示单行节拍和工程信息，例如 `BPM 92`、`BEAT 1/4`、`BAR 001`、`PH 0.314`、`TC 00:01:08`、`FPS 60`、`SIG LOCK`；文本尺寸会根据 cell 宽高连续动态 fit，接近最小可读尺寸时先降低透明度再消失，每类信息每帧最多出现 3 次。少量大 cell 会显示短准星或角 tick，作为工程校准标记，但不形成连续边框。左上参数面板按 Structure、Preview、Camera 分组排列：Structure 控制 Points、Min Size、Irregularity 和 Reset Seed；Preview 控制未启动节拍时的 Motion / Speed，自由预览默认值为 Motion 0.45、Speed 0.20；Camera 可开启 / 关闭摄像头并选择摄像机源，采集画面会以 cover 模式绘制到一个带粘性的承载 cell 中，只有当前承载 cell 消失或缩小到阈值以下时才切换到当前最大的 cell，避免画面闪烁。节拍控制面板复用共享的 Offbeat / Click / Start / Reset 底栏布局，Offbeat 只增加反拍点击声，不驱动画面变化。移动端上下控制区全部常驻：视觉参数使用两栏紧凑布局，BPM、Meter、Motion、Count In、Beat 状态和运输栏使用底部紧凑布局；上方面板按底部实际高度限制最大高度，极小屏幕时分别内部滚动而不会覆盖。Start / Pause 保持 metronome 节拍时钟干净，只对点位和切割分布做短暂视觉过渡，避免递归分布像被刷新。`F` 快捷键用于切换 fullscreen，表单控件聚焦时不会触发。

## Versions

- [recursive_cells_xhs_0.1](./recursive_cells_xhs_0.1/)：基于 v0.3 的小红书小工具分发版，对外标题为“氛围节拍-递归细胞”，不替代当前 Web 主版本。共享节拍器资源已内置，使用离线相对路径，移除容器禁用的摄像头枚举与 fullscreen，并通过 `window.xhs.miniTool` 提供保存画面和发布笔记。
- [recursive_cells_0.3](./recursive_cells_0.3/)：当前主版本。以 v0.2 之后的实验状态为基础，加强 FFmpeg testsrc / signal monitor 风格，包含规则彩条、灰阶 ramp、稀疏工程字段、动态 fit 文本、少量校准标记、可选摄像头输入，以及共享节拍器 Offbeat 控制。
- [recursive_cells_0.2](./recursive_cells_0.2/)：建立 FFmpeg testsrc 风格测试色块、稀疏单行 cell 内节拍信息、动态 fit 文本、自由预览用 Motion / Speed、Start / Pause 短视觉过渡，以及 `F` fullscreen。
- [recursive_cells_0.1](./recursive_cells_0.1/)：建立动态黑白递归切割，包含 point count、min size、irregularity、reset seed、beat / bar 级切割比例推进、全屏内部边线绘制、同步隐藏控制面板，以及 Tempo、Meter、Rhythm、Count In、Click Volume、Start 和 Reset 控制。

## 设计方向

- v0.1 保持黑白、线框、块面为主的视觉语言；v0.2 使用 FFmpeg testsrc 风格的高饱和测试色块；v0.3 继续向 signal monitor / 工程测试图卡方向推进。
- 拓扑稳定，运动来自显示边界的局部推拉。
- 使用统一节拍器语义，让递归运动和乐句级切割分布跟随 Tempo / Meter / Rhythm。
- 后续可以继续调整拍点脉冲的视觉力度，或把节拍分层映射到不同深度的 cell。

## 小红书小工具构建

`recursive_cells_xhs_0.1` 是可独立打包的离线 H5 目录，入口为根层级 `index.html`。目录内不依赖仓库的 `shared/` 文件，也不加载 CDN 或其他网络资源。

- 源码目录：`projects/recursive_cells/recursive_cells_xhs_0.1/`
- 上传包：`artifacts/recursive_cells_xhs_0.1.zip`
- 对外名称：`氛围节拍-递归细胞`
- 构建 skill：`.codex/skills/minitool-zip-builder/SKILL.md`
- ZIP 根目录直接包含 `index.html`，没有额外包裹目录。
- 摄像头由用户点击后调用 `getUserMedia()`；不枚举设备。
- 保存画面使用 `writeTempFile()` 与 `saveImageToPhotosAlbum()`；发布使用 `postNote()`。
- 在普通浏览器中可预览视觉和节拍交互，但保存与发布功能需要小红书小工具容器注入 JSBridge。
- 移动端面板沿用 v0.3 的最终布局：上下控制区全部常驻，上方结构 / 预览 / 摄像头使用两栏紧凑排列，下方节拍核心区使用双列紧凑排列；HUD 根据底部节拍面板的实际高度动态限制空间。保存 / 发布是可选 JSBridge 能力，按钮放在摄像头参数组内，避免与小红书容器右上角原生按钮重叠。面向用户的参数和状态使用中文，UI 字体使用中文无衬线系统字体栈，“速度”读数使用“拍/分”，仅保留 `FPS`、节拍细分值及 Canvas 工程字段等技术标记；Canvas 内工程字段继续使用等宽字体以保持 signal monitor 风格。
