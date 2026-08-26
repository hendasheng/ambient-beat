# Ambient Beat

[English](./README_EN.md) | 中文

氛围节拍是一个基于 Web Audio 与实时视觉的开源节拍器实验。它用不同的物理场景、材质碰撞和空间运动生成节奏，让节拍成为可以观看、聆听和调节的氛围系统。

GitHub Pages：https://hendasheng.github.io/ambient-beat/

根目录首页是公开项目入口，项目卡片直接进入各项目当前主版本；每个项目在 `projects/` 下维护自己的版本列表、说明与演进记录。

## Projects

- [Beat Sync Monitor](./projects/beat_sync_monitor/)：avsynctest 风格的实时节拍同步监视器，当前主版本为 v0.2；另有“氛围节拍-同步监视器”小红书离线版。
- [Recursive Cells](./projects/recursive_cells/)：由静态 rest 点稳定拓扑、共享节拍器驱动切割分布的递归视觉实验，当前主版本为 v0.3；另有“氛围节拍-递归细胞”小红书离线版。
- [PingPong Topdown](./projects/pingpong_topdown/)：俯视视角的极简乒乓球回合轨迹视觉，当前主版本为 v0.4。

Particle Pulse 目前保留为内部视觉探索，详见 [`projects/particle_pulse/README.md`](./projects/particle_pulse/README.md)，暂不列入公开首页。

## 仓库地图

- `index.html`：公开项目首页，只链接当前主版本。
- `projects/`：项目版本、项目 README 与实现文件。
- [`shared/metronome/`](./shared/metronome/)：共享节拍时序、面板 UI 与接入说明。
- [`CONTRIBUTING.md`](./CONTRIBUTING.md)：面向人类合作者的贡献流程。
- [`AGENTS.md`](./AGENTS.md)：面向 AI / 编码助手的执行规则。
- [`MINITOOL.md`](./MINITOOL.md)：小红书离线小工具的仓库级规范。

## 共享节拍器

当前主版本统一使用 [`shared/metronome/README.md`](./shared/metronome/README.md) 中定义的控制模型与接入方式。各视觉项目只维护初始参数、主题变量和自身的视觉联动；离线分发版可以内置同源副本，但必须随共享模块同步。

## 本地开发

仓库是纯静态站点，可用 VS Code Live Server 直接预览。仓库内 `.vscode/settings.json` 已配置监听 `0.0.0.0:5500`；手机测试时需与电脑连接同一局域网，并访问电脑的 IPv4 地址，例如：

```text
http://192.168.1.23:5500/
```

手机上的 `localhost` 和 `127.0.0.1` 指向手机自身，不能用于访问电脑上的开发服务器。

## GitHub Pages

`.github/workflows/pages.yml` 在 `main` 更新后部署静态站点，artifact 包含根首页、`.nojekyll`、`projects/` 和 `shared/`。公开资源路径变化时需要同步检查该 workflow。
