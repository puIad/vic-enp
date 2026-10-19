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

- [ ] The owner has read the docs and accepted them, or the changes are made.
- [ ] The 3D concept is chosen (A, B, C or a mix) after the inspiration round ([experience.md](experience.md#the-3d-world-three-concepts)).
- [ ] scroll-craft questions 1, 5, 6 and 7 are answered ([experience.md](experience.md#the-scroll-craft-interview)).
- [ ] The journey, feeling curve and peak are accepted or rewritten.
- [ ] The answers in [open-questions.md](open-questions.md) marked "Gate 0" are in, or their defaults accepted.

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
structure. The photo sequence with its entrances ([experience.md](experience.md#the-photo-sequence)), and its
reduced-motion grid.

Done: the photo sequence scrolls smoothly on the phone emulation, `shoot.mjs` shows no dead scroll, photo weights
inside the budget.

### Slice 3: the world core

The canvas layer, lazy loading after first paint, tier detection and step-down, the world store fed by the act
triggers, the hero formation and the pointer reaction (the signature move's first half).

Done: the hero looks like the approved concept on tier 1 and 2, tier 0 is unchanged, the content's LCP is not
slowed by the world (Lighthouse before and after).

### Slice 4: the formations and the peak

A formation per act, the transitions between them, the peak (for concept A, the photo resolve), the close (the
visitor's point joins the network on Apply).

Done: `shoot.mjs` shows every act landing, the peak has the largest span and reads in a phone screenshot, frame
rate holds on the owner's phone.

### Slice 5: polish and launch

Motion and type polish, the performance pass against the budgets, the finish review, Brand Guardian, Reality
Checker, the owner's real-phone check, the domain, the production deploy, the share preview check.

Done: [quality.md](quality.md#definition-of-done-launch) is met.

## The cut line

Friday 23 Oct, evening. Whatever isn't working then is cut from the launch, in this order (cut the first item
first):

1. Bloom and other postprocessing.
2. Formations for the less important acts (FAQ, how to join): they keep a quiet drift.
3. The close's "your point joins the network" moment: the close becomes a still network and the button.
4. The peak's photo resolve: the photo sequence opens with its first photo instead.
5. The world entirely: slice 1 and 2 launch, the world follows in v1.1.

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
| Read the docs, answer the Gate 0 questions, choose the concept | 20 Oct morning |
| Inspirations in [inspiration.md](inspiration.md) | 20 Oct morning |
| Content checks 1 to 9 in [content.md](content.md#checks-before-the-copy-is-final) | 22 Oct (copy freeze) |
| Gilroy web licence answer | 22 Oct |
| The Google Form's responder link for `VITE_APPLY_URL` | 23 Oct |
| The exact opening time | 23 Oct |
| The domain and DNS, or accept `vic-enp.vercel.app` | 23 Oct |
| The Vercel project on the owner's account (or approve Claude creating it) | 20 Oct |
| Real-phone check inside Instagram (Android and iPhone) | 24 Oct |
| Final go | 24 Oct evening |
