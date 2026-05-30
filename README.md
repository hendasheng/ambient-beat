# Ambient Beat

[English](./README_EN.md) | 中文

氛围节拍是一个基于 Web Audio 与实时视觉的开源节拍器实验。

它用不同的物理场景、材质碰撞和空间运动来生成节奏，让节拍不只是冷冰冰的计时，而是一种可以观看、聆听和调节的氛围系统。

GitHub Pages: https://hendasheng.github.io/ambient-beat/

根目录首页是项目入口；每个具体项目在 `projects/` 下维护自己的版本、文档和演进记录。

## 参与贡献

- 给合作者看的提交流程：[CONTRIBUTING.md](./CONTRIBUTING.md)
- 给 AI / 编码助手看的仓库提示：[AGENTS.md](./AGENTS.md)

## Projects

- [PingPong Topdown](./projects/pingpong_topdown/)：俯视视角下的极简乒乓球回合轨迹视觉项目，当前主版本为 v0.4。

## Structure

```text
.
├── index.html
├── README.md
├── README_EN.md
├── CONTRIBUTING.md
├── AGENTS.md
└── projects/
    └── pingpong_topdown/
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
http://192.168.1.23:5500/projects/pingpong_topdown/pingpong_topdown_0.4/
```

不要使用 `localhost` 或 `127.0.0.1`，它们在手机上指向手机自身。如果仍然无法访问，请允许 VS Code / Live Server 通过 Windows 专用网络防火墙，或放行 TCP 端口 `5500`。

## GitHub Pages

这个仓库是纯静态站点，可以直接从 `main` 分支根目录发布：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
