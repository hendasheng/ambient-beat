# Beat Sync Monitor AI Context

本文件只记录当前开发衔接信息。项目定位、版本和依赖见 [`README.md`](./README.md)；全仓规则见 [`AGENTS.md`](../../AGENTS.md)；共享节拍器见 [`shared/metronome/README.md`](../../shared/metronome/README.md)；离线小工具规则见 [`MINITOOL.md`](../../MINITOOL.md)。

## 当前状态

- Web 主版本：`beat_sync_monitor_0.2/`。
- 小工具源码：`beat_sync_monitor_xhs_0.1/`，对外名称为“氛围节拍-同步监视器”。
- Web 版允许选择摄像头设备；小工具版只能通过 `facingMode` 切换前后摄像头。
- 小工具 ZIP 尚未生成，只有用户明确要求时才打包。

## 实现约束

- 数据矩阵、说明浮层和中央节奏模块必须由同一组数据槽驱动，避免显示值与解释脱节。
- 摄像头画面居中 cover 绘制在底层，不遮挡数据文字和节奏模块。
- 视觉进度、点击声、beat strip 和播放按钮信号灯必须使用同一个共享 metronome 状态。
- 项目页面只配置共享节拍面板；不要复制面板结构或在项目 CSS 中重写内部布局。
- 测试仪表盘语言以高对比、可诊断和清晰读数为优先，不用大面积背景闪烁代替节奏反馈。

## 待验证

- 桌面、移动端和横竖屏下的数据槽避让、说明浮层与节拍面板不重叠。
- 摄像头开关、设备选择、Scale、Shade 和画布 resize 后的 cover 区域正确。
- BPM、Meter、Count In、Offbeat、Click Volume、Play/Pause、Reset 与信号灯保持同步。
- 小工具真机中的前后摄像头切换、安全区、保存和发布流程。

## 下一步

优先完成浏览器与小工具真机 QA；延迟校准、导出素材、Tap Tempo 和更多数据槽布局只在用户明确指定后推进。
