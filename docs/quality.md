# Quality

What "good enough to launch" means, measured, and how it gets checked.

## Performance budgets

Measured with Lighthouse mobile (Moto G Power class, slow 4G throttling) on the production build.

| Measure | Budget | Before #43 (main, 0a32bbe) | After #43 |
|---|---|---|---|
| Largest Contentful Paint | ≤ 2.5 s, measured on "Gathering the 600": the hero's copy waits for the icon by design ([decisions.md](decisions.md), 111) | 2,583 ms | 2,567 ms, **over by about 70 ms** |
| Cumulative Layout Shift | < 0.1 | 0.000 | 0.000 |
| Interaction to Next Paint | < 200 ms | not measured; TBT 126 ms | not measured; TBT 151 ms |
| JS before the world loads (gzip) | ≤ 120 KB | 89 KB (main and tier) | 89 KB |
| World chunk (gzip, three + R3F + drei parts + our code) | ≤ 350 KB | 245 KB | 245 KB, plus the 5 KB build worker, loaded with the world |
| First view transfer (HTML, CSS, JS, fonts, hero image) | ≤ 1 MB | 690 KB | 691 KB |
| Whole page with every photo loaded | ≤ 6 MB | not measured (#43 changes no image) | 1.8 MB phone, 1.5 MB desktop |
| Frame rate | 60 fps desktop, ≥ 30 fps sustained on a tier 1 phone, no scroll jank | Reno 2F: 42 to 60 between dips, lowest second 13 to 30 (decision 101) | the owner's rerun on the Reno |
| GPU memory on tier 1 | ≤ 128 MB textures and buffers | not measured | about 5 MB, estimated: the field's buffers (12k points, about 1.1 MB) and the drawing buffer at DPR 1.5 (about 3.3 MB); the photos are DOM images, not textures |

Measured 2026-10-23 on the production builds served locally with gzip: Lighthouse 13.5.0 mobile, five runs each with
before and after interleaved, medians; sizes from `vite build`; transfer from a scroll to the bottom at the Reno's
viewport (411x891) and at 1440x900. The LCP gap is the hero's wait for the icon (decision 111), unchanged by #43. On the
Reno's viewport with the CPU slowed 4×, three interleaved scrolls top to bottom had 121, 62 and 103 frames over 50 ms
before and 59, 51 and 70 after; style recalculation during a scroll fell from 20.4 s to 8.7 s
([#43](https://github.com/puIad/vic-enp/issues/43)).

Photos load lazily, one section ahead. Fonts: at most three Gilroy weights on the page (charter rule), preloaded,
`font-display: swap`.

Headless Chrome renders WebGL in software, so frame rates measured there mean nothing. Frame rate and feel are
checked on real phones by the owner ([build-plan.md](build-plan.md#owner-tasks)).

## Accessibility

WCAG 2.1 AA as the floor.

- Every piece of content is real DOM text in reading order; the canvas is `aria-hidden`. A screen reader user gets
  the whole page without the world.
- One `h1`, then `h2` per section, landmarks (`header`, `main`, `footer`), a skip link to the CTA.
- `prefers-reduced-motion`: no smooth scroll, no scrubbing, still compositions ([experience.md](experience.md#motion-rules)).
- Keyboard: everything focusable is reachable in order, focus is visible, nothing traps focus or scroll, except the
  hero's first load in a tab session, which waits for the icon ([decisions.md](decisions.md), 108). The
  catch steps gestures and stops momentum, never a key press or a jump ([experience.md](experience.md#the-catch)).
- Contrast: the charter's approved pairings ([brand.md](brand.md#core-charter-p13)), checked in every act where text
  sits over the world. If the world behind a headline is too bright, the world dims, not the text.
- Touch targets at least 44 px. Nothing is conveyed by colour or motion alone.
- `lang="en"`, alt text on every photo ([assets.md](assets.md#pipeline)).

## Sharing and search

Most visits start from a shared link, so the preview matters as much as the page.

- `<title>`, meta description, Open Graph (title, description, `og.png` 1200×630, URL) and Twitter card tags,
  static in `index.html`.
- `theme-color` Dark Jungle Green, `favicon.svg` from the charter files, an Apple touch icon.
- Checked in the Facebook sharing debugger and by sending the link on WhatsApp and Instagram before launch.

## Browsers

| Where | Why |
|---|---|
| Instagram in-app browser, Android and iOS | Where most visitors come from |
| Facebook in-app browser | Shared links |
| Chrome on Android, Safari on iOS | Opened outside the app |
| Desktop Chrome, Edge, Firefox, Safari | Laptops on campus |

## How it gets verified

Per slice, before its PR merges:

1. Build from a clean clone (`git clone` into a temp folder, install, build), so nothing ignored is missing on
   Vercel.
2. `playwright-chrome` MCP: desktop 1440×900 and phone 390×844, with the 3D layer on and forced off (tier 0),
   and with reduced motion on; no console errors; read the page for content and order.
3. scroll-craft's `shoot.mjs` on the preview: desktop, mobile (`--width 390 --height 844`) and `--reduced-motion`.
   It walks every act at six positions and reports dead scroll and cues that never land. The screenshots go in
   the PR. It needs `npm i --no-save playwright-core` and `SCROLLCRAFT_CHROME` pointing at the Chrome for Testing
   headless shell. It samples only acts marked `data-sc-act`, and reads a hand-built act through its
   `data-sc-verify-state` (published only when `navigator.webdriver` is true).
4. Lighthouse mobile on the preview against the budgets above.

The catch (slice 5) also gets unit tests for its decisions (one cut per gesture, retargeting, the spun-on wheel,
coasting stopped on a still point, the near-miss pull, entering and leaving a run, both directions), and in step 2 a
wheel gesture through each run lands on the next cut, never two. Its touch half is tried on real phones too: headless
touch can't stand in for a finger.

Before launch, once:

5. `impeccable-finish-reviewer` against [experience.md](experience.md) and [brand.md](brand.md).
6. Brand Guardian agent on the charter rules (logo, type, colour pairings), with the website's 3D exception in
   [ADR 0001](adr/0001-the-icon-formation.md).
7. Reality Checker agent on the whole launch: it defaults to "needs work" and asks for evidence.
8. The owner on two real phones (one Android, one iPhone), inside Instagram.

## Definition of done (launch)

- Every section from [content.md](content.md) is on the page with approved copy; no ⚠️ item and no placeholder ships.
- The CTA shows the countdown before `OPENS_AT` and opens `VITE_APPLY_URL` after it, from every CTA on the page.
- Tier 0, 1 and 2 all read the full page; reduced motion reads the full page.
- Budgets met on the production build, or the gap written down and accepted by the owner.
- Steps 1 to 8 above done, screenshots and the Lighthouse report linked from the launch PR.
- The domain (or `vic-enp.vercel.app`) serves the production build over HTTPS, and the share preview is right.
