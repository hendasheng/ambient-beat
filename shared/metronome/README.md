# Shared metronome

当前主版本统一使用这里的三个共享文件：

- `metronome.js`：节拍时序与音频引擎。
- `metronome-panel.js`：生成统一的节拍控制面板 DOM。
- `metronome-panel.css`：面板容器、全部内部控件、Start / Reset、显示状态和完整响应式布局，是 `rhythm-panel` 的唯一结构样式来源。

页面只保留一个占位元素，并在项目脚本之前加载面板脚本：

```html
<aside
  data-metronome-panel
  data-bpm="92"
  data-volume="45"
  data-meters="odd"
  data-offbeat="true"
></aside>

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
