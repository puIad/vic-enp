# Section patterns for the content sections

Research for issue #4. Date: 2026-10-19. Question: how do dark, premium landing pages lay out a numbers band,
department cards, an events showcase, a photo gallery, how-to-join steps, an FAQ and a final CTA with footer,
and what can we build from that?

Screenshots are in `shots/`. Each pair is `<name>-d.jpg` (desktop, 1440 wide) and `<name>-m.jpg` (phone, 390 wide).
Every example was opened live and captured the same day, with `prefers-color-scheme: dark` set so sites that
follow the system theme show their dark side.

## How the examples were found (and what is missing)

- land-book.com and lapa.ninja answered our headless browser with a Cloudflare challenge or a 403. We did not
  try to get around it. landingfolio.com and 21st.dev were only readable as listings (brand names, layout labels,
  no source URLs). So none of the picks below was lifted from a gallery page.
- Instead, I used the galleries' own search results as a guide to section vocabulary, then opened candidate
  sites directly (about 60 pages) and kept the ones that are dark and show the section in a way we can build.
- Rejected after checking, because they render light: Deno, Stripe Sessions, Warp, Next.js Conf's sessions table.
  Mercury's number counters stayed blank in the capture, so I could not judge them.
- "Phone" means a 390 by 844 viewport in headless Chrome, not Instagram's in-app browser. Sticky headers show up
  inside some crops; they are an artifact of the capture, not part of the section.
- All visual and layout notes are what I saw in the capture. Anything about how a site builds it is marked as a guess.

## 1. Numbers band

Our content: 600 members, 40+ trainings a year, 9 Engineers' Galas, since 2014. Four values, so a row of four on
desktop and a stack on phone.

1. **Railway, split-flap board** ([railway.com](https://railway.com)): five rows of mechanical flip cells,
   a label on the left and a long number on the right. Dark, monospaced, big. Phone: it rebuilds into
   label above number, one pair per row, so the digits stay large. Desktop `shots/railway-numbers-d.jpg`,
   phone `shots/railway-numbers-m.jpg`.
   Take: the stat as an object, not a row of text. A split-flap or odometer digit roll is a strong "counters animate
   once, then hold" move, and the phone version needs no new design, only a restack. Cost: 600 cells of DOM or one
   canvas; keep it to four rows.
2. **Neon, "100K+" card** ([neon.com](https://neon.com)): one huge figure and a one-line caption inside a thin
   outlined box that sits over a faded logo wall. Mono eyebrow type around it. Phone: the box goes full width and the
   figure stays about 70 px. Desktop `shots/neon-numbers-d.jpg`, phone `shots/neon-numbers-m.jpg`.
   Take: figure first, caption second, nothing else. A single hairline box is enough to make it read as a stat.
3. **Webflow community hero line** ([webflow.com/community](https://webflow.com/community)): the number is only
   inside a sentence ("300,000+ designers, developers ..."). Weak as a band, noted as the thing to avoid: our four
   numbers should not hide in prose.

**What we'd do:** one band, four numbers, big figure and a short caption, hairline dividers, counters that roll once
on first view and then hold. On phone, 2 by 2 or a single column, never a horizontal scroller.

## 2. Department cards (four main, three activity)

1. **Webflow "Get involved"** ([webflow.com/community](https://webflow.com/community)): a two-column grid of
   outlined cells, each with an icon, a bold title, two lines of text and one link, hairline borders only.
   Phone: one column, same cell, stacked and separated by the same borders. Desktop
   `shots/webflow-involved-d.jpg`, phone `shots/webflow-involved-m.jpg`.
   Take: the cell anatomy (icon, title, two lines, one link) maps straight onto our card (what it does, what you'd
   do). Four main departments fit a two by two; the three activity departments go in their own row of three.
2. **Vercel Ship "Just announced"** ([vercel.com/ship](https://vercel.com/ship)): a pixel-style heading and a
   button in the left column, a two-column grid of boxed cards on the right, each with a title and a mono paragraph.
   Phone: heading, button, then one column of cards. Desktop `shots/ship-announced-d.jpg`, phone
   `shots/ship-announced-m.jpg`.
   Take: sticky heading beside a card grid works well on desktop. Cards with a long mono paragraph are too dense
   for phones; ours should stay at two or three short lines.
3. **Vercel OSS "Who should apply?"** ([vercel.com/open-source-program](https://vercel.com/open-source-program)):
   three columns of icon-in-a-white-circle plus one sentence, in a bordered table. Phone: single column. Desktop
   `shots/vercelOSS-who-d.jpg`, phone `shots/vercelOSS-who-m.jpg`.
   Take: for the three activity departments (SPARK, Training, English Bubble) this is the lighter variant:
   an icon or colour mark and one sentence each.

**What we'd do:** main departments as four outlined cells (two by two, one column on phone) with a colour
mark, one line on what you do, one "who it suits" line and the IT "no coding" line in the IT cell. Activity
departments as a visibly lighter row of three, each in its own identity colour from content.md.

## 3. Events showcase

1. **Vercel Ship, speaker list with swapping portrait** ([vercel.com/ship](https://vercel.com/ship)): a list of names
   and roles in mono type on the left, one large black-and-white portrait on the right that changes with the row
   under the pointer. Phone: it becomes a two-column grid of portraits with name and role below, no hover needed.
   Desktop `shots/ship-speakers-d.jpg`, phone `shots/ship-speakers-m.jpg`.
   Take: swap the portrait for an event: a list of events (Engineers' Gala, Ignite Algiers, AEC, Polymaze, STEPS,
   CPSP) and one big image panel that changes. It also fixes the phone case by falling back to a grid.
2. **Vercel Ship "Just announced"** (same screenshots as in section 2): a header plus bordered cards. Fits events
   that have no photo yet, as text cards with an identity colour.
3. **Webflow "Livestreams & events"** ([webflow.com/community](https://webflow.com/community)): a large headline
   at left, one paragraph at right, with a calendar block below it. Only the header was captured
   (`webflow-events-*` was not kept); it shows how little a showcase needs when the content is thin.

**What we'd do:** events as a list on the left and one large image panel on the right (grid of image cards on
phone), with Gala gold, Ignite red and Hour of Code blue as the row accent. Dates only as history, per content.md.

## 4. Photo gallery

Weakest area. I found two dark examples with real photography and none that is a true lightbox grid.

1. **Next.js Conf recap strip** ([nextjs.org/conf](https://nextjs.org/conf)): a statement headline, then a
   horizontal strip of black-and-white photos at different heights, so the strip has a rhythm. Phone: the
   same strip, partly cropped at both edges, which signals swipe. Desktop `shots/nextconf-recap-d.jpg`, phone
   `shots/nextconf-recap-m.jpg`.
   Take: uniform black-and-white treatment makes mixed phone photos feel like one set, and different heights
   avoid the grid look. Cheap to build as a scroll-linked horizontal track.
2. **Webflow community spotlight** ([webflow.com/community](https://webflow.com/community)): tall portrait cards
   with a quote over the lower third, arrows to move. Phone: one card and a hint of the next. Desktop
   `shots/webflow-spotlight-d.jpg`, phone `shots/webflow-spotlight-m.jpg`.
   Take: a quote on a photo is how the "testimonials" section could come back later, once real quotes exist.
3. **Vercel Ship speakers** (section 3) uses the same black-and-white portrait treatment.

**What we'd do:** one horizontal strip of club photos in a single tone (the night colour with a duotone or black and
white), mixed heights, edges cropped on phone. Decide the "special entrance" per photo in experience.md, not here.

## 5. How to join (steps)

I did not find a dark example with a clean numbered process of the exact kind we need, so these two are the
closest patterns, not exact matches.

1. **Neon numbered chapters** ([neon.com](https://neon.com)): a very large ghost numeral (01, 02, 03) in a barely
   visible grey, a small red mono eyebrow above it, and a sentence in white and grey text beside it. Phone:
   numeral and eyebrow stack above the sentence. Desktop `shots/neon-numbered-d.jpg`, phone
   `shots/neon-numbered-m.jpg`.
   Take: ghost numerals carry "step 1, 2, 3" with no extra chrome. This is the pattern I'd copy.
2. **Vercel OSS eligibility grid** (section 2 screenshots): shows how a short list of requirements reads as
   a tidy table of icon plus sentence.
3. **Resend "Integrate tonight"** ([resend.com](https://resend.com)): icon row of options above a code panel.
   Desktop `shots/resend-steps-d.jpg`, phone `shots/resend-steps-m.jpg`. Shown for how an "it takes minutes"
   claim is made visible; our version would show the form, not code.

**What we'd do:** four steps as ghost-numeral blocks: pick your first and second main department, submit the
form, get a confirmation email, if accepted two members contact you. One short line per step, final line
"Applications open 25 Oct". The wording is gated by checks 1, 2 and 5 in content.md.

## 6. FAQ

Nine questions, so an accordion, one open at a time or all closed.

1. **Raycast Pro** ([raycast.com/pro](https://raycast.com/pro)): centered title and one-line subtitle,
   six questions with a chevron on the right, hairline dividers that fade at the ends. Phone: same, with
   question text wrapping to two lines. Desktop `shots/raycast-faq-d.jpg`, phone `shots/raycast-faq-m.jpg`.
2. **Linear Startups** ([linear.app/startups](https://linear.app/startups)): title at left, ten questions in
   a right-hand column, tiny chevrons. Phone: the title stacks above the list. Desktop `shots/linear-faq-d.jpg`, phone `shots/linear-faq-m.jpg`.
3. **Neon pricing** ([neon.com/pricing](https://neon.com/pricing)): the first answer is open by default so the
   pattern is visible. A long list on phone, one column. Phone `shots/neon-faq-m.jpg`.
4. **Vercel OSS** ([vercel.com/open-source-program](https://vercel.com/open-source-program)): bordered rows.
   Desktop `shots/vercelOSS-faq-d.jpg`, phone `shots/vercelOSS-faq-m.jpg`.

Take: all four are text only, no card chrome, bold question, chevron, hairline. Raycast is the closest feel for a
page of nine. Open the first answer by default (Neon) so the pattern teaches itself.

**What we'd do:** Raycast layout, centered, nine questions, first one open, answers in the HTML so they can be
found by search and read without JS. Large tap targets (full-width row, at least 56 px tall on phone).

## 7. Final CTA and footer

1. **Linear** ([linear.app](https://linear.app)): "Built for the future. Available today." in large type, two
   buttons (primary light, secondary dark), then a quiet footer of link columns. Phone: headline wraps to two
   lines, buttons stay side by side, footer is two columns of links. Desktop `shots/linear-cta-d.jpg`, phone
   `shots/linear-cta-m.jpg`.
2. **Resend** ([resend.com](https://resend.com)): a serif headline with a metallic gradient, one "Get started"
   button, and the huge wordmark half hidden below as a texture. Desktop `shots/resend-cta-d.jpg`, phone
   `shots/resend-cta-m.jpg`.
   Take: the oversized wordmark as a footer texture is on-brand for us: "VIC" or "Once a VICer, Always a VICer."
3. **Cursor** ([cursor.com](https://cursor.com)): "Try Cursor now." and one button, then footer columns. Desktop
   `shots/cursor-cta-d.jpg`, phone `shots/cursor-cta-m.jpg`. Note the cookie banner sits over the footer on
   phone, a reminder to keep ours out of the CTA zone.

**What we'd do:** one headline, one "Apply" button, the closing line "Once a VICer, Always a VICer." set huge
and half-clipped as the footer texture, then social links in a single row (Instagram, Facebook, TikTok,
YouTube, LinkedIn) and email and address below. Two buttons are not needed: there is one action.

## Summary table

| Section | Lead pick | Phone layout | What we'd do |
|---|---|---|---|
| Numbers | Railway split-flap | label over number, stacked | one band, four big figures, roll once then hold |
| Departments | Webflow "Get involved" cells | one column of cells | 2x2 main cells, lighter row of three for activity |
| Events | Vercel Ship list + portrait | grid of image cards | list left, image panel right, grid on phone |
| Gallery | Next.js Conf photo strip | cropped strip, swipe | one tone, mixed heights, horizontal track |
| Steps | Neon ghost numerals | numeral above sentence | four ghost-numeral steps, one line each |
| FAQ | Raycast Pro | same, wrapping | centered, first open, answers in HTML |
| CTA + footer | Resend wordmark + Linear structure | stacked, one button | one Apply button, huge clipped closing line |

## Not checked

- Live behavior: scroll-triggered counters, hover states and the horizontal strips were seen only as static
  captures. How they are built (CSS, JS, canvas) is not verified.
- Instagram in-app browser and real phone hardware.
- Performance cost of any of these patterns on a mid-range Android phone.
- Licence or reuse: nothing here is to be copied. These are layouts to learn from.
