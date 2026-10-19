# Act comp: events and projects (ticket #15)

Throwaway comp of act 5 of the A+B+C merge: six sideways hard cuts of the same 600-point world (Gala, Ignite, Polymaze, AEC, four more projects, Hour of Code), entered by a hard cut from the peak and left through C's horizon. Plain HTML + three.js 0.169.0 from jsDelivr. Reuses `prototype/system`'s sheet, fonts setup and tokens. This branch is never merged.

## Run

```bash
python -m http.server 8793 --bind 127.0.0.1
```

Open `http://127.0.0.1:8793/index.html`. Copy `Gilroy-{Regular,Bold,Heavy}.woff2` into `fonts/` first (git-ignored, no web licence yet). `?mode=stack` forces the reduced-motion composition, `?mode=t0` tier 0 (it also kicks in without WebGL; one harmless `0` is thrown in the console).

## Shots

`shots/step0..6-<d|m>.jpg`: Gala, Ignite, Polymaze, AEC, four more, Hour of Code, horizon (`d` 1440x900, `m` 390x844). `sheet-d/m.jpg` all seven, `handin-before-*` the peak stand-in just before the cut, `cuts-scroll-d/m.gif` a scroll capture across Gala, Ignite and Polymaze, `stack-full-*` reduced motion, `t0-full-*` tier 0.
Event colours (gold `#D4A843`, red `#E0313F`, blue `#2F80ED`) are picked by eye, not from posters (none in the repo): open question 12 for the owner. Headless Chrome for Testing (playwright-chrome), software WebGL: frame rate on a phone is not checked.
