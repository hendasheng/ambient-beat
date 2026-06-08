import * as THREE from "three";

const canvas = document.getElementById("particleCanvas");
const bpmInput = document.getElementById("bpmInput");
const bpmValue = document.getElementById("bpmValue");
const meterInput = document.getElementById("meterInput");
const meterValue = document.getElementById("meterValue");
const pulseInput = document.getElementById("pulseInput");
const pulseValue = document.getElementById("pulseValue");
const startButton = document.getElementById("startButton");
const resetButton = document.getElementById("resetButton");
const stateLabel = document.getElementById("stateLabel");
const beatLabel = document.getElementById("beatLabel");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x071012, 1);

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x071012, 0.018);

const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 260);
camera.position.set(0, 18, 92);
camera.lookAt(0, 0, 0);

const clock = new THREE.Clock();
const particleCount = 9000;
const positions = new Float32Array(particleCount * 3);
const seeds = new Float32Array(particleCount);
const bands = new Float32Array(particleCount);

for (let i = 0; i < particleCount; i += 1) {
  const stride = i * 3;
  const lane = (i % 9) - 4;
  const depth = Math.random() * 118 - 59;
  const spread = 9 + Math.random() * 33;
  const drift = Math.random() * Math.PI * 2;

  positions[stride] = lane * 5.8 + Math.cos(drift) * spread * 0.2;
  positions[stride + 1] = (Math.random() - 0.5) * 42;
  positions[stride + 2] = depth + Math.sin(drift) * 5;
  seeds[i] = Math.random();
  bands[i] = lane;
}

const geometry = new THREE.BufferGeometry();
geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
geometry.setAttribute("aSeed", new THREE.BufferAttribute(seeds, 1));
geometry.setAttribute("aBand", new THREE.BufferAttribute(bands, 1));

const uniforms = {
  uTime: { value: 0 },
  uPulse: { value: 0 },
  uAccent: { value: 0 },
  uPulseStrength: { value: 0.62 },
  uPixelRatio: { value: renderer.getPixelRatio() },
};

const particleMaterial = new THREE.ShaderMaterial({
  transparent: true,
  depthWrite: false,
  blending: THREE.AdditiveBlending,
  uniforms,
  vertexShader: `
    uniform float uTime;
    uniform float uPulse;
    uniform float uAccent;
    uniform float uPulseStrength;
    uniform float uPixelRatio;
    attribute float aSeed;
    attribute float aBand;
    varying float vGlow;
    varying float vSeed;

    void main() {
      vec3 p = position;
      float wave = sin(uTime * (0.42 + aSeed * 0.34) + aBand * 0.55 + p.z * 0.045);
      float pulseWave = sin((p.z + 60.0) * 0.18 - uPulse * 7.2);
      float laneBreath = cos(uTime * 0.28 + aBand * 0.7);

      p.x += wave * (1.6 + uPulseStrength * 3.6) + laneBreath * 0.8;
      p.y += cos(uTime * 0.36 + aSeed * 12.0) * 1.9;
      p.z += pulseWave * uPulseStrength * 1.8;

      float centerFalloff = 1.0 - smoothstep(0.0, 58.0, abs(p.z));
      float pulseGlow = max(0.0, pulseWave) * uPulse;
      vGlow = 0.18 + centerFalloff * 0.32 + pulseGlow * 1.15 + uAccent * 0.34;
      vSeed = aSeed;

      vec4 mvPosition = modelViewMatrix * vec4(p, 1.0);
      gl_Position = projectionMatrix * mvPosition;
      gl_PointSize = (1.2 + vGlow * 5.4 + aSeed * 1.8) * uPixelRatio * (86.0 / -mvPosition.z);
    }
  `,
  fragmentShader: `
    precision highp float;
    varying float vGlow;
    varying float vSeed;

    void main() {
      vec2 uv = gl_PointCoord - 0.5;
      float d = length(uv);
      float core = smoothstep(0.5, 0.0, d);
      float halo = smoothstep(0.5, 0.08, d) * 0.35;
      vec3 low = vec3(0.18, 0.72, 0.64);
      vec3 high = vec3(1.0, 0.76, 0.38);
      vec3 color = mix(low, high, smoothstep(0.55, 1.35, vGlow + vSeed * 0.25));
      float alpha = (core + halo) * clamp(vGlow, 0.0, 1.35);
      gl_FragColor = vec4(color, alpha);
    }
  `,
});

const particles = new THREE.Points(geometry, particleMaterial);
scene.add(particles);

const ringGroup = new THREE.Group();
scene.add(ringGroup);

const ringMaterial = new THREE.LineBasicMaterial({
  color: 0x9ee8d1,
  transparent: true,
  opacity: 0.22,
});

for (let i = 0; i < 7; i += 1) {
  const curve = new THREE.EllipseCurve(0, 0, 11 + i * 6.8, 4.6 + i * 2.15);
  const points = curve.getPoints(128).map((p) => new THREE.Vector3(p.x, p.y, -34 + i * 11));
  const line = new THREE.Line(new THREE.BufferGeometry().setFromPoints(points), ringMaterial.clone());
  line.rotation.x = -0.22;
  line.userData.phase = i / 7;
  ringGroup.add(line);
}

let audioContext = null;
let isRunning = false;
let beatIndex = 0;
let nextBeatTime = 0;
let lastFrameTime = performance.now();
let visualPulse = 0;
let accentPulse = 0;

function getBpm() {
  return Number(bpmInput.value);
}

function getMeter() {
  return Number(meterInput.value);
}

function getPulseStrength() {
  return Number(pulseInput.value) / 100;
}

function updateLabels() {
  bpmValue.value = String(getBpm());
  meterValue.value = String(getMeter());
  pulseValue.value = String(pulseInput.value);
  beatLabel.textContent = `${beatIndex + 1} / ${getMeter()}`;
}

function ensureAudio() {
  if (!audioContext) {
    audioContext = new AudioContext();
  }
  return audioContext;
}

function click(time, accent) {
  const ctx = ensureAudio();
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = accent ? "triangle" : "sine";
  osc.frequency.setValueAtTime(accent ? 740 : 430, time);
  gain.gain.setValueAtTime(0.0001, time);
  gain.gain.exponentialRampToValueAtTime(accent ? 0.18 : 0.09, time + 0.006);
  gain.gain.exponentialRampToValueAtTime(0.0001, time + 0.08);
  osc.connect(gain).connect(ctx.destination);
  osc.start(time);
  osc.stop(time + 0.09);
}

function triggerBeat(time) {
  const accent = beatIndex === 0;
  click(time, accent);
  visualPulse = Math.min(1.6, visualPulse + (accent ? 1.2 : 0.72));
  accentPulse = accent ? 1 : Math.max(accentPulse, 0.35);
  beatIndex = (beatIndex + 1) % getMeter();
  updateLabels();
}

function scheduler() {
  if (!isRunning || !audioContext) return;

  const secondsPerBeat = 60 / getBpm();
  while (nextBeatTime < audioContext.currentTime + 0.1) {
    triggerBeat(nextBeatTime);
    nextBeatTime += secondsPerBeat;
  }
}

function start() {
  const ctx = ensureAudio();
  if (ctx.state === "suspended") {
    ctx.resume();
  }
  isRunning = !isRunning;
  if (isRunning) {
    nextBeatTime = ctx.currentTime + 0.06;
    stateLabel.textContent = "Running";
    startButton.textContent = "Pause";
  } else {
    stateLabel.textContent = "Paused";
    startButton.textContent = "Start";
  }
}

function reset() {
  beatIndex = 0;
  visualPulse = 0.9;
  accentPulse = 0.8;
  nextBeatTime = audioContext ? audioContext.currentTime + 0.08 : 0;
  updateLabels();
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height, false);
  camera.aspect = width / height;
  camera.position.z = width < height ? 112 : 92;
  camera.updateProjectionMatrix();
  uniforms.uPixelRatio.value = renderer.getPixelRatio();
}

function animate(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;
  scheduler();

  const elapsed = clock.getElapsedTime();
  visualPulse *= Math.pow(0.045, delta);
  accentPulse *= Math.pow(0.08, delta);

  uniforms.uTime.value = elapsed;
  uniforms.uPulse.value = visualPulse;
  uniforms.uAccent.value = accentPulse;
  uniforms.uPulseStrength.value = getPulseStrength();

  particles.rotation.y = Math.sin(elapsed * 0.08) * 0.1;
  particles.rotation.x = -0.08 + Math.cos(elapsed * 0.07) * 0.035;

  ringGroup.children.forEach((ring) => {
    const phase = ring.userData.phase;
    const beatGlow = Math.max(0, Math.sin((phase - visualPulse * 0.18 + elapsed * 0.08) * Math.PI * 2));
    ring.material.opacity = 0.08 + beatGlow * 0.2 + accentPulse * 0.09;
    ring.scale.setScalar(1 + visualPulse * (0.03 + phase * 0.06));
  });

  camera.position.x = Math.sin(elapsed * 0.11) * 3.5;
  camera.position.y = 18 + Math.cos(elapsed * 0.09) * 2.2 + accentPulse * 1.2;
  camera.lookAt(0, 0, 0);

  renderer.render(scene, camera);
  requestAnimationFrame(animate);
}

[bpmInput, meterInput, pulseInput].forEach((input) => {
  input.addEventListener("input", updateLabels);
});

startButton.addEventListener("click", start);
resetButton.addEventListener("click", reset);
window.addEventListener("resize", resize);

updateLabels();
resize();
requestAnimationFrame(animate);
