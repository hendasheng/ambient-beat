# Ambient Beat

English | [中文](./README.md)

Ambient Beat is an open-source metronome experiment built with Web Audio and real-time visuals.

It uses physical scenes, material collisions, and spatial motion to generate rhythm, turning the beat from cold timing into an atmosphere system that can be watched, heard, and adjusted.

GitHub Pages: https://hendasheng.github.io/ambient-beat/

The root homepage is the GitHub Pages project entry and project cards open the current main version directly. Each project keeps its own version index, documents, and evolution history under `projects/`.

Metronome-based projects should reuse the shared control model where possible: Tempo, Meter, Rhythm, Count In, Offbeat, Click Volume, Start, Reset, and the bottom control panel that auto-hides while playing.

## Contributing

- Contribution workflow for collaborators: [CONTRIBUTING.md](./CONTRIBUTING.md)
- Repository guidance for AI / coding agents: [AGENTS.md](./AGENTS.md)

## Projects

- [Beat Sync Monitor](./projects/beat_sync_monitor/): a real-time beat monitor using an avsynctest-style data matrix, a centered rhythm module, a camera capture layer, clickable metric explanations, and a hidden metronome control panel. The current main version is v0.2.
- [Recursive Cells](./projects/recursive_cells/): a dynamic recursive cell-splitting experiment where static rest points stabilize the topology while the shared metronome drives point motion and split distribution. The current main version v0.3 strengthens the FFmpeg testsrc / signal monitor style and can place a live camera feed into a sticky largest recursive cell. A standalone Xiaohongshu offline mini-tool build based on v0.3 is also available.
- [PingPong Topdown](./projects/pingpong_topdown/): a minimalist top-down table tennis rally visualization project. The current main version is v0.4.

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
│       ├── metronome.js
│       └── metronome-panel.css
└── projects/
    ├── beat_sync_monitor/
        ├── index.html
        ├── README.md
        ├── beat_sync_monitor_0.1/
        └── beat_sync_monitor_0.2/
            ├── index.html
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
http://192.168.1.23:5500/projects/beat_sync_monitor/beat_sync_monitor_0.2/
http://192.168.1.23:5500/projects/pingpong_topdown/pingpong_topdown_0.4/
```

Do not use `localhost` or `127.0.0.1`; on a phone they point to the phone itself. If the site is still unreachable, allow VS Code / Live Server through the Windows private-network firewall or open TCP port `5500`.

## GitHub Pages

This repository is a static site and can be published directly from the root of the `main` branch:

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
