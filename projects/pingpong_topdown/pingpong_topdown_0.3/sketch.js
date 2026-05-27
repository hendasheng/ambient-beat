const canvas = document.getElementById("rallyCanvas");
const ctx = canvas.getContext("2d");

const stateLabel = document.getElementById("stateLabel");
const shotLabel = document.getElementById("shotLabel");
const powerLabel = document.getElementById("powerLabel");
const beatLabel = document.getElementById("beatLabel");
const bpmInput = document.getElementById("bpmInput");
const meterSelect = document.getElementById("meterSelect");
const subdivisionSelect = document.getElementById("subdivisionSelect");
const countInSelect = document.getElementById("countInSelect");
const clickVolumeInput = document.getElementById("clickVolumeInput");
const clickVolumeLabel = document.getElementById("clickVolumeLabel");
const playPauseButton = document.getElementById("playPauseButton");
const resetButton = document.getElementById("resetButton");
const beatStrip = document.getElementById("beatStrip");
const miniBeatStrip = document.getElementById("miniBeatStrip");
const miniBeatReadout = document.getElementById("miniBeatReadout");
const tempoLabel = document.getElementById("tempoLabel");
const meterLabel = document.getElementById("meterLabel");
const bouncePresetLabel = document.getElementById("bouncePresetLabel");
const bouncePresetGrid = document.getElementById("bouncePresetGrid");
const hitPresetLabel = document.getElementById("hitPresetLabel");
const hitPresetGrid = document.getElementById("hitPresetGrid");
const rhythmPanel = document.querySelector(".rhythm-panel");
let rhythmPanelHideTimer = 0;
let lastRhythmPointerMove = 0;

const uiTextCache = new WeakMap();

const phaseLabels = {
  strike: "strike",
  flight: "flight",
  bounce_contact: "table hit",
  bounce_rise: "rise",
  return_strike: "return",
  "count-in": "count in"
};

const shotLabels = {
  drive: "drive",
  deep_rally: "deep rally",
  cross: "cross",
  short_push: "short push",
  fast_attack: "fast attack",
  wide_deep: "wide deep",
  change_line: "change line",
  slow_high_short: "slow short",
  ready: "ready"
};

const stateOrder = ["strike", "flight", "bounce_contact", "bounce_rise", "return_strike"];
const ballRadiusRatio = 0.04 / 2.74 / 2;
const shotTypes = [
  "drive",
  "deep_rally",
  "cross",
  "drive",
  "short_push",
  "fast_attack",
  "wide_deep",
  "change_line"
];

const world = {
  width: 0,
  height: 0,
  dpr: 1,
  table: { x: 0, y: 0, w: 0, h: 0 },
  direction: 1,
  nextStart: { x: -0.43, y: 0.08 },
  shotIndex: 0,
  beatIndex: 0,
  bpm: 68,
  meter: { numerator: 4, denominator: 4 },
  subdivision: "auto",
  countInBars: 0,
  countInEnd: 0,
  clickVolume: 0.78,
  isPlaying: false,
  isPaused: false,
  useToneClock: false,
  clockOrigin: 0,
  current: null,
  servePrep: null,
  elapsed: 0,
  lastTime: 0,
  wasHidden: false,
  transportPausedForHidden: false,
  trails: [],
  pings: [],
  hitCurves: []
};

const audio = {
  ready: false,
  master: null,
  hitNoise: null,
  hitFilter: null,
  hitTone: null,
  bounceTone: null,
  bounceClick: null,
  bounceFilter: null,
  bounceRoom: null,
  bounceBody: null,
  bounceHigh: null,
  bounceLow: null,
  bounceBand: null
};

const bouncePresets = [
  { name: "Deep Wood A", high: [790, 1210], low: [1620, 2240], band: [780, 1260], clickHigh: [1380, 2280], toneFreq: [72, 118], bodyDur: [0.038, 0.066], clickDur: [0.0042, 0.008], toneVol: [-14, -5], bodyVol: [-12, -4], clickVol: [-27, -16], room: 0.08 },
  { name: "Deep Wood B", high: [850, 1300], low: [1680, 2340], band: [820, 1320], clickHigh: [1450, 2380], toneFreq: [76, 122], bodyDur: [0.04, 0.07], clickDur: [0.0045, 0.0085], toneVol: [-13, -4], bodyVol: [-12, -4], clickVol: [-26, -15], room: 0.1 },
  { name: "Deep Wood C", high: [900, 1360], low: [1760, 2440], band: [860, 1380], clickHigh: [1520, 2500], toneFreq: [80, 130], bodyDur: [0.036, 0.062], clickDur: [0.004, 0.0076], toneVol: [-14, -5], bodyVol: [-13, -5], clickVol: [-24, -14], room: 0.09 },
  { name: "Drier Wood", high: [980, 1450], low: [1820, 2560], band: [920, 1480], clickHigh: [1650, 2750], toneFreq: [86, 138], bodyDur: [0.03, 0.054], clickDur: [0.0036, 0.0068], toneVol: [-16, -7], bodyVol: [-15, -6], clickVol: [-22, -12], room: 0.055 },
  { name: "Soft Hollow", high: [730, 1120], low: [1500, 2100], band: [720, 1180], clickHigh: [1300, 2180], toneFreq: [68, 110], bodyDur: [0.044, 0.078], clickDur: [0.0048, 0.009], toneVol: [-12, -4], bodyVol: [-11, -4], clickVol: [-29, -18], room: 0.12 },
  { name: "Tight Hollow", high: [1050, 1540], low: [1940, 2700], band: [980, 1520], clickHigh: [1780, 2920], toneFreq: [92, 146], bodyDur: [0.026, 0.046], clickDur: [0.0032, 0.006], toneVol: [-18, -8], bodyVol: [-16, -7], clickVol: [-20, -10], room: 0.045 },
  { name: "Round Board", high: [820, 1240], low: [1640, 2280], band: [800, 1300], clickHigh: [1420, 2320], toneFreq: [74, 120], bodyDur: [0.042, 0.072], clickDur: [0.0046, 0.0086], toneVol: [-12, -4], bodyVol: [-13, -4], clickVol: [-28, -17], room: 0.075 },
  { name: "Dry Low", high: [960, 1420], low: [1780, 2480], band: [900, 1440], clickHigh: [1600, 2660], toneFreq: [84, 134], bodyDur: [0.032, 0.056], clickDur: [0.0034, 0.0064], toneVol: [-17, -8], bodyVol: [-16, -7], clickVol: [-21, -11], room: 0.035 },
  { name: "Dense Low", high: [880, 1320], low: [1720, 2380], band: [860, 1360], clickHigh: [1500, 2460], toneFreq: [78, 128], bodyDur: [0.04, 0.068], clickDur: [0.004, 0.0078], toneVol: [-13, -4], bodyVol: [-11, -3], clickVol: [-27, -16], room: 0.065 },
  { name: "Board Low", high: [760, 1180], low: [1580, 2180], band: [740, 1220], clickHigh: [1360, 2240], toneFreq: [70, 116], bodyDur: [0.038, 0.07], clickDur: [0.0042, 0.0084], toneVol: [-14, -5], bodyVol: [-12, -4], clickVol: [-30, -18], room: 0.04 }
];

const hitPresets = [
  { name: "Hard Face A", toneFreq: [320, 510], toneDur: [0.006, 0.011], clickFreq: [3000, 5100], clickDur: [0.0018, 0.0035], toneVol: [-30, -20], clickVol: [-8, -1], filterQ: 0.5 },
  { name: "Hard Face B", toneFreq: [340, 535], toneDur: [0.006, 0.01], clickFreq: [3300, 5600], clickDur: [0.0017, 0.0032], toneVol: [-30, -20], clickVol: [-6, 0], filterQ: 0.45 },
  { name: "Hard Face C", toneFreq: [360, 575], toneDur: [0.0055, 0.0095], clickFreq: [3500, 6000], clickDur: [0.0016, 0.003], toneVol: [-32, -22], clickVol: [-5, 1], filterQ: 0.42 },
  { name: "Sharp Plate", toneFreq: [300, 480], toneDur: [0.0065, 0.0115], clickFreq: [2850, 4800], clickDur: [0.0019, 0.0037], toneVol: [-29, -19], clickVol: [-7, 0], filterQ: 0.52 },
  { name: "Thin Hard", toneFreq: [380, 610], toneDur: [0.005, 0.009], clickFreq: [3800, 6500], clickDur: [0.0014, 0.0028], toneVol: [-34, -24], clickVol: [-5, 2], filterQ: 0.38 },
  { name: "Hard Face D", toneFreq: [335, 545], toneDur: [0.006, 0.01], clickFreq: [3400, 5750], clickDur: [0.0017, 0.0031], toneVol: [-31, -21], clickVol: [-6, 1], filterQ: 0.44 },
  { name: "Dry Hard", toneFreq: [315, 505], toneDur: [0.0058, 0.0105], clickFreq: [3100, 5300], clickDur: [0.0016, 0.003], toneVol: [-33, -23], clickVol: [-7, 0], filterQ: 0.46 },
  { name: "Sharp Rubber", toneFreq: [345, 555], toneDur: [0.0062, 0.0108], clickFreq: [3250, 5550], clickDur: [0.0018, 0.0034], toneVol: [-30, -20], clickVol: [-7, 0], filterQ: 0.48 },
  { name: "Edge Snap", toneFreq: [390, 630], toneDur: [0.005, 0.0088], clickFreq: [4100, 6900], clickDur: [0.0013, 0.0026], toneVol: [-35, -25], clickVol: [-4, 2], filterQ: 0.36 },
  { name: "Face Snap", toneFreq: [330, 540], toneDur: [0.006, 0.01], clickFreq: [3350, 5800], clickDur: [0.0016, 0.003], toneVol: [-31, -21], clickVol: [-5, 2], filterQ: 0.4 }
];

let selectedBouncePreset = 0;
let selectedHitPreset = 1;

const subdivisionModes = {
  auto: { label: "Auto", fraction: 0.5 },
  eighth: { label: "1/8", fraction: 0.5 },
  triplet: { label: "1/8T", fraction: 2 / 3 },
  sixteenth: { label: "1/16", fraction: 0.25 }
};

function parseMeter(value) {
  const [numerator, denominator] = value.split("/").map((part) => Number(part));
  return {
    numerator: clamp(Number.isFinite(numerator) ? numerator : 4, 1, 12),
    denominator: clamp(Number.isFinite(denominator) ? denominator : 4, 1, 16)
  };
}

function getBeatMs() {
  return 60000 / world.bpm;
}

function getSubdivisionMode() {
  return subdivisionModes[world.subdivision] || subdivisionModes.auto;
}

function applyClickVolume() {
  if (!audio.master) {
    return;
  }

  const gain = Math.pow(clamp(world.clickVolume, 0, 1), 1.6) * 2.8;
  audio.master.gain.rampTo(gain, 0.02);
}

function configureTransport() {
  if (typeof Tone === "undefined") {
    return;
  }

  Tone.Transport.bpm.value = world.bpm;
  Tone.Transport.timeSignature = [world.meter.numerator, world.meter.denominator];
}

function clockMsToToneTime(clockMs) {
  if (!world.useToneClock || typeof Tone === "undefined") {
    return undefined;
  }

  const deltaSeconds = clockMs / 1000 - Tone.Transport.seconds;
  return Math.max(Tone.now(), Tone.now() + deltaSeconds);
}

function getClockMs(timestamp) {
  if (world.useToneClock && typeof Tone !== "undefined") {
    return Tone.Transport.seconds * 1000;
  }

  if (!world.clockOrigin) {
    world.clockOrigin = timestamp;
  }
  return timestamp - world.clockOrigin;
}

function resetRallyClock(clockMs = 0) {
  world.direction = 1;
  world.nextStart = { x: -0.43, y: 0.08 };
  world.shotIndex = 0;
  world.beatIndex = 0;
  world.current = null;
  world.servePrep = null;
  world.elapsed = 0;
  world.lastTime = clockMs;
  world.trails = [];
  world.pings = [];
  world.hitCurves = [];
  world.countInEnd = world.countInBars * world.meter.numerator * getBeatMs();
}

function createServePrep() {
  const direction = Math.random() > 0.5 ? 1 : -1;
  const y = randRange(performance.now(), -0.24, 0.24, 91);
  const contact = {
    x: direction > 0 ? -0.57 : 0.57,
    y
  };

  world.direction = direction;
  world.nextStart = { ...contact };

  return {
    direction,
    contact,
    tossStart: {
      x: contact.x - direction * 0.045,
      y: y + randRange(performance.now(), -0.018, 0.018, 93)
    },
    spinPhase: randRange(performance.now(), 0, Math.PI * 2, 92)
  };
}

function scheduleCountIn() {
  if (!audio.ready || !world.useToneClock || world.countInEnd <= 0) {
    return;
  }

  const beatMs = getBeatMs();
  const count = Math.round(world.countInEnd / beatMs);
  for (let i = 0; i < count; i += 1) {
    const beatNumber = (i % world.meter.numerator) + 1;
    playHitSound({ power: beatNumber === 1 ? 0.66 : 0.48, accent: beatNumber === 1 }, clockMsToToneTime(i * beatMs));
  }
}

function resyncRallyToClock(clockMs) {
  const beatMs = getBeatMs();
  const beatIndex = Math.max(0, Math.floor(clockMs / beatMs));
  const beatStart = beatIndex * beatMs;

  world.direction = beatIndex % 2 === 0 ? 1 : -1;
  world.nextStart = world.direction > 0
    ? { x: -0.43, y: 0.08 }
    : { x: 0.43, y: -0.08 };
  world.shotIndex = beatIndex % shotTypes.length;
  world.beatIndex = beatIndex;
  world.current = null;
  world.elapsed = 0;
  world.lastTime = clockMs;
  world.trails = [];
  world.pings = [];
  world.hitCurves = [];
  startNextShot(beatStart, clockMs - beatStart, false);
  if (world.current && world.elapsed >= world.current.bounceTime) {
    world.current.didPing = true;
  }
}

function handleVisibilityChange() {
  if (document.hidden) {
    world.wasHidden = true;
    if (world.isPlaying && typeof Tone !== "undefined" && Tone.Transport.state === "started") {
      Tone.Transport.pause();
      world.transportPausedForHidden = true;
    }
    return;
  }

  if (world.transportPausedForHidden && typeof Tone !== "undefined" && Tone.context.state === "running") {
    Tone.Transport.start("+0.02");
    world.transportPausedForHidden = false;
  }
  world.wasHidden = true;
}

function createBeatDurations() {
  const beatMs = getBeatMs();
  const tableBeat = beatMs * getSubdivisionMode().fraction;
  const strike = clamp(beatMs * 0.08, 22, 72);
  const bounceContact = clamp(beatMs * 0.052, 18, 46);
  const returnStrike = clamp(beatMs * 0.06, 20, 58);
  const flight = Math.max(70, tableBeat - strike);
  const bounceRise = Math.max(70, beatMs - tableBeat - bounceContact - returnStrike);

  return {
    strike,
    flight,
    bounce_contact: bounceContact,
    bounce_rise: bounceRise,
    return_strike: returnStrike
  };
}

function setText(element, value) {
  if (!element) {
    return;
  }

  const text = String(value);
  if (uiTextCache.get(element) === text) {
    return;
  }

  element.textContent = text;
  uiTextCache.set(element, text);
}

function renderBeatStrip(activeBeat = 1) {
  renderBeatDots(beatStrip, activeBeat, "beat-dot");
  renderBeatDots(miniBeatStrip, activeBeat, "mini-beat-dot");
}

function renderBeatDots(container, activeBeat, dotClass) {
  if (!container) {
    return;
  }

  container.style.setProperty("--beats", world.meter.numerator);
  if (container.dataset.beats !== String(world.meter.numerator) || container.dataset.dotClass !== dotClass) {
    container.replaceChildren();
    for (let i = 1; i <= world.meter.numerator; i += 1) {
      container.appendChild(document.createElement("span"));
    }
    container.dataset.beats = String(world.meter.numerator);
    container.dataset.dotClass = dotClass;
  }

  Array.from(container.children).forEach((dot, index) => {
    const beat = index + 1;
    const className = `${dotClass}${beat === 1 ? " downbeat" : ""}${beat === activeBeat ? " active" : ""}`;
    if (dot.className !== className) {
      dot.className = className;
    }
  });
}

function setHudPhase(value) {
  setText(stateLabel, getPhaseLabel(value));
}

function setHudShot(value) {
  setText(shotLabel, getShotLabel(value));
}

function setHudPower(value) {
  setText(powerLabel, value);
}

function setHudBeat(value) {
  setText(beatLabel, value);
}

function setTransportText() {
  if (playPauseButton) {
    setText(playPauseButton, world.isPlaying ? "Pause" : "Start");
  }
}

function showRhythmPanel(duration = 2400) {
  if (!world.isPlaying) {
    syncRhythmPanelVisibility();
    return;
  }

  document.body.classList.add("rhythm-visible");
  window.clearTimeout(rhythmPanelHideTimer);
  rhythmPanelHideTimer = window.setTimeout(() => {
    if (!world.isPlaying) {
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
  document.body.classList.toggle("rhythm-pinned", !world.isPlaying);
  if (!world.isPlaying) {
    document.body.classList.remove("rhythm-visible");
  }
}

function handleRhythmPointerMove(event) {
  if (!world.isPlaying) {
    return;
  }

  const now = performance.now();
  if (now - lastRhythmPointerMove < 80) {
    return;
  }
  lastRhythmPointerMove = now;

  const proximity = window.innerWidth <= 680 ? 230 : 170;
  if (window.innerHeight - event.clientY <= proximity) {
    showRhythmPanel(2200);
  }
}

function getPhaseLabel(value) {
  return phaseLabels[value] || String(value).replace(/_/g, " ");
}

function getShotLabel(value) {
  return shotLabels[value] || String(value).replace(/_/g, " ");
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

function updateRhythmLabels(activeBeat = 1) {
  setText(tempoLabel, `${world.bpm} BPM`);
  if (meterLabel) {
    const tableBeat = activeBeat + getSubdivisionMode().fraction;
    const countInText = world.countInBars > 0 ? ` · count ${world.countInBars} bar` : "";
    setText(meterLabel, `${world.meter.numerator}/${world.meter.denominator} · ${getSubdivisionMode().label} · hit ${activeBeat}, table ${tableBeat.toFixed(2).replace(/0$/, "")}${countInText}`);
  }
  setText(miniBeatReadout, `${world.bpm} BPM · ${world.meter.numerator}/${world.meter.denominator}`);
  setHudBeat(activeBeat);
  renderBeatStrip(activeBeat);
}

function applyRhythmInputs() {
  if (bpmInput) {
    world.bpm = clamp(Math.round(Number(bpmInput.value) || 68), 40, 240);
    bpmInput.value = world.bpm;
  }
  if (meterSelect) {
    world.meter = parseMeter(meterSelect.value);
  }
  if (subdivisionSelect) {
    world.subdivision = subdivisionModes[subdivisionSelect.value] ? subdivisionSelect.value : "auto";
  }
  if (countInSelect) {
    world.countInBars = clamp(Math.round(Number(countInSelect.value) || 0), 0, 2);
  }
  if (clickVolumeInput) {
    world.clickVolume = clamp(Number(clickVolumeInput.value) / 100, 0, 1);
  }
  setText(clickVolumeLabel, `Click ${Math.round(world.clickVolume * 100)}%`);
  configureTransport();
  applyClickVolume();

  const activeBeat = clamp(world.current?.beatNumber || ((world.beatIndex % world.meter.numerator) + 1), 1, world.meter.numerator);
  updateRhythmLabels(activeBeat);
}

function initAudio() {
  if (audio.ready || typeof Tone === "undefined") {
    return;
  }

  audio.master = new Tone.Gain(2.4).toDestination();
  applyClickVolume();
  audio.hitTone = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 0.55,
    oscillator: { type: "square" },
    envelope: {
      attack: 0.001,
      decay: 0.016,
      sustain: 0,
      release: 0.004
    }
  }).connect(audio.master);
  audio.bounceRoom = new Tone.Reverb({
    decay: 0.15,
    preDelay: 0.002,
    wet: 0.16
  }).connect(audio.master);
  audio.bounceHigh = new Tone.Filter({
    type: "highpass",
    frequency: 1837,
    rolloff: -24,
    Q: 0.7
  }).connect(audio.bounceRoom);
  audio.bounceLow = new Tone.Filter({
    type: "lowpass",
    frequency: 2843,
    rolloff: -24,
    Q: 0.75
  }).connect(audio.bounceHigh);
  audio.bounceBand = new Tone.Filter({
    type: "bandpass",
    frequency: 1756,
    Q: 1.15
  }).connect(audio.bounceLow);
  audio.bounceTone = new Tone.MembraneSynth({
    pitchDecay: 0.01,
    octaves: 0.7,
    oscillator: { type: "triangle" },
    envelope: {
      attack: 0.001,
      decay: 0.022,
      sustain: 0,
      release: 0.04
    }
  }).connect(audio.bounceBand);
  audio.bounceBody = new Tone.MetalSynth({
    frequency: 1756,
    envelope: {
      attack: 0.001,
      decay: 0.028,
      release: 0.035
    },
    harmonicity: 1.12,
    modulationIndex: 9,
    resonance: 1200,
    octaves: 0.45
  }).connect(audio.bounceBand);
  audio.hitFilter = new Tone.Filter({
    type: "bandpass",
    frequency: 2600,
    Q: 0.9
  }).connect(audio.master);
  audio.hitNoise = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: {
      attack: 0.001,
      decay: 0.004,
      sustain: 0,
      release: 0.002
    }
  }).connect(audio.hitFilter);
  audio.bounceFilter = new Tone.Filter({
    type: "highpass",
    frequency: 3200,
    Q: 0.65
  }).connect(audio.bounceRoom);
  audio.bounceClick = new Tone.NoiseSynth({
    noise: { type: "white" },
    envelope: {
      attack: 0.001,
      decay: 0.003,
      sustain: 0,
      release: 0.002
    }
  }).connect(audio.bounceFilter);
  audio.ready = true;
}

async function unlockAudio() {
  if (typeof Tone === "undefined") {
    return;
  }

  initAudio();
  if (Tone.context.state !== "running") {
    await Tone.start();
  }
  configureTransport();
  world.useToneClock = true;
}

async function startPlayback() {
  await unlockAudio();
  if (typeof Tone === "undefined") {
    return;
  }

  Tone.Transport.stop();
  Tone.Transport.position = 0;
  resetRallyClock(0);
  if (world.countInEnd > 0) {
    world.servePrep = createServePrep();
  }
  world.isPlaying = true;
  world.isPaused = false;
  world.wasHidden = false;
  Tone.Transport.start("+0.02");
  scheduleCountIn();
  updateTransportButtons();
  syncRhythmPanelVisibility();
  showRhythmPanel(1800);
}

async function togglePlayback() {
  if (!world.isPlaying) {
    if (world.isPaused) {
      await unlockAudio();
      if (typeof Tone !== "undefined") {
        Tone.Transport.start("+0.02");
      }
      world.isPlaying = true;
      world.isPaused = false;
      updateTransportButtons();
      syncRhythmPanelVisibility();
      showRhythmPanel(1800);
      return;
    }
    await startPlayback();
    return;
  }

  if (typeof Tone !== "undefined" && Tone.Transport.state === "started") {
    Tone.Transport.pause();
  }
  world.isPlaying = false;
  world.isPaused = true;
  updateTransportButtons();
  syncRhythmPanelVisibility();
}

function resetPlayback() {
  if (typeof Tone !== "undefined") {
    Tone.Transport.stop();
    Tone.Transport.position = 0;
  }
  world.isPlaying = false;
  world.isPaused = false;
  resetRallyClock(0);
  world.servePrep = null;
  updateRhythmLabels(1);
  updateTransportButtons();
  syncRhythmPanelVisibility();
}

function updateTransportButtons() {
  setTransportText();
}

function playHitSound(shot, time) {
  if (!audio.ready || typeof Tone === "undefined" || Tone.context.state !== "running") {
    return;
  }

  const now = time ?? Tone.now();
  const power = clamp(shot.power, 0, 1);
  const preset = hitPresets[selectedHitPreset];
  const accent = shot.accent ? 1 : 0;

  audio.hitFilter.Q.value = preset.filterQ;
  audio.hitFilter.frequency.value = mix(preset.clickFreq[0], preset.clickFreq[1], power) * (accent ? 1.08 : 1);
  audio.hitTone.volume.value = mix(preset.toneVol[0], preset.toneVol[1], power) + 4 + accent * 3.5;
  audio.hitNoise.volume.value = mix(preset.clickVol[0], preset.clickVol[1], power) + 4 + accent * 4.5;
  audio.hitTone.triggerAttackRelease(
    mix(preset.toneFreq[0], preset.toneFreq[1], power),
    mix(preset.toneDur[0], preset.toneDur[1], power),
    now
  );
  audio.hitNoise.triggerAttackRelease(mix(preset.clickDur[0], preset.clickDur[1], power), now);
}

function playBounceSound(shot, time) {
  if (!audio.ready || typeof Tone === "undefined" || Tone.context.state !== "running") {
    return;
  }

  const now = time ?? Tone.now();
  const power = clamp(shot.power, 0, 1);
  const preset = bouncePresets[selectedBouncePreset];
  const accent = shot.accent ? 1 : 0;
  const strikeHeight = shot.strikeHeight ?? 0.42;
  const peakHeight = shot.peakHeight ?? 0.42;
  const flight = shot.durations?.flight ?? getBeatMs() * 0.42;
  const target = shot.target ?? { x: 0.32, y: 0 };
  const returnPoint = shot.returnPoint ?? { x: 0.42, y: 0 };
  const travelHeight = clamp((strikeHeight + peakHeight - 0.48) / 0.46, 0, 1);
  const flightSeconds = Math.max(0.24, flight / 1000);
  const verticalImpact = clamp((strikeHeight + peakHeight * 0.72) / flightSeconds / 2.1, 0, 1);
  const depth = clamp((Math.abs(target.x) - 0.12) / 0.36, 0, 1);
  const leavesTable = Math.abs(returnPoint.x) > 0.5 ? 1 : 0;
  const rawImpact = clamp(
    power * 0.38 +
    verticalImpact * 0.34 +
    travelHeight * 0.16 +
    depth * 0.1 +
    leavesTable * 0.08,
    0,
    1
  );
  const impact = Math.pow(rawImpact, 0.72);
  const impactDb = mix(-5, 5.5, impact) + accent * 1.2;

  audio.bounceRoom.wet.value = preset.room;
  audio.bounceHigh.frequency.value = mix(preset.high[0], preset.high[1], impact);
  audio.bounceLow.frequency.value = mix(preset.low[0], preset.low[1], impact);
  audio.bounceBand.frequency.value = mix(preset.band[0], preset.band[1], impact);
  audio.bounceFilter.frequency.value = mix(preset.clickHigh[0], preset.clickHigh[1], impact);
  audio.bounceTone.volume.value = mix(preset.toneVol[0], preset.toneVol[1], impact) + impactDb;
  audio.bounceBody.volume.value = mix(preset.bodyVol[0], preset.bodyVol[1], impact) + impactDb;
  audio.bounceClick.volume.value = mix(preset.clickVol[0], preset.clickVol[1], impact) + impactDb;
  audio.bounceTone.triggerAttackRelease(
    mix(preset.toneFreq[0], preset.toneFreq[1], impact),
    mix(preset.bodyDur[0], preset.bodyDur[1], impact),
    now
  );
  audio.bounceBody.triggerAttackRelease(mix(preset.bodyDur[0], preset.bodyDur[1], impact), now + 0.001);
  audio.bounceClick.triggerAttackRelease(mix(preset.clickDur[0], preset.clickDur[1], impact), now);
}

function updateBouncePresetUI() {
  if (!bouncePresetGrid || !bouncePresetLabel) {
    return;
  }

  setText(bouncePresetLabel, bouncePresets[selectedBouncePreset].name);
  bouncePresetGrid.querySelectorAll("[data-bounce-preset]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.bouncePreset) === selectedBouncePreset);
  });
}

function updateHitPresetUI() {
  if (!hitPresetGrid || !hitPresetLabel) {
    return;
  }

  setText(hitPresetLabel, hitPresets[selectedHitPreset].name);
  hitPresetGrid.querySelectorAll("[data-hit-preset]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.hitPreset) === selectedHitPreset);
  });
}

async function selectBouncePreset(index, audition = true) {
  selectedBouncePreset = clamp(index, 0, bouncePresets.length - 1);
  updateBouncePresetUI();

  if (audition) {
    await unlockAudio();
    playBounceSound({ power: 0.72 });
  }
}

async function selectHitPreset(index, audition = true) {
  selectedHitPreset = clamp(index, 0, hitPresets.length - 1);
  updateHitPresetUI();

  if (audition) {
    await unlockAudio();
    playHitSound({ power: 0.72 });
  }
}

if (bouncePresetGrid) {
  bouncePresetGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-bounce-preset]");
    if (!button) {
      return;
    }

    selectBouncePreset(Number(button.dataset.bouncePreset));
  });
}

if (hitPresetGrid) {
  hitPresetGrid.addEventListener("click", (event) => {
    const button = event.target.closest("[data-hit-preset]");
    if (!button) {
      return;
    }

    selectHitPreset(Number(button.dataset.hitPreset));
  });
}

updateBouncePresetUI();
updateHitPresetUI();

function resize() {
  world.dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
  world.width = window.innerWidth;
  world.height = window.innerHeight;
  canvas.width = Math.round(world.width * world.dpr);
  canvas.height = Math.round(world.height * world.dpr);
  canvas.style.width = `${world.width}px`;
  canvas.style.height = `${world.height}px`;
  ctx.setTransform(world.dpr, 0, 0, world.dpr, 0, 0);

  const lowerUiReserve = world.width <= 680 ? 194 : 124;
  const tableAreaHeight = Math.max(260, world.height - lowerUiReserve);
  const isFullscreen = Boolean(document.fullscreenElement);
  const widthRatio = isFullscreen ? 0.9 : 0.82;
  const heightWidthFactor = isFullscreen ? 1.62 : 1.42;
  const maxTableW = isFullscreen ? 1480 : 1040;
  const heightRatio = isFullscreen ? 0.84 : 0.72;
  const tableW = Math.min(world.width * widthRatio, tableAreaHeight * heightWidthFactor, maxTableW);
  const tableH = Math.min(tableW * 0.56, tableAreaHeight * heightRatio);
  world.table = {
    x: (world.width - tableW) / 2,
    y: Math.max(34, (tableAreaHeight - tableH) / 2),
    w: tableW,
    h: tableH
  };
  updateMiniBeatPosition();
}

function updateMiniBeatPosition() {
  if (!miniBeatStrip) {
    return;
  }

  const shadowBottom = world.table.y + world.table.h + 22;
  const gap = world.width <= 680 ? 22 : 30;
  const fallback = world.height - (world.width <= 680 ? 66 : 76);
  const top = Math.min(shadowBottom + gap, fallback);
  const miniWidth = Math.round(clamp(world.table.w * 0.25, 132, 260));
  const miniBeatRoot = miniBeatStrip.parentElement;
  miniBeatRoot.style.setProperty("--mini-beat-top", `${Math.round(top)}px`);
  miniBeatRoot.style.setProperty("--mini-beat-width", `${miniWidth}px`);
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function mix(a, b, t) {
  return a + (b - a) * t;
}

function easeOut(t) {
  return 1 - Math.pow(1 - t, 3);
}

function easeOutQuad(t) {
  return 1 - (1 - t) * (1 - t);
}

function bounceProgress(t, shot) {
  return 1 - Math.pow(1 - t, shot.bounceDriveCurve);
}

function bounceHeightProgress(t, shot) {
  return 1 - Math.pow(1 - t, shot.bounceLiftCurve);
}

function point(x, y) {
  const table = world.table;
  return {
    x: table.x + (x + 0.5) * table.w,
    y: table.y + (y + 0.5) * table.h
  };
}

function getBallRadius() {
  return world.table.w * ballRadiusRatio;
}

function curvePoint(a, b, c, t) {
  const mt = 1 - t;
  return {
    x: mt * mt * a.x + 2 * mt * t * b.x + t * t * c.x,
    y: mt * mt * a.y + 2 * mt * t * b.y + t * t * c.y
  };
}

function normalizeVector(v) {
  const length = Math.hypot(v.x, v.y) || 1;
  return {
    x: v.x / length,
    y: v.y / length
  };
}

function travelProgress(t, shot) {
  const deceleration = shot.shotType === "fast_attack"
    ? mix(1.12, 1.2, shot.power)
    : mix(1.22, 1.46, shot.power);
  const controlDrag = shot.shotType === "short_push" ? 0.08 : 0;
  return 1 - Math.pow(1 - t, deceleration + controlDrag);
}

function seededWave(seed, offset = 0) {
  return Math.sin(seed * 12.9898 + offset * 78.233) * 43758.5453 % 1;
}

function randRange(seed, min, max, offset = 0) {
  return mix(min, max, Math.abs(seededWave(seed, offset)));
}

function chooseShotType() {
  const type = shotTypes[world.shotIndex % shotTypes.length];
  world.shotIndex += 1;
  return type;
}

function createShot() {
  const direction = world.direction;
  let shotType = chooseShotType();
  const seed = world.shotIndex + performance.now() * 0.0007;
  const start = { ...world.nextStart };
  const startsFromFarTable = Math.abs(start.x) > 0.49;

  if (startsFromFarTable && shotType === "short_push") {
    shotType = randRange(seed, 0, 1, 35) > 0.68 ? "slow_high_short" : "deep_rally";
  }

  let power = randRange(seed, 0.48, 0.82, 1);
  let targetDepth = randRange(seed, 0.18, 0.43, 2);
  let targetY = randRange(seed, -0.28, 0.28, 3);
  let arcBias = randRange(seed, -0.08, 0.08, 4);
  let postDrift = randRange(seed, 0.05, 0.095, 5);
  let hitTiming = randRange(seed, 0.62, 0.9, 20);
  let canLeaveTable = false;

  if (shotType === "cross") {
    targetY = clamp(-world.nextStart.y * 0.86 + randRange(seed, -0.1, 0.1, 6), -0.36, 0.36);
    targetDepth = randRange(seed, 0.24, 0.43, 7);
    arcBias = targetY > world.nextStart.y ? 0.12 : -0.12;
    power = randRange(seed, 0.58, 0.78, 8);
    hitTiming = randRange(seed, 0.58, 0.88, 21);
  }

  if (shotType === "deep_rally") {
    targetDepth = randRange(seed, 0.42, 0.485, 25);
    targetY = clamp(world.nextStart.y * 0.35 + randRange(seed, -0.18, 0.18, 26), -0.32, 0.32);
    arcBias *= 0.55;
    power = randRange(seed, 0.66, 0.88, 27);
    postDrift = randRange(seed, 0.13, 0.22, 28);
    hitTiming = randRange(seed, 0.66, 0.96, 29);
    canLeaveTable = true;
  }

  if (shotType === "wide_deep") {
    targetDepth = randRange(seed, 0.39, 0.48, 30);
    targetY = randRange(seed, 0.28, 0.44, 31) * (world.nextStart.y >= 0 ? -1 : 1);
    arcBias = targetY > world.nextStart.y ? 0.1 : -0.1;
    power = randRange(seed, 0.62, 0.84, 32);
    postDrift = randRange(seed, 0.11, 0.19, 33);
    hitTiming = randRange(seed, 0.58, 0.94, 34);
    canLeaveTable = true;
  }

  if (shotType === "change_line") {
    targetY = clamp(world.nextStart.y * 0.25 + randRange(seed, -0.34, 0.34, 9), -0.38, 0.38);
    arcBias = targetY > world.nextStart.y ? -0.16 : 0.16;
    power = randRange(seed, 0.54, 0.74, 10);
    hitTiming = randRange(seed, 0.66, 0.96, 22);
  }

  if (shotType === "short_push") {
    targetDepth = randRange(seed, 0.08, 0.18, 11);
    targetY = clamp(world.nextStart.y * 0.45 + randRange(seed, -0.18, 0.18, 12), -0.28, 0.28);
    power = randRange(seed, 0.34, 0.5, 13);
    postDrift = randRange(seed, 0.035, 0.055, 14);
    hitTiming = randRange(seed, 0.46, 0.68, 23);
  }

  if (shotType === "slow_high_short") {
    targetDepth = randRange(seed, 0.1, 0.2, 36);
    targetY = clamp(world.nextStart.y * 0.35 + randRange(seed, -0.16, 0.16, 37), -0.26, 0.26);
    arcBias = randRange(seed, -0.04, 0.04, 38);
    power = randRange(seed, 0.26, 0.38, 39);
    postDrift = randRange(seed, 0.025, 0.045, 40);
    hitTiming = randRange(seed, 0.66, 0.9, 41);
  }

  if (shotType === "fast_attack") {
    targetDepth = randRange(seed, 0.34, 0.46, 15);
    targetY = clamp(world.nextStart.y * 0.18 + randRange(seed, -0.2, 0.2, 16), -0.32, 0.32);
    arcBias *= 0.32;
    power = randRange(seed, 0.84, 0.98, 17);
    postDrift = randRange(seed, 0.08, 0.12, 18);
    hitTiming = randRange(seed, 0.34, 0.56, 24);
  }

  if (startsFromFarTable && shotType !== "slow_high_short") {
    targetDepth = Math.max(targetDepth, randRange(seed, 0.36, 0.49, 42));
    power = Math.max(power, randRange(seed, 0.58, 0.76, 43));
    postDrift = Math.max(postDrift, randRange(seed, 0.1, 0.18, 44));
    hitTiming = Math.max(hitTiming, randRange(seed, 0.62, 0.9, 45));
    canLeaveTable = true;
  }

  const target = {
    x: direction > 0 ? targetDepth : -targetDepth,
    y: targetY
  };
  const control = {
    x: (start.x + target.x) / 2,
    y: (start.y + target.y) / 2 + arcBias
  };
  const incoming = normalizeVector({
    x: Math.abs(target.x - control.x) * direction,
    y: target.y - control.y
  });
  const bounceCarry = postDrift * mix(0.74, 1.38, hitTiming) * mix(0.84, 1.28, power);
  const returnLimit = canLeaveTable ? 0.61 : 0.46;
  const returnPoint = {
    x: clamp(target.x + incoming.x * bounceCarry, -returnLimit, returnLimit),
    y: clamp(target.y + incoming.y * bounceCarry, -0.5, 0.5)
  };
  const depth = clamp((Math.abs(target.x) - 0.12) / 0.36, 0, 1);
  const leaveFactor = canLeaveTable ? 1 : 0;
  const bounceImpact = clamp(power * 0.5 + depth * 0.24 + leaveFactor * 0.18 + hitTiming * 0.08, 0, 1);
  const durations = createBeatDurations();
  const strikeHeight = 0.3 + power * 0.18;
  const peakHeight = 0.28 + power * 0.18;
  const bouncePeak = shotType === "short_push" ? 0.22 + power * 0.2 : 0.34 + power * 0.34;
  const returnHeight = bouncePeak * mix(0.55, 1, easeOut(hitTiming));
  let spinRate = mix(4.8, 8.2, power);
  let spinDirection = arcBias >= 0 ? 1 : -1;

  if (shotType === "cross" || shotType === "wide_deep") {
    spinRate *= 1.28;
  }

  if (shotType === "change_line") {
    spinRate *= 1.48;
    spinDirection *= -1;
  }

  if (shotType === "short_push" || shotType === "slow_high_short") {
    spinRate *= 0.56;
    spinDirection *= -1;
  }

  if (shotType === "fast_attack") {
    spinRate *= 1.36;
  }

  const bounceDriveCurve = mix(1.04, 1.78, bounceImpact);
  const bounceLiftCurve = shotType === "short_push" || shotType === "slow_high_short"
    ? mix(1.22, 1.55, bounceImpact)
    : mix(1.5, 2.25, bounceImpact);

  return {
    direction,
    shotType,
    power,
    start,
    target,
    returnPoint,
    control,
    hitTiming,
    strikeHeight,
    peakHeight,
    returnHeight,
    bounceImpact,
    bounceDriveCurve,
    bounceLiftCurve,
    spinRate,
    spinDirection,
    spinPhase: randRange(seed, 0, Math.PI * 2, 46),
    durations,
    total: Object.values(durations).reduce((sum, value) => sum + value, 0)
  };
}

function startNextShot(now, visualAge = 0, playAudio = true) {
  if (world.current) {
    world.trails.push({
      shot: world.current,
      age: 0,
      life: 520
    });
  }

  const beatNumber = (world.beatIndex % world.meter.numerator) + 1;
  world.current = createShot();
  world.current.beatNumber = beatNumber;
  world.current.accent = beatNumber === 1;
  world.current.startTime = now;
  world.current.bounceTime = world.current.durations.strike + world.current.durations.flight;
  world.current.bounceScheduled = false;
  world.elapsed = visualAge;
  emitHitCurves(world.current, sampleShot(world.current, { state: "strike", local: 0 }, 0));
  if (visualAge > 0 && world.hitCurves.length > 0) {
    world.hitCurves[world.hitCurves.length - 1].age = visualAge;
  }
  if (playAudio) {
    playHitSound(world.current, clockMsToToneTime(now));
  }
  if (playAudio && audio.ready && world.useToneClock) {
    playBounceSound(world.current, clockMsToToneTime(now + world.current.bounceTime));
    world.current.bounceScheduled = true;
  }
  setHudPhase("strike");
  setHudShot(world.current.shotType);
  setHudPower(world.current.power.toFixed(2));
  updateRhythmLabels(beatNumber);
  world.beatIndex += 1;
}

function triggerBounce(shot, visualAge = 0) {
  if (shot.didPing) {
    return;
  }

  shot.didPing = true;
  if (!shot.bounceScheduled) {
    playBounceSound(shot);
  }
  world.pings.push({
    x: shot.target.x,
    y: shot.target.y,
    accent: shot.accent,
    age: visualAge,
    life: 280
  });
}

function currentPhase(shot, elapsed) {
  let cursor = 0;
  for (const state of stateOrder) {
    const duration = shot.durations[state];
    if (elapsed <= cursor + duration) {
      return {
        state,
        local: clamp((elapsed - cursor) / duration, 0, 1)
      };
    }
    cursor += duration;
  }
  return { state: "return_strike", local: 1 };
}

function sampleShot(shot, phase, elapsed) {
  const start = point(shot.start.x, shot.start.y);
  const target = point(shot.target.x, shot.target.y);
  const returnPoint = point(shot.returnPoint.x, shot.returnPoint.y);
  const control = point(shot.control.x, shot.control.y);
  let projection = start;
  let height = shot.strikeHeight;

  if (phase.state === "strike") {
    const t = phase.local;
    projection = curvePoint(start, control, target, t * 0.045);
    height = shot.strikeHeight + easeOut(t) * 0.1;
  } else if (phase.state === "flight") {
    const t = travelProgress(phase.local, shot);
    projection = curvePoint(start, control, target, mix(0.045, 1, t));
    height = Math.max(0, (1 - t) * shot.strikeHeight + Math.sin(t * Math.PI) * shot.peakHeight);
  } else if (phase.state === "bounce_contact") {
    projection = target;
    height = 0;
  } else if (phase.state === "bounce_rise") {
    const t = bounceProgress(phase.local, shot);
    projection = {
      x: mix(target.x, returnPoint.x, t),
      y: mix(target.y, returnPoint.y, t)
    };
    height = shot.returnHeight * bounceHeightProgress(phase.local, shot);
  } else {
    projection = {
      x: returnPoint.x,
      y: returnPoint.y
    };
    height = shot.returnHeight;
  }

  const offsetScale = 28 + shot.power * 10;
  const offset = {
    x: -shot.direction * offsetScale * 0.32 * height,
    y: -offsetScale * height
  };

  return {
    projection,
    ball: {
      x: projection.x + offset.x,
      y: projection.y + offset.y
    },
    height,
    spinAngle: shot.spinPhase + shot.spinDirection * shot.spinRate * (elapsed / 1000)
  };
}

function sampleServePrep(prep, elapsed) {
  const total = Math.max(getBeatMs(), world.countInEnd || getBeatMs());
  const t = clamp(elapsed / total, 0, 1);
  const height = 0.08 + Math.sin(t * Math.PI) * 1.72;
  const contactEase = Math.pow(t, 2.65);
  const drift = Math.sin(t * Math.PI) * 0.014;
  const projection = point(
    mix(prep.tossStart.x, prep.contact.x, contactEase) + drift * prep.direction,
    mix(prep.tossStart.y, prep.contact.y, contactEase)
  );
  const offsetScale = 58;
  const offset = {
    x: -prep.direction * offsetScale * 0.18 * height,
    y: -offsetScale * height
  };

  return {
    projection,
    ball: {
      x: projection.x + offset.x,
      y: projection.y + offset.y
    },
    height,
    spinAngle: prep.spinPhase + prep.direction * 3.6 * (elapsed / 1000)
  };
}

function drawTable() {
  const table = world.table;

  ctx.save();
  ctx.fillStyle = "#ffffff";
  ctx.fillRect(0, 0, world.width, world.height);

  ctx.fillStyle = "rgba(0, 0, 0, 0.1)";
  ctx.beginPath();
  ctx.roundRect(table.x + 10, table.y + 14, table.w - 20, table.h + 8, 6);
  ctx.fill();

  ctx.fillStyle = "#4A71CB";
  ctx.fillRect(table.x, table.y, table.w, table.h);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 9.3;
  ctx.strokeRect(table.x + 4.65, table.y + 4.65, table.w - 9.3, table.h - 9.3);

  ctx.strokeStyle = "rgba(255, 255, 255, 0.88)";
  ctx.lineWidth = 2.1;
  ctx.beginPath();
  ctx.moveTo(table.x, table.y + table.h / 2);
  ctx.lineTo(table.x + table.w, table.y + table.h / 2);
  ctx.stroke();

  ctx.fillStyle = "rgba(0, 0, 0, 0.18)";
  ctx.fillRect(table.x + table.w / 2 - 4.5, table.y - 8, 9, table.h + 16);

  ctx.strokeStyle = "rgba(0, 0, 0, 0.35)";
  ctx.lineWidth = 1.9;
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2 - 2.8, table.y - 8);
  ctx.lineTo(table.x + table.w / 2 - 2.8, table.y + table.h + 8);
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2 + 2.8, table.y - 8);
  ctx.lineTo(table.x + table.w / 2 + 2.8, table.y + table.h + 8);
  ctx.stroke();
  ctx.restore();
}

function isPointOnTable(p) {
  const table = world.table;
  return p.x >= table.x && p.x <= table.x + table.w && p.y >= table.y && p.y <= table.y + table.h;
}

function drawTrajectory(shot, alpha, progress = 1) {
  const start = point(shot.start.x, shot.start.y);
  const target = point(shot.target.x, shot.target.y);
  const control = point(shot.control.x, shot.control.y);
  const mainProgress = clamp(progress, 0, 1);
  const samples = Math.max(5, Math.floor(40 * mainProgress));
  const lineAlpha = shot.power > 0.82 ? 0.58 : 0.44;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = mix(0.8, 2.35, shot.power);
  for (let pass = 0; pass < samples; pass += 1) {
    const startT = pass / samples;
    const endT = (pass + 1) / samples;
    const tailAlpha = mix(0.18, 1, startT * startT);
    const headAlpha = mix(0.18, 1, endT * endT);
    const passAlpha = alpha * lineAlpha * tailAlpha * (1 - headAlpha * 0.72);

    ctx.strokeStyle = `rgba(12, 16, 15, ${passAlpha})`;
    ctx.beginPath();
    for (let i = pass; i <= samples; i += 1) {
      const t = (i / samples) * mainProgress;
      const p = curvePoint(start, control, target, t);
      if (i === pass) {
        ctx.moveTo(p.x, p.y);
      } else {
        ctx.lineTo(p.x, p.y);
      }
    }
    ctx.stroke();
  }
  ctx.restore();
}

function drawPing(ping) {
  const p = point(ping.x, ping.y);
  const t = ping.age / ping.life;
  const accentScale = ping.accent ? 1.28 : 1;
  ctx.save();
  ctx.globalAlpha = (1 - t) * 0.76;
  ctx.strokeStyle = "rgba(12, 16, 15, 0.5)";
  ctx.lineWidth = ping.accent ? 1.8 : 1.3;
  ctx.beginPath();
  ctx.arc(p.x, p.y, (4 + t * 18) * accentScale, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(12, 16, 15, 0.68)";
  ctx.beginPath();
  ctx.arc(p.x, p.y, 2.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function emitHitCurves(shot, sample) {
  const start = point(shot.start.x, shot.start.y);
  const control = point(shot.control.x, shot.control.y);
  const target = point(shot.target.x, shot.target.y);
  const pathStart = curvePoint(start, control, target, 0.045);
  const pathNear = curvePoint(start, control, target, 0.11);
  const tangent = normalizeVector({
    x: pathNear.x - pathStart.x,
    y: pathNear.y - pathStart.y
  });
  const normal = {
    x: -tangent.y,
    y: tangent.x
  };
  const contact = { ...pathStart };
  const powerShape = Math.pow(shot.power, 1.15);
  const pathEnd = mix(0.1, 0.22, powerShape);
  const sideSpread = mix(2.4, 16, powerShape);
  const sideLengthA = mix(0.62, 0.94, powerShape);
  const sideLengthB = mix(0.58, 0.88, powerShape);
  const sideAlpha = mix(0.26, 0.56, powerShape);

  world.hitCurves.push({
    shot,
    contact,
    pathStart,
    normal,
    powerShape,
    age: 0,
    life: mix(300, 1050, powerShape) * (shot.accent ? 1.18 : 1),
    width: mix(0.65, 2.8, powerShape) * (shot.accent ? 1.28 : 1),
    curves: [
      { offset: -mix(1.6, 4.4, powerShape), spread: -sideSpread, t0: 0.052, t1: pathEnd * sideLengthA, alpha: sideAlpha },
      { offset: mix(1.6, 4.4, powerShape), spread: sideSpread, t0: 0.056, t1: pathEnd * sideLengthB, alpha: sideAlpha * 0.94 }
    ]
  });
}

function drawHitCurves(hit) {
  const t = hit.age / hit.life;
  const push = Math.pow(t, mix(1.18, 0.72, hit.powerShape));
  const drift = mix(3.5, 24, hit.powerShape) * push;
  const open = 1 + Math.pow(t, mix(1.1, 0.7, hit.powerShape)) * mix(0.18, 0.82, hit.powerShape);
  const fadeCurve = Math.pow(1 - t, mix(1.55, 0.62, hit.shot.power));
  const baseAlpha = fadeCurve * mix(0.52, 0.62, hit.shot.power);
  const growProgress = clamp(t / mix(0.46, 0.18, hit.powerShape), 0, 1);
  const origin = hit.contact;

  ctx.save();
  ctx.lineCap = "round";
  ctx.lineJoin = "round";
  ctx.lineWidth = hit.width;

  for (const curve of hit.curves) {
    const points = [];
    const detail = 18;
    for (let i = 0; i <= detail; i += 1) {
      const u = i / detail;
      const pathT = mix(curve.t0, curve.t1, u);
      const p = curvePoint(
        point(hit.shot.start.x, hit.shot.start.y),
        point(hit.shot.control.x, hit.shot.control.y),
        point(hit.shot.target.x, hit.shot.target.y),
        pathT
      );
      const pathDelta = {
        x: p.x - hit.pathStart.x,
        y: p.y - hit.pathStart.y
      };
      const spread = (curve.offset + curve.spread * Math.pow(u, 1.28)) * open;

      points.push({
        x: origin.x + pathDelta.x + hit.normal.x * spread + pathDelta.x * mix(0.04, 0.22, hit.powerShape) * push + hit.normal.x * drift * 0.18,
        y: origin.y + pathDelta.y + hit.normal.y * spread + pathDelta.y * mix(0.04, 0.22, hit.powerShape) * push + hit.normal.y * drift * 0.18
      });
    }

    for (let pass = 0; pass < points.length - 1; pass += 1) {
      const tailWeight = pass / (points.length - 1);
      const headWeight = (pass + 1) / (points.length - 1);
      const grow = clamp((growProgress - headWeight) / 0.18, 0, 1);
      const tailErase = clamp((headWeight - t * mix(0.74, 0.28, hit.shot.power)) / 0.3, 0, 1);
      const tailAlpha = mix(0.24, 1, tailWeight * tailWeight);
      const headAlpha = mix(0.24, 1, headWeight * headWeight);
      const passAlpha = tailAlpha * (1 - headAlpha * 0.66);
      const segmentAlpha = baseAlpha * curve.alpha * passAlpha * tailErase * grow;

      if (segmentAlpha <= 0.01) {
        continue;
      }

      ctx.strokeStyle = `rgba(12, 16, 15, ${segmentAlpha})`;
      ctx.beginPath();
      for (let i = pass; i < points.length; i += 1) {
        if (i === pass) {
          ctx.moveTo(points[i].x, points[i].y);
        } else {
          ctx.lineTo(points[i].x, points[i].y);
        }
      }
      ctx.stroke();
    }
  }

  ctx.restore();
}

function drawBall(sample) {
  const onTable = isPointOnTable(sample.projection);
  const floorSpread = mix(2.15, 3.35, sample.height);
  const ballRadius = getBallRadius();
  const shadowRadius = ballRadius * mix(0.7, 1.65, sample.height);
  ctx.save();
  ctx.fillStyle = onTable
    ? `rgba(12, 16, 15, ${mix(0.26, 0.08, sample.height)})`
    : `rgba(12, 16, 15, ${mix(0.09, 0.022, sample.height)})`;
  ctx.beginPath();
  ctx.ellipse(
    sample.projection.x,
    sample.projection.y,
    shadowRadius * (onTable ? 1.2 : floorSpread),
    shadowRadius * (onTable ? 0.66 : floorSpread * 0.58),
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.strokeStyle = onTable ? "rgba(12, 16, 15, 0.14)" : "rgba(12, 16, 15, 0.06)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sample.projection.x, sample.projection.y);
  ctx.lineTo(sample.ball.x, sample.ball.y);
  ctx.stroke();

  ctx.fillStyle = "#050606";
  ctx.beginPath();
  ctx.arc(sample.ball.x, sample.ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  const highlightDepth = 0.62 + Math.sin(sample.spinAngle * 0.7) * 0.18;
  const highlightX = sample.ball.x + Math.cos(sample.spinAngle) * ballRadius * 0.48;
  const highlightY = sample.ball.y + Math.sin(sample.spinAngle) * ballRadius * 0.34;
  ctx.fillStyle = `rgba(245, 245, 238, ${highlightDepth})`;
  ctx.beginPath();
  ctx.arc(highlightX, highlightY, ballRadius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawServeBall(sample) {
  const ballRadius = getBallRadius();
  const lift = clamp(sample.height / 1.8, 0, 1);
  const shadowRadius = ballRadius * mix(2.05, 3.35, lift);
  const groundShadow = {
    x: sample.projection.x - (sample.ball.x - sample.projection.x) * 0.34,
    y: sample.projection.y - (sample.ball.y - sample.projection.y) * 0.2
  };
  ctx.save();
  ctx.fillStyle = `rgba(12, 16, 15, ${mix(0.055, 0.018, lift)})`;
  ctx.beginPath();
  ctx.ellipse(
    groundShadow.x,
    groundShadow.y,
    shadowRadius * 1.46,
    shadowRadius * 0.56,
    0,
    0,
    Math.PI * 2
  );
  ctx.fill();

  ctx.fillStyle = "#050606";
  ctx.beginPath();
  ctx.arc(sample.ball.x, sample.ball.y, ballRadius, 0, Math.PI * 2);
  ctx.fill();

  const highlightDepth = 0.62 + Math.sin(sample.spinAngle * 0.7) * 0.18;
  const highlightX = sample.ball.x + Math.cos(sample.spinAngle) * ballRadius * 0.48;
  const highlightY = sample.ball.y + Math.sin(sample.spinAngle) * ballRadius * 0.34;
  ctx.fillStyle = `rgba(245, 245, 238, ${highlightDepth})`;
  ctx.beginPath();
  ctx.arc(highlightX, highlightY, ballRadius * 0.22, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function draw(timestamp) {
  const clockMs = getClockMs(timestamp);

  if (!world.isPlaying) {
    drawTable();
    if (world.current) {
      const shot = world.current;
      const phase = currentPhase(shot, world.elapsed);
      world.trails.forEach((trail) => {
        drawTrajectory(trail.shot, (1 - trail.age / trail.life) * 0.38, 1);
      });
      const flightEnd = shot.durations.strike + shot.durations.flight;
      const progress = clamp(world.elapsed / flightEnd, 0.02, 1);
      drawTrajectory(shot, 1, progress);
      world.hitCurves.forEach(drawHitCurves);
      world.pings.forEach(drawPing);
      drawBall(sampleShot(shot, phase, world.elapsed));
    }
    requestAnimationFrame(draw);
    return;
  }

  if (!world.current && clockMs < world.countInEnd) {
    const beatMs = getBeatMs();
    const countBeat = Math.floor(clockMs / beatMs);
    const activeBeat = (countBeat % world.meter.numerator) + 1;
    world.lastTime = clockMs;
    setHudPhase("count-in");
    setHudShot("ready");
    setHudPower("--");
    setHudBeat(activeBeat);
    updateRhythmLabels(activeBeat);
    drawTable();
    if (world.servePrep) {
      drawServeBall(sampleServePrep(world.servePrep, clockMs));
    }
    requestAnimationFrame(draw);
    return;
  }

  if (!world.current) {
    const shotStart = world.countInEnd > 0 ? world.countInEnd : clockMs;
    if (world.servePrep) {
      world.nextStart = { ...world.servePrep.contact };
      world.direction = world.servePrep.direction;
    }
    startNextShot(shotStart, Math.max(0, clockMs - shotStart));
    world.servePrep = null;
    world.lastTime = clockMs;
  }

  const gap = Math.max(0, clockMs - world.lastTime);
  const staleFrame = world.wasHidden || gap > Math.max(1000, getBeatMs() * 1.5);
  if (staleFrame) {
    world.wasHidden = false;
    resyncRallyToClock(clockMs);
  }

  const dt = Math.min(34, Math.max(0, clockMs - world.lastTime));
  world.lastTime = clockMs;

  world.trails.forEach((trail) => {
    trail.age += dt;
  });
  world.trails = world.trails.filter((trail) => trail.age < trail.life);
  world.pings.forEach((ping) => {
    ping.age += dt;
  });
  world.pings = world.pings.filter((ping) => ping.age < ping.life);
  world.hitCurves.forEach((hit) => {
    hit.age += dt;
  });
  world.hitCurves = world.hitCurves.filter((hit) => hit.age < hit.life);

  let shot = world.current;
  while (clockMs - shot.startTime >= shot.total) {
    triggerBounce(shot, Math.max(0, shot.total - shot.bounceTime));
    world.nextStart = { ...shot.returnPoint };
    world.direction *= -1;
    startNextShot(shot.startTime + shot.total, clockMs - (shot.startTime + shot.total));
    shot = world.current;
  }

  world.elapsed = clockMs - shot.startTime;
  const phase = currentPhase(shot, world.elapsed);
  setHudPhase(phase.state);
  if (beatLabel) {
    const isTableBeat = world.elapsed >= shot.bounceTime;
    const tableBeat = shot.beatNumber + getSubdivisionMode().fraction;
    setHudBeat(isTableBeat ? tableBeat.toFixed(2).replace(/0$/, "") : shot.beatNumber);
  }

  if (world.elapsed >= shot.bounceTime) {
    triggerBounce(shot, world.elapsed - shot.bounceTime);
  }

  drawTable();

  world.trails.forEach((trail) => {
    drawTrajectory(trail.shot, (1 - trail.age / trail.life) * 0.38, 1);
  });

  const flightEnd = shot.durations.strike + shot.durations.flight;
  const progress = clamp(world.elapsed / flightEnd, 0.02, 1);
  drawTrajectory(shot, 1, progress);

  world.hitCurves.forEach(drawHitCurves);
  world.pings.forEach(drawPing);
  drawBall(sampleShot(shot, phase, world.elapsed));

  requestAnimationFrame(draw);
}

window.addEventListener("resize", resize);
document.addEventListener("fullscreenchange", resize);
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("pointerdown", () => showRhythmPanel(2600));
window.addEventListener("pointermove", handleRhythmPointerMove);
window.addEventListener("keydown", unlockAudio, { once: true });
window.addEventListener("keydown", handleGlobalKeydown);
document.addEventListener("visibilitychange", handleVisibilityChange);
if (rhythmPanel) {
  rhythmPanel.addEventListener("pointerenter", () => showRhythmPanel(2600));
  rhythmPanel.addEventListener("focusin", () => showRhythmPanel(2600));
  rhythmPanel.addEventListener("input", () => showRhythmPanel(2600));
}
if (bpmInput) {
  bpmInput.addEventListener("change", applyRhythmInputs);
  bpmInput.addEventListener("input", () => {
    const value = Number(bpmInput.value);
    if (Number.isFinite(value)) {
      world.bpm = clamp(Math.round(value), 40, 240);
      configureTransport();
      updateRhythmLabels(world.current?.beatNumber || 1);
    }
  });
}
if (meterSelect) {
  meterSelect.addEventListener("change", applyRhythmInputs);
}
if (subdivisionSelect) {
  subdivisionSelect.addEventListener("change", applyRhythmInputs);
}
if (countInSelect) {
  countInSelect.addEventListener("change", applyRhythmInputs);
}
if (clickVolumeInput) {
  clickVolumeInput.addEventListener("input", applyRhythmInputs);
}
if (playPauseButton) {
  playPauseButton.addEventListener("click", togglePlayback);
}
if (resetButton) {
  resetButton.addEventListener("click", resetPlayback);
}
applyRhythmInputs();
updateTransportButtons();
syncRhythmPanelVisibility();
resize();
requestAnimationFrame(draw);
