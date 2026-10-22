# Architecture

A static single page: the landing page has no server, no database, no cookies and no candidate data. Everything that
varies (the registration link, the opening time) is configuration. Beside it, `/apply` and `api/` hold the registration
form ([spec](https://github.com/puIad/vic-recruitment-2026/blob/main/docs/registration-form.md), settled 2026-10-22 on wayfinder map #110) with its own Redis and secrets; see Hosting and Privacy.

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
| Depth stack (the ten photos after the resolve) | Slice 2's DOM stack: the photos as DOM in CSS 3D, with [#14](https://github.com/puIad/vic-enp/issues/14)'s entrances, timings and radius. Meng To's Gallery was dropped on 2026-10-20 ([decisions.md](decisions.md), 40) | Ours | None |
| Door, tunnel, horizon | Port the comps. 21st.dev's [Warp Tunnel](https://21st.dev/@ln-dev7/components/warp-tunnel) is a shading reference only | Ours (Warp Tunnel MIT, notice kept if any of its code is used) | None |
| Snap cuts and the light act | Port the comps on GSAP ScrollTrigger; each formation may be baked to a small point cloud (under 50 KB) | Ours | None |

- **One context.** No third-party piece may add a second WebGL context. The depth stack is DOM, so the peak keeps one
  canvas and at most two stack photos on screen at once on a phone.
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

- Each act in [experience.md](experience.md#the-journey) has one scroll range (`src/scroll/smooth.ts`): a pinned act
  owns the world from its pin to its release, a flowing act while it holds the centre line, and the close from a screen
  before it pins (its entry). The act and its progress go into the store; no React state updates per frame.
- `src/world/score.ts` turns the store into what the field holds: two formations and a blend, a flash on each cut, the
  camera, the ground and your point. The formations are plain functions in `src/world/formations.ts`, one buffer for
  all of them, sized to the peak's count on the current budget.
- In A's acts the world blends between the current and next formation by progress. In B's acts (departments,
  events) it snaps to the cut's formation at each step boundary, with no blend. Formations are target positions
  for the same set of points, computed once at load or baked (the photo formation computed when its photo has
  loaded).
- Under the light act the canvas is covered, so the render loop idles.
- The rings of light through the 600 share one arbiter (`src/world/ripple.ts`, `ring`): the Apply wave from the slot,
  act 2's 600 landing, then a tap on a phone ([#38](https://github.com/puIad/vic-enp/issues/38)). `watchTaps` hears a
  short, still one-finger touch with passive listeners only, so no tap ever waits on the world and scrolling is untouched;
  under reduced motion it hears nothing.
- `gsap.ticker` drives Lenis's `raf`, and Lenis's scroll events update ScrollTrigger, so the two share one clock.
- Under reduced motion, Lenis is not started and every act jumps to its resting formation (still images per
  section), no scrubbing.
- The catch (slice 5, [experience.md](experience.md#the-catch)) sits between input and the scroll and decides from the
  input, never by watching the page ([decisions.md](decisions.md), 87 to 97). Its rules are pure (`src/scroll/catch.ts`:
  the runs, the still points, `land`, the wheel's `catcher` and touch's `toucher`); `smooth.ts` measures the layout and
  plays the moves through Lenis. On the wheel it sits inside Lenis's `virtualScroll` hook. On touch the page owns its
  scrolling (`src/scroll/touch.ts`): a vertical drag's touchmove is cancelled so the browser starts no momentum, the
  finger drags the page 1:1 and the lift coasts on with decaying momentum, all through Lenis's `scrollTo`; Lenis's hook
  keeps out of touch while the catch owns it. A pinch, a zoomed-in page, a sideways swipe in a sideways scroller and a
  slide the rail's hold took stay the browser's. Lenis's `syncTouch` is not used: its inertia depends on the frame rate,
  so where a flick lands couldn't be known at the lift. The stages' bottom-anchored parts sit in `svh`, since the
  address bar no longer hides on scroll. Lenis's snap plugin is not used either: it ignores touch and snaps only after
  a pause. Programmatic scrolls (`world.go`, anchors, the reload restore) bypass the catch.

## Device tiers

Chosen at load, stepped down at runtime if the frame rate drops (drei's `PerformanceMonitor`).

| Tier | Who | World |
|---|---|---|
| 0 | No WebGL, `prefers-reduced-motion`, Save-Data on, or `deviceMemory` ≤ 2 | No canvas. Static compositions per act (CSS, SVG, poster images). Same content. |
| 1 | Phones (every phone starts here and may step up) | Pixel ratio capped at 1.5, 3.5k to 12k points depending on the act (hero 5k, cuts 10k, peak 12k), no postprocessing |
| 2 | Desktops, recent phones | Pixel ratio capped at 2, 6.5k to 24k points (hero 9k, cuts 16k, peak 24k). One bloom pass and one low-res glass object are allowed by [#5](https://github.com/puIad/vic-enp/issues/5), but the signed comps use neither |

`?tier=0`, `?tier=1` or `?tier=2` forces a tier and holds it (no step-down), for the owner's phone checks and the
verification runs. The tier is read before React's first render (`src/world/boot.ts`), so tier 1 and 2 arrive from
night, then the words, then the world gathering, as in [#11](https://github.com/puIad/vic-enp/issues/11)'s arrival.
The baked poster is shown on tier 0 and whenever the world fails (no context, the chunk fails to load, context lost);
it is not shown under the canvas while the world loads, because a formed cloud that then dissolves into the gather reads
as a glitch, and a late full-screen image would take over as the page's LCP element.

Context loss falls back to tier 0 (iOS in-app browsers can kill the page with no context-lost event, so keep GPU
memory low). Every point count is unmeasured on a real phone until open question 25.

Phone browsers resize the viewport as the toolbar shows and hides. The canvas is sized to the large viewport
(`lvh`) so it doesn't re-allocate on every scroll; sections use `svh`/`dvh` where height matters.

## Configuration

| Name | Where | Value |
|---|---|---|
| `VITE_APPLY_URL` | Vercel env var (build time) | The Google Form's responder link until the 24 Oct live check passes, then `/apply`; flipping it back is the fallback (an env change plus a Redeploy, 1 to 2 minutes). |
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
- **The registration form lives here too** (settled 22 Oct): `/apply` is its own Vite entry (the 3D bundle never loads
  there) and the `api/` functions (`code`, `verify`, `submit`, `health`) run in the same Vercel project, on the same
  origin. Secrets and its own new Upstash Redis are in this project only, nothing shared with the dashboard's project.
  Production env vars point at the real Master, Preview ones at a copy of it. `form-action` in the CSP moves from `'none'`
  to `'self'`; the rest of the CSP is unchanged and `/apply` uses no inline scripts or styles.
- **Deploy safety:** until the 24 Oct evening live check, a landing deploy must pass a `/apply` smoke check on its preview
  (`/apply` returns 200, `/api/health` all `ok`). After the live check, production changes only for a rollback or the
  `VITE_APPLY_URL` switch.
- Handed over after the season with the dashboard: the project, its Redis, the service account key and the mailer script.
- The build reads only committed files (no `assets/pics/`, no local env files), so a clean clone builds the same
  as the owner's machine. Check with a build from a fresh clone before the first production deploy.

## Privacy

**The landing page itself:** no cookies, no forms, no third-party scripts or fonts, no tracking unless the owner approves
cookieless analytics ([open-questions.md](open-questions.md)). Photos have EXIF stripped. The CTA is a plain link.

**`/apply` and `/api`** (amended 22 Oct, wayfinder map #110): they show the registration form and may set **one HttpOnly
cookie**, only after the candidate's email code is verified (60 minutes, sealed). The form holds candidate data in the
candidate's own browser (a localStorage draft, cleared on send) and sends it to the Master's Registration Responses tab
through a service account; Redis keeps only hashes of emails, codes and IPs. Logs carry route, outcome and milliseconds
only. No candidate data in the repo.
