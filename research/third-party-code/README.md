# Third-party code: Originkit, 21st.dev or our own for each pattern

Resolves issue #19. Read on 2026-10-19. Builds on [#3's survey](https://github.com/puIad/vic-enp/blob/research/layers-21st-originkit/research/layers-21st-originkit/README.md), the tier 1 budget in [#5](https://github.com/puIad/vic-enp/issues/5), the one-WebGL-context rule in [#9](https://github.com/puIad/vic-enp/issues/9) and the act specs in #10 to #17 (comps on the `prototype/*` branches). No sign-in, no install, no download: Originkit and 21st.dev component source is behind an account, so everything here is judged from the public component pages, their metadata and the licence pages.

## Short answer

Port every pattern from our own comps to React Three Fiber. No Originkit piece and no 21st.dev piece fits better than the comp, so no Originkit account or plan is needed.

Two reasons hold for every pattern:

1. **One context.** Every candidate is a self-contained scene that brings its own `<canvas>` and renderer (Originkit components, the MIT 21st.dev ones, Meng To's ThreeUI pieces render in a sandboxed iframe). The page is one continuous world in one WebGL context (#9). Dropping any of them in adds a second context, which on iOS in-app browsers is the exact risk #5 flagged (WebKit can kill a texture-heavy page with no context-lost event). Using one means taking its shader and maths into our field, which is a rewrite either way.
2. **The comps are already the spec.** All seven act comps share one technique: a single `THREE.Points` with a custom `ShaderMaterial` (additive, `depthWrite: false`, point size clamped and scaled by the DPR cap), formations computed per point in JS, photo planes with a rounded-corner shader, all on three 0.169.0. The owner signed off on exactly this look. A third-party scene would need its look rebuilt to match, not the other way round.

What we do take from third parties is the stack's own MIT libraries: three, `@react-three/fiber` 9 (pairs with React 19), `@react-three/drei` helpers, GSAP ScrollTrigger and Lenis (decision 6).

## Per pattern

Cost key: "Account" means a signed-in account is needed to copy or install. Originkit Free allows 10 component copies a day, Pro is $79 a year ([pricing](https://www.originkit.dev/pricing), read 2026-10-19). 21st.dev installs need a 21st API key, and "Free accounts get a limited number of installs per day" (stated on every component's `.md` page).

### 1. The point field and its formations

Spec: one field of 600 members plus dust (hero 9k desktop / 5k phone; departments and events 16k / 10k; peak up to 24k / 12k), additive, no bloom, DPR cap 2 / 1.5, a seeded three-arm cloud in the hero, slow morphs in A's acts, your point as its own sprite that never cuts (#11, #12, #17).

| Option | Licence | Cost | Fit to spec and tier 1 | Rewrite |
|---|---|---|---|---|
| Originkit [Scroll Wave Field](https://www.originkit.dev/components/scroll-wave-field), [Particle Drift](https://www.originkit.dev/components/particle-drift), [Tornado](https://www.originkit.dev/components/tornado) | [Originkit licence](https://www.originkit.dev/docs/licensing), custom: commercial use and modification, no attribution, never in a template | Account; Pro status per component not visible without sign-in | Own canvas each (Particle Drift: "the canvas itself is transparent"). Shapes are a sine-wave ground, a constellation with lines and an hourglass vortex, none of them our cloud or formations. Tech (raw WebGL or three) not stated; none says React Three Fiber | Everything except a few shading ideas (Scroll Wave Field's `pow(1-d,10)` hot core) |
| 21st.dev [Vortex](https://21st.dev/@ln-dev7/components/vortex) (lndev-ui) | MIT (stated on the page) | 21st account / API key | R3F and three, a spiral galaxy of points coloured from theme tokens. Closest look to the hero cloud, but it is its own `<Canvas>` and a single fixed shape | Keep the token colouring idea; the field, formations, morphs and your point are ours anyway |
| Port the comp | Ours | None | Exactly the signed-off look and counts. Already tier 1: points only, DPR caps, context loss falls back to tier 0 | Low: one `<points>` with our `shaderMaterial`, uniforms mutated in `useFrame` by ref (R3F's own guidance, no `setState` per frame) |

**Recommendation: port the comp.** Build one shared `Field` component that owns the geometry and shader, with formations as plain functions returning point positions (the comps already write them that way).

### 2. The photo resolve (peak, #14)

Spec: the 600 points rush from the spiral into a sampled copy of `IMG_8658` (sampled at 127x85 on a phone to 190x127 on desktop), then the real photo plane fades in under them and its corners round only once formed.

| Option | Licence | Cost | Fit | Rewrite |
|---|---|---|---|---|
| Originkit | n/a | n/a | No points-to-photo component found in the Image Gallery category (46) or the particle pieces on the public pages | n/a |
| 21st.dev [Interactive Particle Typography](https://21st.dev/@minhxthanh/components/interactive-particle-typography-1), Particle Dissolve Image Carousel | `no-license` on the first; the second's page gave no readable metadata | Account | 2D canvas, text targets or a carousel, not one field resolving into a photo | Not usable: no licence means all rights reserved (#3's rule) |
| Port the comp | Ours | None | The comp samples the photo with `getImageData`, writes per-point targets as attributes and drives the rush with one progress uniform. 12k points plus one plane on a phone, within #5 | Low to medium: same `Field`, plus a sampling helper and the photo plane |

**Recommendation: port the comp.** The plane can use our `photoMat` shader (radius, brightness and entrance modes in one material). drei's [`Image`](https://github.com/pmndrs/drei/blob/master/docs/abstractions/image.mdx) also has `radius`, `zoom` and `opacity`, but not our entrance modes, so it does not save work here.

Outside the ticket's two sources, for the record only: React Bits Pro's Particle Morph and Wensity UI's Particle Image do image-to-points morphs. Both are separate canvases and one is paid; not checked further.

### 3. The depth stack (peak, #14)

Spec: seven photos after the resolve, in camera space at layout depth, each with its own entrance (slit, pan, rise, lens pull, split, dealt, fly from far back), no two neighbours alike, at most two stack planes visible at once on a phone, rounded corners 20 / 16 px.

| Option | Licence | Cost | Fit | Rewrite |
|---|---|---|---|---|
| Originkit [Gallery Tunnel](https://www.originkit.dev/components/gallery-tunnel), [Floating Gallery](https://www.originkit.dev/components/floating-gallery) | Originkit licence | Account | Gallery Tunnel is an endless three.js tunnel of image slabs with its own canvas; Floating Gallery is DOM. Neither is a scroll-scrubbed sequence with per-photo entrances | Everything |
| 21st.dev [Gallery](https://21st.dev/@mengto/components/gallery) (Meng To, ThreeUI), [Liquid Glass Carousel](https://21st.dev/@componentry/components/liquid-glass-carousel) | MIT on both | Account | A rotating cylinder and a glass-lens carousel, each its own renderer. Wrong motion, extra context | Everything |
| 21st.dev 3D Gallery Photography ([one](https://21st.dev/@moazamtrade/components/3d-gallery-photography), [two](https://21st.dev/@vaib215/components/3d-gallery-photography)) | `unknown` | Account | R3F and drei, the right family | Not usable: no licence |
| Port the comp | Ours | None | The comp's stack is a group under the camera with one material per photo and a `mode` uniform per entrance; the timings (start `.42 + i x .07`, life `.13`) are in the spec | Low to medium |

**Recommendation: port the comp.**

### 4. The three passages: door, tunnel, horizon (#13, #16, #17)

Spec: the door is two slabs of points with a lit slit; the tunnel is a tube of the same points receding, dimmed to 40%, wordless; the horizon is a CSS gradient with a 1 px lit line while the field lies down into it. Each is used once, and #8's iris rule holds for all three.

| Option | Licence | Cost | Fit | Rewrite |
|---|---|---|---|---|
| Originkit [Tornado](https://www.originkit.dev/components/tornado), [Ascii Tunnel](https://www.originkit.dev/components/ascii-tunnel), [Beyond Horizon](https://www.originkit.dev/components/beyond-horizon), [Chess Horizon](https://www.originkit.dev/components/chess-horizon) | Originkit licence | Account | Each a separate WebGL scene (a vortex, an ASCII corridor, a glowing disc rim, a checkerboard plane). A passage must be the same points changing shape, not a new scene | Everything |
| 21st.dev [Warp Tunnel](https://21st.dev/@ln-dev7/components/warp-tunnel) (lndev-ui) | MIT (now shown on the page; #3 found the field empty on the same day, so the author set it since) | Account | R3F star streaks racing to a vanishing point, colour from theme tokens. A second particle system with its own `<Canvas>`, and a fast warp, where the spec asks for a dim, slow, wordless tube | High: only the streak shading idea survives |
| 21st.dev [3D Tron Grid Background](https://21st.dev/@thegridcn/components/grid) | MIT | Account | A grid floor with beams: reads as a horizon but not ours, own canvas | Everything |
| Port the comp | Ours | None | In the departments comp the door and tunnel are two short formation functions in the same `snap()` path; the horizon is CSS plus a squash of the field | Very low |

**Recommendation: port the comp.** Warp Tunnel is the only MIT candidate worth a look, as a reference for streak shading if the tunnel ever needs more motion; it is not needed for the signed spec.

### 5. The snap cuts (#13 departments, #15 events)

Spec: B's grammar. One pinned stage; on every step boundary all points snap into the next formation with no morph, a one or two frame white flash, and the ground steps between night and a lifted tint. Seven department cuts and five event cuts.

| Option | Licence | Cost | Fit | Rewrite |
|---|---|---|---|---|
| Originkit, 21st.dev | n/a | n/a | Nothing in either catalogue does scroll-stepped formation snaps on a shared field. Snapping is scroll logic plus a buffer write, not a visual component | n/a |
| Port the comp, with GSAP ScrollTrigger (in the stack) | GSAP standard licence, free | None | The comp computes the step from scroll and calls `snap()`, which rewrites the position attribute and sets the flash uniform. ScrollTrigger replaces the hand-written step maths | Low |

**Recommendation: port the comp.** If generating formations on a phone costs too much, #13 already allows baking each to a short point cloud (under 50 KB).

### 6. The horizon (#16 into and out of the light act, #17 the close)

Spec: the field lies down (y squashed 97%, z 60%, tilt eased flat), its centre follows a lit horizon line, and the line carries your point away; on the way out the line rises and the field stands back up. The passage itself is CSS.

| Option | Licence | Cost | Fit | Rewrite |
|---|---|---|---|---|
| Originkit [Beyond Horizon](https://www.originkit.dev/components/beyond-horizon), [Chess Horizon](https://www.originkit.dev/components/chess-horizon) | Originkit licence | Account | Separate scenes with their own light and geometry; the spec's horizon is our field flattening onto a CSS line | Everything |
| 21st.dev [Horizon Hero Section](https://21st.dev/@lovesickfromthe6ix/components/horizon-hero-section) | MIT | Account | A whole hero with three, GSAP and post-processing; post-processing is off tier 1 (#5) | Everything |
| Port the comp | Ours | None | CSS gradients and a 1 px line, plus three uniforms on the field | Very low |

**Recommendation: port the comp.**

## Library helpers we do use (all MIT)

These come with the stack, need no account and fit the one-context rule:

- **three** ([licence](https://github.com/mrdoob/three.js/blob/dev/LICENSE)) and **@react-three/fiber** 9 ([licence](https://github.com/pmndrs/react-three-fiber/blob/master/LICENSE)). R3F's docs: "@react-three/fiber@9 pairs with react@19".
- **@react-three/drei** ([licence](https://github.com/pmndrs/drei/blob/master/LICENSE)): [`PerformanceMonitor`](https://github.com/pmndrs/drei/blob/master/docs/performances/performance-monitor.mdx) to step DPR down on a struggling phone (its `onFallback` sets a floor after repeated flip-flops), which suits #5's "start phones in tier 1 and step up". `View` exists for several scenes in one canvas, but the page is one full-screen world, so it is not needed.
- **GSAP ScrollTrigger** and **Lenis** for pins, snaps and smoothing (decision 6).

## How much porting there is

Seven comps (330 to 480 lines each, HTML and CSS included) share one field shader, one photo shader and a sprite for your point. The build ports them once into:

- `Field`: geometry, shader, formations as functions, morph and snap modes, pointer lean.
- `YourPoint`: the sprite and its per-act placement.
- `PhotoPlane` and `PhotoStack`: the rounded-corner shader with entrance modes.
- Per-act timelines on ScrollTrigger that set uniforms and call formations.

The look, counts and timings are already settled in the specs, so this is translation, not design.

## If the owner still wants an Originkit piece

- The licence is granted "to you or to the organization you obtained the component on behalf of", and it covers "projects you build and operate". The club page qualifies; a reusable template of it would not.
- Someone has to sign in to copy. An agent must not, so it would be the owner, either on their own account stated as acting for the club, or on a club account (for example under vic@g.enp.edu.dz) that outlives the owner's term. Free covers 10 copies a day; Pro components need $79 a year.
- Each piece would still be rewritten into our `Field` to keep one context, so the account buys a reference, not working code.

## Owner's choices (2026-10-19)

| Pattern | Choice | Licence | Account |
|---|---|---|---|
| Point field and formations | Port the comp into one shared R3F `Field` | Ours | None |
| Photo resolve | Port the comp (stays in the shared field) | Ours | None |
| Depth stack (7 photos after the resolve) | 21st.dev [Gallery](https://21st.dev/@mengto/components/gallery) by Meng To (ThreeUI) as the base, merged into the shared canvas so the page keeps one WebGL context, reworked to the #14 entrances, timings and radius | MIT; keep its notice in the source and a link to the 21st page in a source comment and `docs/assets.md` ([21st Terms](https://21st.dev/terms)) | The owner's 21st.dev account, acting for the club; the owner installs it (free tier) |
| Door, tunnel, horizon passages | Port the comp; 21st.dev [Warp Tunnel](https://21st.dev/@ln-dev7/components/warp-tunnel) as a shading reference for the tunnel | Ours; Warp Tunnel MIT if any of its code is used (keep the notice) | None, unless Warp Tunnel code is copied (then the same owner account) |
| Snap cuts and the horizon act | Port the comp on ScrollTrigger, with each formation baked to a small point cloud (under 50 KB) | Ours | None |

No Originkit piece was chosen, so no Originkit account or plan is needed.

Notes for the build: the Gallery's own renderer, camera and loop go; its plane layout and motion become a group under our camera, and it must pass the same tier 1 limit (at most two stack planes visible on a phone). Re-check its licence on the 21st page on the day the owner installs it.

## Not checked

- Component source on either site (needs sign-in or an API key). Whether Originkit's WebGL pieces use three or raw WebGL is stated on Gallery Tunnel only ("built with three.js").
- Which Originkit components are Pro: the badge is not in the public page text.
- Licences change: Warp Tunnel's went from empty to MIT on the same day. Re-check any 21st.dev page right before taking code from it.
- No frame rate, memory or context test on a real phone for any candidate.
- This is not legal advice.
