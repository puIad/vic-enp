# Open questions

Everything not yet decided. When one is answered, move it to [decisions.md](decisions.md) with the date and
delete the row here. "Default" is what the build does if no answer arrives by the date.

Gate 0 questions 1 to 7 and build questions 10, 12, 13, 14, 20, 21 and 23 were answered on 2026-10-19
([decisions.md](decisions.md)). Gate 0 has none left.

## During the build

| # | Question | Owner | Default | Needed by |
|---|---|---|---|---|
| 8 | Create the Vercel project now (Claude, on the owner's account) or does the owner create it? | Owner | Owner creates it | 20 Oct |
| 9 | Content check 9: may members' faces in the group photos go on the public page? (checks 1 to 8 are settled in [content.md](content.md#checks-before-the-copy-is-final)) | Owner | Yes, they are likely on `@vic.enp` already | 22 Oct |
| 11 | Does VIC hold a web licence for Gilroy? | Owner | No licence assumed: production uses the closest free family ([brand.md](brand.md#type-charter-p17-to-20)) | 22 Oct |
| 15 | The Google Form's responder link | Owner | None: **blocks launch** | 23 Oct |
| 16 | Exact opening time on 25 Oct (Algiers time) | Owner | 00:00 | 23 Oct |
| 17 | The domain and who holds its DNS | Owner | `vic-enp.vercel.app` | 23 Oct |
| 18 | Count visits and CTA clicks with Vercel Web Analytics (cookieless)? | Owner | No analytics | 23 Oct |
| 19 | The charter says "do not change the opacity of the logo". Is a fade-in allowed? | Owner | No fade: the logo appears at full opacity | 22 Oct |
| 22 | PR reviews: add the claude GitHub Action like the recruitment repo, or local Code Reviewer agent only? | Owner | Local agent only | 20 Oct |
| 25 | Performance proof: does the heaviest act fit [quality.md](quality.md)'s budgets on a real mid-range phone in Instagram's browser? The 10k to 80k point ramp from [#5](https://github.com/puIad/vic-enp/issues/5) runs on the owner's phones in slice 3 and again in slice 5. Moved to build time by the owner, 2026-10-19. | Claude, on the owner's phones | If a tier misses, step it down; the cut line in [build-plan.md](build-plan.md#the-cut-line) covers the rest | 23 Oct (cut line) |
| 26 | Share image (`og.png`) and favicon in the chosen direction. Made in slice 1 with the share tags: a baked frame of the hero scene with the tagline, favicon from the charter's logo files. Moved to build time by the owner, 2026-10-19. | Claude, shown to the owner | As described | 21 Oct |
| 27 | New copy written for the page (act titles, department lines and leads, step and rung titles, the close headline): one list for the owner's approval. The list is in [content.md](content.md#new-lines-for-the-owners-approval). Decided by the owner, 2026-10-19. | Owner | The lines as comped in tickets #11 to #17 | 22 Oct (copy freeze) |
| 28 | How your point moves from top right (hero, act 2) to bottom right (departments, peak, events) on desktop. The comps fix it per act and don't show the move. **Settled in slice 4** ([decisions.md](decisions.md), 41). | Claude, shown to the owner | It travels during the door and back to top right during the horizon in; on phones it stays top right | slice 4 |
| 29 | The application form on this site, the link between the landing page and the recruitment dashboard (raised by the owner, 2026-10-20). What it asks, where its answers land (the Master, as the registration app plans in `VIC-Recruitment-2026/docs/registration-app.md`), whether it replaces the Google Form behind `VITE_APPLY_URL` at launch or follows in v1.1, and which repo builds it. | Owner | Not settled: ask before building | 21 Oct |

## Tooling, not blocking

| # | Issue | Owner | Note |
|---|---|---|---|
| 24 | `VIC-Recruitment-2026/docs/registration-app.md` still plans the landing page in `site/` (its slice 1). | Claude | Add a line there pointing here; held back while the load test runs on that repo. |
