# Act 6 comp: how to join, growing after joining, FAQ (ticket #16)

Throwaway comp on a never-merged branch. Plain HTML + three.js 0.169.0 from jsDelivr. Reuses the chrome, tokens, fonts and light act from `prototype/system` (#10). Night stand-ins stand for act 5 (#15) and act 7 (#17).

## Run

```bash
python -m http.server 8761 --bind 127.0.0.1
```

Open `http://127.0.0.1:8761/index.html`. Flags: `?open` (after OPENS_AT), `?tier0` (no WebGL), `?rm` (reduced motion), `?q=0,3` (open those FAQ rows).
Gilroy comes from `fonts/` (git-ignored): copy `Gilroy-{Regular,Bold,Heavy}.woff2` from `VIC-Recruitment-2026/frontend/src/assets/fonts/`.

## Shots

`shots/<plate>-<d|m>.jpg`: `d` 1440x900, `m` 390x844, headless Chrome for Testing via playwright-chrome. `scroll-d.gif` is a 40-frame scroll through the horizon, steps and into "Then grow". `tier0-*` and `rm-*` are the no-WebGL and reduced-motion compositions.
