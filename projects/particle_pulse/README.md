# Particle Pulse

Particle Pulse 是 Ambient Beat 中的粒子节拍器实验。

项目目标是用光尘、节拍波前和缓慢流动的空间粒子表现 BPM，而不是复刻已有粒子作品的具体外观。

当前版本先保留在 `projects/particle_pulse/` 内作为视觉探索记录，暂不作为 Ambient Beat 根首页和根 README 的公开项目入口展示。

## 参考来源

本项目的粒子光影氛围和动态方向参考了 cullenwebber 的 three-particles：

https://github.com/cullenwebber/three-particles

参考重点是粒子系统、Three.js / shader 表达、光影层次和“粒子被节奏驱动”的可能性。Particle Pulse 会以 Ambient Beat 的节拍器逻辑重新设计视觉结构、运动方式和交互，不复制参考项目的代码、构图或具体视觉外观。

## Versions

- [particle_pulse_0.2](./particle_pulse_0.2/)：在 v0.1 的视觉验证基线上接入 PingPong 0.4 的节拍控制、拍点显示、count-in、点击音量和 transport。
- [particle_pulse_0.1](./particle_pulse_0.1/)：基于 GPU position texture 与 curl noise 的粒子动态视觉验证，提供速度、湍流尺度、寿命、点大小、灯光与阴影控制，不包含节拍面板、线框与文字层。

## 设计方向

- 节拍驱动粒子呼吸和亮度，不做固定形状复刻。
- 重拍触发更强的波前和低频闪光。
- 粒子保持低密度、空间感和可读性，避免盖过节拍控制。
- 后续版本可以加入音色、节奏型、WebGL 后处理和更细的粒子物理。
