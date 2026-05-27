# Ambient Beat

氛围节拍是一个基于 Web Audio 与实时视觉的开源节拍器实验。它用不同的物理场景、材质碰撞和空间运动来生成节奏，让节拍不只是冷冰冰的计时，而是一种可以观看、聆听和调节的氛围系统。

GitHub Pages: https://hendasheng.github.io/ambient-beat/

根目录首页是项目入口；每个具体项目在 `projects/` 下维护自己的版本、文档和演进记录。

## Projects

- [PingPong Topdown](./projects/pingpong_topdown/)：俯视视角下的极简乒乓球回合轨迹视觉项目，当前主版本为 v0.3。

## Structure

```text
.
├── index.html
├── README.md
└── projects/
    └── pingpong_topdown/
        ├── index.html
        ├── README.md
        ├── requirements.md
        ├── animation_state_spec.md
        ├── pingpong_topdown_0.1/
        ├── pingpong_topdown_0.2/
        └── pingpong_topdown_0.3/
```

## GitHub Pages

这个仓库是纯静态站点，可以直接从 `main` 分支根目录发布：

- Source: `Deploy from a branch`
- Branch: `main`
- Folder: `/ (root)`
