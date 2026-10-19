# Assets

Every file the page uses, where it comes from, and how it gets to the browser.

## Photos

17 originals in `assets/pics/` (about 50 MB), added by the owner on 2026-10-19. Mostly group photos. Different
sizes, formats and orientations; the pipeline below normalises them.

What each shows is read off the images, not confirmed. "Event?" is a guess for the owner to confirm before any
caption ships ([content.md](content.md#checks-before-the-copy-is-final)).

| File | Size | Shape | What it shows | Event? | Proposed use |
|---|---|---|---|---|---|
| `IMG_8658.JPG` | 5472×3648 | 3:2 | Large group in front of the ENP building's arches | | The peak: the photo the points resolve into |
| `DSCF7405.jpg` | 6240×4160 | 3:2 | Large formal group in a draped hall, suits and dresses | Engineers' Gala | Photo sequence, Events (Gala) |
| `_T2A6297.jpg` | 6160×4640 | 4:3 | Group on a stage with a red backdrop | Ignite Algiers | Photo sequence, Events (Ignite) |
| `IMG_8026.JPG` | 6000×4000 | 3:2 | Crowd around a robot maze on the floor | Polymaze | Photo sequence, Events (Polymaze) |
| `IMG_2757.JPG` | 3456×2304 | 3:2 | Full conference hall, speaker on stage, VIC ring on the back wall | A talk or training | Photo sequence |
| `IMG_0645.jpg` | 6000×4000 | 3:2 | Large group outdoors in a forest | A club outing | Photo sequence (club life) |
| `IMG_9072.jpg` | 4000×6000 | 2:3 portrait | Night, long lit tables in a courtyard | A Ramadan iftar? | Photo sequence, portrait moment on phones |
| `IMG_9159.jpg` | 6000×4000 | 3:2 | Night selfie, a close group of friends | | Photo sequence (warmth, close-up) |
| `IMG_8641.JPG` | 5472×3648 | 3:2 | A student lifting a trophy in front of the ENP building | A competition win | Photo sequence or SPARK |
| `IMG_0257.JPG` | 6000×4000 | 3:2 | Close-up of a small robot in a white maze | Polymaze | SPARK act |
| `IMG_6141.jpg` | 6000×4000 | 3:2 | A hand holding a small robot in front of a laptop with code | SPARK workshop | SPARK act |
| `IMG_6171.jpg` | 5472×3072 | 16:9 | Casual group indoors | | Closing mosaic |
| `IMG_7517.jpg` | 5472×3072 | 16:9 | Group on steps in a blue room, holding a paper | | Closing mosaic |
| `IMG_7544.jpg` | 5472×3072 | 16:9 | Very large group around a long table, holding a banner | | Closing mosaic |
| `IMG_8759.JPG` | 6000×4000 | 3:2 | Large group outdoors in front of a building | | Closing mosaic |
| `IMG_9215-2.JPG` | 6000×4000 | 3:2 | Large group in a hall with logos on the back wall | A partner event? | Closing mosaic |
| `IMG_8095.HEIC` | ? | ? | Not previewed: HEIC can't be read by the tools here | | Owner exports it as JPEG, or it's dropped |

### Pipeline

- Originals stay in `assets/pics/`, git-ignored ([decisions.md](decisions.md), #9).
- One script (`scripts/photos.mjs`, using `sharp`) writes, per photo: AVIF and WebP at 640, 1280 and 1920 px wide
  (2560 for the peak photo), EXIF stripped (no GPS or camera data on the public site), orientation applied, sRGB.
  Output goes to `public/photos/`, which is committed.
- Crops for phones: each photo gets a focal point (x, y in %) in one data file, so portrait crops keep the faces.
  Set by eye, per photo, once.
- The point-resolve formation samples the 640 px WebP in the browser; no extra file.
- Targets: 1280 px AVIF under 200 KB, 640 px under 70 KB.
- Captions and alt text in the same data file. Alt text describes the scene ("Around 80 VIC members in front of
  the ENP building"), not "photo 3".
- `sharp`'s prebuilt binaries don't decode HEIC, hence the JPEG export for `IMG_8095`.

## Brand files

Copied from `VIC-Recruitment-2026` at scaffold time, unchanged:

| From | To | Notes |
|---|---|---|
| `frontend/public/brand/*.svg`, `vic-logo-white.png` | `public/brand/` | Logo files. Never edited. |
| `frontend/src/assets/fonts/Gilroy-*.woff2` | `src/assets/fonts/` | Only once the web licence is settled ([brand.md](brand.md#type-charter-p17-to-20)). |
| `frontend/src/components/brand/*.tsx` | `src/components/brand/` | Charter motifs, if the design uses them. |

## 3D assets

Depends on the concept ([experience.md](experience.md#the-3d-world-three-concepts)):

- **A. Network of 600:** procedural. No models. A small sprite or a shader for the point, formations computed
  in code, the photo formation sampled from a photo.
- **B. Glass maze:** a modelled maze and robot (Blender, exported as glTF), compressed with meshopt or Draco,
  textures as KTX2, total under 1.5 MB. Original models only.
- **C. Light and glass:** procedural geometry plus one environment map (HDR or a generated equirectangular PNG).

Any third-party model, texture or HDRI needs a licence that allows public use (CC0 preferred, for example Poly
Haven) and a line in the ledger below.

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
| `public/photos/*` | `assets/pics/` (club photos) | VIC | Photo sequence, departments, events |
