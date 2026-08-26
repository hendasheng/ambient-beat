# Ambient Beat

English | [中文](./README.md)

Ambient Beat is an open-source metronome experiment built with Web Audio and real-time visuals. It uses physical scenes, material collisions, and spatial motion to turn rhythm into an atmosphere that can be watched, heard, and adjusted.

GitHub Pages: https://hendasheng.github.io/ambient-beat/

The root homepage is the public project index. Each card opens that project's current main version directly, while each project keeps its own version index, documentation, and evolution history under `projects/`.

## Projects

- [Beat Sync Monitor](./projects/beat_sync_monitor/): an avsynctest-inspired real-time beat monitor. The current main version is v0.2; a standalone Xiaohongshu offline mini-tool is also maintained.
- [Recursive Cells](./projects/recursive_cells/): a recursive visual experiment whose topology is stabilized by static rest points while the shared metronome drives split distribution. The current main version is v0.3; a standalone Xiaohongshu offline mini-tool is also maintained.
- [PingPong Topdown](./projects/pingpong_topdown/): a minimalist top-down table-tennis rally visualization. The current main version is v0.4.

Particle Pulse remains an internal visual exploration and is intentionally absent from the public homepage. See [`projects/particle_pulse/README.md`](./projects/particle_pulse/README.md).

## Repository Map

- `index.html`: public project homepage linking only to current main versions.
- `projects/`: project versions, project READMEs, and implementation files.
- [`shared/metronome/`](./shared/metronome/): shared beat timing, panel UI, and integration documentation.
- [`CONTRIBUTING.md`](./CONTRIBUTING.md): contribution workflow for human collaborators.
- [`AGENTS.md`](./AGENTS.md): execution rules for AI and coding agents.
- [`MINITOOL.md`](./MINITOOL.md): repository-level specification for Xiaohongshu offline mini-tools.

## Shared Metronome

Current main versions follow the control model and integration guide in [`shared/metronome/README.md`](./shared/metronome/README.md). Visual projects keep only their initial settings, theme variables, and visualization-specific synchronization. Offline distributions may vendor synchronized copies, which must track updates to the shared module.

## Local Development

This is a static site and can be previewed with VS Code Live Server. The repository's `.vscode/settings.json` listens on `0.0.0.0:5500`. For phone testing, connect the phone and computer to the same local network and open the computer's IPv4 address, for example:

```text
http://192.168.1.23:5500/
```

On a phone, `localhost` and `127.0.0.1` point to the phone itself and cannot reach the development server on the computer.

## GitHub Pages

`.github/workflows/pages.yml` deploys the static site after updates to `main`. Its artifact includes the root homepage, `.nojekyll`, `projects/`, and `shared/`; public asset-path changes must be reflected in that workflow.
