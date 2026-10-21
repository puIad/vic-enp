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

The scope was settled with the owner on 2026-10-20 ([decisions.md](decisions.md), 54 to 66). It runs as tickets on
puIad/vic-enp with blocking edges, worked in the priority order below. Whatever isn't working at the cut line moves
to [After launch](#after-launch-v11), starting from the bottom of this order. Content and the CTA are never cut.

1. **Copy, layout and free fixes** (54 to 58, 64):
   - "What we hold to" and its four values leave act 2 (built, [#26](https://github.com/puIad/vic-enp/issues/26)).
   - VIC Charity's row leaves the club life ledger. VIC Charity stays in the projects (built, [#26](https://github.com/puIad/vic-enp/issues/26)).
   - Each event's name sits at the same height on every cut, on desktop and phone. The lead, cities and link flow
     down from it (built, [#27](https://github.com/puIad/vic-enp/issues/27)).
   - Each event links to its own site: gala.vic-enp.com, ignite.vic-enp.com, polymaze.vic-enp.com and
     aec.vic-enp.com (built, [#26](https://github.com/puIad/vic-enp/issues/26)).
   - The footer loses its description line (act 2 keeps it), and its address becomes "10 Rue des Frères OUDEK, El
     Harrach" (built, [#26](https://github.com/puIad/vic-enp/issues/26)).
   - The world pauses on a hidden tab. The font is preloaded ([quality.md](quality.md)), and the first visible photo
     gets fetch priority.
   - No orphan words: paragraphs use `text-wrap: pretty`, checked on a phone.
   - A 404 page on the night, with the logo and a link back.
   - A reload in the middle of a pinned act lands in the right place; check it and fix it if not.
   - The last four built in [#28](https://github.com/puIad/vic-enp/issues/28) with the hidden tab, the font and the photo priority.
2. **Logo formations and the departments' dots**: owner items 9, 10, 11 and 14 in the table below (built,
   [#29](https://github.com/puIad/vic-enp/issues/29) to [#32](https://github.com/puIad/vic-enp/issues/32)).
3. **Logos beside names, photos, the word scrub, the counters**: owner items 17 and 19 and the photos, from
   the table. Act 2's word scrub with the field's dim under the benefits; the four counters and the 600's pulse
   ([experience.md](experience.md#2-what-vic-is-the-numbers-why-join)). The logos beside names and the photos are
   built ([#33](https://github.com/puIad/vic-enp/issues/33) to [#35](https://github.com/puIad/vic-enp/issues/35)); so is the word scrub ([#36](https://github.com/puIad/vic-enp/issues/36)); the counters ([#37](https://github.com/puIad/vic-enp/issues/37)) are not.
4. **Reactions, the light act, grain, sound** (63, 64):
   - A tap ripple on phones: a tap sends one soft ripple through the 600 from the touch.
   - The light act: your point walks the steps' hairline, and the blocks reveal once.
   - Moving grain on tiers 1 and 2. It stays still on tier 0, under reduced motion and on the world's lowest rung.
   - The sound toggle with a low ambient pad, off on arrival. Claude finds CC0 loops and the owner picks one,
     with the owner's OK before each download. No toggle ships without a loop.
5. **The performance pass** against the budgets, after the owner's phone check with `?fps` and `?points=N` (open
   question 25), and again once groups 2 to 4 are in.
6. **Reviews and launch**: the finish review, Brand Guardian, Reality Checker, the owner's real-phone check inside
   Instagram, the domain, the production deploy, the share preview check.

The page lengths stay as signed: about 30 screens on a phone and 27.5 on desktop, against the 22 to 24 first
planned. Offered and declined on 2026-10-20: your point following the cursor, scroll speed in the field, a magnetic
Apply pill, depth haze.

Done: [quality.md](quality.md#definition-of-done-launch) is met.

#### The owner's notes (2026-10-20)

From the owner's walk of the live page ([decisions.md](decisions.md), 43 to 53), with the details settled on the
same evening (59 to 62, 65). The copy items are built; these are slice 5's groups 2 and 3.

| Owner item | What | Act |
|---|---|---|
| 9 | The activity departments get [logo formations](../GLOSSARY.md), each logo's symbol without its words: SPARK's atom and flame, Training's figure, English Bubble's B | [3](experience.md#3-departments) |
| 10 | IT's dots: a painting palette in place of the grid (the viewfinder) | [3](experience.md#3-departments) |
| 11 | English Bubble's points morph into the tunnel within the scroll that's already there, in place of the hard cut. The page doesn't grow | [3](experience.md#3-departments) |
| 14 | Each event's logo formation. AEC draws its monument and gear. GALA, Ignite (its three nodes and "Ignite", without "Algiers" and ®) and POLYMAZE draw their names, since the name is the logo. Desktop: the logo's dots sit left, above the event's name, and the current formation stays behind the photo. Phone: only the logo's dots | [5](experience.md#5-events-and-projects) |
| 17 | Beside each project's name, its logo's symbol, small and in full colour, otherwise unchanged from the owner's file: CPSP's S, VIC Charity's heart figure, MasterClass's cap and box, VICra's crescent. VIC Entertainment's the same, beside its row in the club life ledger | [5](experience.md#5-events-and-projects), [4](experience.md#4-club-life-and-the-photo-sequence-the-peak) |
| 19 | The closing "Once a VICer, Always a VICer." gets the [word scrub](../GLOSSARY.md), the same as act 2's | [7](experience.md#7-close-and-footer) |
| (photos) | The group photos `IMG_6171`, `IMG_7517` and `IMG_9215-2` join the peak's depth stack, which grows to ten in the same six screens (the tier 0 grid too). `IMG_0257` (a robot in the maze) is a second, smaller frame in POLYMAZE's cut: beside the first on desktop, sharing its height 2:1 on phones. `IMG_6141` (a SPARK workshop) is a small frame in SPARK's cut above the copy, with the logo formation behind it. `IMG_8095.HEIC` stays out until exported | [4](experience.md#4-club-life-and-the-photo-sequence-the-peak), [3](experience.md#3-departments), [5](experience.md#5-events-and-projects) |

The owner's logo files are in `assets/logos/` (Illustrator files saved with PDF inside, so PyMuPDF renders them).
What the page uses was committed by [#29](https://github.com/puIad/vic-enp/issues/29) under `public/logos/`, so a clean
clone has it.

## Where it stands (20 Oct, night)

Slices 1 to 4 are merged, a day and a half ahead of the calendar. Slice 5's groups 1 and 2 are merged, and
group 3 has two tickets left. `IMG_6141` left the page on PR #56 ([decisions.md](decisions.md), 67).

### Tomorrow (21 Oct)

In [slice 5's](#slice-5-polish-and-launch) order, on the open tickets under [#25](https://github.com/puIad/vic-enp/issues/25):

1. Finish group 3: the word scrub ([#36](https://github.com/puIad/vic-enp/issues/36)), then the counters and the
   600's pulse ([#37](https://github.com/puIad/vic-enp/issues/37)).
2. Group 4: the tap ripple ([#38](https://github.com/puIad/vic-enp/issues/38)), the light act
   ([#39](https://github.com/puIad/vic-enp/issues/39)), the moving grain ([#40](https://github.com/puIad/vic-enp/issues/40)),
   the sound toggle ([#41](https://github.com/puIad/vic-enp/issues/41)). For the sound, Claude shortlists CC0 loops and
   the owner picks one and approves each download.
3. The owner's phone check with `?fps` and `?points=N` ([#42](https://github.com/puIad/vic-enp/issues/42)), which
   unblocks the performance pass ([#43](https://github.com/puIad/vic-enp/issues/43)).
4. **The application form on this site** (owner's note, 20 Oct): the form is the link between the landing page and
   the recruitment dashboard, so its answers have to reach the Master the dashboard reads. Its scope, its place in
   the plan and how it relates to `VITE_APPLY_URL` and the registration app in `VIC-Recruitment-2026` are not
   settled yet ([open-questions.md](open-questions.md), 29). Settle them with the owner first, then ticket it.
5. Owner answers that were due on 20 Oct and are still open: the Vercel project (8) and PR reviews (22). Due
   22 Oct: content check 9, the Gilroy licence (11), the logo fade (19), the new-copy list (27).

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
