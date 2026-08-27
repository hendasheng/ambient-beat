# Recursive Cells

Recursive Cells 是 Ambient Beat 中的动态递归切割视觉实验。

## 发布信息

- 名称：氛围节拍 - 递归细胞
- 一句话介绍：用递归呈现节奏变化的节拍器。

它来自 Houdini `set_recursive_cells` 的思路：用一组静态 `rest` 点决定递归矩形分割结构，再用随时间运动的点去推动最终显示边界。这样画面会持续运动，但 cell 的父子关系和切割拓扑保持稳定，不会每帧随机跳变。

v0.1 使用原生 Canvas2D 实现黑白版本。画面从整个 viewport 开始递归二分，切割方向优先选择更长边，切割位置带有可控 irregularity；每条显示切线会读取附近运动点的偏移，并通过安全限制避免重叠、反向和过度压扁。当前版本已接入共享节拍器：播放时每个 beat 都会生成不同的运动目标姿态，切割线在节拍之间以急入缓出的曲线过渡；同时显示切割比例会按绝对 beat / bar 推进到新的持久目标，让 cell 面积分布持续演化，而不是在每拍后回到同一套分割。v0.1 的视觉记录为：黑底白线、递归铺满屏幕、只绘制内部 cell 边线、无外边框、左上参数面板与底部节拍面板同步显示和隐藏。

v0.2 在 v0.1 的全屏递归切割基础上引入 FFmpeg `testsrc` 风格配色。色块之间不额外绘制白色或黑色边线，而是像测试图卡一样用硬边色面直接相接。v0.2 还加入稀疏单行 cell 内节拍信息、动态 fit 文本、自由预览用 Motion / Speed、Start / Pause 短视觉过渡，以及 `F` fullscreen。

v0.3 以 v0.2 之后的当前实验状态作为新主版本，进一步加强 signal monitor / testsrc 工程感：浅层 cell 更接近白、黄、青、绿、品红、红、蓝、黑的标准彩条顺序，部分中层 cell 使用灰阶 ramp；较大的递归块会稀疏显示单行节拍和工程信息，例如 `BPM 92`、`BEAT 1/4`、`BAR 001`、`PH 0.314`、`TC 00:01:08`、`FPS 60`、`SIG LOCK`；文本尺寸会根据 cell 宽高连续动态 fit，接近最小可读尺寸时先降低透明度再消失，每类信息每帧最多出现 3 次。少量大 cell 会显示短准星或角 tick，作为工程校准标记，但不形成连续边框。左上参数面板按 Structure、Preview、Camera 分组排列：Structure 控制 Points、Min Size、Irregularity 和 Reset Seed；Preview 控制未启动节拍时的 Motion / Speed，自由预览默认值为 Motion 0.45、Speed 0.20；Camera 可开启 / 关闭摄像头并选择摄像机源，采集画面会以 cover 模式绘制到一个带粘性的承载 cell 中，只有当前承载 cell 消失或缩小到阈值以下时才切换到当前最大的 cell，避免画面闪烁。节拍控制面板复用共享的 Offbeat / Click / Start / Reset 底栏布局，Offbeat 只增加反拍点击声，不驱动画面变化。Count In 期间点位和切割继续按原有自由预览方式运动，但不进入正式节拍驱动；正式第 1 拍到来后平滑切换到节拍运动。移动端上下控制区全部常驻：视觉参数使用两栏紧凑布局，BPM、Meter、Motion、Count In、Beat 状态和运输栏使用底部紧凑布局；上方面板按底部实际高度限制最大高度，极小屏幕时分别内部滚动而不会覆盖。Start / Pause 保持 metronome 节拍时钟干净，只对点位和切割分布做短暂视觉过渡，避免递归分布像被刷新。`F` 快捷键用于切换 fullscreen，表单控件聚焦时不会触发。

## 依赖与参考

- 递归切割机制参考 Houdini `set_recursive_cells` 的思路，只迁移“静态 rest 点稳定拓扑、运动点推动显示边界”的核心机制，不复制完整 Houdini 网络。
- 当前主版本没有项目级第三方运行库；共享节拍器和 Lucide 图标信息见 [`shared/metronome/README.md`](../../shared/metronome/README.md)。
- [`icon_generator/`](./icon_generator/) 单独使用 [Hugeicons](https://hugeicons.com/) `@hugeicons/core-free-icons@4.2.1` 的 `HandsClappingIcon`，通过 jsDelivr 动态导入，只服务于图标生成工具，不进入主版本运行链路。

## Versions

- [recursive_cells_xhs_0.2](./recursive_cells_xhs_0.2/)：基于当前 Web 主版本 v0.3 重新生成的小红书小工具源码。资源完全离线，使用共享节拍器副本，以 `facingMode` 提供前后摄像头切换，并接入保存画面和发布笔记的 JSBridge；Count In 期间保持自由预览运动，正式第 1 拍再平滑进入节拍驱动。不替代 Web 主版本。
- [recursive_cells_xhs_0.1](./recursive_cells_xhs_0.1/)：恢复为 2026-08-20 Git 历史状态的旧小工具源码，作为上次打包版本的开发记录保留。
- [recursive_cells_0.3](./recursive_cells_0.3/)：当前主版本。以 v0.2 之后的实验状态为基础，加强 FFmpeg testsrc / signal monitor 风格，包含规则彩条、灰阶 ramp、稀疏工程字段、动态 fit 文本、少量校准标记、可选摄像头输入，以及共享节拍器 Offbeat 控制。
- [recursive_cells_0.2](./recursive_cells_0.2/)：建立 FFmpeg testsrc 风格测试色块、稀疏单行 cell 内节拍信息、动态 fit 文本、自由预览用 Motion / Speed、Start / Pause 短视觉过渡，以及 `F` fullscreen。
- [recursive_cells_0.1](./recursive_cells_0.1/)：建立动态黑白递归切割，包含 point count、min size、irregularity、reset seed、beat / bar 级切割比例推进、全屏内部边线绘制、同步隐藏控制面板，以及 Tempo、Meter、Rhythm、Count In、Click Volume、Start 和 Reset 控制。

## 设计方向

- v0.1 保持黑白、线框、块面为主的视觉语言；v0.2 使用 FFmpeg testsrc 风格的高饱和测试色块；v0.3 继续向 signal monitor / 工程测试图卡方向推进。
- 拓扑稳定，运动来自显示边界的局部推拉。
- 使用统一节拍器语义，让递归运动和乐句级切割分布跟随 Tempo / Meter / Rhythm。
- 后续可以继续调整拍点脉冲的视觉力度，或把节拍分层映射到不同深度的 cell。

## 小红书小工具构建

- 当前源码目录：`projects/recursive_cells/recursive_cells_xhs_0.2/`
- 当前上传包：`recursive_cells_xhs_0.2.zip`，于 2026-08-27 生成到本机下载目录，不纳入仓库；SHA-256 为 `CA6F25EA833372ED27F5182DB2401F151E8C8C1CAE34ECCF64EB45795670FEC4`
- 历史源码目录：`projects/recursive_cells/recursive_cells_xhs_0.1/`（2026-08-20 状态）
- 历史上传包：`artifacts/recursive_cells_xhs_0.1.zip`
- 对外名称：`氛围节拍-递归细胞`
- 通用开发、端能力、布局与打包规则：[`../../MINITOOL.md`](../../MINITOOL.md)
