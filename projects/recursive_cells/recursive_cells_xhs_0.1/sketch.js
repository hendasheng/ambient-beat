const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const pointInput = document.getElementById("pointInput");
const pointValue = document.getElementById("pointValue");
const minSizeInput = document.getElementById("minSizeInput");
const minSizeValue = document.getElementById("minSizeValue");
const irregularityInput = document.getElementById("irregularityInput");
const irregularityValue = document.getElementById("irregularityValue");
const motionInput = document.getElementById("motionInput");
const motionValue = document.getElementById("motionValue");
const speedInput = document.getElementById("speedInput");
const speedValue = document.getElementById("speedValue");
const resetButton = document.getElementById("resetButton");
const cameraToggleButton = document.getElementById("cameraToggleButton");
const cameraFacingButton = document.getElementById("cameraFacingButton");
const cameraStatus = document.getElementById("cameraStatus");
const saveImageButton = document.getElementById("saveImageButton");
const postNoteButton = document.getElementById("postNoteButton");
const toast = document.getElementById("toast");
const cellCount = document.getElementById("cellCount");
const fpsReadout = document.getElementById("fpsReadout");
const bpmInput = document.getElementById("bpmInput");
const meterSelect = document.getElementById("meterSelect");
const subdivisionSelect = document.getElementById("subdivisionSelect");
const countInSelect = document.getElementById("countInSelect");
const offbeatInput = document.getElementById("offbeatInput");
const clickVolumeInput = document.getElementById("clickVolumeInput");
const clickVolumeLabel = document.getElementById("clickVolumeLabel");
const playPauseButton = document.getElementById("playPauseButton");
const rhythmResetButton = document.getElementById("rhythmResetButton");
const beatStrip = document.getElementById("beatStrip");
const tempoLabel = document.getElementById("tempoLabel");
const meterLabel = document.getElementById("meterLabel");
const hudPanel = document.querySelector(".hud");
const rhythmPanel = document.querySelector(".rhythm-panel");

let width = 1;
let height = 1;
let dpr = 1;
let seed = 21;
let points = [];
let cells = [];
let lastFrameTime = performance.now();
let fpsSmooth = 60;
let rhythmPanelHideTimer = 0;
let lastRhythmPointerMove = 0;
let rhythmPanelDismissed = false;
let beatEnergy = 0;
let pointTransition = null;
let splitTransition = null;
let cameraStream = null;
let cameraEnabled = false;
let cameraStarting = false;
let cameraFacingMode = "user";
let videoCellKey = null;
let toastTimer = 0;

const cameraVideo = document.createElement("video");
cameraVideo.autoplay = true;
cameraVideo.muted = true;
cameraVideo.playsInline = true;

const settings = {
  points: 240,
  minSize: 34,
  irregularity: 0.62,
  motionBlend: 0.45,
  speed: 0.2,
};

const testsrcPalette = [
  "#ffffff",
  "#ffff00",
  "#00ffff",
  "#00ff00",
  "#ff00ff",
  "#ff0000",
  "#0000ff",
  "#000000",
  "#bfbfbf",
  "#404040",
];
const testsrcBars = ["#ffffff", "#ffff00", "#00ffff", "#00ff00", "#ff00ff", "#ff0000", "#0000ff", "#000000"];
const grayRamp = ["#101010", "#303030", "#606060", "#909090", "#c0c0c0", "#f0f0f0"];

const subdivisionModes = {
  auto: { label: "自动", multiplier: 1 },
  eighth: { label: "1/8", multiplier: 2 },
  triplet: { label: "1/8T", multiplier: 3 },
  sixteenth: { label: "1/16", multiplier: 4 },
};

const metronome = window.AmbientMetronome.createMetronome({
  bpm: Number(bpmInput.value),
  beatsPerBar: parseMeter(meterSelect.value),
  subdivision: subdivisionSelect.value,
  countInBars: Number(countInSelect.value),
  offbeatEnabled: Boolean(offbeatInput?.checked),
  clickVolume: Number(clickVolumeInput.value) / 100,
  onChange: () => updateRhythmReadout(),
  onBeat: (state, accent) => {
    beatEnergy = Math.max(beatEnergy, accent && !state.countingIn ? 1.25 : 1);
    window.AmbientMetronomePanel.pulse(playPauseButton);
  },
});

const rhythm = metronome.state;

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
}

function parseMeter(value) {
  const [numerator] = value.split("/").map((part) => Number(part));
  return clamp(Number.isFinite(numerator) ? numerator : 4, 1, 12);
}

function padBar(value) {
  return String(value).padStart(3, "0");
}

function getSubdivisionMode() {
  return subdivisionModes[rhythm.subdivision] || subdivisionModes.auto;
}

function smoothstep(edge0, edge1, value) {
  const t = clamp((value - edge0) / Math.max(0.00001, edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

function easeOutQuart(value) {
  const t = clamp(value, 0, 1);
  return 1 - Math.pow(1 - t, 4);
}

function fract(value) {
  return value - Math.floor(value);
}

function sr(key, salt) {
  return fract(Math.sin(key * 12.9898 + salt * 78.233 + seed * 0.137) * 43758.5453123);
}

function makeRng(initialSeed) {
  let state = initialSeed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function testsrcColor(cell) {
  const centerX = cell.x + cell.w * 0.5;
  const centerY = cell.y + cell.h * 0.5;
  const band = clamp(Math.floor((centerX / Math.max(1, width)) * testsrcBars.length), 0, testsrcBars.length - 1);

  if (cell.depth <= 2) {
    return testsrcBars[band];
  }

  if (cell.depth <= 5 && sr(cell.key, 311) > 0.84) {
    const rampIndex = clamp(Math.floor((centerY / Math.max(1, height)) * grayRamp.length), 0, grayRamp.length - 1);
    return grayRamp[rampIndex];
  }

  const depthShift = Math.floor(sr(cell.key, 83) * testsrcPalette.length);
  const countShift = cell.count > 0 ? cell.count % testsrcPalette.length : 0;
  const index = (band + cell.depth * 2 + depthShift + countShift) % testsrcPalette.length;

  return testsrcPalette[index];
}

function hexToRgb(hex) {
  const value = hex.replace("#", "");
  return {
    r: parseInt(value.slice(0, 2), 16),
    g: parseInt(value.slice(2, 4), 16),
    b: parseInt(value.slice(4, 6), 16),
  };
}

function colorLuma(hex) {
  const { r, g, b } = hexToRgb(hex);
  return (r * 0.299 + g * 0.587 + b * 0.114) / 255;
}

function textColorForFill(color) {
  return colorLuma(color) > 0.56 ? "rgba(0, 0, 0, 0.78)" : "rgba(255, 255, 255, 0.86)";
}

function safeSplit(baseSplit, localOffset, dmin, dmax, minSize, motionBlend) {
  const dsize = dmax - dmin;
  if (dsize <= 0.00001) {
    return (dmin + dmax) * 0.5;
  }

  const maxOffset = dsize * 0.35;
  const offset = clamp(localOffset * motionBlend, -maxOffset, maxOffset);
  const split = baseSplit + offset;
  const margin = Math.min(minSize, dsize * 0.45);

  if (dsize <= margin * 2 + 0.00001) {
    return (dmin + dmax) * 0.5;
  }

  return clamp(split, dmin + margin, dmax - margin);
}

function fit(value, inMin, inMax, outMin, outMax) {
  const t = (value - inMin) / Math.max(0.00001, inMax - inMin);
  return lerp(outMin, outMax, t);
}

function updateSettingsFromInputs() {
  settings.points = Number(pointInput.value);
  settings.minSize = Number(minSizeInput.value);
  settings.irregularity = Number(irregularityInput.value) / 100;
  settings.motionBlend = Number(motionInput.value) / 100;
  settings.speed = Number(speedInput.value) / 100;

  pointValue.value = String(settings.points);
  minSizeValue.value = String(settings.minSize);
  irregularityValue.value = settings.irregularity.toFixed(2);
  motionValue.value = settings.motionBlend.toFixed(2);
  speedValue.value = settings.speed.toFixed(2);
}

function setCameraStatus(value) {
  if (cameraStatus) {
    cameraStatus.textContent = value;
  }
}

function updateCameraControls() {
  if (cameraToggleButton) {
    cameraToggleButton.textContent = cameraStarting ? "启动中" : cameraEnabled ? "关闭摄像头" : "开启摄像头";
    cameraToggleButton.classList.toggle("camera-active", cameraEnabled);
    cameraToggleButton.disabled = cameraStarting;
  }
  if (cameraFacingButton) {
    cameraFacingButton.textContent = cameraFacingMode === "user" ? "切到后置" : "切到前置";
    cameraFacingButton.disabled = cameraStarting;
  }
}

function stopCamera() {
  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }
  cameraStream = null;
  cameraEnabled = false;
  cameraVideo.srcObject = null;
  videoCellKey = null;
  setCameraStatus("摄像头已关闭");
  updateCameraControls();
}

async function startCamera() {
  if (!navigator.mediaDevices?.getUserMedia) {
    setCameraStatus("当前环境不支持摄像头");
    return;
  }

  cameraStarting = true;
  updateCameraControls();

  if (cameraStream) {
    cameraStream.getTracks().forEach((track) => track.stop());
  }

  setCameraStatus("摄像头启动中");

  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: { ideal: cameraFacingMode } },
      audio: false,
    });
    cameraVideo.srcObject = cameraStream;
    await cameraVideo.play();
    cameraEnabled = true;

    const track = cameraStream.getVideoTracks()[0];
    const activeFacingMode = track?.getSettings?.().facingMode;
    const facingLabel = activeFacingMode === "environment" || (!activeFacingMode && cameraFacingMode === "environment") ? "后置" : "前置";
    setCameraStatus(track?.label ? `${facingLabel} · ${track.label}` : `${facingLabel}摄像头运行中`);
  } catch (error) {
    stopCamera();
    setCameraStatus(error?.name === "NotAllowedError" ? "未获得摄像头权限" : "摄像头启动失败");
  }

  cameraStarting = false;
  updateCameraControls();
}

function resize() {
  width = window.innerWidth;
  height = window.innerHeight;
  dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * dpr);
  canvas.height = Math.floor(height * dpr);
  canvas.style.width = `${width}px`;
  canvas.style.height = `${height}px`;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  window.requestAnimationFrame(syncMobilePanelSpacing);
}

function syncMobilePanelSpacing() {
  if (!rhythmPanel) {
    return;
  }

  document.documentElement.style.setProperty(
    "--mobile-rhythm-panel-height",
    `${Math.ceil(rhythmPanel.getBoundingClientRect().height)}px`,
  );
}

function resetPoints() {
  const rng = makeRng(seed);
  points = [];

  for (let i = 0; i < settings.points; i += 1) {
    const edgeBias = Math.pow(rng(), 1.35);
    const cluster = rng();
    const cx = cluster < 0.5 ? 0.32 : 0.68;
    const cz = cluster < 0.5 ? 0.42 : 0.58;
    const mix = rng() < 0.48 ? 0 : 1;
    const x = mix ? rng() : clamp(cx + (rng() - 0.5) * edgeBias, 0.02, 0.98);
    const z = mix ? rng() : clamp(cz + (rng() - 0.5) * edgeBias, 0.02, 0.98);

    points.push({
      restX: x,
      restZ: z,
      phaseX: rng() * Math.PI * 2,
      phaseZ: rng() * Math.PI * 2,
      freqX: lerp(0.55, 1.65, rng()),
      freqZ: lerp(0.45, 1.35, rng()),
      amp: lerp(0.012, 0.05, rng()),
      curX: x,
      curZ: z,
    });
  }
}

function getBounds() {
  return {
    minX: 0,
    maxX: width,
    minZ: 0,
    maxZ: height,
  };
}

function motionPhase(time, now) {
  const speed = lerp(0.22, 1.18, settings.speed) * getSubdivisionMode().multiplier;

  if (!rhythm.running) {
    return time * speed;
  }

  const beatProgress = metronome.beatProgress(now);
  const beatClock = rhythm.countingIn
    ? rhythm.beatIndex + beatProgress
    : (rhythm.bar - 1) * rhythm.beatsPerBar + rhythm.beatIndex + beatProgress;

  return beatClock * speed;
}

function musicalBeat(now) {
  const beatProgress = metronome.beatProgress(now);

  if (rhythm.countingIn) {
    return rhythm.beatIndex + beatProgress;
  }

  return (rhythm.bar - 1) * rhythm.beatsPerBar + rhythm.beatIndex + beatProgress;
}

function splitMorphClock(now) {
  if (!rhythm.running) {
    return now / 1000 / 4;
  }

  return musicalBeat(now);
}

function beginPointTransition(now) {
  pointTransition = {
    startAt: now,
    duration: 260,
    points: points.map((point) => ({ curX: point.curX, curZ: point.curZ })),
  };
}

function beginSplitTransition(now) {
  splitTransition = {
    startAt: now,
    duration: 260,
    clock: splitMorphClock(now),
  };
}

function splitMorphTarget(key, axisSalt, step) {
  const coarse = Math.floor(step / Math.max(1, rhythm.beatsPerBar));
  const beatWeight = sr(key * 2.3 + step * 13, axisSalt) * 2 - 1;
  const barWeight = sr(key * 1.7 + coarse * 31, axisSalt + 47) * 2 - 1;

  return beatWeight * 0.58 + barWeight * 0.42;
}

function splitMorphOffsetAtClock(key, axis, span, usable, clock, previewDamping) {
  const step = Math.floor(clock);
  const stepT = easeOutQuart(clock - step);
  const axisSalt = axis === "x" ? 503 : 709;
  const from = splitMorphTarget(key, axisSalt, step);
  const to = splitMorphTarget(key, axisSalt, step + 1);
  const depthDamping = lerp(1, 0.46, clamp(Math.log2(Math.max(2, key)) / 12, 0, 1));
  const maxShift = Math.min(span * 0.24, usable * 0.42);

  return lerp(from, to, stepT) * maxShift * depthDamping * previewDamping;
}

function splitMorphOffset(key, axis, span, usable, now) {
  const previewDamping = rhythm.running ? 1 : 0.35;
  const target = splitMorphOffsetAtClock(key, axis, span, usable, splitMorphClock(now), previewDamping);

  if (!splitTransition) {
    return target;
  }

  const t = easeOutQuart((now - splitTransition.startAt) / splitTransition.duration);
  const from = splitMorphOffsetAtClock(key, axis, span, usable, splitTransition.clock, previewDamping);

  return lerp(from, target, t);
}

function beatClock(now) {
  const beatProgress = metronome.beatProgress(now);
  const baseBeat = rhythm.countingIn
    ? rhythm.beatIndex
    : (rhythm.bar - 1) * rhythm.beatsPerBar + rhythm.beatIndex;

  return (baseBeat + beatProgress) * getSubdivisionMode().multiplier;
}

function beatPose(point, index, beat, axis) {
  const beatKey = Math.floor(beat);
  const axisSalt = axis === "x" ? 131 : 257;
  const primary = sr(point.restX * 997 + index * 31 + beatKey * 17, axisSalt);
  const secondary = sr(point.restZ * 811 + index * 43 + beatKey * 29, axisSalt + 19);
  const direction = primary * 2 - 1;
  const contour = Math.sin((secondary + point.restX * 0.7 + point.restZ * 0.9) * Math.PI * 2);

  return direction * 0.72 + contour * 0.28;
}

function updatePoints(time, now) {
  const bounds = getBounds();
  const scale = Math.min(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);
  const pulseAmp = rhythm.running ? 1 + beatEnergy * (rhythm.beatIndex === 0 ? 1.45 : 0.95) : 1;
  const phase = motionPhase(time, now) * Math.PI * 2;
  const clock = beatClock(now);
  const beatA = Math.floor(clock);
  const beatT = easeOutQuart(clock - beatA);

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const amp = point.amp * scale * pulseAmp;
    let targetX = point.restX;
    let targetZ = point.restZ;

    if (rhythm.running) {
      const poseAX = beatPose(point, i, beatA, "x");
      const poseBX = beatPose(point, i, beatA + 1, "x");
      const poseAZ = beatPose(point, i, beatA, "z");
      const poseBZ = beatPose(point, i, beatA + 1, "z");
      const driftX = lerp(poseAX, poseBX, beatT);
      const driftZ = lerp(poseAZ, poseBZ, beatT);

      targetX = point.restX + driftX * amp / Math.max(1, bounds.maxX - bounds.minX);
      targetZ = point.restZ + driftZ * amp / Math.max(1, bounds.maxZ - bounds.minZ);
    } else {
      targetX = point.restX + Math.sin(phase * point.freqX + point.phaseX + i * 1.37) * amp / Math.max(1, bounds.maxX - bounds.minX);
      targetZ = point.restZ + Math.cos(phase * point.freqZ + point.phaseZ + i * 2.11) * amp / Math.max(1, bounds.maxZ - bounds.minZ);
    }

    if (pointTransition && pointTransition.points[i]) {
      const t = easeOutQuart((now - pointTransition.startAt) / pointTransition.duration);
      point.curX = lerp(pointTransition.points[i].curX, targetX, t);
      point.curZ = lerp(pointTransition.points[i].curZ, targetZ, t);
    } else {
      point.curX = targetX;
      point.curZ = targetZ;
    }
  }

  if (pointTransition && now - pointTransition.startAt >= pointTransition.duration) {
    pointTransition = null;
  }
  if (splitTransition && now - splitTransition.startAt >= splitTransition.duration) {
    splitTransition = null;
  }
}

function buildCells(now) {
  const bounds = getBounds();
  const rootMinX = bounds.minX;
  const rootMaxX = bounds.maxX;
  const rootMinZ = bounds.minZ;
  const rootMaxZ = bounds.maxZ;
  const minSize = settings.minSize;
  const srcCount = points.length;
  const maxDepth = Math.ceil(Math.log(Math.max(2, srcCount)) / Math.log(2)) + 3;
  const density01 = clamp(srcCount / 500, 0, 1);
  const splitChance = lerp(0.94, 1.0, density01);
  const depthFalloff = lerp(0.035, 0.015, density01);
  const aspectLock = 0.35;
  const stack = [{
    rminx: rootMinX,
    rmaxx: rootMaxX,
    rminz: rootMinZ,
    rmaxz: rootMaxZ,
    dminx: rootMinX,
    dmaxx: rootMaxX,
    dminz: rootMinZ,
    dmaxz: rootMaxZ,
    depth: 0,
    key: 1,
  }];

  cells = [];

  while (stack.length > 0) {
    const cell = stack.pop();
    let { dminx, dmaxx, dminz, dmaxz } = cell;

    if (dminx > dmaxx) [dminx, dmaxx] = [dmaxx, dminx];
    if (dminz > dmaxz) [dminz, dmaxz] = [dmaxz, dminz];

    const rsizex = cell.rmaxx - cell.rminx;
    const rsizez = cell.rmaxz - cell.rminz;
    const dsizex = dmaxx - dminx;
    const dsizez = dmaxz - dminz;
    let count = 0;

    for (let i = 0; i < points.length; i += 1) {
      const px = rootMinX + points[i].restX * (rootMaxX - rootMinX);
      const pz = rootMinZ + points[i].restZ * (rootMaxZ - rootMinZ);

      if (px >= cell.rminx && px < cell.rmaxx && pz >= cell.rminz && pz < cell.rmaxz) {
        count += 1;
      }
    }

    let shouldSplit = true;
    if (cell.depth >= maxDepth) shouldSplit = false;
    if (count <= 0) shouldSplit = false;
    if (rsizex <= minSize * 2 || rsizez <= minSize * 2) shouldSplit = false;
    if (dsizex <= 0.0001 || dsizez <= 0.0001) shouldSplit = false;

    const depthChance = clamp(splitChance - cell.depth * depthFalloff, 0, 1);
    if (cell.depth > 0 && sr(cell.key, 91) > depthChance) {
      shouldSplit = false;
    }

    if (!shouldSplit) {
      if (dsizex > 0.0001 && dsizez > 0.0001) {
        cells.push({ x: dminx, y: dminz, w: dsizex, h: dsizez, depth: cell.depth, count, key: cell.key });
      }
      continue;
    }

    let splitX = true;
    if (rsizex > rsizez * (1 + aspectLock)) {
      splitX = true;
    } else if (rsizez > rsizex * (1 + aspectLock)) {
      splitX = false;
    } else {
      splitX = sr(cell.key, 17) > 0.5;
    }

    if (splitX) {
      const rmid = (cell.rminx + cell.rmaxx) * 0.5;
      const usable = Math.max(0, rsizex - minSize * 2);
      const jitter = (sr(cell.key, 23) - 0.5) * usable * settings.irregularity;
      const rsplit = clamp(rmid + jitter, cell.rminx + minSize, cell.rmaxx - minSize);
      const baseDsplit = fit(rsplit, cell.rminx, cell.rmaxx, dminx, dmaxx) +
        splitMorphOffset(cell.key, "x", dsizex, usable, now);
      let localOffset = 0;
      let bestDist = Infinity;

      for (let i = 0; i < points.length; i += 1) {
        const restX = rootMinX + points[i].restX * (rootMaxX - rootMinX);
        const restZ = rootMinZ + points[i].restZ * (rootMaxZ - rootMinZ);

        if (restX >= cell.rminx && restX < cell.rmaxx && restZ >= cell.rminz && restZ < cell.rmaxz) {
          const dist = Math.abs(restX - rsplit);
          if (dist < bestDist) {
            const curX = rootMinX + points[i].curX * (rootMaxX - rootMinX);
            bestDist = dist;
            localOffset = curX - restX;
          }
        }
      }

      const dsplit = safeSplit(baseDsplit, localOffset, dminx, dmaxx, minSize, settings.motionBlend);
      stack.push({
        rminx: rsplit, rmaxx: cell.rmaxx, rminz: cell.rminz, rmaxz: cell.rmaxz,
        dminx: dsplit, dmaxx, dminz, dmaxz, depth: cell.depth + 1, key: cell.key * 2 + 2,
      });
      stack.push({
        rminx: cell.rminx, rmaxx: rsplit, rminz: cell.rminz, rmaxz: cell.rmaxz,
        dminx, dmaxx: dsplit, dminz, dmaxz, depth: cell.depth + 1, key: cell.key * 2 + 1,
      });
    } else {
      const rmid = (cell.rminz + cell.rmaxz) * 0.5;
      const usable = Math.max(0, rsizez - minSize * 2);
      const jitter = (sr(cell.key, 37) - 0.5) * usable * settings.irregularity;
      const rsplit = clamp(rmid + jitter, cell.rminz + minSize, cell.rmaxz - minSize);
      const baseDsplit = fit(rsplit, cell.rminz, cell.rmaxz, dminz, dmaxz) +
        splitMorphOffset(cell.key, "z", dsizez, usable, now);
      let localOffset = 0;
      let bestDist = Infinity;

      for (let i = 0; i < points.length; i += 1) {
        const restX = rootMinX + points[i].restX * (rootMaxX - rootMinX);
        const restZ = rootMinZ + points[i].restZ * (rootMaxZ - rootMinZ);

        if (restX >= cell.rminx && restX < cell.rmaxx && restZ >= cell.rminz && restZ < cell.rmaxz) {
          const dist = Math.abs(restZ - rsplit);
          if (dist < bestDist) {
            const curZ = rootMinZ + points[i].curZ * (rootMaxZ - rootMinZ);
            bestDist = dist;
            localOffset = curZ - restZ;
          }
        }
      }

      const dsplit = safeSplit(baseDsplit, localOffset, dminz, dmaxz, minSize, settings.motionBlend);
      stack.push({
        rminx: cell.rminx, rmaxx: cell.rmaxx, rminz: rsplit, rmaxz: cell.rmaxz,
        dminx, dmaxx, dminz: dsplit, dmaxz, depth: cell.depth + 1, key: cell.key * 2 + 2,
      });
      stack.push({
        rminx: cell.rminx, rmaxx: cell.rmaxx, rminz: cell.rminz, rmaxz: rsplit,
        dminx, dmaxx, dminz, dmaxz: dsplit, depth: cell.depth + 1, key: cell.key * 2 + 1,
      });
    }
  }
}

function drawBackground() {
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);
}

function beatProgressText(now) {
  return metronome.beatProgress(now).toFixed(3);
}

function rhythmCellLines(cell, now) {
  const beat = rhythm.beatIndex + 1;
  const barText = padBar(rhythm.bar);
  const mode = getSubdivisionMode().label.toUpperCase();
  const elapsedSeconds = rhythm.running ? Math.max(0, (now - rhythm.startAt) / 1000) : 0;
  const totalFrames = Math.floor(elapsedSeconds * Math.max(1, Math.round(fpsSmooth)));
  const tcMinutes = Math.floor(totalFrames / (60 * 60));
  const tcSeconds = Math.floor(totalFrames / 60) % 60;
  const tcFrames = totalFrames % 60;
  const slots = [
    ["BPM", String(rhythm.bpm)],
    ["BEAT", `${beat}/${rhythm.beatsPerBar}`],
    ["BAR", barText],
    ["PH", beatProgressText(now)],
    ["MODE", mode],
    ["TC", `${String(tcMinutes).padStart(2, "0")}:${String(tcSeconds).padStart(2, "0")}:${String(tcFrames).padStart(2, "0")}`],
    ["FPS", String(Math.round(fpsSmooth))],
    ["SIG", rhythm.running ? "LOCK" : "FREE"],
    ["CELLS", String(cells.length)],
    ["DEPTH", String(cell.depth).padStart(2, "0")],
    ["PTS", String(cell.count).padStart(2, "0")],
  ];
  const slot = slots[Math.floor(sr(cell.key, 181) * slots.length) % slots.length];

  if (!rhythm.running && slot[0] === "PH") {
    return ["FREE", settings.speed.toFixed(2)];
  }

  if (rhythm.countingIn && slot[0] === "BAR") {
    return ["PRE", String(rhythm.countInBeatsRemaining).padStart(2, "0")];
  }

  return slot;
}

function cellTextFont(size, text) {
  const hasChinese = /[\u3400-\u9fff]/.test(text);
  const family = hasChinese
    ? '"PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif'
    : 'Consolas, "SFMono-Regular", monospace';
  return `800 ${size}px ${family}`;
}

function fitTextSize(text, maxWidth, maxHeight, maxSize) {
  const referenceSize = 100;
  ctx.font = cellTextFont(referenceSize, text);
  const referenceWidth = Math.max(1, ctx.measureText(text).width);
  const widthSize = maxWidth / referenceWidth * referenceSize;
  const heightSize = maxHeight;
  const size = Math.min(maxSize, widthSize, heightSize);

  return size >= 8 ? size : 0;
}

function shouldDrawCellText(cell) {
  const area = cell.w * cell.h;
  const viewportArea = Math.max(1, width * height);
  const largeEnough = area / viewportArea > 0.006 || Math.min(cell.w, cell.h) > 58;

  return largeEnough && sr(cell.key, 233) > 0.54;
}

function cellTextAlpha(cell) {
  const minSide = Math.min(cell.w, cell.h);
  const areaRatio = (cell.w * cell.h) / Math.max(1, width * height);
  const sideAlpha = smoothstep(30, 86, minSide);
  const areaAlpha = smoothstep(0.004, 0.018, areaRatio);

  return clamp(Math.max(sideAlpha, areaAlpha), 0, 1);
}

function drawCellText(cell, now, labelCounts) {
  const minSide = Math.min(cell.w, cell.h);
  if (cell.w < 54 || cell.h < 24 || minSide < 20 || !shouldDrawCellText(cell)) {
    return;
  }

  const alpha = cellTextAlpha(cell);
  if (alpha <= 0.02) {
    return;
  }

  const color = testsrcColor(cell);
  const pad = clamp(minSide * 0.12, 6, 22);
  const lines = rhythmCellLines(cell, now);
  const label = lines[0];
  const text = `${lines[0]} ${lines[1]}`;

  if ((labelCounts[label] || 0) >= 3) {
    return;
  }

  const maxSize = Math.min(minSide * 0.34, cell.w * 0.19, 48);
  const size = fitTextSize(text, Math.max(0, cell.w - pad * 2), Math.max(0, cell.h - pad * 2), maxSize);

  if (size <= 0) {
    return;
  }

  labelCounts[label] = (labelCounts[label] || 0) + 1;

  ctx.save();
  ctx.fillStyle = textColorForFill(color);
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.font = cellTextFont(size, text);
  ctx.globalAlpha = 0.88 * alpha;

  const x = cell.x + cell.w * 0.5;
  const y = cell.y + cell.h * 0.5;
  ctx.fillText(text, x, y);
  ctx.restore();
}

function shouldDrawCalibrationMark(cell) {
  const minSide = Math.min(cell.w, cell.h);
  const areaRatio = (cell.w * cell.h) / Math.max(1, width * height);

  return minSide > 70 && areaRatio > 0.008 && sr(cell.key, 419) > 0.78;
}

function drawCalibrationMark(cell) {
  if (!shouldDrawCalibrationMark(cell)) {
    return;
  }

  const color = testsrcColor(cell);
  const ink = textColorForFill(color);
  const size = clamp(Math.min(cell.w, cell.h) * 0.18, 10, 30);
  const inset = clamp(Math.min(cell.w, cell.h) * 0.12, 8, 24);
  const cx = cell.x + cell.w - inset - size * 0.5;
  const cy = cell.y + inset + size * 0.5;

  ctx.save();
  ctx.strokeStyle = ink;
  ctx.globalAlpha = 0.68;
  ctx.lineWidth = clamp(size * 0.09, 1, 2);
  ctx.beginPath();
  ctx.moveTo(cx - size * 0.5, cy);
  ctx.lineTo(cx + size * 0.5, cy);
  ctx.moveTo(cx, cy - size * 0.5);
  ctx.lineTo(cx, cy + size * 0.5);
  ctx.stroke();

  if (sr(cell.key, 421) > 0.55) {
    const tick = size * 0.52;
    const x = cell.x + inset;
    const y = cell.y + cell.h - inset;
    ctx.beginPath();
    ctx.moveTo(x, y - tick);
    ctx.lineTo(x, y);
    ctx.lineTo(x + tick, y);
    ctx.stroke();
  }
  ctx.restore();
}

function largestCell() {
  let largest = null;
  let largestArea = 0;

  for (let i = 0; i < cells.length; i += 1) {
    const area = cells[i].w * cells[i].h;
    if (area > largestArea) {
      largest = cells[i];
      largestArea = area;
    }
  }

  return largest;
}

function videoCellTooSmall(cell) {
  const minSide = Math.min(cell.w, cell.h);
  const areaRatio = (cell.w * cell.h) / Math.max(1, width * height);

  return minSide < 96 || areaRatio < 0.035;
}

function selectedVideoCell() {
  if (!cameraEnabled || cameraVideo.readyState < 2) {
    videoCellKey = null;
    return null;
  }

  const current = videoCellKey === null ? null : cells.find((cell) => cell.key === videoCellKey);
  if (current && !videoCellTooSmall(current)) {
    return current;
  }

  const next = largestCell();
  videoCellKey = next ? next.key : null;
  return next;
}

function drawVideoCover(cell) {
  if (!cell || cameraVideo.videoWidth <= 0 || cameraVideo.videoHeight <= 0) {
    return;
  }

  const sourceW = cameraVideo.videoWidth;
  const sourceH = cameraVideo.videoHeight;
  const sourceAspect = sourceW / sourceH;
  const targetAspect = cell.w / Math.max(1, cell.h);
  let sx = 0;
  let sy = 0;
  let sw = sourceW;
  let sh = sourceH;

  if (sourceAspect > targetAspect) {
    sw = sourceH * targetAspect;
    sx = (sourceW - sw) * 0.5;
  } else {
    sh = sourceW / targetAspect;
    sy = (sourceH - sh) * 0.5;
  }

  ctx.save();
  ctx.beginPath();
  ctx.rect(cell.x, cell.y, cell.w, cell.h);
  ctx.clip();
  ctx.drawImage(cameraVideo, sx, sy, sw, sh, cell.x, cell.y, cell.w, cell.h);
  ctx.restore();
}

function drawCells(time, now) {
  const videoCell = selectedVideoCell();

  ctx.save();
  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const color = testsrcColor(cell);

    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.fillRect(cell.x - 0.5, cell.y - 0.5, Math.max(0, cell.w + 1), Math.max(0, cell.h + 1));
  }
  ctx.restore();

  drawVideoCover(videoCell);

  const labelCounts = {};
  for (let i = 0; i < cells.length; i += 1) {
    if (videoCell && cells[i].key === videoCell.key) {
      continue;
    }
    drawCellText(cells[i], now, labelCounts);
    drawCalibrationMark(cells[i]);
  }
}

function render(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  fpsSmooth = lerp(fpsSmooth, 1 / Math.max(delta, 0.0001), 0.06);
  metronome.update(now);
  beatEnergy = lerp(beatEnergy, metronome.pulse(now), 0.34);

  const time = now / 1000;
  updatePoints(time, now);
  buildCells(now);
  drawBackground();
  drawCells(time, now);

  cellCount.textContent = `${cells.length} 个单元`;
  fpsReadout.textContent = `${Math.round(fpsSmooth)} FPS`;

  requestAnimationFrame(render);
}

function rebuildPointSet() {
  updateSettingsFromInputs();
  resetPoints();
}

function clickVolume() {
  return clamp(Number(clickVolumeInput.value) / 100, 0, 1);
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function renderBeatStrip(activeBeat = 1) {
  if (!beatStrip) {
    return;
  }

  beatStrip.style.setProperty("--beats", rhythm.beatsPerBar);
  if (beatStrip.dataset.beats !== String(rhythm.beatsPerBar)) {
    beatStrip.replaceChildren();
    for (let i = 1; i <= rhythm.beatsPerBar; i += 1) {
      beatStrip.appendChild(document.createElement("span"));
    }
    beatStrip.dataset.beats = String(rhythm.beatsPerBar);
  }

  Array.from(beatStrip.children).forEach((dot, index) => {
    const beat = index + 1;
    dot.className = `beat-dot${beat === 1 ? " downbeat" : ""}${beat === activeBeat ? " active" : ""}`;
  });
}

function updateRhythmReadout() {
  const beat = rhythm.beatIndex + 1;
  const countText = rhythm.countInBars > 0 ? ` · 预备 ${rhythm.countInBars} 小节` : "";
  const statusText = rhythm.countingIn ? ` · 剩余 ${rhythm.countInBeatsRemaining} 拍` : "";
  setText(tempoLabel, `${rhythm.bpm} 拍/分`);
  setText(meterLabel, `${rhythm.beatsPerBar}/4 · ${getSubdivisionMode().label} · 第 ${beat} 拍 · 第 ${padBar(rhythm.bar)} 小节${countText}${statusText}`);
  setText(clickVolumeLabel, `${Math.round(clickVolume() * 100)}%`);
  renderBeatStrip(beat);
}

function setTransportText() {
  window.AmbientMetronomePanel.setPlaying(playPauseButton, rhythm.running);
}

function syncRhythmPanelVisibility() {
  window.clearTimeout(rhythmPanelHideTimer);
  document.body.classList.toggle("rhythm-pinned", !rhythm.running && !rhythmPanelDismissed);
  if (!rhythm.running) {
    document.body.classList.remove("rhythm-visible");
  }
}

function showRhythmPanel(duration = 2400) {
  rhythmPanelDismissed = false;
  if (!rhythm.running) {
    syncRhythmPanelVisibility();
    return;
  }

  document.body.classList.add("rhythm-visible");
  window.clearTimeout(rhythmPanelHideTimer);
  if (duration <= 0) {
    return;
  }

  rhythmPanelHideTimer = window.setTimeout(() => {
    if (!rhythm.running) {
      syncRhythmPanelVisibility();
      return;
    }
    if (
      rhythmPanel?.matches(":hover") ||
      hudPanel?.matches(":hover") ||
      document.activeElement?.closest?.(".rhythm-panel, .hud")
    ) {
      showRhythmPanel(1600);
      return;
    }
    document.body.classList.remove("rhythm-visible");
  }, duration);
}

function hideRhythmPanel() {
  rhythmPanelDismissed = true;
  document.body.classList.remove("rhythm-visible");
  syncRhythmPanelVisibility();
}

function handleRhythmPointerDown(event) {
  if (rhythmPanel?.contains(event.target) || hudPanel?.contains(event.target)) {
    showRhythmPanel(0);
    return;
  }

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
    showRhythmPanel(rhythm.running ? 2200 : 0);
  }
}

function isTypingTarget(element) {
  return element?.matches?.("input, select, textarea, button, [contenteditable='true']");
}

function showToast(message) {
  if (!toast) return;
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => toast.classList.remove("visible"), 2200);
}

function captureFrame() {
  return canvas.toDataURL("image/png");
}

function miniToolBridge() {
  return window.xhs?.miniTool || null;
}

async function saveCurrentFrame() {
  const bridge = miniToolBridge();
  if (!bridge?.writeTempFile || !bridge?.saveImageToPhotosAlbum) {
    showToast("请在小红书小工具中保存");
    return;
  }

  try {
    const result = await bridge.writeTempFile({ data: captureFrame() });
    await bridge.saveImageToPhotosAlbum({ filePath: result.filePath });
    showToast("画面已保存到相册");
  } catch (error) {
    showToast("保存失败，请检查相册权限");
  }
}

async function postCurrentFrame() {
  const bridge = miniToolBridge();
  if (!bridge?.postNote) {
    showToast("请在小红书小工具中发布");
    return;
  }

  try {
    await bridge.postNote({
      title: "氛围节拍-递归细胞",
      content: "用节拍生成一帧不断生长的信号细胞。",
      pageType: "photo_publish",
      mediaInfo: { image_resources: [{ url: captureFrame() }] },
      tags: "氛围节拍,递归细胞,视觉节拍,生成艺术",
    });
  } catch (error) {
    showToast("发布页打开失败，请稍后重试");
  }
}

[pointInput, minSizeInput, irregularityInput, motionInput, speedInput].forEach((input) => {
  input.addEventListener("input", () => {
    const previousPointCount = settings.points;
    updateSettingsFromInputs();
    if (settings.points !== previousPointCount) {
      resetPoints();
    }
  });
});

resetButton.addEventListener("click", () => {
  seed = (seed + 101) % 100000;
  rebuildPointSet();
  videoCellKey = null;
});

cameraToggleButton?.addEventListener("click", () => {
  if (cameraEnabled) {
    stopCamera();
    return;
  }

  startCamera().then(() => {
    showRhythmPanel(rhythm.running ? 2200 : 0);
  });
});

cameraFacingButton?.addEventListener("click", () => {
  cameraFacingMode = cameraFacingMode === "user" ? "environment" : "user";
  updateCameraControls();

  if (!cameraEnabled) {
    setCameraStatus(cameraFacingMode === "user" ? "已选择前置摄像头" : "已选择后置摄像头");
    return;
  }

  startCamera().then(() => {
    showRhythmPanel(rhythm.running ? 2200 : 0);
  });
});

saveImageButton?.addEventListener("click", saveCurrentFrame);
postNoteButton?.addEventListener("click", postCurrentFrame);

playPauseButton.addEventListener("click", async () => {
  const audioContext = metronome.ensureAudio();
  await audioContext.resume();
  const now = performance.now();
  beginPointTransition(now);
  beginSplitTransition(now);

  if (rhythm.running) {
    metronome.pause();
  } else {
    metronome.start(now);
  }

  setTransportText();
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
  syncRhythmPanelVisibility();
});

rhythmResetButton.addEventListener("click", () => {
  metronome.pause();
  metronome.reset(performance.now());
  beatEnergy = 0;
  pointTransition = null;
  splitTransition = null;
  setTransportText();
  updateRhythmReadout();
  showRhythmPanel(0);
  syncRhythmPanelVisibility();
});

bpmInput.addEventListener("change", () => {
  rhythm.bpm = metronome.setBpm(bpmInput.value);
  bpmInput.value = rhythm.bpm;
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
});

bpmInput.addEventListener("input", () => {
  rhythm.bpm = metronome.setBpm(bpmInput.value);
  updateRhythmReadout();
});

meterSelect.addEventListener("change", () => {
  rhythm.beatsPerBar = metronome.setBeatsPerBar(parseMeter(meterSelect.value), performance.now());
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
});

subdivisionSelect.addEventListener("change", () => {
  rhythm.subdivision = metronome.setSubdivision(subdivisionModes[subdivisionSelect.value] ? subdivisionSelect.value : "auto");
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
});

countInSelect.addEventListener("change", () => {
  rhythm.countInBars = metronome.setCountInBars(countInSelect.value);
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
});

offbeatInput?.addEventListener("change", () => {
  rhythm.offbeatEnabled = metronome.setOffbeatEnabled(offbeatInput.checked);
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
});

clickVolumeInput.addEventListener("input", () => {
  metronome.setClickVolume(clickVolume());
  updateRhythmReadout();
  showRhythmPanel(rhythm.running ? 2200 : 0);
});

window.addEventListener("resize", resize);
document.addEventListener("pointerdown", handleRhythmPointerDown);
document.addEventListener("pointermove", handleRhythmPointerMove);

if ("ResizeObserver" in window && rhythmPanel) {
  const rhythmPanelResizeObserver = new ResizeObserver(syncMobilePanelSpacing);
  rhythmPanelResizeObserver.observe(rhythmPanel);
}

resize();
rebuildPointSet();
updateRhythmReadout();
setTransportText();
syncRhythmPanelVisibility();
updateCameraControls();
requestAnimationFrame(render);
