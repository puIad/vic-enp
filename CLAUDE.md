# VIC-ENP: the VIC recruitment landing page

The public landing page of the Vision & Innovation Club (ENP Algiers) for the 2026 recruitment. A full 3D,
scroll-driven page whose one call to action takes candidates to the registration. The registration itself is
not built here: today it is the Google Form, later the registration app planned in the
`VIC-Recruitment-2026` repo (`docs/registration-app.md` there).

## Phase: docs first, no building

Nothing gets scaffolded, installed or coded until `docs/build-plan.md` says the docs gate is passed
(owner sign-off recorded in `docs/decisions.md`). Until then, work happens only in `docs/`.

Start every session at `docs/README.md`. It has the reading order and the current state.

## Hard rules

- Content comes from `docs/source/landing-content-brief.md` (owner-supplied, committee-approved). Never invent
  facts, numbers, dates, quotes or testimonials. Items marked ⚠️ there stay out of the page until resolved in
  `docs/content.md`.
- The VIC charter's logo rules hold in 3D: the logo is never modelled, extruded, animated, recoloured or split
  into its bulb and iris. Details in `docs/brand.md`.
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
- `impeccable` and its four agents: design critique, polish and the finish review. Its entry `SKILL.md` is a
  46-byte stub in the library right now (see `docs/open-questions.md`); its `reference/` files are intact and can
  be read directly.
- Agents in `.claude/agents/`: Frontend Developer, UI Designer, Brand Guardian, Content Creator, Evidence
  Collector, Reality Checker, Code Reviewer, plus the four `impeccable-*` agents.
