# System sheet (ticket #10)

Throwaway comp of what every act shares in the A+B+C merge from #8: type, colour, texture, the Apply pill,
navigation and progress, the loader, the cursor and sound. One plain HTML file, no three.js (the field is a 2D
stand-in for A's world). This branch is never merged.

## Run

```bash
python -m http.server 8741 --bind 127.0.0.1
```

Open `http://127.0.0.1:8741/index.html`. `?shot` shows the pill at once and freezes the loader mid-gather;
`?open` shows the page after `OPENS_AT` (2026-10-25 00:00 Algiers).

Gilroy is loaded from `fonts/`, git-ignored (commercial font, no web licence yet). Copy
`Gilroy-{Regular,Bold,Heavy}.woff2` from `VIC-Recruitment-2026/frontend/src/assets/fonts/` before running.

## Shots

`shots/<plate>-<d|m>.jpg`: `d` is 1440x900, `m` is 390x844, headless Chrome for Testing through the
playwright-chrome MCP server. `sheet-*.jpg` is the whole page. `open-state-d.jpg` is the pill after opening.

## Detector

`impeccable detect` flags the coloured glows (kept: the vibe from #6 is charter light glowing on the night) and
white on the pill's gradient (a false hit: the label sits on the night fill, the gradient is only the ring).
