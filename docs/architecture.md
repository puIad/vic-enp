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

- Each act in [experience.md](experience.md#score-proposed) registers one ScrollTrigger over its section and
  writes its progress into the store. No React state updates per frame.
- The world blends between the current and next formation by progress. Formations are target positions for the
  same set of points, computed once at load (and the photo formation computed when its photo has loaded).
- `gsap.ticker` drives Lenis's `raf`, and Lenis's scroll events update ScrollTrigger, so the two share one clock.
- Under reduced motion, Lenis is not started and every act jumps to its resting formation (still images per
  section), no scrubbing.

## Device tiers

Chosen at load, stepped down at runtime if the frame rate drops (drei's `PerformanceMonitor`).

| Tier | Who | World |
|---|---|---|
| 0 | No WebGL, `prefers-reduced-motion`, Save-Data on, or `deviceMemory` ≤ 2 | No canvas. Static compositions per act (CSS, SVG, poster images). Same content. |
| 1 | Most phones, low-end laptops | Pixel ratio capped at 1.5, about 10k to 15k points for the photo resolve, no postprocessing |
| 2 | Desktops, recent phones | Pixel ratio capped at 2, 30k to 40k points, one bloom pass |

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
