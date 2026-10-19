# Direction comps (ticket #8)

Throwaway comps of the three directions from #7, one HTML file each: hero and peak, plain HTML and three.js 0.169.0
from jsDelivr. This branch is never merged.

| File | Direction | Peak shown |
|---|---|---|
| `a.html` | A Constellation map: one fixed field, waypoint rail, scale changes | The crowd of points resolves into the group photo in front of ENP; Apply is the empty place the point flies into |
| `b.html` | B Cutlist: 15 hard cuts, loud bar, point in the chrome | Four club-life photo cuts while the point grows in the chrome; full Apply cut |
| `c.html` | C Thresholds: chaptered editorial, margin folio | The tunnel into chapter 03 (club life), then the photo spread; colophon with Apply in the sentence |

## Run

```bash
python -m http.server 8731 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8731/a.html`. Arrow keys or the white pill switch direction. `?shot` hides the pill and
turns off scroll damping (used for the screenshots).

Gilroy is loaded from `fonts/`, which is git-ignored (commercial font, no web licence yet). Copy
`Gilroy-{Light,Regular,Bold,Heavy}.woff2` from `VIC-Recruitment-2026/frontend/src/assets/fonts/` before running.
`pics/` holds 1600 px copies of originals in `assets/pics/` (EXIF dropped).

## Shots

`shots/<a|b|c>-<moment>-<d|m>.jpg`: `d` is 1440x900, `m` is 390x844, headless Chrome for Testing through the
playwright-chrome MCP server (software WebGL). Scroll captures where motion is the point:
`a-resolve-scroll-*.gif` (crowd to photo), `b-cuts-scroll-d.gif` (hard cuts), `c-tunnel-scroll-*.gif` (threshold).
`a-joined-*.jpg` is A after pressing Apply.

## Critique pass (impeccable)

Design review scored A 21/32, B 21/32, C 22/32 (heuristics 7 and 10 n/a). Fixed before showing the owner:

- A: peak caption moved onto a scrim, photo kept partly in points, point moves beside the photo and rises into the
  empty place at the close, a fixed Apply pill from the second waypoint, scrims behind copy, phone framing.
- B: no running text on the gradient (Apply cut on the night, gradient only on the word), the point grows across the
  four club-life cuts (5, 7, 9, 12) instead of jumping, photo overlap, phone point position, maze visibility.
- C: the tunnel was a dark disc around a lit point, which read as an iris: now a filled tube with the point off axis.
  Logo and an Apply link added, thresholds shortened, wider club-life spread.

Left as is: department and event accents in B (charter colours allowed by #7), white text on the aquamarine end of
the Apply gradient (2.1:1, decided in #7; flag for the spec), the phone rail label touching the HR cluster in A.
Not checked: frame rate on a real phone, live scroll feel beyond the captures.
