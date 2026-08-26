# Shared metronome

当前主版本统一使用这里的三个共享文件：

- `metronome.js`：节拍时序与音频引擎。
- `metronome-panel.js`：生成统一的节拍控制面板 DOM。
- `metronome-panel.css`：面板容器、全部内部控件、Start / Reset、显示状态和完整响应式布局，是 `rhythm-panel` 的唯一结构样式来源。

## 第三方依赖

- 库：[Lucide Icons](https://lucide.dev/icons/)
- 固定版本：`0.468.0`
- 使用范围：共享节拍面板的运输按钮。
- 图标名称：播放 `play`、暂停 `pause`、重置 `rotate-ccw`。
- 选用原因：图标名称稳定、线性风格统一，并可在普通 Web 页面中直接通过浏览器库渲染。
- 在线加载：在 `metronome-panel.js` 之前加载 unpkg UMD 浏览器包。
- 离线处理：小红书小工具不加载 CDN；同一面板脚本使用对应 Lucide 路径的内联 SVG 回退。
- 源码位置：图标渲染和离线路径位于 [`metronome-panel.js`](./metronome-panel.js)，尺寸与状态样式位于 [`metronome-panel.css`](./metronome-panel.css)。

页面只保留一个占位元素，并在项目脚本之前加载面板脚本：

```html
<aside
  data-metronome-panel
  data-bpm="92"
  data-volume="45"
  data-meters="odd"
  data-offbeat="true"
></aside>

<script src="https://unpkg.com/lucide@0.468.0/dist/umd/lucide.js"></script>
<script src="../../../shared/metronome/metronome-panel.js"></script>
<script src="../../../shared/metronome/metronome.js"></script>
<script src="sketch.js"></script>
```

## 面板配置

| 属性 | 默认值 | 说明 |
| --- | --- | --- |
| `data-bpm` | `92` | 初始 BPM |
| `data-bpm-max` | `240` | BPM 上限 |
| `data-volume` | `45` | 初始 Click 音量 |
| `data-meters` | `odd` | `odd` 为 3/4、4/4、5/4、7/4；`simple` 为 4/4、3/4、2/4、6/8 |
| `data-feel-label` | `Rhythm` | 第二组标题 |
| `data-rhythm-label` | `Rhythm` | subdivision 字段标签 |
| `data-readout` | 标准 bar readout | 初始节拍说明 |
| `data-offbeat` | `false` | 是否显示 Offbeat |
| `data-locale` | 英文 | 设为 `zh-CN` 时使用中文控制文案 |
| `data-aria-label` | `Beat controls` | 面板可访问性名称 |

项目脚本继续通过稳定 ID 获取控件，例如 `bpmInput`、`meterSelect`、`playPauseButton` 和 `rhythmResetButton`。项目 CSS 只能在 `:root` 设置 `--metronome-*` 主题、位置与容器避让变量，不得定义 `.rhythm-panel` 或其内部结构选择器，也不得为面板另写移动端断点。

离线分发的共享文件同步规则见仓库根目录 [`MINITOOL.md`](../../MINITOOL.md)。
