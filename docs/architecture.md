# Architecture

A static single page: no server, no database, no cookies, no candidate data. Everything that varies (the
registration link, the opening time) is configuration.

## Stack

| Piece | Choice | Why |
|---|---|---|
| Build | Vite | Same as the dashboard's `frontend/`; fast dev server, code splitting |
| UI | React 19 + TypeScript | Same as the dashboard; its brand components copy over unchanged |
| Styling | Tailwind v4 | Same tokens approach as the dashboard |
| 3D | three.js via React Three Fiber, plus drei helpers | Declarative scenes, `useFrame` for per-frame work without React re-renders |
| Scroll | Lenis (smooth scroll) + GSAP ScrollTrigger (scroll-linked timelines) | The usual pairing; ScrollTrigger reads Lenis's scroll |
| Images | `sharp` in a build-time script | AVIF and WebP output ([assets.md](assets.md#pipeline)) |
| Hosting | Vercel, static output | Owner's account, preview deploy per PR |

Versions and APIs get checked against current docs (Context7) when scaffolding, not taken from memory: R3F,
drei, GSAP and Lenis all changed APIs in the last two years. GSAP is free for this use since its 2025 licence
change; confirm at scaffold time.

## Third-party code

Settled 2026-10-19 in [#19](https://github.com/puIad/vic-enp/issues/19) (research on
[`research/third-party-code`](https://github.com/puIad/vic-enp/blob/research/third-party-code/research/third-party-code/README.md)).
Every comp shares one points shader, one photo shader and your point's sprite on three 0.169.0, so porting them
to R3F is translation, not design.

| Pattern | Source | Licence | Account |
|---|---|---|---|
| Point field and formations | Port the comps into one shared `Field` component (geometry and shader; formations as plain functions returning positions; uniforms mutated by ref in `useFrame`) | Ours | None |
| Photo resolve | Port the comp, inside the shared `Field` (sampling helper plus the photo plane) | Ours | None |
| Depth stack (the seven photos after the resolve) | Start from Meng To's [Gallery](https://21st.dev/@mengto/components/gallery) on 21st.dev, merged into the page's one canvas and reworked to [#14](https://github.com/puIad/vic-enp/issues/14)'s entrances, timings, radius and tier 1 limit | MIT, keep the notice | The owner's 21st.dev account, acting for the club; the owner installs it |
| Door, tunnel, horizon | Port the comps. 21st.dev's [Warp Tunnel](https://21st.dev/@ln-dev7/components/warp-tunnel) is a shading reference only | Ours (Warp Tunnel MIT, notice kept if any of its code is used) | None |
| Snap cuts and the light act | Port the comps on GSAP ScrollTrigger; each formation may be baked to a small point cloud (under 50 KB) | Ours | None |

- **One context.** The Gallery ships its own renderer, camera and loop. They go: it renders into the shared canvas
  like everything else. No third-party piece may add a second WebGL context.
- **Notice.** The Gallery's MIT notice stays at the top of its source file, with a comment linking its 21st.dev
  page, and a row in the [asset ledger](assets.md#asset-ledger). Re-check its licence on the day it is installed.
- **No Originkit.** No Originkit account or plan is needed.

Not added unless a slice proves the need: a state library (a plain mutable store read in `useFrame` is enough), a
router (one page), postprocessing beyond one bloom pass, `detect-gpu` (try plain heuristics first), a light and
dark theme switch (the page has one designed look, night with light sections).

## Layout

```
VIC-ENP/
  index.html              static shell: meta, share tags, the hero's name and tagline as plain HTML for first paint
  src/
    main.tsx
    App.tsx               the content layer, then the lazy 3D layer
    config.ts             APPLY_URL, OPENS_AT, social links
    content/              typed data: sections, departments, events, FAQ, photos (captions, alt, focal points)
    sections/             one component per section from content.md, real DOM, no 3D inside
    scroll/               Lenis + ScrollTrigger setup; maps each act's progress into the world store
    world/                the R3F canvas: formations, point shader, tiers, the photo resolve
    components/brand/     logo and charter motifs copied from the dashboard
  public/
    brand/                logo files (copied, never edited)
    photos/               pipeline output (committed)
    og.png                share image, 1200×630
  scripts/photos.mjs      originals in assets/pics → public/photos
  assets/pics/            originals (git-ignored)
  docs/
  vercel.json             headers (CSP, caching)
```

## Two layers

1. **Content layer.** Normal DOM, normal document flow, normal scrolling. Every word, link and button of the page.
   Works on its own: with JavaScript's 3D chunk missing, with WebGL off, with reduced motion.
2. **World layer.** One full-screen `<canvas>` fixed behind the content, `aria-hidden`, `pointer-events: none`
   except where an act needs pointer input. One WebGL context for the whole page (in-app browsers limit contexts,
   and a context per section would reload resources).

The content layer never waits for the world. The world is a `React.lazy` chunk loaded after first paint (idle
callback), and fades in when its first frame is ready.

## Scroll to world

```
scroll (Lenis) → ScrollTrigger per act → act progress 0..1 → world store { act, progress, pointer }
                                                                   ↓
                                             useFrame reads the store, blends formations, renders
```

- Each act in [experience.md](experience.md#the-journey) registers one ScrollTrigger over its section and
  writes its progress into the store. No React state updates per frame.
- In A's acts the world blends between the current and next formation by progress. In B's acts (departments,
  events) it snaps to the cut's formation at each step boundary, with no blend. Formations are target positions
  for the same set of points, computed once at load or baked (the photo formation computed when its photo has
  loaded).
- Under the light act the canvas is covered, so the render loop idles.
- `gsap.ticker` drives Lenis's `raf`, and Lenis's scroll events update ScrollTrigger, so the two share one clock.
- Under reduced motion, Lenis is not started and every act jumps to its resting formation (still images per
  section), no scrubbing.

## Device tiers

Chosen at load, stepped down at runtime if the frame rate drops (drei's `PerformanceMonitor`).

| Tier | Who | World |
|---|---|---|
| 0 | No WebGL, `prefers-reduced-motion`, Save-Data on, or `deviceMemory` ≤ 2 | No canvas. Static compositions per act (CSS, SVG, poster images). Same content. |
| 1 | Phones (every phone starts here and may step up) | Pixel ratio capped at 1.5, 3.5k to 12k points depending on the act (hero 5k, cuts 10k, peak 12k), no postprocessing |
| 2 | Desktops, recent phones | Pixel ratio capped at 2, 6.5k to 24k points (hero 9k, cuts 16k, peak 24k). One bloom pass and one low-res glass object are allowed by [#5](https://github.com/puIad/vic-enp/issues/5), but the signed comps use neither |

Context loss falls back to tier 0 (iOS in-app browsers can kill the page with no context-lost event, so keep GPU
memory low). Every point count is unmeasured on a real phone until open question 25.

Phone browsers resize the viewport as the toolbar shows and hides. The canvas is sized to the large viewport
(`lvh`) so it doesn't re-allocate on every scroll; sections use `svh`/`dvh` where height matters.

## Configuration

| Name | Where | Value |
|---|---|---|
| `VITE_APPLY_URL` | Vercel env var (build time) | The Google Form's responder link at launch, the registration app's `/apply` later. The registration plan calls it `APPLY_URL`; Vite only exposes `VITE_`-prefixed names. |
| `OPENS_AT` | `src/config.ts` | `2026-10-25T00:00:00+01:00` (Algiers time) until the owner gives the exact time |
| Social links | `src/config.ts` | From the source brief §10 |

Before `OPENS_AT`, the CTA shows the countdown and links to Instagram. After it, every CTA opens `VITE_APPLY_URL` in
the same tab. The check runs in the browser, so no redeploy is needed at the opening; changing the registration
link is an env var change plus a Redeploy.

## Hosting

- A new Vercel project, `vic-enp`, on the owner's account, connected to `puIad/vic-enp`. Framework preset Vite,
  output `dist`. Preview deployment per PR, production from `main`.
- Domain: a VIC domain if one is settled ([open-questions.md](open-questions.md)), `vic-enp.vercel.app` until then.
- `vercel.json` headers: a strict CSP (`default-src 'self'`; images, fonts and scripts from self only; no inline
  scripts; `frame-ancestors 'none'`), `Referrer-Policy: strict-origin-when-cross-origin`, long immutable caching
  for hashed assets and `public/photos/`.
- Handed over after the season with the dashboard.
- The build reads only committed files (no `assets/pics/`, no local env files), so a clean clone builds the same
  as the owner's machine. Check with a build from a fresh clone before the first production deploy.

## Privacy

No cookies, no forms, no third-party scripts or fonts, no tracking unless the owner approves cookieless analytics
([open-questions.md](open-questions.md)). Photos have EXIF stripped. The CTA is a plain link.
