# Ambient Beat

[English](./README_EN.md) | 中文

氛围节拍是一个基于 Web Audio 与实时视觉的开源节拍器实验。

它用不同的物理场景、材质碰撞和空间运动来生成节奏，让节拍不只是冷冰冰的计时，而是一种可以观看、聆听和调节的氛围系统。

GitHub Pages: https://hendasheng.github.io/ambient-beat/

根目录首页是给 GitHub Pages 访客使用的项目入口，项目卡片会直接进入当前主版本；每个具体项目在 `projects/` 下维护自己的版本列表、文档和演进记录。

节拍器相关项目尽量沿用统一控制模型：Tempo、Meter、Rhythm、Count In、Offbeat、Click Volume、Start 和 Reset，以及播放后自动隐藏的底部控制面板。

## 共享节拍器核心

当前主版本不再各自复制 `rhythm-panel`。节拍器核心统一放在 [`shared/metronome/`](./shared/metronome/)：

- [`metronome.js`](./shared/metronome/metronome.js)：节拍时序与音频引擎。
- [`metronome-panel.js`](./shared/metronome/metronome-panel.js)：根据页面中的 `data-metronome-panel` 占位元素生成统一控制面板。
- [`metronome-panel.css`](./shared/metronome/metronome-panel.css)：统一控件、Start / Reset、图标和基础响应式布局。
- [`README.md`](./shared/metronome/README.md)：接入方式与 `data-*` 配置说明。

各视觉项目只保留初始 BPM、拍号集合、音量、可选 Offbeat 等声明式配置，以及自身的主题变量和视觉联动逻辑。历史版本作为迭代快照保留；无法跨目录引用共享文件的离线分发版可以内置同源副本，但共享核心更新后必须同步。

## 参与贡献

- 给合作者看的提交流程：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 给 AI / 编码助手看的仓库提示：[AGENTS.md](./AGENTS.md)
- 小红书小工具统一规范：[MINITOOL.md](./MINITOOL.md)

## Projects

- [Beat Sync Monitor](./projects/beat_sync_monitor/)：借用 avsynctest 的测试画面语言，用居中的节奏模块、动态数据矩阵、摄像头采集层、点击说明浮层和隐藏式节拍控制面板观察实时同步状态，当前主版本为 v0.2；另提供“氛围节拍-同步监视器”小红书离线小工具版。
- [Recursive Cells](./projects/recursive_cells/)：动态递归切割实验，用静态 rest 点稳定切割拓扑，再用共享节拍器驱动运动点和切割分布；当前主版本 v0.3 加强 FFmpeg testsrc / signal monitor 风格，并支持把摄像头画面放入带粘性的最大递归 cell；另提供名为“氛围节拍 - 递归细胞”的小红书离线小工具版本——用递归呈现节奏变化的节拍器。
- [PingPong Topdown](./projects/pingpong_topdown/)：俯视视角下的极简乒乓球回合轨迹视觉项目，当前主版本为 v0.4。

## Structure

```text
.
├── index.html
├── README.md
├── README_EN.md
├── CONTRIBUTING.md
├── AGENTS.md
├── shared/
│   └── metronome/
│       ├── README.md
│       ├── metronome.js
│       ├── metronome-panel.js
│       └── metronome-panel.css
└── projects/
    ├── beat_sync_monitor/
        ├── index.html
        ├── README.md
        ├── beat_sync_monitor_0.1/
        ├── beat_sync_monitor_0.2/
            ├── index.html
            ├── sketch.js
            └── style.css
        └── beat_sync_monitor_xhs_0.1/
            ├── index.html
            ├── metronome.js
            ├── metronome-panel.js
            ├── metronome-panel.css
            ├── sketch.js
            └── style.css
    ├── recursive_cells/
        ├── index.html
        ├── README.md
        ├── recursive_cells_0.1/
        │   ├── index.html
        │   ├── sketch.js
        │   └── style.css
        ├── recursive_cells_0.2/
        │   ├── index.html
        │   ├── sketch.js
        │   └── style.css
        ├── recursive_cells_0.3/
            ├── index.html
            ├── sketch.js
            └── style.css
        └── recursive_cells_xhs_0.1/
            ├── index.html
            ├── metronome.js
            ├── metronome-panel.js
            ├── metronome-panel.css
            ├── sketch.js
            └── style.css
    ├── pingpong_topdown/
        ├── index.html
        ├── README.md
        ├── requirements.md
        ├── animation_state_spec.md
        ├── pingpong_topdown_0.1/
        ├── pingpong_topdown_0.2/
        ├── pingpong_topdown_0.3/
        └── pingpong_topdown_0.4/
```

## 本地开发与局域网访问

这个仓库是纯静态站点。仓库已经提供 `.vscode/settings.json`，VS Code Live Server 会监听局域网地址：

```json
{
  "liveServer.settings.host": "0.0.0.0",
  "liveServer.settings.port": 5500,
  "liveServer.settings.useLocalIp": true
}
```

启动 `Go Live` 后，在 Windows 终端运行：

```powershell
ipconfig
```

找到当前 Wi-Fi 网卡的 IPv4 地址，例如 `192.168.1.23`。确保电脑和测试设备连接同一个局域网，然后访问：

```text
http://192.168.1.23:5500/
http://192.168.1.23:5500/projects/beat_sync_monitor/beat_sync_monitor_0.2/
http://192.168.1.23:5500/projects/pingpong_topdown/pingpong_topdown_0.4/
```

不要使用 `localhost` 或 `127.0.0.1`，它们在手机上指向手机自身。如果仍然无法访问，请允许 VS Code / Live Server 通过 Windows 专用网络防火墙，或放行 TCP 端口 `5500`。

## GitHub Pages

这个仓库是纯静态站点，可以直接从 `main` 分支根目录发布：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
