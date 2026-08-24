(function () {
  "use strict";

  const meterPresets = {
    simple: ["4/4", "3/4", "2/4", "6/8"],
    odd: ["3/4", "4/4", "5/4", "7/4"],
  };

  function option(value, selectedValue, label) {
    const selected = value === selectedValue ? " selected" : "";
    return `<option value="${value}"${selected}>${label || value}</option>`;
  }

  function renderPanel(panel) {
    const zh = panel.dataset.locale === "zh-CN";
    const text = zh ? {
      aria: "节拍控制",
      tempo: "速度",
      meter: "拍号",
      rhythm: "节奏",
      countIn: "预备拍",
      none: "无",
      bar: "小节",
      beat: "节拍",
      offbeat: "反拍",
      click: "音量",
      start: "开始",
      reset: "重置",
      auto: "自动",
    } : {
      aria: "Beat controls",
      tempo: "Tempo",
      meter: "Meter",
      rhythm: "Rhythm",
      countIn: "Count In",
      none: "None",
      bar: "bar",
      beat: "Beat",
      offbeat: "Offbeat",
      click: "Click",
      start: "Start",
      reset: "Reset",
      auto: "Auto",
    };
    const bpm = panel.dataset.bpm || "92";
    const bpmMax = panel.dataset.bpmMax || "240";
    const meter = panel.dataset.meter || "4/4";
    const meters = meterPresets[panel.dataset.meters] || meterPresets.odd;
    const volume = panel.dataset.volume || "45";
    const feelLabel = panel.dataset.feelLabel || text.rhythm;
    const rhythmLabel = panel.dataset.rhythmLabel || text.rhythm;
    const readout = panel.dataset.readout || `${meter} · Auto · beat 1 · bar 001`;
    const offbeat = panel.dataset.offbeat === "true";

    panel.classList.add("rhythm-panel");
    panel.classList.toggle("has-offbeat", offbeat);
    panel.setAttribute("aria-label", panel.dataset.ariaLabel || panel.getAttribute("aria-label") || text.aria);
    panel.innerHTML = `
      <div class="rhythm-primary">
        <div class="control-group timing-group">
          <span class="group-label">${text.tempo}</span>
          <div class="control-grid">
            <label for="bpmInput">
              <span class="label">BPM</span>
              <input id="bpmInput" type="number" min="40" max="${bpmMax}" step="1" value="${bpm}" inputmode="numeric" />
            </label>
            <label for="meterSelect">
              <span class="label">${text.meter}</span>
              <select id="meterSelect">${meters.map((value) => option(value, meter)).join("")}</select>
            </label>
          </div>
        </div>
        <div class="control-group feel-group">
          <span class="group-label">${feelLabel}</span>
          <div class="control-grid">
            <label for="subdivisionSelect">
              <span class="label">${rhythmLabel}</span>
              <select id="subdivisionSelect">
                ${option("auto", "auto", text.auto)}
                ${option("eighth", "auto", "1/8")}
                ${option("triplet", "auto", "1/8T")}
                ${option("sixteenth", "auto", "1/16")}
              </select>
            </label>
            <label for="countInSelect">
              <span class="label">${text.countIn}</span>
              <select id="countInSelect">
                ${option("0", "0", text.none)}
                ${option("1", "0", `1 ${text.bar}`)}
                ${option("2", "0", `2 ${text.bar}${zh ? "" : "s"}`)}
              </select>
            </label>
          </div>
        </div>
      </div>
      <div class="control-group beat-group">
        <span class="group-label">${text.beat}</span>
        <div class="beat-strip" id="beatStrip" aria-hidden="true"></div>
        <div class="rhythm-readout">
          <strong id="tempoLabel">${bpm} BPM</strong>
          <span id="meterLabel">${readout}</span>
        </div>
      </div>
      <div class="transport-bar">
        ${offbeat ? `<label for="offbeatInput" class="offbeat-control"><span class="label">${text.offbeat}</span><input id="offbeatInput" type="checkbox" /></label>` : ""}
        <label for="clickVolumeInput" class="volume-control">
          <span class="label">${text.click}</span>
          <input id="clickVolumeInput" type="range" min="0" max="100" step="1" value="${volume}" />
          <span class="volume-value" id="clickVolumeLabel">${volume}%</span>
        </label>
        <div class="transport-controls">
          <button id="playPauseButton" type="button">${text.start}</button>
          <button id="rhythmResetButton" class="icon-button" type="button" aria-label="${text.reset}" title="${text.reset}">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <path d="M20.49 15A9 9 0 1 1 20.29 8.5" />
              <path d="M15 9h3c1.41 0 2.12 0 2.56-.44C21 8.12 21 7.41 21 6V3" />
            </svg>
          </button>
        </div>
      </div>`;
  }

  document.querySelectorAll("[data-metronome-panel]").forEach(renderPanel);
  window.AmbientMetronomePanel = { render: renderPanel };
}());
