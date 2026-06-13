(function () {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const bpmInput = document.getElementById("bpmInput");
  const meterSelect = document.getElementById("meterSelect");
  const subdivisionSelect = document.getElementById("subdivisionSelect");
  const countInSelect = document.getElementById("countInSelect");
  const clickVolumeInput = document.getElementById("clickVolumeInput");
  const clickVolumeLabel = document.getElementById("clickVolumeLabel");
  const playPauseButton = document.getElementById("playPauseButton");
  const resetButton = document.getElementById("resetButton");
  const beatStrip = document.getElementById("beatStrip");
  const tempoLabel = document.getElementById("tempoLabel");
  const meterLabel = document.getElementById("meterLabel");
  const rhythmPanel = document.querySelector(".rhythm-panel");
  const dataPopover = document.getElementById("dataPopover");
  const dataPopoverLabel = document.getElementById("dataPopoverLabel");
  const dataPopoverValue = document.getElementById("dataPopoverValue");
  const dataPopoverDesc = document.getElementById("dataPopoverDesc");

  let rhythmPanelHideTimer = 0;
  let lastRhythmPointerMove = 0;
  let rhythmPanelDismissed = false;
  let activeDataSlotId = "";
  let latestDataSlots = [];

  const state = {
    running: false,
    bpm: Number(bpmInput.value),
    beatsPerBar: parseMeter(meterSelect.value),
    subdivision: subdivisionSelect.value,
    countInBars: Number(countInSelect.value),
    countingIn: false,
    countInBeatsRemaining: 0,
    countInTotalBeats: 0,
    beatIndex: 0,
    bar: 1,
    startAt: performance.now(),
    nextBeatAt: 0,
    lastBeatAt: performance.now(),
    audioContext: null,
    masterGain: null,
    frameIndex: 0,
    fps: 0,
    lastFrameAt: 0,
  };

  const subdivisionModes = {
    auto: { label: "Auto", visualSubdivisions: 8 },
    eighth: { label: "1/8", visualSubdivisions: 2 },
    triplet: { label: "1/8T", visualSubdivisions: 3 },
    sixteenth: { label: "1/16", visualSubdivisions: 4 },
  };

  let width = 0;
  let height = 0;
  let pixelRatio = 1;

  function resize() {
    pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = Math.floor(width * pixelRatio);
    canvas.height = Math.floor(height * pixelRatio);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    updateDataPopover();
  }

  function ensureAudio() {
    if (state.audioContext) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = clickVolume();
    state.masterGain.connect(state.audioContext.destination);
  }

  function scheduleClick(accent) {
    if (!state.audioContext || !state.masterGain) {
      return;
    }

    const now = state.audioContext.currentTime;
    const osc = state.audioContext.createOscillator();
    const gain = state.audioContext.createGain();
    const frequency = accent ? 1320 : 880;
    const level = accent ? 0.9 : 0.58;

    osc.type = "square";
    osc.frequency.setValueAtTime(frequency, now);
    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.exponentialRampToValueAtTime(level, now + 0.004);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.055);
    osc.connect(gain);
    gain.connect(state.masterGain);
    osc.start(now);
    osc.stop(now + 0.07);
  }

  function stepBeat() {
    if (state.countingIn) {
      if (state.countInBeatsRemaining <= 0) {
        state.countingIn = false;
        state.beatIndex = 0;
        state.bar = 1;
        state.startAt = performance.now();
        state.lastBeatAt = state.startAt;
        scheduleClick(true);
        updateReadout();
        return;
      }

      advanceCountInBeat(performance.now());
      updateReadout();
      return;
    }

    state.beatIndex += 1;

    if (state.beatIndex >= state.beatsPerBar) {
      state.beatIndex = 0;
      state.bar += 1;
    }

    state.lastBeatAt = performance.now();
    scheduleClick(state.beatIndex === 0);
    updateReadout();
  }

  function advanceCountInBeat(now) {
    const countIndex = state.countInTotalBeats - state.countInBeatsRemaining;
    state.beatIndex = countIndex % state.beatsPerBar;
    state.bar = 1;
    state.lastBeatAt = now;
    state.countInBeatsRemaining -= 1;
    scheduleClick(state.beatIndex === 0);
  }

  function intervalMs() {
    return 60000 / state.bpm;
  }

  function updateScheduler(now) {
    if (!state.running) {
      return;
    }

    while (now >= state.nextBeatAt) {
      stepBeat();
      state.nextBeatAt += intervalMs();
    }
  }

  function padBar(value) {
    return String(value).padStart(3, "0");
  }

  function parseMeter(value) {
    const [numerator] = value.split("/").map((part) => Number(part));
    return clamp(Number.isFinite(numerator) ? numerator : 4, 1, 12);
  }

  function clickVolume() {
    return clamp(Number(clickVolumeInput.value) / 100, 0, 1);
  }

  function getSubdivisionMode() {
    return subdivisionModes[state.subdivision] || subdivisionModes.auto;
  }

  function setText(element, value) {
    if (element) {
      element.textContent = value;
    }
  }

  function updateReadout() {
    const beat = state.beatIndex + 1;
    const countText = state.countInBars > 0 ? ` · count ${state.countInBars} bar` : "";
    const statusText = state.countingIn ? ` · pre ${state.countInBeatsRemaining}` : "";
    setText(tempoLabel, `${state.bpm} BPM`);
    setText(meterLabel, `${state.beatsPerBar}/4 · ${getSubdivisionMode().label} · beat ${beat} · bar ${padBar(state.bar)}${countText}${statusText}`);
    setText(clickVolumeLabel, `Click ${Math.round(clickVolume() * 100)}%`);
    renderBeatStrip(beat);
  }

  function renderBeatStrip(activeBeat = 1) {
    if (!beatStrip) {
      return;
    }

    beatStrip.style.setProperty("--beats", state.beatsPerBar);
    if (beatStrip.dataset.beats !== String(state.beatsPerBar)) {
      beatStrip.replaceChildren();
      for (let i = 1; i <= state.beatsPerBar; i += 1) {
        beatStrip.appendChild(document.createElement("span"));
      }
      beatStrip.dataset.beats = String(state.beatsPerBar);
    }

    Array.from(beatStrip.children).forEach((dot, index) => {
      const beat = index + 1;
      dot.className = `beat-dot${beat === 1 ? " downbeat" : ""}${beat === activeBeat ? " active" : ""}`;
    });
  }

  function readoutFont() {
    return `700 ${readoutFontSize()}px Consolas, monospace`;
  }

  function readoutFontSize() {
    return Math.max(10, Math.min(width, height) * 0.012);
  }

  function drawText(text, x, y, align, tone) {
    ctx.save();
    ctx.fillStyle = tone === "dim" ? "rgba(255, 255, 255, 0.48)" : "rgba(255, 255, 255, 0.94)";
    ctx.font = readoutFont();
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function smoothstep(edge0, edge1, value) {
    const t = clamp((value - edge0) / (edge1 - edge0), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function animatedTickScale(distanceFromHead, baseScale, restScale) {
    const behind = distanceFromHead < 0;
    const influence = behind
      ? 1 - smoothstep(0.15, 3.2, Math.abs(distanceFromHead))
      : 1 - smoothstep(0, 2.8, distanceFromHead);

    return restScale + (baseScale - restScale) * influence;
  }

  function cyclicDistanceFromHead(tickIndex, headIndex, totalSteps) {
    let distance = tickIndex - headIndex;
    const halfSteps = totalSteps * 0.5;

    if (distance < -halfSteps) {
      distance += totalSteps;
    } else if (distance > halfSteps) {
      distance -= totalSteps;
    }

    return distance;
  }

  function midLeftText() {
    return `BPM: ${state.bpm}`;
  }

  function midRightText() {
    return `FPS: ${state.fps.toFixed(1)}`;
  }

  function getDataSlots(now, beatProgress, pulse) {
    const beat = state.beatIndex + 1;
    const barPosition = state.bar + (state.beatIndex + beatProgress) / state.beatsPerBar;
    const elapsedSeconds = state.running ? (now - state.startAt) / 1000 : 0;
    const audioRate = state.audioContext ? state.audioContext.sampleRate : 44100;
    const audioSeconds = state.audioContext ? state.audioContext.currentTime : 0;
    const sampleFrame = Math.floor(audioSeconds * audioRate);

    return [
      {
        id: "top-left",
        label: "Current Beat",
        text: `B: ${beat}/${state.beatsPerBar}`,
        description: "当前小节内的整数拍位。拍内连续进度由 PH 表示。",
        x: 0.098,
        y: 0.104,
        align: "left",
      },
      {
        id: "top-center",
        label: "Phase",
        text: `PH: ${beatProgress.toFixed(3)}`,
        fixedWidthText: "PH: 0.000",
        description: "当前单拍内的相位，范围 0 到 1。它直接对应节奏块在这一拍中的移动进度。",
        x: 0.5,
        y: 0.104,
        align: "center",
        tone: "dim",
      },
      {
        id: "top-right",
        label: "Bar Position",
        text: `BAR: ${barPosition.toFixed(3)}`,
        description: "连续小节位置。整数部分是当前小节，小数部分表示小节内部进度。",
        x: 0.9,
        y: 0.104,
        align: "right",
      },
      {
        id: "mid-left",
        label: "Tempo",
        text: midLeftText(),
        description: "当前节拍速度，单位 BPM。这个值由控制面板的 BPM 输入决定。",
        x: 0.098,
        y: 0.5,
        align: "left",
        tone: "dim",
      },
      {
        id: "mid-right",
        label: "Frame Rate",
        text: midRightText(),
        description: "当前 canvas 渲染帧率的平滑估计值，用来观察视觉刷新稳定性。",
        x: 0.9,
        y: 0.5,
        align: "right",
        tone: "dim",
      },
      {
        id: "bottom-left",
        label: "Elapsed Seconds",
        text: `SEC: ${elapsedSeconds.toFixed(6)}`,
        description: "从本次正式启动开始经过的 performance 时间，单位秒。Count In 阶段不计入正式时间。",
        x: 0.098,
        y: 0.93,
        align: "left",
      },
      {
        id: "bottom-center",
        label: "Pulse Envelope",
        text: `P: ${pulse.toFixed(3)}`,
        description: "节拍触发后的视觉脉冲强度，刚触发时接近 1，然后平滑衰减到 0。",
        x: 0.5,
        y: 0.93,
        align: "center",
        tone: "dim",
      },
      {
        id: "bottom-right",
        label: "Audio Clock",
        text: `AUD: ${audioSeconds.toFixed(3)}  SMP: ${sampleFrame}`,
        description: "Web Audio 时钟秒数和按当前采样率换算的采样帧位置，用来对照音频侧时间。",
        x: 0.9,
        y: 0.93,
        align: "right",
      },
    ];
  }

  function slotTextEdge(slot) {
    if (!slot) {
      return { left: width * 0.23, right: width * 0.77 };
    }

    ctx.save();
    ctx.font = readoutFont();
    const textWidth = ctx.measureText(slot.fixedWidthText || slot.text).width;
    ctx.restore();

    const x = width * slot.x;
    if (slot.align === "right") {
      return { left: x - textWidth, right: x };
    }
    if (slot.align === "center") {
      return { left: x - textWidth * 0.5, right: x + textWidth * 0.5 };
    }
    return { left: x, right: x + textWidth };
  }

  function drawDataSlot(slot) {
    if (!slot.fixedWidthText) {
      drawText(slot.text, width * slot.x, height * slot.y, slot.align, slot.tone);
      return;
    }

    const edge = slotTextEdge(slot);
    drawText(slot.text, edge.left, height * slot.y, "left", slot.tone);
  }

  function slotBounds(slot) {
    const edge = slotTextEdge(slot);
    const y = height * slot.y;
    const padding = Math.max(8, readoutFontSize() * 0.7);
    const textHalfHeight = readoutFontSize() * 0.8;

    return {
      left: edge.left - padding,
      right: edge.right + padding,
      top: y - textHalfHeight - padding * 0.5,
      bottom: y + textHalfHeight + padding * 0.5,
    };
  }

  function findDataSlotAt(clientX, clientY) {
    return latestDataSlots.find((slot) => {
      const bounds = slotBounds(slot);
      return clientX >= bounds.left &&
        clientX <= bounds.right &&
        clientY >= bounds.top &&
        clientY <= bounds.bottom;
    });
  }

  function slotVerticalEdge(slot) {
    const y = height * (slot?.y ?? 0.5);
    const textHalfHeight = readoutFontSize() * 0.5;
    return { top: y - textHalfHeight, bottom: y + textHalfHeight };
  }

  function drawTimeline(beatProgress, pulse, dataSlots) {
    if (width <= 720 && height > width) {
      drawVerticalTimeline(beatProgress, pulse, dataSlots);
      return;
    }

    const subdivisions = getSubdivisionMode().visualSubdivisions;
    const count = state.beatsPerBar * subdivisions + 1;
    const leftSlot = dataSlots.find((slot) => slot.id === "mid-left");
    const rightSlot = dataSlots.find((slot) => slot.id === "mid-right");
    const sideGap = Math.max(24, width * 0.025);
    const minModuleWidth = Math.min(180, width * 0.34);
    const safeLeft = slotTextEdge(leftSlot).right + sideGap;
    const safeRight = slotTextEdge(rightSlot).left - sideGap;

    const canUseTextBounds = safeRight - safeLeft >= minModuleWidth;
    const fallbackWidth = width * 0.54;
    const left = canUseTextBounds ? safeLeft : (width - fallbackWidth) * 0.5;
    const right = canUseTextBounds ? safeRight : left + fallbackWidth;
    const y = height * 0.5;
    const tickHeight = height * 0.052;
    const beatWidth = (right - left) / state.beatsPerBar;
    const step = beatWidth / subdivisions;
    const totalSteps = count - 1;
    const barProgress = (state.beatIndex + beatProgress) / state.beatsPerBar;
    const blockWidth = Math.min(Math.max(18, beatWidth * 0.08), Math.max(4, right - left));
    const markerX = Math.min(
      left + (right - left) * Math.min(barProgress, 0.999),
      right - blockWidth,
    );
    const headIndex = ((barProgress * totalSteps) + (blockWidth / step)) % totalSteps;
    const blockHeight = tickHeight * 0.8;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1;

    for (let index = 0; index < count; index += 1) {
      const x = left + index * step;
      const isBeat = index % subdivisions === 0;
      const baseScale = isBeat ? 1.18 : 0.72;
      const restScale = isBeat ? 0.8 : 0.38;
      const tickIndex = index === totalSteps ? 0 : index;
      const scale = animatedTickScale(
        cyclicDistanceFromHead(tickIndex, headIndex, totalSteps),
        baseScale,
        restScale,
      );
      ctx.strokeStyle = isBeat ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.58)";
      ctx.lineWidth = isBeat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y - tickHeight * scale * 0.5);
      ctx.lineTo(x, y + tickHeight * scale * 0.5);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${0.84 + pulse * 0.16})`;
    ctx.fillRect(markerX, y - blockHeight * 0.5, blockWidth, blockHeight);
    ctx.restore();
  }

  function drawVerticalTimeline(beatProgress, pulse, dataSlots) {
    const subdivisions = getSubdivisionMode().visualSubdivisions;
    const count = state.beatsPerBar * subdivisions + 1;
    const topSlot = dataSlots.find((slot) => slot.id === "top-center");
    const bottomSlot = dataSlots.find((slot) => slot.id === "bottom-center");
    const sideGap = Math.max(24, height * 0.025) * 2;
    const top = slotVerticalEdge(topSlot).bottom + sideGap;
    const bottom = slotVerticalEdge(bottomSlot).top - sideGap;
    const x = width * 0.5;
    const tickWidth = width * 0.085;
    const beatHeight = (bottom - top) / state.beatsPerBar;
    const step = beatHeight / subdivisions;
    const totalSteps = count - 1;
    const barProgress = (state.beatIndex + beatProgress) / state.beatsPerBar;
    const blockWidth = tickWidth * 0.8;
    const blockHeight = Math.min(Math.max(18, beatHeight * 0.08), Math.max(4, bottom - top));
    const markerY = Math.max(
      bottom - (bottom - top) * Math.min(barProgress, 0.999) - blockHeight,
      top,
    );
    const headIndex = ((barProgress * totalSteps) + (blockHeight / step)) % totalSteps;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1;

    for (let index = 0; index < count; index += 1) {
      const y = bottom - index * step;
      const isBeat = index % subdivisions === 0;
      const baseScale = isBeat ? 1.18 : 0.72;
      const restScale = isBeat ? 0.8 : 0.38;
      const tickIndex = index === totalSteps ? 0 : index;
      const scale = animatedTickScale(
        cyclicDistanceFromHead(tickIndex, headIndex, totalSteps),
        baseScale,
        restScale,
      );
      ctx.strokeStyle = isBeat ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.58)";
      ctx.lineWidth = isBeat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x - tickWidth * scale * 0.5, y);
      ctx.lineTo(x + tickWidth * scale * 0.5, y);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${0.84 + pulse * 0.16})`;
    ctx.fillRect(x - blockWidth * 0.5, markerY, blockWidth, blockHeight);
    ctx.restore();
  }

  function updateFrameStats(now) {
    state.frameIndex += 1;
    if (!state.lastFrameAt) {
      state.lastFrameAt = now;
      return;
    }

    const delta = Math.max(1, now - state.lastFrameAt);
    const instantFps = 1000 / delta;
    state.fps = state.fps ? state.fps * 0.9 + instantFps * 0.1 : instantFps;
    state.lastFrameAt = now;
  }

  function drawOverlay(dataSlots) {
    dataSlots.forEach((slot) => {
      drawDataSlot(slot);
    });
  }

  function positionDataPopover(slot) {
    if (!dataPopover || !slot) {
      return;
    }

    const bounds = slotBounds(slot);
    const popoverWidth = Math.min(260, window.innerWidth - 24);
    const popoverHeight = dataPopover.offsetHeight || 112;
    const preferredX = slot.align === "right" ? bounds.right - popoverWidth : bounds.left;
    const preferredY = bounds.bottom + 10;
    const x = clamp(preferredX, 12, Math.max(12, window.innerWidth - popoverWidth - 12));
    const y = preferredY + popoverHeight + 12 > window.innerHeight
      ? Math.max(12, bounds.top - popoverHeight - 10)
      : preferredY;

    dataPopover.style.setProperty("--popover-x", `${Math.round(x)}px`);
    dataPopover.style.setProperty("--popover-y", `${Math.round(y)}px`);
  }

  function updateDataPopover() {
    if (!activeDataSlotId || !dataPopover) {
      return;
    }

    const slot = latestDataSlots.find((item) => item.id === activeDataSlotId);
    if (!slot) {
      hideDataPopover();
      return;
    }

    setText(dataPopoverLabel, slot.label || slot.id);
    setText(dataPopoverValue, slot.text);
    setText(dataPopoverDesc, slot.description || "");
    dataPopover.hidden = false;
    positionDataPopover(slot);
  }

  function showDataPopover(slot) {
    activeDataSlotId = slot.id;
    updateDataPopover();
  }

  function hideDataPopover() {
    activeDataSlotId = "";
    if (dataPopover) {
      dataPopover.hidden = true;
    }
  }

  function draw(now) {
    updateFrameStats(now);
    updateScheduler(now);

    const elapsed = now - state.lastBeatAt;
    const progress = state.running ? Math.min(elapsed / intervalMs(), 1) : 0;
    const pulse = Math.max(0, 1 - elapsed / 180);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#020202";
    ctx.fillRect(0, 0, width, height);

    const dataSlots = getDataSlots(now, progress, pulse);
    latestDataSlots = dataSlots;
    drawTimeline(progress, pulse, dataSlots);
    drawOverlay(dataSlots);
    updateDataPopover();

    requestAnimationFrame(draw);
  }

  function setTransportText() {
    setText(playPauseButton, state.running ? "Pause" : "Start");
  }

  function showRhythmPanel(duration = 2400) {
    rhythmPanelDismissed = false;
    if (!state.running) {
      syncRhythmPanelVisibility();
      return;
    }

    document.body.classList.add("rhythm-visible");
    window.clearTimeout(rhythmPanelHideTimer);
    if (duration <= 0) {
      return;
    }

    rhythmPanelHideTimer = window.setTimeout(() => {
      if (!state.running) {
        syncRhythmPanelVisibility();
        return;
      }
      if (rhythmPanel?.matches(":hover") || document.activeElement?.closest?.(".rhythm-panel")) {
        showRhythmPanel(1600);
        return;
      }
      document.body.classList.remove("rhythm-visible");
    }, duration);
  }

  function syncRhythmPanelVisibility() {
    window.clearTimeout(rhythmPanelHideTimer);
    document.body.classList.toggle("rhythm-pinned", !state.running && !rhythmPanelDismissed);
    if (!state.running) {
      document.body.classList.remove("rhythm-visible");
    }
  }

  function hideRhythmPanel() {
    rhythmPanelDismissed = true;
    document.body.classList.remove("rhythm-visible");
    syncRhythmPanelVisibility();
  }

  function handleRhythmPointerDown(event) {
    if (rhythmPanel?.contains(event.target)) {
      showRhythmPanel(0);
      return;
    }

    const dataSlot = findDataSlotAt(event.clientX, event.clientY);
    if (dataSlot) {
      showDataPopover(dataSlot);
      return;
    }

    hideDataPopover();

    const isVisible = document.body.classList.contains("rhythm-visible") ||
      document.body.classList.contains("rhythm-pinned");
    if (isVisible) {
      hideRhythmPanel();
      return;
    }

    showRhythmPanel(0);
  }

  function handleRhythmPointerMove(event) {
    if (event.pointerType && event.pointerType !== "mouse") {
      return;
    }

    const now = performance.now();
    if (now - lastRhythmPointerMove < 80) {
      return;
    }
    lastRhythmPointerMove = now;

    const proximity = window.innerWidth <= 680 ? 230 : 170;
    if (window.innerHeight - event.clientY <= proximity) {
      showRhythmPanel(state.running ? 2200 : 0);
    }
  }

  function shouldIgnoreGlobalKey(event) {
    const tag = event.target?.tagName;
    return tag === "INPUT" || tag === "SELECT" || tag === "BUTTON" || tag === "TEXTAREA";
  }

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      document.exitFullscreen();
      return;
    }

    document.documentElement.requestFullscreen();
  }

  function handleGlobalKeydown(event) {
    showRhythmPanel(2600);
    if (shouldIgnoreGlobalKey(event)) {
      return;
    }

    if (event.key === "f" || event.key === "F") {
      event.preventDefault();
      toggleFullscreen();
    }
  }

  playPauseButton.addEventListener("click", async () => {
    ensureAudio();
    await state.audioContext.resume();

    state.running = !state.running;
    setTransportText();

    if (state.running) {
      state.lastBeatAt = performance.now();
      state.nextBeatAt = state.lastBeatAt + intervalMs();
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;
      state.countInBeatsRemaining = state.countInTotalBeats;
      state.countingIn = state.countInTotalBeats > 0;

      if (state.countingIn) {
        state.startAt = state.lastBeatAt + state.countInTotalBeats * intervalMs();
        advanceCountInBeat(state.lastBeatAt);
      } else {
        state.startAt = state.lastBeatAt;
        scheduleClick(state.beatIndex === 0);
      }
    } else {
      state.countingIn = false;
      state.countInBeatsRemaining = 0;
    }

    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
    syncRhythmPanelVisibility();
  });

  resetButton.addEventListener("click", () => {
    state.beatIndex = 0;
    state.bar = 1;
    state.countingIn = false;
    state.countInBeatsRemaining = 0;
    state.lastBeatAt = performance.now();
    state.startAt = state.lastBeatAt;
    state.nextBeatAt = state.lastBeatAt;
    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
  });

  bpmInput.addEventListener("change", () => {
    state.bpm = clamp(Math.round(Number(bpmInput.value) || 120), 40, 220);
    bpmInput.value = state.bpm;
    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
  });

  bpmInput.addEventListener("input", () => {
    state.bpm = clamp(Math.round(Number(bpmInput.value) || 120), 40, 220);
    updateReadout();
  });

  meterSelect.addEventListener("change", () => {
    state.beatsPerBar = parseMeter(meterSelect.value);
    state.beatIndex = Math.min(state.beatIndex, state.beatsPerBar - 1);
    state.countInTotalBeats = state.countInBars * state.beatsPerBar;
    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
  });

  subdivisionSelect.addEventListener("change", () => {
    state.subdivision = subdivisionModes[subdivisionSelect.value] ? subdivisionSelect.value : "auto";
    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
  });

  countInSelect.addEventListener("change", () => {
    state.countInBars = clamp(Math.round(Number(countInSelect.value) || 0), 0, 2);
    state.countInTotalBeats = state.countInBars * state.beatsPerBar;
    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
  });

  clickVolumeInput.addEventListener("input", () => {
    if (state.masterGain) {
      state.masterGain.gain.value = clickVolume();
    }
    updateReadout();
    showRhythmPanel(state.running ? 2200 : 0);
  });

  window.addEventListener("resize", resize);
  document.addEventListener("pointerdown", handleRhythmPointerDown);
  document.addEventListener("pointermove", handleRhythmPointerMove);
  document.addEventListener("keydown", handleGlobalKeydown);
  document.addEventListener("fullscreenchange", resize);

  resize();
  updateReadout();
  setTransportText();
  syncRhythmPanelVisibility();
  requestAnimationFrame(draw);
}());
