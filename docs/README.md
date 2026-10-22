# VIC-ENP docs

The plan for VIC's 2026 recruitment landing page, written before any code. Started 2026-10-19.

## Where it stands

- Phase: **build, from slice 1**. The wayfinder map ([issue #1](https://github.com/puIad/vic-enp/issues/1)) settled
  the direction, the journey, the page-wide system and all seven acts on 2026-10-19, and the spec is folded into
  these docs. Gate 0 signed on 2026-10-19 ([decisions.md](decisions.md), 38): the build starts at slice 1.
- 2026-10-20: under a charter exception for websites, the hero's 600 gather into the VIC icon and the close gets an
  iris slot ([ADR 0001](adr/0001-the-icon-formation.md), [decisions.md](decisions.md), 39). Slice 4 builds both.
- 2026-10-20: slice 4 built: one canvas behind the whole page, a formation per act, the cut runs, the passages, the
  peak's resolve, the close's flight and the icon formation. The depth stack stays DOM ([decisions.md](decisions.md), 40);
  the cut line is a set of `?cut=` switches (42). Waiting on the owner: frame rate on their phone and the point ramp
  (open question 25).
- 2026-10-20: the copy declutter. The owner cut eyebrows, pills and spare lines, renamed the events, swapped two
  projects and approved a humanizer pass ([decisions.md](decisions.md), 43 to 53). Their logo and motion notes
  wait in slice 5 ([build-plan.md](build-plan.md#the-owners-notes-2026-10-20)).
- 2026-10-20: slice 5's scope settled with the owner ([decisions.md](decisions.md), 54 to 66): six more copy and
  layout items, the logo formations, the unbuilt parts of the spec, a few extras, then the performance pass,
  reviews and launch, in one priority order ([build-plan.md](build-plan.md#slice-5-polish-and-launch)). Next: slice 5
  as tickets.
- 2026-10-21: reading and wayfinding ([decisions.md](decisions.md), 68 to 78): a catch so a fast fling can't carry
  a visitor past a cut or an act, a rail with sub-dots, name flashes and a hold on phones, and the rail landing in
  the footer as "Jump back to". Slice 5's new group 4, ahead of the reactions
  ([experience.md](experience.md#reading-and-wayfinding)).
- 2026-10-21: the catch on desktop ([#60](https://github.com/puIad/vic-enp/issues/60)), tuned with the owner on their
  Windows touchpad and a mouse ([decisions.md](decisions.md), 79 to 82): three quick swipes skip a run, a flick or
  spin during the glide moves one more cut, coasting still catches. A Mac trackpad is still untried.
- 2026-10-22: the strict catch ([decisions.md](decisions.md), 87 to 96). The owner found the live catch working only
  sometimes, and on phones letting a fling go mid-coast. Rebuilt to decide from the input: one gesture, one cut in the
  runs, coasting never passes a still point, and the page runs its own momentum on phones. Ships with no gate. The
  peak became a third run, one gesture per photo (97).
- Recruitment opens **Sunday 25 October 2026**. The page should be live before then (plan: the evening of 24 Oct,
  with the CTA opening on the 25th).
- Waiting on the owner: the build-time rows in [open-questions.md](open-questions.md)
  by their dates (the new-copy list and the faces check by the 22 Oct copy freeze, the form link by 23 Oct).

## Reading order

| # | Doc | What it settles |
|---|---|---|
| 1 | [brief.md](brief.md) | Goal, audience, scope, success, constraints, timeline |
| 2 | [decisions.md](decisions.md) | Every decision so far, dated, with who made it |
| 3 | [content.md](content.md) | What the page says, section by section, mapped to the source brief |
| 4 | [experience.md](experience.md) | The direction, the journey, the peak, your point, and the spec of each act |
| 5 | [inspiration.md](inspiration.md) | The chosen references and what to take from each |
| 6 | [brand.md](brand.md) | The VIC charter applied to a 3D web page |
| 7 | [assets.md](assets.md) | Photos, brand files, 3D and generated assets, and the pipeline for each |
| 8 | [architecture.md](architecture.md) | Stack, structure, scene and scroll architecture, device tiers, hosting |
| 9 | [quality.md](quality.md) | Performance budgets, accessibility, SEO and sharing, how it gets verified |
| 10 | [build-plan.md](build-plan.md) | Gates, slices, dates, who does what |
| 11 | [open-questions.md](open-questions.md) | Everything still undecided, with an owner and a default |

Other folders:

- [source/landing-content-brief.md](source/landing-content-brief.md): the owner's content brief, copied in
  unchanged on 2026-10-19. The only source of facts for the page.
- [adr/](adr/): decisions made during the build, one file each, each also logged in decisions.md.
- [agents/](agents/): how agent skills use the issue tracker and these docs.
- [../GLOSSARY.md](../GLOSSARY.md): the page's terms (direction, your point, speed, passage, cut sequence).

## Related, outside this repo

- `VIC-Recruitment-2026/docs/registration-app.md`: the registration app the CTA will eventually point at, and the
  Google Form fallback. Its "Slice 1: the landing page" moved here on 2026-10-19 ([decisions.md](decisions.md)).
- `VIC-Recruitment-2026/DESIGN.md` and `PRODUCT.md`: the dashboard's take on the VIC charter. This page uses the
  same charter but a different surface (public, bold, motion-led), so it has its own direction in
  [brand.md](brand.md) and [experience.md](experience.md).
- `VIC-Recruitment-2026/assets/IT-Charter-2026.pdf`: the binding visual source.
