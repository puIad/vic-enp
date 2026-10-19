# Act 4, club life and the photo sequence (ticket #14)

Throwaway comp of the peak: the 600 points rush into the group photo in front of ENP, it holds still, then seven more
photos enter one by one, each in its own way. Plain HTML + three.js 0.169.0 (jsDelivr), reusing `prototype/system`'s tokens,
chrome and fonts setup. This branch is never merged.

## Run

```bash
python -m http.server 8751 --bind 127.0.0.1
```

Open `http://127.0.0.1:8751/index.html`. `?shot` turns off scroll damping, `?tier0` forces the no-WebGL composition,
`?reduced` (or the OS setting) forces the reduced-motion one. Both show the same still grid. Gilroy is loaded from `fonts/`
(git-ignored); copy `Gilroy-{Regular,Bold,Heavy}.woff2` from `VIC-Recruitment-2026/frontend/src/assets/fonts/`.
`pics/` holds 1600 px copies (EXIF dropped) of the originals in `assets/pics/`.

## Shots

`shots/<moment>-<d|m>.jpg`, `d` 1440x900, `m` 390x844, headless Chrome for Testing (software WebGL).
`a-resolve-scroll-*.gif` is the scroll capture of the resolve and the hold. `tier0-*` is the still grid, full page.
`cut-*` is the hard cut into the first event (act 5 stub).
