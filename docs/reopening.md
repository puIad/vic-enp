# Reopening for a new recruitment

For the IT member opening VIC's next recruitment. It assumes you have this repo and `puIad/vic-recruitment`, and little
else. The site runs itself in the off-season ([site-states.md](site-states.md)), and it stays there until new dates are
deployed. This list was written on 2026-11-02 from the code of 2026, and nobody has run it yet, so expect to correct it.
Paths marked `R:` are in `puIad/vic-recruitment`; the rest are in this repo.

**Who** says who has to do a line, or who you have to find:

- **IT**: you, with repo access.
- **Google owner**: whoever owns the Google account or file.
- **Vercel owner**: whoever owns the Vercel team or project.
- **GitHub owner**: whoever owns the repos.
- **Club**: the club's leadership, for words and facts only they know.

## The order matters

**Deploy the new dates last.** The moment they are on `main`, the site leaves the off-season and `/apply` and `/api/code`
are reachable, even before `OPENS_AT`. So the new Master, the env vars and the mails must be ready first. Step 7 lets you
decide whether that early reach is acceptable.

## Three things that bite

1. **2026 applicants get locked out if the old Master stays in use.** The Redis mark `reg:<sha256(email)>` never expires.
   It is dropped only when the address is in neither the Master's `REG_TAB` nor its `IV_TAB`. A fresh Master with fresh
   tabs frees everyone. Reusing the 2026 tabs answers every 2026 applicant with "already registered".
2. **The 32 question titles are the Master's column headers**, character for character, odd spaces included. Changing one
   means changing `src/apply/questions.ts`, `docs/source/registration-questions.md`, the Master's header and the script's
   parser (`R:Registrations.gs`, `regHeaders_`) together. `/api/health` goes red when a header is missing.
3. **A mail can say 2026 from two places.** A filled `MAIL_<ID>_<FIELD>` row in the Master's Settings tab wins over the
   default in `R:Config.gs`, so editing the code alone may change nothing.

## Step 1: find out who holds what

Fill this in before anything else. Nobody can reopen without these accounts.

| What | Stated in the docs | Who holds it now |
|---|---|---|
| Vercel project `vic-enp` | On the owner's account, to be handed over after the season (`docs/architecture.md`) | |
| Vercel project `vic-recruitment` (the dashboard) | Team `puiads-projects` (`R:docs/reference.md`) | |
| Upstash Redis, one store per project | A free store idle for 30 days is archived; the data is not carried over, by design (`R:docs/plans.md`) | |
| Service account `vic-registration`, Cloud project `vic-26-registrations` | `R:docs/registration-form.md` | |
| Cloud project `vic-recruitment` (ENP org): the OAuth client | Rebuild steps are in `R:docs/vercel.md` | |
| `vic.rh@g.enp.edu.dz`: mailer, triggers, sender, 1,500 recipients a day | ENP's account administrator | |
| Apps Script projects: the Master's script and "VIC Mailer" | `clasp` access needed, 200-version cap (`R:STATUS.md`) | |
| GitHub repos `puIad/vic-enp`, `puIad/vic-recruitment` | A personal account; transfer or fork | |
| The Claude workflow, `.github/workflows/claude.yml` | Its secrets belong to the same personal account; remove it or supply your own | |
| `@vic.enp` and the other social accounts | The page sends everyone to Instagram all off-season | |

**Nobody had established these on 2026-11-02, so ask:**

- [ ] Who owns the Master and its Drive folder. `vic.rh` or the 2026 owner, per `R:docs/registration-form.md`.
- [ ] Who holds the registration and DNS of `www.vic-enp.com`, and where the four event sites are hosted.
- [ ] Which `MAIL_<ID>_<FIELD>` rows are filled in the Master's Settings tab.
- [ ] The current value of `VITE_APPLY_URL` and the other env vars. Nobody read them when this list was written.

## Step 2: make the new Master

No procedure for this exists and nobody has done it. Leave time, and try it on a copy first. The 2026 code has a reset for
binomes and result marks only (`R:Team.gs`), so nothing empties `Interviewees`, `Registration Responses`, `Alerts` or
`Mail Log`, which is why a fresh copy is the path. A copy of the Master is a copy of its script, and everything in it
still points at 2026.

- [ ] **Google owner:** copy the Master, keep the tab names (`R:Config.gs`, `TAB`), empty the season's tabs, and rename the
  sheet and the Drive folder "VIC Recruitment 2026".
- [ ] **Google owner:** give the copy its own script project and deployments.
- [ ] **Google owner:** set the hand-set script properties: `MASTER_ID`, `MAILER_URL`, `MAIL_SEND_SECRET`, `DROPS_SECRET`,
  `JOIN_URL`, `JOIN_SECRET`, `TRIGGER_OWNER`, `PENDING_CHANGES` (`R:docs/reference.md`). `MASTER_ID` also goes in the mailer's
  properties. Then run Setup as the new trigger owner.
- [ ] **IT, Google owner:** replace the ids in `R:Config.gs`: `REGISTRATION_FORM_ID`, `INTERVIEW_FORM_ID`, `BINOME_FOLDER_ID`.
  Point `TEAM_DB_DEFAULT_ID` at the 2026 team, or leave it empty and use the Team tab.
- [ ] **Google owner, admin:** reset the Settings tab, which a copy brings over with 2026's values: `ADMIN_EMAIL`, `TEST_MODE`,
  `SCREENING`, `SCREEN_HOLD_AT`, `VIC_MEMBERS_SHEET`, `INTERVIEW_CLOSE_DATE`, `RESULT_NEXT_*`, `RESULT_GROUP_*` and the timing
  limits.
- [ ] **Google owner:** the fallback Registration Google Form: edit its intro, which still says "29 October 23:59", and keep its
  questions equal to the site's.
- [ ] **IT, Google owner:** a new Interview Form means new entry ids and a matching list in `R:Config.gs`
  (`INTERVIEW_QUESTIONS`, `INTERVIEW_SECTIONS`, `INTERVIEW_ENTRY`, `INTERVIEW_LINKS`). Its titles must match the response headers.
- [ ] **IT:** the years typed one behind: `R:Setup.gs` (rewrites "2025" to "2026" in a form title), `R:Setup.gs` and `R:Team.gs`
  ("the 2025 team").

## Step 3: mails

- [ ] **IT or admin:** replace "2026" in `CONFIRM`, `REJECT`, `RESULT_YES`, `RESULT_NO`, `RESULT_NO_NI` (`R:Config.gs`), or in their
  Settings rows where those are filled.
- [ ] **IT:** the footers: `R:Mail.gs` (two places) and `R:mailer/Code.gs`.
- [ ] **Google owner:** deploy the mailer. `clasp push` only updates HEAD, so also update the deployment that holds the live URL,
  which belongs to `vic.rh`, then check that `/api/health` reports `mailer: ok`.
- [ ] **Club:** decide whether the ticket mail's "Platform 9¾" subject stays with the wizarding theme.

## Step 4: env vars and Redis on Vercel

Set these on the `vic-enp` project, with Preview pointing at a copy of the Master.

- [ ] **Vercel owner:** `VITE_FORCE_OFF_SEASON` is **absent**. If it is still set, the site stays in the off-season whatever the
  dates say.
- [ ] **Vercel owner:** `VITE_APPLY_URL` is `/apply`. Without it the open pill falls back to Instagram.
- [ ] **Vercel owner, Google owner:** `MASTER_ID` and `REG_TAB` name the new Master and its registration tab. `REG_TAB` has no
  default, `IV_TAB` defaults to `Interviewees`. Check `EMAIL_DOMAIN` and `MASTER_TZ`.
- [ ] **Vercel owner:** `KV_REST_API_URL`, `KV_REST_API_TOKEN` point at the new owner's Redis, Production and Preview apart.
  `KEY_PREFIX` stays empty on Production and `prev:` on Preview. It has no year, so one store holds both years' keys.
- [ ] **Vercel owner, Google owner:** `MAILER_URL`, `MAILER_SECRET` match the mailer's deployment.
- [ ] **Google owner, Vercel owner:** rotate the service account key (`SA_KEY_B64`) and share the new Master with the service
  account as Editor.
- [ ] **Vercel owner:** rotate `SESSION_KEY`, which is safe between seasons.
- [ ] **Vercel owner, Google owner:** `JOIN_SECRET` equals the script property of the same name.
- [ ] **Google owner or Vercel owner:** clear last season's results by running the script's join reset (`reset: true`,
  `api/_lib/join.ts`) or by starting a new store, so `join:told`, `join:link` and `join:click` are gone.
- [ ] **Vercel owner:** a new store also ends the `reg:` marks. On the old store, clear `reg:*` or rely on the fresh tabs (see
  "Three things that bite"). After a header change in the Master, wait out or delete the `headers` key.
- [ ] **Vercel owner, IT:** the dashboard project's own env vars and OAuth redirects, if it moves: `R:WebApp.gs` (`DASHBOARD_URL`),
  `R:Mail.gs` and `R:mailer/Code.gs` (the logo's host), `APP_ORIGIN` (`R:docs/vercel.md`).

## Step 5: words and facts on the site

- [ ] **Club, IT:** the figures: `src/sections/WhatVic.tsx` (600 members, 40+ trainings, 10+ events). The 600 is also the page's
  visual motif (`Chrome.tsx`, `readout.ts`, `Hero.tsx`, `Poster.tsx`), so changing that one is a design change.
- [ ] **Club, IT:** the committee photo: `src/content/photos.ts` (`footer.png`).
- [ ] **Club, IT:** read through `src/content/departments.ts`, `events.ts`, `join.ts` and `clubLife.ts` for stale facts, and check that
  the four event sites still exist.
- [ ] **IT, Club:** social handles and contact in `src/config.ts`, if they changed.
- [ ] **Club, IT, Google owner:** the questions, `src/apply/questions.ts`. Choices tied to the school year: field codes, years of
  study, "How did you discover VIC?", the interview days. See "Three things that bite" before changing a title.
- [ ] **Club, IT:** `src/apply/letter.ts`: `DEPARTMENTS` wording and houses (the Master's own pairing, `FORM_HOUSE` versus
  `HOUSE` in `R:Config.gs`, must follow), `MAILBOX` and `RECEIVED`.
- [ ] **IT:** "Registrations 2026" in `apply.html`, in the tab title and the eyebrow. The closed screen already has no year.
- [ ] **IT:** the wizarding look (`src/apply/apply.css`, `owl.ts`, `scroll.ts`) can stay, or go as a design choice.
- [ ] **IT:** the rate limits in `api/_lib/ticket.ts` were sized for 2026's night, about 750 candidates. Check them against the
  numbers you expect.
- [ ] **IT:** `scripts/loadtest.ts` refuses a Master whose title lacks "TEST COPY". Name a test copy to pass that.

The share tags, the noscript text and `og.png` carry no dates, so they need nothing. The closed line takes its date from
`CLOSES_AT`.

## Step 6: the dashboard

- [ ] **IT:** the product name "VIC Recruitment 2026": `R:frontend/index.html`, `R:WebApp.gs`, `R:Sync.gs`, `R:package.json`,
  `app-sidebar.tsx`, `site-footer.tsx`, `gate-screen.tsx`, `settings/account/page.tsx`, `faqs/data/faqs.json`, and "Interview Form 2026"
  in `my-binome/interview/page.tsx`. The gate screens and FAQ name the Master's title, which must match the real one.
- [ ] **IT, Google owner:** analytics: `baseline-2025.ts`, `registrations.tsx` and `model.ts` hard-code 2026 and 2025. For a comparison,
  export daily counts from the 2026 Master, counts only with no personal data.
- [ ] **IT:** field-of-study labels in `R:frontend/src/lib/vic/analytics.ts`, if the school adds fields.
- [ ] **Club, IT:** the screening rules in `settings/screening/page.tsx` were tuned on 2025's 273 applications. Re-tune them on
  2026's before reusing them.

## Step 7: the new dates

- [ ] **Club:** decide whether `/apply` should be reachable before opening. In 2026 it was: anyone with the link could register
  from the moment the dates went up. Closing it needs a small change to the `siteState` rule (`before` closes too), which
  is your call next year.
- [ ] **IT:** on a branch, set `OPENS_AT` and `CLOSES_AT` in `src/calendar.ts`. The pill, the countdown, the closed line and the API
  read these.
- [ ] **IT:** retype the same dates by hand in the open phase's words: `src/sections/Join.tsx` (the lead) and `src/content/join.ts`
  (the FAQ answer). `src/config.ts` lists them.
- [ ] **IT:** run the tests. The ones that read the dates take them from the constants or as arguments, so a failure means something
  real.
- [ ] **IT:** check the Preview with `?now=<date>` in UTC, one instant in each state, on phone and desktop. A `+` in a query string
  reads as a space, so write `Z`, never `+01:00`.
- [ ] **IT:** do a real ticket and letter on the Preview, on its stable branch URL, and see the row arrive in the Master copy.
- [ ] **IT:** `/api/health` is all `ok` on the Preview.
- [ ] **IT:** the flip at `OPENS_AT` changes the page's height, because the countdown and act 7's sub line appear only then.
  Someone scrolling at that instant may see act 7's pin start in the wrong place. Accepted so far, since nobody has reported it.
- [ ] **IT, with the owner of the go-ahead:** merge. Production leaves the off-season with this deploy.

## Step 8: after it's live

- [ ] **IT:** the pill reads the opening date, `/apply` answers, `/api/health` is all `ok`.
- [ ] **IT:** after any Instant Rollback, check the state, because it brings back the old deployment's dates and env vars. Rolling
  back past the date change returns the site to the off-season.
- [ ] **IT:** if you need to stop applications early, set `VITE_FORCE_OFF_SEASON` and Redeploy. To undo it, delete the variable and
  Redeploy, since `0` also forces. See [site-states.md](site-states.md#the-forced-off-season).

## When you have a moment

Docs and records that won't break anything:

- [ ] `README.md`: the opening sentence, the `?now=` example, the screenshots in `docs/readme/`.
- [ ] `docs/content.md`: the copy lines with dates. `docs/decisions.md` is a dated record and stays.
- [ ] `R:docs/reference.md`: the id list the next owner needs. Start new `R:STATUS.md` and `R:HANDOFF.md`, which are dated state.
- [ ] Old name in comments: `puIad/vic-recruitment-2026` (`api/_lib/join.ts`, `api/_lib/mailer.ts`, `apply.html`, `src/apply/letter.ts`,
  `docs/architecture.md`). It redirects, so this is cosmetic.

## Not checked

The research behind this list did not open Redis, the Master, Vercel or the mailer. It also did not read the recruitment
repo's `admin-features.md`, `launch-features.md`, `load-test.md`, `testing.md` or `decisions.md` line by line, or look through
`public/logos` and `public/posters` for 2026 editions.
