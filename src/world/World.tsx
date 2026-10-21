import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DynamicDrawUsage,
  Euler,
  Matrix3,
  Matrix4,
  Plane,
  Points,
  Raycaster,
  ShaderMaterial,
  Vector2,
  Vector3,
} from 'three'
import { MEMBERS, heroPlacement, random } from './cloud'
import { CAM_Z, HH, arrive, close, cloud, eventLogo, halfWidth, icon, irisAt, logo, logoCount, photo, shape, shapeCount, slotAt, type Formation, type IconSample, type Layout, type PhotoSample, type ShapeKey } from './formations'
import { EVENT_LOGOS, LOGO_CUTS, sampleLogo, type EventKey, type LogoCut, type Pixels } from './logo'
import { loadLogo, sampleIcon, samplePhoto } from './sample'
import { score, topRight, type Frame, type Key } from './score'
import { meter, watchLoop } from './loop'
import { has } from './steps'
import { world } from './store'
import { BUDGET, LADDER, flatBudget, forcedPoints, startRung, type Budget, type Tier } from './tier'

// The world layer (docs/architecture.md, Two layers): one canvas fixed behind the whole page, one WebGL context, one
// field of points that holds a formation per act (formations.ts), driven by the score (score.ts), plus your point.

export type WorldProps = {
  tier: Exclude<Tier, 0>
  /** a forced tier holds its rung: the verification runs and the owner's phone checks see the tier they asked for */
  forced: boolean
  /** the field formed, time frozen and your point lit, for the baked posters */
  still: boolean
  onReady: () => void
  onLost: () => void
}

const GATHER = 3.2 // s, points stream in from the edges while the counter climbs to 600
const LIGHT = 0.9 // s, your point lights once the counter lands
const TRAIL = 16 // your point's light trail in flight (#17)
/** frame-rate independent easing toward a target, `k` per second */
const damp = (from: number, to: number, k: number, dt: number) => from + (to - from) * (1 - Math.exp(-k * dt))

const fieldVertex = /* glsl */ `
  attribute vec4 aA, aB, cA, cB, aR;
  uniform float uMix, uStag, uTime, uDrift, uPx, uScale, uLean, uFlash, uDim, uWave, uWaveR, uShift;
  uniform vec2 uPar, uPtr; uniform vec3 uPivot, uWaveO; uniform mat3 uRot;
  varying vec3 vC; varying float vA;
  void main() {
    float t = clamp((uMix - aR.x * uStag) / (1. - uStag + 1e-4), 0., 1.); t = t * t * (3. - 2. * t);
    vec4 P = mix(aA, aB, t); vec4 C = mix(cA, cB, t);
    vec3 p = P.xyz;
    p += vec3(sin(uTime * .3 + aR.y * 6.28), cos(uTime * .25 + aR.z * 6.28), sin(uTime * .2 + aR.w * 6.28)) * .12 * uDrift;
    p = uPivot + uRot * (p - uPivot);
    float near = clamp((p.z + 6.) / 12., 0., 1.);
    p.xy += uPar * (near - .4) * 1.4 * uLean;                       // parallax: near points swing more than far ones
    vec2 dv = uPtr - p.xy; p.xy += dv * exp(-dot(dv, dv) / 9.68) * .3 * uLean;   // the lean toward the pointer
    p.y += uShift;
    float glow = uWave >= 0. ? exp(-pow((length(p.xy - uWaveO.xy) - uWave * uWaveR) * 1.6, 2.)) : 0.;
    vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
    float cap = max(3., P.w * 1.35);
    gl_PointSize = clamp(P.w * (1. + glow * .9) * uPx * (uScale / -mv.z) * .09, 1., (cap + glow * 4.) * uPx);
    vC = mix(C.rgb, vec3(1.), max(uFlash, glow * .5));
    vA = C.a * uDim * (1. + glow * 1.4);
    if (vA < .003) gl_PointSize = 0.;
  }`
const fieldFragment = /* glsl */ `
  varying vec3 vC; varying float vA;
  void main() { float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; gl_FragColor = vec4(vC, vA * (1. - d * d)); }`

// your point: aquamarine glow with a white core; the halo falls off to nothing, never a ring or a dark disc. In flight,
// vertices 1..15 are its light trail.
const youVertex = /* glsl */ `
  attribute float aK; uniform float uPx, uSz, uMove; varying float vK;
  void main() {
    vK = aK; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.);
    float s = aK < .5 ? 1. : (1. - aK / 16.) * .55 * uMove;
    gl_PointSize = 130. * uPx * uSz * s;
  }`
const youFragment = /* glsl */ `
  uniform float uA, uMove; varying float vK;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard;
    float core = smoothstep(.09, .0, d), halo = pow(1. - d, 3.);
    float a = vK < .5 ? halo * .7 + core : halo * .5 * pow(1. - vK / 16., 1.6) * uMove;
    gl_FragColor = vec4(mix(vec3(.412, .769, .686), vec3(1.), vK < .5 ? core : 0.), a * uA);
  }`

const material = (uniforms: Record<string, { value: unknown }>, vertexShader: string, fragmentShader: string) =>
  new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending })

/** How many points each formation draws on a budget. */
const countOf = (k: Key, b: Budget) =>
  k === 'photo' ? b.peak : k === 'horizon' ? b.light : k === 'arrive' || k === 'icon' || k === 'cloud' || k === 'tight' || k.startsWith('close') ? b.hero : b.cuts

/** The field as plain three objects, built once per budget and mutated per frame outside React. */
function makeField(n: number) {
  const g = new BufferGeometry()
  const attr = (name: string) => {
    const a = new BufferAttribute(new Float32Array(n * 4), 4)
    a.setUsage(DynamicDrawUsage)
    g.setAttribute(name, a)
    return a
  }
  const slots = { aA: attr('aA'), aB: attr('aB'), cA: attr('cA'), cB: attr('cB') }
  // three needs a position attribute to count the points; the shader reads aA and aB instead
  g.setAttribute('position', new BufferAttribute(new Float32Array(n * 3), 3))
  const rnd = random(7)
  const r4 = new Float32Array(n * 4).map(() => rnd())
  g.setAttribute('aR', new BufferAttribute(r4, 4))
  const mat = material(
    {
      uMix: { value: 0 },
      uStag: { value: 0 },
      uTime: { value: 0 },
      uDrift: { value: 1 },
      uPx: { value: 1 },
      uScale: { value: 600 },
      uLean: { value: 0 },
      uFlash: { value: 0 },
      uDim: { value: 1 },
      uWave: { value: -1 },
      uWaveR: { value: 14 },
      uShift: { value: 0 },
      uPar: { value: new Vector2() },
      uPtr: { value: new Vector2(99, 99) },
      uPivot: { value: new Vector3() },
      uWaveO: { value: new Vector3() },
      uRot: { value: new Matrix3() },
    },
    fieldVertex,
    fieldFragment,
  )
  const points = new Points(g, mat)
  points.frustumCulled = false
  // relit: a formation on screen was swapped for its file's version, and flashes like a cut
  return { points, mat, slots, n, keys: { a: '', b: '' }, relit: false, dispose: () => (g.dispose(), mat.dispose()) }
}

function makeYou() {
  const g = new BufferGeometry()
  const pos = new BufferAttribute(new Float32Array(TRAIL * 3), 3)
  pos.setUsage(DynamicDrawUsage)
  g.setAttribute('position', pos)
  g.setAttribute('aK', new BufferAttribute(Float32Array.from({ length: TRAIL }, (_, i) => i), 1))
  const mat = material({ uA: { value: 0 }, uPx: { value: 1 }, uSz: { value: 1 }, uMove: { value: 0 } }, youVertex, youFragment)
  const points = new Points(g, mat)
  points.frustumCulled = false
  points.renderOrder = 1
  return { points, mat, pos, dispose: () => (g.dispose(), mat.dispose()) }
}

type Samples = { icon: IconSample | null | false; photo: PhotoSample | null | false; logos: Partial<Record<LogoCut | EventKey, Pixels>> }

const RAMP = forcedPoints(location.search)
const FPS = new URLSearchParams(location.search).has('fps')

/**
 * `?fps`: a small live readout of the frame rate, the points drawn and the pixel ratio, for the owner's phone checks.
 * While the world isn't drawing (a hidden tab, an opaque act over it) it says so, so it never shows a stale act.
 */
function useFpsReadout() {
  const el = useRef<HTMLElement | null>(null)
  useEffect(() => {
    if (!FPS) return
    const d = document.createElement('output')
    d.className = 'fps'
    d.setAttribute('aria-hidden', 'true')
    document.body.append(d)
    el.current = d
    return () => d.remove()
  }, [])
  // one readout for the canvas's life, so the loop's watcher below never resubscribes
  const [read] = useState(() => {
    const m = meter()
    let rate = '…'
    let line = ''
    const show = (text: string) => el.current && text !== line && (el.current.textContent = line = text)
    return {
      // the rate settles once a second; the act is read every frame, so it is never one the scroll has left
      frame(now: number, points: number, dpr: number) {
        if (!el.current) return
        const r = m(now)
        if (r !== null) rate = String(Math.round(r))
        show(`${rate} fps · ${points.toLocaleString('en')} points · DPR ${dpr} · ${world.act || 'top'}`)
      },
      idle() {
        m.pause()
        rate = '…'
        show('idle · not drawing')
      },
    }
  })
  return read
}

function Field({ budget, still, onReady }: { budget: 1 | 2; still: boolean; onReady: () => void }) {
  const scene = useThree((s) => s.scene)
  const gl = useThree((s) => s.gl)
  const setFrameloop = useThree((s) => s.setFrameloop)
  const B = RAMP ? flatBudget(RAMP) : BUDGET[budget]
  const fps = useFpsReadout()
  const field = useRef<ReturnType<typeof makeField> | null>(null)
  const you = useRef<ReturnType<typeof makeYou> | null>(null)
  const samples = useRef<Samples>({ icon: null, photo: null, logos: {} })
  const cache = useRef(new Map<string, Formation>())

  useEffect(() => {
    const f = makeField(B.peak)
    const y = makeYou()
    field.current = f
    you.current = y
    scene.add(f.points, y.points)
    cache.current.clear()
    return () => {
      scene.remove(f.points, y.points)
      f.dispose()
      y.dispose()
      field.current = you.current = null
    }
  }, [scene, B.peak])

  // the two formations drawn from files; either one failing leaves its fallback (the cloud, the photo's DOM entrance)
  useEffect(() => {
    let gone = false
    sampleIcon(MEMBERS).then(
      (s) => !gone && (samples.current.icon = s),
      () => !gone && (samples.current.icon = false),
    )
    samplePhoto(Math.floor(B.peak * 0.9)).then(
      (s) => {
        if (gone) return
        samples.current.photo = s
        // the peak's photo 1 now waits for the points to form it (ClubLifePeak, index.css)
        if (has('resolve')) document.documentElement.classList.add('w-resolve')
      },
      () => !gone && (samples.current.photo = false),
    )
    // the logo formations (#29): until a file lands, or if it fails, its cut keeps the comp's shape
    // the events' logos (#32) too: once all four have landed the box above each event's name opens, where they draw;
    // one that fails leaves every box closed, so no name sits under an empty box and every event keeps its formation
    const files = [...Object.entries(LOGO_CUTS), ...Object.entries(EVENT_LOGOS)] as [LogoCut | EventKey, string][]
    for (const [key, src] of files)
      loadLogo(src).then(
        (px) => {
          if (gone) return
          samples.current.logos[key] = px
          const all = Object.keys(EVENT_LOGOS).every((k) => k in samples.current.logos)
          if (key in EVENT_LOGOS && all && has('cuts')) document.documentElement.classList.add('w-logos')
          cache.current.delete(key)
          const f = field.current
          if (f && f.keys.a === key) f.keys.a = ''
          // on screen already (a slow file, a deep link to the cut): it lands as a cut does, with the flash
          if (f && f.keys.b === key) {
            f.keys.b = ''
            f.relit = true
          }
        },
        () => {},
      )
    return () => {
      gone = true
      document.documentElement.classList.remove('w-resolve', 'w-logos')
    }
  }, [B.peak])

  // nothing is drawn while an opaque act covers the screen (the light act, the footer) or the tab is hidden
  useEffect(
    () =>
      watchLoop(document, (loop) => {
        if (loop === 'never') fps.idle()
        setFrameloop(loop)
      }),
    [fps, setFrameloop],
  )

  const k = useRef({
    start: -1,
    /** the field's own clock: a stopped loop (R3F resets its clock) or a hidden tab never jumps it */
    age: 0,
    time: 0,
    frames: 0,
    count: -1,
    mix: 0,
    flash: 0,
    camZ: CAM_Z,
    lean: 0,
    sway: new Vector2(),
    turn: 0,
    shift: 0,
    dim: 1,
    snap: null as string | null,
    ground: '',
    fly: 0,
    pulse: -1,
    layout: '',
    sc: '',
    land: '',
  })
  const tmp = useRef({
    par: new Vector2(),
    tgt: new Vector2(9, 9),
    v: new Vector3(),
    hit: new Vector3(),
    ray: new Raycaster(),
    plane: new Plane(new Vector3(0, 0, 1), 0),
    m4: new Matrix4(),
    e: new Euler(),
    color: new Color(),
    gatherEl: document.getElementById('gather'),
    countEl: document.getElementById('gather-n'),
    // shoot.mjs (scroll-craft) reads the world's state here to tell a moving act from dead scroll
    sc: navigator.webdriver,
  })

  useFrame((state, delta) => {
    const f = field.current
    const y = you.current
    if (!f || !y) return
    const K = k.current
    const T = tmp.current
    const s = samples.current
    const dt = Math.min(delta, 0.05)
    const { camera, size, viewport } = state
    const l: Layout = { phone: size.width < 768, w: size.width, h: size.height }

    // the layout changed (a resize, a phone turning): every formation is rebuilt for the new view
    // the photo sample too: a budget change resamples it, and the resolve must rebuild once the new grid lands
    const lkey = `${l.phone}:${l.w}:${l.h}:${s.photo && s.photo.cols}:${JSON.stringify(world.photo)}:${JSON.stringify(world.slot)}:${JSON.stringify(world.logoBox)}`
    if (lkey !== K.layout) {
      K.layout = lkey
      cache.current.clear()
      f.keys.a = f.keys.b = ''
    }

    // arrival: waits for the icon's sample (a few ms), then the points stream in and the counter climbs
    K.age += Math.min(delta, 0.25)
    if (K.start < 0 && s.icon !== null) K.start = K.age
    const since = K.start < 0 ? 0 : K.age - K.start
    const gather = still ? 1 : Math.min(1, since / GATHER)
    const lit = still ? 1 : Math.min(1, Math.max(0, (since - GATHER) / LIGHT))
    const count = Math.round(MEMBERS * gather)
    if (count !== K.count) {
      K.count = count
      if (T.countEl) T.countEl.textContent = String(count)
    }
    const shown = gather >= 1 ? 'done' : 'on'
    if (T.gatherEl && T.gatherEl.dataset.state !== shown) T.gatherEl.dataset.state = shown
    if (!still) K.time += dt

    const iris = s.icon ? irisAt(l, s.icon) : null
    const fr: Frame = score({
      act: world.act,
      progress: world.progress,
      hero: world.hero,
      line: world.line,
      entry: world.entry,
      under: world.under,
      gather,
      lit,
      phone: l.phone,
      ready: { icon: !!s.icon, photo: !!s.photo && !!world.photo, slot: !!world.slot },
      // the iris in NDC, seen from the hero's resting camera
      iris: iris ? [iris[0] / ((CAM_Z - iris[2]) * Math.tan(Math.PI / 8) * (l.w / l.h)), iris[1] / ((CAM_Z - iris[2]) * Math.tan(Math.PI / 8))] : null,
    })

    // the formations: built on first use for this layout, uploaded only when a slot changes
    const get = (key: Key): Formation => {
      let fm = cache.current.get(key)
      if (fm) return fm
      const n = f.n
      const c = countOf(key, B)
      if (key === 'arrive') fm = arrive(n, c, l)
      else if (key === 'cloud') fm = cloud(n, c, l)
      else if (key === 'tight') fm = cloud(n, c, l, 0.62)
      else if (key === 'icon') fm = s.icon ? icon(n, c, l, s.icon) : cloud(n, c, l)
      else if (key === 'photo') fm = s.photo && world.photo ? photo(n, c, l, s.photo, world.photo) : shape('tunnel', n, B.cuts, l)
      else if (key === 'closeRest') fm = close(n, c, l, null)
      else if (key === 'closeIris') fm = close(n, c, l, world.slot, has('cuts'))
      else if (key in EVENT_LOGOS) {
        const px = s.logos[key as EventKey]
        fm = px && world.logoBox ? eventLogo(key as EventKey, n, c, l, sampleLogo(px, logoCount(c, l.phone)), world.logoBox) : shape(key as ShapeKey, n, c, l)
      } else if (key in s.logos) fm = logo(key as LogoCut, n, c, l, sampleLogo(s.logos[key as LogoCut]!, shapeCount(c)))
      else fm = shape(key as ShapeKey, n, c, l)
      cache.current.set(key, fm)
      return fm
    }
    const put = (slot: 'A' | 'B', key: Key) => {
      const fm = get(key)
      const p = slot === 'A' ? f.slots.aA : f.slots.aB
      const c = slot === 'A' ? f.slots.cA : f.slots.cB
      ;(p.array as Float32Array).set(fm.pos)
      ;(c.array as Float32Array).set(fm.col)
      p.needsUpdate = c.needsUpdate = true
    }
    const snapped = fr.a === fr.b
    let changed = false
    if (fr.b !== f.keys.b) {
      put('B', fr.b)
      f.keys.b = fr.b
      changed = true
    }
    if (!snapped && fr.a !== f.keys.a) {
      put('A', fr.a)
      f.keys.a = fr.a
      changed = true
    }
    const drawn = Math.max(countOf(fr.b, B), snapped ? 0 : countOf(fr.a, B))
    f.points.geometry.setDrawRange(0, Math.min(f.n, drawn))

    // B's cuts land at once with a white flash that decays in about 0.17 s; A's blends ease
    if ((fr.snap && fr.snap !== K.snap) || f.relit) K.flash = 1
    f.relit = false
    K.snap = fr.snap
    if (world.pulse > 0 && world.pulse !== K.pulse) {
      K.pulse = world.pulse
      K.flash = Math.max(K.flash, 0.7)
    }
    K.flash = Math.max(0, K.flash - dt * 6)
    const m = snapped ? 1 : fr.mix
    K.mix = changed || still ? m : damp(K.mix, m, 9, dt)
    K.camZ = changed && fr.snap ? fr.camZ : damp(K.camZ, fr.camZ, 6, dt)
    K.shift = damp(K.shift, fr.shift, 8, dt)
    K.dim = damp(K.dim, fr.dim, 8, dt)
    K.turn = damp(K.turn, fr.turn, 3, dt)
    camera.position.set(0, 0, still ? fr.camZ : K.camZ)
    camera.updateMatrixWorld()

    // the pointer (or a held finger): A's field leans toward it and swings by depth; B's formation turns toward it
    const p = world.pointer
    if (p.on) {
      T.tgt.set(p.x, p.y)
      T.par.lerp(T.tgt, 1 - Math.exp(-3.7 * dt))
    } else T.par.multiplyScalar(Math.pow(0.97, dt * 60))
    K.lean = damp(K.lean, p.on ? fr.lean : 0, 3.7, dt)
    K.sway.x = damp(K.sway.x, (p.on ? T.par.y * 0.08 : 0) * fr.sway, 3, dt)
    K.sway.y = damp(K.sway.y, ((p.on ? T.par.x * 0.14 : 0) + Math.sin(K.time / 5) * 0.04) * fr.sway, 3, dt)

    const u = f.mat.uniforms
    u.uMix.value = K.mix
    u.uStag.value = fr.stag
    u.uTime.value = K.time
    // a logo's thin lines would blur in the full drift: it breathes, at about a third, and the drift follows the mix
    // into a logo and out of one (English Bubble into the tunnel). An event's name, drawn a few pixels per stroke in the
    // box above the name (#32), breathes at a tenth, but only while the box is open: a cut that fell back to its shape
    // keeps its full drift
    const calm = (k: Key) => (k in s.logos ? (k in EVENT_LOGOS ? (world.logoBox ? 0.9 : 0) : 0.65) : 0)
    u.uDrift.value = fr.drift * (1 - calm(fr.a) * (1 - K.mix) - calm(fr.b) * K.mix)
    u.uPx.value = viewport.dpr
    u.uScale.value = size.height
    u.uLean.value = K.lean
    u.uFlash.value = K.flash
    u.uDim.value = K.dim
    u.uShift.value = K.shift * HH
    u.uPar.value.copy(T.par)
    // the turn of act 2 about the cloud's centre, the sway of a cut about its formation
    const pivot = fr.turn ? heroPlacement(l.phone).position : l.phone ? [0, 3.35, 0] : [17 * (CAM_Z / 60), 0, 0]
    u.uPivot.value.set(pivot[0], pivot[1], pivot[2])
    T.e.set(K.sway.x, K.sway.y, -K.turn)
    u.uRot.value.setFromMatrix4(T.m4.makeRotationFromEuler(T.e))
    if (p.on || T.par.lengthSq() > 1e-4) {
      T.ray.setFromCamera(T.tgt, camera)
      if (T.ray.ray.intersectPlane(T.plane, T.hit)) u.uPtr.value.set(T.hit.x, T.hit.y)
    }

    // the ground steps between night and a lift of it on every second cut, hard, no fade
    const ground = fr.ground ? `${fr.ground.color}:${fr.ground.alpha}` : ''
    if (ground !== K.ground) {
      K.ground = ground
      gl.setClearColor(T.color.set(fr.ground?.color ?? '#141E27'), fr.ground?.alpha ?? 0)
    }

    // the Apply wave: a ring of light runs out through the 600 from the slot (#17)
    const slotW = world.slot ? slotAt(l, world.slot.x, world.slot.y) : [0, 0, 0]
    const wave = world.wave > 0 ? (performance.now() - world.wave) / 650 : -1
    // act 2's 600 lands (#37): the same ring, once, slower and out from the cloud's centre, sized to the cloud
    const landed = world.landed > 0 ? (performance.now() - world.landed) / 1100 : -1
    if (wave >= 0 && wave <= 1.3) {
      u.uWave.value = wave
      u.uWaveO.value.set(slotW[0], slotW[1], 0)
      u.uWaveR.value = halfWidth(l) * 1.6
    } else if (landed >= 0 && landed <= 1.3) {
      const { position: c, scale } = heroPlacement(l.phone)
      u.uWave.value = landed
      u.uWaveO.value.set(c[0], c[1] + K.shift * HH, 0)
      u.uWaveR.value = scale * 3.4
    } else u.uWave.value = -1

    // your point: a fixed spot in the view, unprojected at a constant distance, so it never leans, drifts or parallaxes
    const yu = y.mat.uniforms
    const arr = y.pos.array as Float32Array
    const put3 = (i: number, nx: number, ny: number) => {
      T.v.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(CAM_Z).add(camera.position)
      arr.set([T.v.x, T.v.y, T.v.z], i * 3)
    }
    if ('flight' in fr.you) {
      // the close: a swoop from top right along a curve into the slot, with a light trail, shrinking as it lands
      K.fly = still ? fr.you.flight : damp(K.fly, fr.you.flight, 6, dt)
      const s0 = topRight(l.phone)
      const s1: [number, number] = world.slot ? [(world.slot.x / l.w) * 2 - 1, 1 - (world.slot.y / l.h) * 2] : s0
      const c = [(s0[0] + s1[0]) / 2 - 0.25, Math.max(s0[1], s1[1]) + 0.28]
      for (let i = 0; i < TRAIL; i++) {
        const t = Math.max(0, K.fly - i * 0.014)
        const a = (1 - t) * (1 - t)
        const b = 2 * (1 - t) * t
        const d = t * t
        put3(i, a * s0[0] + b * c[0] + d * s1[0], a * s0[1] + b * c[1] + d * s1[1])
      }
      const landed = Math.min(1, Math.max(0, (K.fly - 0.94) / 0.06))
      yu.uMove.value = Math.min(1, K.fly * (1 - K.fly) * 4)
      const press = wave > 0 && wave < 1 ? Math.sin(wave * Math.PI) * 0.6 : 0
      yu.uSz.value = (1.35 - 0.6 * K.fly) * (1 + press)
      // on landing the slot's own glow takes over (Close), so the sprite steps out
      yu.uA.value = 1 - landed
      const land = landed.toFixed(2)
      if (land !== K.land) document.documentElement.style.setProperty('--land', (K.land = land))
    } else {
      for (let i = 0; i < TRAIL; i++) put3(i, fr.you.x, fr.you.y)
      yu.uMove.value = 0
      yu.uSz.value = fr.you.size
      yu.uA.value = fr.you.alpha * (1 + 0.12 * Math.sin(K.time * 1.6))
    }
    y.pos.needsUpdate = true
    yu.uPx.value = viewport.dpr

    if (T.sc) {
      // the whole world's state on the root, so every act (not only the hero) shows its motion to shoot.mjs; the close's
      // landed point is an authored hold, as is the peak's (ClubLifePeak)
      const sc = `${world.act}:${world.hero.toFixed(2)}:${fr.a}>${fr.b}:${K.mix.toFixed(2)}:${K.camZ.toFixed(1)}:${K.shift.toFixed(2)}:${K.fly.toFixed(2)}:${count}`
      if (sc !== K.sc) {
        K.sc = sc
        const html = document.documentElement
        html.dataset.scVerifyState = sc
        html.dataset.scVerifyHold = String(world.act === 'apply' && world.progress > 0.82)
      }
    }
    fps.frame(performance.now() / 1000, f.points.geometry.drawRange.count, viewport.dpr)
    // the canvas fades in once a frame of the gather has been drawn, never on an empty buffer or before the icon's sample
    if (K.start >= 0 && ++K.frames === 2) onReady()
  })

  return null
}

/** The pointer into the store: a mouse anywhere over the page, a finger only while it is held down (#11). */
function usePointer() {
  useEffect(() => {
    const p = world.pointer
    let held = false
    const at = (e: PointerEvent) => {
      p.x = (e.clientX / innerWidth) * 2 - 1
      p.y = -((e.clientY / innerHeight) * 2 - 1)
      p.on = true
    }
    const move = (e: PointerEvent) => (e.pointerType !== 'touch' || held) && at(e)
    const down = (e: PointerEvent) => e.pointerType === 'touch' && ((held = true), at(e))
    const up = (e: PointerEvent) => e.pointerType === 'touch' && ((held = false), (p.on = false))
    const leave = () => (p.on = false)
    addEventListener('pointermove', move, { passive: true })
    addEventListener('pointerdown', down, { passive: true })
    addEventListener('pointerup', up)
    addEventListener('pointercancel', up)
    document.documentElement.addEventListener('pointerleave', leave)
    return () => {
      removeEventListener('pointermove', move)
      removeEventListener('pointerdown', down)
      removeEventListener('pointerup', up)
      removeEventListener('pointercancel', up)
      document.documentElement.removeEventListener('pointerleave', leave)
      p.on = false
    }
  }, [])
}

export default function World({ tier, forced, still, onReady, onLost }: WorldProps) {
  const [rung, setRung] = useState(startRung(tier))
  const { budget, dpr } = LADDER[rung]
  usePointer()
  useEffect(() => {
    document.documentElement.dataset.worldRung = String(rung)
    // the lowest rung holds the grain still (index.css, .grain)
    document.documentElement.classList.toggle('w-low', rung === LADDER.length - 1)
  }, [rung])

  return (
    <Canvas
      className="world-canvas"
      aria-hidden="true"
      // no tone mapping, no colour conversion: the shaders write the charter colours as they are
      flat
      linear
      dpr={Math.min(devicePixelRatio, dpr)}
      gl={{ antialias: false, alpha: true, powerPreference: 'high-performance', stencil: false, depth: false }}
      camera={{ fov: 45, near: 0.1, far: 120, position: [0, 0, CAM_Z] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x141e27, 0)
        // context loss drops the page to tier 0 (#5): the posters and the cards come back, the content never notices
        gl.domElement.addEventListener('webglcontextlost', onLost, { once: true })
      }}
    >
      {!forced && !still && !RAMP && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setRung((r) => Math.min(LADDER.length - 1, r + 1))}
          onIncline={() => setRung((r) => Math.max(0, r - 1))}
        />
      )}
      <Field budget={budget} still={still} onReady={onReady} />
    </Canvas>
  )
}
