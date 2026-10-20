# Assets

Every file the page uses, where it comes from, and how it gets to the browser.

## Photos

17 originals in `assets/pics/` (about 50 MB), added by the owner on 2026-10-19, plus the AEC group photo on 2026-10-20. Mostly group photos. Different
sizes, formats and orientations; the pipeline below normalises them.

What each shows is read off the images, not confirmed. The page ships no captions (alt text only), so "Event?"
only guides the alt text. Use per photo as signed in [#14](https://github.com/puIad/vic-enp/issues/14) and
[#15](https://github.com/puIad/vic-enp/issues/15).

| File | Size | Shape | What it shows | Event? | Proposed use |
|---|---|---|---|---|---|
| `IMG_8658.JPG` | 5472×3648 | 3:2 | Large group in front of the ENP building's arches | | Peak photo 1: the points resolve into it |
| `DSCF7405.jpg` | 6240×4160 | 3:2 | Large formal group in a draped hall, suits and dresses | Engineers' Gala | Events, Gala cut |
| `_T2A6297.jpg` | 6160×4640 | 4:3 | Group on a stage with a red backdrop | Ignite Algiers | Events, Ignite cut |
| `IMG_8026.JPG` | 6000×4000 | 3:2 | Crowd around a robot maze on the floor | Polymaze | Events, Polymaze cut |
| `IMG_2757.JPG` | 3456×2304 | 3:2 | Full conference hall seen from the back, speakers on a small stage, the venue's logo on the back wall | A talk or training | Peak photo 3 (pan) |
| `IMG_0645.jpg` | 6000×4000 | 3:2 | Large group outdoors in a forest | A club outing | Peak photo 2 (slit) |
| `IMG_9072.jpg` | 4000×6000 | 2:3 portrait | Night, long lit tables in a courtyard | A Ramadan iftar? | Peak photo 4 (rise), the portrait moment on phones |
| `IMG_9159.jpg` | 6000×4000 | 3:2 | Night selfie, a close group of friends | | Peak photo 5 (lens pull) |
| `IMG_8641.JPG` | 5472×3648 | 3:2 | A student lifting a bottle rocket in front of the ENP building, friends cheering | A rocket competition? | Peak photo 6 (split) |
| `IMG_0257.JPG` | 6000×4000 | 3:2 | Close-up of a small robot in a white maze | Polymaze | Events, Polymaze cut: the second, smaller frame (640 and 1280 only) |
| `IMG_6141.jpg` | 6000×4000 | 3:2 | A hand holding a small robot in front of a laptop with code | SPARK workshop | Departments, SPARK cut: the small frame on the logo formation (640 and 1280 only) |
| `IMG_6171.jpg` | 5472×3072 | 16:9 | Casual group indoors, some holding small robot cars | | Peak stack (tilt) and the still grid |
| `IMG_7517.jpg` | 5472×3072 | 16:9 | Group on steps in a blue room, holding a certificate | | Peak stack (iris) and the still grid |
| `IMG_7544.jpg` | 5472×3072 | 16:9 | Very large group around a long table, holding a banner | | Peak photo 7 (dealt) |
| `IMG_8759.JPG` | 6000×4000 | 3:2 | Large group outdoors in front of a building | | Peak photo 8 (flies in) |
| `IMG_9215-2.JPG` | 6000×4000 | 3:2 | Large group in a hall with logos on the back wall | A partner event? | Peak stack (wipe) and the still grid |
| `IMG_3223.jpg` | 2730×1536 | 16:9 | Large group in a lecture hall cheering, prize cheques held up, the screen reads "Algerian Engineering Competition" | AEC | Events, AEC cut (owner, 2026-10-20) |
| `IMG_8095.HEIC` | ? | ? | Not previewed: HEIC can't be read by the tools here | | Left out (decided 2026-10-19) |

### Pipeline

- Originals stay in `assets/pics/`, git-ignored ([decisions.md](decisions.md), #9).
- One script (`scripts/photos.mjs`, using `sharp`) writes, per photo: AVIF and WebP at 640, 1280 and 1920 px wide
  (2560 for the peak photo), EXIF stripped (no GPS or camera data on the public site), orientation applied, sRGB.
  Output goes to `public/photos/`, which is committed.
- Crops for phones: each photo gets a focal point (x, y in %) in `src/content/photos.ts`, so portrait crops keep the
  faces. Set by eye, per photo, once.
- The point-resolve formation samples the 640 px WebP in the browser; no extra file.
- Targets: 1280 px AVIF under 200 KB, 640 px under 70 KB. The script fails when one is over, or when an original's
  size doesn't match `photos.ts`. Run it with `npm run photos -- <originals dir>` (default `assets/pics`).
- Captions and alt text in the same file. Alt text describes the scene ("Around 80 VIC members in front of
  the ENP building"), not "photo 3".
- `sharp`'s prebuilt binaries don't decode HEIC, hence the JPEG export for `IMG_8095`.

## Brand files

Copied from `VIC-Recruitment-2026` at scaffold time, unchanged:

| From | To | Notes |
|---|---|---|
| `frontend/public/brand/*.svg`, `vic-logo-white.png` | `public/brand/` | Logo files. Never edited. |
| `frontend/src/assets/fonts/Gilroy-*.woff2` | `src/assets/fonts/` | Only once the web licence is settled ([brand.md](brand.md#type-charter-p17-to-20)). |
| `frontend/src/components/brand/*.tsx` | `src/components/brand/` | Charter motifs, if the design uses them. |

The department, event and project logos ([#29](https://github.com/puIad/vic-enp/issues/29), decisions 59 and 60) come
from the owner's `.ai` files in `assets/logos/`, which stay outside git. `pip install pymupdf pillow`, then
`python scripts/logos.py` renders each one
with PyMuPDF into `public/logos/<name>.png`: transparent, 512 px on the long side, colours and proportions unchanged,
trimmed to the artwork. It only leaves whole parts out: the words beside a symbol, and Ignite's "Algiers" and ®.

| File | Artboard | What it is |
|---|---|---|
| `spark.png`, `training.png`, `english-bubble.png`, `aec.png` | SPARK p1, Training p1, English Bubble p1, AEC p2 | The symbol alone, for the logo formations |
| `cpsp.png`, `vic-charity.png`, `masterclass.png`, `vicra.png`, `vic-entertainment.png` | CPSP p1, VIC Charity p1, MasterClass p2, VICra p4 (the crescent, transparent), VIC Entertainment p2 | The symbol beside a name |
| `gala.png`, `ignite.png`, `polymaze.png` | GALA p1 (raster art), Ignite p1, POLYMAZE p3 (the transparent wordmark) | The name artwork, for the logo formations |

`src/world/logo.ts` turns any of them into a formation's places; `LOGO_CUTS` there lists the cuts drawn as their logo.
The beside-name symbols go through `src/components/LogoSymbol.tsx` ([#33](https://github.com/puIad/vic-enp/issues/33)):
a decorative `<img>` in one square about the name's height (`.sym` in `index.css`), named by each project's `logo` in
`content/events.ts` and the ledger row's in `content/clubLife.ts`.

## 3D assets

Procedural, no models: the point field, its formations and the photo resolve are computed in code (formations may
be baked to point clouds under 50 KB each). The depth stack starts from an MIT component
([architecture.md](architecture.md#third-party-code)). Any third-party model, texture or HDRI would need a licence
that allows public use (CC0 preferred) and a row in the ledger below.

## Missing

Needed by the signed acts and not made yet:

| Asset | For | From |
|---|---|---|
| `hero-poster-d.webp`, `hero-poster-m.webp` | Hero tier 0, reduced motion, and the fallback when the world fails ([#11](https://github.com/puIad/vic-enp/issues/11)) | Baked from the real scene by `npm run posters` (slice 3) into `public/posters/`: Rebaked in slice 4 from the icon formation at rest ([ADR 0001](adr/0001-the-icon-formation.md)): 1920x1200 at 29 KB, 585x1266 at 18 KB |
| `close-poster-d.webp`, `close-poster-m.webp` | Close tier 0 and reduced motion ([#17](https://github.com/puIad/vic-enp/issues/17)) | Baked from the real scene in the build |
| Seven outlined department icons | Departments tier 0 cards only ([#13](https://github.com/puIad/vic-enp/issues/13)) | Drawn in the build |
| One ambient sound loop, under 300 KB | The optional sound toggle ([#10](https://github.com/puIad/vic-enp/issues/10)) | To find, with a licence for public use |
| One photo each for CPSP, VIC Charity, MasterClass, VICra (3:2), if the projects cut gets photos | Events cut 5 ([#15](https://github.com/puIad/vic-enp/issues/15)) | The owner |

## Generated assets (agy)

Per the workspace rule, missing raster images are generated with agy, run from the folder they land in, one image
per call, each one read and checked before use. On this page that covers only:

- abstract textures and noise for the 3D world;
- background plates or an environment map;
- the background of the Open Graph share image (the logo and text go on top as real files and type).

Never generated: photos of people or scenes presented as VIC events ([decisions.md](decisions.md), #12), the
logo, or anything that imitates the bulb or iris.

## Asset ledger

Every file in `public/` that isn't code, one row each, filled during the build.

| File | Source | Licence or owner | Used in |
|---|---|---|---|
| `public/brand/*` | VIC charter files via `VIC-Recruitment-2026` | VIC | Header, footer, share image |
| `public/og.png` | Rendered in slice 1 from the page's own tier 0 hero (seeded cloud, white logo, tagline in the page font), 1200×630 | VIC | Share tags (open question 26) |
| `public/apple-touch-icon.png` | `vic-icon-white.svg` on night, 180×180 | VIC | Home-screen icon |
| Outfit (npm `@fontsource-variable/outfit`, bundled) | Google Fonts via Fontsource | SIL OFL 1.1 | Every word, until the Gilroy web licence is settled (open question 11) |
| `public/photos/*` | `assets/pics/` (club photos) | VIC | Peak, events |
