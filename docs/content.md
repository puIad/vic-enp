# Content

What the page says, in page order. Facts come only from
[source/landing-content-brief.md](source/landing-content-brief.md) (cited as §n). The order here is the
content order; how each section looks and moves is in [experience.md](experience.md), and the order may change
once the journey is settled there.

## Voice

- Short sentences, plain English, second person ("you"). Many readers read English as a second or third language.
- Concrete over grand: "organise an event with sponsors and hundreds of guests" beats "unleash your potential".
- Sentence case everywhere, never all caps (charter rule for Gilroy).
- Proper names as the club writes them: VIC, VICer, ENP, HR, FLER, IT, COMM, SPARK, English Bubble, Training,
  The Local, FARI9 TI9NI, P&V, Engineers' Gala, Ignite Algiers, Polymaze, STEPS, AEC, VICra, CPSP.
- No promise the club can't keep: never "you'll be interviewed", always "if your application is accepted".
- Taglines and section intros written for the page are proposals until the owner approves them.

## Sections

| # | Section | Source | Must say | Notes |
|---|---|---|---|---|
| 1 | Hero | §1, §11 | Vision & Innovation Club, ENP. One tagline. The CTA (or the countdown before opening). | Tagline candidates in §1: "Where polytechnicians learn to lead.", "Engineer more than your degree.", "Learn it. Build it. Lead it." Owner picks one. |
| 2 | What VIC is | §1, §2 | Nonprofit, English-speaking scientific club at ENP since 2014, part of El-Maarifa. Mission and vision in one or two lines each. | Keep the five "aims" (§2) out of the hero zone; they fit as supporting lines here. |
| 3 | Numbers | §11 | 600 members · 40+ trainings a year · 9 Engineers' Galas · since 2014 | All ✅. "~20 sponsors" only with "this year". Counters animate once, then hold. |
| 4 | Why join | §3 | The ten benefits, grouped (responsibility, skills, growth, voice, community). | Ten is too many to show flat; group into three or four. The Local and "every VICer is welcome" belong here. |
| 5 | Main departments | §4 | HR, FLER, IT, COMM: what it does, what you'd do, skills, who it suits. | IT means design and media, not programming: say it in the IT card itself ([check 3](#checks-before-the-copy-is-final)). FLER eligibility note goes to the FAQ, not the card. Gear list (§4.3) is a detail line, not a headline. |
| 6 | Activity departments | §5 | SPARK, Training, English Bubble: what you learn and how. | Each has its own colour identity (§12). SPARK's free learning platform and Training's "you choose the skills" are the strongest lines. |
| 7 | Club life | §6 | VIC Entertainment, The Local, general assemblies, charity, alumni. | The photo section lives here or next to it ([experience.md](experience.md#the-photo-sequence)). The private VICers-only Instagram is a "once you're in" detail. |
| 8 | Events and projects | §7 | Engineers' Gala (9th edition, 2026), Ignite Algiers, AEC, Polymaze, STEPS, CPSP, Anglosphere, VICra, Hour of Code (as history). | Each event has a fixed identity colour (§7, §12: Gala gold, Ignite red, Hour of Code blue). Link Gala teasers to Instagram `@vic.enp`. Event history dates are 🌐: keep them, but nothing that reads as a promise of a date. |
| 9 | How to join | §8 | Who (every ENP student), when (opens 25 Oct 2026), what you choose, the steps. | Rewritten against how registration really works ([checks 1, 2](#checks-before-the-copy-is-final)). Closing date not set: omit it. |
| 10 | Grow after joining | §8 | Organising teams, project manager, specialised teams, elections, R&D Squad. | Could merge into "Why join" if the page runs long. |
| 11 | Testimonials | §13 | One quote per main department plus one alum. | Placeholders only in the source. **Does not ship with placeholders**: the section is cut until real quotes arrive. |
| 12 | FAQ | §9 | The nine questions. | Ready to use, after checks 1 to 3 below. |
| 13 | Final CTA and footer | §10 | Apply. Channels: Instagram (main, SPARK, EB), Facebook, TikTok, YouTube, LinkedIn. Email, address. | LinkedIn is 🌐: keep (it's VIC's own page). "Once a VICer, Always a VICer." closes the page. |

## Checks before the copy is final

These are places where the source brief and the recruitment system disagree, or where the brief itself flags ⚠️.
Each needs an owner answer (tracked in [open-questions.md](open-questions.md)).

1. **What candidates choose.** The brief (§8) says "one main department and one activity department". The
   registration form asks for a **1st and 2nd choice among the four main departments** (IT, HR, FLER, COMM) and
   nothing about activity departments. The activity department (English Bubble, SPARK, Training or none) is set
   **at the interview** (the interview form's "Activity Department Affectation", `Config.gs`). Proposed copy:
   "On the form, pick your first and second choice among the four main departments. You'll choose your activity
   department at your interview."
2. **The 48 hours.** The brief (§8, §9) says "interview within 48 hours of registering". The system's defaults
   are: contacted within 24 h of being assigned to a binome, and an interview **date set** within 48 h
   (`HOURS_NOT_CONTACTED`, `HOURS_NO_INTERVIEW_DATE`). The interview itself can be later. Proposed copy: "If your
   application is accepted, two club members contact you within a day to set up your interview." The owner holds
   the timing limits and confirms the wording.
3. **IT is not coding.** Flagged ⚠️ in §4.3. Proposed line on the IT card: "IT at VIC means design, visual
   identity, photography and video. No coding required." The FAQ keeps its question too.
4. **FLER eligibility.** ⚠️ in §4.2. Proposed: keep it in the FAQ only (it's already there, worded gently), not
   on the FLER card.
5. **What happens after submitting.** The confirmation mail with the candidate's code is sent by the script
   after the next sync, and only while `CONFIRM_REGISTRANTS` is on. Proposed step: "You get a confirmation email
   with your registration code." Confirm the mail will be on at launch.
6. **The CTA label.** "Apply" (short, one word, fits a sticky button on a phone) or "Join VIC" or "Register".
   Proposed: "Apply", and "Applications open 25 Oct" before opening.
7. **Taglines and intros.** Every line written for the page (not quoted from §1 to §13) goes to the owner in one
   list before launch.
8. **Testimonials.** Real quotes, or the section stays cut.
9. **Photos of people.** The group photos show members' faces. Confirm the club is fine putting these on the
   public page (they are likely already on `@vic.enp`).

## Not on the page

Kept out on purpose, like the source brief does: rankings, disciplinary rules, finance and sponsorship
workflows, admin requests, committee rules, the screening rules (telling candidates what gets held defeats
screening), and anything about TEST_MODE or the dashboard.
