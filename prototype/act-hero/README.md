# Hero act (ticket #11)

Throwaway comp of act 1 on top of `prototype/system`: tokens, Gilroy, grain and vignette, the Apply pill, the rail, the
"Gathering the 600" loader and the sound toggle are reused. One plain HTML file, three.js 0.169.0 from jsDelivr
(points shader, 9k points on desktop, 5k on phones, the first 600 are the members). This branch is never merged.

## Run

```bash
python -m http.server 8761 --bind 127.0.0.1
```

Open `http://127.0.0.1:8761/index.html`. Query flags: `?open` after opening, `?shot` skips the gather, `?tier0` forces the
static composition, `?rm` forces reduced motion. Gilroy loads from `fonts/` (git-ignored); copy the three woff2 files from
`prototype/system/fonts/` or `VIC-Recruitment-2026/frontend/src/assets/fonts/`.

## Shots

`<state>-<d|m>.jpg`, `d` is 1440x900, `m` is 390x844, headless Chrome for Testing through playwright-chrome (software WebGL).
`hero-before-*` countdown state, `hero-open-*` Apply state, `gather-mid-d` mid-load, `scroll-55-d` and `handover-d` the scroll
span, `pointer-lean-d` the field leaning to the pointer, `tier0-*` the static composition, `reduced-motion-d` (a copy of tier0-d, reduced motion renders the same poster) the same under
reduced motion, `scroll-strip-d` and `phone-strip-m` contact sheets.
