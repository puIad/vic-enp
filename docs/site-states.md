# The site's states

What the page, `/apply` and the API do in a recruitment season and in the off-season, and how the site moves between
them. Settled with the owner on 2026-11-02 on the map
[Wayfinder: two site states](https://github.com/puIad/vic-enp/issues/104). The decisions are 158 to 169 in
[decisions.md](decisions.md). Terms are in [GLOSSARY.md](../GLOSSARY.md). Next year's steps are in
[reopening.md](reopening.md).

## The states

| State | When | Pill | `/apply` and `/api/code` |
|---|---|---|---|
| `before` (recruitment season) | The next dates are deployed, before `OPENS_AT` | "Applications open 26 Oct" with its countdown, links to Instagram | Reachable, as they are today |
| `open` (recruitment season) | `OPENS_AT` up to `CLOSES_AT` | "Apply" with its arrow and wave | Open |
| `off` (off-season) | From `CLOSES_AT` until the next dates are deployed, or whenever forced | "Follow @vic.enp" with its arrow, no wave | Closed |

The off-season starts by itself at the close of applications, with no deploy. The code can merge at any time before it.

## Who it's for

ENP students first, partners second. Nothing new reaches partners at the close: the existing acts and the footer carry
them. The page promises no timing for the next recruitment, only that it is announced on @vic.enp. A partner block and
an email sign-up are unspecified on the map, for after the go-live.

## The switch

`siteState(now, forced)` in `src/calendar.ts` is the one answer. It is pure and returns `before`, `open` or `off`,
checking `forced` first and then the dates. `calendar.ts` still touches no browser or Vite global, because each side
passes its own `forced` in.

`cta()`, `closing()`, `/apply`'s closed check and its chip, and `/api/code` all ask this function, and none compares
dates itself. `cta()` still chooses the words, `closing()` the countdown and the API its status code. Only `off` closes
`/apply` and `/api/code`.

`/api/submit` does not ask. It keeps its hard stop at `CLOSES_AT` plus `PROOF_S`, whatever the force says. Nothing else
in `api/` reads the state, so `/api/join*`, which accepted candidates use after the close, is untouched.

## The forced off-season

One variable, `VITE_FORCE_OFF_SEASON`, set on Vercel Production when needed and absent otherwise. It works in one
direction only, and no build config changes.

- **The path.** The page reads it through `import.meta.env` at build, and the API reads the same name from `process.env`
  at run time. A Vercel deployment freezes its env vars, so the page and API of one deployment hold the same value and
  a Redeploy changes both together.
- **The value.** Any non-empty value forces, after trimming, so `0` also forces. A small parse function in
  `src/calendar.ts` takes the raw string and both sides use it. To undo it, delete the variable and Redeploy.
- **A checked ticket keeps its hour.** The force stops `/api/code` only. The cookie ends the hour: it seals its own
  expiry and `/api/submit` refuses past it. No force instant is stored anywhere.
- **A code already mailed still works.** `/api/verify` stays open, as it does at the normal close, for the rest of the
  code's 10 minutes. Worst case, the last letter lands 70 minutes after the Redeploy.
- **Stopping everything at once.** Rotating `SESSION_KEY` drops every cookie.
- **An open tab.** A forced off-season reaches it only on reload, because the value is in the bundle. Its `/apply` link
  and the API are already closed by then, so nobody can apply from that tab.

## The words

Anything not listed keeps today's words, including the four steps, "Then grow", the FAQ's question, the rail's "Your
place" and the page title. The `before` and `open` phases keep today's words, apart from the share tags below.

### In the off-season

| Surface | Words |
|---|---|
| The pill (hero, corner, act 7) | Follow @vic.enp, with the round arrow, opening Instagram. No wave on press. |
| Act 7 headline | Your point is on its way. |
| Act 7 sub line | No words. The line keeps its space, with the same line count as the open phase, so the pill stays where it is. |
| How to join, lead | Every ENP student can apply, in any year and any specialty. The steps below are how it works once applications open. |
| How to join, closed line | Applications are closed. The next recruitment is announced on @vic.enp. (the handle links to Instagram) |
| FAQ answer to "When does recruitment open, and how fast is the process?" | Applications are closed. The next recruitment is announced on @vic.enp. (the handle links to Instagram) |
| Skip link | Skip to the end |
| `/apply` closed line, from `CLOSES_AT` (`CLOSED`, also in the API's closed answers) | Applications closed on 4 November 2026 at 23:59. Follow @vic.enp on Instagram for the club's news. The date and year come from `CLOSES_AT`, in Algiers time, and "@vic.enp on Instagram" stays the link. |
| `/apply` closed line, before `CLOSES_AT` (a forced off-season) | Applications are closed. Follow @vic.enp on Instagram for the club's news. |
| `/apply` closed screen | Eyebrow "Registrations", heading "Platform 9¾", the closed line, tab title "Registrations · Vision & Innovation Club". The letter, the envelope, the chips and "Step one" are removed. |

Which `/apply` line shows goes by the clock, never by the force, so a tab opened before a Redeploy gets the right one
from the API's closed answer. Both lines contain `FOLLOW` exactly once (`src/apply/letter.test.ts`, `showClosed` in
`src/apply/main.ts`).

The FAQ drops the "how fast" half of its answer by the owner's choice; step 3 still says "within a day". `/apply` keeps
"for the club's news" by the owner's choice. The eyebrow and tab title drop the year on the closed screen only; the open
phase keeps "Registrations 2026".

### All year, in every state

| Surface | Words |
|---|---|
| Meta description | VIC, the English-speaking scientific club at ENP since 2014. 600 members, seven departments. Recruitment is announced on @vic.enp. |
| og and twitter descriptions | VIC, the English-speaking scientific club at ENP. Recruitment is announced on @vic.enp. |
| Noscript | Vision & Innovation Club, ENP. Follow @vic.enp on Instagram. (the handle links to Instagram) |
| `og.png` line | Vision & Innovation Club. ENP Algiers. |

These point at www.vic-enp.com (`og:url`, `og:image`, `twitter:image`, `canonical`). They change on the merge, so they
lose the dates while applications are still open, which the owner accepted. `og.png` needs a new render and its `?v=` a
bump so previews refetch it. No script renders it today, so the render keeps the current image apart from that line.

## The page

The same seven acts, with only words changing. Acts 1 to 5 stay untouched. Scroll positions, catch points, the rail and
the 600's choreography don't move.

**Words flip live and the layout stays frozen.** A shrinking page at the instant could start act 7's pin in the wrong
place under someone scrolling, so three things hold their height between `open` and `off`, whether the page was loaded
before the flip or after it:

- How to join's closed line holds the countdown's height.
- How to join's lead holds the open lead's lines. It is shorter in the off-season and can lose a line. The tickets
  didn't name this one; it follows from their rule.
- Act 7's sub line holds its line, on tier 0 and with the world.

Nothing held is read out by a screen reader. The FAQ answer needs no hold: the panel is shut unless a visitor opens it.
The `before` phase keeps its layout as it is today, with no countdown and no sub line, so the flip at `OPENS_AT` still
changes the page's height. [reopening.md](reopening.md) names that limit.

**Timing.** The countdown ticks each second and the closed line follows it at once. The pill, the lead, the FAQ and the
skip link repaint every 15 s, so they can trail by up to 15 s, and the pill's link still opens a closed `/apply`.

**The pill.** The off-season pill looks as the Apply pill does, with the arrow and the slot where your point lands. Act
7's wave and the sub line belong to the open phase alone, so `Cta` has to say more than today's `open: true | false`.

## `/apply`

The closed screen replaces what today's still shows above the closed line ("Your letter has arrived", "is opening its
doors", the chips, "Step one"), and shows none of it on the way there. A candidate with a checked ticket keeps the letter,
as today, in both a normal and a forced close. A slow phone that still shows the form gets the API's closed answer and
the closed line.

## Limits accepted

- **Wrong clocks.** The page and `/apply` use the visitor's clock and the API uses the server's, so the rules agree but
  the clocks may not. A phone running fast sees the off-season early, and one running slow still sees Apply. The API is
  the authority, so nobody can apply past the close. The landing page stays without a server call.
- **A forgotten variable.** If it is still set when next year's dates go up, the site stays in the off-season. Instant
  Rollback brings back the old deployment's value, so the state needs checking after any rollback. Both are lines in
  [reopening.md](reopening.md). No new code guards them.
- **The open phase's dates stay typed.** The lead and the FAQ's open-phase sentences keep their hand-typed dates, so
  today's words can't move two days before the close. They are lines in [reopening.md](reopening.md).

## Proof

- A table test of `siteState` at each boundary (`OPENS_AT` and `CLOSES_AT`, each side of them, forced and not), also run
  through `cta()`, `closing()`, `sendTicket` and `submitLetter` with fake clocks. That is what proves the page and API
  agree. The tests take their instants from the constants or as arguments, so moving the dates next year breaks none of
  them.
- `?now=` stays clock-only and has no URL switch for the force. The forced page looks the same as
  `?now=2026-11-05T00:00:00Z`.
- A headless check compares page height either side of the close, on phone and desktop.
- One rehearsal before the close, on a Preview with the variable set for that branch only: the page, `/apply` and
  `/api/code` all closed, on the Master copy, and a ticket checked before the Redeploy still sends. It runs on the
  branch's stable URL, because the cookie belongs to one host and each deployment's own URL is a different host. It also
  proves the path from env var through Redeploy to both sides, which no unit test reaches. The session sets it up and
  checks it; the owner does the ticket and the letter from their ENP mailbox.

## Going live

Every merge deploys to the live site, so the owner approves each one. Each PR is checked on its Vercel preview with
`?now=`, on phone and desktop.

| When (Algiers) | What |
|---|---|
| 3 Nov, afternoon | The build tickets' PRs reviewed and merged |
| 3 Nov, evening | The rehearsal, with the owner |
| 4 Nov, 18:00 | Merge freeze: nothing from this work merges until the ticket hour ends |
| 4 Nov, 23:59 | The off-season starts by itself |
| 5 Nov, 00:59 | The ticket hour ends and the freeze lifts |
| 5 Nov, after 00:59 | The check on production |

If the build misses the freeze, visitors get today's closed state until it ships: the pill reads "Applications closed"
and `/apply` closes.
