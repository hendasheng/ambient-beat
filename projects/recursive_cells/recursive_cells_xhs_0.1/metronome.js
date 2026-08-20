(function () {
  function clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  const offbeatSound = {
    type: "triangle",
    frequency: 740,
    level: 0.38,
    attack: 0.003,
    decay: 0.055,
    stop: 0.076,
  };

  function createMetronome(options = {}) {
    const state = {
      running: false,
      bpm: clamp(Math.round(Number(options.bpm) || 120), 40, 240),
      beatsPerBar: clamp(Math.round(Number(options.beatsPerBar) || 4), 1, 12),
      subdivision: options.subdivision || "auto",
      countInBars: clamp(Math.round(Number(options.countInBars) || 0), 0, 2),
      countingIn: false,
      countInBeatsRemaining: 0,
      countInTotalBeats: 0,
      beatIndex: 0,
      bar: 1,
      startAt: performance.now(),
      nextBeatAt: 0,
      nextOffbeatAt: 0,
      lastBeatAt: performance.now(),
      audioContext: null,
      masterGain: null,
      clickVolume: clamp(Number(options.clickVolume) || 0, 0, 1),
      offbeatEnabled: Boolean(options.offbeatEnabled),
    };

    const onChange = typeof options.onChange === "function" ? options.onChange : null;
    const onBeat = typeof options.onBeat === "function" ? options.onBeat : null;

    function emitChange() {
      if (onChange) {
        onChange(state);
      }
    }

    function emitBeat(accent) {
      if (onBeat) {
        onBeat(state, accent);
      }
    }

    function intervalMs() {
      return 60000 / state.bpm;
    }

    function ensureAudio() {
      if (state.audioContext) {
        return state.audioContext;
      }

      const AudioContext = window.AudioContext || window.webkitAudioContext;
      state.audioContext = new AudioContext();
      state.masterGain = state.audioContext.createGain();
      state.masterGain.gain.value = state.clickVolume;
      state.masterGain.connect(state.audioContext.destination);
      return state.audioContext;
    }

    function scheduleClick(accent, offbeat = false) {
      if (!state.audioContext || !state.masterGain) {
        return;
      }

      const now = state.audioContext.currentTime;
      const osc = state.audioContext.createOscillator();
      const gain = state.audioContext.createGain();
      const frequency = offbeat ? offbeatSound.frequency : accent ? 1320 : 880;
      const level = offbeat ? offbeatSound.level : accent ? 0.9 : 0.58;

      osc.type = offbeat ? offbeatSound.type : "square";
      osc.frequency.setValueAtTime(frequency, now);
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(level, now + (offbeat ? offbeatSound.attack : 0.004));
      gain.gain.exponentialRampToValueAtTime(0.0001, now + (offbeat ? offbeatSound.decay : 0.055));
      osc.connect(gain);
      gain.connect(state.masterGain);
      osc.start(now);
      osc.stop(now + (offbeat ? offbeatSound.stop : 0.07));
    }

    function stepOffbeat() {
      scheduleClick(false, true);
    }

    function advanceCountInBeat(now) {
      const countIndex = state.countInTotalBeats - state.countInBeatsRemaining;
      state.beatIndex = countIndex % state.beatsPerBar;
      state.bar = 1;
      state.lastBeatAt = now;
      state.countInBeatsRemaining -= 1;
      const accent = state.beatIndex === 0;
      scheduleClick(accent);
      emitBeat(accent);
    }

    function stepBeat(now = performance.now()) {
      if (state.countingIn) {
        if (state.countInBeatsRemaining <= 0) {
          state.countingIn = false;
          state.beatIndex = 0;
          state.bar = 1;
          state.startAt = now;
          state.lastBeatAt = now;
          scheduleClick(true);
          emitBeat(true);
          emitChange();
          return;
        }

        advanceCountInBeat(now);
        emitChange();
        return;
      }

      state.beatIndex += 1;
      if (state.beatIndex >= state.beatsPerBar) {
        state.beatIndex = 0;
        state.bar += 1;
      }

      state.lastBeatAt = now;
      const accent = state.beatIndex === 0;
      scheduleClick(accent);
      emitBeat(accent);
      emitChange();
    }

    function update(now = performance.now()) {
      if (!state.running) {
        return;
      }

      while (now >= state.nextBeatAt || (state.offbeatEnabled && now >= state.nextOffbeatAt)) {
        if (state.offbeatEnabled && state.nextOffbeatAt < state.nextBeatAt) {
          stepOffbeat();
          state.nextOffbeatAt += intervalMs();
          continue;
        }

        stepBeat(now);
        state.nextBeatAt += intervalMs();
        if (state.nextOffbeatAt < state.nextBeatAt - intervalMs() * 0.5) {
          state.nextOffbeatAt = state.nextBeatAt - intervalMs() * 0.5;
        }
      }
    }

    function start(now = performance.now()) {
      state.running = true;
      state.lastBeatAt = now;
      state.nextBeatAt = now + intervalMs();
      state.nextOffbeatAt = now + intervalMs() * 0.5;
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;
      state.countInBeatsRemaining = state.countInTotalBeats;
      state.countingIn = state.countInTotalBeats > 0;

      if (state.countingIn) {
        state.startAt = now + state.countInTotalBeats * intervalMs();
        advanceCountInBeat(now);
      } else {
        state.startAt = now;
        const accent = state.beatIndex === 0;
        scheduleClick(accent);
        emitBeat(accent);
      }
      emitChange();
    }

    function pause() {
      state.running = false;
      state.countingIn = false;
      state.countInBeatsRemaining = 0;
      emitChange();
    }

    function reset(now = performance.now()) {
      state.beatIndex = 0;
      state.bar = 1;
      state.countingIn = false;
      state.countInBeatsRemaining = 0;
      state.lastBeatAt = now;
      state.startAt = now;
      state.nextBeatAt = now;
      state.nextOffbeatAt = now + intervalMs() * 0.5;
      emitChange();
    }

    function setBpm(value) {
      state.bpm = clamp(Math.round(Number(value) || state.bpm), 40, 240);
      emitChange();
      return state.bpm;
    }

    function setBeatsPerBar(value) {
      state.beatsPerBar = clamp(Math.round(Number(value) || state.beatsPerBar), 1, 12);
      state.beatIndex = Math.min(state.beatIndex, state.beatsPerBar - 1);
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;
      emitChange();
      return state.beatsPerBar;
    }

    function setSubdivision(value) {
      state.subdivision = value || "auto";
      emitChange();
      return state.subdivision;
    }

    function setCountInBars(value) {
      state.countInBars = clamp(Math.round(Number(value) || 0), 0, 2);
      state.countInTotalBeats = state.countInBars * state.beatsPerBar;
      emitChange();
      return state.countInBars;
    }

    function setClickVolume(value) {
      state.clickVolume = clamp(Number(value) || 0, 0, 1);
      if (state.masterGain) {
        state.masterGain.gain.value = state.clickVolume;
      }
      emitChange();
      return state.clickVolume;
    }

    function setOffbeatEnabled(value) {
      state.offbeatEnabled = Boolean(value);
      const now = performance.now();
      const interval = intervalMs();
      state.nextOffbeatAt = state.lastBeatAt + interval * 0.5;
      while (state.running && state.nextOffbeatAt <= now) {
        state.nextOffbeatAt += interval;
      }
      emitChange();
      return state.offbeatEnabled;
    }

    function beatProgress(now = performance.now()) {
      if (!state.running) {
        return 0;
      }
      return clamp((now - state.lastBeatAt) / intervalMs(), 0, 1);
    }

    function pulse(now = performance.now()) {
      return Math.max(0, 1 - (now - state.lastBeatAt) / 180);
    }

    return {
      state,
      intervalMs,
      ensureAudio,
      update,
      start,
      pause,
      reset,
      setBpm,
      setBeatsPerBar,
      setSubdivision,
      setCountInBars,
      setClickVolume,
      setOffbeatEnabled,
      beatProgress,
      pulse,
    };
  }

  window.AmbientMetronome = {
    createMetronome,
  };
}());
