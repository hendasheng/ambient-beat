# Particle Pulse

Particle Pulse 是 Ambient Beat 中的粒子节拍器实验。

项目目标是用光尘、节拍波前和缓慢流动的空间粒子表现 BPM，而不是复刻已有粒子作品的具体外观。

## 参考来源

本项目的粒子光影氛围和动态方向参考了 cullenwebber 的 three-particles：

https://github.com/cullenwebber/three-particles

参考重点是粒子系统、Three.js / shader 表达、光影层次和“粒子被节奏驱动”的可能性。Particle Pulse 会以 Ambient Beat 的节拍器逻辑重新设计视觉结构、运动方式和交互，不复制参考项目的代码、构图或具体视觉外观。

## Versions

- [particle_pulse_0.1](./particle_pulse_0.1/)：基础 Three.js 粒子场、原生 Web Audio 节拍器、BPM / 拍号 / 强度控制。

## 设计方向

- 节拍驱动粒子呼吸和亮度，不做固定形状复刻。
- 重拍触发更强的波前和低频闪光。
- 粒子保持低密度、空间感和可读性，避免盖过节拍控制。
- 后续版本可以加入音色、节奏型、WebGL 后处理和更细的粒子物理。