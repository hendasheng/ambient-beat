# Recursive Cells

Recursive Cells 是 Ambient Beat 中的动态递归切割视觉实验。

它来自 Houdini `set_recursive_cells` 的思路：用一组静态 `rest` 点决定递归矩形分割结构，再用随时间运动的点去推动最终显示边界。这样画面会持续运动，但 cell 的父子关系和切割拓扑保持稳定，不会每帧随机跳变。

v0.1 使用原生 Canvas2D 实现黑白版本。画面从一个根矩形开始递归二分，切割方向优先选择更长边，切割位置带有可控 irregularity；每条显示切线会读取附近运动点的偏移，并通过安全限制避免重叠、反向和过度压扁。当前版本已接入共享节拍器：播放时每个 beat 都会生成不同的运动目标姿态，切割线在节拍之间过渡，并在拍点上产生更明显的位移脉冲。

## Versions

- [recursive_cells_0.1](./recursive_cells_0.1/)：建立动态黑白递归切割，包含 point count、min size、motion、irregularity、speed、reset seed，以及 Tempo、Meter、Rhythm、Count In、Click Volume、Start 和 Reset 控制。

## 设计方向

- 保持黑白、线框、块面为主的视觉语言。
- 拓扑稳定，运动来自显示边界的局部推拉。
- 使用统一节拍器语义，让递归运动跟随 Tempo / Meter / Rhythm。
- 后续可以继续调整拍点脉冲的视觉力度，或把节拍分层映射到不同深度的 cell。
