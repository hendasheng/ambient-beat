# Codex 继续工作提示

我现在在做 Ambient Beat 项目。

这个仓库是一个聚合型的网页节拍器项目。已有项目是 projects/pingpong_topdown，现在新增了一个项目：

projects/particle_pulse

## 当前目标

继续完善 Particle Pulse，把它做成 Ambient Beat 里的一个新形式：用 Three.js 粒子、光影、空间漂浮感和节拍脉冲来表现 BPM。

我希望它有类似这种参考项目里的光影氛围和动态质感：

https://github.com/cullenwebber/three-particles

但不要复制它的代码，也不要做得和它外观太像。这个链接需要在 Particle Pulse 的 README 中大大方方写明是参考来源，重点参考的是粒子系统、Three.js / shader 表达、光影层次和粒子被节奏驱动的方向。

## 已有实现

目前已经创建：

- projects/particle_pulse/index.html
- projects/particle_pulse/README.md
- projects/particle_pulse/particle_pulse_0.1/index.html
- projects/particle_pulse/particle_pulse_0.1/style.css
- projects/particle_pulse/particle_pulse_0.1/sketch.js

根目录 index.html、README.md、README_EN.md 也已经加入 Particle Pulse 入口和说明。

当前实现是独立写的 Three.js 粒子场，不复制 three-particles 的代码。它使用 Web Audio 做基础节拍器，用 BPM、拍号、Pulse 控制粒子亮度、波前和重拍脉冲。

## 继续工作时的要求

1. 先阅读现有文件，不要直接重写整个项目。
2. 保持 Particle Pulse 作为 projects/particle_pulse/particle_pulse_0.1 下的纯静态项目。
3. 可以用 Three.js 和 shader，但不要引入复杂构建流程，优先保持 GitHub Pages / Live Server 可直接运行。
4. 视觉上要追求光影、漂浮、节拍驱动、空间感，但要避开参考项目的具体构图、形态和运动特征。
5. 节拍必须真实影响粒子运动或光影，不只是播放点击声。
6. 如果改 README，要继续明确写出参考来源链接和“不复制代码 / 不复刻外观”的边界。
7. 做完后运行：

`powershell
node --check .\projects\particle_pulse\particle_pulse_0.1\sketch.js
`

并检查：

`powershell
git status --short --branch
`

## 下一步建议

优先通过本地静态服务器打开页面看实际效果：

`	ext
http://127.0.0.1:5500/projects/particle_pulse/particle_pulse_0.1/
`

然后根据画面判断：

- 粒子是否太散或太弱；
- 节拍脉冲是否足够明显；
- 重拍和普通拍的区别是否清楚；
- 控制面板是否挡画面；
- 视觉是否已经和参考项目拉开距离。

如果需要继续增强，可以先从这些方向做：

- 增加节拍触发的局部涡旋或波纹扰动；
- 让重拍带来更明显的空间压缩 / 展开；
- 增加细微的残影或后处理，但不要把项目变成参考项目的复刻；
- 调整颜色和粒子结构，让它更像 Ambient Beat 自己的视觉语言。
