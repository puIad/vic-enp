# Open questions

Everything not yet decided. When one is answered, move it to [decisions.md](decisions.md) with the date and
delete the row here. "Default" is what the build does if no answer arrives by the date.

## Gate 0 (before any code)

| # | Question | Owner | Default | Where |
|---|---|---|---|---|
| 1 | Which 3D concept: A (network of 600), B (glass maze), C (light and glass), or a mix? | Owner | A | [experience.md](experience.md#the-3d-world-three-concepts) |
| 2 | Vibe in three to five words, plus up to three references (scroll-craft Q1) | Owner | "bright, ambitious, warm, made by students" | [inspiration.md](inspiration.md) |
| 3 | The one thing this site does that no other site does (Q5) | Owner | "Your point": the visitor's point of light joins the network on Apply | [experience.md](experience.md#a-the-network-of-600-recommended) |
| 4 | How far from premium-minimal (Q6) | Owner | Playful-premium | [experience.md](experience.md#the-scroll-craft-interview) |
| 5 | One unbroken world, or distinct scenes (Q7) | Owner | One world that re-forms per act, no camera flight | [experience.md](experience.md#grammar) |
| 6 | The journey, feeling curve and peak as proposed? | Owner | As proposed | [experience.md](experience.md#the-journey) |
| 7 | The sentence the visitor should believe by the end | Owner | The proposal in the brief | [brief.md](brief.md#what-the-visitor-should-believe-by-the-end) |
| 8 | Create the Vercel project now (Claude, on the owner's account) or does the owner create it? | Owner | Owner creates it | [architecture.md](architecture.md#hosting) |

## During the build

| # | Question | Owner | Default | Needed by |
|---|---|---|---|---|
| 9 | Content checks 1 to 9 (what candidates choose, the 48 hours, IT wording, FLER note, confirmation mail, CTA label, page copy, testimonials, faces in photos) | Owner | The proposed copy in [content.md](content.md#checks-before-the-copy-is-final); testimonials cut | 22 Oct |
| 10 | Hero tagline: "Where polytechnicians learn to lead.", "Engineer more than your degree." or "Learn it. Build it. Lead it." | Owner | "Engineer more than your degree." | 22 Oct |
| 11 | Does VIC hold a web licence for Gilroy? | Owner | No licence assumed: production uses the closest free family ([brand.md](brand.md#type-charter-p17-to-20)) | 22 Oct |
| 12 | Event colours: exact gold (Gala), red (Ignite), blue (Hour of Code) | Owner or IT | Picked by eye from the latest edition's posters, then shown to the owner | 22 Oct |
| 13 | What each photo shows (event, place) for captions | Owner | No captions, alt text only | 21 Oct |
| 14 | `IMG_8095.HEIC`: export it as JPEG? | Owner | Left out | 21 Oct |
| 15 | The Google Form's responder link | Owner | None: **blocks launch** | 23 Oct |
| 16 | Exact opening time on 25 Oct (Algiers time) | Owner | 00:00 | 23 Oct |
| 17 | The domain and who holds its DNS | Owner | `vic-enp.vercel.app` | 23 Oct |
| 18 | Count visits and CTA clicks with Vercel Web Analytics (cookieless)? | Owner | No analytics | 23 Oct |
| 19 | The charter says "do not change the opacity of the logo". Is a fade-in allowed? | Owner | No fade: the logo appears at full opacity | 22 Oct |
| 20 | El-Maarifa shown as a logo in the footer, or as text? | Owner | Text | 22 Oct |
| 21 | An optional sound toggle? | Owner | No sound | 22 Oct |
| 22 | PR reviews: add the claude GitHub Action like the recruitment repo, or local Code Reviewer agent only? | Owner | Local agent only | 20 Oct |

## Tooling, not blocking

| # | Issue | Owner | Note |
|---|---|---|---|
| 23 | The `impeccable` skill's `SKILL.md` is a 46-byte stub (`description: fixture`) in `~/.claude-library` and every project copy since 2026-10-14. Its `reference/` files are intact. | Owner (AI-OS) | Restore from the upstream v4.5.0 package, and find what overwrote it (probably a test writing to the real library path). Until then, read `reference/*.md` directly. |
| 24 | `VIC-Recruitment-2026/docs/registration-app.md` still plans the landing page in `site/` (its slice 1). | Claude | Add a line there pointing here; held back while the load test runs on that repo. |
