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
