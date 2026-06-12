(function () {
  const canvas = document.getElementById("stage");
  const ctx = canvas.getContext("2d");
  const bpmInput = document.getElementById("bpm");
  const beatsInput = document.getElementById("beats");
  const volumeInput = document.getElementById("volume");
  const transportButton = document.getElementById("transport");
  const resetButton = document.getElementById("reset");
  const readout = document.getElementById("readout");

  const state = {
    running: false,
    bpm: Number(bpmInput.value),
    beatsPerBar: Number(beatsInput.value),
    beatIndex: 0,
    bar: 1,
    startAt: performance.now(),
    nextBeatAt: 0,
    lastBeatAt: performance.now(),
    audioContext: null,
    masterGain: null,
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
  }

  function ensureAudio() {
    if (state.audioContext) {
      return;
    }

    const AudioContext = window.AudioContext || window.webkitAudioContext;
    state.audioContext = new AudioContext();
    state.masterGain = state.audioContext.createGain();
    state.masterGain.gain.value = Number(volumeInput.value);
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
    state.beatIndex += 1;

    if (state.beatIndex >= state.beatsPerBar) {
      state.beatIndex = 0;
      state.bar += 1;
    }

    state.lastBeatAt = performance.now();
    scheduleClick(state.beatIndex === 0);
    updateReadout();
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

  function updateReadout() {
    const beat = state.beatIndex + 1;
    readout.textContent = `BPM:${state.bpm}  B:${beat}/${state.beatsPerBar}  BAR:${padBar(state.bar)}`;
  }

  function drawText(text, x, y, align, tone) {
    ctx.save();
    ctx.fillStyle = tone === "dim" ? "rgba(255, 255, 255, 0.48)" : "rgba(255, 255, 255, 0.94)";
    ctx.font = `700 ${Math.max(10, Math.min(width, height) * 0.012)}px Consolas, monospace`;
    ctx.textAlign = align;
    ctx.textBaseline = "middle";
    ctx.fillText(text, x, y);
    ctx.restore();
  }

  function drawTimeline(beatProgress, pulse) {
    const subdivisions = 8;
    const count = state.beatsPerBar * subdivisions + 1;
    const left = width * 0.033;
    const right = width * 0.968;
    const y = height * 0.745;
    const tickHeight = height * 0.052;
    const beatWidth = (right - left) / state.beatsPerBar;
    const step = beatWidth / subdivisions;
    const barProgress = (state.beatIndex + beatProgress) / state.beatsPerBar;
    const markerX = left + (right - left) * Math.min(barProgress, 0.999);
    const blockWidth = Math.max(18, beatWidth * 0.08);
    const blockHeight = tickHeight * 0.8;

    ctx.save();
    ctx.strokeStyle = "rgba(255, 255, 255, 0.82)";
    ctx.lineWidth = 1;

    for (let index = 0; index < count; index += 1) {
      const x = left + index * step;
      const isBeat = index % subdivisions === 0;
      const scale = isBeat ? 1.18 : 0.72;
      ctx.strokeStyle = isBeat ? "rgba(255, 255, 255, 0.96)" : "rgba(255, 255, 255, 0.58)";
      ctx.lineWidth = isBeat ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(x, y - tickHeight * scale * 0.5);
      ctx.lineTo(x, y + tickHeight * scale * 0.5);
      ctx.stroke();
    }

    ctx.strokeStyle = "rgba(255, 255, 255, 0.24)";
    ctx.lineWidth = 1;
    for (let beat = 1; beat < state.beatsPerBar; beat += 1) {
      const x = left + beat * beatWidth;
      ctx.beginPath();
      ctx.moveTo(x, y - tickHeight * 0.85);
      ctx.lineTo(x, y + tickHeight * 0.85);
      ctx.stroke();
    }

    ctx.fillStyle = `rgba(255, 255, 255, ${0.84 + pulse * 0.16})`;
    ctx.fillRect(markerX, y - blockHeight * 0.5, blockWidth, blockHeight);
    ctx.restore();
  }

  function drawOverlay(now) {
    const beat = state.beatIndex + 1;
    const elapsedSeconds = state.running ? (now - state.startAt) / 1000 : 0;
    const audioRate = state.audioContext ? state.audioContext.sampleRate : 44100;

    drawText(`B: ${beat}/${state.beatsPerBar}`, width * 0.098, height * 0.104, "left");
    drawText(`BPM: ${state.bpm}`, width * 0.5, height * 0.104, "center", "dim");
    drawText(`BAR: ${padBar(state.bar)}`, width * 0.9, height * 0.104, "right");

    drawText(`VOL: ${Number(volumeInput.value).toFixed(2)}`, width * 0.098, height * 0.52, "left", "dim");
    drawText(`WxH: ${Math.round(width)}x${Math.round(height)}`, width * 0.9, height * 0.52, "right", "dim");

    drawText(`SEC: ${elapsedSeconds.toFixed(6)}`, width * 0.098, height * 0.93, "left");
    drawText(`P: ${state.beatsPerBar}`, width * 0.5, height * 0.93, "center", "dim");
    drawText(`ST: ${state.running ? "RUN" : "STOP"}  SR: ${audioRate}`, width * 0.9, height * 0.93, "right");
  }

  function draw(now) {
    updateScheduler(now);

    const elapsed = now - state.lastBeatAt;
    const progress = state.running ? Math.min(elapsed / intervalMs(), 1) : 0;
    const pulse = Math.max(0, 1 - elapsed / 180);

    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#020202";
    ctx.fillRect(0, 0, width, height);

    drawTimeline(progress, pulse);
    drawOverlay(now);

    requestAnimationFrame(draw);
  }

  transportButton.addEventListener("click", async () => {
    ensureAudio();
    await state.audioContext.resume();

    state.running = !state.running;
    transportButton.textContent = state.running ? "Pause" : "Start";

    if (state.running) {
      state.lastBeatAt = performance.now();
      state.startAt = state.lastBeatAt;
      state.nextBeatAt = state.lastBeatAt + intervalMs();
      scheduleClick(state.beatIndex === 0);
    }

    updateReadout();
  });

  resetButton.addEventListener("click", () => {
    state.beatIndex = 0;
    state.bar = 1;
    state.lastBeatAt = performance.now();
    state.startAt = state.lastBeatAt;
    state.nextBeatAt = state.lastBeatAt;
    updateReadout();
  });

  bpmInput.addEventListener("input", () => {
    state.bpm = Number(bpmInput.value);
    updateReadout();
  });

  beatsInput.addEventListener("change", () => {
    state.beatsPerBar = Number(beatsInput.value);
    state.beatIndex = Math.min(state.beatIndex, state.beatsPerBar - 1);
    updateReadout();
  });

  volumeInput.addEventListener("input", () => {
    if (state.masterGain) {
      state.masterGain.gain.value = Number(volumeInput.value);
    }
  });

  window.addEventListener("resize", resize);

  resize();
  updateReadout();
  requestAnimationFrame(draw);
}());
