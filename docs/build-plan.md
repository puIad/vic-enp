# Build plan

Six days from the docs to the opening. The plan is built so the page is **shippable after every slice**: slice 1
alone is a complete, honest page, and each later slice adds to it. If time runs out, the last finished slice
ships and the rest becomes v1.1 during the recruitment window.

## Calendar

| Date | Day | What |
|---|---|---|
| 19 Oct | Mon | Docs written (this folder). Owner gathers inspirations. |
| 20 Oct | Tue | Gate 0 in the morning, then slice 1 |
| 21 Oct | Wed | Slices 2 and 3 |
| 22 Oct | Thu | Slice 4. Copy freeze in the evening |
| 23 Oct | Fri | Slice 4 finish, slice 5 starts. **Cut line** in the evening |
| 24 Oct | Sat | Slice 5: verification, reviews, real phones, production. **Live in the evening** with the countdown |
| 25 Oct | Sun | Recruitment opens. The CTA switches on by itself at `OPENS_AT` |

## Gate 0: docs signed off

No scaffolding, no installs, no code until all of this is true and recorded in [decisions.md](decisions.md):

- [x] The owner has read the docs and accepted them, or the changes are made.
- [x] The 3D concept is chosen: the A+B+C merge ([experience.md](experience.md#the-direction-a-named-merge-a-as-the-page)).
- [x] scroll-craft questions 1, 5, 6 and 7 are answered ([experience.md](experience.md#the-scroll-craft-interview)).
- [x] The journey, feeling curve and peak are accepted or rewritten.
- [x] The answers in [open-questions.md](open-questions.md) marked "Gate 0" are in, or their defaults accepted.

The other open questions can be answered during the build, by the date in their row.

## Slices

One slice, one branch, one PR to `puIad/vic-enp`, one Vercel preview, verified as in
[quality.md](quality.md#how-it-gets-verified) before merging.

### Slice 1: the content page

Scaffold (Vite, React, TS, Tailwind v4, versions checked in Context7), the charter tokens and type, every section
from [content.md](content.md) as real DOM with the current copy, the CTA with the countdown and `OPENS_AT` /
`VITE_APPLY_URL`, the share tags and `og.png`, `vercel.json` headers, the Vercel project. Tier 0 compositions
(the page as it looks with no 3D) designed properly, not as a leftover.

Done: the full page reads well on a phone and a desktop with no 3D at all, the CTA behaves before and after the
opening (tested by overriding the date), the preview builds from a clean clone. **This alone can launch.**

### Slice 2: photos and scroll

`scripts/photos.mjs` and the committed output, focal points, alt text. Lenis and ScrollTrigger wired with the act
structure. The photo sequence with its entrances ([experience.md](experience.md#4-club-life-and-the-photo-sequence-the-peak)), and its
reduced-motion grid.

Done: the photo sequence scrolls smoothly on the phone emulation, `shoot.mjs` shows no dead scroll, photo weights
inside the budget.

### Slice 3: the world core

The canvas layer, lazy loading after first paint, tier detection and step-down, the world store fed by the act
triggers, the hero formation and the pointer reaction (the signature move's first half).

Done: the hero looks like the signed comp on tier 1 and 2, tier 0 is unchanged, the content's LCP is not
slowed by the world (Lighthouse before and after).

### Slice 4: the formations and the peak

A formation per act, the transitions between them, the passages, the peak (the photo resolve and the depth stack), the close (the
visitor's point joins the network on Apply). The canvas moves from the hero's backdrop to the one fixed layer behind
the whole page ([architecture.md](architecture.md)). Added on 2026-10-20 with no comp ([ADR 0001](adr/0001-the-icon-formation.md)): the
hero's icon formation (your point lit in its iris, loosening into the cloud on scroll), the iris slot at the close,
and the hero posters rebaked from the icon. The PR is the owner's first look at both.

Done: `shoot.mjs` shows every act landing, the icon formation reads as the VIC icon in a phone screenshot, the peak
has the largest span and reads in a phone screenshot, frame rate holds on the owner's phone.

### Slice 5: polish and launch

Motion and type polish, the performance pass against the budgets, the finish review, Brand Guardian, Reality
Checker, the owner's real-phone check, the domain, the production deploy, the share preview check.

Done: [quality.md](quality.md#definition-of-done-launch) is met.

#### The owner's notes (2026-10-20)

From the owner's walk of the live page ([decisions.md](decisions.md), 43 to 53). The copy items are built; these
wait for slice 5. The logos are in `assets/logos/` as Illustrator files: export each to SVG unchanged first
([assets.md](assets.md#missing)). Anything not working by the cut line moves to [After launch](#after-launch-v11).

| Owner item | What | Act |
|---|---|---|
| 9 | The activity departments' dots become their own logos: SPARK, Training, English Bubble (`assets/logos/act-deps/`, which also holds VIC Entertainment's) | [3](experience.md#3-departments) |
| 10 | IT's dots: a painting palette in place of the grid (the viewfinder) | [3](experience.md#3-departments) |
| 11 | A transition for the dots from the English Bubble cut into what follows, in place of the hard cut | [3](experience.md#3-departments) |
| 14 | Each event's logo in dots (`assets/logos/events/`). Desktop: the logo's dots sit left, above the event's name, and the current formation stays behind the photo. Phone: only the logo's dots | [5](experience.md#5-events-and-projects) |
| 17 | The four projects' logos next to their names (`assets/logos/projects/`). The copy swap is done ([decisions.md](decisions.md), 49) | [5](experience.md#5-events-and-projects) |
| 19 | A text animation on the last "Once a VICer, Always a VICer." | [7](experience.md#7-close-and-footer) |
| (photos) | Place the five spare photos (`IMG_0257`, `IMG_6141`, `IMG_6171`, `IMG_7517`, `IMG_9215-2`, [assets.md](assets.md#photos)); proposed homes go to the owner first. `IMG_8095.HEIC` stays out until exported | 4, 5 |

## The cut line

Friday 23 Oct, evening. Whatever isn't working then is cut from the launch, in this order (cut the first item
first):

1. Bloom and other postprocessing.
2. The icon formation: the hero gathers into the cloud and your point lights top right, as signed in [#11](https://github.com/puIad/vic-enp/issues/11); the
   posters stay the cloud.
3. The per-cut formations in the departments and events: every cut keeps the field's last formation and only the copy cuts.
   The close's iris slot goes with them: the close keeps the soft irregular clearing signed in [#17](https://github.com/puIad/vic-enp/issues/17).
4. The close's flight and Apply wave: your point is already in the slot, the field is still.
5. The peak's photo resolve: the photo sequence opens with its first photo instead.
6. The world entirely: slice 1 and 2 launch, the world follows in v1.1.

Content and the CTA are never cut.

## After launch (v1.1)

- Switch `VITE_APPLY_URL` to the registration app once it is signed off (in `VIC-Recruitment-2026`).
- Real testimonials, if collected.
- Anything cut at the cut line.
- More photos, `IMG_8095` once exported.
- A closing date line once the recruitment end is set.

## Owner tasks

| Task | By |
|---|---|
| Read the docs and sign Gate 0 | 20 Oct |
| Content checks 1 to 9 in [content.md](content.md#checks-before-the-copy-is-final) | 22 Oct (copy freeze) |
| Approve the new-copy list (open question 27) | 22 Oct (copy freeze) |
| Phones for the performance ramp (open question 25) | slice 3, then 24 Oct |
| Gilroy web licence answer | 22 Oct |
| The Google Form's responder link for `VITE_APPLY_URL` | 23 Oct |
| The exact opening time | 23 Oct |
| The domain and DNS, or accept `vic-enp.vercel.app` | 23 Oct |
| The Vercel project on the owner's account (or approve Claude creating it) | 20 Oct |
| Real-phone check inside Instagram (Android and iPhone) | 24 Oct |
| Final go | 24 Oct evening |
