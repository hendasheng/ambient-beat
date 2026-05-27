const canvas = document.getElementById("rallyCanvas");
const ctx = canvas.getContext("2d");

const stateLabel = document.getElementById("stateLabel");
const shotLabel = document.getElementById("shotLabel");
const powerLabel = document.getElementById("powerLabel");
const bouncePresetLabel = document.getElementById("bouncePresetLabel");
const bouncePresetGrid = document.getElementById("bouncePresetGrid");
const hitPresetLabel = document.getElementById("hitPresetLabel");
const hitPresetGrid = document.getElementById("hitPresetGrid");

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
  current: null,
  elapsed: 0,
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

let selectedBouncePreset = 6;
let selectedHitPreset = 0;

function initAudio() {
  if (audio.ready || typeof Tone === "undefined") {
    return;
  }

  audio.master = new Tone.Gain(2.4).toDestination();
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
}

function playHitSound(shot) {
  if (!audio.ready || typeof Tone === "undefined" || Tone.context.state !== "running") {
    return;
  }

  const now = Tone.now();
  const power = clamp(shot.power, 0, 1);
  const preset = hitPresets[selectedHitPreset];

  audio.hitFilter.Q.value = preset.filterQ;
  audio.hitFilter.frequency.value = mix(preset.clickFreq[0], preset.clickFreq[1], power);
  audio.hitTone.volume.value = mix(preset.toneVol[0], preset.toneVol[1], power) + 5;
  audio.hitNoise.volume.value = mix(preset.clickVol[0], preset.clickVol[1], power) + 5;
  audio.hitTone.triggerAttackRelease(
    mix(preset.toneFreq[0], preset.toneFreq[1], power),
    mix(preset.toneDur[0], preset.toneDur[1], power),
    now
  );
  audio.hitNoise.triggerAttackRelease(mix(preset.clickDur[0], preset.clickDur[1], power), now);
}

function playBounceSound(shot) {
  if (!audio.ready || typeof Tone === "undefined" || Tone.context.state !== "running") {
    return;
  }

  const now = Tone.now();
  const power = clamp(shot.power, 0, 1);
  const preset = bouncePresets[selectedBouncePreset];
  const travelHeight = clamp((shot.strikeHeight + shot.peakHeight - 0.48) / 0.46, 0, 1);
  const flightSeconds = Math.max(0.24, shot.durations.flight / 1000);
  const verticalImpact = clamp((shot.strikeHeight + shot.peakHeight * 0.72) / flightSeconds / 2.1, 0, 1);
  const depth = clamp((Math.abs(shot.target.x) - 0.12) / 0.36, 0, 1);
  const leavesTable = Math.abs(shot.returnPoint.x) > 0.5 ? 1 : 0;
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
  const impactDb = mix(-3, 8, impact);

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

  bouncePresetLabel.textContent = bouncePresets[selectedBouncePreset].name;
  bouncePresetGrid.querySelectorAll("[data-bounce-preset]").forEach((button) => {
    button.classList.toggle("active", Number(button.dataset.bouncePreset) === selectedBouncePreset);
  });
}

function updateHitPresetUI() {
  if (!hitPresetGrid || !hitPresetLabel) {
    return;
  }

  hitPresetLabel.textContent = hitPresets[selectedHitPreset].name;
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

  const tableW = Math.min(world.width * 0.82, world.height * 1.42, 1040);
  const tableH = Math.min(tableW * 0.56, world.height * 0.66);
  world.table = {
    x: (world.width - tableW) / 2,
    y: (world.height - tableH) / 2,
    w: tableW,
    h: tableH
  };
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
  const base = 860 - power * 260;
  const depth = clamp((Math.abs(target.x) - 0.12) / 0.36, 0, 1);
  const leaveFactor = canLeaveTable ? 1 : 0;
  const bounceImpact = clamp(power * 0.5 + depth * 0.24 + leaveFactor * 0.18 + hitTiming * 0.08, 0, 1);
  const durations = {
    strike: 58,
    flight: base,
    bounce_contact: 42,
    bounce_rise: mix(130, canLeaveTable ? 500 : 340, hitTiming) + (1 - bounceImpact) * 56,
    return_strike: 54
  };
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

function startNextShot(now) {
  if (world.current) {
    world.trails.push({
      shot: world.current,
      age: 0,
      life: 520
    });
  }

  world.current = createShot();
  world.elapsed = 0;
  world.lastTime = now;
  emitHitCurves(world.current, sampleShot(world.current, { state: "strike", local: 0 }, 0));
  playHitSound(world.current);
  stateLabel.textContent = "strike";
  shotLabel.textContent = world.current.shotType;
  powerLabel.textContent = world.current.power.toFixed(2);
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

function drawTable() {
  const table = world.table;
  ctx.fillStyle = "#dfe9d8";
  ctx.strokeStyle = "rgba(15, 16, 16, 0.48)";
  ctx.lineWidth = 1.4;
  ctx.fillRect(table.x, table.y, table.w, table.h);
  ctx.strokeRect(table.x, table.y, table.w, table.h);

  ctx.strokeStyle = "rgba(15, 16, 16, 0.22)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(table.x, table.y + table.h / 2);
  ctx.lineTo(table.x + table.w, table.y + table.h / 2);
  ctx.stroke();

  ctx.strokeStyle = "rgba(15, 16, 16, 0.54)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2, table.y);
  ctx.lineTo(table.x + table.w / 2, table.y + table.h);
  ctx.stroke();

  ctx.strokeStyle = "rgba(15, 16, 16, 0.26)";
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.moveTo(table.x + table.w / 2, table.y - 9);
  ctx.lineTo(table.x + table.w / 2, table.y + table.h + 9);
  ctx.stroke();
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

    ctx.strokeStyle = `rgba(12, 12, 12, ${passAlpha})`;
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
  ctx.save();
  ctx.globalAlpha = (1 - t) * 0.8;
  ctx.strokeStyle = "rgba(15, 16, 16, 0.56)";
  ctx.lineWidth = 1.4;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 4 + t * 18, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "rgba(15, 16, 16, 0.72)";
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
    life: mix(300, 1050, powerShape),
    width: mix(0.65, 2.8, powerShape),
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

      ctx.strokeStyle = `rgba(16, 16, 16, ${segmentAlpha})`;
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
    ? `rgba(15, 16, 16, ${mix(0.34, 0.11, sample.height)})`
    : `rgba(15, 16, 16, ${mix(0.07, 0.018, sample.height)})`;
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

  ctx.strokeStyle = onTable ? "rgba(15, 16, 16, 0.16)" : "rgba(15, 16, 16, 0.05)";
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(sample.projection.x, sample.projection.y);
  ctx.lineTo(sample.ball.x, sample.ball.y);
  ctx.stroke();

  ctx.fillStyle = "#050505";
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
  if (!world.current) {
    startNextShot(timestamp);
  }

  const dt = Math.min(34, timestamp - world.lastTime);
  world.lastTime = timestamp;
  world.elapsed += dt;

  const shot = world.current;
  const phase = currentPhase(shot, world.elapsed);
  stateLabel.textContent = phase.state;

  if (phase.state === "bounce_contact" && !shot.didPing) {
    shot.didPing = true;
    playBounceSound(shot);
    world.pings.push({
      x: shot.target.x,
      y: shot.target.y,
      age: 0,
      life: 280
    });
  }

  if (world.elapsed >= shot.total) {
    world.nextStart = { ...shot.returnPoint };
    world.direction *= -1;
    startNextShot(timestamp);
  }

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

  ctx.clearRect(0, 0, world.width, world.height);
  ctx.fillStyle = "#eef1f0";
  ctx.fillRect(0, 0, world.width, world.height);
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
window.addEventListener("pointerdown", unlockAudio, { once: true });
window.addEventListener("keydown", unlockAudio, { once: true });
resize();
requestAnimationFrame(draw);
