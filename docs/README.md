# VIC-ENP docs

The plan for VIC's 2026 recruitment landing page, written before any code. Started 2026-10-19.

## Where it stands

- Phase: **build, from slice 1**. The wayfinder map ([issue #1](https://github.com/puIad/vic-enp/issues/1)) settled
  the direction, the journey, the page-wide system and all seven acts on 2026-10-19, and the spec is folded into
  these docs. Gate 0 signed on 2026-10-19 ([decisions.md](decisions.md), 38): the build starts at slice 1.
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
- [agents/](agents/): how agent skills use the issue tracker and these docs.
- [../GLOSSARY.md](../GLOSSARY.md): the page's terms (direction, your point, speed, passage, cut sequence).

## Related, outside this repo

- `VIC-Recruitment-2026/docs/registration-app.md`: the registration app the CTA will eventually point at, and the
  Google Form fallback. Its "Slice 1: the landing page" moved here on 2026-10-19 ([decisions.md](decisions.md)).
- `VIC-Recruitment-2026/DESIGN.md` and `PRODUCT.md`: the dashboard's take on the VIC charter. This page uses the
  same charter but a different surface (public, bold, motion-led), so it has its own direction in
  [brand.md](brand.md) and [experience.md](experience.md).
- `VIC-Recruitment-2026/assets/IT-Charter-2026.pdf`: the binding visual source.
