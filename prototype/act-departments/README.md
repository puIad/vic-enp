# Act comp: the departments (ticket #13)

Throwaway comp of act 3 of the A+B+C merge: seven hard cuts of the same 600-point world (four main departments, then three
activity departments), between C's door and tunnel. Plain HTML + three.js 0.169.0 from jsDelivr. Reuses `prototype/system`'s
sheet, fonts setup and tokens. This branch is never merged.

## Run

```bash
python -m http.server 8752 --bind 127.0.0.1
```

Open `http://127.0.0.1:8752/index.html`. Copy `Gilroy-{Regular,Bold,Heavy}.woff2` into `fonts/` first (git-ignored, no web licence yet).
`?mode=stack` forces the reduced-motion composition, `?mode=t0` forces tier 0 (it also kicks in by itself without WebGL; the
console shows one harmless `0` thrown to stop the script after the cards are set up).

## Shots

`shots/step0..8-<d|m>.jpg`: door, HR, FLER, IT, COMM, SPARK, Training, English Bubble, tunnel (`d` 1440x900, `m` 390x844).
`sheet-d/m.jpg` all nine together, `detail-*` the "What you'd do" panel open, `stack-*` reduced motion, `t0-*` tier 0
(`t0-full-m.jpg` the whole phone page), `cuts-scroll-d.gif` a scroll capture from the door through HR, FLER and IT.
Headless Chrome for Testing (playwright-chrome), software WebGL: frame rate on a phone is not checked.
