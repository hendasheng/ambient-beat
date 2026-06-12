# Ambient Beat

English | [中文](./README.md)

Ambient Beat is an open-source metronome experiment built with Web Audio and real-time visuals.

It uses physical scenes, material collisions, and spatial motion to generate rhythm, turning the beat from cold timing into an atmosphere system that can be watched, heard, and adjusted.

GitHub Pages: https://hendasheng.github.io/ambient-beat/

The root homepage is the project index. Each project keeps its own versions, documents, and evolution history under `projects/`.

## Contributing

- Contribution workflow for collaborators: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Repository guidance for AI / coding agents: [AGENTS.md](./AGENTS.md)

## Projects

- [Beat Sync Monitor](./projects/beat_sync_monitor/): a real-time beat monitor using avsynctest-style sparse labels, bar-level ticks, and a solid progress block. The current main version is v0.1.
- [PingPong Topdown](./projects/pingpong_topdown/): a minimalist top-down table tennis rally visualization project. The current main version is v0.4.

## Structure

```text
.
├── index.html
├── README.md
├── README_EN.md
├── CONTRIBUTING.md
├── AGENTS.md
└── projects/
    ├── beat_sync_monitor/
        ├── index.html
        ├── README.md
        └── beat_sync_monitor_0.1/
            ├── index.html
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

## Local Development And LAN Access

This repository is a static site. The repository already includes `.vscode/settings.json`, so VS Code Live Server listens on the local network:

```json
{
  "liveServer.settings.host": "0.0.0.0",
  "liveServer.settings.port": 5500,
  "liveServer.settings.useLocalIp": true
}
```

After starting `Go Live`, run this command in a Windows terminal:

```powershell
ipconfig
```

Find the IPv4 address of the active Wi-Fi adapter, such as `192.168.1.23`. Connect the computer and test device to the same local network, then visit:

```text
http://192.168.1.23:5500/
http://192.168.1.23:5500/projects/beat_sync_monitor/beat_sync_monitor_0.1/
http://192.168.1.23:5500/projects/pingpong_topdown/pingpong_topdown_0.4/
```

Do not use `localhost` or `127.0.0.1`; on a phone they point to the phone itself. If the site is still unreachable, allow VS Code / Live Server through the Windows private-network firewall or open TCP port `5500`.

## GitHub Pages

This repository is a static site and can be published directly from the root of the `main` branch:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
