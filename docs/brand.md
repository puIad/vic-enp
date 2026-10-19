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
| Bright Gray | `#EFEFEF` | Light sections (FAQ, how to join), text on dark |

The charter: use only black or white text on the core colours, and keep its pairings (they were approved for
accessibility). In practice: white on blue and on Dark Jungle Green, dark on aquamarine and Bright Gray.

Blue as **text** on a light background uses the dashboard's nudged blue, `oklch(0.54 0.129 242.2)`, which clears
4.5:1 on white; the exact `#127DBB` stays for gradients, light and swatches (the dashboard's Nudge Rule).

### Gradients

The logo gradient runs blue to green (`#127DBB` to `#69C4AF`). The dashboard's charter gradients are reusable as
they are: ring (`#5AB3B1` to `#127DBB`, 90°), cover (`#3997B4` to `#1F84B7`, 180°), strip (`#6FC2AE` to `#1A7FB8`,
0°), brand (`#127DBB` to `#69C4AF`, 135°). Gradients never sit behind running text.

### Activity departments (charter p.16, brief §12)

| Department | Colours |
|---|---|
| SPARK | Orange `#F29A09` to Tangelo `#F24407` |
| Training | Cyan Cobalt Blue `#1A52A2` (darker blue gradient) |
| English Bubble | The VIC gradient, `#127DBB` to `#69C4AF` |
| Also in the charter | Dark Violet `#5700CF`, Medium Purple `#7849A8` |

On this page orange and tangelo are SPARK's identity. The dashboard's rule that orange means "a person is needed"
belongs to the dashboard only.

### Events (charter p.23)

Fixed identities that can't be replaced: Engineers' Gala is **gold** and prestigious (secondary colours allowed,
for example red, white, green), Ignite Algiers is **red**, Hour of Code is **blue**. The charter gives no hex
codes for them; each event has its own event charter (p.22). The exact values come from the latest edition's
event charter or the owner ([open-questions.md](open-questions.md)).

## Type (charter p.17 to 20)

- **Gilroy** for everything. Headings Bold or ExtraBold (Heavy), body Regular or Medium, at most three weights per
  design. Never all caps, never all lowercase.
- **Gotham** is the logo's typeface only. The page never sets text in Gotham.
- Arabic (not needed now, the page is English only): Madani, about 15% larger than Latin; Ubuntu Arabic as the
  alternative.
- English Bubble designs may use Bahnschrift. On this page, only if the English Bubble act wants its own voice.
- The woff2 files exist in `VIC-Recruitment-2026/frontend/src/assets/fonts/` (Light, Regular, Medium, Bold, Heavy).
- **Licence.** Gilroy is a commercial font. The dashboard self-hosts it for a signed-in internal tool; a public
  site needs a web licence. Open question for the owner. If there's no licence, the closest free geometric
  families to test are Outfit, Urbanist and Plus Jakarta Sans (all on Google Fonts, OFL); the page would then
  carry one of them, chosen by setting the headline and body side by side with Gilroy.

Proposed scale for this page (to tune in the build): hero name 64 to 120 px (fluid), act titles 40 to 72 px Heavy,
leads 18 to 22 px Regular, body 16 to 17 px Medium, labels 13 px. Line length 60 to 70 characters for body.

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
  or distort.
- The bulb and the iris can't be extracted and used as graphic elements.

### Logo in a 3D world

What the rules mean here:

- The logo is a flat DOM or SVG element in front of the canvas, never a texture on a 3D object, never extruded,
  never lit, never animated part by part. It can fade or move in as a whole, as long as it ends at full opacity
  (a fade-in is a transition, not an opacity change; if the owner reads the rule more strictly, the logo simply
  appears).
- No 3D form may resemble the bulb, the iris, or the two together. Concept C in
  [experience.md](experience.md#c-light-and-glass) carries this risk and needs a check at the first render.
- The 3D world never passes over the logo (no particles in front of it). Clear space around it stays empty.
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
- El-Maarifa's logo is required on certificates and banners (p.10), not on web pages. Optional in the footer if
  the owner wants the affiliation shown as a logo; otherwise text.
