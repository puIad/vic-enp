# Close act (ticket #17)

Throwaway comp of act 7, the close and the footer, on top of `prototype/act-hero` (which sits on `prototype/system`): tokens,
Gilroy, grain and vignette, the rail, the readout and the sound toggle are reused. One plain HTML file, three.js 0.169.0 from
jsDelivr. The field is the hero's seeded cloud of 600 members plus dust (9k desktop, 5k phone), with short links between near
members, and one soft irregular clearing carved around the Apply pill. This branch is never merged.

## Run

```bash
python -m http.server 8771 --bind 127.0.0.1
```

Open `http://127.0.0.1:8771/index.html`. Flags: `?open` after opening, `?d=<ms>` ms before opening, `?p=<0..1>` freezes the
travel progress, `?wave=<0..1>` freezes the Apply moment, `?tier0` forces the static composition, `?rm` reduced motion. Gilroy
loads from `fonts/` (git-ignored; copy the woff2 files from `prototype/system/fonts/`).

## Shots

`close-<state>-<d|m>.jpg`, `d` 1440x900, `m` 390x844, headless Chrome for Testing through playwright-chrome (software WebGL).
`close-before-*` and `close-open-*` the two opening states at rest, `apply-*` the Apply moment frozen mid-wave, `footer-*`,
`entry-*` the horizon settling, `t15`, `t55`, `t75` the travel (headline, flight, landing), `tier0-*` and
`reduced-motion-*` the static composition, `scroll-strip-d` and `phone-strip-m` contact sheets.
