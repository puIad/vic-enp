# Brief

## Goal

Make an ENP student who has never heard of VIC want to join, and get them into the registration in one tap.
The page has to feel like nothing else a student at ENP has opened: a full 3D, scroll-driven experience that is
also fast on a mid-range phone and honest about what the club is.

One action, one label, everywhere on the page: **Apply** (wording to confirm in [content.md](content.md)). It
opens the registration.

## Audience

- ENP students of every year and specialty, first-years above all (the Prepa Cycle intake). Most have not yet
  heard of VIC or only know its events.
- They arrive from Instagram (`@vic.enp` bio and stories), WhatsApp and Facebook shares, and posters on campus.
  So: a phone, portrait, often mobile data, opened inside an in-app browser (Instagram's or Facebook's).
- English is the club's language and the page's language. Many visitors read English as a second or third
  language: short sentences, plain words.
- Secondary: parents, sponsors and alumni who follow a shared link. The page doesn't target them, but nothing on
  it should embarrass the club in front of them.

## What the visitor should believe by the end

Settled by the owner on 2026-10-19 ([#6](https://github.com/puIad/vic-enp/issues/6)):

> Once you are a VICer, you are always a VICer, and I can be one this season.

## Scope

In:

- One page at `/`, English only, every section from [content.md](content.md).
- The 3D world and the scroll experience from [experience.md](experience.md).
- A no-WebGL and reduced-motion version of the same page (same content, static compositions).
- The CTA, driven by one setting (`APPLY_URL`), plus the countdown and "opens 25 Oct" state before opening.
- Share metadata (title, description, Open Graph image) and a favicon.
- The photo pipeline (originals to web sizes) and the brand files copied from the dashboard repo.

Out:

- The registration form and anything that stores or sends candidate data (the registration app, in
  `VIC-Recruitment-2026`).
- Other pages: events archive, blog, member area, Arabic or French versions.
- A CMS. Content lives in the repo; a content change is a commit and a redeploy.
- Status lookup, accounts, newsletters, chat.

## Success

- Live on its address before 25 Oct 2026, the CTA opening at the recruitment opening.
- A first-time visitor on a mid-range Android phone over 4G sees real content in under 2.5 s (LCP) and reaches
  the CTA without the page stalling. Budgets in [quality.md](quality.md).
- Nothing on the page is false or out of date, and no ⚠️ item from the source brief ships unresolved.
- The owner can say, in one sentence, the moment people remember ([experience.md](experience.md#the-peak)).
- Optional, if analytics are approved: CTA clicks per visit.

## Constraints

- **Time.** Six days from this brief to opening. A full 3D page in that window means a strict launch cut
  ([build-plan.md](build-plan.md)): what ships on the 24th must be complete and polished, and anything that
  doesn't fit moves to a v1.1 during the recruitment window.
- **The charter.** Logo, colour and type rules from the VIC IT Charter 2026 ([brand.md](brand.md)). Its no-3D rule
  covers post design, not websites ([ADR 0001](adr/0001-the-icon-formation.md)), so the hero's points may draw the VIC icon.
- **Phones.** Instagram's in-app browser, mid-range GPUs, limited data. The 3D layer is progressive: it loads
  after the content and scales down by device.
- **Honesty.** Facts only from the source brief. No generated photos of people presented as VIC events. No
  promise of an interview (screening can decline).
- **Hosting.** Vercel on the owner's account, handed over after the season like the dashboard.
- **Content approval.** The committee approved the charter-based content in the source brief. New copy written
  for the page (taglines, section intros) goes past the owner before launch.
