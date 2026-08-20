(function () {
  "use strict";

  const canvas = document.getElementById("iconCanvas");
  const ctx = canvas.getContext("2d");
  const previewCanvases = Array.from(document.querySelectorAll("canvas[data-size]"));
  const complexityInput = document.getElementById("complexityInput");
  const regularityInput = document.getElementById("regularityInput");
  const gutterInput = document.getElementById("gutterInput");
  const complexityValue = document.getElementById("complexityValue");
  const regularityValue = document.getElementById("regularityValue");
  const gutterValue = document.getElementById("gutterValue");
  const cellReadout = document.getElementById("cellReadout");
  const iconId = document.getElementById("iconId");
  const toast = document.getElementById("toast");
  const downloadButton = document.getElementById("downloadButton");

  const palettes = {
    test: ["#ffffff", "#ffff00", "#00ffff", "#00ff48", "#ff00d4", "#ff2a16", "#1747ff", "#111111"],
    mono: ["#ffffff", "#dedede", "#a5a5a5", "#707070", "#3b3b3b", "#111111"],
    neon: ["#c7ff00", "#00e5ff", "#7655ff", "#ff2ebd", "#ff6b00", "#111111"],
    signal: ["#fff1e4", "#ffb199", "#ff6038", "#d91135", "#76001a", "#210008"],
  };

  const defaults = { seed: 21843, colorSeed: 7319, complexity: 12, regularity: 58, gutter: 14, palette: "test" };
  const state = { ...defaults };
  let clappingPaths = [];
  let toastTimer = 0;

  function mulberry32(seed) {
    return function () {
      let value = seed += 0x6D2B79F5;
      value = Math.imul(value ^ value >>> 15, value | 1);
      value ^= value + Math.imul(value ^ value >>> 7, value | 61);
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  function buildCells(seed, count, regularity) {
    const random = mulberry32(seed);
    const cells = [{ x: 0, y: 0, w: 1, h: 1, depth: 0, key: 1 }];
    const jitter = (100 - regularity) / 100;

    while (cells.length < count) {
      let candidateIndex = -1;
      let candidateScore = -1;
      for (let index = 0; index < cells.length; index += 1) {
        const cell = cells[index];
        const score = cell.w * cell.h * (0.82 + random() * 0.36);
        if (Math.min(cell.w, cell.h) > 0.115 && score > candidateScore) {
          candidateIndex = index;
          candidateScore = score;
        }
      }
      if (candidateIndex < 0) break;

      const cell = cells.splice(candidateIndex, 1)[0];
      const splitVertical = cell.w > cell.h * 1.18 ? true : cell.h > cell.w * 1.18 ? false : random() > 0.5;
      const ratio = clamp(0.5 + (random() - 0.5) * (0.16 + jitter * 0.4), 0.28, 0.72);
      if (splitVertical) {
        cells.push(
          { x: cell.x, y: cell.y, w: cell.w * ratio, h: cell.h, depth: cell.depth + 1, key: cell.key * 2 },
          { x: cell.x + cell.w * ratio, y: cell.y, w: cell.w * (1 - ratio), h: cell.h, depth: cell.depth + 1, key: cell.key * 2 + 1 }
        );
      } else {
        cells.push(
          { x: cell.x, y: cell.y, w: cell.w, h: cell.h * ratio, depth: cell.depth + 1, key: cell.key * 2 },
          { x: cell.x, y: cell.y + cell.h * ratio, w: cell.w, h: cell.h * (1 - ratio), depth: cell.depth + 1, key: cell.key * 2 + 1 }
        );
      }
    }
    return cells;
  }

  function colorForCell(cell, index, random, colors) {
    if (index === 0) return "#ffffff";
    const offset = Math.floor(random() * colors.length);
    return colors[(index + cell.depth * 2 + offset) % colors.length];
  }

  function inkForColor(color) {
    const value = color.slice(1);
    const red = parseInt(value.slice(0, 2), 16);
    const green = parseInt(value.slice(2, 4), 16);
    const blue = parseInt(value.slice(4, 6), 16);
    return red * 0.299 + green * 0.587 + blue * 0.114 > 150 ? "#080808" : "#ffffff";
  }

  function pickContentCells(renderedCells) {
    const random = mulberry32(state.seed ^ 0x51ED270B);
    const eligible = renderedCells
      .filter(function (item) {
        return item.cell.w * item.cell.h > 0.045 && Math.min(item.cell.w, item.cell.h) > 0.16;
      })
      .sort(function () { return random() - 0.5; });
    const fallback = renderedCells.slice().sort(function (a, b) {
      return b.cell.w * b.cell.h - a.cell.w * a.cell.h;
    });
    const iconCell = eligible[0] || fallback[0];
    const bpmCell = eligible.find(function (item) { return item !== iconCell; }) || fallback.find(function (item) { return item !== iconCell; });
    return { iconCell: iconCell, bpmCell: bpmCell };
  }

  function drawClappingIcon(context, item, size) {
    if (!item || clappingPaths.length === 0) return;
    const iconSize = Math.min(item.width, item.height) * 0.62;
    if (iconSize < Math.max(10, size * 0.035)) return;
    const iconScale = iconSize / 24;
    const x = item.x + (item.width - iconSize) * 0.5;
    const y = item.y + (item.height - iconSize) * 0.5;
    context.save();
    context.translate(x, y);
    context.scale(iconScale, iconScale);
    context.strokeStyle = inkForColor(item.color);
    context.lineWidth = 1.8;
    context.lineCap = "round";
    context.lineJoin = "round";
    clappingPaths.forEach(function (path) { context.stroke(path); });
    context.restore();
  }

  function drawBpm(context, item, size) {
    if (!item) return;
    const fontSize = Math.min(item.height * 0.38, item.width * 0.27);
    if (fontSize < Math.max(7, size * 0.024)) return;
    context.save();
    context.fillStyle = inkForColor(item.color);
    context.font = "800 " + fontSize + "px Consolas, monospace";
    context.textAlign = "center";
    context.textBaseline = "middle";
    context.fillText("BPM", item.x + item.width * 0.5, item.y + item.height * 0.51);
    context.restore();
  }

  function drawIcon(target, size) {
    const context = target.getContext("2d");
    const scale = size / 1024;
    const margin = 0;
    const gutter = state.gutter * scale;
    const innerSize = size - margin * 2;
    const cells = buildCells(state.seed, state.complexity, state.regularity);
    const random = mulberry32(state.colorSeed ^ 0x9E3779B9);
    const colors = palettes[state.palette];

    context.clearRect(0, 0, size, size);
    context.fillStyle = "#030303";
    context.fillRect(0, 0, size, size);
    context.save();
    context.beginPath();
    context.rect(margin, margin, innerSize, innerSize);
    context.clip();
    context.fillStyle = "#050505";
    context.fillRect(margin, margin, innerSize, innerSize);

    const ordered = cells.slice().sort(function (a, b) { return b.w * b.h - a.w * a.h; });
    const renderedCells = [];
    ordered.forEach(function (cell, index) {
      const leftGap = cell.x > 0.0001 ? gutter * 0.5 : 0;
      const rightGap = cell.x + cell.w < 0.9999 ? gutter * 0.5 : 0;
      const topGap = cell.y > 0.0001 ? gutter * 0.5 : 0;
      const bottomGap = cell.y + cell.h < 0.9999 ? gutter * 0.5 : 0;
      const x = margin + cell.x * innerSize + leftGap;
      const y = margin + cell.y * innerSize + topGap;
      const width = Math.max(0, cell.w * innerSize - leftGap - rightGap);
      const height = Math.max(0, cell.h * innerSize - topGap - bottomGap);
      const color = colorForCell(cell, index, random, colors);
      context.fillStyle = color;
      context.fillRect(x, y, width, height);
      renderedCells.push({ cell: cell, x: x, y: y, width: width, height: height, color: color });
    });
    const contentCells = pickContentCells(renderedCells);
    drawClappingIcon(context, contentCells.iconCell, size);
    drawBpm(context, contentCells.bpmCell, size);
    context.restore();
    return cells.length;
  }

  function makeId() {
    const suffix = ((state.seed ^ state.colorSeed ^ (state.complexity << 8) ^ state.regularity) >>> 0).toString(16).toUpperCase().slice(-2).padStart(2, "0");
    return "RC-" + String(state.seed % 1000).padStart(3, "0") + "-" + suffix;
  }

  function render() {
    const count = drawIcon(canvas, 1024);
    previewCanvases.forEach(function (preview) { drawIcon(preview, Number(preview.dataset.size)); });
    const id = makeId();
    iconId.textContent = id;
    complexityValue.textContent = state.complexity;
    regularityValue.textContent = state.regularity;
    gutterValue.textContent = state.gutter;
    cellReadout.textContent = count + " CELLS";
  }

  function randomize() {
    state.seed = Math.floor(Math.random() * 999999) + 1;
    render();
  }

  function shuffleColors() {
    state.colorSeed = Math.floor(Math.random() * 999999) + 1;
    render();
    showToast("已切换配色");
  }

  function syncRanges() {
    state.complexity = Number(complexityInput.value);
    state.regularity = Number(regularityInput.value);
    state.gutter = Number(gutterInput.value);
    render();
  }

  function selectPalette(button) {
    state.palette = button.dataset.palette;
    document.querySelectorAll(".palette-option").forEach(function (option) {
      const active = option === button;
      option.classList.toggle("is-active", active);
      option.setAttribute("aria-pressed", String(active));
    });
    render();
  }

  function downloadImage() {
    const link = document.createElement("a");
    link.download = makeId() + ".png";
    link.href = canvas.toDataURL("image/png");
    document.body.appendChild(link);
    link.click();
    link.remove();
    showToast("图片已开始下载");
  }

  function reset() {
    Object.assign(state, defaults);
    complexityInput.value = state.complexity;
    regularityInput.value = state.regularity;
    gutterInput.value = state.gutter;
    selectPalette(document.querySelector('[data-palette="test"]'));
    showToast("已恢复默认构图");
  }

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove("is-visible"); }, 1500);
  }

  complexityInput.addEventListener("input", syncRanges);
  regularityInput.addEventListener("input", syncRanges);
  gutterInput.addEventListener("input", syncRanges);
  document.getElementById("shuffleButton").addEventListener("click", randomize);
  document.getElementById("canvasButton").addEventListener("click", randomize);
  document.getElementById("colorShuffleButton").addEventListener("click", shuffleColors);
  downloadButton.addEventListener("click", downloadImage);
  document.getElementById("resetButton").addEventListener("click", reset);
  document.getElementById("paletteList").addEventListener("click", function (event) {
    const button = event.target.closest(".palette-option");
    if (button) selectPalette(button);
  });

  render();
  import("https://cdn.jsdelivr.net/npm/@hugeicons/core-free-icons@4.2.1/dist/esm/HandsClappingIcon.js")
    .then(function (module) {
      clappingPaths = module.default.map(function (entry) { return new Path2D(entry[1].d); });
      downloadButton.disabled = false;
      downloadButton.textContent = "下载图片";
      render();
    })
    .catch(function () {
      showToast("拍手图标加载失败，请检查网络");
    });
})();
