# Decisions

Newest at the bottom. "Owner" is Mourad Fernane. A decision changes only with a new dated line here.

## 2026-10-19

| # | Decision | By | Notes |
|---|---|---|---|
| 1 | The landing page lives in its own repo, `VIC-ENP` (`puIad/vic-enp`, private), next to `VIC-Recruitment-2026`. | Owner | Replaces "Slice 1: the landing page" of `VIC-Recruitment-2026/docs/registration-app.md`, which planned it inside `site/`. |
| 2 | VIC-ENP holds the landing page only. The registration app stays planned in `VIC-Recruitment-2026`. | Owner | The CTA links across. |
| 3 | Recruitment opens on **25 Oct 2026** (moved from 20 Oct). The page goes live before it. | Owner | |
| 4 | The wow factor is a **full 3D experience**, not a 2D scroll page with one 3D moment. | Owner | The owner gathers inspirations for assets and motion ([inspiration.md](inspiration.md)) and uses the design skills for guidance. |
| 5 | The 17 photos in `assets/pics/` (mostly group photos) feed a scroll-driven section where each photo appears in its own way. They are different sizes, formats and orientations, to be normalised by the pipeline. | Owner | [assets.md](assets.md#photos) |
| 6 | Stack: Vite, React 19, TypeScript, Tailwind v4 (like the dashboard), React Three Fiber, drei, GSAP ScrollTrigger, Lenis. | Owner | Versions get checked against current docs (Context7) at scaffold time. |
| 7 | The CTA target is one env var, `APPLY_URL`: the Google Form's link at launch, the registration app's `/apply` once it is signed off. A Redeploy flips it. | Owner | Same switch the registration plan already describes. |
| 8 | A private GitHub repo `puIad/vic-enp`, GitHub Issues as the tracker, docs-only changes pushed straight to `main`. | Owner | |
| 9 | Photo originals stay git-ignored on disk. A script makes AVIF and WebP copies at three widths, and those are committed. The build never reads the originals. | Owner | Avoids the "ignored locally, missing on Vercel" trap. |
| 10 | Hosting on Vercel, owner's account, a new project separate from the dashboard. | Default, from the registration plan | Change it in [open-questions.md](open-questions.md) if needed. |
| 11 | Plan with `scroll-craft` (its brief, journey, feeling curve, grammar, score, signature move, fingerprint gate) and verify with its `shoot.mjs`. Build with R3F, not scroll-craft's HTML engine. | Claude, from 4 and 6 | Its engine drives `data-sc-*` markup in plain HTML and has no R3F story. |
| 12 | No generated images of people presented as VIC events. Generated imagery (agy) is limited to abstract textures, backgrounds, environment maps and the share image's background. | Claude, from the brief's honesty constraint | Owner may override in [open-questions.md](open-questions.md). |
| 13 | The `impeccable` skill is usable again: its real v4.5.0 `SKILL.md` was restored in the library and every project on 2026-10-19 (it had been a 46-byte upstream test fixture since 2026-10-14, copied in by `update-skills.py`). Closes open question #23. | Side session | `update-skills.py` now skips test and fixture paths. |

## 2026-10-19: the wayfinder map (issue #1)

Each line links the ticket that holds the full answer. The spec itself lives in [experience.md](experience.md),
[content.md](content.md), [brand.md](brand.md) and [architecture.md](architecture.md).

| # | Decision | By | Notes |
|---|---|---|---|
| 14 | Phone budget: tier 1 at DPR 1.5, points only (10k to 15k), fog, CSS grain and vignette; no bloom, glass, volumetrics, depth of field or video textures. Tier 2 may add one bloom pass and one low-res glass object. Handle context loss. | Owner | [#5](https://github.com/puIad/vic-enp/issues/5). Costs are estimates until open question 25. |
| 15 | The belief: "Once you are a VICer, you are always a VICer, and I can be one this season." | Owner | [#6](https://github.com/puIad/vic-enp/issues/6). Replaces the proposal in [brief.md](brief.md). Gate 0 question 7. |
| 16 | The vibe: dark, cinematic, electric. Distance from premium-minimal: the middle (premium dark base, dense dramatic acts). | Owner | [#6](https://github.com/puIad/vic-enp/issues/6). Gate 0 questions 2 and 4. |
| 17 | The one thing: "Your point", the visitor's own point of light, which travels down the page and joins the 600 on Apply. | Owner | [#6](https://github.com/puIad/vic-enp/issues/6). Gate 0 question 3. |
| 18 | The gradient lives in light and on Apply, never in or behind text. Gilroy, at most three weights, never all caps. | Owner | [#7](https://github.com/puIad/vic-enp/issues/7) |
| 19 | The direction: a named merge with A (Constellation map) as the page, B's hard cuts for the departments and events, C's passages (door, tunnel, horizon) between them. | Owner | [#8](https://github.com/puIad/vic-enp/issues/8). Gate 0 question 1. Concepts B (glass maze) and C (light and glass) as worlds are not used. |
| 20 | Grammar: one world at two speeds (A morphs, B snaps, C switches), one WebGL context, seven acts with the feelings and devices in [experience.md](experience.md#the-journey). Why join moves into act 2. | Owner | [#9](https://github.com/puIad/vic-enp/issues/9). Gate 0 questions 5 and 6. |
| 21 | The peak: the 600 resolve into the group photo in front of ENP, hold, then seven photos in a depth stack, then a hard cut to the first event. | Owner | [#9](https://github.com/puIad/vic-enp/issues/9), [#14](https://github.com/puIad/vic-enp/issues/14) |
| 22 | Every photo has rounded corners: 20 px desktop, 16 px phone. | Owner | [#9](https://github.com/puIad/vic-enp/issues/9), [#14](https://github.com/puIad/vic-enp/issues/14) |
| 23 | Testimonials stay cut until real quotes arrive. | Owner | [#9](https://github.com/puIad/vic-enp/issues/9) |
| 24 | Type: Gilroy Heavy, Bold, Regular (Medium dropped), sentence case, the scale in [brand.md](brand.md#type-charter-p17-to-20), display capped at 128 px. | Owner | [#10](https://github.com/puIad/vic-enp/issues/10) |
| 25 | Colour: night everywhere except how to join and the FAQ, which turn Bright Gray through the horizon; the fixed logo steps away there. Static 7% grain plus vignette. | Owner | [#10](https://github.com/puIad/vic-enp/issues/10) |
| 26 | The Apply pill: night fill, gradient ring, white label; "Applications open 25 Oct" with a countdown before `OPENS_AT`. Settles the 2.1:1 contrast flag from #8. CTA label "Apply" (content check 6). | Owner | [#10](https://github.com/puIad/vic-enp/issues/10), [#11](https://github.com/puIad/vic-enp/issues/11) |
| 27 | Navigation: no menu; A's waypoint rail is nav and progress, with a tick per B cut. No full-screen loader: "Gathering the 600" ends by lighting your point. Native cursor. | Owner | [#10](https://github.com/puIad/vic-enp/issues/10) |
| 28 | An optional sound toggle, off on arrival. Closes open question 21. | Owner | [#10](https://github.com/puIad/vic-enp/issues/10) |
| 29 | Hero tagline: "Engineer more than your degree." Closes open question 10. The hero spec as in [experience.md](experience.md#1-hero). | Owner | [#11](https://github.com/puIad/vic-enp/issues/11) |
| 30 | Act 2: title, three sentences, four values, four numbers (no sponsor count), ten benefits in three groups. | Owner | [#12](https://github.com/puIad/vic-enp/issues/12) |
| 31 | Departments: seven hard cuts between the door and the tunnel, HR, FLER, IT, COMM, SPARK, Training, English Bubble; accents only for the activity departments; IT says "design and media, not programming". Content checks 3 and 4. | Owner | [#13](https://github.com/puIad/vic-enp/issues/13) |
| 32 | Peak photos in the order of [experience.md](experience.md#4-club-life-and-the-photo-sequence-the-peak); no captions, alt text only (closes open question 13); `IMG_8095.HEIC` stays out (closes 14). | Owner | [#14](https://github.com/puIad/vic-enp/issues/14) |
| 33 | Events: five cuts, no edition numbers or dates, Hour of Code dropped; Gala gold `#D4A843`, Ignite red `#E0313F`, Hour of Code blue `#2F80ED` (closes open question 12). | Owner | [#15](https://github.com/puIad/vic-enp/issues/15) |
| 34 | How to join, growth and FAQ as the one light act: four steps, a six-rung staircase, nine FAQ rows with two rewrites. Content checks 1, 2 and 5 at their proposals. | Owner | [#16](https://github.com/puIad/vic-enp/issues/16) |
| 35 | The close: "Your point is on its way.", your point lands in a slot in the Apply pill inside a clearing of the 600, Apply sends a wave through them. El-Maarifa as text in the footer (closes open question 20). | Owner | [#17](https://github.com/puIad/vic-enp/issues/17) |
| 36 | Third-party code: port every comp to R3F, except the depth stack, which starts from Meng To's MIT Gallery on 21st.dev, installed on the owner's 21st.dev account. No Originkit. | Owner | [#19](https://github.com/puIad/vic-enp/issues/19), [architecture.md](architecture.md#third-party-code) |
| 37 | Performance proof on a real phone and the share image and favicon move to build time (open questions 25, 26); the new-copy list goes to the owner by the 22 Oct copy freeze (27). | Owner | [#18](https://github.com/puIad/vic-enp/issues/18) |
| 38 | **Gate 0 signed.** The owner read the docs and accepted them as written, including open question 28's default and the rewritten cut line items 2 and 3. The build can start at slice 1. | Owner | [#18](https://github.com/puIad/vic-enp/issues/18). Every Gate 0 box in [build-plan.md](build-plan.md#gate-0-docs-signed-off) ticked. |

## 2026-10-20: the icon formation

| # | Decision | By | Notes |
|---|---|---|---|
| 39 | Charter exception for this website: the charter's 3D rule covers post design, not websites, so every 3D logo rule in [brand.md](brand.md#logo-in-a-3d-world) is lifted here and the logo files keep their rules. The hero's 600 gather into the VIC icon and hold it until the first scroll, your point lit in its iris, then loosen into the signed cloud. The close's slot gets an iris ring of the 600 (the iris slot); every other act stays as signed. Built in slice 4 with no comp, second in the cut line. | Owner; the exception from VIC's IT department | [ADR 0001](adr/0001-the-icon-formation.md). Amends [#11](https://github.com/puIad/vic-enp/issues/11) and [#17](https://github.com/puIad/vic-enp/issues/17). |
