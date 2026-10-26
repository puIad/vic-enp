# Brand

The VIC IT Charter 2026 (`VIC-Recruitment-2026/assets/IT-Charter-2026.pdf`, cited as "charter p.n") applied to a
3D web page. The dashboard's [DESIGN.md](../../VIC-Recruitment-2026/DESIGN.md) is the same charter on a calm working
surface; this page is the charter at full volume, so some of the dashboard's rules (white working surface,
orange only for alerts) don't carry over. The charter's own rules always do.

## Colour

### Core (charter p.13)

| Name | Hex | Use on this page |
|---|---|---|
| Cyan Cornflower Blue | `#127DBB` | Gradient start, the world's light, swatches |
| Medium Aquamarine | `#69C4AF` | Gradient end, completion, highlights |
| Dark Jungle Green | `#141E27` | The page's night: the background of the 3D world |
| Bright Gray | `#EFEFEF` | The one light act (how to join and the FAQ), body text on night |

The charter: use only black or white text on the core colours, and keep its pairings (they were approved for
accessibility). In practice: white on blue and on Dark Jungle Green, dark on aquamarine and Bright Gray.

### On this page (signed 2026-10-19, [#10](https://github.com/puIad/vic-enp/issues/10))

- **Night everywhere** (`#141E27`) except the light act, which turns Bright Gray through the horizon passage and
  falls back to night the same way.
- **Blue and aquamarine are light, never paint and never running text**: the field, the rail, your point, the Apply ring.
  As small accents they may colour a department's name, a figure's glyph (the "+", "since"), the countdown chip,
  the footer's tile numbers and /apply's eyebrows, each at 4.5:1 or more on night ([decisions.md](decisions.md), 123).
- **Text on night:** white headlines, Bright Gray body, `#A3AFBA` captions (8.1:1). **On Bright Gray:** night
  headlines (14.7:1), body `#3b4954`, links in the nudged blue below.
- **The gradient** (brand, 135°) lives in light and on the Apply pill's ring, and, drifting, in two runs of text only:
  the motto's two "VICer"s, act 2's "600" once counted (143) and the hero's club name, the latter with its blue end lifted
  to 4.5:1 ([decisions.md](decisions.md), 138).
- **Apply pill:** night fill, gradient ring, white Bold label (16.9:1), a round gradient arrow. Focus is a 3 px
  aquamarine ring. This replaced white text on the gradient, which measured 2.1:1 on the aquamarine end.
- **Grain and vignette:** one static SVG noise layer at 7% in overlay blend plus a radial vignette, over the
  canvas and the photos alike. Never animated. Photos are in full colour (the events' with a light blend of their colour, the committee's in
  black and white) ([decisions.md](decisions.md), 124).
- **Accents only inside their own cut:** as the formation's light and one short rule.
- **Browser surfaces:** selection aquamarine on night (night on gray in the light act), thin night scrollbar.

Blue as **text** on a light background uses the dashboard's nudged blue, `oklch(0.54 0.129 242.2)`, which clears
4.5:1 on white; the exact `#127DBB` stays for gradients, light and swatches (the dashboard's Nudge Rule).

### Gradients

The logo gradient runs blue to green (`#127DBB` to `#69C4AF`). The dashboard's charter gradients are reusable as
they are: ring (`#5AB3B1` to `#127DBB`, 90°), cover (`#3997B4` to `#1F84B7`, 180°), strip (`#6FC2AE` to `#1A7FB8`,
0°), brand (`#127DBB` to `#69C4AF`, 135°). Gradients never sit behind running text; the only text they fill is the motto's "VICer"s, act 2's "600" and the
hero's club name ([decisions.md](decisions.md), 138 and 143).

### Activity departments (charter p.16, brief §12)

| Department | Colours |
|---|---|
| SPARK | Orange `#F29A09` to Tangelo `#F24407` |
| Training | Cyan Cobalt Blue `#1A52A2` (darker blue gradient). As additive light on night it is too dark, so the rule runs `#1A52A2` to `#6A9CF0` and the points use `#6A9CF0` ([#13](https://github.com/puIad/vic-enp/issues/13)). Its logo formation keeps the file's violet, lifted to `#7C34DC` to `#B17DF5` ([#31](https://github.com/puIad/vic-enp/issues/31)) |
| English Bubble | The VIC gradient, `#127DBB` to `#69C4AF` |
| Also in the charter | Dark Violet `#5700CF`, Medium Purple `#7849A8` |

On this page orange and tangelo are SPARK's identity. The dashboard's rule that orange means "a person is needed"
belongs to the dashboard only.

### Events (charter p.23)

Fixed identities that can't be replaced: Engineers' Gala is **gold** and prestigious (secondary colours allowed,
for example red, white, green), Ignite Algiers is **red**, Hour of Code is **blue**. The charter gives no hex
codes for them; each event has its own event charter (p.22). The owner set the values for this page on
2026-10-19 ([#15](https://github.com/puIad/vic-enp/issues/15)): Gala gold `#D4A843`, Ignite red `#E0313F`, Hour of
Code blue `#2F80ED` (kept for the charter; Hour of Code is not on the page). Each appears only inside its own cut.

## Type (charter p.17 to 20)

- **Gilroy** for everything, in three weights: **Heavy 900** for every headline, act title, cut line and figure;
  **Bold 700** for controls and labels; **Regular 400** for leads, body and captions. Medium is not used. Sentence
  case throughout, never all caps, never all lowercase.
- **The registration form at `/apply`** keeps the page's font and adds **Cormorant Garamond** (OFL, self-hosted) on
  the letter and the step titles only, at 500 to 700 with its italic ([decisions.md](decisions.md), 86). The landing's
  acts never use it.
- **Gotham** is the logo's typeface only. The page never sets text in Gotham.
- Arabic (not needed now, the page is English only): Madani, about 15% larger than Latin; Ubuntu Arabic as the
  alternative.
- English Bubble designs may use Bahnschrift. On this page, only if the English Bubble act wants its own voice.
- The woff2 files exist in `VIC-Recruitment-2026/frontend/src/assets/fonts/` (Light, Regular, Medium, Bold, Heavy).
- **On the page.** Gilroy, self-hosted from those files ([decisions.md](decisions.md), 134: the owner settled open
  question 11 on 2026-10-24). Outfit stood in until then. Heavy titles on the night carry a slight drop shadow
  (decision 135).

Scale (signed in [#10](https://github.com/puIad/vic-enp/issues/10)):

| Role | Size | Notes |
|---|---|---|
| Display (hero, motto) | 52 to 128 px | line height .92, tracking -3%, capped at 128 |
| Act title | 36 to 72 px | Heavy |
| Cut line (departments, events) | 40 to 104 px | Heavy, one line per cut |
| Figure | 44 to 80 px | Heavy, tabular |
| Lead | 18 to 22 px | Regular, line height 1.45, 34ch |
| Body | 16 to 17 px | Regular, line height 1.6, at most 62ch |
| Control | 15 px | Bold; 19 px on the close's Apply |
| Caption | 13 px | Regular |

## Radius

Every photo on the page has rounded corners (owner, [#9](https://github.com/puIad/vic-enp/issues/9)): **20 px on
desktop, 16 px on phones**, one shared value (`--radius`), one shared photo shader
([#14](https://github.com/puIad/vic-enp/issues/14)). The peak's photo rounds only once it has fully formed from
points.

## The logo

Files: `VIC-Recruitment-2026/frontend/public/brand/` (`vic-logo.svg`, `vic-logo-white.svg`, `vic-logo-on-dark.svg`,
`vic-icon.svg`, `vic-icon-white.svg`, `favicon.svg`, `vic-logo-white.png`). Copied into this repo at scaffold time,
never redrawn.

The charter's rules (p.9 to 12):

- Always use the provided files; never recreate the logo.
- The horizontal logo is primary; the stacked logo is for large scale only.
- Full-colour logo only on white or black backgrounds, or a white or black area of a photo. On Dark Jungle Green,
  use the white or on-dark file.
- Never crop, add shadows or effects, change the typeface, outline, rotate any part, change the opacity, recolour
  or distort. Exception: `/apply`'s wax seals press the icon into wax of the page's accent ([decisions.md](decisions.md), 150).
- The bulb and the iris can't be extracted and used as graphic elements.

### Logo in a 3D world

The charter's 3D rule covers post design, not websites: VIC's IT department, who wrote the charter, said so on
2026-10-20 ([ADR 0001](adr/0001-the-icon-formation.md)). On this page the logo files keep every rule above, and the world may draw the
icon in points:

- The flat logo is a DOM or SVG element from the provided files, in front of the canvas. It can fade or move in as
  a whole, as long as it ends at full opacity: a fade is a transition, not an opacity change. The owner allowed the corner
  logo's 0.35 s fade in and out ([decisions.md](decisions.md), 122).
- The 600 may draw the VIC icon, bulb and iris together, and the iris may stand alone in points. Each is used once:
  the icon formation at the start of the hero, with your point lit in its iris, and the iris slot at the close
  ([experience.md](experience.md)). The extraction rule above still holds for flat graphics.
- Everywhere else the world stays eye-free by choice, so the iris belongs to the start and the end: no other ring
  with a bright centre, no dark disc around a lit point. The cloud the icon loosens into stays tilted and
  three-armed, no passage reads as an iris, and the English Bubble circles (its cut's shape
  until the B's file loads) stay open outlines.
- The 3D world never passes over the logo (no particles in front of it). The fixed logo sits on its own night
  plate (radial, solid at the logo, feathered out) between canvas and logo. Clear space around it stays empty.
- The fixed logo steps away over the light act, since the full-colour logo is only for white or black, and again
  once the footer is in view.
- The divider disc (charter p.4, 8, 23, 33) is the charter's own artwork, not the logo. The dashboard redrew it as
  a motif; it can appear here too, flat.

## Charter motifs available

From `VIC-Recruitment-2026/frontend/src/components/brand/` (React, 2D): the ring-and-slot disc (`RingStage`), the
arches (`ArchStack`), outlined words (`OutlineWord`), the dot grid, the logo component (`VicLogo`). They can be
copied as they are. The dot grid is a natural 2D echo of concept A's points.

## Photos and media (charter p.21)

- Video 1080p at 25 to 30 fps (the charter writes "1920p"; the brief reads it as 1080p). A video carries the
  watermark logo top-left at 50% opacity: this is a charter rule for VIC's videos, so any video used on the page
  keeps its watermark as exported.
- The full-colour logo never goes on a photo except on a white or black area.
- El-Maarifa's logo is required on certificates and banners (p.10), not on web pages. The footer names it as text
  ([#17](https://github.com/puIad/vic-enp/issues/17)).
