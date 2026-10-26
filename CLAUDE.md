# VIC-ENP: the VIC recruitment landing page

The public landing page of the Vision & Innovation Club (ENP Algiers) for the 2026 recruitment. A full 3D,
scroll-driven page whose one call to action takes candidates to the registration. The registration itself is
not built here: today it is the Google Form, later the registration app planned in the
`VIC-Recruitment-2026` repo (`docs/registration-app.md` there).

## Phase: build

Gate 0 is signed (`docs/decisions.md`, 38) and the build runs slice by slice as `docs/build-plan.md` defines.
`npm install`, then `npm run dev`, `npm test` and `npm run build`. Append `?now=<ISO date>` to any URL to check the
CTA before and after `OPENS_AT`.

Start every session at `docs/README.md`. It has the reading order and the current state.

## Hard rules

- Content comes from `docs/source/landing-content-brief.md` (owner-supplied, committee-approved). Never invent
  facts, numbers, dates, quotes or testimonials. Items marked ⚠️ there stay out of the page until resolved in
  `docs/content.md`.
- The VIC charter's logo file rules hold: the flat logo comes from the provided files and is never recoloured,
  cropped, distorted or changed in opacity. Its 3D rule covers post design, not websites, so the 600 may draw the
  icon in points: the icon formation in the hero and the iris slot at the close, nowhere else. Details in
  `docs/brand.md` and `docs/adr/0001-the-icon-formation.md`. Exception: `/apply`'s wax seals press the icon into
  wax of the page's accent (`docs/decisions.md`, 150).
- Every word on the page is real DOM text. The 3D canvas is decoration (`aria-hidden`), and the page reads
  fully without WebGL or with reduced motion.
- No candidate data, ever. The page collects nothing; the CTA is a link.
- Visual checks go through the `playwright-chrome` MCP server (Obscura has CSS gaps on this kind of page).

## Agent skills

### Issue tracker

GitHub Issues on puIad/vic-enp, via the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

The five default labels: needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix. See
`docs/agents/triage-labels.md`.

### Domain docs

Single-context: `docs/decisions.md` is the decision log; a `GLOSSARY.md` and `docs/adr/` get created when first
needed. See `docs/agents/domain.md`.

### Design skills

- `scroll-craft` (nateherk-design plugin): the planning method (brief, journey, grammar, feeling curve, score,
  signature move) and its `shoot.mjs` scroll verifier. Its HTML engine is not used; the build is React Three Fiber.
- `impeccable` and its four agents: design critique, polish and the finish review.
- Agents in `.claude/agents/`: Frontend Developer, UI Designer, Brand Guardian, Content Creator, Evidence
  Collector, Reality Checker, Code Reviewer, plus the four `impeccable-*` agents.
