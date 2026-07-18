interface WorkerMessage {
  type: 'init' | 'resize' | 'pointer' | 'intensity' | 'pause'
  canvas?: OffscreenCanvas
  width?: number
  height?: number
  dpr?: number
  x?: number
  y?: number
  value?: number
  paused?: boolean
}

let gl: WebGL2RenderingContext | null = null
let program: WebGLProgram | null = null
let resolution: WebGLUniformLocation | null = null
let time: WebGLUniformLocation | null = null
let pointer: WebGLUniformLocation | null = null
let intensityLocation: WebGLUniformLocation | null = null
let width = 1
let height = 1
let dpr = 1
let pointerX = 0.5
let pointerY = 0.5
let intensity = 0.55
let paused = false
let lastFrame = 0
const startedAt = performance.now()

const vertexSource = `#version 300 es
precision highp float;
const vec2 positions[3] = vec2[3](vec2(-1.0, -1.0), vec2(3.0, -1.0), vec2(-1.0, 3.0));
void main() { gl_Position = vec4(positions[gl_VertexID], 0.0, 1.0); }
`

const fragmentSource = `#version 300 es
precision highp float;
out vec4 outColor;
uniform vec2 uResolution;
uniform float uTime;
uniform vec2 uPointer;
uniform float uIntensity;

float hash(vec2 p) {
  return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
             mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 5; i++) {
    value += amplitude * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  vec2 uv = gl_FragCoord.xy / uResolution.xy;
  vec2 aspect = vec2(uResolution.x / uResolution.y, 1.0);
  vec2 p = (uv - 0.5) * aspect;
  float t = uTime * 0.035;
  vec2 drift = vec2(t, -t * 0.62) + (uPointer - 0.5) * 0.12;
  float mist = fbm(p * 1.9 + drift);
  float ridge = smoothstep(0.38, 0.84, mist + (1.0 - uv.y) * 0.28);
  vec3 teal = vec3(0.08, 0.25, 0.22);
  vec3 gold = vec3(0.87, 0.63, 0.29);
  vec3 light = mix(teal, gold, smoothstep(0.46, 0.82, mist + uv.x * 0.16));
  float glow = exp(-5.5 * distance(uv, vec2(0.72 + (uPointer.x - 0.5) * 0.08, 0.28)));
  float grain = (hash(gl_FragCoord.xy + floor(uTime * 12.0)) - 0.5) * 0.035;
  float alpha = (ridge * 0.34 + glow * 0.28) * uIntensity;
  outColor = vec4(light + grain, alpha);
}
`

function compile(type: number, source: string) {
  if (!gl) throw new Error('WebGL unavailable')
  const shader = gl.createShader(type)
  if (!shader) throw new Error('Shader allocation failed')
  gl.shaderSource(shader, source)
  gl.compileShader(shader)
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader) || 'Shader compilation failed')
  return shader
}

function initialize(canvas: OffscreenCanvas) {
  gl = canvas.getContext('webgl2', { alpha: true, antialias: false, depth: false, powerPreference: 'low-power' })
  if (!gl) throw new Error('WebGL2 unavailable')
  program = gl.createProgram()
  if (!program) throw new Error('Program allocation failed')
  gl.attachShader(program, compile(gl.VERTEX_SHADER, vertexSource))
  gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragmentSource))
  gl.linkProgram(program)
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) || 'Program link failed')
  resolution = gl.getUniformLocation(program, 'uResolution')
  time = gl.getUniformLocation(program, 'uTime')
  pointer = gl.getUniformLocation(program, 'uPointer')
  intensityLocation = gl.getUniformLocation(program, 'uIntensity')
  resize()
  requestAnimationFrame(render)
}

function resize() {
  if (!gl) return
  gl.canvas.width = Math.round(width * dpr)
  gl.canvas.height = Math.round(height * dpr)
  gl.viewport(0, 0, gl.canvas.width, gl.canvas.height)
}

function render(now: number) {
  requestAnimationFrame(render)
  if (!gl || !program || paused || now - lastFrame < 33) return
  lastFrame = now
  gl.clearColor(0, 0, 0, 0)
  gl.clear(gl.COLOR_BUFFER_BIT)
  gl.useProgram(program)
  gl.uniform2f(resolution, gl.canvas.width, gl.canvas.height)
  gl.uniform1f(time, (now - startedAt) / 1000)
  gl.uniform2f(pointer, pointerX, pointerY)
  gl.uniform1f(intensityLocation, intensity)
  gl.drawArrays(gl.TRIANGLES, 0, 3)
}

self.onmessage = (event: MessageEvent<WorkerMessage>) => {
  const message = event.data
  if (message.type === 'init' && message.canvas) initialize(message.canvas)
  if (message.type === 'resize') {
    width = message.width || width
    height = message.height || height
    dpr = Math.min(message.dpr || 1, 1.5)
    resize()
  }
  if (message.type === 'pointer') {
    pointerX = message.x ?? pointerX
    pointerY = message.y ?? pointerY
  }
  if (message.type === 'intensity') intensity = message.value ?? intensity
  if (message.type === 'pause') paused = Boolean(message.paused)
}
