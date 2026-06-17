const canvas = document.getElementById("stage");
const ctx = canvas.getContext("2d");

const pointInput = document.getElementById("pointInput");
const pointValue = document.getElementById("pointValue");
const minSizeInput = document.getElementById("minSizeInput");
const minSizeValue = document.getElementById("minSizeValue");
const motionInput = document.getElementById("motionInput");
const motionValue = document.getElementById("motionValue");
const irregularityInput = document.getElementById("irregularityInput");
const irregularityValue = document.getElementById("irregularityValue");
const speedInput = document.getElementById("speedInput");
const speedValue = document.getElementById("speedValue");
const resetButton = document.getElementById("resetButton");
const cellCount = document.getElementById("cellCount");
const fpsReadout = document.getElementById("fpsReadout");

let width = 1;
let height = 1;
let dpr = 1;
let seed = 21;
let points = [];
let cells = [];
let lastFrameTime = performance.now();
let fpsSmooth = 60;

const settings = {
  points: 240,
  minSize: 34,
  motionBlend: 0.58,
  irregularity: 0.62,
  speed: 0.48,
};

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function lerp(a, b, t) {
  return a + (b - a) * t;
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
  settings.motionBlend = Number(motionInput.value) / 100;
  settings.irregularity = Number(irregularityInput.value) / 100;
  settings.speed = Number(speedInput.value) / 100;

  pointValue.value = String(settings.points);
  minSizeValue.value = String(settings.minSize);
  motionValue.value = settings.motionBlend.toFixed(2);
  irregularityValue.value = settings.irregularity.toFixed(2);
  speedValue.value = settings.speed.toFixed(2);
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
  const margin = Math.max(22, Math.min(width, height) * 0.055);
  const topPad = width < 700 ? 170 : 46;
  return {
    minX: margin,
    maxX: width - margin,
    minZ: topPad,
    maxZ: height - margin,
  };
}

function updatePoints(time) {
  const speed = settings.speed * 1.8;
  const bounds = getBounds();
  const scale = Math.min(bounds.maxX - bounds.minX, bounds.maxZ - bounds.minZ);

  for (let i = 0; i < points.length; i += 1) {
    const point = points[i];
    const amp = point.amp * scale;
    point.curX = point.restX + Math.sin(time * speed * point.freqX + point.phaseX + i * 1.37) * amp / Math.max(1, bounds.maxX - bounds.minX);
    point.curZ = point.restZ + Math.cos(time * speed * point.freqZ + point.phaseZ + i * 2.11) * amp / Math.max(1, bounds.maxZ - bounds.minZ);
  }
}

function buildCells() {
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
      const baseDsplit = fit(rsplit, cell.rminx, cell.rmaxx, dminx, dmaxx);
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
      const baseDsplit = fit(rsplit, cell.rminz, cell.rmaxz, dminz, dmaxz);
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

function drawBackground(time) {
  ctx.fillStyle = "#030303";
  ctx.fillRect(0, 0, width, height);

  const grid = Math.max(28, Math.min(width, height) * 0.05);
  const offset = (time * settings.speed * 11) % grid;
  ctx.save();
  ctx.globalAlpha = 0.12;
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 1;
  ctx.beginPath();
  for (let x = -grid + offset; x < width + grid; x += grid) {
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
  }
  for (let y = -grid + offset; y < height + grid; y += grid) {
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
  }
  ctx.stroke();
  ctx.restore();
}

function drawCells(time) {
  ctx.save();
  ctx.lineJoin = "miter";
  ctx.lineCap = "square";

  for (let i = 0; i < cells.length; i += 1) {
    const cell = cells[i];
    const pulse = 0.5 + 0.5 * Math.sin(time * 1.7 + cell.key * 0.037);
    const filled = sr(cell.key, 44) > 0.68;
    const inset = Math.max(0.75, Math.min(2.5, cell.depth * 0.18));

    ctx.globalAlpha = filled ? 0.88 : 0.045 + pulse * 0.05;
    ctx.fillStyle = filled ? "#f4f4f4" : "#ffffff";
    ctx.fillRect(cell.x + inset, cell.y + inset, Math.max(0, cell.w - inset * 2), Math.max(0, cell.h - inset * 2));

    ctx.globalAlpha = 0.72;
    ctx.strokeStyle = "#ffffff";
    ctx.lineWidth = cell.depth <= 3 ? 1.2 : 0.82;
    ctx.strokeRect(cell.x + 0.5, cell.y + 0.5, Math.max(0, cell.w - 1), Math.max(0, cell.h - 1));
  }

  ctx.restore();
}

function drawRestPoints() {
  const bounds = getBounds();
  ctx.save();
  ctx.globalAlpha = 0.2;
  ctx.fillStyle = "#ffffff";

  for (let i = 0; i < points.length; i += 1) {
    const x = bounds.minX + points[i].curX * (bounds.maxX - bounds.minX);
    const y = bounds.minZ + points[i].curZ * (bounds.maxZ - bounds.minZ);
    ctx.fillRect(x - 1, y - 1, 2, 2);
  }

  ctx.restore();
}

function render(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.1);
  lastFrameTime = now;
  fpsSmooth = lerp(fpsSmooth, 1 / Math.max(delta, 0.0001), 0.06);

  const time = now / 1000;
  updatePoints(time);
  buildCells();
  drawBackground(time);
  drawCells(time);
  drawRestPoints();

  cellCount.textContent = `${cells.length} cells`;
  fpsReadout.textContent = `${Math.round(fpsSmooth)} fps`;

  requestAnimationFrame(render);
}

function rebuildPointSet() {
  updateSettingsFromInputs();
  resetPoints();
}

[pointInput, minSizeInput, motionInput, irregularityInput, speedInput].forEach((input) => {
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
});

window.addEventListener("resize", resize);

resize();
rebuildPointSet();
requestAnimationFrame(render);
