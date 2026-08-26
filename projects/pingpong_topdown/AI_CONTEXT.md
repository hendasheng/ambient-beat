# PingPong Topdown AI Context

本文件只记录当前开发衔接信息。项目定位、版本、依赖和长期方向见 [`README.md`](./README.md)；需求边界见 [`requirements.md`](./requirements.md)；动画状态见 [`animation_state_spec.md`](./animation_state_spec.md)；全仓规则见 [`AGENTS.md`](../../AGENTS.md)。

## 当前状态

- 当前主版本：`pingpong_topdown_0.4/`。
- 当前阶段以移动端竖屏布局、触控面板和共享节拍器体验为主，不改变既有回合状态机。
- v0.1–v0.3 是历史快照；修复当前体验时默认只修改 v0.4。

## 实现约束

- 每球总时长为一个 beat：整拍击球、半拍落台、下一整拍回击。
- Count In 必须表现为台外发球准备并衔接第一拍，不退化为空等待。
- 球高度通过投影表达，球本体不使用拖尾；轨迹与击球扩散曲线保持独立。
- Tone.Transport、画面回合、beat strip、readout 和播放按钮信号灯必须保持同一节拍语义。
- 当前主版本复用共享节拍面板，项目 CSS 不重写其内部结构。
- 移动端点击画面空白区域显示或隐藏面板，操作控件时不能误触发收起。

## 待验证

- 不同 BPM、拍号和 Count In 下，击球与落台时点保持稳定。
- 竖屏球台尺寸、Canvas DPR、mini beat 与底部面板在常见移动端高度下不重叠。
- Play/Pause、Reset、音量和绿色信号灯在 Tone.Transport 暂停、恢复及页面隐藏后仍同步。
- 第一拍重音与普通拍的音色差异清楚但不过度突兀。

## 下一步

优先继续移动端视觉 QA、轨迹可读性和不同 BPM 的运动观感。Tap Tempo、手动毫秒偏移和多窗口联动暂不推进，除非用户明确要求。
