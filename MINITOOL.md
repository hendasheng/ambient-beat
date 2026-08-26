# 小红书小工具规范

本文是 Ambient Beat 小红书小工具版本的统一项目规范。其他 README、AI Context 与协作提示只记录具体版本事实，并统一指向本文，不重复维护通用规则。

底层执行规范位于 [minitool-zip-builder](./.codex/skills/minitool-zip-builder/SKILL.md)，其中包含：

- [ZIP 与离线资源规范](./.codex/skills/minitool-zip-builder/references/zip-artifact-spec.md)
- [端能力边界](./.codex/skills/minitool-zip-builder/references/device-capabilities.md)
- [JSBridge API](./.codex/skills/minitool-zip-builder/references/jsbridge-api.md)
- [跨端与安全区适配](./.codex/skills/minitool-zip-builder/references/cross-platform-h5.md)

## 版本定位

- 小工具是基于当前 Web 主版本创建的独立离线分发变体，不替代 GitHub Pages 主版本。
- 目录命名使用 `projects/<project>/<project>_xhs_<version>/`。
- 目录必须自包含，只用 `./` 相对路径，不引用仓库上级路径、CDN 或其他网络资源。
- 共享节拍器的 `metronome.js`、`metronome-panel.js` 和 `metronome-panel.css` 可以内置副本，但必须从 `shared/metronome/` 同步生成。
- Web 主版本使用的第三方依赖在离线小工具中必须改为包内文件或内联实现，不能保留 CDN / 网络引用；库名、来源和固定版本仍记录在对应项目或共享模块 README 中，不在本文件重复维护依赖清单。
- 页面脚本使用经典外链脚本，不使用内联脚本、行内事件、module、动态 import、Worker 或联网请求。

## 容器能力

- 摄像头只能在用户点击后调用 `getUserMedia()`。
- 小红书容器禁用 `enumerateDevices()`，因此不能显示任意设备列表、设备名称或 `deviceId` 下拉框。
- 前后摄像头切换必须保留，使用 `facingMode: "user" / "environment"` 实现。切换时先停止旧 stream 的全部 tracks，再请求新 stream。
- fullscreen、屏幕共享、设备枚举、定位、剪贴板、传感器、Worker、WebRTC 数据通信等禁用能力必须移除。
- Native 操作只能调用文档列出的 `window.xhs.miniTool.*` API。

## 创作操作优先级

参数面板按以下顺序和视觉层级组织：

1. 摄像头开启 / 关闭：主要创作输入，主按钮样式，始终优先可见。
2. 前后摄像头切换：次要输入，使用 `facingMode`，不得因移除设备枚举而一起删除。
3. 保存画面：次级输出，排列在发布之前。
4. 发布笔记：次级输出，只能由用户点击触发。

保存与发布放在参数面板内部，不放到页面右上角。窄屏可换行或缩小间距，但不能让输出操作挤掉摄像头开关。Start / Pause、Reset 等节拍运输控件固定在底部节拍面板，不与创作操作混排。

## 容器按钮与安全距离

系统安全区和容器按钮占用区域是两套空间，不能互相替代。

```css
:root {
  --system-header-clearance: 50px;
  --system-footer-clearance: 16px;
}

.top-parameter-panel {
  top: calc(
    10px + var(--system-header-clearance) +
    var(--safe-area-inset-top, env(safe-area-inset-top, 0px))
  );
}

.bottom-control-panel {
  bottom: calc(
    10px + var(--system-footer-clearance) +
    var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))
  );
}
```

- `--system-header-clearance` 用于避开容器顶部已有按钮，默认从 `50px` 起步。
- `--system-footer-clearance` 用于避开容器底部按钮、手势区或浮层，默认从 `16px` 起步。
- 两个默认值都要根据模拟器和真机截图校准。
- 顶部 HUD 的 `max-height` 必须扣除顶部避让、底部面板实际高度、底部避让和上下安全区。
- 顶部参数面板和底部节拍面板空间不足时允许内部滚动，不能互相覆盖。

## 保存与发布

保存画面：

```text
canvas.toDataURL()
→ window.xhs.miniTool.writeTempFile()
→ window.xhs.miniTool.saveImageToPhotosAlbum()
```

发布图文笔记使用 `postNote()`，并通过 `mediaInfo.image_resources` 传入当前 Canvas 的完整 data URI。普通浏览器可以预览视觉、摄像头和节拍交互，但保存与发布需要容器注入 JSBridge。

## 文案与可访问性

- 小工具对外标题、HUD 名称、可访问性名称和发布标题使用同一个产品名。
- 面向用户的参数、按钮和状态使用中文系统字体。
- DOM ID、select value、节拍状态字段以及 Canvas 内必要的工程字段可以保留英文，避免破坏逻辑和监视器视觉语言。
- 摄像头按钮需要明确显示当前动作，例如“切到后置”，状态文本显示当前实际或目标摄像头。

## 当前小工具版本

| 版本 | 源码目录 | 产物状态 |
| --- | --- | --- |
| 氛围节拍-递归细胞 | `projects/recursive_cells/recursive_cells_xhs_0.1/` | 历史 ZIP 已有；当前源码更新后待明确要求时重新打包 |
| 氛围节拍-同步监视器 | `projects/beat_sync_monitor/beat_sync_monitor_xhs_0.1/` | 源码开发中，暂未打包 |

## 交付前检查

- `index.html` 位于目录和 ZIP 根层级。
- 资源全部为包内相对路径，文件类型符合容器要求。
- 禁用 API 扫描无残留，JS 全部通过 `node --check`。
- 摄像头开关、前后切换、保存、发布的排列和视觉优先级正确。
- 顶部和底部分别叠加安全区与容器避让距离。
- HUD 与底部节拍面板在窄屏不覆盖，必要时内部滚动。
- 保存、发布的 JSBridge 参数严格符合 API 文档。
- 只有用户明确要求打包时才生成或更新 ZIP。
