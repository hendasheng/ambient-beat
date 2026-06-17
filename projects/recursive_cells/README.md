# Recursive Cells

Recursive Cells 是 Ambient Beat 中的动态递归切割视觉实验。

它来自 Houdini `set_recursive_cells` 的思路：用一组静态 `rest` 点决定递归矩形分割结构，再用随时间运动的点去推动最终显示边界。这样画面会持续运动，但 cell 的父子关系和切割拓扑保持稳定，不会每帧随机跳变。

v0.1 使用原生 Canvas2D 实现黑白版本。画面从一个根矩形开始递归二分，切割方向优先选择更长边，切割位置带有可控 irregularity；每条显示切线会读取附近运动点的偏移，并通过安全限制避免重叠、反向和过度压扁。

## Versions

- [recursive_cells_0.1](./recursive_cells_0.1/)：建立动态黑白递归切割，包含 point count、min size、motion、irregularity、speed 和 reset seed 控制。

## 设计方向

- 保持黑白、线框、块面为主的视觉语言。
- 拓扑稳定，运动来自显示边界的局部推拉。
- 控制项只保留生成和运动所需参数，避免 0.1 版本过早加入复杂节拍器面板。
- 后续可以把切割运动接入共享节拍器时钟，让分割线在拍点上产生更明确的脉冲。
