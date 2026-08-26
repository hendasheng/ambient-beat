import * as THREE from "three";
import { GPUComputationRenderer } from "three/addons/misc/GPUComputationRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { ShaderPass } from "three/addons/postprocessing/ShaderPass.js";

const canvas = document.getElementById("particleCanvas");
const speedInput = document.getElementById("speedInput");
const speedValue = document.getElementById("speedValue");
const curlInput = document.getElementById("curlInput");
const curlValue = document.getElementById("curlValue");
const lifeInput = document.getElementById("lifeInput");
const lifeValue = document.getElementById("lifeValue");
const sizeInput = document.getElementById("sizeInput");
const sizeValue = document.getElementById("sizeValue");
const lightAzimuthInput = document.getElementById("lightAzimuthInput");
const lightAzimuthValue = document.getElementById("lightAzimuthValue");
const lightHeightInput = document.getElementById("lightHeightInput");
const lightHeightValue = document.getElementById("lightHeightValue");
const lightPowerInput = document.getElementById("lightPowerInput");
const lightPowerValue = document.getElementById("lightPowerValue");
const shadowInput = document.getElementById("shadowInput");
const shadowValue = document.getElementById("shadowValue");
const resetButton = document.getElementById("resetButton");
const bpmInput = document.getElementById("bpmInput");
const meterSelect = document.getElementById("meterSelect");
const subdivisionSelect = document.getElementById("subdivisionSelect");
const countInSelect = document.getElementById("countInSelect");
const clickVolumeInput = document.getElementById("clickVolumeInput");
const clickVolumeLabel = document.getElementById("clickVolumeLabel");
const playPauseButton = document.getElementById("playPauseButton");
const rhythmResetButton = document.getElementById("rhythmResetButton");
const beatStrip = document.getElementById("beatStrip");
const miniBeatStrip = document.getElementById("miniBeatStrip");
const miniBeatReadout = document.getElementById("miniBeatReadout");
const tempoLabel = document.getElementById("tempoLabel");
const meterLabel = document.getElementById("meterLabel");
const rhythmPanel = document.querySelector(".rhythm-panel");

const renderer = new THREE.WebGLRenderer({
  canvas,
  antialias: true,
  alpha: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
renderer.setClearColor(0x071012, 1);
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowMap;

const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(0x071012, 0.006);

const camera = new THREE.PerspectiveCamera(45, 1, 1, 1000);
const clock = new THREE.Clock();
const lightDirection = new THREE.Vector3(-0.5, 1, 0).normalize();

const simSize = 512;
const particleCount = simSize * simSize;
const particleRadius = 40;

const light = new THREE.DirectionalLight(0xffffff, 1);
light.position.copy(lightDirection).multiplyScalar(particleRadius * 4);
light.castShadow = true;
light.shadow.mapSize.set(1024, 1024);
light.shadow.bias = 0;
light.shadow.radius = 10;
const shadowCamera = light.shadow.camera;
const shadowBounds = particleRadius * 3;
shadowCamera.left = -shadowBounds;
shadowCamera.right = shadowBounds;
shadowCamera.top = shadowBounds;
shadowCamera.bottom = -shadowBounds;
shadowCamera.near = particleRadius;
shadowCamera.far = particleRadius * 8;
shadowCamera.updateProjectionMatrix();
scene.add(light);
scene.add(light.target);

let lastFrameTime = performance.now();
let pointSizeBase = Number(sizeInput.value);
let rhythmPanelHideTimer = 0;
let lastRhythmPointerMove = 0;
let rhythmPanelDismissed = false;
let rhythmPulse = 0;
let rhythmAccent = 0;

const rhythm = {
  bpm: 68,
  meter: { numerator: 4, denominator: 4 },
  subdivision: "auto",
  countInBars: 0,
  clickVolume: 0.78,
  isPlaying: false,
  useToneClock: false,
  nextBeatTime: 0,
  beatIndex: 0,
  clockOrigin: 0,
  countInBeatsRemaining: 0,
};

const rhythmAudio = {
  ready: false,
  master: null,
  hitTone: null,
  downbeatTone: null,
};

const subdivisionModes = {
  auto: { label: "Auto", fraction: 0.5 },
  eighth: { label: "1/8", fraction: 0.5 },
  triplet: { label: "1/8T", fraction: 2 / 3 },
  sixteenth: { label: "1/16", fraction: 0.25 },
};

let cameraTheta = 0;
let cameraPhi = Math.PI * 0.5;
let cameraDistance = 360;
let targetCameraTheta = cameraTheta;
let targetCameraPhi = cameraPhi;
let targetCameraDistance = cameraDistance;
let isDraggingCamera = false;
let dragStartX = 0;
let dragStartY = 0;
let dragStartTheta = 0;
let dragStartPhi = 0;

const curlShader = `
vec4 mod289(vec4 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

float mod289(float x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec4 permute(vec4 x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

float permute(float x) {
  return mod289(((x * 34.0) + 1.0) * x);
}

vec4 taylorInvSqrt(vec4 r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

float taylorInvSqrt(float r) {
  return 1.79284291400159 - 0.85373472095314 * r;
}

vec4 grad4(float j, vec4 ip) {
  const vec4 ones = vec4(1.0, 1.0, 1.0, -1.0);
  vec4 p, s;

  p.xyz = floor(fract(vec3(j) * ip.xyz) * 7.0) * ip.z - 1.0;
  p.w = 1.5 - dot(abs(p.xyz), ones.xyz);
  s = vec4(lessThan(p, vec4(0.0)));
  p.xyz = p.xyz + (s.xyz * 2.0 - 1.0) * s.www;

  return p;
}

#define F4 0.309016994374947451

vec4 simplexNoiseDerivatives(vec4 v) {
  const vec4 C = vec4(0.138196601125011, 0.276393202250021, 0.414589803375032, -0.447213595499958);

  vec4 i = floor(v + dot(v, vec4(F4)));
  vec4 x0 = v - i + dot(i, C.xxxx);

  vec4 i0;
  vec3 isX = step(x0.yzw, x0.xxx);
  vec3 isYZ = step(x0.zww, x0.yyz);
  i0.x = isX.x + isX.y + isX.z;
  i0.yzw = 1.0 - isX;
  i0.y += isYZ.x + isYZ.y;
  i0.zw += 1.0 - isYZ.xy;
  i0.z += isYZ.z;
  i0.w += 1.0 - isYZ.z;

  vec4 i3 = clamp(i0, 0.0, 1.0);
  vec4 i2 = clamp(i0 - 1.0, 0.0, 1.0);
  vec4 i1 = clamp(i0 - 2.0, 0.0, 1.0);

  vec4 x1 = x0 - i1 + C.xxxx;
  vec4 x2 = x0 - i2 + C.yyyy;
  vec4 x3 = x0 - i3 + C.zzzz;
  vec4 x4 = x0 + C.wwww;

  i = mod289(i);
  float j0 = permute(permute(permute(permute(i.w) + i.z) + i.y) + i.x);
  vec4 j1 = permute(permute(permute(permute(
    i.w + vec4(i1.w, i2.w, i3.w, 1.0))
    + i.z + vec4(i1.z, i2.z, i3.z, 1.0))
    + i.y + vec4(i1.y, i2.y, i3.y, 1.0))
    + i.x + vec4(i1.x, i2.x, i3.x, 1.0));

  vec4 ip = vec4(1.0 / 294.0, 1.0 / 49.0, 1.0 / 7.0, 0.0);

  vec4 p0 = grad4(j0, ip);
  vec4 p1 = grad4(j1.x, ip);
  vec4 p2 = grad4(j1.y, ip);
  vec4 p3 = grad4(j1.z, ip);
  vec4 p4 = grad4(j1.w, ip);

  vec4 norm = taylorInvSqrt(vec4(dot(p0, p0), dot(p1, p1), dot(p2, p2), dot(p3, p3)));
  p0 *= norm.x;
  p1 *= norm.y;
  p2 *= norm.z;
  p3 *= norm.w;
  p4 *= taylorInvSqrt(dot(p4, p4));

  vec3 values0 = vec3(dot(p0, x0), dot(p1, x1), dot(p2, x2));
  vec2 values1 = vec2(dot(p3, x3), dot(p4, x4));

  vec3 m0 = max(0.5 - vec3(dot(x0, x0), dot(x1, x1), dot(x2, x2)), 0.0);
  vec2 m1 = max(0.5 - vec2(dot(x3, x3), dot(x4, x4)), 0.0);

  vec3 temp0 = -6.0 * m0 * m0 * values0;
  vec2 temp1 = -6.0 * m1 * m1 * values1;

  vec3 mmm0 = m0 * m0 * m0;
  vec2 mmm1 = m1 * m1 * m1;

  float dx = temp0[0] * x0.x + temp0[1] * x1.x + temp0[2] * x2.x + temp1[0] * x3.x + temp1[1] * x4.x + mmm0[0] * p0.x + mmm0[1] * p1.x + mmm0[2] * p2.x + mmm1[0] * p3.x + mmm1[1] * p4.x;
  float dy = temp0[0] * x0.y + temp0[1] * x1.y + temp0[2] * x2.y + temp1[0] * x3.y + temp1[1] * x4.y + mmm0[0] * p0.y + mmm0[1] * p1.y + mmm0[2] * p2.y + mmm1[0] * p3.y + mmm1[1] * p4.y;
  float dz = temp0[0] * x0.z + temp0[1] * x1.z + temp0[2] * x2.z + temp1[0] * x3.z + temp1[1] * x4.z + mmm0[0] * p0.z + mmm0[1] * p1.z + mmm0[2] * p2.z + mmm1[0] * p3.z + mmm1[1] * p4.z;
  float dw = temp0[0] * x0.w + temp0[1] * x1.w + temp0[2] * x2.w + temp1[0] * x3.w + temp1[1] * x4.w + mmm0[0] * p0.w + mmm0[1] * p1.w + mmm0[2] * p2.w + mmm1[0] * p3.w + mmm1[1] * p4.w;

  return vec4(dx, dy, dz, dw) * 49.0;
}

#define snoise4 simplexNoiseDerivatives

vec3 curl(in vec3 p, in float noiseTime, in float persistence) {
  vec4 xNoisePotentialDerivatives = vec4(0.0);
  vec4 yNoisePotentialDerivatives = vec4(0.0);
  vec4 zNoisePotentialDerivatives = vec4(0.0);

  for (int i = 0; i < 3; ++i) {
    float twoPowI = pow(2.0, float(i));
    float scale = 0.5 * twoPowI * pow(persistence, float(i));

    xNoisePotentialDerivatives += snoise4(vec4(p * twoPowI, noiseTime)) * scale;
    yNoisePotentialDerivatives += snoise4(vec4((p + vec3(123.4, 129845.6, -1239.1)) * twoPowI, noiseTime)) * scale;
    zNoisePotentialDerivatives += snoise4(vec4((p + vec3(-9519.0, 9051.0, -123.0)) * twoPowI, noiseTime)) * scale;
  }

  return vec3(
    zNoisePotentialDerivatives[1] - yNoisePotentialDerivatives[2],
    xNoisePotentialDerivatives[2] - zNoisePotentialDerivatives[0],
    yNoisePotentialDerivatives[0] - xNoisePotentialDerivatives[1]
  );
}
`;

const simulationShader = `
${curlShader}

uniform sampler2D textureDefaultPosition;
uniform float uTime;
uniform float uSpeed;
uniform float uDieSpeed;
uniform float uCurlSize;
uniform float uDeltaFrames;

void main() {
  vec2 uv = gl_FragCoord.xy / resolution.xy;
  vec4 positionInfo = texture2D(texturePosition, uv);
  vec3 position = positionInfo.xyz;
  float life = positionInfo.a - uDieSpeed * uDeltaFrames;

  if (life < 0.0) {
    vec4 defaultPosition = texture2D(textureDefaultPosition, uv);
    position = defaultPosition.xyz;
    life = 0.5 + fract(defaultPosition.w * 21.4131 + uTime);
  } else {
    vec3 flow = curl(position * uCurlSize, uTime, 0.1 + (1.0 - life) * 0.1);
    flow /= length(flow) + 1e-4;

    position += flow * uSpeed * uDeltaFrames;
  }

  gl_FragColor = vec4(position, life);
}
`;

const particleVertexShader = `
.#include <common>
.#include <shadowmap_pars_vertex>

uniform sampler2D texturePosition;
uniform sampler2D particleDataTexture;
uniform float uPointSize;
uniform vec3 uLightDirection;

attribute vec2 reference;

varying float vLife;
varying vec3 vColor;
varying vec3 vLightDir;
varying vec3 vViewDir;

const vec3 PALETTE[5] = vec3[5](
  vec3(1.0, 0.93, 0.1),
  vec3(0.37, 0.77, 1.0),
  vec3(1.0, 0.24, 0.73),
  vec3(1.0, 0.19, 0.19),
  vec3(0.64, 0.37, 1.0)
);

void main() {
  vec4 positionInfo = texture2D(texturePosition, reference);
  vec4 particleData = texture2D(particleDataTexture, reference);
  float sizeRandom = mix(0.5, 2.0, particleData.r);

  vLife = positionInfo.w;
  vColor = PALETTE[int(particleData.g + 0.5)];

  vec3 transformed = positionInfo.xyz;
  vec3 transformedNormal = vec3(0.0, 0.0, 1.0);
  vec4 worldPosition = modelMatrix * vec4(positionInfo.xyz, 1.0);
  vec4 mvPosition = viewMatrix * worldPosition;

  vLightDir = normalize((viewMatrix * vec4(uLightDirection, 0.0)).xyz);
  vViewDir = normalize(-mvPosition.xyz);

  .#include <shadowmap_vertex>

  gl_PointSize = uPointSize * sizeRandom / length(mvPosition.xyz) * smoothstep(0.0, 0.3, vLife);
  gl_Position = projectionMatrix * mvPosition;
}
`.replaceAll(".#include", "#include");

const particleFragmentShader = `
precision highp float;

.#include <common>
.#include <packing>

uniform bool receiveShadow;
uniform vec3 shadowColor;
uniform float shadowBlurRadius;
uniform float uLightPower;
uniform float uShadowPower;

.#include <shadowmap_pars_fragment>
.#include <shadowmask_pars_fragment>

varying float vLife;
varying vec3 vColor;
varying vec3 vLightDir;
varying vec3 vViewDir;

#define SHADOW_BLUR_TAPS 12

float shadowRotationNoise(vec2 p) {
  return fract(52.9829189 * fract(dot(p, vec2(0.06711056, 0.00583715))));
}

float getBlurredShadowMask() {
  #if defined(USE_SHADOWMAP) && NUM_DIR_LIGHT_SHADOWS > 0
    if (!receiveShadow) return 1.0;

    DirectionalLightShadow shadow = directionalLightShadows[0];
    vec4 baseCoord = vDirectionalShadowCoord[0];
    vec2 texel = (1.0 / shadow.shadowMapSize) * shadowBlurRadius * baseCoord.w;
    float phi = shadowRotationNoise(gl_FragCoord.xy) * 6.28318530718;
    float sum = 0.0;

    for (int i = 0; i < SHADOW_BLUR_TAPS; i++) {
      float r = sqrt((float(i) + 0.5) / float(SHADOW_BLUR_TAPS));
      float theta = float(i) * 2.39996323 + phi;
      vec2 off = r * vec2(cos(theta), sin(theta));
      vec4 coord = baseCoord;
      coord.xy += off * texel;
      sum += getShadow(
        directionalShadowMap[0],
        shadow.shadowMapSize,
        shadow.shadowIntensity,
        shadow.shadowBias,
        shadow.shadowRadius,
        coord
      );
    }

    return sum / float(SHADOW_BLUR_TAPS);
  #else
    return 1.0;
  #endif
}

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  uv.y = -uv.y;

  float r2 = dot(uv, uv);
  if (r2 > 1.0) discard;

  vec3 normal = vec3(uv, sqrt(max(0.0, 1.0 - r2)));
  vec3 lightDir = normalize(vLightDir);
  vec3 viewDir = normalize(vViewDir);

  float diffuse = max(dot(normal, lightDir) * 0.5 + 0.5, 0.0);
  diffuse *= diffuse;

  vec3 halfDir = normalize(lightDir + viewDir);
  float specular = pow(max(dot(normal, halfDir), 0.0), 48.0);
  float fresnel = pow(1.0 - max(dot(normal, viewDir), 0.0), 1.0);

  float shadowMask = getBlurredShadowMask();
  shadowMask = pow(shadowMask, 3.0);

  vec3 ambient = vColor * 0.5;
  vec3 diffuseTerm = vColor * (0.8 * diffuse);
  vec3 specularTerm = vec3(1.0) * (0.6 * specular);
  vec3 rimTerm = vColor * (0.4 * fresnel);
  vec3 color = ambient + (diffuseTerm + specularTerm + rimTerm) * shadowMask * uLightPower;
  float shadowAmount = clamp((1.0 - shadowMask) * uShadowPower, 0.0, 1.0);
  color = mix(color, shadowColor, shadowAmount);

  gl_FragColor = vec4(color, 1.0);
}
`.replaceAll(".#include", "#include");

const depthVertexShader = `
uniform sampler2D texturePosition;
uniform float uPointSize;
uniform float uDepthOffset;

attribute vec2 reference;

varying float vLife;

void main() {
  vec4 positionInfo = texture2D(texturePosition, reference);
  vLife = positionInfo.w;

  vec4 mvPosition = modelViewMatrix * vec4(positionInfo.xyz, 1.0);
  mvPosition.z += uDepthOffset;

  gl_PointSize = uPointSize;
  gl_Position = projectionMatrix * mvPosition;
}
`;

const depthFragmentShader = `
.#include <common>
.#include <packing>

varying float vLife;

void main() {
  if (vLife < 0.01) discard;

  vec2 coord = gl_PointCoord - 0.5;
  if (dot(coord, coord) > 0.25) discard;

  gl_FragColor = packDepthToRGBA(gl_FragCoord.z);
}
`.replaceAll(".#include", "#include");

const motionVertexShader = `
uniform sampler2D texturePosition;
uniform sampler2D texturePrevPosition;
uniform sampler2D particleDataTexture;
uniform float uPointSize;
uniform mat4 uPrevModelViewMatrix;

attribute vec2 reference;

varying vec2 vMotion;

void main() {
  vec4 positionInfo = texture2D(texturePosition, reference);
  vec4 prevPositionInfo = texture2D(texturePrevPosition, reference);
  vec4 particleData = texture2D(particleDataTexture, reference);
  float sizeRandom = mix(0.75, 2.0, particleData.r);

  vec3 transformed = positionInfo.xyz;
  vec4 mvPosition = viewMatrix * modelMatrix * vec4(transformed, 1.0);
  vec4 pos = projectionMatrix * mvPosition;
  vec4 prevPos = projectionMatrix * uPrevModelViewMatrix * vec4(prevPositionInfo.xyz, 1.0);

  gl_PointSize = uPointSize * sizeRandom / length(mvPosition.xyz) * smoothstep(0.0, 0.3, positionInfo.w);
  gl_Position = pos;
  vMotion = (pos.xy / pos.w - prevPos.xy / prevPos.w) * 0.5 * step(positionInfo.w, prevPositionInfo.w);
}
`;

const motionFragmentShader = `
uniform float uMotionMultiplier;

varying vec2 vMotion;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  if (dot(uv, uv) > 1.0) discard;

  gl_FragColor = vec4(vMotion * uMotionMultiplier, 0.0, 1.0);
}
`;

const blurVertexShader = `
varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}
`;

const blurFragmentShader = `
uniform sampler2D tDiffuse;
uniform sampler2D uVelocity;
uniform vec2 uResolution;
uniform float uMaxDistance;
uniform float uMotionMultiplier;
uniform float uLeaning;

varying vec2 vUv;

void main() {
  vec2 motion = texture2D(uVelocity, vUv).xy;
  vec2 offset = motion * uResolution * uMotionMultiplier;
  float offsetDistance = length(offset);
  if (offsetDistance > uMaxDistance) {
    offset = normalize(offset) * uMaxDistance;
  }

  vec2 delta = -offset / uResolution * 2.0 / float(SAMPLE_COUNT);
  vec2 pos = vUv - delta * uLeaning * float(SAMPLE_COUNT);
  vec3 color = vec3(0.0);

  for (int i = 0; i < SAMPLE_COUNT; i++) {
    color += texture2D(tDiffuse, pos).rgb;
    pos += delta;
  }

  gl_FragColor = vec4(color / float(SAMPLE_COUNT), 1.0);
}
`;

const gpuCompute = new GPUComputationRenderer(simSize, simSize, renderer);
const positionTexture = gpuCompute.createTexture();
const defaultPositionTexture = gpuCompute.createTexture();
const particleDataTexture = gpuCompute.createTexture();

function fillTextures() {
  const positionData = positionTexture.image.data;
  const defaultData = defaultPositionTexture.image.data;
  const particleData = particleDataTexture.image.data;

  for (let i = 0; i < positionData.length; i += 4) {
    const r = Math.cbrt(Math.random()) * particleRadius;
    const phi = (Math.random() * 2 - 1) * Math.PI * 0.5;
    const theta = Math.random() * Math.PI * 2;
    const x = r * Math.cos(theta) * Math.cos(phi);
    const y = r * Math.sin(phi);
    const z = r * Math.sin(theta) * Math.cos(phi);
    const life = Math.random();

    positionData[i] = defaultData[i] = x;
    positionData[i + 1] = defaultData[i + 1] = y;
    positionData[i + 2] = defaultData[i + 2] = z;
    positionData[i + 3] = defaultData[i + 3] = life;
    particleData[i] = Math.pow(Math.random(), 5.0);
    particleData[i + 1] = Math.floor(Math.random() * 5);
  }
}

fillTextures();
defaultPositionTexture.needsUpdate = true;

const positionVariable = gpuCompute.addVariable("texturePosition", simulationShader, positionTexture);
Object.assign(positionVariable.material.uniforms, {
  textureDefaultPosition: { value: defaultPositionTexture },
  uTime: { value: 0 },
  uSpeed: { value: 0.45 },
  uDieSpeed: { value: 0.009 },
  uCurlSize: { value: 0.015 },
  uDeltaFrames: { value: 1.0 },
});

gpuCompute.setVariableDependencies(positionVariable, [positionVariable]);
const gpuError = gpuCompute.init();
if (gpuError !== null) {
  console.error("GPUComputationRenderer init error:", gpuError);
}

const pointsGeometry = new THREE.BufferGeometry();
const pointPositions = new Float32Array(particleCount * 3);
const references = new Float32Array(particleCount * 2);
for (let i = 0; i < particleCount; i += 1) {
  references[i * 2] = (i % simSize) / simSize;
  references[i * 2 + 1] = Math.floor(i / simSize) / simSize;
}
pointsGeometry.setAttribute("position", new THREE.BufferAttribute(pointPositions, 3));
pointsGeometry.setAttribute("reference", new THREE.BufferAttribute(references, 2));

const particleMaterial = new THREE.ShaderMaterial({
  lights: true,
  uniforms: THREE.UniformsUtils.merge([
    THREE.UniformsLib.lights,
    {
      texturePosition: { value: null },
      particleDataTexture: { value: particleDataTexture },
      uPointSize: { value: 3000 },
      uLightDirection: { value: lightDirection },
      shadowColor: { value: new THREE.Color(0x2f4c52) },
      shadowBlurRadius: { value: 2.0 },
      uLightPower: { value: 1.0 },
      uShadowPower: { value: 1.0 },
    },
  ]),
  vertexShader: particleVertexShader,
  fragmentShader: particleFragmentShader,
  blending: THREE.NoBlending,
});

const particles = new THREE.Points(pointsGeometry, particleMaterial);
particles.frustumCulled = false;
particles.castShadow = true;
particles.receiveShadow = true;
particles.customDepthMaterial = new THREE.ShaderMaterial({
  uniforms: {
    texturePosition: { value: null },
    uPointSize: { value: 1.5 },
    uDepthOffset: { value: particleRadius * 0.05 },
  },
  vertexShader: depthVertexShader,
  fragmentShader: depthFragmentShader,
});
scene.add(particles);

const motionSettings = {
  multiplier: 1.5,
  maxDistance: 120,
  leaning: 0.5,
  targetFPS: 120,
  sampleCount: 21,
};
const previousModelViewMatrix = new THREE.Matrix4();
const currentModelViewMatrix = new THREE.Matrix4();
let motionMatrixInitialized = false;

const velocityTarget = new THREE.WebGLRenderTarget(1, 1, {
  minFilter: THREE.NearestFilter,
  magFilter: THREE.NearestFilter,
  type: THREE.HalfFloatType,
  depthBuffer: true,
});

const motionMaterial = new THREE.ShaderMaterial({
  uniforms: {
    texturePosition: { value: null },
    texturePrevPosition: { value: null },
    particleDataTexture: { value: particleDataTexture },
    uPointSize: { value: pointSizeBase },
    uPrevModelViewMatrix: { value: new THREE.Matrix4() },
    uMotionMultiplier: { value: 1 },
  },
  vertexShader: motionVertexShader,
  fragmentShader: motionFragmentShader,
  blending: THREE.NoBlending,
});

const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, camera));
const motionBlurPass = new ShaderPass({
  defines: { SAMPLE_COUNT: motionSettings.sampleCount },
  uniforms: {
    tDiffuse: { value: null },
    uVelocity: { value: velocityTarget.texture },
    uResolution: { value: new THREE.Vector2(1, 1) },
    uMaxDistance: { value: motionSettings.maxDistance },
    uMotionMultiplier: { value: motionSettings.multiplier },
    uLeaning: { value: motionSettings.leaning },
  },
  vertexShader: blurVertexShader,
  fragmentShader: blurFragmentShader,
});
composer.addPass(motionBlurPass);

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getSpeed() {
  return Number(speedInput.value) / 50;
}

function getCurlSize() {
  return Number(curlInput.value) / 500;
}

function getDieSpeed() {
  return Number(lifeInput.value) / 1500;
}

function getLightDirection() {
  const azimuth = THREE.MathUtils.degToRad(Number(lightAzimuthInput.value));
  const elevation = THREE.MathUtils.degToRad(Number(lightHeightInput.value));
  const horizontal = Math.cos(elevation);
  return new THREE.Vector3(
    Math.cos(azimuth) * horizontal,
    Math.sin(elevation),
    Math.sin(azimuth) * horizontal,
  ).normalize();
}

function updateVisualControls() {
  const speed = getSpeed();
  const curlSize = getCurlSize();
  const dieSpeed = getDieSpeed();
  const lightPower = Number(lightPowerInput.value) / 100;
  const shadowPower = Number(shadowInput.value) / 2;
  const shadowBlur = Number(shadowInput.value);
  pointSizeBase = Number(sizeInput.value);

  speedValue.value = speed.toFixed(2);
  curlValue.value = curlSize.toFixed(3);
  lifeValue.value = dieSpeed.toFixed(3);
  sizeValue.value = String(pointSizeBase);
  lightAzimuthValue.value = String(lightAzimuthInput.value);
  lightHeightValue.value = String(lightHeightInput.value);
  lightPowerValue.value = lightPower.toFixed(2);
  shadowValue.value = shadowBlur.toFixed(1);

  const direction = getLightDirection();
  lightDirection.copy(direction);
  light.position.copy(direction).multiplyScalar(particleRadius * 4);
  light.intensity = lightPower;

  const simUniforms = positionVariable.material.uniforms;
  simUniforms.uSpeed.value = speed;
  simUniforms.uCurlSize.value = curlSize;
  simUniforms.uDieSpeed.value = dieSpeed;

  particleMaterial.uniforms.uLightDirection.value.copy(direction);
  particleMaterial.uniforms.shadowBlurRadius.value = shadowBlur;
  particleMaterial.uniforms.uLightPower.value = lightPower;
  particleMaterial.uniforms.uShadowPower.value = shadowPower;
  updatePointSize();
}

function parseMeter(value) {
  const [numerator, denominator] = value.split("/").map((part) => Number(part));
  return {
    numerator: clamp(Number.isFinite(numerator) ? numerator : 4, 1, 12),
    denominator: clamp(Number.isFinite(denominator) ? denominator : 4, 1, 16),
  };
}

function getBeatSeconds() {
  return 60 / rhythm.bpm;
}

function getSubdivisionMode() {
  return subdivisionModes[rhythm.subdivision] || subdivisionModes.auto;
}

function setText(element, value) {
  if (element) {
    element.textContent = value;
  }
}

function renderBeatDots(container, activeBeat, dotClass) {
  if (!container) return;
  container.style.setProperty("--beats", rhythm.meter.numerator);
  if (container.dataset.beats !== String(rhythm.meter.numerator) || container.dataset.dotClass !== dotClass) {
    container.replaceChildren();
    for (let i = 1; i <= rhythm.meter.numerator; i += 1) {
      container.appendChild(document.createElement("span"));
    }
    container.dataset.beats = String(rhythm.meter.numerator);
    container.dataset.dotClass = dotClass;
  }

  Array.from(container.children).forEach((dot, index) => {
    const beat = index + 1;
    dot.className = `${dotClass}${beat === 1 ? " downbeat" : ""}${beat === activeBeat ? " active" : ""}`;
  });
}

function updateRhythmLabels(activeBeat = 1, isCountIn = false) {
  setText(tempoLabel, `${rhythm.bpm} BPM`);
  const tableBeat = activeBeat + getSubdivisionMode().fraction;
  const countInText = rhythm.countInBars > 0 ? ` · count ${rhythm.countInBars} bar` : "";
  const beatLabel = isCountIn ? "count" : "hit";
  setText(
    meterLabel,
    `${rhythm.meter.numerator}/${rhythm.meter.denominator} · ${getSubdivisionMode().label} · ${beatLabel} ${activeBeat}, table ${tableBeat.toFixed(2).replace(/0$/, "")}${countInText}`,
  );
  setText(miniBeatReadout, `${rhythm.bpm} BPM · ${rhythm.meter.numerator}/${rhythm.meter.denominator}`);
  renderBeatDots(beatStrip, activeBeat, "beat-dot");
  renderBeatDots(miniBeatStrip, activeBeat, "mini-beat-dot");
}

function applyClickVolume() {
  if (!rhythmAudio.master) return;
  const gain = Math.pow(clamp(rhythm.clickVolume, 0, 1), 1.6) * 2.8;
  rhythmAudio.master.gain.rampTo(gain, 0.02);
}

function configureTransport() {
  if (typeof Tone === "undefined") return;
  Tone.Transport.bpm.value = rhythm.bpm;
  Tone.Transport.timeSignature = [rhythm.meter.numerator, rhythm.meter.denominator];
}

function initRhythmAudio() {
  if (rhythmAudio.ready || typeof Tone === "undefined") return;
  rhythmAudio.master = new Tone.Gain(2.4).toDestination();
  rhythmAudio.hitTone = new Tone.MembraneSynth({
    pitchDecay: 0.008,
    octaves: 0.55,
    oscillator: { type: "square" },
    envelope: { attack: 0.001, decay: 0.016, sustain: 0, release: 0.004 },
  }).connect(rhythmAudio.master);
  rhythmAudio.downbeatTone = new Tone.Synth({
    oscillator: { type: "sine" },
    envelope: { attack: 0.001, decay: 0.12, sustain: 0, release: 0.02 },
  }).connect(rhythmAudio.master);
  rhythmAudio.ready = true;
  applyClickVolume();
  configureTransport();
}

async function unlockRhythmAudio() {
  if (typeof Tone === "undefined") return;
  await Tone.start();
  initRhythmAudio();
}

function playClick(accent, time) {
  if (!rhythmAudio.ready) return;
  rhythmAudio.hitTone.triggerAttackRelease(accent ? "C3" : "G2", accent ? "16n" : "32n", time, accent ? 0.82 : 0.56);
  if (accent) {
    rhythmAudio.downbeatTone.triggerAttackRelease("C5", "32n", time, 0.22);
  }
}

function triggerRhythmBeat(time) {
  const wrappedBeatIndex = ((rhythm.beatIndex % rhythm.meter.numerator) + rhythm.meter.numerator) % rhythm.meter.numerator;
  const activeBeat = wrappedBeatIndex + 1;
  const isCountIn = rhythm.beatIndex < 0;
  const accent = activeBeat === 1;
  playClick(accent, time);
  window.AmbientMetronomePanel.pulse(playPauseButton);
  rhythmPulse = Math.min(1.6, rhythmPulse + (accent ? 1.1 : 0.62));
  rhythmAccent = accent ? 1 : Math.max(rhythmAccent, 0.32);
  updateRhythmLabels(activeBeat, isCountIn);
  rhythm.beatIndex += 1;
}

function tickRhythm() {
  if (!rhythm.isPlaying || typeof Tone === "undefined") return;
  const secondsPerBeat = getBeatSeconds();
  const lookahead = Tone.Transport.seconds + 0.1;
  while (rhythm.nextBeatTime < lookahead) {
    triggerRhythmBeat(Tone.now() + Math.max(0, rhythm.nextBeatTime - Tone.Transport.seconds));
    rhythm.nextBeatTime += secondsPerBeat;
  }
}

function resetRhythm() {
  rhythm.beatIndex = -rhythm.countInBars * rhythm.meter.numerator;
  rhythm.nextBeatTime = typeof Tone !== "undefined" ? Tone.Transport.seconds + 0.06 : 0;
  rhythm.countInBeatsRemaining = rhythm.countInBars * rhythm.meter.numerator;
  rhythmPulse = 0;
  rhythmAccent = 0;
  updateRhythmLabels(1);
}

function applyRhythmInputs() {
  rhythm.bpm = clamp(Math.round(Number(bpmInput.value) || 68), 40, 240);
  bpmInput.value = rhythm.bpm;
  rhythm.meter = parseMeter(meterSelect.value);
  rhythm.subdivision = subdivisionModes[subdivisionSelect.value] ? subdivisionSelect.value : "auto";
  rhythm.countInBars = clamp(Math.round(Number(countInSelect.value) || 0), 0, 2);
  rhythm.clickVolume = clamp(Number(clickVolumeInput.value) / 100, 0, 1);
  setText(clickVolumeLabel, `${Math.round(rhythm.clickVolume * 100)}%`);
  configureTransport();
  applyClickVolume();
  const wrappedBeatIndex = ((rhythm.beatIndex % rhythm.meter.numerator) + rhythm.meter.numerator) % rhythm.meter.numerator;
  updateRhythmLabels(wrappedBeatIndex + 1, rhythm.beatIndex < 0);
}

async function toggleRhythmPlayback() {
  await unlockRhythmAudio();
  if (typeof Tone === "undefined") return;
  rhythm.isPlaying = !rhythm.isPlaying;
  if (rhythm.isPlaying) {
    Tone.Transport.stop();
    Tone.Transport.start("+0.02");
    rhythm.nextBeatTime = Tone.Transport.seconds + 0.06;
    rhythm.beatIndex = -rhythm.countInBars * rhythm.meter.numerator;
    rhythm.countInBeatsRemaining = rhythm.countInBars * rhythm.meter.numerator;
    window.AmbientMetronomePanel.setPlaying(playPauseButton, true);
    showRhythmPanel(1800);
  } else {
    Tone.Transport.pause();
    window.AmbientMetronomePanel.setPlaying(playPauseButton, false);
    syncRhythmPanelVisibility();
  }
}

function showRhythmPanel(duration = 2400) {
  rhythmPanelDismissed = false;
  if (!rhythm.isPlaying) {
    syncRhythmPanelVisibility();
    return;
  }
  document.body.classList.add("rhythm-visible");
  window.clearTimeout(rhythmPanelHideTimer);
  if (duration <= 0) return;
  rhythmPanelHideTimer = window.setTimeout(() => {
    if (!rhythm.isPlaying) {
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
  document.body.classList.toggle("rhythm-pinned", !rhythm.isPlaying && !rhythmPanelDismissed);
  if (!rhythm.isPlaying) {
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
  if (event.target.closest(".controls")) return;
  const isVisible = document.body.classList.contains("rhythm-visible") || document.body.classList.contains("rhythm-pinned");
  if (isVisible) {
    hideRhythmPanel();
    return;
  }
  showRhythmPanel(0);
}

function handleRhythmPointerMove(event) {
  if (event.pointerType && event.pointerType !== "mouse") return;
  const now = performance.now();
  if (now - lastRhythmPointerMove < 80) return;
  lastRhythmPointerMove = now;
  const proximity = window.innerWidth <= 720 ? 230 : 170;
  if (window.innerHeight - event.clientY <= proximity) {
    showRhythmPanel(rhythm.isPlaying ? 2200 : 0);
  }
}

function reset() {
  fillTextures();
  positionTexture.needsUpdate = true;
  defaultPositionTexture.needsUpdate = true;
  particleDataTexture.needsUpdate = true;
  gpuCompute.renderTexture(positionTexture, gpuCompute.getCurrentRenderTarget(positionVariable));
  gpuCompute.renderTexture(positionTexture, gpuCompute.getAlternateRenderTarget(positionVariable));
}

function renderVelocity(delta) {
  camera.updateMatrixWorld();
  particles.updateMatrixWorld();

  const view = currentModelViewMatrix.copy(camera.matrixWorld).invert().multiply(particles.matrixWorld);
  if (!motionMatrixInitialized) {
    previousModelViewMatrix.copy(view);
    motionMatrixInitialized = true;
  }

  const currentPositionTexture = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
  const previousPositionTexture = gpuCompute.getAlternateRenderTarget(positionVariable).texture;
  motionMaterial.uniforms.texturePosition.value = currentPositionTexture;
  motionMaterial.uniforms.texturePrevPosition.value = previousPositionTexture;
  motionMaterial.uniforms.uPrevModelViewMatrix.value.copy(previousModelViewMatrix);
  motionMaterial.uniforms.uPointSize.value = particleMaterial.uniforms.uPointSize.value;
  motionMaterial.uniforms.uMotionMultiplier.value = 1;

  const previousOverride = scene.overrideMaterial;
  const previousClear = renderer.getClearColor(new THREE.Color());
  const previousAlpha = renderer.getClearAlpha();

  scene.overrideMaterial = motionMaterial;
  renderer.setRenderTarget(velocityTarget);
  renderer.setClearColor(0x000000, 0);
  renderer.clear();
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);

  scene.overrideMaterial = previousOverride;
  renderer.setClearColor(previousClear, previousAlpha);

  const fpsRatio = Math.min(1, 1 / Math.max(delta, 1e-4) / motionSettings.targetFPS);
  motionBlurPass.uniforms.uMotionMultiplier.value = motionSettings.multiplier * fpsRatio;
  motionBlurPass.uniforms.uMaxDistance.value = motionSettings.maxDistance;
  motionBlurPass.uniforms.uLeaning.value = motionSettings.leaning;
  previousModelViewMatrix.copy(view);
}

function beginCameraDrag(event) {
  if (event.target.closest(".controls")) return;
  isDraggingCamera = true;
  dragStartX = event.clientX;
  dragStartY = event.clientY;
  dragStartTheta = targetCameraTheta;
  dragStartPhi = targetCameraPhi;
  canvas.setPointerCapture(event.pointerId);
}

function dragCamera(event) {
  if (!isDraggingCamera) return;
  targetCameraTheta = dragStartTheta - (event.clientX - dragStartX) * 0.006;
  targetCameraPhi = clamp(dragStartPhi + (event.clientY - dragStartY) * 0.0048, 0.35, Math.PI - 0.35);
}

function endCameraDrag(event) {
  isDraggingCamera = false;
  if (canvas.hasPointerCapture(event.pointerId)) {
    canvas.releasePointerCapture(event.pointerId);
  }
}

function zoomCamera(event) {
  if (event.target.closest(".controls")) return;
  event.preventDefault();
  targetCameraDistance = clamp(targetCameraDistance + event.deltaY * 0.12, 120, 360);
}

function updateCamera(delta) {
  const smoothing = 1 - Math.pow(0.0008, delta);
  cameraTheta += (targetCameraTheta - cameraTheta) * smoothing;
  cameraPhi += (targetCameraPhi - cameraPhi) * smoothing;
  cameraDistance += (targetCameraDistance - cameraDistance) * smoothing;

  const sinPhi = Math.sin(cameraPhi);
  camera.position.x = Math.sin(cameraTheta) * sinPhi * cameraDistance;
  camera.position.y = Math.cos(cameraPhi) * cameraDistance;
  camera.position.z = Math.cos(cameraTheta) * sinPhi * cameraDistance;
  camera.lookAt(0, 0, 0);
}

function updatePointSize() {
  const aspect = window.innerWidth / window.innerHeight;
  particleMaterial.uniforms.uPointSize.value = aspect < 16 / 9
    ? pointSizeBase * Math.max(aspect / (16 / 9), 0.75)
    : pointSizeBase;
  motionMaterial.uniforms.uPointSize.value = particleMaterial.uniforms.uPointSize.value;
}

function resize() {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const aspect = width / height;
  renderer.setSize(width, height, false);
  camera.aspect = aspect;
  targetCameraDistance = Math.max(targetCameraDistance, 360);
  cameraDistance = Math.max(cameraDistance, targetCameraDistance);
  updatePointSize();
  composer.setSize(width, height);
  const pixelRatio = renderer.getPixelRatio();
  velocityTarget.setSize(width * pixelRatio, height * pixelRatio);
  const drawingSize = renderer.getDrawingBufferSize(new THREE.Vector2());
  motionBlurPass.uniforms.uResolution.value.set(drawingSize.x, drawingSize.y);
  camera.updateProjectionMatrix();
}

function animate(now) {
  const delta = Math.min((now - lastFrameTime) / 1000, 0.05);
  lastFrameTime = now;

  const elapsed = clock.getElapsedTime();
  tickRhythm();
  rhythmPulse *= Math.pow(0.05, delta);
  rhythmAccent *= Math.pow(0.08, delta);

  const simUniforms = positionVariable.material.uniforms;
  simUniforms.uTime.value = elapsed;
  simUniforms.uDeltaFrames.value = Math.min(delta * 60, 4);
  gpuCompute.compute();

  particleMaterial.uniforms.texturePosition.value = gpuCompute.getCurrentRenderTarget(positionVariable).texture;
  particles.customDepthMaterial.uniforms.texturePosition.value = particleMaterial.uniforms.texturePosition.value;

  updateCamera(delta);
  renderVelocity(delta);
  composer.render();
  requestAnimationFrame(animate);
}

[speedInput, curlInput, lifeInput, sizeInput, lightAzimuthInput, lightHeightInput, lightPowerInput, shadowInput].forEach((input) => {
  input.addEventListener("input", updateVisualControls);
});

resetButton.addEventListener("click", reset);
[bpmInput, meterSelect, subdivisionSelect, countInSelect].forEach((input) => {
  input.addEventListener("input", applyRhythmInputs);
  input.addEventListener("change", resetRhythm);
});
clickVolumeInput.addEventListener("input", applyRhythmInputs);
playPauseButton.addEventListener("click", toggleRhythmPlayback);
rhythmResetButton.addEventListener("click", resetRhythm);
window.addEventListener("pointerdown", unlockRhythmAudio, { once: true });
window.addEventListener("pointerdown", handleRhythmPointerDown);
window.addEventListener("pointermove", handleRhythmPointerMove);
rhythmPanel?.addEventListener("pointerenter", () => showRhythmPanel(0));
rhythmPanel?.addEventListener("focusin", () => showRhythmPanel(0));
rhythmPanel?.addEventListener("input", () => showRhythmPanel(0));
canvas.addEventListener("pointerdown", beginCameraDrag);
canvas.addEventListener("pointermove", dragCamera);
canvas.addEventListener("pointerup", endCameraDrag);
canvas.addEventListener("pointercancel", endCameraDrag);
canvas.addEventListener("wheel", zoomCamera, { passive: false });
window.addEventListener("resize", resize);

updateVisualControls();
applyRhythmInputs();
syncRhythmPanelVisibility();
resize();
updateCamera(1);
requestAnimationFrame(animate);
