import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Plane, Points, Raycaster, ShaderMaterial, Vector2, Vector3 } from 'three'
import { MEMBERS, constellation, heroPlacement, random, yourPointNdc } from './cloud'
import { world } from './store'
import { LADDER, startRung, type Tier } from './tier'

// The world layer (docs/architecture.md, Two layers): one canvas, one WebGL context, the hero's field (#11) and your
// point. Ported from prototype/act-hero: the same seeded cloud, the same shader, the same numbers.

export type WorldProps = {
  tier: Exclude<Tier, 0>
  /** a forced tier holds its rung: the verification runs and the owner's phone checks see the tier they asked for */
  forced: boolean
  /** the field formed, time frozen and your point lit, for the baked posters */
  still: boolean
  onReady: () => void
  onLost: () => void
}

const MAX = LADDER[0].points
const GATHER = 3.2 // s, points stream in from the edges while the counter climbs to 600
const LIGHT = 0.9 // s, your point lights once the counter lands
/** frame-rate independent easing toward a target, `k` per second */
const damp = (from: number, to: number, k: number, dt: number) => from + (to - from) * (1 - Math.exp(-k * dt))

const fieldVertex = /* glsl */ `
  attribute vec3 aFrom; attribute vec4 aR; attribute float aM;
  uniform float uGather, uTime, uHand, uPx, uLean, uScale; uniform vec2 uPar, uPtr;
  varying vec3 vC; varying float vA;
  void main() {
    float st = aR.x * .55, gg = smoothstep(st, st + .45, uGather); gg = gg * gg * (3. - 2. * gg);
    vec3 p = mix(aFrom, position, gg);
    p += vec3(sin(uTime * .3 + aR.y * 6.28), cos(uTime * .25 + aR.z * 6.28), sin(uTime * .2 + aR.w * 6.28)) * .12;
    p.xy *= 1. - .38 * uHand;                                    // the hand-over: the field tightens toward the 600
    float near = clamp((p.z + 6.) / 12., 0., 1.);
    p.xy += uPar * (near - .4) * 1.4;                             // parallax: near points swing more than far ones
    vec2 dv = uPtr - p.xy; p.xy += dv * exp(-dot(dv, dv) / 9.68) * .3 * uLean;   // the lean toward the pointer
    vec4 mv = modelViewMatrix * vec4(p, 1.); gl_Position = projectionMatrix * mv;
    float sz = (aM > .5 ? 5.2 : 1.3 + aR.y * .7) * (.55 + near * .9);
    gl_PointSize = clamp(sz * uPx * (uScale / -mv.z) * .09, 1., (aM > .5 ? 7. : 3.) * uPx);
    vC = mix(vec3(.071, .49, .733), vec3(.412, .769, .686), near);   // charter blue far, aquamarine near
    vA = (aM > .5 ? 1. : .3) * (.35 + near * .65) * gg;
  }`
const fieldFragment = /* glsl */ `
  varying vec3 vC; varying float vA;
  void main() { float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard; gl_FragColor = vec4(vC, vA * (1. - d * d)); }`

const youVertex = /* glsl */ `
  uniform float uPx, uSz;
  void main() { gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); gl_PointSize = 130. * uPx * uSz; }`
// aquamarine glow with a white core; the halo falls off to nothing, never a ring or a dark disc (iris rule)
const youFragment = /* glsl */ `
  uniform float uA;
  void main() {
    float d = length(gl_PointCoord - .5) * 2.; if (d > 1.) discard;
    float core = smoothstep(.09, .0, d), halo = pow(1. - d, 3.);
    gl_FragColor = vec4(mix(vec3(.412, .769, .686), vec3(1.), core), (halo * .7 + core) * uA);
  }`

/** One buffer for the most points any tier draws; a lower rung draws a prefix of it (the members come first). */
function fieldGeometry() {
  const rnd = random(7)
  const base = constellation(MAX, 7, rnd)
  const pos = new Float32Array(MAX * 3)
  const from = new Float32Array(MAX * 3)
  const r4 = new Float32Array(MAX * 4)
  const mem = new Float32Array(MAX)
  base.forEach((b, i) => {
    pos.set(b, i * 3)
    // each point starts out past the edge of the screen, along its own arm, and behind the camera's focus
    const d = Math.hypot(b[0], b[1]) || 1
    const k = 2.6 + rnd() * 2
    from.set([((b[0] / d) * 16 * k) / 3 + (rnd() - 0.5) * 6, ((b[1] / d) * 10 * k) / 3 + (rnd() - 0.5) * 6, b[2] - 14 - rnd() * 8], i * 3)
    r4.set([rnd(), rnd(), rnd(), rnd()], i * 4)
    mem[i] = i < MEMBERS ? 1 : 0
  })
  const g = new BufferGeometry()
  g.setAttribute('position', new BufferAttribute(pos, 3))
  g.setAttribute('aFrom', new BufferAttribute(from, 3))
  g.setAttribute('aR', new BufferAttribute(r4, 4))
  g.setAttribute('aM', new BufferAttribute(mem, 1))
  return g
}

const material = (uniforms: Record<string, { value: unknown }>, vertexShader: string, fragmentShader: string) =>
  new ShaderMaterial({ uniforms, vertexShader, fragmentShader, transparent: true, depthWrite: false, blending: AdditiveBlending })

/** The hero's scene as plain three objects, built once and mutated per frame outside React. */
function makeHero(still: boolean) {
  const geometry = fieldGeometry()
  const fieldMat = material(
    {
      uGather: { value: 0 },
      uTime: { value: 0 },
      uHand: { value: 0 },
      uPx: { value: 1 },
      uPar: { value: new Vector2() },
      uPtr: { value: new Vector2(99, 99) },
      uLean: { value: 0 },
      uScale: { value: 600 },
    },
    fieldVertex,
    fieldFragment,
  )
  const youGeometry = new BufferGeometry()
  youGeometry.setAttribute('position', new BufferAttribute(new Float32Array(3), 3))
  const youMat = material({ uA: { value: 0 }, uPx: { value: 1 }, uSz: { value: 1 } }, youVertex, youFragment)
  const field = new Points(geometry, fieldMat)
  const you = new Points(youGeometry, youMat)
  field.frustumCulled = you.frustumCulled = false
  you.renderOrder = 1
  return {
    field,
    you,
    fieldMat,
    youMat,
    dispose: () => [geometry, youGeometry, fieldMat, youMat].forEach((o) => o.dispose()),
    // the loader under the hero's CTA (#11): "Gathering the 600 <n>", gone once the 600 have landed
    gatherEl: document.getElementById('gather'),
    countEl: document.getElementById('gather-n'),
    // shoot.mjs (scroll-craft) reads the world's state here to tell a moving hand-over from dead scroll
    sc: navigator.webdriver ? document.getElementById('top') : null,
    k: { start: -1, time: 0, hand: still ? world.hero : 0, lean: 0, turn: 0, frames: 0, count: -1 },
    par: new Vector2(),
    tgt: new Vector2(9, 9),
    v: new Vector3(),
    hit: new Vector3(),
    ray: new Raycaster(),
    plane: new Plane(new Vector3(0, 0, 1), 0),
  }
}

function Hero({ points, still, onReady }: { points: number; still: boolean; onReady: () => void }) {
  const scene = useThree((s) => s.scene)
  const phone = useThree((s) => s.size.width < 768)
  const hero = useRef<ReturnType<typeof makeHero> | null>(null)

  useEffect(() => {
    const h = makeHero(still)
    hero.current = h
    scene.add(h.field, h.you)
    return () => {
      scene.remove(h.field, h.you)
      h.dispose()
      hero.current = null
    }
  }, [scene, still])

  // the cloud's place: right two thirds on desktop, the top 40% on a phone
  useEffect(() => {
    const f = hero.current?.field
    if (!f) return
    const pl = heroPlacement(phone)
    f.scale.setScalar(pl.scale)
    const [rx, ry, rz] = pl.rotation
    const [px, py, pz] = pl.position
    f.rotation.set(rx, ry, rz)
    f.position.set(px, py, pz)
  }, [phone, still])

  useEffect(() => {
    hero.current?.field.geometry.setDrawRange(0, points)
  }, [points, still])

  useFrame((state, delta) => {
    const h = hero.current
    if (!h) return
    const { k, par, tgt, field, fieldMat, youMat } = h
    const dt = Math.min(delta, 0.05)
    const { camera, size, viewport } = state
    if (k.start < 0) k.start = state.clock.elapsedTime
    const since = state.clock.elapsedTime - k.start

    // arrival: the points stream in, the counter climbs, then your point lights and breathes
    const gather = still ? 1 : Math.min(1, since / GATHER)
    const lit = still ? 1 : Math.min(1, Math.max(0, (since - GATHER) / LIGHT))
    const count = Math.round(MEMBERS * gather)
    if (count !== k.count) {
      k.count = count
      if (h.countEl) h.countEl.textContent = String(count)
    }
    const shown = gather >= 1 ? 'done' : 'on'
    if (h.gatherEl && h.gatherEl.dataset.state !== shown) h.gatherEl.dataset.state = shown
    if (!still) k.time += dt

    // the pointer (or a held finger): the field leans toward it and swings by depth; eased out on release
    const p = world.pointer
    if (p.on) {
      tgt.set(p.x, p.y)
      par.lerp(tgt, 1 - Math.exp(-3.7 * dt))
    } else par.multiplyScalar(Math.pow(0.97, dt * 60))
    k.lean = damp(k.lean, p.on ? 1 : 0, 3.7, dt)

    // the hand-over (0.7 screen): the camera dollies 5.5 units in and the field tightens 38%; then act 2 turns it slowly
    k.hand = still ? world.hero : damp(k.hand, world.hero, 4.8, dt)
    k.turn = damp(k.turn, world.act === 'the-600' ? world.progress : world.act && world.act !== 'top' ? 1 : 0, 3, dt)
    camera.position.set(0, 0, 14 - k.hand * 5.5)
    camera.updateMatrixWorld()
    field.rotation.z = heroPlacement(size.width < 768).rotation[2] - k.turn * 0.28

    const u = fieldMat.uniforms
    u.uGather.value = gather
    u.uTime.value = k.time
    u.uHand.value = k.hand
    u.uPx.value = viewport.dpr
    u.uScale.value = size.height
    u.uLean.value = k.lean
    u.uPar.value.copy(par)
    // the pointer in the field's own plane
    if (p.on || par.lengthSq() > 1e-4) {
      h.ray.setFromCamera(tgt, camera)
      if (h.ray.ray.intersectPlane(h.plane, h.hit)) {
        field.updateMatrixWorld()
        field.worldToLocal(h.hit)
        u.uPtr.value.set(h.hit.x, h.hit.y)
      }
    }

    // your point: a fixed spot in the view, unprojected at a constant distance, so it never leans, drifts or parallaxes.
    // It grows 35% across the hand-over.
    const [nx, ny] = yourPointNdc(size.width < 768)
    h.v.set(nx, ny, 0.5).unproject(camera).sub(camera.position).normalize().multiplyScalar(14).add(camera.position)
    h.you.position.copy(h.v)
    const yu = youMat.uniforms
    yu.uA.value = lit * (1 + 0.12 * Math.sin(k.time * 1.6))
    yu.uPx.value = viewport.dpr
    yu.uSz.value = 1 + k.hand * 0.35

    if (h.sc) h.sc.dataset.scVerifyState = `${world.act}:${k.hand.toFixed(2)}:${count}`
    // the canvas fades in once a frame has been drawn, never on an empty buffer
    if (++k.frames === 2) onReady()
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

/** Nothing renders while the canvas is scrolled out of view (the light act and below cover it). */
function PauseOffscreen() {
  const gl = useThree((s) => s.gl)
  const setFrameloop = useThree((s) => s.setFrameloop)
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => setFrameloop(e.isIntersecting ? 'always' : 'never'))
    io.observe(gl.domElement)
    return () => io.disconnect()
  }, [gl, setFrameloop])
  return null
}

export default function World({ tier, forced, still, onReady, onLost }: WorldProps) {
  const [rung, setRung] = useState(startRung(tier))
  const { points, dpr } = LADDER[rung]
  usePointer()
  useEffect(() => {
    document.documentElement.dataset.worldRung = String(rung)
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
      camera={{ fov: 45, near: 0.1, far: 120, position: [0, 0, 14] }}
      onCreated={({ gl }) => {
        gl.setClearColor(0x141e27, 0)
        // context loss drops the page to tier 0 (#5): the poster comes back, the content never notices
        gl.domElement.addEventListener('webglcontextlost', onLost, { once: true })
      }}
    >
      {!forced && !still && (
        <PerformanceMonitor
          flipflops={3}
          onDecline={() => setRung((r) => Math.min(LADDER.length - 1, r + 1))}
          onIncline={() => setRung((r) => Math.max(0, r - 1))}
        />
      )}
      <PauseOffscreen />
      <Hero points={points} still={still} onReady={onReady} />
    </Canvas>
  )
}
