# Beat Sync Monitor

Beat Sync Monitor 是 Ambient Beat 中的节拍同步监视器实验。

项目目标是借用 FFmpeg `avsynctest` 的黑底、高对比、参数标注式视觉语言，但把测试参数替换成 Ambient Beat 当前节拍状态：BPM、当前拍、拍内相位、小节进度、渲染帧率和音频时钟。

v0.2 的画面在 v0.1 的同步监视基础上加入摄像头输入：可以开关摄像头、选择设备，并用 Scale 滑块控制采集画面尺寸、用 Shade 滑块控制视频上的黑色透明层。视频按九个数据点形成的数据框比例居中 cover 显示，绘制在最下层，不遮挡原有的数据文本和节奏模块。

画面中的数据矩阵来自同一组数据槽，点击任意数据值会弹出说明浮层，解释当前值的含义；更换数据槽内容时，显示文本、说明浮层和节奏模块避让会同步更新。

控制面板由 `shared/metronome/` 的统一 `rhythm-panel` 模块生成和定型；本项目只通过配置与 CSS 变量设置内容和主题。面板未播放时常驻，播放后自动隐藏，靠近底部或点击画面时显示，并提供 BPM、Meter、Rhythm、Count In、Offbeat、Click Volume、Start 和 Reset。

## 依赖与参考

当前主版本没有项目级第三方运行库；节拍时序、面板和 Lucide 图标的依赖信息统一见 [`shared/metronome/README.md`](../../shared/metronome/README.md)。视觉语言参考 FFmpeg `avsynctest` 的测试画面组织方式，但数据结构、交互与实现均为本项目重新设计。

## Versions

- [beat_sync_monitor_xhs_0.1](./beat_sync_monitor_xhs_0.1/)：基于 v0.2 的小红书小工具离线分发版，对外标题为“氛围节拍-同步监视器”；通用规范见 [`MINITOOL.md`](../../MINITOOL.md)。
- [beat_sync_monitor_0.2](./beat_sync_monitor_0.2/)：在同步监视画面中加入摄像头开关、设备选择、采集画面缩放和视频黑色透明层；视频居中 cover 显示在数据框比例区域内，并保持在数据与节奏模块下层。
- [beat_sync_monitor_0.1](./beat_sync_monitor_0.1/)：建立黑底测试画面、动态数据矩阵、居中节奏模块、横竖屏自适应布局、点击说明浮层、pingpong 风格隐藏控制面板和 Web Audio 点击声。

## 设计方向

- 保留测试仪表盘式的清晰可读性。
- 文本层优先显示当前节拍与同步诊断数据，而不是装饰性说明。
- 视觉反馈主要由节奏模块、动态刻度和实心块承担，避免用大面积背景闪烁控制节奏。
- 视觉进度与音频点击共享同一个调度时钟，方便观察同步感。
- 后续版本可以加入导出素材、延迟校准、tap tempo 和更多数据槽布局。

## 小红书小工具构建

- 源码目录：`projects/beat_sync_monitor/beat_sync_monitor_xhs_0.1/`
- 后续打包目标：`artifacts/beat_sync_monitor_xhs_0.1.zip`（当前暂未生成）
- 对外名称：`氛围节拍-同步监视器`
- 通用开发、端能力、布局与打包规则：[`../../MINITOOL.md`](../../MINITOOL.md)
