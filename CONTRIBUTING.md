# 贡献说明

[README](./README.md) | [English README](./README_EN.md)

感谢你愿意参与 Ambient Beat。这个仓库是一个 GitHub Pages 静态网站，`main` 分支的内容会自动部署到线上站点。

## 基本原则

- 不直接向 `main` 推送未经确认的改动。
- 通过 Pull Request 提交改动，让维护者先 review。
- 当前仓库使用 `CODEOWNERS`，所有 PR 默认需要 `@hendasheng` 审核。
- 保持改动范围清晰：一次 PR 只解决一个问题或增加一个明确功能。
- 如果改动会影响线上页面，请在 PR 描述里写清楚影响范围。

## 第一次贡献怎么做

1. Fork 这个仓库到自己的 GitHub 账号。
2. 在自己的 fork 里创建新分支，例如 `fix-home-copy` 或 `add-new-project`。
3. 在新分支里修改文件。
4. 本地检查页面是否能正常打开。
5. 提交 commit，并 push 到自己的 fork。
6. 在 GitHub 上从你的分支创建 Pull Request 到本仓库的 `main`。
7. 等待维护者 review，根据评论继续修改。

## PR 描述建议

PR 描述里至少写三点：

- 改了什么。
- 为什么要改。
- 怎么检查过。

示例：

```text
## Summary

- Update homepage intro copy
- Add a new project card

## Check

- Opened index.html locally
- Confirmed project links work
```

## 目录约定

- 根目录 `index.html` 是整个网站首页，只放项目入口。
- 每个项目放在 `projects/` 下。
- 项目自己的版本、说明和实验文件放在项目目录内。
- `projects/pingpong_topdown/` 是 PingPong Topdown 项目目录。

## GitHub Pages

`main` 更新后会触发 GitHub Pages 部署。

如果 PR 合并后页面没有立刻更新，通常是 GitHub Actions 还在部署。可以到仓库的 `Actions` 页面查看状态。
