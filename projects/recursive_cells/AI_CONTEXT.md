# Recursive Cells AI Context

这份文档只记录 `recursive_cells` 的实现约束、算法结构和待验证事项。项目介绍、当前版本和版本历史见 [`README.md`](./README.md)；仓库协作规则见根目录 [`AGENTS.md`](../../AGENTS.md)；共享节拍器接入见 [`shared/metronome/README.md`](../../shared/metronome/README.md)；小红书小工具通用规则见 [`MINITOOL.md`](../../MINITOOL.md)。

## 核心实现约束

- 静态 `restX / restZ` 决定递归切割拓扑，动画只改变 `curX / curZ` 和显示边界；不要每帧随机重建父子结构。
- `safeSplit()` 必须限制局部偏移并保留最小边距，避免 cell 重叠、反向或过度压扁。
- 显示切割比例按绝对 beat / bar 推进到持久目标，不在每拍后回到初始分割。
- Start / Pause 不得给节拍时钟增加全局 offset。切换瞬间只使用 `beginPointTransition()` 和 `beginSplitTransition()` 做短视觉过渡。
- Count In 是预备阶段但不冻结画面：点位与切割继续自由预览运动，由 `countInPreviewActive` 阻止它们提前进入节拍驱动；正式第 1 拍到来后通过短过渡切换到节拍运动。
- v0.3 保持 FFmpeg `testsrc` / signal monitor 的硬边测试图卡语言，不改成渐变、彩色 Mondrian 或密集装饰界面。
- 摄像头以 cover 模式绘制到带粘性的承载 cell；只有原 cell 消失或小于阈值时才重新选择最大的 cell，避免逐帧跳动。
- 大 cell 的工程字段必须稀疏：字号通过 `fitTextSize()` 连续适配，接近阈值时由 `cellTextAlpha()` 渐隐，每类字段每帧最多出现 3 次。
- 校准准星和角 tick 只用于少量大 cell，不形成连续边框。
- `F` 快捷键需避开 `input`、`select`、`textarea`、`button` 和 `contenteditable` 的聚焦状态。

## 算法结构

主要实现位于 [`recursive_cells_0.3/sketch.js`](./recursive_cells_0.3/sketch.js)。

### 点集与节拍运动

`resetPoints()` 为每个点建立静态参考坐标、当前坐标、相位、频率和振幅。`updatePoints()` 保持 rest 坐标不变：暂停时使用自由预览时钟；播放时以共享 metronome 的 beat clock 在确定性目标姿态之间插值。第 1 拍的 `beatEnergy` 强于普通拍。

`splitMorphClock()` 使用绝对 beat 编号，`splitMorphOffset()` 根据 cell key、切割轴、beat 和 bar 生成可重复的显示比例目标。结果叠加到 display split 后再交给 `safeSplit()` 限制，因此面积分布持续演化而 rest 拓扑稳定。

### 递归切割

`buildCells()` 使用 stack 模拟递归二分。每个节点同时保存：

- rest bounds：判断点归属、选择切割轴并维持稳定拓扑。
- display bounds：接收运动偏移并用于最终绘制。

切割在达到最大深度、没有可用点、尺寸不足、display bounds 退化或深度概率判定停止时结束。切割轴优先选择较长边；接近方形时使用 seeded random。基础切点由中点、irregularity jitter 和最小尺寸约束共同决定。

### 安全切割与绘制

`safeSplit()` 将最大 offset 限制为当前 display 尺寸的 35%，根据 motion blend 混合运动影响，并为两侧保留 margin；区域过小时回退到中心。

v0.3 使用标准测试彩条与灰阶 ramp 填充 cell，不绘制额外内部描边。工程文本、校准标记和摄像头层都应服从 cell 尺寸与密度约束，画面主体始终是递归切割本身。

## 当前特有状态

- Web 主版本：`recursive_cells_0.3/`。
- 当前小工具源码：`recursive_cells_xhs_0.2/`，基于 Web v0.3 创建，对外名称为“氛围节拍-递归细胞”。
- Web v0.3 与小工具 v0.2 均使用 `countInPreviewActive`：Count In 保持自由预览运动，正式第 1 拍再切入节拍驱动。
- 小工具 v0.2 已于 2026-08-27 生成本地上传包 `recursive_cells_xhs_0.2.zip`；包不纳入仓库，重新打包仍需用户明确要求。
- `recursive_cells_xhs_0.1/` 已恢复为 2026-08-20 的历史状态；`artifacts/recursive_cells_xhs_0.1.zip` 是历史上传包。只有用户明确要求时才重新打包。
- Web 版摄像头允许设备选择；离线小工具必须遵守 `MINITOOL.md` 的 `facingMode` 切换与端能力限制。
- 小工具面向用户的控件使用中文；DOM ID、select value 和 Canvas 工程字段保持现有英文工程命名。

## 待验证

- 桌面与窄屏下，顶部 HUD 和底部节拍面板不覆盖，空间不足时各自内部滚动。
- Points、Min Size、Irregularity、Motion、Speed 和 Reset Seed 的响应符合当前语义。
- Start / Pause 时音频、readout、信号灯与视觉拍点同步，递归分布只短暂过渡而不刷新。
- 摄像头承载 cell 保持粘性，尺寸阈值切换时没有明显闪烁。
- Web 主版本的 `F` 可切换 fullscreen；小工具版不包含 fullscreen 调用。

## 后续方向

优先进行浏览器视觉 QA、布局和性能修正。新增功能应由用户明确指定；继续深化时围绕 testsrc / signal monitor 语言、拍点力度和不同递归深度的节奏映射展开。
