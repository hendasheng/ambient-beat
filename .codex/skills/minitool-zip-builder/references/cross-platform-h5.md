# 跨端 H5 适配

> 小工具同一份 H5 同时跑在 PC 模拟器与真机 WebView。以下是保证两端一致体验的适配要点。

---

## 1. 触摸

```css
body { -webkit-touch-callout: none; }
.touchable:active { opacity: 0.7; }
html { touch-action: manipulation; }
```

交互优先用 Pointer Events（`pointerdown/move/up`）统一处理鼠标与触摸；纯触摸场景用 `touchstart/touchmove/touchend`。

---

## 2. 滚动

```css
.scroll-container {
  overflow-y: auto;
  -webkit-overflow-scrolling: touch;
  overscroll-behavior-y: contain;
}
```

纵向回弹由容器控制，HTML 无需额外配置。

---

## 3. 安全区

```css
.custom-nav { padding-top: var(--safe-area-inset-top, env(safe-area-inset-top, 0px)); }
.bottom-bar { padding-bottom: var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px)); }
```

需配合 `<meta name="viewport" ... viewport-fit=cover>`。PC 模拟器不产生真实 `env()`，而是注入 `--safe-area-inset-*` 变量模拟安全区；真机 `env()` 为真实值。用 `var(--safe-area-inset-*, env(...))` 组合，两端都生效。

### 容器顶部按钮避让

安全区只表示刘海、状态栏等系统区域，**不包含小工具容器已有的顶部按钮或浮层**。页面自己的 HUD、参数面板、保存 / 发布按钮等可交互内容，除安全区外还必须预留一段明确的容器顶栏避让距离，避免与右上角原生按钮重叠或抢夺点击。

```css
:root { --system-header-clearance: 50px; }

.top-parameter-panel {
  top: calc(
    10px + var(--system-header-clearance) +
    var(--safe-area-inset-top, env(safe-area-inset-top, 0px))
  );
}
```

- `--system-header-clearance` 与安全区是两项独立空间，不能互相替代。
- 默认可从 `50px` 起步，再根据容器真机截图校准；不要只在某一台设备上写死最终坐标。
- 顶部面板的 `max-height` 计算也要扣除这段距离，空间不足时允许面板内部滚动。
- 不要把自定义保存、分享、发布等按钮放在页面右上角；优先放入参数面板内部。

### 容器底部区域避让

底部安全区同样只描述系统区域，不一定包含小工具容器已有的底部按钮、手势条外边距或浮层。固定在底部的节拍面板、工具栏和 Toast 应在 `safe-area-inset-bottom` 之外继续保留独立的容器底栏避让距离。

```css
:root { --system-footer-clearance: 16px; }

.bottom-control-panel {
  bottom: calc(
    10px + var(--system-footer-clearance) +
    var(--safe-area-inset-bottom, env(safe-area-inset-bottom, 0px))
  );
}
```

- `--system-footer-clearance` 与底部安全区不能互相替代。
- 顶部 HUD 的可用高度计算需要同时扣除顶部避让、底部面板实际高度和底部避让。
- 默认可从 `16px` 起步，再根据容器真机截图校准。

### 创作操作优先级

带摄像头与 Native 输出能力的小工具，参数面板按以下顺序组织。这里的优先级同时决定视觉强调、排列顺序，以及窄屏时哪些操作必须优先保持可见：

1. **摄像头开启 / 关闭**：主要创作输入，使用主按钮样式并始终可见。
2. **前后摄像头切换**：次要输入设置，使用 `facingMode: "user" / "environment"` 实现并保持可见。小红书小工具禁用 `enumerateDevices()`，因此只能省略任意设备列表或 `deviceId` 下拉框，不能因此删掉前后摄像头切换。
3. **保存画面**：次级输出操作，放在摄像头参数组内，排在发布之前。
4. **发布笔记**：次级输出操作，与保存同组但排列在后；只能由用户点击触发。

空间不足时允许操作区换行或缩小间距，但不能把保存 / 发布挪到右上角，也不能让它们挤掉摄像头开关。Start / Pause、Reset 等核心节拍运输控件继续固定在节拍面板内，不与上述创作操作混排。

---

## 4. 布局与媒体

- 页面级容器用 `%` / `flex` / `vw`，勿写死 `width: 375px`
- 图片 `max-width: 100%`
- 用系统字体栈，避免非必要 `.woff2`

---

## 5. PC 模拟器 vs 真机

| 特性 | PC 模拟器 | 真机 | 建议 |
| --- | --- | --- | --- |
| 触摸 | 鼠标 → touch 模拟 | 原生 touch | 用 pointer events 统一 |
| 安全区 | 注入 `--safe-area-inset-*` 变量模拟 | `env()` 真实值 | 用 `var(--safe-area-inset-*, env(safe-area-inset-*, 0px))` 组合 |
| 软键盘 | 无 | 遮挡输入框 | 监听 `visualViewport` 处理 |

---

## 6. 自检

- [ ] 交互用 pointer / touch events，未依赖鼠标 hover 才能触发的关键操作
- [ ] 布局自适应，无写死像素宽度
- [ ] 安全区用 `var(--safe-area-inset-*, env(safe-area-inset-*, 0px))` 组合，配合 `viewport-fit=cover`
- [ ] 顶部参数面板在安全区之外另有容器按钮避让距离，且右上角没有自定义按钮与原生按钮重叠
- [ ] 底部固定面板在安全区之外另有容器底栏避让距离，没有贴住或覆盖容器底部控件
- [ ] 摄像头开关、前后摄像头切换、保存、发布按规定优先级排列；前后切换使用 `facingMode`，且没有残留依赖设备枚举的设备列表
- [ ] 图片自适应且体积受控
