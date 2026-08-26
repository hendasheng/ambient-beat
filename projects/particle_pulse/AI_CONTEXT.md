# Particle Pulse AI Context

本文件只记录当前开发衔接信息。项目定位、版本、依赖与创作参考见 [`README.md`](./README.md)；全仓规则见 [`AGENTS.md`](../../AGENTS.md)；共享节拍器见 [`shared/metronome/README.md`](../../shared/metronome/README.md)。

## 当前状态

- 当前实验版本：`particle_pulse_0.2/`。
- 项目仍是内部视觉探索，暂不加入根首页或根 README 的公开项目列表。
- v0.2 在 v0.1 GPU 粒子验证上加入节拍、count-in、点击音量、运输控制和共享面板。

## 实现约束

- 粒子由 GPU position texture、curl noise 和 Three.js 渲染驱动，不复制 three-particles 的代码、构图或具体运动形式。
- 节拍必须真实影响粒子运动、亮度或空间波前，不能只播放点击声。
- 重拍反馈应强于普通拍，但保持低密度、空间感和可读性。
- 当前版本通过 import map 固定 Three.js，通过 Tone.js 驱动音频与 transport；版本信息只在项目 README 维护。
- 共享节拍面板的结构与响应式规则由共享模块维护，项目只提供主题和视觉联动。

## 待验证

- 不同设备与 DPR 下 GPU 粒子数量、阴影和帧率是否可接受。
- BPM、Meter、Count In、Play/Pause、Reset、beat strip 和信号灯是否同步。
- 控制面板隐藏后，粒子节拍反馈仍足够清晰但不过曝。
- Three.js、Tone.js 或 CDN 加载失败时的页面表现是否需要显式提示。

## 下一步

先完成浏览器视觉和性能 QA，再决定是否公开为根项目。后处理、更多音色或更复杂粒子物理应基于性能结果并由用户明确指定。
