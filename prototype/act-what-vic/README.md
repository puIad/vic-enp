# Act 2: what VIC is, the numbers, why join (ticket #12)

Throwaway comp on top of `prototype/act-hero` (system sheet, tokens, hero field, rail, pill). One HTML file, three.js 0.169.0 from jsDelivr.
Never merged.

Run: `python -m http.server 8812 --bind 127.0.0.1`, open `http://127.0.0.1:8812/index.html`. Flags: `?open` (Apply state), `?shot` (skip the
gather, counters final, benefits revealed), `?tier0` (static composition), `?rm` (reduced motion, same composition), `?a=0..1` (pin the act's progress).
Gilroy is loaded from `fonts/` (copied from `prototype/system/fonts`, no web licence yet, open question 11).

Shots: `<n>-<state>-<d|m>.jpg`, d = 1440x900, m = 390x844, headless Chrome for Testing via playwright-chrome (software WebGL, so no frame rate).
`scroll-d.gif` is a 16-frame scroll through the pinned span.
