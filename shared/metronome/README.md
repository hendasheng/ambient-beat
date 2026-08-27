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

## 可选状态输出

项目需要让视觉、物理或项目音色读取节拍状态时，在创建引擎时显式开启 `outputState`。未开启时 `getOutput()` 返回 `null`，也不会调用 `onState`。

```js
const metronome = window.AmbientMetronome.createMetronome({
  bpm: 120,
  beatsPerBar: 4,
  beatUnit: 4,
  outputState: true,
  onState: (output) => {
    // output.event: change / beat / offbeat
  },
});

function draw(now) {
  metronome.update(now);
  const output = metronome.getOutput(now);
  // 使用 output.beatProgress 驱动逐帧视觉。
  requestAnimationFrame(draw);
}
```

输出是只读快照，包含 `running`、`suspended`、`bpm`、`intervalMs`、`beatsPerBar`、`beatUnit`、`subdivision`、`offbeatEnabled`、`countingIn`、Count In 计数、`beatIndex`、`beatNumber`、`bar`、`accent`、`beatProgress`、`pulse` 以及拍点时间锚点。

- `onBeat(state, accent)`：拍点回调，兼容已有项目。
- `onState(output)`：仅在开启状态输出后，对 change / beat / offbeat 事件推送快照。
- `getOutput(now)`：仅在开启状态输出后返回逐帧快照。
- `suspend(now)` / `resume(now)`：保留拍内相位的暂停与继续；原有 `pause()` 仍会结束 Count In。
- `beatClickEnabled: false`：关闭共享正拍点击声，适合使用项目自有正拍音色；Offbeat 仍由共享引擎调度。

共享引擎是节拍状态的唯一来源。项目可以选择不开启状态输出，但不得为相同的 BPM、拍号、Count In、Offbeat 和 transport 再维护第二套状态。

当前接入示例：[`projects/pingpong_topdown/pingpong_topdown_0.4/sketch.js`](../../projects/pingpong_topdown/pingpong_topdown_0.4/sketch.js) 开启状态输出，以 `getOutput(now)` 驱动整拍击球、拍内运动和 Count In 发球准备；Tone.js 只生成项目特有的击球与落台音色，不再维护 transport。该项目明确设置 `offbeatEnabled: false` 且不显示 Offbeat 控件，因为半拍已经由落台声表达。这属于项目对共享能力的显式取舍，不代表项目遗漏或自行实现了另一套 Offbeat 时钟。

项目脚本继续通过稳定 ID 获取控件，例如 `bpmInput`、`meterSelect`、`playPauseButton` 和 `rhythmResetButton`。项目 CSS 只能在 `:root` 设置 `--metronome-*` 主题、位置与容器避让变量，不得定义 `.rhythm-panel` 或其内部结构选择器，也不得为面板另写移动端断点。

BPM 输入采用提交后生效：键入期间只编辑输入框草稿，不在 `input` 事件中调用 `setBpm()`；用户按 Enter 或点击其他位置触发 `change` 后，才校验并写入共享引擎。项目不得把每个输入字符当作新的 BPM，否则输入 `120` 时中间的 `1` / `12` 会被错误地限制成最低 BPM 并扰乱当前节拍。

离线分发的共享文件同步规则见仓库根目录 [`MINITOOL.md`](../../MINITOOL.md)。
